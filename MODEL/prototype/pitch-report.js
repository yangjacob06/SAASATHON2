/* Dependency-free vector PDF download for the local synthetic demo. */
(function(global){
  'use strict';
  global.MandatePitchPDF=function(data){
    const P=global.MandatePitch, money=P.money;
    const pages=[];let ops=[],y=76;
    const ascii=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/×/g,'x').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7e\n]/g,' ');
    const esc=s=>ascii(s).replace(/([\\()])/g,'\\$1');
    const text=(s,x,top,size=11,bold=false,color='0.1412 0.2863 0.2784')=>ops.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${842-top} Tm (${esc(s)}) Tj ET`);
    const line=(x1,y1,x2,y2)=>ops.push(`0.808 0.863 0.843 RG 0.6 w ${x1} ${842-y1} m ${x2} ${842-y2} l S`);
    const rect=(x,top,w,h,color)=>ops.push(`${color} rg ${x} ${842-top-h} ${w} ${h} re f`);
    function finish(){text('Synthetic demo | Adviser review required | No lender contacted',44,803,8);text(String(pages.length+1),540,803,8);pages.push(ops.join('\n'));ops=[];}
    function page(){if(ops.length)finish();y=78;if(global.MandateBrandPDF){ops.push(global.MandateBrandPDF);}else{text('Mandate',44,40,22,true);}text('BROKER INFORMATION MEMORANDUM',298,38,9);line(44,53,551,53);}
    function room(h){if(y+h>768)page();}
    function paragraph(s,{size=11,bold=false,width=88,color}={}){
      const words=ascii(s).split(/\s+/).flatMap(w=>w.length>width?w.match(new RegExp('.{1,'+width+'}','g')):[w]);let current='';
      for(const word of words){if((current+' '+word).trim().length>width){room(size*1.55);text(current,44,y,size,bold,color);y+=size*1.55;current=word;}else current=(current+' '+word).trim();}
      if(current){room(size*1.55);text(current,44,y,size,bold,color);y+=size*1.55;}y+=7;
    }
    function heading(s){room(55);y+=13;paragraph(s,{size:16,bold:true,width:55});}
    function chart(key,title){
      room(220);text(title,44,y,14,true);y+=18;
      const periods=data.history.filter(p=>Number.isFinite(p[key]));
      if(!periods.length){paragraph('No annual figures supplied for this chart.');return;}
      const max=Math.max(1,...periods.map(p=>p[key])),min=Math.min(0,...periods.map(p=>p[key])),span=max-min;
      const top=y+18,plotHeight=110,base=top+max/span*plotHeight,step=450/periods.length;
      line(70,base,540,base);text('NZD millions',44,y,9);
      periods.forEach((p,i)=>{const x=80+i*step,h=Math.max(.5,Math.abs(p[key])/span*plotHeight);rect(x,p[key]>=0?base-h:base,Math.min(52,step-15),h,key==='revenue'?'0.306 0.486 0.467':'0.639 0.541 0.243');text((p[key]/1e6).toFixed(2),x,p[key]>=0?base-h-7:base-7,10,true);text('FY'+p.end.slice(0,4),x,top+plotHeight+18,10);});y=top+plotHeight+43;
    }
    page();
    paragraph(P.value(data.deal,'company.name')||'Company name needs review',{size:23,bold:true,width:37});
    if(data.recipient)paragraph('Prepared for '+data.recipient,{size:15,bold:true,width:55});
    paragraph((data.deal.sampleSubmission?'Preloaded sample review':data.reviewed?'Summary reviewed':'Draft for adviser review')+' | Synthetic pitch demo | '+new Date(data.generatedAt).toLocaleDateString('en-NZ'),{size:10});
    heading('Funding at a glance');
    paragraph('Request: '+money(data.amount)+' | Term: '+(P.value(data.deal,'funding.termMonths')||'Not confirmed')+' months');
    paragraph('Revenue: '+money(data.revenue)+' | EBITDA: '+money(data.ebitda));
    paragraph('EBITDA margin: '+(data.margin==null?'Not available':data.margin.toFixed(1)+'%')+' (EBITDA / revenue)');
    heading('Executive summary');paragraph(data.summary);
    heading('Funding request');paragraph(P.value(data.deal,'funding.purpose')||'Purpose needs review');
    paragraph('Proposed security: '+((P.value(data.deal,'funding.security')||[]).join(', ')||'Not confirmed'));
    paragraph('Standalone borrower earnings are shown. Acquisition target financials and combined pro forma earnings are excluded.',{size:10});
    page();heading('Financial performance');chart('revenue','Revenue trajectory');chart('ebitda','Operating earnings');
    if(data.history.some(p=>p.operatingCash!=null)||data.history.some(p=>p.netProfit!=null)){page();heading('Cash flow and profitability');if(data.history.some(p=>p.operatingCash!=null))chart('operatingCash','Operating cash flow');if(data.history.some(p=>p.netProfit!=null))chart('netProfit','Net profit after tax');}
    heading('Annual financial figures');
    for(const p of data.history)paragraph('Year ended '+p.end+': revenue '+money(p.revenue)+'; EBITDA '+money(p.ebitda)+'; margin '+(p.revenue>0?(p.ebitda/p.revenue*100).toFixed(1)+'%':'not available'),{size:10});
    for(const p of data.history){const available=[['Gross profit','grossProfit'],['Net profit','netProfit'],['Operating cash flow','operatingCash'],['Interest expense','interest'],['Total assets','assets'],['Total liabilities','liabilities'],['Equity','equity']].filter(([,k])=>p[k]!=null);if(available.length)paragraph(p.end+': '+available.map(([label,k])=>label+' '+money(p[k])).join('; '),{size:9});}
    paragraph((data.deal.sampleSubmission?'FY2025 only, from bundled synthetic accounts. No earlier years are assumed. ':'Annual historical actuals from the uploaded financial history. ')+ ' Headline figures use the reviewed deal fields. Values are fictional.',{size:10});
    heading('Information to confirm');
    [...data.warnings,...data.informationRequests].forEach(w=>paragraph('- '+w,{size:10}));
    heading('Source register');
    const files=data.deal.documents.filter(d=>d.status==='provided');
    if(!files.length)paragraph('Manual deal entry; no CSV files uploaded.');
    files.forEach(d=>paragraph(d.name+(d.sourceType==='local_file'?' | Uploaded synthetic CSV':' | Bundled synthetic sample'), {size:10}));
    data.financialSources.forEach(s=>paragraph(s.status+' | '+s.field+': '+money(s.value)+'; period '+(s.period||'not supplied')+'; '+s.file,{size:9}));
    data.history.forEach(p=>paragraph(p.end+' | '+p.source,{size:9}));
    for(const lender of data.lenders){
      page();heading(lender.name);paragraph('Fictional lender comparison | Mandate effective '+lender.mandate.effective_from,{size:10});
      paragraph(lender.fit+'% criteria fit: '+lender.aligned+' aligned / '+lender.checks.length+' total criteria. Unknowns remain in the total. Not an approval probability.',{bold:true});
      for(const c of lender.checks){room(90);paragraph(c.label+' - '+({align:'ALIGNS',gap:'OUTSIDE CRITERIA',check:'NEEDS CHECKING'}[c.outcome]),{bold:true});paragraph('Recorded criteria: '+c.criterion,{size:10});paragraph('This deal: '+c.dealValue,{size:10});line(44,y-3,551,y-3);y+=8;}
      paragraph('Target return '+lender.mandate.target_return_min_pct+'-'+lender.mandate.target_return_max_pct+'% is fictional mandate context, not a quoted rate. Confirm the leverage basis, security ranking, valuation and all lender requirements.',{size:9});
    }
    finish();
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
    const kids=[];
    pages.forEach(stream=>{const id=objects.length+1;kids.push(id+' 0 R');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);});
    objects[1]=`<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;
    let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
    const start=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
    return new Blob([pdf],{type:'application/pdf'});
  };
})(window);
