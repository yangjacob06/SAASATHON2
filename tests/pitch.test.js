import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../MODEL/prototype/',import.meta.url);
const context=vm.createContext({window:{},Blob,Intl,console});
for(const file of ['deal-analysis.js','pitch-data.js','pitch-analysis.js','pitch-review.js','pitch-report.js'])vm.runInContext(readFileSync(new URL(file,root),'utf8'),context);
const P=context.window.MandatePitch;
const R=context.window.MandateReview;
const historyText=readFileSync(new URL('synthetic-data/pitch/southern-financial-history.csv',root),'utf8');
function deal(){return {id:'test-southern',updatedAt:'2026-09-27T00:00:00Z',company:{name:'Southern Manufacturing Demo Ltd',industry:'Manufacturing',location:'Christchurch'},funding:{amount:8000000,currency:'NZD',termMonths:36,purpose:'Acquisition of an industrial components competitor',security:['GSA','plant and equipment']},financials:{annualRevenue:{amount:33000000,periodEnd:'2026-03-31'},ebitda:{amount:4300000,periodEnd:'2026-03-31'}},documents:[],review:{conflicts:[]}};}
test('Tyler mandate boundaries and missing leverage remain explicit',()=>{
  const d=deal(),a=P.analyze(d);assert.equal(a.lenders.length,5);assert.ok(a.lenders.every(l=>l.aligned===6&&l.checks.at(-1).outcome==='check'));
  d.funding.amount=9000000;assert.equal(P.analyze(d).lenders.find(l=>l.id==='CP-KAURI-PRIVATE-CREDIT').checks[0].outcome,'gap');
  d.funding.amount=null;assert.ok(P.analyze(d).lenders.every(l=>l.checks[0].outcome==='check'));
});
test('history preserves annual source values and rejects cross-company, duplicate and malformed figures',()=>{
  const d=deal();d.pitchHistory=P.parseHistory(historyText,d);assert.equal(d.pitchHistory.length,3);assert.equal(d.pitchHistory[2].revenue,33000000);assert.equal(d.pitchHistory[2].ebitda,4300000);
  assert.throws(()=>P.parseHistory(historyText.replace('CO-SOUTHERN-001','CO-KOWHAI-001'),d),/different company/);
  assert.throws(()=>P.parseHistory(historyText.replace('2026-03-31','2025-03-31'),d),/unique/);
  assert.throws(()=>P.parseHistory(historyText.replace('33000000','invalid'),d),/valid revenue/);
  d.company.name='Different borrower';assert.equal(P.analyze(d).history.length,0);
});
test('conflicts withhold numbers and stale edited summaries do not enter the report',()=>{
  const d=deal();d.review.conflicts=[{field:'financials.annualRevenue',message:'Revenue discrepancy'}];
  let a=P.analyze(d);assert.equal(a.revenue,null);assert.equal(a.margin,null);assert.ok(!a.summary.includes('33,000,000'));
  context.window.MandateActiveDealId='test-southern';context.window.MandateSummaryReviewRecords={'test-southern':{basedOnUpdatedAt:'old',status:'reviewed',text:'Outdated summary'}};
  a=P.analyze(d);assert.equal(a.reviewed,false);assert.notEqual(a.summary,'Outdated summary');
});
test('PDF builds valid xref offsets, current figures, charts and all five lender sections',async()=>{
  const d=deal();d.pitchHistory=P.parseHistory(historyText,d);const blob=context.window.MandatePitchPDF(P.analyze(d)),bytes=Buffer.from(await blob.arrayBuffer()),pdf=bytes.toString('ascii');
  assert.ok(pdf.startsWith('%PDF-1.4'));assert.match(pdf,/33,000,000/);assert.match(pdf,/4,300,000/);assert.match(pdf,/Revenue trajectory/);assert.match(pdf,/FY2026/);
  for(const l of P.analyze(d).lenders)assert.ok(pdf.includes(l.name));
  const start=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(start,start+4),'xref');
  const offsets=pdf.slice(start).split('\n').filter(l=>/^\d{10} 00000 n/.test(l)).map(l=>Number(l.slice(0,10)));offsets.forEach((offset,i)=>assert.ok(pdf.slice(offset).startsWith((i+1)+' 0 obj')));
  mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});writeFileSync(new URL('../test-results/pitch-report.pdf',import.meta.url),bytes);
});
test('review groups repeated identical sources and keeps competing values visible',()=>{
  const d=deal();d.documents=[{id:'a',name:'accounts.csv',extractedFields:[{field:'financials.annualRevenue',value:33000000}]},{id:'b',name:'accountant.csv',extractedFields:[{field:'financials.annualRevenue',value:32000000}]},{id:'c',name:'copy.csv',extractedFields:[{field:'financials.annualRevenue',value:33000000}]}];
  const row=R.rows(d).find(r=>r.path==='financials.annualRevenue');assert.equal(row.groups.length,2);assert.equal(row.groups[0].sources.length,2);assert.equal(row.different,true);assert.equal(row.confirmed,false);
});
test('every field and history must be reviewed; mutations invalidate final confirmation',()=>{
  const d=deal();d.pitchHistory=P.parseHistory(historyText,d);assert.throws(()=>R.approve(d,'Reviewed summary'),/Review every field/);
  d.review.fields=Object.fromEntries(R.fields.map(([field])=>[field,{status:'confirmed',value:R.read(d,field),sourceIds:[]}]));
  assert.equal(R.progress(d).complete,false);d.pitchHistoryReviewed=JSON.stringify(d.pitchHistory);assert.equal(R.progress(d).complete,true);
  R.approve(d,'Reviewed summary');assert.equal(R.isFinal(d),true);d.funding.amount=9000000;assert.equal(R.isFinal(d),false);
  d.funding.amount=8000000;assert.equal(R.isFinal(d),true);d.documents.push({id:'new',name:'extra.csv'});assert.equal(R.isFinal(d),false);
});
test('single-lender export contains only the intended profile, plus cash flow and profit',async()=>{
  const d=deal();d.pitchHistory=P.parseHistory(historyText,d);const a=P.analyze(d),l=a.lenders[0];assert.equal(l.fit,86);assert.equal(d.pitchHistory[0].netProfit,1670000);assert.equal(d.pitchHistory[0].operatingCash,2400000);assert.equal(d.pitchHistory[0].assets,null);
  const pdf=context.window.MandatePitchPDF({...a,lenders:[l],recipient:l.name});const bytes=Buffer.from(await pdf.arrayBuffer()),text=bytes.toString('ascii');assert.match(text,/Prepared for ABC Private Credit/);assert.match(text,/Operating cash flow/);assert.match(text,/Net profit after tax/);assert.match(text,/86% criteria fit/);assert.ok(!text.includes('Harbour Credit'));assert.ok(!text.includes('Kauri Private Credit'));
  writeFileSync(new URL('../test-results/lender-review.pdf',import.meta.url),bytes);
});
