/* ============================================================
/* ============================================================
   UYSOT — Pages: Dashboard, Contracts, MRR, Managers, Clients, TopMRR, Debts
   ============================================================ */

// === REGION CLIENTS MODAL ===
function showRegionModal(hudud){
  const {all,qAll}=buildContracts();
  const now=S.dashTo;
  const snap=mrrOnDate(now,all,qAll);
  const map={};
  snap.contracts.forEach(c=>{
    const h=c.hudud||'Nomalum';
    if(h!==hudud)return;
    if(!map[c.client])map[c.client]={name:c.client,mrr:0,mgr:c.mgr||'—'};
    map[c.client].mrr+=c.musd;
  });
  const list=Object.values(map).sort((a,b)=>b.mrr-a.mrr);
  const totalMrr=list.reduce((s,c)=>s+c.mrr,0);
  const rows=list.map((c,i)=>`<tr><td class="text-subtle text-[11px] py-2 px-3">${i+1}</td><td class="font-semibold text-[13px] py-2 px-3">${cl(c.name)}</td><td class="text-xs text-muted py-2 px-3">${c.mgr}</td><td class="text-r mono font-semibold py-2 px-3">${fmt(c.mrr)}</td></tr>`).join('');
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  o.innerHTML=`<div class="modal p-0 max-w-[560px] w-[90%] max-h-[80vh] flex flex-col">
    <div class="modal-head flex justify-between items-center py-4 px-5 border-b border-brd shrink-0">
      <div>
        <div class="font-bold text-base">${hudud}</div>
        <div class="text-xs text-subtle mt-0.5">${list.length} ta mijoz · Jami MRR: <span class="mono font-semibold">${fmt(totalMrr)} $</span></div>
      </div>
      <button onclick="this.closest('.overlay').remove()" class="bg-transparent border-none text-xl cursor-pointer text-subtle leading-none py-1 px-2">×</button>
    </div>
    <div class="overflow-y-auto flex-1">
      <table class="w-full border-collapse">
        <thead><tr class="bg-card">
          <th class="py-2 px-3 text-left text-[11px] text-subtle font-semibold">№</th>
          <th class="py-2 px-3 text-left text-[11px] text-subtle font-semibold">MIJOZ</th>
          <th class="py-2 px-3 text-left text-[11px] text-subtle font-semibold">MENEJER</th>
          <th class="py-2 px-3 text-right text-[11px] text-subtle font-semibold">MRR $</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
  document.body.appendChild(o);
}

// === CLIENT LINK HELPER ===
function cl(n){if(!n)return'—';const s=JSON.stringify(n).replace(/"/g,'&quot;');return'<span class="client-link" onclick="showClientCard('+s+')">'+(n)+'</span>'}

// === CLIENT CARD MODAL ===
function showClientCard(name,cur){
  const n=name.trim();
  _A.client(n);
  const isUZS=(cur||S._cardCur||'usd')==='uzs';
  const ccy=isUZS?'':'$';
  const ccyKey=isUZS?'uzs':'usd';
  S._cardCur=ccyKey;
  const cRows=S.rows.filter(r=>r.Client?.trim()===n);
  const qCRows=S.qRows.filter(r=>r.Client?.trim()===n);
  const pm=isUZS?calcPaymentsUZS():calcPayments();
  const pmUSD=calcPayments(); // always USD for debt/status calculations
  let totalPaid=0;Object.values(pm).forEach(v=>{if(v.client===n)totalPaid+=v.total});
  let totalPaidUSD=0;Object.values(pmUSD).forEach(v=>{if(v.client===n)totalPaidUSD+=v.total});
  const totalSum=cRows.reduce((s,r)=>s+(isUZS?(r._sUZS||0):(r._sUSD||0)),0)+qCRows.reduce((s,r)=>s+(isUZS?pn(r['sum UZS']||'0'):(r._sUSD||0)),0);
  const {all,qAll}=buildContracts();const now=new Date();
  // For future contracts, also check future date
  const allClientCts=all.concat(qAll).filter(c=>c.client===n);
  const latestEnd=allClientCts.length?allClientCts.reduce((a,b)=>b.endD>a.endD?b:a).endD:now;
  // Current MRR: only contracts active RIGHT NOW
  const snapNow=mrrOnDate(now,all,qAll);
  const curMrrUSD=snapNow.contracts.filter(c=>c.client===n).reduce((s,c)=>s+c.musd,0);
  // UZS MRR: sum _mUZS from active contracts
  const curMrrUZS=isUZS?cRows.filter(r=>{const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return false;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);return st<=now&&endD>=now&&(r._mUZS||0)>0}).reduce((s,r)=>s+(r._mUZS||0),0):0;
  // For future contracts, get their MRR too
  const snapFuture=latestEnd>now?mrrOnDate(latestEnd,all,qAll):snapNow;
  const futureMrrUSD=snapFuture.contracts.filter(c=>c.client===n).reduce((s,c)=>s+c.musd,0);
  const futureMrrUZS=isUZS?cRows.filter(r=>{const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return false;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);return st<=latestEnd&&endD>=latestEnd&&(r._mUZS||0)>0}).reduce((s,r)=>s+(r._mUZS||0),0):0;
  const activeMrr=isUZS?(curMrrUZS||futureMrrUZS):(curMrrUSD||futureMrrUSD);
  const debtRow=calcDebtTable(now).find(r=>r.name===n);
  const oyQarzUSD=debtRow?.oyQarz||0,kelQarzUSD=debtRow?.kelQarz||0;
  // UZS debt: same cumExp logic but with UZS fields
  let oyQarzUZS=0,kelQarzUZS=0;
  if(isUZS){
    const ceUZS=calcCumExpectedUZS(now.getFullYear());
    const ceData=ceUZS[n];
    const pmUZSall=calcPaymentsUZS();
    let paidUZSTotal=0;Object.values(pmUZSall).forEach(v=>{if(v.client===n)paidUZSTotal+=v.total});
    if(ceData){
      oyQarzUZS=Math.round(ceData.cum[now.getMonth()]-paidUZSTotal);
    }
    // kelQarz UZS: for prepayment=1, same as oyQarz; for 2+, use billing-block
    const mainCts=cRows.filter(r=>(r._mUZS||0)>0).sort((a,b)=>(pd(a.sanasi)||0)-(pd(b.sanasi)||0));
    const anchor=mainCts[0];
    const anchorPre=anchor?(anchor._pre||1):1;
    if(anchorPre<=1){
      kelQarzUZS=oyQarzUZS;
    } else if(ceData){
      // Billing-block: find paidThroughM then cumExp at that month
      const repM=now.getMonth();
      const anchorSt=pd(anchor.sanasi);
      if(anchorSt){
        const aM0=anchorSt.getFullYear()*12+anchorSt.getMonth();
        const rM=now.getFullYear()*12+repM;
        const blocksDue=Math.floor(Math.max(0,rM-aM0)/anchorPre)+1;
        const paidThroughM=aM0+blocksDue*anchorPre-1;
        const ptMonth=paidThroughM%12;
        const ptYear=Math.floor(paidThroughM/12);
        // Get cumExp at paidThroughM
        const ceTarget=ptYear===now.getFullYear()?ceData.cum[ptMonth]:(ptYear<now.getFullYear()?ceData.preYear:ceData.cum[11]);
        kelQarzUZS=Math.round((ceTarget||0)-paidUZSTotal);
      } else {
        kelQarzUZS=oyQarzUZS;
      }
    }
  }
  const oyQarz=isUZS?oyQarzUZS:oyQarzUSD;
  const kelQarz=isUZS?kelQarzUZS:kelQarzUSD;
  const allDates=[...cRows,...qCRows].map(r=>pd(r.sanasi)).filter(Boolean);
  const firstDate=allDates.length?allDates.reduce((a,b)=>a<b?a:b):null;
  const tenureM=firstDate?Math.round((now-firstDate)/(30.44*86400000)):0;
  // Qarzdor from: always use USD (same logic as AR Aging)
  const qarzdorFromDate=_findQarzdorDate(n,totalPaidUSD);
  // Paid until: one day before qarzdor starts
  let paidUntilDate=qarzdorFromDate?new Date(qarzdorFromDate.getTime()-864e5):null;
  // Cap paidUntilDate at contract end date
  const endDatesAll=allClientCts.map(c=>c.endD).filter(Boolean);
  const activeUntil=endDatesAll.length?endDatesAll.reduce((a,b)=>a>b?a:b):null;
  if(paidUntilDate&&activeUntil&&paidUntilDate>activeUntil)paidUntilDate=activeUntil;
  // Churn detection: all contracts ended before today
  const isChurn=activeUntil&&activeUntil<now;
  const activeCount=cRows.filter(r=>sc(r.status)==='A').length;
  const mrow=cRows[0]||qCRows[0];
  const firma=mrow?.['Firma nomi']||'';
  const inn=mrow?.INN||'';
  const mgr=mrow?.Manager||'';
  const hudud=mrow?.Hudud||'';
  const health=calcClientHealth().find(c=>c.name===n);
  const hBadge=health?(health.status==='healthy'?'<span class="badge b-green">Healthy</span>':health.status==='warning'?'<span class="badge b-amber">⚠ Warning</span>':'<span class="badge b-red">Critical</span>'):'';
  const allPays=[];
  S.payRows.forEach(r=>{if(r.Client?.trim()!==n)return;const d=pd(r.sanasi);if(!d||!pn(r.USD))return;allPays.push({date:d,dateStr:r.sanasi||'',usd:pn(r.USD),uzs:pn(r.UZS||r.summasi||'0'),type:r['tolov turi']||'',kassa:r.kassa||'',src:'pay',origSum:r.summasi||'',valyuta:(r.Valyuta||'USD').toUpperCase()})});
  S.y2024Rows.forEach(r=>{if(r.Client?.trim()!==n)return;const d=pd(r.sanasi);if(!d||!pn(r.USD))return;allPays.push({date:d,dateStr:r.sanasi||'',usd:pn(r.USD),uzs:pn(r.UZS||'0'),type:r['tolov turi']||'',kassa:r.kassa||'',src:'y24',origSum:r.summasi||'',valyuta:(r.Valyuta||'USD').toUpperCase()})});
  allPays.sort((a,b)=>b.date-a.date);
  const tl=t=>({naqd:'Naqd',karta:'Karta',bank:'Bank',perevod:'Perevod'}[t]||t||'—');
  // Status indicator: active / qarzdor / churn / kutilmoqda
  const hasDebt=oyQarzUSD>0||kelQarzUSD>0;
  const isDebt=qarzdorFromDate&&qarzdorFromDate<=now&&hasDebt;
  const daysSinceEnd=isChurn?Math.round((now-activeUntil)/864e5):0;
  const isGrace=isChurn&&daysSinceEnd<=7; // 7 kun ichida yangi kelishuv kutilmoqda
  const churnBadge=isChurn&&!isGrace?'<span class="inline-flex items-center bg-[rgba(107,114,128,0.1)] border border-[rgba(107,114,128,0.3)] rounded-full py-[3px] px-2.5 text-[11px] font-semibold text-subtle">CHURN</span>':'';
  const graceBadge=isGrace?'<span class="inline-flex items-center bg-[rgba(217,119,6,0.1)] border border-[rgba(217,119,6,0.3)] rounded-full py-[3px] px-2.5 text-[11px] font-semibold text-warn">Yangi kelishuv kutilmoqda</span>':'';
  let statusHtml='';
  if(isDebt){
    statusHtml='<span class="inline-flex items-center bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] rounded-full py-[3px] pr-2.5 pl-[7px] text-[11px] font-semibold text-danger">QARZDOR · '+fmtD(qarzdorFromDate)+' dan</span>'+(isChurn?(!isGrace?churnBadge:graceBadge):'');
  } else if(isGrace){
    statusHtml=graceBadge;
  } else if(isChurn){
    statusHtml=churnBadge;
  } else if(activeUntil&&activeUntil>=now){
    statusHtml='<span class="inline-flex items-center bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-full py-[3px] pr-2.5 pl-[7px] text-[11px] font-semibold text-success">AKTIV · '+(paidUntilDate?fmtD(paidUntilDate):fmtD(activeUntil))+' gacha</span>';
  }
  // Colored delta helper
  const dlt=v=>v>0?'<span class="text-success text-[9px] font-mono block">+'+fmt(v)+'</span>':v<0?'<span class="text-danger text-[9px] font-mono block">'+fmt(v)+'</span>':'';
  const qByRaqami={};qCRows.forEach(r=>{const aq=r.raqami||'_';if(!qByRaqami[aq])qByRaqami[aq]=[];qByRaqami[aq].push(r)});
  const ctHtml=cRows.map(r=>{
    const k=r.Client+'|'+r.raqami;const p=pm[k]||{total:0};
    const qExtras=qByRaqami[r.raqami]||[];
    const qExtraSum=qExtras.reduce((s,q)=>s+(isUZS?pn(q['sum UZS']||'0'):(q._sUSD||0)),0);
    const qExtraMrr=qExtras.reduce((s,q)=>s+pn(q[isUZS?'oylik UZS':'Oylik USD']),0);
    const qExtraTdb=qExtras.reduce((s,q)=>s+pn(q[isUZS?'Tadbiq UZS':'Tadbiq USD']),0);
    const jamiSum=(isUZS?(r._sUZS||0):(r._sUSD||0))+qExtraSum;
    const tadbiqSum=(isUZS?(r._tUZS||0):(r._tUSD||0))+qExtraTdb;
    const oylik=isUZS?(r._mUZS||0):(r._mUSD||0);
    const qoldiq=Math.round(jamiSum-p.total);const qC=qoldiq>0?'var(--red)':qoldiq<0?'var(--amber)':'var(--green)';
    return'<tr><td class="mono text-[10px] text-muted">'+r.raqami+'</td>'
      +'<td class="mono text-[10.5px] whitespace-nowrap">'+r.sanasi+'</td>'
      +'<td class="mono text-[10.5px] whitespace-nowrap">'+(r['amal qilishi']||'—')+'</td>'
      +'<td class="text-r mono text-[11px] leading-[1.2]">'+fmt(tadbiqSum)+dlt(qExtraTdb)+'</td>'
      +'<td class="text-r mono text-[11px] leading-[1.2]">'+fmt(oylik)+dlt(qExtraMrr)+'</td>'
      +'<td class="text-r mono text-[11px] leading-[1.2]">'+fmt(jamiSum)+dlt(qExtraSum)+'</td>'
      +'<td class="text-r mono text-[11px] text-tw-teal">'+(p.total?fmt(p.total):'—')+'</td>'
      +'<td class="text-r mono text-[11px]" style="color:'+qC+';font-weight:'+(qoldiq>0?'600':'400')+'">'+(jamiSum?fmt(qoldiq):'—')+'</td>'
      +'</tr>';
  }).join('');
  const qHtml=qCRows.map(r=>{
    const musd=isUZS?pn(r['oylik UZS']):pn(r['Oylik USD']);
    const tdb=isUZS?pn(r['Tadbiq UZS']):pn(r['Tadbiq USD']);
    const ssum=isUZS?pn(r['sum UZS']||'0'):(r._sUSD||0);
    const cv=v=>v>0?'var(--green)':v<0?'var(--red)':'var(--text)';
    return'<tr><td class="mono text-[10px] text-muted">'+(r.raqami||'—')+'</td>'
      +'<td class="mono text-[10.5px] whitespace-nowrap">'+(r.sanasi||'—')+'</td>'
      +'<td class="mono text-[10.5px] whitespace-nowrap">'+(r['amal qilishi']||'—')+'</td>'
      +'<td class="text-r mono text-[11px]" style="color:'+cv(tdb)+'">'+fmt(tdb)+'</td>'
      +'<td class="text-r mono text-[11px]" style="color:'+cv(musd)+'">'+fmt(musd)+'</td>'
      +'<td class="text-r mono text-[11px]" style="color:'+cv(ssum)+'">'+fmt(ssum)+'</td>'
      +'</tr>';
  }).join('');
  const _isM=window.innerWidth<=600;
  const payHtml=allPays.slice(0,50).map(p=>{
    // Mobile: short date (13.03.26), Desktop: full (13.03.2026)
    const dShort=p.date?p.date.getDate().toString().padStart(2,'0')+'.'+String(p.date.getMonth()+1).padStart(2,'0')+'.'+String(p.date.getFullYear()%100).padStart(2,'0'):'—';
    const dFull=p.dateStr||'—';
    const dateDisp=_isM?dShort:dFull;
    const origNum=pn(p.origSum||'0');
    const payIsUZS=p.valyuta==='UZS'||p.valyuta==='SUM';
    const kurs=payIsUZS&&origNum>0&&p.usd>0?Math.round(origNum/p.usd):null;
    let detail=tl(p.type);
    if(p.kassa)detail+=' ('+p.kassa+')';
    if(p.src==='y24')detail+=' <span class="text-[9px] text-subtle">[2024]</span>';
    // Tooltip: kassa, valyuta, original summa, kurs
    let tipParts=[];
    if(p.kassa)tipParts.push('Kassa: '+p.kassa);
    if(payIsUZS&&origNum>0){
      tipParts.push('Asl summa: '+fmt(origNum)+' so\'m');
      if(kurs)tipParts.push('Kurs: 1$ = '+fmt(kurs)+' so\'m');
    } else if(origNum>0&&!payIsUZS){
      tipParts.push('Valyuta: '+(p.valyuta||'USD'));
    }
    const tip=tipParts.length?tipParts.join(' · '):'';
    // Sub-detail: show original currency info when different from card mode
    let subHtml='';
    if(payIsUZS&&!isUZS&&origNum>0){
      subHtml='<div class="text-[9.5px] text-subtle mt-[1px]">'+fmt(origNum)+' so\'m'+(kurs?' · 1$='+fmt(kurs):'')+'</div>';
    } else if(!payIsUZS&&isUZS&&p.usd>0){
      subHtml='<div class="text-[9.5px] text-subtle mt-[1px]">'+fmt(p.usd)+' $</div>';
    }
    // Display amount: always follow card currency mode
    const dispAmt=isUZS?p.uzs:p.usd;
    return'<tr class="cursor-default" title="'+tip+'">'
      +'<td class="mono text-[10.5px] whitespace-nowrap">'+dateDisp+'</td>'
      +'<td class="text-[11.5px]">'+detail+subHtml+'</td>'
      +'<td class="text-r mono text-tw-teal font-semibold">+'+fmt(dispAmt)+(isUZS?'':' $')+'</td>'
      +'</tr>';
  }).join('');
  const dC=kelQarz>0?'var(--red)':kelQarz<0?'var(--amber)':'var(--green)';
  // MRR 12-month trend
  const cid='cc'+Date.now();
  const UZ_MON=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const UZ_MON_S=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  const mLabel=d=>_isM?(UZ_MON_S[d.getMonth()]+" '"+String(d.getFullYear()%100)):(d.getFullYear()+' '+UZ_MON[d.getMonth()]);
  const mrrL=[],mrrV=[];
  for(let i=11;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    if(isUZS){
      // UZS MRR: sum _mUZS from contracts active on that date
      let v=0;cRows.forEach(r=>{const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);if(st<=d&&endD>=d)v+=(r._mUZS||0)});
      mrrL.push(mLabel(d));mrrV.push(Math.round(v));
    } else {
      const s2=mrrOnDate(d,all,qAll);const v=s2.contracts.filter(c=>c.client===n).reduce((a,c)=>a+c.musd,0);
      mrrL.push(mLabel(d));mrrV.push(Math.round(v));
    }
  }
  // Payment monthly trend
  const payAmt=p=>isUZS?p.uzs:p.usd;
  const mPayMap={};allPays.forEach(p=>{const m=p.date.getFullYear()+'-'+(p.date.getMonth()+1).toString().padStart(2,'0');mPayMap[m]=(mPayMap[m]||0)+payAmt(p);});
  const payTL=[],payTV=[];
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const m=d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0');payTL.push(mLabel(d));payTV.push(Math.round(mPayMap[m]||0));}
  // Payment by type donut
  const byType={};allPays.forEach(p=>{const k=tl(p.type);byType[k]=(byType[k]||0)+payAmt(p);});
  const dtLabels=Object.keys(byType),dtVals=Object.values(byType).map(v=>Math.round(v));
  // Mini KPIs
  const payPct=totalSum>0?Math.round(totalPaid/totalSum*100):0;
  const daysToEnd=health?health.daysToEnd:null;
  const arpa=tenureM>0?Math.round(totalPaid/tenureM):0;
  // Currency toggle HTML
  const curToggle='<div class="flex gap-0.5 bg-hover rounded-md p-0.5 ml-2">'
    +'<button class="btn'+(isUZS?'':' btn-primary')+' py-0.5 px-2 text-[11px]" onclick="var sc=this.closest(\'.modal\').querySelector(\'.client-card-scroll\');S._cardScroll=sc?sc.scrollTop:0;this.closest(\'.overlay\').remove();showClientCard(\''+n.replace(/'/g,"\\'")+'\''+',\'usd\')">$</button>'
    +'<button class="btn'+(isUZS?' btn-primary':'')+' py-0.5 px-2 text-[11px]" onclick="var sc=this.closest(\'.modal\').querySelector(\'.client-card-scroll\');S._cardScroll=sc?sc.scrollTop:0;this.closest(\'.overlay\').remove();showClientCard(\''+n.replace(/'/g,"\\'")+'\''+',\'uzs\')">so\'m</button>'
    +'</div>';
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  o.innerHTML='<div class="modal p-0 flex flex-col" style="width:min(98vw,1160px);max-height:96vh">'
    // Header
    +'<div class="py-3.5 px-5 border-b border-brd shrink-0">'
    +'<div class="flex justify-between items-center mb-1">'
    +'<div class="flex items-center gap-2 flex-wrap"><span class="font-bold text-lg">'+n+'</span>'+curToggle+statusHtml+'</div>'
    +'<button onclick="this.closest(\'.overlay\').remove()" class="bg-transparent border-none text-2xl cursor-pointer text-subtle leading-none p-0 shrink-0">×</button>'
    +'</div>'
    +(_isM?'':'<div class="flex gap-3 flex-wrap text-[11.5px] text-subtle">'
    +(firma?'<span>🏢 '+firma+(inn?' <span class="font-mono text-muted text-[10px]">INN: '+inn+'<button onclick="navigator.clipboard.writeText(\''+inn+'\');showToast(\'Nusxalandi\',\'success\')" class="bg-transparent border-none cursor-pointer text-subtle p-0 pl-[3px] text-[10px]" title="Nusxalash">📋</button></span>':'')+'</span>':'')
    +(hudud?'<span>📍 '+hudud+'</span>':'')
    +(mgr?'<span>👤 '+mgr+'</span>':'')
    +(firstDate?'<span>📅 '+fmtD(firstDate)+' · '+tenureM+' oy</span>':'')
    +'</div>')
    +'</div>'
    // Body
    +'<div class="client-card-scroll overflow-y-auto flex-1 p-[18px]" style="padding-left:'+(_isM?'12px':'24px')+';padding-right:'+(_isM?'12px':'24px')+'">'
    // Row 1: 4 main metric cards
    +'<div class="client-kpi-grid grid grid-cols-4 gap-2.5 mb-2.5">'
    +'<div class="bg-accent-bg border border-brd rounded-[10px] py-3.5 px-4 border-t-[3px] border-t-accent">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.5px] mb-1">Joriy MRR <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'cur_mrr\')">i</span></div>'
    +'<div class="mono text-[22px] font-bold text-accent">'+(isChurn?'0 '+ccy:activeMrr?fmt(activeMrr)+' '+ccy:'—')+'</div>'
    +'<div class="text-[10px] text-subtle mt-0.5">'+(isChurn?'churn':activeCount+' aktiv shartnoma')+'</div></div>'
    +'<div class="bg-card border border-brd rounded-[10px] py-3.5 px-4 border-t-[3px] border-t-success">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.5px] mb-1">Jami shartnoma <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'total_cv\')">i</span></div>'
    +'<div class="mono text-[22px] font-bold">'+fmt(totalSum)+' '+ccy+'</div>'
    +'<div class="text-[10px] text-subtle mt-0.5">'+(cRows.length+qCRows.length)+' ta shartnoma</div></div>'
    +'<div class="bg-card border border-brd rounded-[10px] py-3.5 px-4 border-t-[3px] border-t-tw-teal">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.5px] mb-1">To\'langan <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'total_paid\')">i</span></div>'
    +'<div class="mono text-[22px] font-bold text-tw-teal">'+fmt(totalPaid)+' '+ccy+'</div>'
    +'<div class="text-[10px] text-subtle mt-0.5">'+allPays.length+' ta to\'lov</div></div>'
    +'<div class="bg-card border border-brd rounded-[10px] py-3.5 px-4" style="border-top:3px solid '+(kelQarz>0?'var(--red)':'var(--green)')+'">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.5px] mb-1">Kelishuv qoldig\'i <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'outstanding\')">i</span></div>'
    +'<div class="mono text-[22px] font-bold" style="color:'+dC+'">'+(kelQarz>0?fmt(kelQarz)+' '+ccy:'✓ Yo\'q')+'</div>'
    +(oyQarz>0?'<div class="text-[10px] text-warn mt-0.5">Oy oxiri: '+fmt(oyQarz)+' '+ccy+'</div>':'<div class="text-[10px] text-subtle mt-0.5">Oy oxiri ham to\'liq</div>')
    +'</div></div>'
    // Row 2: 4 mini KPI cards
    +'<div class="client-kpi-grid2 grid grid-cols-4 gap-2 mb-4">'
    +'<div class="bg-hover border border-brd rounded-lg py-2.5 px-3.5 flex flex-col gap-[3px]">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.4px]">Health Score <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'health\')">i</span></div>'
    +'<div class="mono text-[17px] font-bold" style="color:'+(health?(health.score>=80?'var(--green)':health.score>=50?'var(--amber)':'var(--red)'):'var(--text3)')+'">'+( health?health.score+'/100':'—')+'</div>'
    +'<div class="text-[10px] text-subtle">'+(health?hBadge:'')+'</div></div>'
    +'<div class="bg-hover border border-brd rounded-lg py-2.5 px-3.5 flex flex-col gap-[3px]">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.4px]">To\'lov foizi <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'pay_rate\')">i</span></div>'
    +'<div class="mono text-[17px] font-bold" style="color:'+(payPct>=80?'var(--green)':payPct>=50?'var(--amber)':'var(--red)')+'">'+payPct+'%</div>'
    +'<div class="h-1 rounded-sm mt-0.5" style="background:var(--border)"><div class="h-full rounded-sm" style="width:'+payPct+'%;background:'+(payPct>=80?'var(--green)':payPct>=50?'var(--amber)':'var(--red)')+';transition:width .3s"></div></div></div>'
    +'<div class="bg-hover border border-brd rounded-lg py-2.5 px-3.5 flex flex-col gap-[3px]">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.4px]">Shartnoma tugashiga <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'days_exp\')">i</span></div>'
    +'<div class="mono text-[17px] font-bold" style="color:'+(daysToEnd!=null&&daysToEnd>0&&daysToEnd<=30?'var(--amber)':daysToEnd!=null&&daysToEnd===-999?'var(--red)':'var(--text)')+'">'+( daysToEnd!=null?(daysToEnd===-999?'Tugagan':daysToEnd>999?'Belgilanmagan':daysToEnd+' kun'):'—')+'</div>'
    +'<div class="text-[10px] text-subtle">shartnoma muddati</div></div>'
    +'<div class="bg-hover border border-brd rounded-lg py-2.5 px-3.5 flex flex-col gap-[3px]">'
    +'<div class="text-[10px] text-subtle font-semibold uppercase tracking-[0.4px]">O\'rt. oylik to\'lov <span class="metric-info" onclick="event.stopPropagation();showMetricInfo(\'avg_monthly\')">i</span></div>'
    +'<div class="mono text-[17px] font-bold text-accent">'+fmt(arpa)+' '+ccy+'</div>'
    +'<div class="text-[10px] text-subtle">jami to\'lov ÷ oylar</div></div>'
    +'</div>'
    // Two-column layout: left=tables, right=charts
    +'<div class="client-detail-grid grid grid-cols-[1fr_340px] gap-4 items-start">'
    // LEFT column
    +'<div class="min-w-0 overflow-hidden">'
    // Health strip
    +(health?'<div class="flex items-center gap-3 py-[9px] px-3.5 bg-hover rounded-lg mb-3.5 text-xs flex-wrap">'
    +'<span>Sog\'liq: <strong style="color:'+(health.score>=80?'var(--green)':health.score>=50?'var(--amber)':'var(--red)')+'">'+health.score+'/100</strong></span>'
    +(health.debt>0?'<span class="text-subtle">·</span><span>Qarz: <span class="mono text-danger">'+fmt(oyQarz)+' '+ccy+'</span></span>':'')
    +(health.daysToEnd>0&&health.daysToEnd<999?'<span class="text-subtle">·</span><span>Tugashiga: <span class="mono" style="color:'+(health.daysToEnd<=30?'var(--amber)':'var(--text2)')+'">'+health.daysToEnd+' kun</span></span>':(health.daysToEnd===-999?'<span class="text-subtle">·</span><span class="text-danger">Shartnoma tugagan</span>':''))
    +'</div>':'')
    // Contracts table
    +(ctHtml?'<div id="_snap_ct" class="mb-3.5 p-2 bg-card rounded-[10px]">'
    +'<div class="flex items-center justify-between mb-1.5">'
    +'<div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted">Shartnomalar</div>'
    +'<button onclick="snapEl(document.getElementById(\'_snap_ct\'),this)" class="bg-transparent border border-brd rounded-md py-[3px] px-[7px] cursor-pointer text-subtle text-xs flex items-center gap-1" title="Rasmga olish (clipboard)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M5 3v2M19 3v2"/></svg></button></div>'
    +'<div class="border border-brd rounded-[10px] overflow-hidden"><div class="overflow-x-auto">'
    +'<table><thead><tr><th>Raqami</th><th>Boshlanish</th><th>Tugash</th><th class="text-r">Tadbiq '+ccy+'</th><th class="text-r">Oylik '+ccy+'</th><th class="text-r">Jami '+ccy+'</th><th class="text-r">To\'langan</th><th class="text-r">Qoldiq</th></tr></thead>'
    +'<tbody>'+ctHtml+'</tbody></table></div></div>'
    // Additional contracts table (inside snapshot area)
    +(qHtml?'<div class="mt-2.5"><div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted mb-1.5">Qo\'shimcha kelishuvlar</div>'
    +'<div class="border border-brd rounded-[10px] overflow-hidden"><div class="overflow-x-auto">'
    +'<table><thead><tr><th>Raqami</th><th>Boshlanish</th><th>Tugash</th><th class="text-r">Tadbiq '+ccy+'</th><th class="text-r">Oylik '+ccy+'</th><th class="text-r">Jami '+ccy+'</th></tr></thead>'
    +'<tbody>'+qHtml+'</tbody></table></div></div></div>':'')
    +'</div>':'')
    // Payment history
    +'<div><div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted mb-1.5">To\'lovlar tarixi'+(allPays.length>50?' (so\'nggi 50 ta)':' ('+allPays.length+' ta)')+'</div>'
    +(payHtml?'<div class="border border-brd rounded-[10px] overflow-hidden">'
    +'<div class="max-h-[220px] overflow-y-auto">'
    +'<table class="pay-tbl"><thead><tr><th>Sana</th><th>Turi</th><th class="text-r">'+(isUZS?'Summa':'USD')+'</th></tr></thead>'
    +'<tbody>'+payHtml+'</tbody></table></div></div>'
    :'<div class="text-center p-5 text-subtle text-[13px]">To\'lovlar tarixi mavjud emas</div>')
    +'</div>'
    +'</div>'
    // RIGHT column: charts
    +'<div class="flex flex-col gap-3.5 min-w-0 overflow-hidden">'
    // MRR bar chart
    +'<div class="bg-card border border-brd rounded-[10px] p-3 overflow-hidden">'
    +'<div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted mb-2.5">MRR dinamikasi (12 oy)</div>'
    +'<div class="relative h-[140px] w-full"><canvas id="'+cid+'_mrr"></canvas></div>'
    +'</div>'
    // Payment trend bar chart
    +'<div class="bg-card border border-brd rounded-[10px] p-3 overflow-hidden">'
    +'<div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted mb-2.5">To\'lovlar trendi (12 oy)</div>'
    +'<div class="relative h-[140px] w-full"><canvas id="'+cid+'_trend"></canvas></div>'
    +'</div>'
    // Payment type donut
    +(dtLabels.length?'<div class="bg-card border border-brd rounded-[10px] p-3 overflow-hidden">'
    +'<div class="text-[10px] font-bold uppercase tracking-[0.5px] text-muted mb-2.5">To\'lov turlari</div>'
    +'<div class="relative h-[160px] w-full"><canvas id="'+cid+'_pay"></canvas></div>'
    +'</div>':'')
    +'</div>'
    +'</div>'
    +'</div></div>';
  document.body.appendChild(o);
  // Restore scroll position on currency toggle
  if(S._cardScroll){const sc=o.querySelector('.client-card-scroll');if(sc)sc.scrollTop=S._cardScroll;S._cardScroll=0;}
  // Initialize charts
  requestAnimationFrame(()=>{
    const isDark=document.documentElement.getAttribute('data-theme')==='dark';
    const gridC=isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
    const txtC=isDark?'rgba(255,255,255,0.45)':'rgba(0,0,0,0.45)';
    const accentC=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#1746a2';
    const tealC=getComputedStyle(document.documentElement).getPropertyValue('--teal').trim()||'#0d9488';
    const ccySym=isUZS?'UZS':'$';
    const opts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fmt(ctx.parsed.y||ctx.parsed||0)+' '+ccySym}}},scales:{x:{grid:{color:gridC},ticks:{color:txtC,font:{size:9},maxRotation:45}},y:{grid:{color:gridC},ticks:{color:txtC,font:{size:9},callback:v=>fmt(v)}}}};
    const mEl=document.getElementById(cid+'_mrr');
    if(mEl)new Chart(mEl,{type:'bar',data:{labels:mrrL,datasets:[{data:mrrV,backgroundColor:accentC+'99',borderColor:accentC,borderWidth:1.5,borderRadius:4}]},options:opts});
    const tEl=document.getElementById(cid+'_trend');
    if(tEl)new Chart(tEl,{type:'bar',data:{labels:payTL,datasets:[{data:payTV,backgroundColor:tealC+'99',borderColor:tealC,borderWidth:1.5,borderRadius:4}]},options:opts});
    if(dtLabels.length){const pEl=document.getElementById(cid+'_pay');if(pEl)new Chart(pEl,{type:'doughnut',data:{labels:dtLabels,datasets:[{data:dtVals,backgroundColor:['#1746a2cc','#0d9488cc','#16a34acc','#d97706cc','#dc2626cc'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:txtC,font:{size:10},boxWidth:12,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+fmt(ctx.parsed)+' '+ccySym}}}}})}
  });
}

// === DEBT FULLSCREEN ===
function toggleDebtFs(){
  S.debtFs=!S.debtFs;
  clearCache();render();
}
(function(){
  if(window._fsKeyBound)return;
  window._fsKeyBound=true;
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(e._escHandled)return;
      if(S.debtFs){S.debtFs=false;clearCache();render();return}
      if(S.mrrFs){S.mrrFs=false;clearCache();render();return}
      if(S.inkassoFs){S.inkassoFs=false;clearCache();render();return}
    }
    if(e.key==='f'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
      const tag=document.activeElement?.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
      if(S.sec==='mrrtable'){e.preventDefault();toggleMrrFullscreen();}
      else if(S.sec==='debts'){e.preventDefault();toggleDebtFs();}
      else if(S.sec==='moliya'&&S.molView==='inkasso'){e.preventDefault();S.inkassoFs=!S.inkassoFs;render();}
    }
  });
})();

// === MRR FULLSCREEN ===
function toggleMrrFullscreen(){
  S.mrrFs=!S.mrrFs;
  clearCache();render();
}

// === DASHBOARD ===
function showMetricInfo(k){
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  const bx=(color,icon,text)=>`<div class="flex items-center gap-2 py-2 px-3 rounded-lg mb-1.5 text-[11.5px] leading-normal" style="background:${color}11;border-left:3px solid ${color}"><span class="text-sm">${icon}</span><span>${text}</span></div>`;
  const d={
    'mrr': `<h4 class="mb-2.5">📊 MRR — Monthly Recurring Revenue</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Tashkilotning har oylik <b>kafolatlangan doimiy daromad</b> hajmi. SaaS biznesining asosiy qon tomiri. MRR faqat faol shartnomalar asosida hisoblanadi.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> MRR oydan-oyga barqaror o\'sib borsa — <b>+5-10%</b> oylik o\'sish idealdir.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> MRR bir joyda tursa yoki <b>0-2%</b> o\'ssa — biznes to\'xtab qolgan, yangi sotuvlar churn bilan tenglanmoqda.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> MRR tushib borsa — churn yangi sotuvlardan ustun turmoqda. <b>Zudlik bilan churn sabablarini tahlil qiling.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>ARR</b> = MRR × 12. Yillik darajadagi bashorat. Investorlar va moliyaviy rejalashtirishda ishlatiladi.<br>
        <b>⚠️ Risk:</b> Agar bir nechta yirik shartnoma tugashi yaqin bo'lsa, MRR keskin tushishi mumkin. Revenue Concentration kartasini kuzating.
      </div>`,

    'nrr': `<h4 class="mb-2.5">♻️ NRR — Net Revenue Retention</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed"><b>Mavjud mijozlardan kelayotgan daromadning saqlanish</b> darajasi. Agar 100% dan yuqori bo'lsa — hatto yangi mijozlarsiz ham kompaniya o'sib boradi.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (100%+):</b> Kengayish (Expansion) churnga ustun. Biznes organik ravishda kengaymoqda — <b>eng sog\'lom holat.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (90-100%):</b> Biroz daromad yo\'qotilmoqda. Churn va contraction kuchaymoqda, sotuvlar bilan qoplash kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<90%):</b> Keskin daromad yo\'qotilishi! Bazaning katta qismi ketmoqda yoki pasaymoqda. <b>Zudlik bilan sabablarni aniqlang.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>New:</b> Yangi mijozlardan kelayotgan daromad.<br>
        <b>Expansion:</b> Mavjud mijozlar tarifni ko'tardi. <b>Contraction:</b> Pasaytirdi. <b>Net Exp = Expansion - Contraction.</b><br>
        <b>Churn:</b> Butunlay ketganlar.<br>
        <b>⚠️ Risk:</b> NRR < 90% uzoq vaqt davom etsa, moliyaviy barqarorlik buziladi va investorlar ishonchini yo'qotasiz.
      </div>`,

    'cust': `<h4 class="mb-2.5">👥 Active Customers — Faol Mijozlar</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Ayni daqiqada<b> faol shartnomaga ega</b>, to'lovi joriy yoki muzlatilmagan korxonalar soni.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Faol mijozlar doimiy oshib borsa — sog\'lom baza. Har chorakda <b>+5% </b>va undan yuqori o\'sish idealdir.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Baza bir joyda tursa — yangi sotuvlar churn bilan tenglanmoqda. <b>Sotuv samaradorligi pastligi</b>ga ishora.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Baza kamaysa — ketayotgan mijozlar yangilaridan ko\'proq. <b>Mahsulot sifati va xizmatni tezda tekshiring.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Churn Rate:</b> Har oyda bazangizning necha %i ketmoqda.<br>
        <b>Yaxshi:</b> < 3% oylik | <b>O'rtacha:</b> 3-5% | <b>Xavfli:</b> > 5%<br>
        <b>⚠️ Risk:</b> Agar kichik mijozlar ko'p ketsa va yirik qolsa — soni kamayadi lekin MRR saqlanadi. Bu vaqtinchalik! Shunday paytda Revenue Concentration xavfi oshadi.
      </div>`,

    'arpa': `<h4 class="mb-2.5">💳 ARPA — Average Revenue Per Account</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Bitta mijoz hisobiga <b>o'rtacha qancha oylik daromad</b> tushayotgani. ARPA = MRR / Aktiv mijozlar soni.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> ARPA o\'sib borsa — siz <b>qimmatroq xizmatlarni sotmoqdasiz</b> yoki kattaroq korxonalarga xizmat qilmoqdasiz.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> ARPA bir joyda tursa — daromad faqat yangi mijozlar hisobiga o\'sadi, lekin <b>har bir mijoz kam pul olib keladi.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> ARPA tushsa — yirik mijozlar ketmoqda yoki barchaga arzon narxda sotilmoqda. <b>Narx siyosatini qayta ko\'ring.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>⚠️ Risk:</b> ARPA past bo'lsa, ko'p mijoz bilan ishlash xarajatlari (support, server) daromaddan oshib ketishi mumkin. Rentabellik pasayadi.
      </div>`,

    'cac': `<h4 class="mb-2.5">🎯 CAC — Customer Acquisition Cost</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Bitta yangi mijozni jalb qilish uchun <b>o'rtacha sarflangan marketing + sotuv xarajati.</b></div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> CAC <b>3 oy ichida qoplanadi</b> — mijoz ARPA si bilan xarajat juda tez qaytadi.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> CAC <b>6-12 oy ichida qoplanadi</b> — rentabel, lekin naqd pul muammolari yuzaga kelishi mumkin.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> CAC <b>12+ oyda qoplanadi</b> — har bir yangi mijoz zarar olib keladi, biznes kengaymas holga tushadi.')}
      </div>
      <div class="text-xs p-2.5 bg-card text-subtle rounded-md border border-brd">⚠️ Hozirda tizimga <b>Marketing xarajatlari bazasi</b> kiritilmagan. Modul yoqilishi uchun marketing ma'lumotlari kerak.</div>`,

    'cash': `<h4 class="mb-2.5">💵 Net Cash In — Naqd Pul Tushumi</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Tanlangan davr ichida <b>kassaga, kartaga va bankka haqiqatda tushgan to'lovlar</b> summasi. MRR dan farqi — bu <b>real pul</b>, qog'ozdagi emas.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Cash In ≥ MRR — barcha kutilgan to\'lovlar vaqtida yig\'ilgan. <b>Moliyaviy oqim sog\'lom.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Cash In < MRR — bir qism mijozlar to\'lovni kechiktirmoqda. <b>DSO ko\'rsatkichini kuzating.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Cash In << MRR — jiddiy qarzdorlik! Operatsion xarajatlar uchun <b>naqd pul yetishmasligi</b> xavfi bor.')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Cash:</b> Naqd to'lovlar | <b>Card:</b> Karta orqali | <b>Bank:</b> Bank o'tkazmasi<br>
        <b>⚠️ Risk:</b> MRR o'sib borsa ham Cash In past bo'lsa — biznes qog'ozda boy, lekin real hayotda kassada pul yo'q. Bu SaaS uchun <b>eng xavfli holat.</b>
      </div>`,

    'dso': `<h4 class="mb-2.5">⏱️ DSO — Days Sales Outstanding</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijozlardan to'lovni yig'ish <b>o'rtacha necha kun</b> davom etishini ko'rsatadi. DSO qancha kichik bo'lsa — naqd pul oqimi shuncha tez va sog'lom.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (< 30 kun):</b> Mijozlar to\'lovni <b>o\'z vaqtida</b> qilmoqda. Kassada doim naqd bor — operatsion muammolar yo\'q.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (30-60 kun):</b> Ba\'zi mijozlar <b>kechiktirmoqda.</b> Eslatma va jazo tizimini kuchaytirish kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (60+ kun):</b> Jiddiy qarzdorlik! Daromadning katta qismi <b>yig\'ilmagan qarz</b> holida yotmoqda. Ish haqi va server xarajatlariga pul yetishmasligi xavfi.')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Formula:</b> (Umumiy qarzdorlik ÷ Davr daromadi) × Kunlar soni<br>
        <b>⚠️ Risk:</b> DSO oshib borsa — bu churnning "yashirin belgisi" bo'lishi mumkin. To'lamaydigan mijoz ertaga ketadigan mijozdir.
      </div>`,

    'conc': `<h4 class="mb-2.5">🏢 Revenue Concentration — Daromad Konsentratsiyasi</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Umumiy daromadning <b>eng yirik mijozlarga qanchalik bog'liq</b> ekanligini ko'rsatadi. Top 5 va Top 10 ulushini o'lchaydi.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (Top 5 < 25%):</b> Daromad <b>keng tarqalgan.</b> Birorta yirik mijoz ketsa ham biznesga jiddiy zarar yetmaydi.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (Top 5 = 25-50%):</b> Bir nechta yirik shartnomaga <b>o\'rtacha bog\'liqlik.</b> Bu mijozlarni alohida e\'tibor bilan boshqaring.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (Top 5 > 50%):</b> Daromadning yarmi 5 ta mijozda! <b>Birontasi ketsa kassaga jiddiy zarba.</b> Mijozlar bazasini diversifikatsiya qiling.')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Top 10:</b> Eng katta 10 ta mijozning umumiy MRRdagi ulushi.<br>
        <b>⚠️ Risk:</b> Konsentratsiya yuqori bo'lsa, yirik mijoz bilan munosabat buzilishi butun kompaniya moliyaviy holatini buzadi. <b>Har bir yirik mijozga alohida Account Manager biriktiring.</b>
      </div>`,

    'ltv': `<h4 class="mb-2.5">💎 LTV — Customer Lifetime Value</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Bitta mijoz <b>kompaniyangiz bilan hamkorlik davomida jami qancha daromad</b> olib kelishini bashorat qiladi. LTV = ARPA ÷ Oylik Churn Rate.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi ($5,000+):</b> Har bir mijoz uzoq muddatli va <b>juda qimmatli.</b> Investorlarga juda yoqadigan ko\'rsatkich.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha ($2,000-$5,000):</b> Mijozlar o\'rtacha muddatda qolishmoqda. <b>Retention strategiyangizni kuchaytiring.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<$2,000):</b> Mijozlar tez ketmoqda yoki kam to\'lamoqda. <b>Mahsulot qiymatini oshiring yoki churnni kamaytiring.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Formula:</b> ARPA ÷ Oylik Churn Rate<br>
        <b>LTV:CAC nisbati:</b> Ideal holda LTV kamida CAC dan <b>3x</b> katta bo'lishi kerak.<br>
        <b>⚠️ Risk:</b> LTV past bo'lsa, yangi mijoz jalb qilish xarajatlari (CAC) o'zini oqlamaydi — har bir yangi sotuv zarar keltiradi.
      </div>`,

    'qr': `<h4 class="mb-2.5">⚡ SaaS Quick Ratio</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Biznesning <b>o'sish samaradorligini</b> o'lchaydi. Quick Ratio = (New MRR + Expansion) ÷ (Churn + Contraction). Kiruvchi daromad chiquvchidan qancha ustun ekanligini ko'rsatadi.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (4x va yuqori):</b> Har $1 yo\'qotishga $4+ kirib kelmoqda. <b>Biznes juda sog\'lom va tez o\'smoqda.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (2-4x):</b> O\'sish bor, lekin <b>churnga e\'tibor qaratish kerak.</b> Biznes barqaror, lekin ideal emas.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<2x):</b> Yo\'qotish o\'sishni yeb turibdi! Har $1 kirimga deyarli $0.5+ chiqim. <b>Tezda churn va contraction sabablarini aniqlang.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Formula:</b> (New MRR + Expansion MRR) ÷ (Churned MRR + Contraction MRR)<br>
        <b>⚠️ Risk:</b> Quick Ratio 1x dan past bo'lsa — biznes qisqarmoqda. Har oyda oldingi oydan kam pul kirib keladi.
      </div>`,

    'grr': `<h4 class="mb-2.5">🛡️ GRR — Gross Revenue Retention</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed"><b>Mavjud mijozlardan daromadning saqlanish</b> darajasi — faqat yo'qotishlar hisobga olinadi (Expansion <b>kirmaydi</b>). GRR = (Oldingi MRR − Churn − Contraction) ÷ Oldingi MRR.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (≥ 95%):</b> Mavjud mijozlardan daromad deyarli <b>to\'liq saqlanmoqda.</b> Churn va contraction minimal — eng sog\'lom holat.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (85–95%):</b> Har oyda biroz daromad yo\'qolmoqda. <b>Churn yoki contraction kuchaymoqda</b> — sabablarni aniqlang.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (< 85%):</b> Mavjud bazadan jiddiy daromad yo\'qolmoqda! <b>Retention strategiyasini zudlik bilan ko\'rib chiqing.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>GRR vs NRR:</b> NRR Expansion ni ham hisoblaydi, GRR esa faqat yo'qotishlarni ko'rsatadi. GRR har doim NRR dan ≤.<br>
        <b>Formula:</b> (Oldingi MRR − Churn MRR − Contraction MRR) ÷ Oldingi MRR × 100<br>
        <b>⚠️ Risk:</b> GRR past bo'lsa, Expansion bilan yashirinadi — NRR yaxshi ko'rinsa ham aslida mijozlar bazasi yemirilmoqda.
      </div>`,

    'lc': `<h4 class="mb-2.5">🔄 Logo vs Revenue Churn</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed"><b>Logo Churn</b> — ketgan mijozlar soni (%). <b>Revenue Churn</b> — yo'qotilgan daromad (%). Ikkalasini qiyoslash muhim chunki farq katta bo'lishi mumkin.</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Logo Churn <b>< 3%</b>, Revenue Churn <b>< 2%.</b> Mijozlar ham, daromad ham barqaror.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Logo Churn <b>3-5%</b>, Revenue Churn <b>2-5%.</b> Churn boshqaruvi kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Logo Churn <b>> 5%</b> yoki Revenue Churn <b>> 5%.</b> Jiddiy mijoz yo\'qotish. <b>Sabab tahlili zudlik bilan kerak.</b>')}
      </div>
      <div class="text-[11.5px] leading-relaxed text-muted">
        <b>Logo > Revenue:</b> Ko'p kichik mijozlar ketmoqda, lekin yiriklari qolmoqda — <b>Revenue Concentration</b> xavfi oshadi.<br>
        <b>Logo < Revenue:</b> Kam, lekin <b>yirik mijozlar</b> ketmoqda — bu eng xavfli stsenariy!<br>
        <b>⚠️ Risk:</b> Revenue Churn yuqori, Logo Churn past bo'lsa — portfelingizning eng qimmatli qismi ketayotganini anglatadi.
      </div>`,

    'cur_mrr': `<h4 class="mb-2.5">📊 Current MRR — Joriy Oylik Daromad</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Ushbu mijozning hozirgi <b>faol shartnomalaridan keladigan oylik doimiy daromad</b>. Shartnoma summasi ÷ muddat (oy) asosida hisoblanadi.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Σ (Shartnoma summasi ÷ Muddat oylari) — faqat faol shartnomalar</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> MRR barqaror yoki o\'sib borsa — mijoz faol va xizmatdan mamnun.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> MRR pasaygan — shartnoma tugagan yoki qisqartirilgan bo\'lishi mumkin.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> MRR = 0 — mijoz churn holatida. Qayta jalb qilish strategiyasi kerak.')}
      </div>`,

    'total_cv': `<h4 class="mb-2.5">💰 Total Contract Value — Jami Shartnoma Qiymati</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijoz bilan tuzilgan <b>barcha shartnomalar (asosiy + qo'shimcha)</b> umumiy summasi. Bu mijozning <b>butun umr davomidagi shartnoma hajmi</b>ni ko'rsatadi.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Σ (Barcha shartnomalar summasi)</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Jami qiymat oshib borsa — mijoz yangi shartnomalar tuzmoqda, expansion mavjud.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Faqat bitta shartnoma — kengayish imkoniyatlarini qidiring.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Shartnoma qiymati past va oshmaganiga — mijoz cheklangan yoki xizmatdan to\'liq foydalanmayapti.')}
      </div>`,

    'total_paid': `<h4 class="mb-2.5">💵 Total Paid — Jami To'langan Summa</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijoz tomonidan <b>haqiqatda to'langan barcha summalar</b>. Naqd, karta va bank o'tkazmalari kiritiladi. Bu real pul oqimini ko'rsatadi.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Σ (Barcha to'lovlar summasi)</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> To\'langan summa shartnoma qiymatiga yaqin — mijoz o\'z vaqtida to\'lamoqda.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> To\'langan < 70% shartnoma — qisman qarzdorlik mavjud.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> To\'langan < 50% — jiddiy qarzdorlik! Inkasso jarayonini boshlash kerak.')}
      </div>`,

    'outstanding': `<h4 class="mb-2.5">⚖️ Outstanding Balance — Qoldiq Qarz</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijoz <b>to'lashi kerak bo'lgan qolgan summa</b>. Total Contract Value dan Total Paid ayirmasi. Oy oxirigacha kutilgan to'lov alohida ko'rsatiladi.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Jami Shartnoma − Jami To'langan</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Qoldiq 0 yoki juda kam — mijoz to\'lovda intizomli.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Qoldiq mavjud lekin grafik bo\'yicha — kuzatishda davom eting.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Katta qoldiq + muddati o\'tgan to\'lovlar — mijoz bilan shoshilinch muloqot kerak.')}
      </div>`,

    'health': `<h4 class="mb-2.5">🏥 Health Score — Sog'liq Balli</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijozning <b>umumiy holatini 100 ballik shkalada</b> baholaydi. Qarzdorlik, shartnoma muddati, va hamkorlik davomiyligiga asoslanadi.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> 100 dan boshlab: qarz bo'lsa −30, shartnoma tugashiga <30 kun −20, hamkorlik <6 oy −10, expired −40</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Healthy (80-100):</b> Mijoz sog\'lom — to\'lovda intizomli, shartnoma faol, uzoq muddatli hamkorlik.')}
        ${bx('#f0b020','🟡','<b>Warning (50-79):</b> Ba\'zi muammolar — qarzdorlik yoki shartnoma muddati tugashiga yaqin. E\'tibor kerak.')}
        ${bx('#e74c3c','🔴','<b>Critical (<50):</b> Jiddiy xavf — katta qarz, shartnoma tugagan yoki boshqa muammolar. Darhol harakat kerak.')}
      </div>`,

    'pay_rate': `<h4 class="mb-2.5">📈 Payment Rate — To'lov Foizi</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijoz <b>shartnoma summasining necha foizini to'laganligini</b> ko'rsatadi. 100% — to'liq to'langan.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> (Jami To'langan ÷ Jami Shartnoma Qiymati) × 100%</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (80%+):</b> Mijoz asosan to\'lovda — intizomli, ishonchli hamkor.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (50-80%):</b> O\'rtacha to\'lov — eslatmalar va monitoring kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<50%):</b> Jiddiy to\'lov orqada qolishi! Inkasso yoki muloqot kerak.')}
      </div>`,

    'days_exp': `<h4 class="mb-2.5">⏳ Days to Expiry — Tugashga Qolgan Kunlar</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijozning <b>eng oxirgi faol shartnomasi tugashiga qancha kun</b> qolganligini ko'rsatadi. Renewal rejasini oldindan tuzish uchun muhim.</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Shartnoma tugash sanasi − Bugungi sana (kunlarda)</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi (90+ kun):</b> Vaqt yetarli — shoshilmasdan renewal tayyorlash mumkin.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (30-90 kun):</b> Tez orada tugaydi — mijoz bilan renewal muloqotini boshlang.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<30 kun / Expired):</b> Zudlik bilan harakat! Shartnoma tugaydi yoki allaqachon tugagan.')}
      </div>`,

    'avg_monthly': `<h4 class="mb-2.5">💳 Avg. Monthly Payment — O'rtacha Oylik To'lov</h4>
      <div class="text-[12.5px] text-muted mb-3.5 leading-relaxed">Mijozning <b>jami to'lovlarini hamkorlik oylariga bo'lgandagi o'rtacha</b>. ARPA ga o'xshash lekin bu real to'lovlarga asoslanadi (shartnomaga emas).</div>
      <div class="text-[11.5px] leading-relaxed text-muted mb-3.5"><b>Formula:</b> Jami To'langan ÷ Hamkorlik oylari soni</div>
      <div class="mb-3.5">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> O\'rtacha oylik to\'lov oylik shartnoma summasiga teng yoki yuqori — mijoz intizomli.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> O\'rtacha to\'lov shartnomadan biroz past — ba\'zi oylarda kechikish bo\'lgan.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> O\'rtacha to\'lov shartnomadan ancha past — tizimli qarzdorlik mavjud.')}
      </div>`
  };
  const aiBtn=`<button class="btn w-100 p-2 mt-3 text-[12px]" style="background:var(--accent-bg);border:1px solid var(--accent);color:var(--accent)" onclick="aiRecommend('${k}')">💡 Yaxshilash bo'yicha tavsiya</button>`;
  o.innerHTML=`<div class="modal max-w-[440px]">${d[k]||''}${d[k]?aiBtn:''}<div class="mt-4"><button class="btn btn-primary w-100 p-2.5" onclick="this.closest('.overlay').remove()">Tushunarli</button></div></div>`;
  document.body.appendChild(o);
}

function rD(){
const dr=dashRange();
const {labels,totals,cpmArr,newPerPt,churnPerPt,addedMRR,lostMRR,newClients,churnClients,expClients,baseMRR,baseClients,cashIn,cashInBreak}=dr;
const tot=S.rows.length,clients=[...new Set(S.rows.map(r=>r.Client).filter(Boolean))];
const curMRR=totals[totals.length-1]||0,startMRR=baseMRR||0;
const mrrDelta=curMRR-startMRR,mrrPct=startMRR?Math.round(mrrDelta/startMRR*100):0;
const totalNew=newClients.length,totalRechurn=newClients.filter(c=>c.isRechurn).length,totalChurn=churnClients.length;
const curClients=cpmArr[cpmArr.length-1]||0,startClients=baseClients||0,clientDelta=curClients-startClients;
const clientPct = startClients ? Math.round((clientDelta/startClients)*100) : 0;
const clientPctStr = clientDelta > 0 ? `(+ ${clientPct}%)` : (clientDelta < 0 ? `(${clientPct}%)` : `(0%)`);
const mrrFromNew=newClients.reduce((s,c)=>s+c.mrr,0),mrrFromChurn=churnClients.reduce((s,c)=>s+c.mrr,0);
const mrrExpansion=expClients.reduce((s,c)=>s+c.delta,0);
const mrrFromRechurn=newClients.filter(c=>c.isRechurn).reduce((s,c)=>s+c.mrr,0);
const expColor=mrrExpansion>=0?'#0e7c7b':'#a36207';const periodLabel=labels.length>1?labels[0]+'–'+labels[labels.length-1]:labels[0]||'';
const pre=S.dashPre||'y';
const isWk=pre==='w';
return`<div class="flex gap-1 flex-wrap mb-4 items-center">
<div class="wk-pick-wrap"><button class="btn${isWk?' btn-primary':''} py-[5px] px-3 text-[11.5px]" onclick="toggleWeekPicker(this)">Hafta${isWk?' <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-left:2px"><polyline points="6 9 12 15 18 9"/></svg>':''}</button></div>
<button class="btn${pre==='p'?' btn-primary':''} py-[5px] px-3 text-[11.5px]" onclick="showPeriodPicker()">Davr</button>
<div class="flex gap-1 items-center ml-1">
<input type="date" class="flt text-[11px] p-[5px]" value="${dateStr(S.dashFrom)}" onchange="S.dashPre='c';S.dashFrom=toDate(this.value);clearCache();render()">
<span class="text-subtle">→</span>
<input type="date" class="flt text-[11px] p-[5px]" value="${dateStr(S.dashTo)}" onchange="S.dashPre='c';S.dashTo=toDate(this.value);clearCache();render()">
</div>
<span class="text-[10.5px] text-subtle ml-1">${dr.gran==='day'?'kunlik':'oylik'}</span>
<div class="flex items-center gap-1.5" style="margin-left:auto">
<button class="btn" onclick="showDashSettingsModal()" title="Dashboard sozlamalari"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>
<button class="btn" onclick="showReportModal()" title="PDF hisobot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
<button class="btn" onclick="if(S.config)loadFromConfig(S.config);else showConfig()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1 -2.12-9.36L23 10"/></svg></button>
</div>
</div>
<div class="metrics">
${(()=>{
  const c=S.dashCards||{}; let h='';
  const mrrExp=expClients.filter(x=>x.delta>0).reduce((s,x)=>s+x.delta,0);
  const mrrCon=expClients.filter(x=>x.delta<0).reduce((s,x)=>s+Math.abs(x.delta),0);
  const nrrVal=startMRR>0?((startMRR+mrrExp-mrrCon-mrrFromChurn)/startMRR)*100:0;
  const churnRate=startClients>0?(totalChurn/startClients)*100:0;
  const arpa=curClients>0?Math.round(curMRR/curClients):0;
  const sArpa=startClients>0?Math.round(startMRR/startClients):0; const arpaD=arpa-sArpa;
  const arpaPct=sArpa>0?Math.round((arpaD/sArpa)*100):0;
  const netExp=mrrExp-mrrCon;
  
  if(c.mrr?.s) h+=`<div class="metric c1"><div class="metric-head"><div class="metric-lbl">MRR</div><span class="metric-info" onclick="showMetricInfo('mrr')">i</span></div>
  <div class="flex items-baseline gap-2"><div class="metric-val anim-val" data-val="${curMRR}" data-fmt="2">0</div>
  ${c.mrr.g?`<div class="metric-foot"><span class="${mrrDelta>=0?'up':'dn'}">${mrrDelta>=0?'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} $${fk(Math.abs(mrrDelta))} (${mrrPct>0?'+':''}${mrrPct}%)</span></div>`:''}</div>
  ${c.mrr.arr?`<div class="metric-foot mt-1.5">ARR: <span class="mono text-primary">$${fk(curMRR*12)}</span></div>`:''}</div>`;
  
  if(c.nrr?.s) h+=`<div class="metric c5"><div class="metric-head"><div class="metric-lbl">NRR</div><span class="metric-info" onclick="showMetricInfo('nrr')">i</span></div>
  <div class="flex items-baseline gap-2"><div class="metric-val">${nrrVal.toFixed(1)}</div><span class="text-base font-semibold text-primary -ml-1">%</span></div>
  <div class="flex gap-5 mt-3 pt-3 border-t border-brd">
  ${c.nrr.n?`<div><div class="text-[10px] text-subtle mb-0.5 uppercase tracking-[0.5px]">New</div><div class="up font-semibold text-xs font-mono">+$${fk(mrrFromNew)}</div></div>`:''}
  ${c.nrr.e?`<div><div class="text-[10px] text-subtle mb-0.5 uppercase tracking-[0.5px]">Net Exp</div><div class="${netExp>=0?'up':'dn'} font-semibold text-xs font-mono">${netExp>=0?'+':''}$${fk(netExp)}</div></div>`:''}
  ${c.nrr.c?`<div><div class="text-[10px] text-subtle mb-0.5 uppercase tracking-[0.5px]">Churn</div><div class="dn font-semibold text-xs font-mono">-$${fk(mrrFromChurn)}</div></div>`:''}</div></div>`;

  // GRR — Gross Revenue Retention (saqlanish, Expansion hisobga olinmaydi)
  if(c.nrr?.s){
    const grrVal=dr.grr||0;
    const grrCol=grrVal>=95?'var(--green)':grrVal>=85?'var(--amber)':'var(--red)';
    h+=`<div class="metric c4"><div class="metric-head"><div class="metric-lbl">GRR</div><span class="metric-info" onclick="showMetricInfo('grr')">i</span></div>
    <div class="flex items-baseline gap-2"><div class="metric-val" style="color:${grrCol}">${grrVal.toFixed(1)}</div><span class="text-base font-semibold text-primary -ml-1">%</span></div>
    <div class="metric-foot mt-2 text-[10.5px] text-subtle">Churn + Contraction yo'qotish</div></div>`;
  }
  
  if(c.cust?.s) h+=`<div class="metric c2"><div class="metric-head"><div class="metric-lbl">Active Customers</div><span class="metric-info" onclick="showMetricInfo('cust')">i</span></div>
  <div class="flex items-baseline gap-2"><div class="metric-val anim-val" data-val="${curClients}">0</div>
  ${c.cust.g?`<div class="metric-foot"><span class="${clientDelta>=0?'up':'dn'}">${clientDelta>=0?'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} ${Math.abs(clientDelta)} ${clientPctStr}</span></div>`:''}</div>
  <div class="metric-foot mt-1.5">${c.cust.ch?`Churn Rate: <span class="mono" style="color:${churnRate>5?'var(--red)':'var(--text)'}">${churnRate.toFixed(1)}%</span>`:''}</div></div>`;
  
  if(c.arpa?.s) h+=`<div class="metric c3"><div class="metric-head"><div class="metric-lbl">ARPA</div><span class="metric-info" onclick="showMetricInfo('arpa')">i</span></div>
  <div class="flex items-baseline gap-2"><div class="metric-val anim-val" data-val="${arpa}" data-fmt="2">0</div>
  ${c.arpa.g?`<div class="metric-foot"><span class="${arpaD>=0?'up':'dn'}">${arpaD>=0?'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg class="w-2.5 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} $${fk(Math.abs(arpaD))} (${arpaPct>0?'+':''}${arpaPct}%)</span></div>`:''}</div></div>`;
  
  if(c.cac?.s) {
    const cacVal = Math.round(dr.cac||0);
    h+=`<div class="metric c4"><div class="metric-head"><div class="metric-lbl">CAC</div><span class="metric-info" onclick="showMetricInfo('cac')">i</span></div>
    <div class="flex items-baseline gap-1.5"><div class="metric-val anim-val" data-val="${cacVal}" data-fmt="2">0</div><span class="text-[13px] text-subtle">USD</span></div>
    <div class="metric-foot mt-1.5 text-[10px] text-subtle">Mijoz jalb qilish narxi</div></div>`;
  }
  
  if(c.cash?.s!==false) h+=`<div class="metric c6"><div class="metric-head"><div class="metric-lbl">Net Cash In</div><span class="metric-info" onclick="showMetricInfo('cash')">i</span></div>
  <div class="flex items-baseline gap-2"><div class="metric-val anim-val" data-val="${cashIn}" data-fmt="2">0</div><span class="text-base font-semibold text-primary -ml-1">USD</span></div>
  <div class="flex gap-[15px] mt-3 pt-3 border-t border-brd">
    <div><div class="text-[9px] text-subtle mb-0.5 uppercase tracking-[0.5px]">Cash</div><div class="font-semibold text-[11.5px] font-mono">$${fk(cashInBreak.naqd)}</div></div>
    <div><div class="text-[9px] text-subtle mb-0.5 uppercase tracking-[0.5px]">Card</div><div class="font-semibold text-[11.5px] font-mono">$${fk(cashInBreak.karta)}</div></div>
    <div><div class="text-[9px] text-subtle mb-0.5 uppercase tracking-[0.5px]">Bank</div><div class="font-semibold text-[11.5px] font-mono">$${fk(cashInBreak.bank)}</div></div>
  </div></div>`;





  if(c.qr?.s) {
    const qrVal = dr.quickRatio||0;
    const qrDisp = qrVal >= 99 ? '∞' : qrVal.toFixed(1);
    const qrColor = qrVal >= 4 ? 'var(--green)' : qrVal >= 2 ? 'var(--amber)' : 'var(--red)';
    h+=`<div class="metric c1"><div class="metric-head"><div class="metric-lbl">SaaS Quick Ratio</div><span class="metric-info" onclick="showMetricInfo('qr')">i</span></div>
    <div class="flex items-baseline gap-1.5"><div class="metric-val" style="color:${qrColor}">${qrDisp}</div><span class="text-[13px] text-subtle">x</span></div>
    <div class="metric-foot mt-1.5 text-[10px] text-subtle">O'sish / Yo'qotish nisbati</div></div>`;
  }


  
  return h;
})()}
</div>

${(()=>{
  const c=S.dashCards||{}; let h='';
  if(c.chTrend?.s!==false || c.chComp?.s!==false){
    h+=`<div class="grid-2 mt-5 mb-5">`;
    if(c.chTrend?.s!==false) h+=`<div class="card"><div class="card-head mb-3 uppercase tracking-[1px] text-[11px] text-subtle font-semibold">TOTAL MRR TREND</div><div class="card-body"><div class="chart-wrap h-[320px]"><canvas id="chTrend"></canvas></div></div></div>`;
    if(c.chComp?.s!==false) h+=`<div class="card"><div class="card-head mb-3 uppercase tracking-[1px] text-[11px] text-subtle font-semibold">MRR COMPONENTS</div><div class="card-body"><div class="chart-wrap h-[320px]"><canvas id="chComponents"></canvas></div></div></div>`;
    h+=`</div>`;
  }
  
  // === MRR GROWTH + NET MOVEMENT (side by side) ===
  const showGr = c.cMrrGr?.s!==false && dr.mrrGrowthPcts.length>1;
  const showNm = c.cNetMov?.s!==false;
  if(showGr || showNm){
    h+=`<div class="grid-2 mt-3.5">`;

    // MRR GROWTH RATE SPARKLINE
    if(showGr){
      const pcts=dr.mrrGrowthPcts;
      const maxAbs=Math.max(...pcts.map(p=>Math.abs(p)),1);
      h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-accent"></span>MRR Growth Rate (%)</span></div>
      <div class="card-body flex items-end gap-[3px] h-[80px] py-3 px-4">`;
      pcts.forEach((p,i)=>{
        const noData = i===0 && p===0;
        const h2=Math.max(4,Math.abs(p)/maxAbs*60);
        const col=noData?'var(--border2)':p>0?'var(--green)':p<0?'var(--red)':'var(--border2)';
        const tip=noData?`${dr.labels[i]}: ma'lumot yo'q`:`${dr.labels[i]}: ${p>0?'+':''}${p}%`;
        h+=`<div title="${tip}" style="flex:1;height:${h2}px;background:${col};border-radius:3px 3px 0 0;min-width:6px;cursor:help;transition:all .2s;opacity:${noData?0.4:1}"></div>`;
      });
      h+=`</div><div class="flex justify-between px-4 pb-2.5 text-[9.5px] text-subtle"><span>${dr.labels[1]||''}</span><span>${dr.labels[dr.labels.length-1]||''}</span></div></div>`;
    }

    // NET MRR MOVEMENT WATERFALL
    if(showNm){
      const nm=dr.netMovement;
      const nciLabel = nm.newClientIntraExp>0 ? ` <span title="Yangi mijozlarning davr ichida qo'shgan qo'shimcha shartnomasi: +${fmt(nm.newClientIntraExp)}" class="text-[9px] text-subtle cursor-help">+NCI</span>` : '';
      const items=[
        {label:'Yangi',val:nm.newMRR,col:'var(--green)',sign:'+'},
        {label:`Kengayish${nciLabel}`,val:nm.expMRR,col:'var(--teal)',sign:'+'},
        {label:'Churn',val:nm.churnMRR,col:'var(--red)',sign:'-'},
        {label:'Contraction',val:nm.conMRR,col:'var(--amber)',sign:'-'}
      ];
      const maxV=Math.max(...items.map(x=>x.val),1);
      h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-accent2"></span>Net MRR Movement <span style="color:${nm.net>=0?'var(--green)':'var(--red)'};font-weight:700">${nm.net>=0?'+':''}${fmt(nm.net)}</span></span></div>
      <div class="card-body py-3.5 px-[18px]">`;
      items.forEach(it=>{
        const w=Math.max(4,Math.round(it.val/maxV*100));
        h+=`<div class="flex items-center gap-2.5 mb-2">
          <div class="w-20 text-[11px] text-muted">${it.label}</div>
          <div class="flex-1 bg-hover rounded-[4px] h-[18px] overflow-hidden">
            <div style="width:${w}%;height:100%;background:${it.col};border-radius:4px;transition:width .5s"></div>
          </div>
          <div class="mono" style="width:70px;text-align:right;font-size:11.5px;font-weight:600;color:${it.col}">${it.sign}${fmt(it.val)}</div>
        </div>`;
      });
      h+=`</div></div>`;
    }

    h+=`</div>`;
  }

  if(c.tNew?.s!==false || c.tChurn?.s!==false){
    h+=`<div class="grid-2 mt-3.5">`;
    if(c.tNew?.s!==false) h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-success"></span>New (${totalNew}) <span style="color:var(--green);font-weight:600">+${fmt(mrrFromNew)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:340px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="text-r">MRR</th></tr></thead><tbody>${newClients.length?newClients.map(c=>{return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td class="font-semibold text-xs">'+cl(c.name)+'</td><td class="col-hide text-[11px] text-muted">'+(c.mgr||'—')+'</td><td class="text-r mono" style="color:var(--green);font-weight:600">+'+fmt(c.mrr)+'</td></tr>'}).join(''):'<tr><td colspan="4" class="text-center text-subtle p-5">—</td></tr>'}</tbody></table></div></div>`;
    if(c.tChurn?.s!==false) h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--red)"></span>Churn (${totalChurn}) <span style="color:var(--red);font-weight:600">-${fmt(mrrFromChurn)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:340px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="text-r">MRR</th></tr></thead><tbody>${churnClients.length?churnClients.map(c=>{const badge = c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''; return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="col-hide text-[11px] text-muted">'+(c.mgr||'—')+'</td><td class="text-r mono" style="color:var(--red);font-weight:600">-'+fmt(c.mrr)+'</td></tr>'}).join(''):'<tr><td colspan="4" class="text-center text-subtle p-5">—</td></tr>'}</tbody></table></div></div>`;
    h+=`</div>`;
  }

  if(c.tExp?.s!==false){
    const expansions = expClients.filter(x=>x.delta > 0);
    const contractions = expClients.filter(x=>x.delta < 0);
    const mrrExpOnly = expansions.reduce((s,x)=>s+x.delta,0);
    const mrrConOnly = contractions.reduce((s,x)=>s+Math.abs(x.delta),0);

    h+=`<div class="grid-2 mt-3.5">`;
    // EXPANSION TABLE
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-tw-teal"></span>Expansion (${expansions.length}) <span style="color:var(--green);font-weight:600">+${fmt(mrrExpOnly)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="text-r">Oldin</th><th class="text-r">Hozir</th><th class="text-r">Farq</th></tr></thead><tbody>${expansions.length?expansions.map(c=>{const badge = (c.isRes?' <span class="badge b-amber" style="font-size:8px;padding:1px 4px">Q</span>':'') + (c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''); return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="text-r mono text-[11px] text-subtle">'+fmt(c.mrrStart)+'</td><td class="text-r mono text-[11px]">'+fmt(c.mrrEnd)+'</td><td class="text-r mono" style="font-size:11px;font-weight:600;color:var(--green)">+'+fmt(c.delta)+'</td></tr>'}).join(''):'<tr><td colspan="5" class="text-center text-subtle p-5">—</td></tr>'}</tbody></table></div></div>`;
    
    // CONTRACTION TABLE
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-warn"></span>Contraction (${contractions.length}) <span style="color:var(--red);font-weight:600">-${fmt(mrrConOnly)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="text-r">Oldin</th><th class="text-r">Hozir</th><th class="text-r">Farq</th></tr></thead><tbody>${contractions.length?contractions.map(c=>{const badge = c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''; return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="text-r mono text-[11px] text-subtle">'+fmt(c.mrrStart)+'</td><td class="text-r mono text-[11px]">'+fmt(c.mrrEnd)+'</td><td class="text-r mono" style="font-size:11px;font-weight:600;color:var(--red)">-'+fmt(Math.abs(c.delta))+'</td></tr>'}).join(''):'<tr><td colspan="5" class="text-center text-subtle p-5">—</td></tr>'}</tbody></table></div></div>`;
    h+=`</div>`;
  }
  h+=`</div>`;






  
  return h;
})()}`}

// === PAGE TABS HELPER ===
function _pageTabs(tabs,cur,key){
  return`<div class="page-tabs">${tabs.map(t=>`<button class="ptab${cur===t.v?' on':''}" onclick="S.${key}='${t.v}';clearCache();render()">${t.l}</button>`).join('')}</div>`;
}

// === CONTRACTS BODY (shared: used in rC and rCl shartnomalar view) ===
function _rCBody(){
const pm=calcPayments();const qm={};
S.qRows.forEach(r=>{const c=r.Client?.trim(),sh=r.raqami?.trim();if(!c||!sh)return;const k=c+'|'+sh;qm[k]=(qm[k]||0)+pn(r['sum USD'])});
let d=[...S.rows].sort((a,b)=>{const da=pd(a.sanasi),db=pd(b.sanasi);return(db||0)-(da||0)});
if(S.cQ){const q=S.cQ.toLowerCase();d=d.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q)||(r.INN||'').includes(q))}
if(S.cS)d=d.filter(r=>sc(r.status)===S.cS);if(S.cM)d=d.filter(r=>r.Manager===S.cM);if(S.cR)d=d.filter(r=>r.Hudud===S.cR);
const t=d.length,pg=Math.ceil(t/S.cN),sl=d.slice(S.cP*S.cN,(S.cP+1)*S.cN);
const so=[{v:'',l:'Barcha'},{v:'A',l:'Aktiv'},{v:'D',l:'Bajarildi'},{v:'Q',l:'Eski qarz'},{v:'P',l:'Muammo'},{v:'O',l:'Ortiqcha'},{v:'X',l:'Bekor'}];
const hasPay=S.payRows.length||S.y2024Rows.length||S.perevodRows.length;
const view=S.cView||'royyat';
let h=_pageTabs([{v:'royyat',l:"Ro'yxat"},{v:'qoshimcha',l:"Qo'shimcha"},{v:'muddatlar',l:'Muddatlar'}],view,'cView');

if(view==='muddatlar'){
  // Extended renewal calendar: 90 days ahead + 30 days expired
  const now=new Date();const rnMap={};
  [...S.rows,...S.qRows].forEach(r=>{
    if(!r.Client)return;const musd=r._mUSD||pn(r['Oylik USD'])||0;if(musd<=0)return;
    const en=pd(r['amal qilishi']);if(!en)return;
    const name=r.Client;
    if(!rnMap[name])rnMap[name]={name,endDate:en,mrr:0,mgr:r.Manager||'',firma:r['Firma nomi']||'',inn:r.INN||''};
    rnMap[name].mrr+=musd;
    if(!rnMap[name].firma&&r['Firma nomi'])rnMap[name].firma=r['Firma nomi'];
    if(!rnMap[name].inn&&r.INN)rnMap[name].inn=r.INN;
    if(en<rnMap[name].endDate){rnMap[name].endDate=en;rnMap[name].mgr=r.Manager||''}
  });
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const rnAll=Object.values(rnMap).map(c=>({...c,daysLeft:Math.round((c.endDate-today)/864e5)})).filter(c=>c.daysLeft<=7&&c.daysLeft>=-7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const ctExp=rnAll.filter(r=>r.daysLeft<0).length,ctAhead=rnAll.filter(r=>r.daysLeft>=0).length;
  h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-warn"></span>Muddat Kalendari (±7 kun) — <span class="text-success font-bold">${ctAhead}</span> tugayotgan${ctExp?` / <span class="text-subtle">${ctExp} tugagan</span>`:''}</span></div>
  <div class="card-body dash-new-full p-0"><div class="tbl-scroll max-h-[calc(100vh-220px)]"><table><thead><tr><th>Mijoz</th><th class="col-hide">Firma</th><th class="col-hide">Menejer</th><th class="text-r">MRR</th><th class="text-r">Qoldi</th></tr></thead><tbody>`;
  if(rnAll.length)rnAll.forEach(r=>{
    const expired=r.daysLeft<0;
    const dc=expired?'var(--text3)':r.daysLeft<=5?'var(--red)':r.daysLeft<=10?'var(--amber)':'var(--green)';
    const nm=expired?`<span class="opacity-60">${cl(r.name)}</span>`:cl(r.name);
    const dl=expired?`<span class="text-[10px] text-subtle">${Math.abs(r.daysLeft)} kun oldin</span>`:`${r.daysLeft} kun`;
    const firmaHtml=r.firma?r.firma+(r.inn?'<div class="text-[9px] text-subtle font-mono">'+r.inn+' <button onclick="navigator.clipboard.writeText(\''+r.inn+'\');showToast(\'Nusxalandi\',\'success\')" class="bg-transparent border-none cursor-pointer text-subtle p-0 text-[9px]">📋</button></div>':''):'—';
    h+=`<tr${expired?' class="opacity-50"':''}><td class="font-semibold text-xs">${nm}</td><td class="col-hide text-[11px] text-muted">${firmaHtml}</td><td class="col-hide text-[11px] text-muted">${r.mgr||'—'}</td><td class="text-r mono text-[11px]">${fmt(r.mrr)}</td><td class="text-r mono" style="font-size:11px;font-weight:700;color:${dc}">${dl}</td></tr>`;
  });else h+=`<tr><td colspan="5" class="text-center text-subtle p-5">Yaqinda tugaydigan shartnoma yo'q ✅</td></tr>`;
  h+=`</tbody></table></div></div></div>`;
}else if(view==='qoshimcha'){
  let qd=[...S.qRows].sort((a,b)=>{const da=pd(a.sanasi),db=pd(b.sanasi);return(db||0)-(da||0)});
  if(S.cQ){const q=S.cQ.toLowerCase();qd=qd.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q))}
  if(S.cR)qd=qd.filter(r=>r.Hudud===S.cR);
  const qt=qd.length;
  h+=`<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, firma..." value="${S.cQ}" oninput="onSearch('cQ',this.value)"><button class="search-clear" onclick="onSearch('cQ','');render()" type="button">&times;</button></div>
<select class="flt" onchange="S.cR=this.value;S.cP=0;clearCache();render()"><option value="">Barcha hududlar</option>${uq('Hudud').map(r=>`<option value="${r}"${S.cR===r?' selected':''}>${r}</option>`).join('')}</select>
<span class="text-[11px] text-subtle">${qt} ta kelishuv</span></div>`;
  h+=`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>№</th><th>Mijoz</th><th>Firma</th><th>Hudud</th><th>Sana</th><th>Tugash</th><th class="text-r">Tadbiq $</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th><th>Status</th></tr></thead><tbody>${qd.length?qd.map(r=>{
return`<tr><td class="mono text-[10px] text-subtle">${r.raqami||'—'}</td><td class="font-semibold">${r.Client?cl(r.Client):'—'}</td><td style="color:var(--text2);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${r['Firma nomi']||'—'}</td><td class="text-[11px]">${r.Hudud||'—'}</td><td class="mono" style="font-size:10.5px">${r.sanasi||'—'}</td><td class="mono" style="font-size:10.5px">${r['amal qilishi']||'—'}</td><td class="text-r mono">${pn(r['Tadbiq USD'])?fmt(pn(r['Tadbiq USD'])):'—'}</td><td class="text-r mono">${fmt(pn(r['Oylik USD']))}</td><td class="text-r mono">${fmt(pn(r['sum USD']))}</td><td>${sb(r.status||'')}</td></tr>`}).join(''):'<tr><td colspan="10" class="text-center text-subtle p-5">—</td></tr>'}</tbody></table></div></div>`;
}else{
  h+=`<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, firma, INN..." value="${S.cQ}" oninput="onSearch('cQ',this.value)"><button class="search-clear" onclick="onSearch('cQ','');render()" type="button">&times;</button></div>
<select class="flt" onchange="S.cS=this.value;S.cP=0;clearCache();render()">${so.map(o=>`<option value="${o.v}"${S.cS===o.v?' selected':''}>${o.l}</option>`).join('')}</select>
<select class="flt" onchange="S.cM=this.value;S.cP=0;clearCache();render()"><option value="">Barcha menejerlar</option>${uq('Manager').map(m=>`<option value="${m}"${S.cM===m?' selected':''}>${m}</option>`).join('')}</select>
<select class="flt" onchange="S.cR=this.value;S.cP=0;clearCache();render()"><option value="">Barcha hududlar</option>${uq('Hudud').map(r=>`<option value="${r}"${S.cR===r?' selected':''}>${r}</option>`).join('')}</select></div>`;
  h+=`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>№</th><th>Mijoz</th><th>Firma</th><th>Hudud</th><th>Sana</th><th>Tugash</th><th class="text-r">Tadbiq $</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th><th>Status</th></tr></thead><tbody>${sl.map(r=>{
const k=r.Client+'|'+r.raqami;const qExtra=qm[k]||0;const totalSum=r._sUSD+qExtra;
return`<tr><td class="mono text-[10px] text-subtle">${r.raqami||'—'}</td><td class="font-semibold">${r.Client?cl(r.Client):'—'}</td><td style="color:var(--text2);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${r['Firma nomi']||'—'}</td><td class="text-[11px]">${r.Hudud||'—'}</td><td class="mono" style="font-size:10.5px">${r.sanasi||'—'}</td><td class="mono" style="font-size:10.5px">${r['amal qilishi']||'—'}</td><td class="text-r mono">${r._tUSD?fmt(r._tUSD):'—'}</td><td class="text-r mono">${fmt(r._mUSD)}</td><td class="text-r mono">${fmt(totalSum)}${qExtra?'<span style="font-size:9px;color:var(--teal)"> +'+fmt(qExtra)+'</span>':''}</td><td>${sb(r.status)}</td></tr>`}).join('')}</tbody></table></div></div>${pag(S.cP,pg,t,S.cN,'cP')}`;
}
return h;
}

// === CONTRACTS ===
function rC(){
let d=[...S.rows].sort((a,b)=>{const da=pd(a.sanasi),db=pd(b.sanasi);return(db||0)-(da||0)});
if(S.cQ){const q=S.cQ.toLowerCase();d=d.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q)||(r.INN||'').includes(q))}
if(S.cS)d=d.filter(r=>sc(r.status)===S.cS);if(S.cM)d=d.filter(r=>r.Manager===S.cM);if(S.cR)d=d.filter(r=>r.Hudud===S.cR);
const t=d.length;
let h=`<div class="page-header" style="justify-content:flex-end"><button class="btn-outline py-[7px] px-[11px]" onclick="showDlMenu(this,'contracts')" title="Yuklab olish">${_dlSvg}</button></div>`;
return h+_rCBody();
}

// === MRR SUB-VIEW HELPERS ===
function _mrrToolbar(yr){
  return`<div class="toolbar mb-3 gap-2.5">
  <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, menejer, hudud..." value="${S.mrrQ||''}" oninput="onSearch('mrrQ',this.value)"><button class="search-clear" onclick="onSearch('mrrQ','');render()" type="button">&times;</button></div>
  <div class="flex gap-1">${[yr-1,yr,yr+1].map(y=>`<button class="btn${y===yr?' btn-primary':''} py-[7px] px-4 text-[13px] font-semibold" onclick="S.mrrYear=${y};clearCache();render()">${y}</button>`).join('')}</div>
  </div>`;
}



// === MRR TABLE ===
function rMRR(){
  const view=S.mrrView||'main';
const yr=S.mrrYear||2026;const d=mrrData(yr);const cumExp=calcCumExpected(yr);
const _pm=calcPayments();const clPay={};Object.values(_pm).forEach(v=>{clPay[v.client]=(clPay[v.client]||0)+v.total});
const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const cc=S.mrrCols;let filtered=[...d.clients];
if(S.mrrQ){const q=S.mrrQ.toLowerCase();filtered=filtered.filter(c=>c.name.toLowerCase().includes(q)||c.mgr.toLowerCase().includes(q)||(c.hudud||'').toLowerCase().includes(q))}
const colDefs=[{k:'mgr',l:'Manager'},{k:'hudud',l:'Hudud'},{k:'mrr',l:'MRR'},{k:'deal',l:'Deal boshi'},{k:'end',l:'Deal tugashi'}];
const setPanel=S.mrrSet?`<div class="mrr-set">${colDefs.map(c=>`<label><input type="checkbox" ${cc[c.k]?'checked':''} onchange="S.mrrCols.${c.k}=this.checked;render()">${c.l}</label>`).join('')}</div>`:'';
const exCols=(cc.mgr?1:0)+(cc.hudud?1:0)+(cc.mrr?1:0)+(cc.deal?1:0)+(cc.end?1:0);

return`<div id="mrrContainer"${S.mrrFs?' class="mrr-fs-active"':''}>
<div class="toolbar mb-3 gap-2.5">
<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, menejer, hudud..." value="${S.mrrQ||''}" oninput="onSearch('mrrQ',this.value)"><button class="search-clear" onclick="onSearch('mrrQ','');render()" type="button">&times;</button></div>
<div class="flex gap-1 items-center">
${[yr-1,yr,yr+1].map(y=>`<button class="btn${y===yr?' btn-primary':''} py-[7px] px-4 text-[13px] font-semibold" onclick="S.mrrYear=${y};clearCache();const sp=document.querySelector('.tbl-scroll');const sy=sp?sp.scrollTop:0;render();requestAnimationFrame(()=>{const s=document.querySelector('.tbl-scroll');if(s)s.scrollTop=sy;})"> ${y}</button>`).join('')}
</div>
<div class="ml-auto flex gap-1.5 items-center relative">
<button class="btn${S.mrrFs?' btn-primary':''} py-2 px-3" onclick="toggleMrrFullscreen()" title="${S.mrrFs?'Kichraytirish':'To\'liq ekran'}" id="mrrFsBtn">${S.mrrFs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'}</button>
<button class="btn${S.mrrSet?' btn-primary':''} py-2 px-3" onclick="S.mrrSet=!S.mrrSet;render()" title="Ustunlar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="3"/></svg></button>${S.mrrSet?`<div style="position:fixed;inset:0;z-index:19" onclick="S.mrrSet=false;render()"></div>`:''} ${setPanel}</div>
</div>

<div class="card shadow-lg"><div class="card-body p-0">
<div class="tbl-scroll">
<table class="mrr-tbl"><thead><tr>
<th class="sticky-col col-name">Mijoz nomi</th>
${cc.mgr?`<th>Menejer</th>`:''}
${cc.hudud?`<th>Hudud</th>`:''}
${cc.mrr?`<th class="text-r">MRR $</th>`:''}
${cc.deal?`<th class="text-c">Boshi</th>`:''}
${cc.end?`<th class="text-c">Tugashi</th>`:''}
${mos.map(m=>`<th class="mcell">${m}</th>`).join('')}
</tr></thead><tbody>
<tr class="summary-row row-mom"><td class="sticky-col col-name text-[10.5px] text-subtle">Month-over-Month %</td>${Array(exCols).fill('<td></td>').join('')}${d.mom.map(v=>{const c=v>0?'var(--green)':v<0?'var(--red)':'var(--text3)';return`<td class="mcell" style="color:${c}">${v?(v>0?'+':'')+v.toFixed(1)+'%':'—'}</td>`}).join('')}</tr>
<tr class="summary-row row-total"><td class="sticky-col col-name">Davr yig'indisi (JAMI)</td>${Array(exCols).fill('<td></td>').join('')}${d.totals.map(v=>`<td class="mcell text-primary">${v?fmt(v):'—'}</td>`).join('')}</tr>
${filtered.map(c=>{
const ce=cumExp[c.name];const paid=clPay[c.name]||0;
return`<tr>
<td class="sticky-col col-name">${cl(c.name)}</td>
${cc.mgr?`<td class="text-xs text-muted">${c.mgr||'—'}</td>`:''}
${cc.hudud?`<td class="text-xs text-muted">${c.hudud||'—'}</td>`:''}
${cc.mrr?`<td class="mono text-r font-semibold">${c.mrr?fmt(c.mrr):'—'}</td>`:''}
${cc.deal?`<td class="mono text-c text-subtle text-[11px]">${c.dealStart||'—'}</td>`:''}
${cc.end?`<td class="mono text-c text-subtle text-[11px]">${c.dealEnd||'—'}</td>`:''}
${c.monthly.map((v,m)=>{
if(!v)return'<td class="mcell mcell-0">—</td>';
let cls='mcell',tip='';
if(ce){const cur=ce.cum[m]||0;const prev=m>0?(ce.cum[m-1]||0):ce.preYear;
if(cur>0){const remaining=Math.round(cur-paid);const paidThisMonth=Math.round(paid-prev);
if(remaining<=1){cls='mcell mcell-g'}else if(paidThisMonth>0){cls='mcell mcell-y';tip=` data-tip="to'landi: ${fmt(paidThisMonth)} · qoldi: ${fmt(remaining)}"`}}}
return`<td class="${cls}"${tip}>${fmt(v)}</td>`}).join('')}
</tr>`}).join('')}
</tbody></table></div></div></div>
</div>`;
}

// === MANAGERS ===
function rM(){
  const mg=calcManagerAcquisition();
  if(!mg.length) return`<div class="flex flex-col items-center justify-center min-h-[300px] gap-3 text-subtle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><div class="text-sm font-semibold">Menejer ma'lumotlari topilmadi</div><div class="text-xs">Shartnomalar yuklanib, Manager ustuni to'ldirilganda bu sahifa faollashadi.</div></div>`;
  const tM=mg.reduce((s,x)=>s+x.initialMRR,0);
  const co=['#1746a2','#117a52','#c42b1c','#6941b8','#a36207','#0e7c7b','#d4537e','#5a5955','#854f0b','#993556'];
  const view=S.mgrView||'umumiy';
  let h='';
  h+=_pageTabs([{v:'umumiy',l:'Acquisition'},{v:'reyting',l:'MRR Harakati'}],view,'mgrView');

  if(view==='reyting'){
    const mb=calcManagerBoard();
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-accent2"></span>MRR Harakati Reytingi <span class="text-[10px] text-subtle font-normal ml-1.5">· tanlangan davr</span></span></div>
    <div class="card-body dash-new-full p-0"><div class="tbl-scroll max-h-[calc(100vh-220px)]"><table><thead><tr><th>#</th><th>Menejer</th><th class="text-r" title="Yangi mijozlardan kelgan MRR">Yangi</th><th class="text-r col-hide" title="Ketgan mijozlardan yo'qotilgan MRR">Churn</th><th class="text-r col-hide" title="Kengaygan shartnomalardan qo'shimcha MRR">Exp</th><th class="text-r col-hide" title="Qisqargan shartnomalardan kamaygan MRR">Con</th><th class="text-r" title="Yangi + Exp − Churn − Con">Sof MRR</th></tr></thead><tbody>`;
    mb.forEach((m,i)=>{
      const nc=m.netMRR>=0?'var(--green)':'var(--red)';
      h+=`<tr><td style="font-weight:700;color:var(--text3)">${i+1}</td><td class="font-semibold text-xs"><span class="mgr-link" onclick="showMgrStats('${m.name.replace(/'/g,"\\'")}')">${m.name}</span></td><td class="text-r"><span class="up mono text-[11px]">+${fmt(m.newMRR)}</span> <span style="font-size:9px;color:var(--text3)">(${m.newCount})</span></td><td class="text-r col-hide"><span class="dn mono text-[11px]">-${fmt(m.churnMRR)}</span> <span style="font-size:9px;color:var(--text3)">(${m.churnCount})</span></td><td class="text-r col-hide mono" style="font-size:11px;color:var(--green)">${m.expMRR>0?'+'+fmt(m.expMRR):'—'}</td><td class="text-r col-hide mono" style="font-size:11px;color:${m.conMRR>0?'var(--amber)':'var(--text3)'}">${m.conMRR>0?'-'+fmt(m.conMRR):'—'}</td><td class="text-r mono" style="font-weight:700;color:${nc}">${m.netMRR>=0?'+':''}${fmt(m.netMRR)}</td></tr>`;
    });
    h+=`</tbody></table></div></div></div>`;
  }else{
    h+=`<div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-accent"></span>Olib kelingan MRR ($)</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMM"></canvas></div></div></div>
    <div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-success"></span>Mijozlar soni</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMC"></canvas></div></div></div></div>
    <div class="tbl-wrap mt-3.5"><table><thead><tr><th>Menejer</th><th class="text-r">Mijozlar</th><th class="text-r">Olib kelgan MRR ($)</th><th class="text-r">O'rtacha</th><th>Ulush</th></tr></thead><tbody>${mg.map((x,i)=>{const p=tM?Math.round(x.initialMRR/tM*100):0;const av=x.clients?Math.round(x.initialMRR/x.clients):0;return`<tr><td class="font-semibold"><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${co[i%co.length]};margin-right:7px;vertical-align:middle"></span><span class="mgr-link" onclick="showMgrStats('${x.name.replace(/'/g,"\\'")}')">${x.name}</span></td><td class="text-r mono">${x.clients}</td><td class="text-r mono font-semibold">${fmt(x.initialMRR)}</td><td class="text-r mono">${fmt(av)}</td><td><div class="flex items-center gap-1.5"><div style="flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${p}%;background:${co[i%co.length]};border-radius:3px;transition:width .5s ease"></div></div><span class="mono" style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${p}%</span></div></td></tr>`}).join('')}</tbody></table></div>`;
  }
  return h;
}

// === CLIENTS ===
function rCl(){
const dr=dashRange();
const ch=calcClientHealth();
const view=S.clView||'shartnomalar';

let h='';

if(view==='tahlil'){
  const rg=calcRegionalPerf();
  const cq=calcCohorts();
  const maxMRR=Math.max(...rg.map(r=>r.mrr),1);
  const lVal=dr.ltv||0;
  const logoC=Math.round((dr.logoChurnRate||0)*10)/10;
  const revC=Math.round((dr.revenueChurnRate||0)*10)/10;
  h+=`<div class="grid-2">
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-tw-teal"></span>Hudud bo'yicha tahlil</span></div>
  <div class="card-body dash-new-full p-0 max-h-[400px] overflow-y-auto"><table><thead><tr><th>Hudud</th><th class="text-r">MRR</th><th></th><th class="text-r">Mijozlar</th></tr></thead><tbody>`;
  rg.forEach(r=>{const w=Math.round(r.mrr/maxMRR*100);const hn=JSON.stringify(r.name).replace(/"/g,'&quot;');h+=`<tr style="cursor:pointer" onclick="showRegionModal(${hn})" title="${r.name} mijozlarini ko'rish"><td class="font-semibold text-xs">${r.name}</td><td class="text-r mono text-[11px]">${fmt(r.mrr)}</td><td><div style="background:var(--bg3);border-radius:3px;height:12px;overflow:hidden"><div style="width:${w}%;height:100%;background:var(--teal);border-radius:3px"></div></div></td><td class="text-r font-semibold">${r.count}</td></tr>`;});
  h+=`</tbody></table></div></div>
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-tw-purple"></span>Mijozlar sadoqati (Retention)</span></div>
  <div class="card-body p-5">
    <div class="flex justify-between items-center mb-5">
      <div><div class="text-[11px] text-subtle mb-1">LOGO CHURN</div><div style="font-size:24px;font-weight:700;color:${logoC>5?'var(--red)':'var(--green)'}">${logoC}%</div></div>
      <div><div class="text-[11px] text-subtle mb-1">REV CHURN</div><div style="font-size:24px;font-weight:700;color:${revC>5?'var(--red)':'var(--green)'}">${revC}%</div></div>
      <div><div class="text-[11px] text-subtle mb-1">LTV</div><div class="text-2xl font-bold text-accent">${lVal>0?fmt(lVal)+'$':'N/A'}</div></div>
      ${dr.ltvCac>0?`<div><div class="text-[11px] text-subtle mb-1">LTV:CAC</div><div style="font-size:24px;font-weight:700;color:${dr.ltvCac>=3?'var(--green)':dr.ltvCac>=1?'var(--amber)':'var(--red)'}">${dr.ltvCac.toFixed(1)}x</div></div>`:''}
    </div>
    <div class="text-[11.5px] text-muted leading-normal p-3 bg-card rounded-lg">Mijozlar soni va daromad yo'qotish ko'rsatkichlari. LTV (Lifetime Value) - bir mijozdan kutiladigan jami daromad.</div>
  </div></div></div>`;
  if(cq.length){
    h+=`<div class="card mt-4"><div class="card-head"><span class="card-label"><span class="dot bg-accent"></span>Mijozlar sadoqati (Cohort Heatmap)</span></div>
    <div class="overflow-x-auto pb-2.5"><table class="u-table text-[11.5px] min-w-[800px] text-center">
    <thead><tr><th class="text-left w-[120px]">Kogort (Ulangan oyi)</th><th class="w-20">Mijozlar</th>`;
    let maxM=0;cq.forEach(d=>maxM=Math.max(maxM,d.months.length));
    for(let i=0;i<maxM;i++)h+=`<th>Oy ${i}</th>`;
    h+=`</tr></thead><tbody>`;
    cq.forEach(d=>{
      h+=`<tr><td class="text-left font-semibold bg-hover">${d.name}</td><td class="font-semibold">${d.total} ta</td>`;
      d.months.forEach((m,i)=>{const pct=d.total>0?Math.round((m/d.total)*100):0;const alpha=pct/100;const bg=i===0?`rgba(46,204,148,0.8)`:`rgba(23,70,162,${alpha*0.8})`;h+=`<td style="color:${alpha>0.5?'#fff':'var(--text)'};background:${bg}">${pct}%<div class="text-[9px] opacity-70">${m} ta</div></td>`;});
      for(let j=d.months.length;j<maxM;j++)h+=`<td></td>`;
      h+=`</tr>`;
    });
    h+=`</tbody></table></div></div>`;
  }
  return h;
}

// DEFAULT: shartnomalar
return h+_rCBody();
}

// === TOP MRR ===
function rT(){
const act=activeR().sort((a,b)=>b._mUSD-a._mUSD),tM=act.reduce((s,r)=>s+r._mUSD,0);
const t5=act.slice(0,5).reduce((s,r)=>s+r._mUSD,0),t10=act.slice(0,10).reduce((s,r)=>s+r._mUSD,0),t20=act.slice(0,20).reduce((s,r)=>s+r._mUSD,0);
const view=S.topView||'metrka';
let h='';
if(view==='jadval'){
  h+=`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:40px">#</th><th>Mijoz</th><th>Firma</th><th>Menejer</th><th>Hudud</th><th class="text-r">Oylik $</th><th class="text-r">Ulush</th><th style="width:160px">Nisbat</th></tr></thead><tbody>${act.slice(0,40).map((r,i)=>{const p=tM?(r._mUSD/tM*100):0;const rc=i===0?'rk1':i===1?'rk2':i===2?'rk3':'rkn';const bc=i<3?'var(--accent)':i<10?'var(--green)':'var(--amber)';return`<tr><td><span class="rank ${rc}">${i+1}</span></td><td class="font-semibold">${r.Client?cl(r.Client):'—'}</td><td style="color:var(--text2);font-size:11px">${r['Firma nomi']||'—'}</td><td class="text-xs">${r.Manager||'—'}</td><td class="text-[11px]">${r.Hudud||'—'}</td><td class="text-r mono" style="font-weight:700;font-size:13px">${fmt(r._mUSD)}</td><td class="text-r mono text-[11px] text-muted">${p.toFixed(1)}%</td><td><div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${act[0]?Math.min(r._mUSD/act[0]._mUSD*100,100):0}%;background:${bc};border-radius:4px;transition:width .5s ease"></div></div></td></tr>`}).join('')}</tbody></table></div></div>`;
}else{
  h+=`<div class="metrics grid-cols-4">
  <div class="metric c5"><div class="metric-lbl">Top 5</div><div class="metric-val">${tM?Math.round(t5/tM*100):0}%</div><div class="metric-foot">${fmt(t5)} $</div></div>
  <div class="metric c1"><div class="metric-lbl">Top 10</div><div class="metric-val">${tM?Math.round(t10/tM*100):0}%</div><div class="metric-foot">${fmt(t10)} $</div></div>
  <div class="metric c2"><div class="metric-lbl">Top 20</div><div class="metric-val">${tM?Math.round(t20/tM*100):0}%</div><div class="metric-foot">${fmt(t20)} $</div></div>
  <div class="metric c3"><div class="metric-lbl">O'rtacha</div><div class="metric-val">${fmt(act.length?Math.round(tM/act.length):0)}</div><div class="metric-foot">per shartnoma</div></div></div>
  <div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-accent"></span>Top 10</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chT"></canvas></div></div></div>
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot bg-tw-purple"></span>Konsentratsiya</span></div><div class="card-body"><div class="chart-wrap h-[220px]"><canvas id="chK"></canvas></div></div></div></div>`;
}
return h;
}

// === DEBTS ===
function rDebt(){
const now=new Date();const repDate=S.debtDate||now;const dt=calcDebtTable(repDate);
const dr=dashRange();
const totalKel=dt.reduce((s,r)=>s+(r.kelQarz>0?r.kelQarz:0),0);
const totalOy=dt.reduce((s,r)=>s+(r.oyQarz>0?r.oyQarz:0),0);
const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const repLabel=mos[repDate.getMonth()]+' '+repDate.getFullYear();
const dsoVal=Math.round(dr.dso||0),conc5=Math.round(dr.top5Conc||0);
const dsoColor=dsoVal<35?'var(--green)':dsoVal<60?'var(--amber)':'var(--red)';
const concColor=conc5<30?'var(--green)':conc5<50?'var(--amber)':'var(--red)';
const view=S.debtView||'umumiy';

let h='';

if(view==='jadval'){
  S.debtMobCol=S.debtMobCol||'oy';
  const debtCur=S.debtCur||'usd';
  const isUZS=debtCur==='uzs';
  window.switchDMC=function(c){S.debtMobCol=c;render()};
  const isM=window.innerWidth<=768;
  let filtered=dt;
  if(S.debtQ){const q=S.debtQ.toLowerCase();filtered=dt.filter(r=>r.name.toLowerCase().includes(q));}
  let mobTabs='';
  if(isM){const tabs=[{k:'sh',l:'Sh. qoldiq'},{k:'oy',l:'Oy oxiri'},{k:'kel',l:'Kelishuv'},{k:'lp',l:"Oxirgi to'lov"}];mobTabs='<div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 12px;border-bottom:1px solid var(--border);margin-bottom:12px">'+tabs.map(t=>`<button class="btn" style="flex-shrink:0;${S.debtMobCol===t.k?'background:var(--accent);color:#fff;border-color:var(--accent)':''}" onclick="switchDMC('${t.k}')">${t.l}</button>`).join('')+'</div>';}
  const fsIcon=S.debtFs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  h+=`<div id="debtContainer"${S.debtFs?' class="debt-fs-active"':''}>`;
  h+=`<div class="toolbar mb-2 gap-2.5">
<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz nomi..." value="${S.debtQ||''}" oninput="onSearch('debtQ',this.value)"><button class="search-clear" onclick="onSearch('debtQ','');render()" type="button">&times;</button></div>
<div class="flex gap-1.5 items-center" style="margin-left:auto">
<div class="flex gap-0.5 bg-hover rounded-md p-0.5">
<button class="btn${!isUZS?' btn-primary':''}" style="padding:3px 10px;font-size:11px" onclick="S.debtCur='usd';render()">$</button>
<button class="btn${isUZS?' btn-primary':''}" style="padding:3px 10px;font-size:11px" onclick="S.debtCur='uzs';render()">so'm</button>
</div>
<input type="date" class="flt text-xs py-1.5 px-2.5" value="${dateStr(repDate)}" onchange="S.debtDate=toDate(this.value);clearCache();render()">
<button class="btn-outline py-[7px] px-[11px]" onclick="showDlMenu(this,'debts')" title="Yuklab olish">${_dlSvg}</button>
<button class="btn${S.debtFs?' btn-primary':''} py-2 px-3" onclick="toggleDebtFs()" title="${S.debtFs?'Kichraytirish':'To\'liq ekran'}">${fsIcon}</button>
</div>
</div>`;
  // UZS data: build from rows
  const uzsMap={};
  if(isUZS){
    S.rows.forEach(r=>{if(!r.Client)return;const c=r.Client.trim();if(!uzsMap[c])uzsMap[c]={sUZS:0,mUZS:0};uzsMap[c].sUZS+=r._sUZS||0;uzsMap[c].mUZS+=r._mUZS||0});
    S.qRows.forEach(r=>{if(!r.Client)return;const c=r.Client.trim();if(!uzsMap[c])uzsMap[c]={sUZS:0,mUZS:0};uzsMap[c].sUZS+=pn(r['sum UZS']||'0');uzsMap[c].mUZS+=pn(r['oylik UZS']||'0')});
    const pmUZS=calcPaymentsUZS();
    Object.values(pmUZS).forEach(v=>{if(uzsMap[v.client])uzsMap[v.client].paid=(uzsMap[v.client].paid||0)+v.total});
  }
  const ccy=isUZS?"so'm":'$';
  h+=mobTabs+`<div class="tbl-wrap"><div class="tbl-scroll" style="max-height:calc(100vh - ${S.debtFs?'56':'120'}px)"><table><thead><tr><th>Mijoz</th>
${(!isM||S.debtMobCol==='sh')?`<th class="text-r">Sh. qoldiq ${ccy}</th>`:''}
${(!isM||S.debtMobCol==='oy')?`<th class="text-r">Oy oxiri ${ccy}</th>`:''}
${(!isM||S.debtMobCol==='kel')?`<th class="text-r">Kelishuv ${ccy}</th>`:''}
${(!isM||S.debtMobCol==='lp')?`<th class="text-r">Oxirgi to'lov</th>`:''}
</tr></thead><tbody>${filtered.length?filtered.map(r=>{
const uz=uzsMap[r.name];
const qoldiq=isUZS?(uz?Math.round(uz.sUZS-(uz.paid||0)):0):r.qoldiq;
const oyQ=isUZS?qoldiq:r.oyQarz;
const kelQ=isUZS?qoldiq:r.kelQarz;
const oyC=oyQ>0?'var(--amber)':'var(--green)';const kelC=kelQ>0?'var(--red)':'var(--green)';
const lp=r.lastPay;
let lpCell='<td class="text-r text-[11px] text-subtle">—</td>';
if(lp){
  const ds=fmtD(lp.date);
  const tips=lp.allOnDate.map(p=>{
    const ks=p.kassa?String(p.kassa).trim():'';const origS=String(p.origSum).trim();
    let amtStr=p.val==='USD'?`${origS}$`:`${origS} so'm`;
    if(p.type==='perevod'&&p.val==='UZS'&&(!origS||origS==='0'))amtStr=`${fmt(p.usdSum)}$`;
    let txt='';const t=p.type;
    if(t==='naqd')txt=ks?`${ks}ga naqd`:`naqd`;
    else if(t==='karta')txt=ks?`${ks} karta`:`karta`;
    else if(t==='bank'||t==='perevod')txt=ks||'Bank';
    else txt=t||"to'lov";
    return`${amtStr} · ${txt}`;
  }).filter(Boolean).join('&#10;');
  lpCell='<td class="text-r has-tip" data-tip="'+(tips||ds)+'" style="font-size:11px;color:var(--accent)">'+ds+'</td>';
}
return'<tr><td class="font-medium">'+cl(r.name)+'</td>'+
((!isM||S.debtMobCol==='sh')?`<td class="text-r mono text-[11px] text-subtle">${qoldiq>0?fmt(qoldiq):'—'}</td>`:'')+
((!isM||S.debtMobCol==='oy')?`<td class="text-r mono" style="font-size:11px;color:${oyC};font-weight:${oyQ>0?'600':'400'}">${oyQ>0?fmt(oyQ):'—'}</td>`:'')+
((!isM||S.debtMobCol==='kel')?`<td class="text-r mono" style="font-size:11px;color:${kelC};font-weight:${kelQ>0?'700':'400'}">${kelQ>0?fmt(kelQ):'—'}</td>`:'')+
((!isM||S.debtMobCol==='lp')?lpCell:'')+'</tr>'}).join(''):`<tr><td colspan="${isM?2:5}" class="text-center text-subtle p-5">—</td></tr>`}</tbody></table></div></div>`;
  h+=`</div>`;
}else{
  h+=`<div class="metrics grid-cols-4">
  <div class="metric c6"><div class="metric-lbl">DSO</div><div class="metric-val" style="color:${dsoColor}">${dsoVal} <span class="text-sm">kun</span></div></div>
  <div class="metric c2"><div class="metric-lbl">Konsentratsiya (Top 5)</div><div class="metric-val" style="color:${concColor}">${conc5}%</div></div>
  <div class="metric c4"><div class="metric-lbl">Oy oxiri qarzi</div><div class="metric-val">${fmt(totalOy)}</div></div>
  <div class="metric c4"><div class="metric-lbl">Kelishuv qarzi</div><div class="metric-val">${fmt(totalKel)}</div></div></div>
  <div class="card mt-4"><div class="card-head"><span class="card-label">Qarz taqsimoti</span></div>
  <div class="card-body">
    ${dt.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div><div class="text-[11px] text-subtle mb-2">Oy oxiri qarz bo'yicha TOP 5</div>
    ${dt.filter(r=>r.oyQarz>0).sort((a,b)=>b.oyQarz-a.oyQarz).slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><span class="font-medium">${cl(r.name)}</span><span class="mono" style="color:var(--amber);font-weight:600">${fmt(r.oyQarz)}</span></div>`).join('')}
    </div>
    <div><div class="text-[11px] text-subtle mb-2">Kelishuv qarz bo'yicha TOP 5</div>
    ${dt.filter(r=>r.kelQarz>0).sort((a,b)=>b.kelQarz-a.kelQarz).slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><span class="font-medium">${cl(r.name)}</span><span class="mono" style="color:var(--red);font-weight:600">${fmt(r.kelQarz)}</span></div>`).join('')}
    </div></div>`:'<div class="text-center text-subtle p-6">Qarzdor mijozlar yo\'q ✅</div>'}
  </div></div>`;
}
if(view==='aging') return _rAgingSection();
if(view==='inkasso') return _rInkassoSection();
return h;
}

// === TAHLIL (standalone) ===
function rTahlil(){
  return _rAuditSection();
}

// === SHARED SECTIONS ===
function _rAgingSection(){
  const aging=calcARaging();
  const agingTotal=aging.reduce((s,b)=>s+b.total,0);
  if(!S.arAgingFilter)S.arAgingFilter=[];
  const af=S.arAgingFilter;
  let agingCards='';
  aging.forEach(b=>{
    const pct=agingTotal>0?Math.round(b.total/agingTotal*100):0;
    const isActive=af.includes(b.label);
    agingCards+=`<div class="metric cursor-pointer" style="border-top:3px solid ${b.color};${isActive?`border-color:${b.color};background:var(--bg3)`:''}" onclick="toggleAgingFilter('${b.label}')" title="${b.label} bo'yicha filterlash">
      <div class="metric-lbl">${b.label}${isActive?' <span style="font-size:9px;color:var(--text3)">(aktiv)</span>':''}</div>
      <div class="metric-val mono" style="color:${b.color}">${fmt(b.total)}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${b.clients.length} ta mijoz · ${pct}%</div>
    </div>`;
  });
  let agingRows='';
  let allAging=aging.flatMap(b=>b.clients.map(c=>({...c,bucket:b.label,color:b.color})));
  if(af.length) allAging=allAging.filter(c=>af.includes(c.bucket));
  allAging.sort((a,b)=>b.qarz-a.qarz).forEach(c=>{
    agingRows+=`<tr>
      <td class="font-medium">${cl(c.name)}</td>
      <td><span class="badge" style="background:${c.color}20;color:${c.color};border:1px solid ${c.color}40">${c.bucket}</span></td>
      <td class="text-r mono" style="color:var(--red);font-weight:600">${fmt(c.qarz)}</td>
      <td class="text-r mono text-[11px] text-subtle">${c.kelQarz>0?fmt(c.kelQarz):'—'}</td>
      <td class="text-r text-xs">${c.days<999?c.days+' kun':'—'}</td>
      <td class="text-[11px] text-subtle">${c.lastPayDate}</td>
    </tr>`;
  });
  return`<div>
    <div class="toolbar mb-2 gap-2.5">
      <span class="text-xs font-semibold text-subtle">${af.length?`Filter: ${af.join(', ')}`:allAging.length+' ta qarzdor'}</span>
      <div class="flex gap-1.5 items-center" style="margin-left:auto">
        ${af.length?`<button class="btn" style="font-size:11px;padding:5px 10px" onclick="S.arAgingFilter=[];render()">Filterni tozala</button>`:''}
        <button class="btn-outline" style="padding:6px 10px" onclick="showDlMenu(this,'araging')" title="Yuklab olish">${_dlSvg}</button>
      </div>
    </div>
    <div class="metrics mb-2" style="grid-template-columns:repeat(4,1fr)">${agingCards}</div>
    ${agingRows?`<div class="card shadow-lg"><div class="card-body p-0"><div class="tbl-scroll" style="max-height:calc(100vh - 230px)"><table><thead><tr>
        <th>Mijoz</th><th>Muddat</th><th class="text-r">Oy qarzi</th><th class="text-r">Kelishuv</th><th class="text-r">Kechikish</th><th>Oxirgi to'lov</th>
      </tr></thead><tbody>${agingRows}</tbody></table></div></div></div>`:'<div class="text-center text-subtle p-6">Qarzdor mijozlar yo\'q</div>'}
  </div>`;
}

function _rInkassoSection(){
  const inkMode=S.inkassoMode||'oy';
  const cr=calcCollectionRate(inkMode);
  const now=new Date();
  const curMon=mos[now.getMonth()]+' '+now.getFullYear();
  const capRate=S.inkassoCap!==false;
  const modeToggle=`<div class="flex gap-0.5 bg-hover rounded-md p-0.5">
    <button class="btn${inkMode==='oy'?' btn-primary':''}" style="padding:4px 10px;font-size:11px" onclick="S.inkassoMode='oy';clearCache();render()">Oy oxiri</button>
    <button class="btn${inkMode==='kelishuv'?' btn-primary':''}" style="padding:4px 10px;font-size:11px" onclick="S.inkassoMode='kelishuv';clearCache();render()">Kelishuv</button>
  </div>`;
  // Inkasso metrics
  const totalExpected=cr.reduce((s,c)=>s+c.expected,0);
  const totalPaidInk=cr.reduce((s,c)=>s+c.paid,0);
  const fulfilled=cr.filter(c=>c.rate>=100).length;
  const partial=cr.filter(c=>c.rate>0&&c.rate<100).length;
  const noPay=cr.filter(c=>c.rate===0).length;
  const hasPaid=cr.filter(c=>c.paid>0).length;
  const collPct=totalExpected>0?Math.round(totalPaidInk/totalExpected*100):0;
  const collPctCol=collPct>=90?'var(--green)':collPct>=70?'var(--amber)':'var(--red)';
  const avgRate=collPct;
  const avgRateCol=avgRate>=90?'var(--green)':avgRate>=70?'var(--amber)':'var(--red)';
  const fc=calcCollectionForecast(cr);
  const forecastPct=fc.forecastPct;
  const forecastCol=forecastPct>=90?'var(--green)':forecastPct>=60?'var(--amber)':'var(--red)';
  const remaining=Math.max(0,totalExpected-totalPaidInk);
  const inkFlt=S.inkassoFilter||'all';
  let filteredCr=cr;
  // Build forecast lookup
  const fcMap={};
  fc.details.forEach(d=>{fcMap[d.name]=d});

  if(inkFlt==='full')filteredCr=cr.filter(c=>c.rate>=100);
  else if(inkFlt==='partial')filteredCr=cr.filter(c=>c.rate>0&&c.rate<100);
  else if(inkFlt==='none')filteredCr=cr.filter(c=>c.rate===0);
  else if(inkFlt==='paid')filteredCr=cr.filter(c=>c.paid>0);
  let fCrRows='';
  filteredCr.forEach(c=>{
    const dispRate=capRate?Math.min(c.rate,100):c.rate;
    const rateCol=dispRate>=90?'var(--green)':dispRate>=70?'var(--amber)':'var(--red)';
    const barW=Math.min(100,dispRate);
    const deltaCol=c.delta>=0?'var(--green)':'var(--red)';
    // Per-client discipline — 6 oy: har oy oxirida cumPaid >= cumExpected*90% bo'lganmi
    const fd=fcMap[c.name];
    let intizom=-1,intTip='';
    if(fd&&fd.disc){
      intizom=fd.disc.score;
      intTip=`6 oydan ${fd.disc.onTrack}/${fd.disc.months} oyda to'lov intizomida`;
    }else{intTip='6 oylik tarix yo\'q'}
    const intCol=intizom>=80?'var(--green)':intizom>=50?'var(--amber)':intizom>=0?'var(--red)':'var(--text3)';
    fCrRows+=`<tr>
      <td class="font-medium">${cl(c.name)}</td>
      <td class="text-r mono text-[11px]">${fmt(c.expected)}</td>
      <td class="text-r mono text-[11px]">${fmt(c.paid)}</td>
      <td class="text-r mono" style="font-size:11px;color:${deltaCol};font-weight:600">${c.delta>=0?'+':''}${fmt(c.delta)}</td>
      <td class="min-w-[100px]">
        <div class="flex items-center gap-1.5">
          <div class="flex-1 bg-brd rounded-[4px] h-1.5">
            <div style="width:${barW}%;background:${rateCol};height:6px;border-radius:4px"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:${rateCol};min-width:30px;text-align:right">${dispRate}%</span>
        </div>
      </td>
      <td class="text-r" style="min-width:50px" title="${intTip}"><span style="font-size:11px;font-weight:700;color:${intCol}">${intizom>=0?intizom+'%':'—'}</span></td>
    </tr>`;
  });
  const inkMetrics=`<div class="ink-metrics" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
    <div class="flex items-center gap-2 py-1.5 px-3 rounded-lg" style="background:var(--bg3)"><span class="text-[10px] text-subtle">Kutilgan</span><span class="mono font-bold text-[15px]">${fmt(totalExpected)}</span><span class="text-[10px] text-subtle">${cr.length} mijoz</span></div>
    <div class="flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer${inkFlt==='paid'?' outline outline-2 outline-offset-[-2px]':''}" style="background:var(--bg3);${inkFlt==='paid'?'outline-color:var(--teal)':''}" onclick="S.inkassoFilter=S.inkassoFilter==='paid'?'all':'paid';render()"><span class="text-[10px] text-subtle">To'langan</span><span class="mono font-bold text-[15px]" style="color:var(--teal)">${fmt(totalPaidInk)}</span><span class="text-[10px]" style="color:${collPctCol}">${collPct}%</span></div>
    <div class="flex items-center gap-2 py-1.5 px-3 rounded-lg" style="background:var(--bg3)"><span class="text-[10px] text-subtle">Qoldiq</span><span class="mono font-bold text-[15px]" style="color:${remaining>0?'var(--red)':'var(--green)'}">${remaining>0?fmt(remaining):'✓'}</span><span class="text-[10px]" style="color:${forecastCol}" title="Har bir mijozning to'lov tarixi va odatiga asoslangan prognoz">~${forecastPct}% · ${fc.daysLeft}k</span></div>
    <div class="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg cursor-pointer${inkFlt==='full'?' outline outline-2 outline-offset-[-2px]':''}" style="background:var(--bg3);${inkFlt==='full'?'outline-color:var(--green)':''}" onclick="S.inkassoFilter=S.inkassoFilter==='full'?'all':'full';render()"><span style="color:var(--green);font-weight:700;font-size:14px">${fulfilled}</span><span class="text-[10px] text-subtle">to'liq</span></div>
    <div class="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg cursor-pointer${inkFlt==='partial'?' outline outline-2 outline-offset-[-2px]':''}" style="background:var(--bg3);${inkFlt==='partial'?'outline-color:var(--amber)':''}" onclick="S.inkassoFilter=S.inkassoFilter==='partial'?'all':'partial';render()"><span style="color:var(--amber);font-weight:700;font-size:14px">${partial}</span><span class="text-[10px] text-subtle">qisman</span></div>
    <div class="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg cursor-pointer${inkFlt==='none'?' outline outline-2 outline-offset-[-2px]':''}" style="background:var(--bg3);${inkFlt==='none'?'outline-color:var(--red)':''}" onclick="S.inkassoFilter=S.inkassoFilter==='none'?'all':'none';render()"><span style="color:var(--red);font-weight:700;font-size:14px">${noPay}</span><span class="text-[10px] text-subtle">to'lamagan</span></div>
  </div>`;
  const inkFs=S.inkassoFs||false;
  const inkFsIcon=inkFs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  return`<div id="inkContainer"${inkFs?' class="ink-fs-active"':''}>
    <div class="toolbar mb-2 gap-2.5">
      <div class="flex gap-2 items-center">
        ${modeToggle}
        <button class="btn${capRate?' btn-primary':''}" style="padding:4px 10px;font-size:11px" onclick="S.inkassoCap=!S.inkassoCap;render()" title="100% dan oshmasin">Cap 100%</button>
      </div>
      <div class="flex gap-1.5 items-center" style="margin-left:auto">
        <button class="btn-outline" style="padding:6px 10px" onclick="showDlMenu(this,'collection')" title="Yuklab olish">${_dlSvg}</button>
        <button class="btn${inkFs?' btn-primary':''} py-2 px-3" onclick="S.inkassoFs=!S.inkassoFs;render()" title="${inkFs?'Kichraytirish':'To\'liq ekran'}">${inkFsIcon}</button>
      </div>
    </div>
    ${cr.length?`${inkMetrics}<div class="card shadow-lg"><div class="card-body p-0"><div class="tbl-scroll" style="max-height:calc(100vh - ${inkFs?'56':'156'}px)"><table><thead><tr>
        <th>Mijoz</th><th class="text-r" title="Oy boshidagi qarz + shu oy kutilgani">Kutilgan</th>
        <th class="text-r" title="Shu oy davomida to'langan">To'langan</th>
        <th class="text-r">Farq</th><th>Bajarilish</th><th class="text-r" title="Oxirgi 6 oy to'lov intizomi">Intizom</th>
      </tr></thead><tbody>${fCrRows}</tbody></table></div></div></div>`
      :'<div class="text-center text-subtle p-6">Ma\'lumot yo\'q</div>'}
  </div>`;
}

function _rAuditSection(){
  const audit=calcDataAudit();
  let auditRows='';
  audit.forEach(a=>{
    // Vergul bilan ajratilgan mijozlarni alohida linklar qilish
    const clientLinks=a.client.split(',').map(c=>c.trim()).filter(Boolean).map(c=>cl(c)).join(', ');
    auditRows+=`<tr>
      <td class="font-medium">${clientLinks}</td>
      <td class="text-xs">${a.raqami||'—'}</td>
      <td class="text-xs">${a.type}</td>
      <td style="font-size:12px;max-width:300px">${a.detail}</td>
    </tr>`;
  });
  return`<div>
    <div class="toolbar mb-2 gap-2.5">
      <span class="text-xs font-semibold text-subtle">${audit.length} ta xatolik</span>
      <div class="flex gap-1.5 items-center" style="margin-left:auto">
        <button class="btn-outline" style="padding:6px 10px" onclick="showDlMenu(this,'audit')" title="Yuklab olish">${_dlSvg}</button>
      </div>
    </div>
    ${audit.length?`<div class="card shadow-lg"><div class="card-body p-0"><div class="tbl-scroll" style="max-height:calc(100vh - 80px)"><table><thead><tr>
        <th>Mijoz</th><th>Shartnoma</th><th>Xatolik turi</th><th>Tafsilot</th>
      </tr></thead><tbody>${auditRows}</tbody></table></div></div></div>`:'<div style="text-align:center;color:var(--green);padding:24px">Xatolik topilmadi</div>'}
  </div>`;
}

// === MOLIYA / FINANCE ===
function rMoliya(){
  const view=S.molView||'pnl';
  if(view==='cashflow') return _rCashFlow();
  return _rPnL();
}

function _rPnL(){
  return`<div class="flex flex-col items-center justify-center min-h-[300px] gap-3 text-subtle">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
    <div class="text-sm font-semibold">Profit & Loss</div>
    <div class="text-xs">Tez kunda...</div>
  </div>`;
}

function _rCashFlow(){
  return`<div class="flex flex-col items-center justify-center min-h-[300px] gap-3 text-subtle">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    <div class="text-sm font-semibold">Cash Flow</div>
    <div class="text-xs">Tez kunda...</div>
  </div>`;
}
