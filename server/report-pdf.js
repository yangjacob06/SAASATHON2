const PAGE_WIDTH=595,PAGE_HEIGHT=842,LEFT=48,RIGHT=547,TOP=58,BOTTOM=62,INK='0.13 0.22 0.17',MUTED='0.36 0.42 0.38',GREEN='0.18 0.34 0.25',PALE='0.93 0.95 0.92';
const clean=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ').replace(/\s+/g,' ').trim().slice(0,4000);
const escape=value=>clean(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const label=value=>String(value??'').replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
const currency=n=>n==null?'Not supplied':`NZD ${new Intl.NumberFormat('en-NZ',{maximumFractionDigits:2}).format(n)}`;
const date=value=>value?new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeZone:'Pacific/Auckland'}).format(new Date(value)):'Not supplied';
const shown=value=>Array.isArray(value)?value.map(String).join(', '):value&&typeof value==='object'?Object.entries(value).map(([k,v])=>`${label(k)} ${v==null?'not supplied':k==='amount'?currency(v):v}`).join(' · '):value==null?'Not supplied':String(value);
const fitValue=(value,field)=>{if(value==null)return 'Unknown';if(/amount|capital|ebitda/i.test(field)&&typeof value==='number')return currency(value);if(Array.isArray(value))return value.map(String).join(', ');if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${label(k)} ${v==null?'not supplied':/amount|capital|ebitda/i.test(field)&&/^(amount|min|max|minimum|maximum)$/.test(k)?currency(v):/date|asAt/i.test(k)?date(v):v}`).join(' | ');return String(value);};
function wrap(value,limit){const words=clean(value).split(' '),lines=[];let line='';for(const word of words){if(line&&line.length+1+word.length>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.length?lines:[''];}
function opText(text,x,y,size,font='F1',color=INK){return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${(PAGE_HEIGHT-y).toFixed(2)} Tm (${escape(text)}) Tj ET\n`;}
function opRule(x1,y1,x2,y2,color='0.84 0.87 0.83',width=0.7){return `${color} RG ${width} w ${x1} ${(PAGE_HEIGHT-y1).toFixed(2)} m ${x2} ${(PAGE_HEIGHT-y2).toFixed(2)} l S\n`;}
function opRect(x,y,w,h,color){return `q ${color} rg ${x} ${(PAGE_HEIGHT-y-h).toFixed(2)} ${w} ${h.toFixed(2)} re f Q\n`;}
function buildPDF(report){
 const snapshot=report.snapshot,result=snapshot.result,profile=snapshot.profile;
 if(!snapshot||!result||!profile)throw new Error('The saved report is incomplete.');
 const pages=[{ops:[],y:TOP}],contentWidth=RIGHT-LEFT;
 let page=pages[0];
 const startPage=()=>{page={ops:[],y:TOP};pages.push(page);};
 const ensure=height=>{if(page.y+height>PAGE_HEIGHT-BOTTOM)startPage();};
 const write=(text,{size=9,font='F1',color=INK,gap=5,x=LEFT,width=contentWidth,limit=null}={})=>{
  const lines=limit?wrap(text,limit):wrap(text,Math.max(20,Math.floor(width/(size*0.53))));
  for(const line of lines){ensure(size+gap+1);page.ops.push(opText(line,x,page.y+size,size,font,color));page.y+=size+gap;}
 };
 const heading=text=>{ensure(35);page.y+=11;write(text,{size:14,font:'F2',color:GREEN,gap:6});};
 const table=(headers,rows,widths)=>{
  const rowOps=(cells,header=false,shade=false)=>{
   const fontSize=header?8:8.5,lines=cells.map((c,i)=>wrap(c,Math.max(9,Math.floor((widths[i]-12)/(fontSize*0.52))))),count=Math.max(...lines.map(a=>a.length)),height=Math.max(27,count*(fontSize+2)+12);
   if(page.y+height+2>PAGE_HEIGHT-BOTTOM){startPage();if(!header)rowOps(headers,true,false);}
   const y=page.y;if(header||shade)page.ops.push(opRect(LEFT,y,contentWidth,height,header?PALE:'0.98 0.985 0.975'));
   for(let i=0,x=LEFT;i<cells.length;i++){
    lines[i].forEach((line,j)=>page.ops.push(opText(line,x+6,y+fontSize+7+j*(fontSize+2),fontSize,header?'F2':'F1',header?GREEN:INK)));
    x+=widths[i];
   }
   page.ops.push(opRule(LEFT,y+height,RIGHT,y+height));page.y=y+height;
  };
  rowOps(headers,true);rows.forEach((row,i)=>rowOps(row,false,i%2===1));page.y+=8;
 };

 page.ops.push(opText('Mandate.',LEFT,36,20,'F2',GREEN),opText('PROVIDER EXPLANATION',RIGHT-145,34,8,'F2',MUTED),opRule(LEFT,TOP-12,RIGHT,TOP-12,GREEN,1.2));
 write(snapshot.deal_name,{size:17,font:'F2',color:INK,gap:5});write(`${result.provider_name} | ${report.audience==='internal'?'Internal brokerage report':'Shareable report'}`,{size:11,font:'F2',color:GREEN,gap:7});
 write(snapshot.disclaimer,{size:8,color:MUTED,gap:4});write('A criteria comparison is not a credit decision, offer or lender commitment.',{size:8,color:MUTED,gap:12});
 heading('Analysis record');
 table(['Borrower and request','Saved analysis'],[
  [profile.company?.name||'Borrower not supplied',currency(profile.funding?.amount)],
  [`${profile.company?.industry||'Industry not supplied'} | ${profile.company?.location||'Location not supplied'}`,`${label(profile.funding?.purpose)||'Purpose not supplied'} | ${profile.funding?.termMonths??'Term not supplied'} months`],
  [`Profile version ${snapshot.profile_version} | analysed ${date(snapshot.analysis_date)}`,`Mandate ${result.mandate_id||'not recorded'} | ${result.score==null?'No score supplied':`${result.score} / ${result.score_scale||'recorded scale'}`}`],
 ],[contentWidth*0.53,contentWidth*0.47]);
 if(snapshot.stale_at_creation)write('This report was created after a newer profile or mandate version existed. Its saved evidence remains unchanged.',{size:8,color:'0.52 0.32 0.06',gap:8});

 heading('Why the provider fits or needs review');
 const checks=(result.checks||[]).map(c=>[label(c.field),fitValue(c.value,c.field),fitValue(c.requirement,c.field),label(c.outcome)]);
 if(checks.length)table(['Criterion','Deal value','Mandate evidence','Finding'],checks,[94,118,211,76]);
 else write((result.reasons||[]).join('; ')||'Detailed criteria were not recorded with this historical result.',{size:9,gap:6});
 const mandate=result.mandate_snapshot?.data||{};
 write(`Evidence: ${mandate.source||'the saved provider-mandate snapshot'}. The values above describe recorded criteria at analysis time.`,{size:8,color:MUTED,gap:4});

 heading('Funding proposal and received terms');
 if(snapshot.allocations?.length)table(['Facility','Proposed amount','Role / appointment'],snapshot.allocations.map(a=>[a.facility_name,currency(a.amount_cents/100),snapshot.roles||'Requires confirmation']),[190,135,174]);
 else write('No preferred allocation was saved for this lender.',{size:9,gap:5});
 if(snapshot.terms?.length){for(const t of snapshot.terms){write(`${label(t.state)} terms | ${currency(Number(t.amount_cents)/100)} | source: ${t.data?.source||'not recorded'} | expiry: ${date(t.expires_at)}`,{size:9,font:'F2',gap:4});for(const [k,v]of Object.entries(t.data||{}))if(k!=='source'&&v!=null&&typeof v!=='object')write(`${label(k)}: ${v}`,{size:8,color:MUTED,gap:3});}}
 else write('No transaction-specific terms have been recorded. Mandate preferences are not quoted borrower pricing.',{size:9,gap:5});

 if(snapshot.history&&report.audience==='internal'){
  const h=snapshot.history;heading('Brokerage history | prior deals');
  table(['Milestone','Deals','Outcome and sample'],[
   ['Matched',String(h.matched),'Recorded lender/deal relationships'],
   ['Contacted',String(h.contacted),'Explicit recorded contacts'],
   ['Interested',String(h.interested),h.interest_rate==null?'No contact sample':`Interest rate ${Math.round(h.interest_rate*100)}% (${h.interest_numerator}/${h.contacted} contacted)`],
   ['Declined',String(h.declined),h.decline_rate==null?'No contact sample':`Decline rate ${Math.round(h.decline_rate*100)}% (${h.decline_numerator}/${h.contacted} contacted)`],
   ['Terms received',String(h.terms),'Recorded terms events'],
   ['Closed',String(h.closed),'Recorded provider/deal closures'],
   ['Median first response',h.median_days==null?'Not enough data':`${h.median_days.toFixed(1)} days`,`${h.response_sample} supported intervals`],
  ],[122,55,322]);
  const reasons=Object.entries(h.reasons||{});
  if(reasons.length){heading('Common decline reasons');table(['Recorded reason','Declines'],reasons.map(([k,v])=>[label(k),String(v)]),[390,109]);}
  const industries=Object.entries(h.industries||{}),bands=Object.entries(h.bands||{});
  if(industries.length){heading('Historical results by industry');table(['Industry','Matched','Contacted','Interested','Declined'],industries.map(([k,v])=>[k,String(v.matched??0),String(v.contacted??0),String(v.interested??0),String(v.declined??0)]),[188,72,79,82,78]);}
  if(bands.length){heading('Historical results by deal size');table(['Deal size band','Matched','Contacted','Interested','Declined'],bands.map(([k,v])=>[k,String(v.matched??0),String(v.contacted??0),String(v.interested??0),String(v.declined??0)]),[188,72,79,82,78]);}
  write('History is calculated from this brokerage\'s stored prior-deal events; the current deal is excluded. Counts are distinct lender/deal relationships.',{size:8,color:MUTED,gap:5});
 }
 heading('Suggested next steps');
 for(const item of ['Resolve outstanding source and mandate questions.','Confirm current lender capacity, security priority and any consents.','Check borrower authority before sharing confidential information.','Request and compare transaction-specific terms, conditions and expiry.'])write(`- ${item}`,{size:9,gap:4});
 pages.forEach((p,i)=>{p.ops.push(opRule(LEFT,PAGE_HEIGHT-BOTTOM+8,RIGHT,PAGE_HEIGHT-BOTTOM+8),opText('FICTIONAL DATA | NOT AN OFFER OR COMMITMENT',LEFT,PAGE_HEIGHT-34,7,'F1',MUTED),opText(`Page ${i+1} of ${pages.length}`,RIGHT-62,PAGE_HEIGHT-34,7,'F1',MUTED));});

 const objects=[],add=value=>(objects.push(value),objects.length),pagesRef=add(null),regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'),pageRefs=[];
 for(const p of pages){const stream=p.ops.join(''),streamRef=add(`<< /Length ${Buffer.byteLength(stream,'ascii')} >>\nstream\n${stream}endstream`),pageRef=add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${streamRef} 0 R >>`);pageRefs.push(pageRef);}
 objects[pagesRef-1]=`<< /Type /Pages /Kids [${pageRefs.map(n=>`${n} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
 const catalog=add(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
 let output='%PDF-1.4\n% Mandate report\n',offsets=[0];
 objects.forEach((object,i)=>{offsets.push(Buffer.byteLength(output,'ascii'));output+=`${i+1} 0 obj\n${object}\nendobj\n`;});
 const xref=Buffer.byteLength(output,'ascii');output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('');
 output+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return Buffer.from(output,'ascii');
}
export function providerReportPDF(report){return buildPDF(report);}
