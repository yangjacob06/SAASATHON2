import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { cents, norm } from './domain.js';
const window={MandateParserOnly:true};
const context=vm.createContext({window,Intl,Date,Map,Set,console});
for(const file of ['synthetic-data.js','deal-analysis.js','document-upload-ui.js'])vm.runInContext(readFileSync(new URL('../MODEL/prototype/'+file,import.meta.url),'utf8'),context);
export const legacyAnalysis=(profile)=>JSON.parse(JSON.stringify(window.MandateDealAnalysis.analyzeDeal(profile,window.MandateSyntheticData.getLenders())));
export const legacyFixtures=()=>JSON.parse(JSON.stringify(window.MandateSyntheticData.deals));
export function extractCSV(text) {
  return JSON.parse(JSON.stringify(window.MandateCSV.parseCsv(text).map((r,i)=>{if(!r.value?.trim())return null;const fact=window.MandateCSV.convertRow(r);return fact?{...fact,row:i+2}:null;}).filter(Boolean)));
}
export function attachCSV(profile,filename,facts){window.MandateCSV.addUploadedDocument(profile,filename,facts);return profile.documents.at(-1);}
const aliases={'business acquisition':'acquisition','equipment purchase':'capex','asset purchase':'capex','plant and equipment':'equipment','equipment being financed':'equipment','growth capital':'growth_capital','working capital':'working_capital','seasonal working capital':'working_capital'};
export const category=v=>aliases[norm(v)]||norm(v).replaceAll(' ','_');
export function compare(profile,provider,facility=null,mode='whole') {
  const m=provider.mandate.data, f=facility||profile.funding, checks=[];
  const add=(field,value,requirement,ok)=>checks.push({field,value:value??null,requirement:requirement??null,outcome:ok===null?'needs_check':ok?'matches':'outside_criteria'});
  const range=(field,value,min,max)=>{if(min==null&&max==null)return;add(field,value,{min,max},value==null?null:(min==null||value>=min)&&(max==null||value<=max));};
  const list=(field,value,allowed)=>{if(!allowed?.length)return;const values=Array.isArray(value)?value:[value];add(field,value,allowed,!values.filter(Boolean).length?null:values.filter(Boolean).every(v=>allowed.map(category).includes(category(v))));};
  list('currency',f.currency||profile.funding.currency,[m.currency||'NZD']);
  list('industry',profile.company?.industry,m.sectors);
  list('country',profile.company?.country,m.countries);
  list('region',profile.company?.region,m.regions);
  const closing=f.requiredDate||profile.funding.desiredCloseDate;
  if(m.deploymentDeadline)add('deployment deadline',closing,m.deploymentDeadline,closing?new Date(closing)<=new Date(m.deploymentDeadline):null);
  if(m.availableFrom)add('availability date',closing,m.availableFrom,closing?new Date(closing)>=new Date(m.availableFrom):null);
  if(m.validUntil)add('mandate validity',new Date().toISOString(),m.validUntil,new Date()<new Date(m.validUntil));
  if(m.appetite==='paused'||m.appetite==='closed')add('lending appetite',m.appetite,'Open to approaches',false);
  if(m.excludedSectors?.length)add('excluded sector',profile.company?.industry,m.excludedSectors,profile.company?.industry? !m.excludedSectors.map(category).includes(category(profile.company.industry)):null);
  list('purpose',f.purposes||profile.funding.purposes,m.purposes);
  list('facility type',f.type,m.facilityTypes);
  if(m.security?.length){const values=f.security||profile.funding.security;add('security',values,m.security,values?.length?values.some(v=>m.security.map(category).includes(category(v))):null);}
  range('term months',f.termMonths,m.minTerm,m.maxTerm);
  range('EBITDA',profile.financials?.ebitda?.amount,m.minEbitda,null);
  if(m.maxLeverage!=null){const compatible=profile.ratios?.leverageType&&profile.ratios.leverageType===m.leverageType;add('leverage',profile.ratios?.leverage,{max:m.maxLeverage,basis:m.leverageType||'Unspecified'},compatible&&profile.ratios.leverage!=null?profile.ratios.leverage<=m.maxLeverage:null);}
  range('whole transaction amount',facilities(profile).reduce((n,f)=>n+(f.amount||0),0),m.transactionMin,m.transactionMax);
  if(m.amountScope==='facility')range('facility amount',f.amount,m.minDeal,m.maxDeal);
  if(mode==='whole'){
    range('single lender allocation',f.amount,m.participationMin,m.participationMax);
    range('provider total limit',facilities(profile).reduce((n,f)=>n+(f.amount||0),0),null,m.providerLimit);
    const capacityAge=m.capacityAsAt?Date.now()-new Date(m.capacityAsAt):null;
    add('available capital',f.amount,{amount:m.availableCapital??null,asAt:m.capacityAsAt??null},m.availableCapital==null||capacityAge==null||capacityAge<0||capacityAge>90*86400000?null:f.amount<=m.availableCapital);
    if(!m.amountScope||m.amountScope==='unknown')add('amount scope',f.amount,'Confirm whether range applies to facility or participation',null);
  }
  const failed=checks.filter(c=>c.outcome==='outside_criteria').length,unknown=checks.filter(c=>c.outcome==='needs_check').length;
  return {provider_id:provider.id,provider_name:provider.name,mandate_id:provider.mandate.id,mandate_snapshot:provider.mandate,score:null,score_scale:null,score_source:'deterministic criteria, no numeric score',outcome:failed?'outside_criteria':unknown?'needs_check':'matches',failed,unknown,checks,engine_version:'mandate-criteria-v1',mode};
}
export function compareAll(profile,providers){return providers.map(p=>compare(profile,p)).sort((a,b)=>a.failed-b.failed||a.unknown-b.unknown||a.provider_name.localeCompare(b.provider_name));}
export function facilities(profile) {return profile.facilities?.length?profile.facilities:[{id:'main',name:'Requested facility',...profile.funding,type:profile.funding.type||'term_loan'}];}
