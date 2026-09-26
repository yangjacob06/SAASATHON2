/* Preloaded, fictional submission examples. No files are sent to a lender. */
(function(global){
  'use strict';
  const definitions=[
    {id:'northstar',scenario:'demo-northstar-civil',stage:'sent_to_lender',lender:'CP-HARBOUR-CREDIT',next:'Confirm the property valuation',note:'Example report shared for initial discussion; valuation remains outstanding.'},
    {id:'harbour',scenario:'demo-harbour-pine-foods',stage:'more_information_needed',lender:'CP-KAURI-PRIVATE-CREDIT',next:'Provide the inventory schedule',note:'Example follow-up recorded: the inventory schedule is still needed. Amount and security gaps remain visible.'},
    {id:'ridge',scenario:'demo-ridgeway-equipment',stage:'sent_to_lender',lender:'CP-HARBOUR-CREDIT',next:'Follow up on the equipment request',note:'Example report shared for discussion; current appetite and terms still need checking.'}
  ];
  function build(){return definitions.map(sample=>{
    const deal=global.MandateSyntheticData.getDeal(sample.scenario),R=global.MandateReview;
    deal.id=sample.id;deal.updatedAt=deal.createdAt;deal.sampleSubmission={...sample,simulated:true};
    deal.workflow={stage:sample.stage,activity:[{title:'Sample submission recorded',detail:sample.note,createdAt:deal.createdAt}]};
    // These values already exist in the original fixtures. Do not invent earlier years.
    const revenue=deal.financials.annualRevenue,ebitda=deal.financials.ebitda;
    deal.pitchHistory=[{companyId:sample.scenario,end:revenue.periodEnd,revenue:revenue.amount,ebitda:ebitda.amount,grossProfit:null,netProfit:null,operatingCash:null,interest:null,assets:null,liabilities:null,equity:null,source:'Bundled FY2025 management accounts'}];
    deal.documents.forEach(doc=>doc.extractedFields.forEach(f=>{if(f.field.startsWith('financials.'))f.periodEnd=doc.periodEnd;}));
    deal.review.fields=Object.fromEntries(R.fields.map(([path])=>[path,{status:'confirmed',value:R.read(deal,path),sourceIds:deal.documents.filter(d=>d.extractedFields.some(f=>f.field===path&&JSON.stringify(f.value)===JSON.stringify(R.read(deal,path)))).map(d=>d.id)}]));
    deal.pitchHistoryReviewed=JSON.stringify(deal.pitchHistory);
    global.MandateSourceReview?.ensureCandidates(deal);
    R.approve(deal,global.MandateDealAnalysis.analyzeDeal(deal,[]).summary.text);
    deal.pitchConfirmation.confirmedAt=deal.createdAt;
    return deal;
  });}
  global.MandateWorkspaceSamples={build};
})(window);
