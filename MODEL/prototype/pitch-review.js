/* Review and final-confirmation state, independent of the presentation. */
(function(global){
  'use strict';
  const fields=[['company.name','Company name'],['company.industry','Industry'],['company.location','Location'],['funding.amount','Funding requested'],['funding.purpose','Funding purpose'],['funding.termMonths','Term'],['funding.security','Security'],['financials.annualRevenue','Annual revenue'],['financials.ebitda','EBITDA']];
  const read=(d,path)=>{const v=path.split('.').reduce((o,k)=>o?.[k],d);return v&&typeof v==='object'&&!Array.isArray(v)?v.amount:v;};
  const present=v=>v!=null&&v!==''&&(!Array.isArray(v)||v.length>0);
  const key=v=>JSON.stringify(Array.isArray(v)?v.map(x=>String(x).toLowerCase().trim()).sort():typeof v==='string'?v.toLowerCase().trim():v??null);
  function rows(deal){return fields.map(([path,label])=>{
    const current=read(deal,path),groups=[];
    for(const doc of deal.documents||[])for(const fact of doc.extractedFields||[]){if(fact.field!==path)continue;let group=groups.find(g=>key(g.value)===key(fact.value)&&g.period===(fact.periodEnd||null));if(!group){group={value:fact.value,period:fact.periodEnd||null,sources:[]};groups.push(group);}group.sources.push({id:doc.id,name:doc.name});}
    const conflict=(deal.review?.conflicts||[]).some(c=>c.field===path),record=deal.review?.fields?.[path];
    const required=['company.name','funding.amount','funding.purpose'].includes(path);
    const confirmed=!conflict&&record?.status==='confirmed'&&key(record.value)===key(current)&&(!required||present(current));
    const same=groups.length===1&&key(groups[0].value)===key(current);
    return {path,label,current,groups,confirmed,same,conflict,required,different:groups.some(g=>key(g.value)!==key(current))};
  });}
  function signature(deal){return JSON.stringify({company:deal.company,funding:deal.funding,financials:deal.financials,documents:deal.documents,review:deal.review,history:deal.pitchHistory});}
  function progress(deal){const items=rows(deal),pending=items.filter(r=>!r.confirmed);const historyNeeded=!!deal.pitchHistory?.length&&deal.pitchHistoryReviewed!==JSON.stringify(deal.pitchHistory);return {items,pending,historyNeeded,complete:!pending.length&&!historyNeeded,confirmed:items.length-pending.length,total:items.length+(deal.pitchHistory?.length?1:0)};}
  function finalSignature(deal){return signature(deal)+'|'+(deal.pitchSummary?.text||'')+'|'+(deal.pitchHistoryReviewed||'');}
  function isFinal(deal){return !!deal?.pitchConfirmation&&progress(deal).complete&&deal.pitchConfirmation.signature===finalSignature(deal);}
  function approve(deal,text){if(!progress(deal).complete)throw Error('Review every field and the financial history first.');if(!text.trim())throw Error('Add the summary before confirming.');deal.pitchSummary={text:text.trim(),basedOn:signature(deal)};deal.pitchConfirmation={signature:finalSignature(deal),confirmedAt:new Date().toISOString()};}
  global.MandateReview={fields,read,present,rows,progress,signature,isFinal,approve};
})(window);
