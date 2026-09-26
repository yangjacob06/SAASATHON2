export const money=n=>n==null?'Not supplied':new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',currencyDisplay:'code',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
export const date=(v,time=false)=>v?new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',...(time?{timeStyle:'short'}:{}),timeZone:'Pacific/Auckland'}).format(new Date(v)):'—';
export const asDate=v=>v?new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v)):'';
// Convert 09:00 Auckland wall time using the date-specific offset (NZST/NZDT).
export const iso=v=>{if(!v)return null;let t=Date.parse(v+'T09:00:00Z');for(let i=0;i<2;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const displayed=Date.parse(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute+':'+p.second+'Z');t+=Date.parse(v+'T09:00:00Z')-displayed;}return new Date(t).toISOString();};

export function eventDetail(event){
 const m=event.metadata||{},fixture=m.fixture_text||'';
 if(m.decline_reason)return m.decline_reason.replaceAll('_',' ').toLowerCase();
 if(event.event_type==='FOLLOW_UP_SET'){
  const value=m.next??fixture.match(/^next_follow_up_at=(.+)$/)?.[1];
  return (value?'Follow-up scheduled for '+date(value):'Follow-up cleared')+(m.note?' · '+m.note:'');
 }
 if(event.event_type==='CONTACT_DATE_CHANGED')return m.next?'Last contact set to '+date(m.next):'Last-contact date cleared; earlier contact history retained';
 if(event.event_type==='NOTE_ADDED')return 'Saved in broker notes';
 return m.note||m.title||fixture;
}
