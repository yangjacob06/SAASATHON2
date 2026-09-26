import { cents, fail } from './domain.js';
import { compare, facilities } from './analysis.js';

// Integer-cent max flow. Lower allocation bounds are removed before this step.
function flow(nodes,arcs,source,sink){
  const graph=Array.from({length:nodes},()=>[]);
  const add=(u,v,cap,key)=>{const a={to:v,cap,initial:cap,reverse:graph[v].length,key};const b={to:u,cap:0,initial:0,reverse:graph[u].length};graph[u].push(a);graph[v].push(b);return a;};
  const refs=arcs.map(a=>add(...a));let total=0;
  while(true){const prev=Array(nodes).fill(null),q=[source];prev[source]=true;
    for(let i=0;i<q.length&&!prev[sink];i++){const u=q[i];for(let k=0;k<graph[u].length;k++){const e=graph[u][k];if(e.cap>0&&!prev[e.to]){prev[e.to]=[u,k];q.push(e.to);}}}
    if(!prev[sink])break;let amount=Number.MAX_SAFE_INTEGER;
    for(let v=sink;v!==source;){const[u,k]=prev[v];amount=Math.min(amount,graph[u][k].cap);v=u;}
    for(let v=sink;v!==source;){const[u,k]=prev[v],e=graph[u][k];e.cap-=amount;graph[v][e.reverse].cap+=amount;v=u;}total+=amount;
  }
  return {total,refs};
}
export function searchPackages(profile,providers,{excluded=[],pinned=[],locks={},maxSearch=65536,now=new Date()}={}){
  const fs=facilities(profile),requested=cents(profile.funding.amount),cashBasis=profile.funding.targetBasis==='cash_at_close';
  const target=fs.reduce((n,f)=>n+(cents(f.amount)||0),0);
  if(!target||fs.some(f=>!cents(f.amount)))fail('Complete the requested amount and facility amounts first.');
  if(!cashBasis&&target!==requested)fail('Facility amounts must add up to the requested amount.');
  if(fs.some(f=>f.drawAtClose!=null&&cents(f.drawAtClose)>cents(f.amount)))fail('Cash drawable at closing cannot exceed a facility limit.');
  if(cashBasis&&fs.every(f=>f.drawAtClose!=null)&&fs.reduce((n,f)=>n+cents(f.drawAtClose),0)-(cents(profile.funding.refinancePayoffs)||0)-(cents(profile.funding.closingFees)||0)!==requested)fail('Cash drawable less debt payoffs and fees must equal the requested net closing cash.');
  if(cashBasis&&fs.some(f=>f.drawAtClose==null))fail('Enter each facility’s cash available at closing before searching for closing cash.');
  const edges=[],exclusions=[];
  const poolCaps=new Map(),providerCaps=new Map();
  for(const p of providers){
    const m=p.mandate.data;
    if(excluded.includes(p.id)||['DECLINED','WITHDRAWN'].includes(p.status)){exclusions.push({provider:p.name,reason:'Excluded, declined or withdrawn'});continue;}
    if(m.participationMax==null){exclusions.push({provider:p.name,reason:'Participation limit is not supplied'});continue;}
    if(m.validUntil&&new Date(m.validUntil)<=now){exclusions.push({provider:p.name,reason:'Participation information has expired'});continue;}
    const fresh=m.capacityAsAt&&now-new Date(m.capacityAsAt)>=0&&now-new Date(m.capacityAsAt)<=90*86400000;
    let cap=cents(m.providerLimit??m.participationMax);
    if(m.availableCapital!=null&&fresh)cap=Math.min(cap,cents(m.availableCapital));
    const pool=m.poolId||p.id; const poolCap=m.poolLimit!=null?cents(m.poolLimit):cap;
    poolCaps.set(pool,Math.min(poolCaps.get(pool)??poolCap,poolCap));providerCaps.set(p.id,cap);
    for(const f of fs){
      if(p.participationIssues?.[f.id]){exclusions.push({provider:p.name,facility:f.name,reason:p.participationIssues[f.id]});continue;}
      const result=compare(profile,p,f,'participation');
      if(result.failed){exclusions.push({provider:p.name,facility:f.name,reason:result.checks.filter(x=>x.outcome==='outside_criteria').map(x=>x.field).join(', ')});continue;}
      const warnings=result.checks.filter(x=>x.outcome==='needs_check').map(x=>`${p.name}: confirm ${x.field}`);
      if(m.participationMin==null)warnings.push(`${p.name}: confirm minimum participation`);
      if(m.availableCapital==null||!fresh)warnings.push(`${p.name}: available capital ${m.availableCapital==null?'unknown':'stale'}; verify before approach`);
      const key=p.id+':'+f.id,locked=locks[key];let min=Math.max(1,cents(m.participationMin)??1),max=Math.min(cents(m.participationMax),cap,cents(f.amount));
      if(locked!=null){const n=cents(locked);if(n<min||n>max)fail('Locked allocation is outside the participation limits.'); min=max=n;}
      if(max<min)continue;
      edges.push({key,p,f,min,max,pool,warnings});
    }
  }
  for(const key of Object.keys(locks))if(!edges.some(e=>e.key===key))fail('A locked allocation is not an eligible provider/facility.');
  const candidates=[],seen=new Set();let searched=0,bestPartial=0,partialAllocations=[],truncated=false;
  const selected=[];
  function assess(){
    if(++searched>maxSearch){truncated=true;return;}
    const providerIds=[...new Set(selected.map(e=>e.p.id))];
    if(providerIds.length>1&&selected.some(e=>e.p.mandate.data.exclusive===true))return;
    if(pinned.some(p=>!providerIds.includes(p))||Object.keys(locks).some(k=>!selected.some(e=>e.key===k)))return;
    const warnings=new Set(selected.flatMap(e=>e.warnings));
    for(const f of fs){const group=selected.filter(e=>e.f.id===f.id);
      if(group.length>1){
        if(group.some(e=>e.p.mandate.data.coLend===false||e.p.mandate.data.exclusive===true))return;
        if(group.some(e=>e.p.mandate.data.coLend!==true))warnings.add('Co-lending willingness needs confirmation');
        const security=new Set(group.map(e=>e.p.mandate.data.securityGroup).filter(Boolean));
        if(security.size>1)return;
        if(group.some(e=>!e.p.mandate.data.securityGroup))warnings.add('Shared security and priority require review');
        if(!group.some(e=>e.p.mandate.data.canLead))warnings.add('Appoint and confirm a lead arranger');
        if(!profile.funding.rolesConfirmed)warnings.add('Confirm arranger, agent and security-trustee appointments');
      }
    }
    if(fs.length>1&&!profile.funding.crossFacilitySecurityConfirmed)warnings.add('Confirm priority and collateral sharing between facilities');
    const need=new Map(fs.map(f=>[f.id,cents(f.amount)])),pc=new Map(providerCaps),gc=new Map(poolCaps);
    for(const e of selected){need.set(e.f.id,need.get(e.f.id)-e.min);pc.set(e.p.id,pc.get(e.p.id)-e.min);gc.set(e.pool,gc.get(e.pool)-e.min);}
    if([...need.values(),...pc.values(),...gc.values()].some(v=>v<0))return;
    const names=['source',...Array.from(gc.keys(),x=>'g:'+x),...Array.from(pc.keys(),x=>'p:'+x),...fs.map(f=>'f:'+f.id),'sink'];const at=x=>names.indexOf(x),arcs=[];
    for(const [g,cap]of gc)arcs.push([0,at('g:'+g),cap]);
    for(const p of providerIds){const e=selected.find(e=>e.p.id===p);arcs.push([at('g:'+e.pool),at('p:'+p),pc.get(p)]);}
    const offset=arcs.length;
    for(const e of selected)arcs.push([at('p:'+e.p.id),at('f:'+e.f.id),e.max-e.min,e.key]);
    for(const [f,n]of need)arcs.push([at('f:'+f),names.length-1,n]);
    const result=flow(names.length,arcs,0,names.length-1);
    const allocations=selected.map((e,i)=>({provider_id:e.p.id,provider_name:e.p.name,mandate_id:e.p.mandate.id,facility_id:e.f.id,facility_name:e.f.name,amount_cents:e.min+result.refs[offset+i].initial-result.refs[offset+i].cap,participation_min:e.min,participation_max:e.max}));
    const covered=allocations.reduce((n,a)=>n+a.amount_cents,0);
    if(covered>bestPartial){bestPartial=covered;partialAllocations=allocations;}
    if(covered!==target)return;
    const key=allocations.map(a=>a.provider_id+':'+a.facility_id+':'+a.amount_cents).sort().join('|');if(seen.has(key))return;seen.add(key);
    candidates.push({allocations,total_cents:covered,provider_count:providerIds.length,warnings:[...warnings],status:warnings.size?'exploratory':'criteria_supported',funding_committed:false,explanation:providerIds.length===1?'One provider covers the proposed facility limits.':'Allocations cover the request within documented participation limits. Provider commitments remain separate.'});
  }
  function visit(i){if(truncated)return;if(i===edges.length){assess();return;}visit(i+1);selected.push(edges[i]);visit(i+1);selected.pop();}
  // Bounding the edge set is explicit; never silently claim a whole-market optimum.
  if(edges.length>22){truncated=true;}else visit(0);
  candidates.sort((a,b)=>a.warnings.length-b.warnings.length||a.provider_count-b.provider_count||JSON.stringify(a.allocations).localeCompare(JSON.stringify(b.allocations)));
  const alternatives=[];for(const c of candidates){if(alternatives.length===0||!alternatives.some(a=>a.provider_count===c.provider_count))alternatives.push(c);if(alternatives.length>=3)break;}
  for(const c of candidates){if(alternatives.length>=3)break;if(!alternatives.includes(c))alternatives.push(c);}
  return {target_cents:target,requested_cash_cents:cashBasis?requested:null,target_basis:profile.funding.targetBasis||'facility_limits',alternatives,shortfall_cents:target-bestPartial,partial_allocations:partialAllocations,exclusions,searched,exhaustive:!truncated,search_limit:maxSearch,candidate_edges:edges.length,message:truncated?'Search limit reached; absence of a package does not prove none exists.':alternatives.length?'Proposed allocations only. No funds have been committed.':'No exact package satisfies the recorded constraints.'};
}
