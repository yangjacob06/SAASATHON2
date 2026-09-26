import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../MODEL/prototype/',import.meta.url);
function setup(){const context=vm.createContext({window:{},Blob,Intl,console});for(const f of ['synthetic-data.js','deal-analysis.js','pitch-data.js','pitch-analysis.js','pitch-review.js','pitch-ui.js','assets/brand/brand-pdf.js','pitch-report.js','workspace-samples.js'])vm.runInContext(readFileSync(new URL(f,root),'utf8'),context);return context.window;}
test('preloaded submission examples preserve original figures and contain only recorded annual data',()=>{
  const w=setup(),records=w.MandateWorkspaceSamples.build();assert.equal(records.length,3);
  assert.deepEqual(Array.from(records,d=>d.funding.amount),[2400000,850000,1200000]);
  assert.deepEqual(Array.from(records,d=>d.financials.annualRevenue.amount),[5200000,3100000,4600000]);
  for(const d of records){assert.equal(w.MandateReview.isFinal(d),true);const a=w.MandatePitch.analyze(d);assert.equal(a.history.length,1);assert.equal(a.history[0].end,'2025-03-31');assert.equal(a.history[0].operatingCash,null);assert.ok(d.documents.some(x=>x.status==='missing'));assert.equal(d.sampleSubmission.simulated,true);assert.equal(a.lenders.length,5);}
});
test('fixture rebuild restores reviews and source documents without preserving session edits',()=>{
  const w=setup(),first=w.MandateWorkspaceSamples.build();first[0].company.name='Changed';first[0].workflow.activity.push({title:'Private note'});assert.equal(w.MandateReview.isFinal(first[0]),false);
  const restored=w.MandateWorkspaceSamples.build();assert.equal(restored[0].company.name,'Northstar Civil Ltd');assert.equal(restored[0].workflow.activity.length,1);assert.equal(w.MandateReview.isFinal(restored[0]),true);
});
test('HTML and PDF reports identify bundled sources and keep missing records distinct',async()=>{
  const w=setup();for(const d of w.MandateWorkspaceSamples.build()){
    const all=w.MandatePitch.analyze(d),data={...all,lenders:[all.lenders[0]],recipient:all.lenders[0].name};
    const html=w.MandatePitchViews.report(data);assert.match(html,/bundled synthetic sample/);assert.match(html,/Only FY2025/);assert.doesNotMatch(html,/read locally from uploaded CSV/);
    const bytes=Buffer.from(await w.MandatePitchPDF(data).arrayBuffer());if(d.id==='northstar')writeFileSync(new URL('../test-results/workspace-branded-report.pdf',import.meta.url),bytes);const pdf=bytes.toString('ascii');assert.match(pdf,/Bundled synthetic sample/);assert.match(pdf,/FY2025 only/);assert.ok(pdf.includes(data.recipient));assert.ok(!pdf.includes(all.lenders[1].name));
  }
});
test('renaming an existing sample never reuses another borrower financial history',()=>{
  const w=setup(),d=w.MandateWorkspaceSamples.build()[0];d.company.name='Other company';assert.equal(w.MandatePitch.analyze(d).history.length,0);assert.equal(w.MandateReview.isFinal(d),false);
});

test('legacy HTML shell escapes adviser-entered company names and activity text',()=>{
  const source=readFileSync(new URL('app.js',root),'utf8').split('const siteView=')[0];const ctx=vm.createContext({});vm.runInContext(source,ctx);assert.equal(ctx.htmlText('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');assert.equal(ctx.displayDeal({name:'A & B',docs:['<b>accounts</b>']}).docs[0],'&lt;b&gt;accounts&lt;/b&gt;');
});
