import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerReportPDF} from '../server/report-pdf.js';

const report=(audience='shareable')=>({audience,snapshot:{deal_name:'Kowhai & Sons - fictional',profile_version:4,analysis_date:'2026-09-26T09:00:00Z',disclaimer:'Synthetic example only.',profile:{company:{name:'Kowhai & Sons',industry:'Construction',location:'Waikato'},funding:{amount:1250000,currency:'NZD',purpose:'Working capital',termMonths:36}},result:{provider_name:'Aotearoa Credit',mandate_id:'MANDATE-2',score:null,checks:[{field:'whole transaction amount',value:1250000,requirement:{min:100000,max:2000000},outcome:'matches'},{field:'purpose',value:['working_capital'],requirement:['working_capital'],outcome:'matches'}],mandate_snapshot:{data:{source:'Synthetic mandate test'}},reasons:[]},allocations:[{facility_name:'Working capital revolver',amount_cents:125000000}],terms:[],history:audience==='internal'?{matched:8,contacted:6,interested:4,declined:2,terms:1,closed:1,interest_rate:2/3,interest_numerator:4,decline_rate:1/3,decline_numerator:2,median_days:1.7,response_sample:3,industries:{Manufacturing:{matched:6,contacted:5,interested:4,declined:1,terms:1,closed:0}},bands:{'NZ$1m-5m':{contacted:4}},reasons:{LEVERAGE_TOO_HIGH:2}}:undefined}});

test('shareable provider PDF is a valid paginated PDF with readable evidence and no internal history',()=>{
 const bytes=providerReportPDF(report('shareable')),pdf=bytes.toString('ascii');
 assert.ok(pdf.startsWith('%PDF-1.4'));assert.match(pdf,/xref\n/);assert.ok(pdf.endsWith('%%EOF\n'));
 assert.match(pdf,/Aotearoa Credit/);assert.match(pdf,/NZD 1,250,000/);assert.match(pdf,/Synthetic mandate test/);
 assert.doesNotMatch(pdf,/Internal brokerage report|Manufacturing: 6|LEVERAGE_TOO_HIGH/);
});
test('internal PDF identifies brokerage history and preserves sample sizes',()=>{
 const pdf=providerReportPDF(report('internal')).toString('ascii');
 assert.match(pdf,/Internal brokerage report/);assert.match(pdf,/Interest rate 67%/);assert.match(pdf,/Decline rate 33%/);assert.match(pdf,/1\.7 days/);assert.match(pdf,/3 supported intervals/);assert.match(pdf,/Historical results by industry/);assert.match(pdf,/Manufacturing/);assert.match(pdf,/LEVERAGE TOO HIGH/);assert.match(pdf,/Declines\) Tj ET[\s\S]*?\(2\) Tj ET/);
});
test('multi-page history tables repeat their column headings',()=>{
 const data=report('internal');data.snapshot.history.industries=Object.fromEntries(Array.from({length:35},(_,i)=>['Industry '+i,{matched:2,contacted:1,interested:1,declined:0}]));
 const pdf=providerReportPDF(data).toString('ascii');
 assert.ok([...pdf.matchAll(/\(Industry\) Tj ET/g)].length>=2,'continued history table repeats its column headings on the next page');
});
test('long report content paginates and changes show as ASCII hyphens',()=>{
 const data=report();data.snapshot.result.checks=Array.from({length:90},(_,i)=>({field:'criterion '+i,value:'A long manufacturing explanation with an unverified condition which the adviser must confirm before sharing terms',requirement:'Dated source and transaction evidence',outcome:'needs_check'}));
 const pdf=providerReportPDF(data).toString('ascii');
 assert.match(pdf,/\/Count (?:[2-9]|[1-9][0-9]+)/);assert.match(pdf,/Page 1 of /);assert.doesNotMatch(pdf,/[\u2010-\u2015\u2212]/);
});
