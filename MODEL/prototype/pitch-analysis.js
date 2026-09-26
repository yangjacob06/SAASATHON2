/* Local pitch calculations. All figures and mandates are fictional. */
(function (global) {
  'use strict';
  const money = value => Number.isFinite(value) ? 'NZ$' + new Intl.NumberFormat('en-NZ', {maximumFractionDigits:0}).format(value) : 'Not supplied';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = value => (value || '').split(';').filter(Boolean);
  const normal = value => String(value || '').toLowerCase().trim();
  function value(deal, path) {
    if ((deal.review?.conflicts || []).some(c => c.field === path)) return null;
    const item = path.split('.').reduce((a,k) => a?.[k],deal);
    return item && typeof item === 'object' && !Array.isArray(item) ? item.amount : item;
  }
  function compare(deal, lender) {
    const m = lender.mandate, checks = [];
    function add(label, field, criterion, pass) {
      const v = value(deal, field), known = v != null && v !== '' && (!Array.isArray(v) || v.length);
      checks.push({label,criterion,dealValue:known ? (Array.isArray(v) ? v.join(', ') : typeof v === 'number' && field !== 'funding.termMonths' ? money(v) : String(v)) : 'Missing or conflicting',outcome:!known ? 'check' : pass(v) ? 'align' : 'gap'});
    }
    add('Requested amount','funding.amount',money(+m.min_deal_size)+' – '+money(+m.max_deal_size),v=>v>=+m.min_deal_size && v<=+m.max_deal_size);
    add('Term','funding.termMonths',m.min_term_months+'–'+m.max_term_months+' months',v=>v>=+m.min_term_months && v<=+m.max_term_months);
    add('Industry','company.industry',list(m.sectors).join(', '),v=>list(m.sectors).some(x=>normal(x)===normal(v)));
    add('Purpose','funding.purpose',list(m.financing_purposes).join(', '),v=>list(m.financing_purposes).some(x=>normal(v).includes(normal(x))));
    add('Security','funding.security',list(m.accepted_security).join(', '),v=>v.some(s=>list(m.accepted_security).some(x=>normal(x)===normal(s))));
    add('Minimum EBITDA','financials.ebitda',money(+m.min_ebitda),v=>v>=+m.min_ebitda);
    checks.push({label:'Maximum leverage',criterion:m.max_leverage+'× (basis to verify)',dealValue:'Confirm debt, target EBITDA and repayment assumptions',outcome:'check'});
    const aligned=checks.filter(c=>c.outcome==='align').length;
    return {...lender,checks,aligned,fit:Math.round(aligned/checks.length*100),gaps:checks.filter(c=>c.outcome==='gap').length};
  }
  // RFC-style quoted CSV cells; history import rejects malformed, mixed and duplicate periods.
  function csv(text) {
    const rows=[]; let row=[],cell='',quoted=false;
    text=text.replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++) {const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
    if(quoted)throw Error('A CSV quoted value is incomplete.');
    if(cell||row.length){row.push(cell);rows.push(row);}
    const headers=rows.shift()||[];
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
  }
  function parseHistory(text,deal) {
    const company = normal(deal.company.name), ids={'southern manufacturing demo ltd':'CO-SOUTHERN-001','kowhai contracting ltd':'CO-KOWHAI-001'};
    if(!ids[company]) throw Error('This history pack belongs to Southern Manufacturing or Kowhai. Use the matching company name.');
    const rows=csv(text), seen=new Set();
    if(!rows.length||rows.length>12)throw Error('Use a history CSV with 1–12 annual periods.');
    return rows.map(r=>{
      if(r.company_id!==ids[company])throw Error('The financial history belongs to a different company. Upload the matching company pack.');
      if(r.period_type!=='historical_actual'||r.currency!=='NZD')throw Error('Use annual historical actuals in NZD. Forecasts and YTD need separate analysis.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(r.period_end)||!Number.isFinite(Date.parse(r.period_end))||seen.has(r.period_end))throw Error('Each historical period needs one valid, unique end date.');
      seen.add(r.period_end);
      if(r.revenue.trim()===''||r.ebitda.trim()===''||!Number.isFinite(+r.revenue)||!Number.isFinite(+r.ebitda)||+r.revenue<0)throw Error('Each period needs valid revenue and EBITDA numbers.');
      const optional={grossProfit:'gross_profit',netProfit:'net_profit_after_tax',operatingCash:'cash_flow_from_operations',interest:'interest_expense',assets:'total_assets',liabilities:'total_liabilities',equity:'shareholders_equity'};
      const extra=Object.fromEntries(Object.entries(optional).map(([name,column])=>{const raw=(r[column]||'').trim();if(raw!==''&&!Number.isFinite(+raw))throw Error('Invalid '+column+' in financial history.');return [name,raw===''?null:+raw];}));
      return {companyId:r.company_id,end:r.period_end,revenue:+r.revenue,ebitda:+r.ebitda,...extra,source:r.source_document||r.period_id};
    }).sort((a,b)=>a.end.localeCompare(b.end));
  }
  function analyze(deal) {
    const summary=global.MandateDealAnalysis.analyzeDeal(deal,[]).summary;
    const revenue=value(deal,'financials.annualRevenue'),ebitda=value(deal,'financials.ebitda');
    const expectedId={'southern manufacturing demo ltd':'CO-SOUTHERN-001','kowhai contracting ltd':'CO-KOWHAI-001','northstar civil ltd':'demo-northstar-civil','harbour & pine foods ltd':'demo-harbour-pine-foods','ridgeway equipment ltd':'demo-ridgeway-equipment'}[normal(value(deal,'company.name'))];
    const history=(deal.pitchHistory||[]).filter(p=>p.companyId===expectedId);
    const warnings=[...summary.reviewItems];
    if((deal.pitchHistory||[]).length&&!history.length)warnings.push('Financial history belongs to a different company; charts are withheld.');
    const latest=history.at(-1);
    if(latest&&((revenue!=null&&latest.revenue!==revenue)||(ebitda!=null&&latest.ebitda!==ebitda)))warnings.push('The latest historical period differs from the headline figures. Check their reporting periods and basis.');
    const financialSources=(deal.documents||[]).flatMap(d=>(d.extractedFields||[]).filter(f=>f.field.startsWith('financials.')).map(f=>({field:f.field,value:f.value,period:f.periodEnd,file:d.name,status:deal.review?.fields?.[f.field]?.sourceIds?.includes(d.id)?'Chosen source':f.value===value(deal,f.field)?'Consistent with chosen value':'Not selected'})));
    const record=global.MandateSummaryReviewRecords?.[global.MandateActiveDealId];
    const fresh=record&&record.basedOnUpdatedAt===deal.updatedAt;
    const final=global.MandateReview?.isFinal(deal)||false;
    const chosen=deal.pitchSummary?.basedOn===global.MandateReview?.signature(deal)?deal.pitchSummary.text:null;
    const acquisition=/acqui/i.test(value(deal,'funding.purpose')||'');const informationRequests=['Confirm existing debt, use of funds and repayment source.',acquisition?'Obtain acquisition target accounts, valuations and a forecast supporting debt service.':'Obtain current valuations and a forecast supporting debt service.','Verify security priority, covenants, fees and current lender appetite.'];
    return {deal,informationRequests,summary:chosen||textSummary(record,fresh,summary),reviewed:final,warnings,history,revenue,ebitda,margin:revenue>0&&ebitda!=null?ebitda/revenue*100:null,lenders:global.MandatePitchLenders.map(l=>compare(deal,l)),financialSources,generatedAt:new Date().toISOString(),amount:value(deal,'funding.amount')};
  }
  function textSummary(record,fresh,summary){return fresh?record.text:summary.text;}
  global.MandatePitch={money,escape,value,csv,parseHistory,analyze};
})(window);
