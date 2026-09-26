import { randomUUID } from 'node:crypto';
export const id=()=>randomUUID();
export const STATUSES=['NOT_CONTACTED','CONTACTED','WAITING','INTERESTED','TERMS_RECEIVED','DECLINED','CLOSED','WITHDRAWN'];
export const DECLINES=['DEAL_TOO_SMALL','DEAL_TOO_LARGE','WRONG_SECTOR','LEVERAGE_TOO_HIGH','RETURN_TOO_LOW','SECURITY_UNSUITABLE','TERM_UNSUITABLE','NO_CAPITAL_AVAILABLE','TIMING','OTHER'];
export function fail(message,status=422){throw Object.assign(new Error(message),{status});}
export function cents(value) {
  if(value===null || value===undefined || value==='') return null;
  const s=String(value); if(!/^\d+(\.\d{1,2})?$/.test(s)) fail('Enter a non-negative amount with at most two decimal places.');
  const [whole,fraction='']=s.split('.'); const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(n)||n>1e14) fail('Amount exceeds the supported range.'); return n;
}
export const norm=v=>String(v||'').trim().toLowerCase();
export const equivalent=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function readField(p,field){return field.split('.').reduce((v,k)=>v?.[k],p);}
export function writeField(p,field,value){const keys=field.split('.'); let node=p; for(const k of keys.slice(0,-1)) node=node[k] ||= {}; node[keys.at(-1)]=value;}
export function activeRecords(records,now=new Date()) {
  const superseded=new Set(records.map(r=>r.supersedes_id).filter(Boolean));
  return records.filter(r=>!superseded.has(r.id)&&r.state!=='withdrawn'&&(!r.expires_at||new Date(r.expires_at)>now));
}
// Current transaction evidence takes precedence over catalogue capacity.
// A current commitment replaces an earlier indication/term for this check;
// received funding is never treated as authority for a further advance.
export function participationIssues(records,matches,now=new Date()) {
  const revised=new Set(records.map(r=>r.supersedes_id).filter(Boolean)),groups=new Map();
  for(const r of records.filter(r=>r.kind!=='funding'&&!revised.has(r.id)).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))){
    const key=r.deal_match_id+':'+r.facility_id;
    if(!groups.has(key))groups.set(key,{});
    groups.get(key)[r.kind]=r;
  }
  const issues=[];
  for(const group of groups.values()){
    const r=group.commitment||group.terms||group.indication;
    const reason=r.state==='withdrawn'?'Transaction participation was withdrawn':r.expires_at&&new Date(r.expires_at)<=now?'Transaction participation evidence has expired':null;
    const match=matches.find(m=>m.id===r.deal_match_id);
    if(reason&&match)issues.push({provider_id:match.provider_id,facility_id:r.facility_id,record_id:r.id,reason});
  }
  return issues;
}
export function coverage(records) {
  const out={indication:0,commitment:0,funding:0,conditional:0};
  for(const r of activeRecords(records)) {const amount=Number(r.amount_cents); if(r.kind==='commitment'&&r.state==='conditional')out.conditional+=amount; else if(r.kind in out)out[r.kind]+=amount;}
  return out;
}
export function history(matches,events,deals,excludeDealId) {
  matches=matches.filter(m=>m.deal_id!==excludeDealId); const ids=new Set(matches.map(m=>m.id));
  events=events.filter(e=>ids.has(e.deal_match_id));
  const totals={matched:matches.length,contacted:0,interested:0,declined:0,terms:0,closed:0};
  const industries={},bands={},reasons={},durations=[]; let interestedContacted=0,declinedContacted=0;
  for(const m of matches) {
    const es=events.filter(e=>e.deal_match_id===m.id).sort((a,b)=>new Date(a.occurred_at||a.created_at)-new Date(b.occurred_at||b.created_at));
    const states=new Set(es.map(e=>e.new_status));
    const contact=es.find(e=>e.event_type==='PROVIDER_CONTACTED'||e.new_status==='CONTACTED');
    const counts={matched:1,contacted:!!contact,interested:states.has('INTERESTED'),declined:states.has('DECLINED'),terms:states.has('TERMS_RECEIVED'),closed:states.has('CLOSED')};
    for(const key of Object.keys(totals).slice(1))totals[key]+=Number(counts[key]);
    if(contact){interestedContacted+=Number(counts.interested);declinedContacted+=Number(counts.declined); const start=new Date(contact.occurred_at||contact.created_at); const end=es.find(e=>['INTERESTED','DECLINED'].includes(e.new_status)&&new Date(e.occurred_at||e.created_at)>=start); if(end)durations.push((new Date(end.occurred_at||end.created_at)-start)/86400000);}
    const d=deals.find(d=>d.id===m.deal_id), snapshot=m.history_profile||d?.profile||{};
    const industry=snapshot.company?.industry||'Unknown';const amount=snapshot.funding?.amount;
    const band=snapshot.funding?.currency!=='NZD'||amount==null?'Unknown':amount<1e6?'Under NZ$1m':amount<5e6?'NZ$1m–5m':amount<1e7?'NZ$5m–10m':'NZ$10m+';
    for(const [group,key] of [[industries,industry],[bands,band]]){group[key] ||= {matched:0,contacted:0,interested:0,declined:0,terms:0,closed:0}; for(const k in counts)group[key][k]+=Number(counts[k]);}
    for(const reason of new Set(es.filter(e=>e.new_status==='DECLINED').map(e=>e.metadata?.decline_reason).filter(Boolean)))reasons[reason]=(reasons[reason]||0)+1;
  }
  durations.sort((a,b)=>a-b);const mid=Math.floor(durations.length/2);
  const recent=events.filter(e=>!['PROVIDER_MATCHED','MATCHES_SAVED'].includes(e.event_type)).sort((a,b)=>new Date(b.occurred_at||b.created_at)-new Date(a.occurred_at||a.created_at))[0];
  return {...totals,interest_rate:totals.contacted?interestedContacted/totals.contacted:null,decline_rate:totals.contacted?declinedContacted/totals.contacted:null,interest_numerator:interestedContacted,decline_numerator:declinedContacted,industries,bands,reasons,median_days:durations.length?(durations[mid]+durations[(durations.length-1)>>1])/2:null,response_sample:durations.length,recent:recent||null};
}
