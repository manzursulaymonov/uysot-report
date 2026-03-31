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
  const rows=list.map((c,i)=>`<tr><td style="color:var(--text3);font-size:11px;padding:8px 12px">${i+1}</td><td style="font-weight:600;font-size:13px;padding:8px 12px">${cl(c.name)}</td><td style="font-size:12px;color:var(--text2);padding:8px 12px">${c.mgr}</td><td class="text-r mono" style="font-weight:600;padding:8px 12px">${fmt(c.mrr)}</td></tr>`).join('');
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  o.innerHTML=`<div class="modal" style="padding:0;max-width:560px;width:90%;max-height:80vh;display:flex;flex-direction:column">
    <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0">
      <div>
        <div style="font-weight:700;font-size:16px">${hudud}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px">${list.length} ta mijoz · Jami MRR: <span class="mono" style="font-weight:600">${fmt(totalMrr)} $</span></div>
      </div>
      <button onclick="this.closest('.overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3);line-height:1;padding:4px 8px">×</button>
    </div>
    <div style="overflow-y:auto;flex:1">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg2)">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">№</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">MIJOZ</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">MENEJER</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:var(--text3);font-weight:600">MRR $</th>
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
function showClientCard(name){
  const n=name.trim();
  const cRows=S.rows.filter(r=>r.Client?.trim()===n);
  const qCRows=S.qRows.filter(r=>r.Client?.trim()===n);
  const pm=calcPayments();
  let totalPaid=0;Object.values(pm).forEach(v=>{if(v.client===n)totalPaid+=v.total});
  const totalSum=cRows.reduce((s,r)=>s+(r._sUSD||0),0)+qCRows.reduce((s,r)=>s+(r._sUSD||0),0);
  const {all,qAll}=buildContracts();const now=new Date();
  // For future contracts, also check future date
  const allClientCts=all.concat(qAll).filter(c=>c.client===n);
  const latestEnd=allClientCts.length?allClientCts.reduce((a,b)=>b.endD>a.endD?b:a).endD:now;
  const snapDt=latestEnd>now?latestEnd:now;
  const snap=mrrOnDate(snapDt,all,qAll);
  const curMrr=snap.contracts.filter(c=>c.client===n).reduce((s,c)=>s+c.musd,0);
  // Also get MRR from current or nearest future active contract
  const activeMrr=curMrr||allClientCts.filter(c=>c.musd>0).reduce((s,c)=>s+c.musd,0);
  const debtRow=calcDebtTable(now).find(r=>r.name===n);
  const oyQarz=debtRow?.oyQarz||0,kelQarz=debtRow?.kelQarz||0;
  const allDates=[...cRows,...qCRows].map(r=>pd(r.sanasi)).filter(Boolean);
  const firstDate=allDates.length?allDates.reduce((a,b)=>a<b?a:b):null;
  const tenureM=firstDate?Math.round((now-firstDate)/(30.44*86400000)):0;
  // Qarzdor from: use shared _findQarzdorDate (same logic as AR Aging)
  const qarzdorFromDate=_findQarzdorDate(n,totalPaid);
  // Paid until: one day before qarzdor starts
  let paidUntilDate=qarzdorFromDate?new Date(qarzdorFromDate.getTime()-864e5):null;
  // Cap paidUntilDate at contract end date
  const endDatesAll=allClientCts.map(c=>c.endD).filter(Boolean);
  const activeUntil=endDatesAll.length?endDatesAll.reduce((a,b)=>a>b?a:b):null;
  if(paidUntilDate&&activeUntil&&paidUntilDate>activeUntil)paidUntilDate=activeUntil;
  const activeCount=cRows.filter(r=>sc(r.status)==='A').length;
  const mrow=cRows[0]||qCRows[0];
  const firma=mrow?.['Firma nomi']||'';
  const mgr=mrow?.Manager||'';
  const hudud=mrow?.Hudud||'';
  const health=calcClientHealth().find(c=>c.name===n);
  const hBadge=health?(health.status==='healthy'?'<span class="badge b-green">Sog\'lom</span>':health.status==='warning'?'<span class="badge b-amber">⚠ Xavf</span>':'<span class="badge b-red">Kritik</span>'):'';
  const allPays=[];
  S.payRows.forEach(r=>{if(r.Client?.trim()!==n)return;const d=pd(r.sanasi);if(!d||!pn(r.USD))return;allPays.push({date:d,dateStr:r.sanasi||'',usd:pn(r.USD),type:r['tolov turi']||'',kassa:r.kassa||'',src:'pay'})});
  S.y2024Rows.forEach(r=>{if(r.Client?.trim()!==n)return;const d=pd(r.sanasi);if(!d||!pn(r.USD))return;allPays.push({date:d,dateStr:r.sanasi||'',usd:pn(r.USD),type:r['tolov turi']||'',kassa:r.kassa||'',src:'y24'})});
  allPays.sort((a,b)=>b.date-a.date);
  const tl=t=>({naqd:'Naqd',karta:'Karta',bank:'Bank',perevod:'Perevod'}[t]||t||'—');
  // Status indicator: active until / qarzdor from (based on cumExp same as MRR table)
  const isDebt=qarzdorFromDate&&qarzdorFromDate<=now;
  const statusHtml=isDebt
    ?'<span style="display:inline-flex;align-items:center;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:20px;padding:3px 10px 3px 7px;font-size:11px;font-weight:600;color:var(--red)"><span class="status-dot debt"></span>QARZDOR · '+fmtD(qarzdorFromDate)+' dan</span>'
    :activeUntil
    ?'<span style="display:inline-flex;align-items:center;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:3px 10px 3px 7px;font-size:11px;font-weight:600;color:var(--green)"><span class="status-dot active"></span>AKTIV · '+(paidUntilDate?fmtD(paidUntilDate):fmtD(activeUntil))+' gacha</span>'
    :'';
  // Colored delta helper
  const dlt=v=>v>0?'<span style="color:var(--green);font-size:9px;font-family:var(--mono);display:block">+'+fmt(v)+'</span>':v<0?'<span style="color:var(--red);font-size:9px;font-family:var(--mono);display:block">'+fmt(v)+'</span>':'';
  const qByRaqami={};qCRows.forEach(r=>{const aq=r.raqami||'_';if(!qByRaqami[aq])qByRaqami[aq]=[];qByRaqami[aq].push(r)});
  const ctHtml=cRows.map(r=>{
    const k=r.Client+'|'+r.raqami;const p=pm[k]||{total:0};
    const qExtras=qByRaqami[r.raqami]||[];
    const qExtraSum=qExtras.reduce((s,q)=>s+(q._sUSD||0),0);
    const qExtraMrr=qExtras.reduce((s,q)=>s+pn(q['Oylik USD']),0);
    const qExtraTdb=qExtras.reduce((s,q)=>s+pn(q['Tadbiq USD']),0);
    const jamiSum=(r._sUSD||0)+qExtraSum;
    const tadbiqSum=(r._tUSD||0)+qExtraTdb;
    const qoldiq=Math.round(jamiSum-p.total);const qC=qoldiq>0?'var(--red)':qoldiq<0?'var(--amber)':'var(--green)';
    return'<tr><td class="mono" style="font-size:10px;color:var(--text3)">'+r.raqami+'</td>'
      +'<td class="mono" style="font-size:10.5px;white-space:nowrap">'+r.sanasi+'</td>'
      +'<td class="mono" style="font-size:10.5px;white-space:nowrap">'+(r['amal qilishi']||'—')+'</td>'
      +'<td class="text-r mono" style="font-size:11px;line-height:1.2">'+fmt(tadbiqSum)+dlt(qExtraTdb)+'</td>'
      +'<td class="text-r mono" style="font-size:11px;line-height:1.2">'+fmt(r._mUSD)+dlt(qExtraMrr)+'</td>'
      +'<td class="text-r mono" style="font-size:11px;line-height:1.2">'+fmt(jamiSum)+dlt(qExtraSum)+'</td>'
      +'<td class="text-r mono" style="font-size:11px;color:var(--teal)">'+(p.total?fmt(p.total):'—')+'</td>'
      +'<td class="text-r mono" style="font-size:11px;color:'+qC+';font-weight:'+(qoldiq>0?'600':'400')+'">'+(jamiSum?fmt(qoldiq):'—')+'</td>'
      +'</tr>';
  }).join('');
  const qHtml=qCRows.map(r=>{
    const musd=pn(r['Oylik USD']);const tdb=pn(r['Tadbiq USD']);const ssum=r._sUSD||0;
    const cv=v=>v>0?'var(--green)':v<0?'var(--red)':'var(--text)';
    return'<tr><td class="mono" style="font-size:10px;color:var(--text3)">'+(r.raqami||'—')+'</td>'
      +'<td class="mono" style="font-size:10.5px;white-space:nowrap">'+(r.sanasi||'—')+'</td>'
      +'<td class="mono" style="font-size:10.5px;white-space:nowrap">'+(r['amal qilishi']||'—')+'</td>'
      +'<td class="text-r mono" style="font-size:11px;color:'+cv(tdb)+'">'+fmt(tdb)+'</td>'
      +'<td class="text-r mono" style="font-size:11px;color:'+cv(musd)+'">'+fmt(musd)+'</td>'
      +'<td class="text-r mono" style="font-size:11px;color:'+cv(ssum)+'">'+fmt(ssum)+'</td>'
      +'</tr>';
  }).join('');
  const payHtml=allPays.slice(0,50).map(p=>'<tr>'
    +'<td class="mono" style="font-size:10.5px;white-space:nowrap">'+(p.dateStr||'—')+'</td>'
    +'<td style="font-size:11.5px">'+tl(p.type)+(p.kassa?' ('+p.kassa+')':'')+(p.src==='y24'?' <span style="font-size:9px;color:var(--text3)">[2024]</span>':'')+'</td>'
    +'<td class="text-r mono" style="color:var(--teal);font-weight:600">+'+fmt(p.usd)+' $</td>'
    +'</tr>').join('');
  const dC=kelQarz>0?'var(--red)':kelQarz<0?'var(--amber)':'var(--green)';
  // MRR 12-month trend
  const cid='cc'+Date.now();
  const UZ_MON=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const mLabel=d=>d.getFullYear()+' '+UZ_MON[d.getMonth()];
  const mrrL=[],mrrV=[];
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const s2=mrrOnDate(d,all,qAll);const v=s2.contracts.filter(c=>c.client===n).reduce((a,c)=>a+c.musd,0);mrrL.push(mLabel(d));mrrV.push(Math.round(v));}
  // Payment monthly trend
  const mPayMap={};allPays.forEach(p=>{const m=p.date.getFullYear()+'-'+(p.date.getMonth()+1).toString().padStart(2,'0');mPayMap[m]=(mPayMap[m]||0)+p.usd;});
  const payTL=[],payTV=[];
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const m=d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0');payTL.push(mLabel(d));payTV.push(Math.round(mPayMap[m]||0));}
  // Payment by type donut
  const byType={};allPays.forEach(p=>{const k=tl(p.type);byType[k]=(byType[k]||0)+p.usd;});
  const dtLabels=Object.keys(byType),dtVals=Object.values(byType).map(v=>Math.round(v));
  // Mini KPIs
  const payPct=totalSum>0?Math.round(totalPaid/totalSum*100):0;
  const daysToEnd=health?health.daysToEnd:null;
  const arpa=tenureM>0?Math.round(totalPaid/tenureM):0;
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  o.innerHTML='<div class="modal" style="padding:0;width:min(98vw,1160px);max-height:96vh;display:flex;flex-direction:column">'
    // Header
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:18px 24px;border-bottom:1px solid var(--border);flex-shrink:0">'
    +'<div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">'
    +'<span style="font-weight:700;font-size:20px">'+n+'</span>'+hBadge+statusHtml+'</div>'
    +'<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--text3)">'
    +(firma?'<span>🏢 '+firma+'</span>':'')
    +(hudud?'<span>📍 '+hudud+'</span>':'')
    +(mgr?'<span>👤 '+mgr+'</span>':'')
    +(firstDate?'<span>📅 '+fmtD(firstDate)+' dan beri · '+tenureM+' oy</span>':'')
    +'</div></div>'
    +'<button onclick="this.closest(\'.overlay\').remove()" style="background:none;border:none;font-size:26px;cursor:pointer;color:var(--text3);line-height:1;padding:0 0 0 16px;flex-shrink:0">×</button>'
    +'</div>'
    // Body
    +'<div style="overflow-y:auto;flex:1;padding:18px 24px">'
    // Row 1: 4 main metric cards
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">'
    +'<div style="background:var(--accent-bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-top:3px solid var(--accent)">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Joriy MRR</div>'
    +'<div class="mono" style="font-size:22px;font-weight:700;color:var(--accent)">'+(activeMrr?fmt(activeMrr)+' $':'—')+'</div>'
    +'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+activeCount+' aktiv shartnoma</div></div>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-top:3px solid var(--green)">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Jami shartnoma</div>'
    +'<div class="mono" style="font-size:22px;font-weight:700">'+fmt(totalSum)+' $</div>'
    +'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+(cRows.length+qCRows.length)+' ta shartnoma</div></div>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-top:3px solid var(--teal)">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">To\'langan</div>'
    +'<div class="mono" style="font-size:22px;font-weight:700;color:var(--teal)">'+fmt(totalPaid)+' $</div>'
    +'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+allPays.length+' ta to\'lov</div></div>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;border-top:3px solid '+(kelQarz>0?'var(--red)':'var(--green)')+'">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Kelishuv qoldig\'i</div>'
    +'<div class="mono" style="font-size:22px;font-weight:700;color:'+dC+'">'+(kelQarz>0?fmt(kelQarz)+' $':'✓ Yo\'q')+'</div>'
    +(oyQarz>0?'<div style="font-size:10px;color:var(--amber);margin-top:2px">Oy oxiri: '+fmt(oyQarz)+' $</div>':'<div style="font-size:10px;color:var(--text3);margin-top:2px">Oy oxiri ham to\'liq</div>')
    +'</div></div>'
    // Row 2: 4 mini KPI cards
    +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">'
    +'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:3px">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.4px">Sog\'liq balli</div>'
    +'<div class="mono" style="font-size:17px;font-weight:700;color:'+(health?(health.score>=80?'var(--green)':health.score>=50?'var(--amber)':'var(--red)'):'var(--text3)')+'">'+( health?health.score+'/100':'—')+'</div>'
    +'<div style="font-size:10px;color:var(--text3)">'+(health?hBadge:'')+'</div></div>'
    +'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:3px">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.4px">To\'lov foizi</div>'
    +'<div class="mono" style="font-size:17px;font-weight:700;color:'+(payPct>=80?'var(--green)':payPct>=50?'var(--amber)':'var(--red)')+'">'+payPct+'%</div>'
    +'<div style="height:4px;background:var(--border);border-radius:2px;margin-top:2px"><div style="height:100%;width:'+payPct+'%;background:'+(payPct>=80?'var(--green)':payPct>=50?'var(--amber)':'var(--red)')+';border-radius:2px;transition:width .3s"></div></div></div>'
    +'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:3px">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.4px">Tugashga</div>'
    +'<div class="mono" style="font-size:17px;font-weight:700;color:'+(daysToEnd!=null&&daysToEnd>0&&daysToEnd<=30?'var(--amber)':daysToEnd!=null&&daysToEnd===-999?'var(--red)':'var(--text)')+'">'+( daysToEnd!=null?(daysToEnd===-999?'Tugagan':daysToEnd>999?'Belgilanmagan':daysToEnd+' kun'):'—')+'</div>'
    +'<div style="font-size:10px;color:var(--text3)">shartnoma muddati</div></div>'
    +'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:3px">'
    +'<div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.4px">ARPA / oy</div>'
    +'<div class="mono" style="font-size:17px;font-weight:700;color:var(--accent)">'+fmt(arpa)+' $</div>'
    +'<div style="font-size:10px;color:var(--text3)">o\'rtacha to\'lov / oy</div></div>'
    +'</div>'
    // Two-column layout: left=tables, right=charts
    +'<div style="display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start">'
    // LEFT column
    +'<div>'
    // Health strip
    +(health?'<div style="display:flex;align-items:center;gap:12px;padding:9px 14px;background:var(--bg3);border-radius:8px;margin-bottom:14px;font-size:12px;flex-wrap:wrap">'
    +'<span>Sog\'liq: <strong style="color:'+(health.score>=80?'var(--green)':health.score>=50?'var(--amber)':'var(--red)')+'">'+health.score+'/100</strong></span>'
    +(health.debt>0?'<span style="color:var(--text3)">·</span><span>Qarz: <span class="mono" style="color:var(--red)">'+fmt(health.debt)+' $</span></span>':'')
    +(health.daysToEnd>0&&health.daysToEnd<999?'<span style="color:var(--text3)">·</span><span>Tugashiga: <span class="mono" style="color:'+(health.daysToEnd<=30?'var(--amber)':'var(--text2)')+'">'+health.daysToEnd+' kun</span></span>':(health.daysToEnd===-999?'<span style="color:var(--text3)">·</span><span style="color:var(--red)">Shartnoma tugagan</span>':''))
    +'</div>':'')
    // Contracts table
    +(ctHtml?'<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:6px">Shartnomalar</div>'
    +'<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden"><div style="overflow-x:auto">'
    +'<table><thead><tr><th>Raqami</th><th>Boshlanish</th><th>Tugash</th><th class="text-r">Tadbiq $</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th><th class="text-r">To\'langan</th><th class="text-r">Qoldiq</th></tr></thead>'
    +'<tbody>'+ctHtml+'</tbody></table></div></div></div>':'')
    // Additional contracts table
    +(qHtml?'<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);margin-bottom:6px">Qo\'shimcha kelishuvlar</div>'
    +'<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden"><div style="overflow-x:auto">'
    +'<table style="opacity:0.9"><thead><tr><th>Raqami</th><th>Boshlanish</th><th>Tugash</th><th class="text-r">Tadbiq $</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th></tr></thead>'
    +'<tbody>'+qHtml+'</tbody></table></div></div></div>':'')
    // Payment history
    +'<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:6px">To\'lovlar tarixi'+(allPays.length>50?' (so\'nggi 50 ta)':' ('+allPays.length+' ta)')+'</div>'
    +(payHtml?'<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">'
    +'<div style="max-height:220px;overflow-y:auto">'
    +'<table><thead><tr><th>Sana</th><th>Turi</th><th class="text-r">USD</th></tr></thead>'
    +'<tbody>'+payHtml+'</tbody></table></div></div>'
    :'<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">To\'lovlar tarixi mavjud emas</div>')
    +'</div>'
    +'</div>'
    // RIGHT column: charts
    +'<div style="display:flex;flex-direction:column;gap:14px">'
    // MRR bar chart
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px">'
    +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:10px">MRR dinamikasi (12 oy)</div>'
    +'<div style="position:relative;height:140px"><canvas id="'+cid+'_mrr"></canvas></div>'
    +'</div>'
    // Payment trend bar chart
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px">'
    +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:10px">To\'lovlar trendi (12 oy)</div>'
    +'<div style="position:relative;height:140px"><canvas id="'+cid+'_trend"></canvas></div>'
    +'</div>'
    // Payment type donut
    +(dtLabels.length?'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px">'
    +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:10px">To\'lov turlari</div>'
    +'<div style="position:relative;height:160px"><canvas id="'+cid+'_pay"></canvas></div>'
    +'</div>':'')
    +'</div>'
    +'</div>'
    +'</div></div>';
  document.body.appendChild(o);
  // Initialize charts
  requestAnimationFrame(()=>{
    const isDark=document.documentElement.getAttribute('data-theme')==='dark';
    const gridC=isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
    const txtC=isDark?'rgba(255,255,255,0.45)':'rgba(0,0,0,0.45)';
    const accentC=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#1746a2';
    const tealC=getComputedStyle(document.documentElement).getPropertyValue('--teal').trim()||'#0d9488';
    const opts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fmt(ctx.parsed.y||ctx.parsed||0)+' $'}}},scales:{x:{grid:{color:gridC},ticks:{color:txtC,font:{size:9},maxRotation:45}},y:{grid:{color:gridC},ticks:{color:txtC,font:{size:9},callback:v=>fmt(v)}}}};
    const mEl=document.getElementById(cid+'_mrr');
    if(mEl)new Chart(mEl,{type:'bar',data:{labels:mrrL,datasets:[{data:mrrV,backgroundColor:accentC+'99',borderColor:accentC,borderWidth:1.5,borderRadius:4}]},options:opts});
    const tEl=document.getElementById(cid+'_trend');
    if(tEl)new Chart(tEl,{type:'bar',data:{labels:payTL,datasets:[{data:payTV,backgroundColor:tealC+'99',borderColor:tealC,borderWidth:1.5,borderRadius:4}]},options:opts});
    if(dtLabels.length){const pEl=document.getElementById(cid+'_pay');if(pEl)new Chart(pEl,{type:'doughnut',data:{labels:dtLabels,datasets:[{data:dtVals,backgroundColor:['#1746a2cc','#0d9488cc','#16a34acc','#d97706cc','#dc2626cc'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:txtC,font:{size:10},boxWidth:12,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+fmt(ctx.parsed)+' $'}}}}})}
  });
}

// === DEBT FULLSCREEN ===
function toggleDebtFs(){
  S.debtFs=!S.debtFs;
  clearCache();render();
}
(function(){
  if(window._debtFsKeyBound)return;
  window._debtFsKeyBound=true;
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&S.debtFs){S.debtFs=false;clearCache();render();}
  });
})();

// === MRR FULLSCREEN ===
function toggleMrrFullscreen(){
  S.mrrFs=!S.mrrFs;
  clearCache();render();
}
(function(){
  if(window._mrrFsKeyBound)return;
  window._mrrFsKeyBound=true;
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&S.mrrFs){S.mrrFs=false;clearCache();render();}
  });
})();

// === DASHBOARD ===
function showMetricInfo(k){
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  const bx=(color,icon,text)=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:${color}11;border-left:3px solid ${color};margin-bottom:6px;font-size:11.5px;line-height:1.5"><span style="font-size:14px">${icon}</span><span>${text}</span></div>`;
  const d={
    'mrr': `<h4 style="margin:0 0 10px">📊 MRR — Monthly Recurring Revenue</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Tashkilotning har oylik <b>kafolatlangan doimiy daromad</b> hajmi. SaaS biznesining asosiy qon tomiri. MRR faqat faol shartnomalar asosida hisoblanadi.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> MRR oydan-oyga barqaror o\'sib borsa — <b>+5-10%</b> oylik o\'sish idealdir.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> MRR bir joyda tursa yoki <b>0-2%</b> o\'ssa — biznes to\'xtab qolgan, yangi sotuvlar churn bilan tenglanmoqda.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> MRR tushib borsa — churn yangi sotuvlardan ustun turmoqda. <b>Zudlik bilan churn sabablarini tahlil qiling.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>ARR</b> = MRR × 12. Yillik darajadagi bashorat. Investorlar va moliyaviy rejalashtirishda ishlatiladi.<br>
        <b>⚠️ Risk:</b> Agar bir nechta yirik shartnoma tugashi yaqin bo'lsa, MRR keskin tushishi mumkin. Revenue Concentration kartasini kuzating.
      </div>`,

    'nrr': `<h4 style="margin:0 0 10px">♻️ NRR — Net Revenue Retention</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6"><b>Mavjud mijozlardan kelayotgan daromadning saqlanish</b> darajasi. Agar 100% dan yuqori bo'lsa — hatto yangi mijozlarsiz ham kompaniya o'sib boradi.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi (100%+):</b> Kengayish (Expansion) churnga ustun. Biznes organik ravishda kengaymoqda — <b>eng sog\'lom holat.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (90-100%):</b> Biroz daromad yo\'qotilmoqda. Churn va contraction kuchaymoqda, sotuvlar bilan qoplash kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<90%):</b> Keskin daromad yo\'qotilish! Bazaning katta qismi ketmoqda yoki pasaymoqda. <b>Zudlik bilan sabablarni aniqlang.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>New:</b> Yangi mijozlardan kelayotgan daromad.<br>
        <b>Expansion:</b> Mavjud mijozlar tarifni ko'tardi. <b>Contraction:</b> Pasaytirdi. <b>Net Exp = Expansion - Contraction.</b><br>
        <b>Churn:</b> Butunlay ketganlar.<br>
        <b>⚠️ Risk:</b> NRR < 90% uzoq vaqt davom etsa, moliyaviy barqarorlik buziladi va investorlar ishonchini yo'qotiladi.
      </div>`,

    'cust': `<h4 style="margin:0 0 10px">👥 Active Customers — Faol Mijozlar</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Ayni daqiqada<b> faol shartnomaga ega</b>, to'lovi joriy yoki muzlatilmagan korxonalar soni.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Faol mijozlar doimiy oshib borsa — sog\'lom baza. Har chorakda <b>+5% </b>va undan yuqori o\'sish idealddir.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Baza bir joyda tursa — yangi sotuvlar churn bilan tenglanmoqda. <b>Sotuv samaradorligi pastlikka</b> ishora.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Baza kamaysa — ketayotgan mijozlar yangilaridan ko\'proq. <b>Mahsulot sifati va xizmatni tezda tekshiring.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Churn Rate:</b> Har oyda bazangizning necha %i ketmoqda.<br>
        <b>Yaxshi:</b> < 3% oylik | <b>O'rtacha:</b> 3-5% | <b>Xavfli:</b> > 5%<br>
        <b>⚠️ Risk:</b> Agar kichik mijozlar ko'p ketsa va yirik qolsa — soni kamayadi lekin MRR saqlanadi. Bu vaqtinchalik! Shunday paytda Revenue Concentration xavfi oshadi.
      </div>`,

    'arpa': `<h4 style="margin:0 0 10px">💳 ARPA — Average Revenue Per Account</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Bitta mijoz hisobiga <b>o'rtacha qancha oylik daromad</b> tushayotgani. ARPA = MRR / Aktiv mijozlar soni.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> ARPA o\'sib borsa — siz <b>qimmatroq xizmatlarni sotmoqdasiz</b> yoki kattaroq korxonalarga xizmat qilmoqdasiz.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> ARPA bir joyda tursa — daromad faqat yangi mijozlar hisobiga o\'sadi, lekin <b>har bir mijoz az pul olib keladi.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> ARPA tushsa — yirik mijozlar ketmoqda yoki barchaga arzon narxda sotilmoqda. <b>Narx siyosatini qayta ko\'ring.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>⚠️ Risk:</b> ARPA past bo'lsa, ko'p mijoz bilan ishlash xarajatlari (support, server) daromaddan oshib ketishi mumkin. Rentabellik pasayadi.
      </div>`,

    'cac': `<h4 style="margin:0 0 10px">🎯 CAC — Customer Acquisition Cost</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Bitta yangi mijozni jalb qilish uchun <b>o'rtacha sarflangan marketing + sotuv xarajati.</b></div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> CAC <b>3 oy ichida qoplanadi</b> — mijoz ARPA si bilan xarajat juda tez qaytadi.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> CAC <b>6-12 oy ichida qoplanadi</b> — rentabel, lekin naqd pul muammolari yuzaga kelishi mumkin.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> CAC <b>12+ oyda qoplanadi</b> — har bir yangi mijoz zarar olib keladi, biznes skallanmas holga tushadi.')}
      </div>
      <div style="font-size:12px;padding:10px;background:var(--bg2);color:var(--text3);border-radius:6px;border:1px solid var(--border)">⚠️ Hozirda tizimga <b>Marketing xarajatlari bazasi</b> kiritilmagan. Modul yoqilishi uchun marketing ma'lumotlari kerak.</div>`,

    'cash': `<h4 style="margin:0 0 10px">💵 Net Cash In — Naqd Pul Tushumi</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Tanlangan davr ichida <b>kassaga, kartaga va bankka haqiqatda tushgan to'lovlar</b> summasi. MRR dan farqi — bu <b>real pul</b>, qog'ozdagi emas.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Cash In ≥ MRR — barcha kutilgan to\'lovlar vaqtida yig\'ilgan. <b>Moliyaviy oqim sog\'lom.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Cash In < MRR — bir qism mijozlar to\'lovni kechiktirmoqda. <b>DSO ko\'rsatkichini kuzating.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Cash In << MRR — jiddiy qarzdorlik! Operatsion xarajatlar uchun <b>naqd pul yetishmasligi</b> xavfi bor.')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Cash:</b> Naqd to'lovlar | <b>Card:</b> Karta orqali | <b>Bank:</b> Bank o'tkazmasi<br>
        <b>⚠️ Risk:</b> MRR o'sib borsa ham Cash In past bo'lsa — biznes qog'ozda boy, lekin real hayotda kassada pul yo'q. Bu SaaS uchun <b>eng xavfli holat.</b>
      </div>`,

    'dso': `<h4 style="margin:0 0 10px">⏱️ DSO — Days Sales Outstanding</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Mijozlardan to'lovni yig'ish <b>o'rtacha necha kun</b> davom etishini ko'rsatadi. DSO qancha kichik bo'lsa — naqd pul oqimi shuncha tez va sog'lom.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi (< 30 kun):</b> Mijozlar to\'lovni <b>o\'z vaqtida</b> qilmoqda. Kassada doim naqd bor — operatsion muammolar yo\'q.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (30-60 kun):</b> Ba\'zi mijozlar <b>kechiktirmoqda.</b> Eslatma va sanksiya tizimini kuchaytirish kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (60+ kun):</b> Jiddiy qarzdorlik! Daromadning katta qismi <b>yig\'ilmagan qarz</b> holida yotmoqda. Ish haqi va server xarajatlariga pul yetishmasligi xavfi.')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Formula:</b> (Umumiy qarzdorlik ÷ Davr daromadi) × Kunlar soni<br>
        <b>⚠️ Risk:</b> DSO oshib borsa — bu churnning "yashirin belgisi" bo'lishi mumkin. To'lamaydigan mijoz ertaga ketadigan mijozdir.
      </div>`,

    'conc': `<h4 style="margin:0 0 10px">🏢 Revenue Concentration — Daromad Konsentratsiyasi</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Umumiy daromadning <b>eng yirik mijozlarga qanchalik bog'liq</b> ekanligini ko'rsatadi. Top 5 va Top 10 ulushini o'lchaydi.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi (Top 5 < 25%):</b> Daromad <b>keng tarqalgan.</b> Birorta yirik mijoz ketsa ham biznesga jiddiy zarar yetmaydi.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (Top 5 = 25-50%):</b> Bir nechta yirik shartnomaga <b>o\'rtacha bog\'liqlik.</b> Bu mijozlarni alohida e\'tibor bilan boshqaring.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (Top 5 > 50%):</b> Daromadning yarmi 5 ta mijozda! <b>Birontasi ketsa kassaga jiddiy zarba.</b> Mijozlar bazasini diversifikatsiya qiling.')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Top 10:</b> Eng katta 10 ta mijozning umumiy MRRdagi ulushi.<br>
        <b>⚠️ Risk:</b> Konsentratsiya yuqori bo'lsa, yirik mijoz bilan munosabat buzilishi butun kompaniya moliyaviy holatini buzadi. <b>Har bir yirik mijozga alohida Account Manager biriktiring.</b>
      </div>`,

    'ltv': `<h4 style="margin:0 0 10px">💎 LTV — Customer Lifetime Value</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Bitta mijoz <b>kompaniyangiz bilan hamkorlik davomida jami qancha daromad</b> olib kelishini bashorat qiladi. LTV = ARPA ÷ Oylik Churn Rate.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi ($5,000+):</b> Har bir mijoz uzoq muddatli va <b>juda qimmatli.</b> Investorlarga juda yoqadigan ko\'rsatkich.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha ($2,000-$5,000):</b> Mijozlar o\'rtacha muddatda qolishmoqda. <b>Retention strategiyangizni kuchaytiring.</b>')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<$2,000):</b> Mijozlar tez ketmoqda yoki kam to\'lamoqda. <b>Mahsulot qiymatini oshiring yoki churnni kamaytiring.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Formula:</b> ARPA ÷ Oylik Churn Rate<br>
        <b>LTV:CAC nisbati:</b> Ideal holda LTV kamida CAC dan <b>3x</b> katta bo'lishi kerak.<br>
        <b>⚠️ Risk:</b> LTV past bo'lsa, yangi mijoz jalb qilish xarajatlari (CAC) o'zini oqlamaydi — har bir yangi sotuv zarar keltiradi.
      </div>`,

    'qr': `<h4 style="margin:0 0 10px">⚡ SaaS Quick Ratio</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6">Biznesning <b>o'sish samaradorligini</b> o'lchaydi. Quick Ratio = (New MRR + Expansion) ÷ (Churn + Contraction). Kiruvchi daromad chiquvchidan qancha ustun ekanligini ko'rsatadi.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi (4x va yuqori):</b> Har $1 yo\'qotishga $4+ kirib kelmoqda. <b>Biznes juda sog\'lom va tez o\'smoqda.</b>')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (2-4x):</b> O\'sish bor, lekin <b>churnga e\'tibor qaratish kerak.</b> Biznes barqaror, lekin ideal emas.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (<2x):</b> Yo\'qotish o\'sishni yeb turibdi! Har $1 kirimga deyarli $0.5+ chiqim. <b>Tezda churn va contraction sabablarini aniqlang.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Formula:</b> (New MRR + Expansion MRR) ÷ (Churned MRR + Contraction MRR)<br>
        <b>⚠️ Risk:</b> Quick Ratio 1x dan past bo'lsa — biznes qisqarmoqda. Har oyda oldingi oydan kam pul kirib keladi.
      </div>`,

    'grr': `<h4 style="margin:0 0 10px">🛡️ GRR — Gross Revenue Retention</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6"><b>Mavjud mijozlardan daromadning saqlanish</b> darajasi — faqat yo'qotishlar hisobga olinadi (Expansion <b>kirmaydi</b>). GRR = (Oldingi MRR − Churn − Contraction) ÷ Oldingi MRR.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi (≥ 95%):</b> Mavjud mijozlardan daromad deyarli <b>to\'liq saqlanmoqda.</b> Churn va contraction minimal — eng sog\'lom holat.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha (85–95%):</b> Har oyda biroz daromad yo\'qolmoqda. <b>Churn yoki contraction kuchaymoqda</b> — sabablarni aniqlang.')}
        ${bx('#e74c3c','🔴','<b>Xavfli (< 85%):</b> Mavjud bazadan jiddiy daromad yo\'qolmoqda! <b>Retention strategiyasini zudlik bilan ko\'rib chiqing.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>GRR vs NRR:</b> NRR Expansion ni ham hisoblaydi, GRR esa faqat yo'qotishlarni ko'rsatadi. GRR har doim NRR dan ≤.<br>
        <b>Formula:</b> (Oldingi MRR − Churn MRR − Contraction MRR) ÷ Oldingi MRR × 100<br>
        <b>⚠️ Risk:</b> GRR past bo'lsa, Expansion bilan yashirinadi — NRR yaxshi ko'rinsa ham aslida mijozlar bazasi emirilmoqda.
      </div>`,

    'lc': `<h4 style="margin:0 0 10px">🔄 Logo vs Revenue Churn</h4>
      <div style="font-size:12.5px;color:var(--text2);margin-bottom:14px;line-height:1.6"><b>Logo Churn</b> — ketgan mijozlar soni (%). <b>Revenue Churn</b> — yo'qotilgan daromad (%). Ikkalasini qiyoslash muhim chunki farq katta bo'lishi mumkin.</div>
      <div style="margin-bottom:14px">
        ${bx('#2ecc96','🟢','<b>Yaxshi:</b> Logo Churn <b>< 3%</b>, Revenue Churn <b>< 2%.</b> Mijozlar ham, daromad ham barqaror.')}
        ${bx('#f0b020','🟡','<b>O\'rtacha:</b> Logo Churn <b>3-5%</b>, Revenue Churn <b>2-5%.</b> Churn boshqaruvi kerak.')}
        ${bx('#e74c3c','🔴','<b>Xavfli:</b> Logo Churn <b>> 5%</b> yoki Revenue Churn <b>> 5%.</b> Jiddiy mijoz yo\'qotish. <b>Sabab tahlili zudlik bilan kerak.</b>')}
      </div>
      <div style="font-size:11.5px;line-height:1.6;color:var(--text2)">
        <b>Logo > Revenue:</b> Ko'p kichik mijozlar ketmoqda, lekin yiriklari qolmoqda — <b>Revenue Concentration</b> xavfi oshadi.<br>
        <b>Logo < Revenue:</b> Kam, lekin <b>yirik mijozlar</b> ketmoqda — bu eng xavfli senariy!<br>
        <b>⚠️ Risk:</b> Revenue Churn yuqori, Logo Churn past bo'lsa — portfelingizning eng qimmatli qismi ketayotganini anglatadi.
      </div>`
  };
  o.innerHTML=`<div class="modal" style="max-width:440px">${d[k]||''}<div style="margin-top:20px"><button class="btn btn-primary w-100" style="padding:10px" onclick="this.closest('.overlay').remove()">Tushunarli</button></div></div>`;
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
const pre=S.dashPre||'y';const isCust=pre==='c';
const presets=[{k:'w',l:'Hafta'},{k:'m',l:'Oy'},{k:'q',l:'Chorak'},{k:'y',l:'Yil'},{k:'30',l:'30k'},{k:'90',l:'90k'},{k:'25',l:'2025'},{k:'24',l:'2024'},{k:'c',l:'Oraliq'}];
return`<div class="page-header"><div><div class="page-title">Dashboard</div><div class="page-sub">${tot} ta shartnoma, ${clients.length} ta mijoz</div></div>
<div style="display:flex;align-items:center;gap:6px">
<button class="btn" onclick="showDashSettingsModal()" title="Dashboard sozlamalari"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>
<button class="btn" onclick="showReportModal()" title="PDF hisobot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button><button class="btn" onclick="if(S.config)loadFromConfig(S.config);else showConfig()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1 -2.12-9.36L23 10"/></svg></button></div></div>
<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
${presets.map(p=>`<button class="btn${pre===p.k?' btn-primary':''}" style="padding:5px 12px;font-size:11.5px" onclick="${p.k==='c'?"S.dashPre='c';render()":"applyPreset('"+p.k+"')"}">${p.l}</button>`).join('')}
${isCust?`<div style="display:flex;gap:4px;align-items:center;margin-left:4px">
<input type="date" class="flt" style="font-size:11px;padding:5px" value="${S.dashFrom.toISOString().slice(0,10)}" onchange="S.dashFrom=new Date(this.value);clearCache();render()">
<span style="color:var(--text3)">→</span>
<input type="date" class="flt" style="font-size:11px;padding:5px" value="${S.dashTo.toISOString().slice(0,10)}" onchange="S.dashTo=new Date(this.value);clearCache();render()">
</div>`:''}
<span style="font-size:10.5px;color:var(--text3);margin-left:4px">${dr.gran==='day'?'kunlik':'oylik'}</span>
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
  <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val anim-val" data-val="${curMRR}" data-fmt="2">0</div>
  ${c.mrr.g?`<div class="metric-foot"><span class="${mrrDelta>=0?'up':'dn'}">${mrrDelta>=0?'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} $${fk(Math.abs(mrrDelta))} (${mrrPct>0?'+':''}${mrrPct}%)</span></div>`:''}</div>
  ${c.mrr.arr?`<div class="metric-foot" style="margin-top:6px">ARR: <span class="mono" style="color:var(--text)">$${fk(curMRR*12)}</span></div>`:''}</div>`;
  
  if(c.nrr?.s) h+=`<div class="metric c5"><div class="metric-head"><div class="metric-lbl">NRR</div><span class="metric-info" onclick="showMetricInfo('nrr')">i</span></div>
  <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val">${nrrVal.toFixed(1)}</div><span style="font-size:16px;font-weight:600;color:var(--text);margin-left:-4px">%</span></div>
  <div style="display:flex;gap:20px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
  ${c.nrr.n?`<div><div style="font-size:10px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">New</div><div class="up" style="font-weight:600;font-size:12px;font-family:var(--mono)">+$${fk(mrrFromNew)}</div></div>`:''}
  ${c.nrr.e?`<div><div style="font-size:10px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">Net Exp</div><div class="${netExp>=0?'up':'dn'}" style="font-weight:600;font-size:12px;font-family:var(--mono)">${netExp>=0?'+':''}$${fk(netExp)}</div></div>`:''}
  ${c.nrr.c?`<div><div style="font-size:10px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">Churn</div><div class="dn" style="font-weight:600;font-size:12px;font-family:var(--mono)">-$${fk(mrrFromChurn)}</div></div>`:''}</div></div>`;

  // GRR — Gross Revenue Retention (saqlanish, Expansion hisobga olinmaydi)
  if(c.nrr?.s){
    const grrVal=dr.grr||0;
    const grrCol=grrVal>=95?'var(--green)':grrVal>=85?'var(--amber)':'var(--red)';
    h+=`<div class="metric c4"><div class="metric-head"><div class="metric-lbl">GRR</div><span class="metric-info" onclick="showMetricInfo('grr')">i</span></div>
    <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val" style="color:${grrCol}">${grrVal.toFixed(1)}</div><span style="font-size:16px;font-weight:600;color:var(--text);margin-left:-4px">%</span></div>
    <div class="metric-foot" style="margin-top:8px;font-size:10.5px;color:var(--text3)">Churn + Contraction yo'qotish</div></div>`;
  }
  
  if(c.cust?.s) h+=`<div class="metric c2"><div class="metric-head"><div class="metric-lbl">Active Customers</div><span class="metric-info" onclick="showMetricInfo('cust')">i</span></div>
  <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val anim-val" data-val="${curClients}">0</div>
  ${c.cust.g?`<div class="metric-foot"><span class="${clientDelta>=0?'up':'dn'}">${clientDelta>=0?'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} ${Math.abs(clientDelta)} ${clientPctStr}</span></div>`:''}</div>
  <div class="metric-foot" style="margin-top:6px">${c.cust.ch?`Churn Rate: <span class="mono" style="color:${churnRate>5?'var(--red)':'var(--text)'}">${churnRate.toFixed(1)}%</span>`:''}</div></div>`;
  
  if(c.arpa?.s) h+=`<div class="metric c3"><div class="metric-head"><div class="metric-lbl">ARPA</div><span class="metric-info" onclick="showMetricInfo('arpa')">i</span></div>
  <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val anim-val" data-val="${arpa}" data-fmt="2">0</div>
  ${c.arpa.g?`<div class="metric-foot"><span class="${arpaD>=0?'up':'dn'}">${arpaD>=0?'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>':'<svg style="width:10px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>'} $${fk(Math.abs(arpaD))} (${arpaPct>0?'+':''}${arpaPct}%)</span></div>`:''}</div></div>`;
  
  if(c.cac?.s) {
    const cacVal = Math.round(dr.cac||0);
    h+=`<div class="metric c4"><div class="metric-head"><div class="metric-lbl">CAC</div><span class="metric-info" onclick="showMetricInfo('cac')">i</span></div>
    <div style="display:flex;align-items:baseline;gap:6px"><div class="metric-val anim-val" data-val="${cacVal}" data-fmt="2">0</div><span style="font-size:13px;color:var(--text3)">USD</span></div>
    <div class="metric-foot" style="margin-top:6px;font-size:10px;color:var(--text3)">Mijoz jalb qilish narxi</div></div>`;
  }
  
  if(c.cash?.s!==false) h+=`<div class="metric c6"><div class="metric-head"><div class="metric-lbl">Net Cash In</div><span class="metric-info" onclick="showMetricInfo('cash')">i</span></div>
  <div style="display:flex;align-items:baseline;gap:8px"><div class="metric-val anim-val" data-val="${cashIn}" data-fmt="2">0</div><span style="font-size:16px;font-weight:600;color:var(--text);margin-left:-4px">USD</span></div>
  <div style="display:flex;gap:15px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
    <div><div style="font-size:9px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">Cash</div><div style="font-weight:600;font-size:11.5px;font-family:var(--mono)">$${fk(cashInBreak.naqd)}</div></div>
    <div><div style="font-size:9px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">Card</div><div style="font-weight:600;font-size:11.5px;font-family:var(--mono)">$${fk(cashInBreak.karta)}</div></div>
    <div><div style="font-size:9px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px">Bank</div><div style="font-weight:600;font-size:11.5px;font-family:var(--mono)">$${fk(cashInBreak.bank)}</div></div>
  </div></div>`;





  if(c.qr?.s) {
    const qrVal = dr.quickRatio||0;
    const qrDisp = qrVal >= 99 ? '∞' : qrVal.toFixed(1);
    const qrColor = qrVal >= 4 ? 'var(--green)' : qrVal >= 2 ? 'var(--amber)' : 'var(--red)';
    h+=`<div class="metric c1"><div class="metric-head"><div class="metric-lbl">SaaS Quick Ratio</div><span class="metric-info" onclick="showMetricInfo('qr')">i</span></div>
    <div style="display:flex;align-items:baseline;gap:6px"><div class="metric-val" style="color:${qrColor}">${qrDisp}</div><span style="font-size:13px;color:var(--text3)">x</span></div>
    <div class="metric-foot" style="margin-top:6px;font-size:10px;color:var(--text3)">O'sish / Yo'qotish nisbati</div></div>`;
  }


  
  return h;
})()}
</div>

${(()=>{
  const c=S.dashCards||{}; let h='';
  if(c.chTrend?.s!==false || c.chComp?.s!==false){
    h+=`<div class="grid-2" style="margin-top:20px;margin-bottom:20px">`;
    if(c.chTrend?.s!==false) h+=`<div class="card"><div class="card-head" style="margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;font-size:11px;color:var(--text3);font-weight:600">TOTAL MRR TREND</div><div class="card-body"><div class="chart-wrap" style="height:320px"><canvas id="chTrend"></canvas></div></div></div>`;
    if(c.chComp?.s!==false) h+=`<div class="card"><div class="card-head" style="margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;font-size:11px;color:var(--text3);font-weight:600">MRR COMPONENTS</div><div class="card-body"><div class="chart-wrap" style="height:320px"><canvas id="chComponents"></canvas></div></div></div>`;
    h+=`</div>`;
  }
  
  // === MRR GROWTH + NET MOVEMENT (side by side) ===
  const showGr = c.cMrrGr?.s!==false && dr.mrrGrowthPcts.length>1;
  const showNm = c.cNetMov?.s!==false;
  if(showGr || showNm){
    h+=`<div class="grid-2" style="margin-top:14px">`;

    // MRR GROWTH RATE SPARKLINE
    if(showGr){
      const pcts=dr.mrrGrowthPcts;
      const maxAbs=Math.max(...pcts.map(p=>Math.abs(p)),1);
      h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>MRR Growth Rate (%)</span></div>
      <div class="card-body" style="display:flex;align-items:flex-end;gap:3px;height:80px;padding:12px 16px">`;
      pcts.forEach((p,i)=>{
        const noData = i===0 && p===0;
        const h2=Math.max(4,Math.abs(p)/maxAbs*60);
        const col=noData?'var(--border2)':p>0?'var(--green)':p<0?'var(--red)':'var(--border2)';
        const tip=noData?`${dr.labels[i]}: ma'lumot yo'q`:`${dr.labels[i]}: ${p>0?'+':''}${p}%`;
        h+=`<div title="${tip}" style="flex:1;height:${h2}px;background:${col};border-radius:3px 3px 0 0;min-width:6px;cursor:help;transition:all .2s;opacity:${noData?0.4:1}"></div>`;
      });
      h+=`</div><div style="display:flex;justify-content:space-between;padding:0 16px 10px;font-size:9.5px;color:var(--text3)"><span>${dr.labels[1]||''}</span><span>${dr.labels[dr.labels.length-1]||''}</span></div></div>`;
    }

    // NET MRR MOVEMENT WATERFALL
    if(showNm){
      const nm=dr.netMovement;
      const nciLabel = nm.newClientIntraExp>0 ? ` <span title="Yangi mijozlarning davr ichida qo'shgan qo'shimcha shartnomasi: +${fmt(nm.newClientIntraExp)}" style="font-size:9px;color:var(--text3);cursor:help">+NCI</span>` : '';
      const items=[
        {label:'Yangi',val:nm.newMRR,col:'var(--green)',sign:'+'},
        {label:`Kengayish${nciLabel}`,val:nm.expMRR,col:'var(--teal)',sign:'+'},
        {label:'Churn',val:nm.churnMRR,col:'var(--red)',sign:'-'},
        {label:'Contraction',val:nm.conMRR,col:'var(--amber)',sign:'-'}
      ];
      const maxV=Math.max(...items.map(x=>x.val),1);
      h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent2)"></span>Net MRR Movement <span style="color:${nm.net>=0?'var(--green)':'var(--red)'};font-weight:700">${nm.net>=0?'+':''}${fmt(nm.net)}</span></span></div>
      <div class="card-body" style="padding:14px 18px">`;
      items.forEach(it=>{
        const w=Math.max(4,Math.round(it.val/maxV*100));
        h+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:80px;font-size:11px;color:var(--text2)">${it.label}</div>
          <div style="flex:1;background:var(--bg3);border-radius:4px;height:18px;overflow:hidden">
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
    h+=`<div class="grid-2" style="margin-top:14px">`;
    if(c.tNew?.s!==false) h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--green)"></span>New (${totalNew}) <span style="color:var(--green);font-weight:600">+${fmt(mrrFromNew)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:340px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="text-r">MRR</th></tr></thead><tbody>${newClients.length?newClients.map(c=>{return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:600;font-size:12px">'+cl(c.name)+'</td><td class="col-hide" style="font-size:11px;color:var(--text2)">'+(c.mgr||'—')+'</td><td class="text-r mono" style="color:var(--green);font-weight:600">+'+fmt(c.mrr)+'</td></tr>'}).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>`;
    if(c.tChurn?.s!==false) h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--red)"></span>Churn (${totalChurn}) <span style="color:var(--red);font-weight:600">-${fmt(mrrFromChurn)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:340px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="text-r">MRR</th></tr></thead><tbody>${churnClients.length?churnClients.map(c=>{const badge = c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''; return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="col-hide" style="font-size:11px;color:var(--text2)">'+(c.mgr||'—')+'</td><td class="text-r mono" style="color:var(--red);font-weight:600">-'+fmt(c.mrr)+'</td></tr>'}).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>`;
    h+=`</div>`;
  }

  if(c.tExp?.s!==false){
    const expansions = expClients.filter(x=>x.delta > 0);
    const contractions = expClients.filter(x=>x.delta < 0);
    const mrrExpOnly = expansions.reduce((s,x)=>s+x.delta,0);
    const mrrConOnly = contractions.reduce((s,x)=>s+Math.abs(x.delta),0);

    h+=`<div class="grid-2" style="margin-top:14px">`;
    // EXPANSION TABLE
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--teal)"></span>Expansion (${expansions.length}) <span style="color:var(--green);font-weight:600">+${fmt(mrrExpOnly)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="text-r">Oldin</th><th class="text-r">Hozir</th><th class="text-r">Farq</th></tr></thead><tbody>${expansions.length?expansions.map(c=>{const badge = (c.isRes?' <span class="badge b-amber" style="font-size:8px;padding:1px 4px">Q</span>':'') + (c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''); return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="text-r mono" style="font-size:11px;color:var(--text3)">'+fmt(c.mrrStart)+'</td><td class="text-r mono" style="font-size:11px">'+fmt(c.mrrEnd)+'</td><td class="text-r mono" style="font-size:11px;font-weight:600;color:var(--green)">+'+fmt(c.delta)+'</td></tr>'}).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>`;
    
    // CONTRACTION TABLE
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--amber)"></span>Contraction (${contractions.length}) <span style="color:var(--red);font-weight:600">-${fmt(mrrConOnly)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="text-r">Oldin</th><th class="text-r">Hozir</th><th class="text-r">Farq</th></tr></thead><tbody>${contractions.length?contractions.map(c=>{const badge = c.isIntra?' <span class="badge b-accent" style="font-size:10px;padding:0 2px">🔄</span>':''; return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+cl(c.name)+badge+'</td><td class="text-r mono" style="font-size:11px;color:var(--text3)">'+fmt(c.mrrStart)+'</td><td class="text-r mono" style="font-size:11px">'+fmt(c.mrrEnd)+'</td><td class="text-r mono" style="font-size:11px;font-weight:600;color:var(--red)">-'+fmt(Math.abs(c.delta))+'</td></tr>'}).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>`;
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
let d=[...S.rows];
if(S.cQ){const q=S.cQ.toLowerCase();d=d.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q)||(r.INN||'').includes(q))}
if(S.cS)d=d.filter(r=>sc(r.status)===S.cS);if(S.cM)d=d.filter(r=>r.Manager===S.cM);if(S.cR)d=d.filter(r=>r.Hudud===S.cR);
const t=d.length,pg=Math.ceil(t/S.cN),sl=d.slice(S.cP*S.cN,(S.cP+1)*S.cN);
const so=[{v:'',l:'Barcha'},{v:'A',l:'Aktiv'},{v:'D',l:'Bajarildi'},{v:'Q',l:'Eski qarz'},{v:'P',l:'Muammo'},{v:'O',l:'Ortiqcha'},{v:'X',l:'Bekor'}];
const hasPay=S.payRows.length||S.y2024Rows.length||S.perevodRows.length;
const view=S.cView||'royyat';
let h=_pageTabs([{v:'royyat',l:"Ro'yxat"},{v:'muddatlar',l:'Muddatlar'}],view,'cView');

if(view==='muddatlar'){
  // Extended renewal calendar: 90 days ahead + 30 days expired
  const now=new Date();const rnMap={};
  [...S.rows,...S.qRows].forEach(r=>{
    if(!r.Client)return;const musd=r._mUSD||pn(r['Oylik USD'])||0;if(musd<=0)return;
    const en=pd(r['amal qilishi']);if(!en)return;
    const name=r.Client;
    if(!rnMap[name])rnMap[name]={name,endDate:en,mrr:0,mgr:r.Manager||''};
    rnMap[name].mrr+=musd;
    if(en<rnMap[name].endDate){rnMap[name].endDate=en;rnMap[name].mgr=r.Manager||''}
  });
  const rnAll=Object.values(rnMap).map(c=>({...c,daysLeft:Math.round((c.endDate-now)/864e5)})).filter(c=>c.daysLeft<=7&&c.daysLeft>=-7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const ctExp=rnAll.filter(r=>r.daysLeft<0).length,ctAhead=rnAll.filter(r=>r.daysLeft>=0).length;
  h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--amber)"></span>Muddat Kalendari (±7 kun) — <span style="color:var(--green);font-weight:700">${ctAhead}</span> tugayotgan${ctExp?` / <span style="color:var(--text3)">${ctExp} tugagan</span>`:''}</span></div>
  <div class="card-body dash-new-full" style="padding:0"><div class="tbl-scroll" style="max-height:calc(100vh - 220px)"><table><thead><tr><th>Mijoz</th><th>Menejer</th><th class="text-r">MRR</th><th class="text-r">Qoldi</th></tr></thead><tbody>`;
  if(rnAll.length)rnAll.forEach(r=>{
    const expired=r.daysLeft<0;
    const dc=expired?'var(--text3)':r.daysLeft<=5?'var(--red)':r.daysLeft<=10?'var(--amber)':'var(--green)';
    const nm=expired?`<span style="text-decoration:line-through;opacity:0.6">${r.name}</span>`:r.name;
    const dl=expired?`<span style="font-size:10px;color:var(--text3)">${Math.abs(r.daysLeft)} kun oldin</span>`:`${r.daysLeft} kun`;
    h+=`<tr${expired?' style="opacity:0.5"':''}><td style="font-weight:600;font-size:12px">${nm}</td><td style="font-size:11px;color:var(--text2)">${r.mgr||'—'}</td><td class="text-r mono" style="font-size:11px">${fmt(r.mrr)}</td><td class="text-r mono" style="font-size:11px;font-weight:700;color:${dc}">${dl}</td></tr>`;
  });else h+=`<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">Yaqinda tugaydigan shartnoma yo'q ✅</td></tr>`;
  h+=`</tbody></table></div></div></div>`;
}else{
  h+=`<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, firma, INN..." value="${S.cQ}" oninput="onSearch('cQ',this.value)"><button class="search-clear" onclick="onSearch('cQ','');render()" type="button">&times;</button></div>
<select class="flt" onchange="S.cS=this.value;S.cP=0;clearCache();render()">${so.map(o=>`<option value="${o.v}"${S.cS===o.v?' selected':''}>${o.l}</option>`).join('')}</select>
<select class="flt" onchange="S.cM=this.value;S.cP=0;clearCache();render()"><option value="">Barcha menejerlar</option>${uq('Manager').map(m=>`<option value="${m}"${S.cM===m?' selected':''}>${m}</option>`).join('')}</select>
<select class="flt" onchange="S.cR=this.value;S.cP=0;clearCache();render()"><option value="">Barcha hududlar</option>${uq('Hudud').map(r=>`<option value="${r}"${S.cR===r?' selected':''}>${r}</option>`).join('')}</select></div>`;
  h+=`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>№</th><th>Mijoz</th><th>Firma</th><th>Hudud</th><th>Menejer</th><th>Sana</th><th>Tugash</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th>${hasPay?'<th class="text-r">To\'langan</th><th class="text-r">Qarz</th>':''}<th>Status</th></tr></thead><tbody>${sl.map(r=>{
const k=r.Client+'|'+r.raqami;const qExtra=qm[k]||0;const totalSum=r._sUSD+qExtra;
const p=pm[k]||{total:0};const qarz=Math.round(totalSum-p.total)||0;const qarzD=Math.abs(qarz)<=1?0:qarz;
const qC=qarzD>0?'var(--red)':qarzD<0?'var(--amber)':'var(--green)';const qW=qarzD>0?'600':'400';
return`<tr><td class="mono" style="font-size:10px;color:var(--text3)">${r.raqami||'—'}</td><td style="font-weight:600">${r.Client?cl(r.Client):'—'}</td><td style="color:var(--text2);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${r['Firma nomi']||'—'}</td><td style="font-size:11px">${r.Hudud||'—'}</td><td style="font-size:12px">${r.Manager||'—'}</td><td class="mono" style="font-size:10.5px">${r.sanasi||'—'}</td><td class="mono" style="font-size:10.5px">${r['amal qilishi']||'—'}</td><td class="text-r mono">${fmt(r._mUSD)}</td><td class="text-r mono">${fmt(totalSum)}${qExtra?'<span style="font-size:9px;color:var(--teal)"> +'+fmt(qExtra)+'</span>':''}</td>${hasPay?'<td class="text-r mono" style="color:var(--green)">'+(p.total?fmt(p.total):'—')+'</td><td class="text-r mono" style="color:'+qC+';font-weight:'+qW+'">'+(totalSum?fmt(qarzD):'—')+'</td>':''}<td>${sb(r.status)}</td></tr>`}).join('')}</tbody></table></div></div>${pag(S.cP,pg,t,S.cN,'cP')}`;
}
return h;
}

// === CONTRACTS ===
function rC(){
let d=[...S.rows];
if(S.cQ){const q=S.cQ.toLowerCase();d=d.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q)||(r.INN||'').includes(q))}
if(S.cS)d=d.filter(r=>sc(r.status)===S.cS);if(S.cM)d=d.filter(r=>r.Manager===S.cM);if(S.cR)d=d.filter(r=>r.Hudud===S.cR);
const t=d.length;
let h=`<div class="page-header"><div><div class="page-title">Shartnomalar</div><div class="page-sub">${t} ta</div></div><button class="btn-outline" style="padding:7px 11px" onclick="showDlMenu(this,'contracts')" title="Yuklab olish">${_dlSvg}</button></div>`;
return h+_rCBody();
}

// === MRR SUB-VIEW HELPERS ===
function _mrrToolbar(yr){
  return`<div class="toolbar" style="margin-bottom:12px;gap:10px">
  <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, menejer, hudud..." value="${S.mrrQ||''}" oninput="onSearch('mrrQ',this.value)"><button class="search-clear" onclick="onSearch('mrrQ','');render()" type="button">&times;</button></div>
  <div style="display:flex;gap:4px">${[yr-1,yr,yr+1].map(y=>`<button class="btn${y===yr?' btn-primary':''}" style="padding:7px 16px;font-size:13px;font-weight:600" onclick="S.mrrYear=${y};clearCache();render()">${y}</button>`).join('')}</div>
  </div>`;
}


// === MRR CARD + TIMELINE VIEW ===
function rMRRCard(){
  const yr=S.mrrYear||2026;const d=mrrData(yr);
  const now=new Date();const curM=now.getFullYear()===yr?now.getMonth():(yr<now.getFullYear()?11:0);
  const cumExp=calcCumExpected(yr);
  const _pm=calcPayments();const clPay={};Object.values(_pm).forEach(v=>{clPay[v.client]=(clPay[v.client]||0)+v.total});
  let filtered=[...d.clients];
  if(S.mrrQ){const q=S.mrrQ.toLowerCase();filtered=filtered.filter(c=>c.name.toLowerCase().includes(q)||(c.mgr||'').toLowerCase().includes(q)||(c.hudud||'').toLowerCase().includes(q))}
  const cards=filtered.map(c=>{
    const isActive=c.monthly[curM]>0;
    const firstM=c.monthly.findIndex(v=>v>0);const lastM=11-[...c.monthly].reverse().findIndex(v=>v>0);
    const barL=Math.round(firstM/12*100),barW=Math.round((lastM-firstM+1)/12*100);
    const ce=cumExp[c.name];const paid=clPay[c.name]||0;
    const exp=ce?(ce.cum[curM]||0):0;
    const paidPct=exp>0?Math.min(100,Math.round(paid/exp*100)):null;
    const pCol=paidPct==null?'var(--text3)':paidPct>=100?'var(--green)':paidPct>=70?'var(--amber)':'var(--red)';
    const mrrCol=isActive?'var(--accent2)':'var(--text3)';
    const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return`<div class="card" style="padding:0">
      <div style="padding:12px 14px 8px;display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${cl(c.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${c.mgr||'—'}${c.hudud?' · '+c.hudud:''}</div>
        </div>
        <div style="text-align:right;margin-left:8px;flex-shrink:0">
          <div class="mono" style="font-size:18px;font-weight:800;color:${mrrCol};line-height:1">${isActive?fmt(c.mrr):'—'}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:1px">$/oy</div>
        </div>
      </div>
      <div style="padding:0 14px 10px">
        <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-bottom:3px">
          ${mos.filter((_,i)=>i%3===0).map(m=>`<span>${m}</span>`).join('')}
        </div>
        <div style="position:relative;height:8px;background:var(--border);border-radius:4px;margin-bottom:8px">
          <div style="position:absolute;left:${barL}%;width:${barW}%;height:8px;border-radius:4px;background:${isActive?'var(--accent)':'var(--text3)'};opacity:${isActive?'0.85':'0.35'}"></div>
        </div>
        ${paidPct!=null?`<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
          <span style="color:var(--text3)">${c.monthly.filter(v=>v>0).length} oy aktiv</span>
          <span style="color:${pCol};font-weight:600">${paidPct}% to'langan</span>
        </div>
        <div style="height:4px;background:var(--border);border-radius:2px">
          <div style="width:${Math.min(100,paidPct)}%;height:4px;border-radius:2px;background:${pCol}"></div>
        </div>`:`<div style="font-size:11px;color:var(--text3)">${c.monthly.filter(v=>v>0).length} oy aktiv</div>`}
      </div>
      <div style="padding:6px 14px 10px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:11px;color:var(--text3)">${c.dealStart||''}${c.dealEnd?' – '+c.dealEnd:''}</span>
        ${isActive?'<span class="badge b-green" style="font-size:10px">Aktiv</span>':'<span class="badge" style="font-size:10px;background:var(--bg3);color:var(--text3)">Tugadi</span>'}
      </div>
    </div>`;
  }).join('');
  return _mrrToolbar(yr)+`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
  ${cards||'<div style="color:var(--text3);padding:24px">Ma\'lumot yo\'q</div>'}
  </div>`;
}



// === MRR TABLE ===
function rMRR(){
  const view=S.mrrView||'main';
  if(view==='card')return rMRRCard();
const yr=S.mrrYear||2026;const d=mrrData(yr);const cumExp=calcCumExpected(yr);
const _pm=calcPayments();const clPay={};Object.values(_pm).forEach(v=>{clPay[v.client]=(clPay[v.client]||0)+v.total});
const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const cc=S.mrrCols;let filtered=[...d.clients];
if(S.mrrQ){const q=S.mrrQ.toLowerCase();filtered=filtered.filter(c=>c.name.toLowerCase().includes(q)||c.mgr.toLowerCase().includes(q)||(c.hudud||'').toLowerCase().includes(q))}
const colDefs=[{k:'mgr',l:'Manager'},{k:'hudud',l:'Hudud'},{k:'mrr',l:'MRR'},{k:'deal',l:'Deal boshi'},{k:'end',l:'Deal tugashi'}];
const setPanel=S.mrrSet?`<div class="mrr-set">${colDefs.map(c=>`<label><input type="checkbox" ${cc[c.k]?'checked':''} onchange="S.mrrCols.${c.k}=this.checked;render()">${c.l}</label>`).join('')}</div>`:'';
const exCols=(cc.mgr?1:0)+(cc.hudud?1:0)+(cc.mrr?1:0)+(cc.deal?1:0)+(cc.end?1:0);

return`<div id="mrrContainer"${S.mrrFs?' class="mrr-fs-active"':''}>
<div class="toolbar" style="margin-bottom:12px;gap:10px">
<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, menejer, hudud..." value="${S.mrrQ||''}" oninput="onSearch('mrrQ',this.value)"><button class="search-clear" onclick="onSearch('mrrQ','');render()" type="button">&times;</button></div>
<div style="display:flex;gap:4px;align-items:center">
${[yr-1,yr,yr+1].map(y=>`<button class="btn${y===yr?' btn-primary':''}" style="padding:7px 16px;font-size:13px;font-weight:600" onclick="S.mrrYear=${y};clearCache();const sp=document.querySelector('.tbl-scroll');const sy=sp?sp.scrollTop:0;render();requestAnimationFrame(()=>{const s=document.querySelector('.tbl-scroll');if(s)s.scrollTop=sy;})"> ${y}</button>`).join('')}
</div>
<div style="margin-left:auto;display:flex;gap:6px;align-items:center;position:relative">
<button class="btn${S.mrrFs?' btn-primary':''}" style="padding:8px 12px" onclick="toggleMrrFullscreen()" title="${S.mrrFs?'Kichraytirish':'To\'liq ekran'}" id="mrrFsBtn">${S.mrrFs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'}</button>
<button class="btn${S.mrrSet?' btn-primary':''}" style="padding:8px 12px" onclick="S.mrrSet=!S.mrrSet;render()" title="Ustunlar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="3"/></svg></button>${S.mrrSet?`<div style="position:fixed;inset:0;z-index:19" onclick="S.mrrSet=false;render()"></div>`:''} ${setPanel}</div>
</div>

<div class="card" style="box-shadow:var(--shadow-lg)"><div class="card-body" style="padding:0">
<div class="tbl-scroll" style="max-height:calc(100vh - 160px)">
<table class="mrr-tbl"><thead><tr>
<th class="sticky-col col-name">Mijoz nomi</th>
${cc.mgr?`<th>Menejer</th>`:''}
${cc.hudud?`<th>Hudud</th>`:''}
${cc.mrr?`<th class="text-r">MRR $</th>`:''}
${cc.deal?`<th class="text-c">Boshi</th>`:''}
${cc.end?`<th class="text-c">Tugashi</th>`:''}
${mos.map(m=>`<th class="mcell">${m}</th>`).join('')}
</tr></thead><tbody>
<tr class="summary-row row-mom"><td class="sticky-col col-name" style="font-size:10.5px;color:var(--text3)">Month-over-Month %</td>${Array(exCols).fill('<td></td>').join('')}${d.mom.map(v=>{const c=v>0?'var(--green)':v<0?'var(--red)':'var(--text3)';return`<td class="mcell" style="color:${c}">${v?(v>0?'+':'')+v.toFixed(1)+'%':'—'}</td>`}).join('')}</tr>
<tr class="summary-row row-total"><td class="sticky-col col-name">Davr yig'indisi (JAMI)</td>${Array(exCols).fill('<td></td>').join('')}${d.totals.map(v=>`<td class="mcell" style="color:var(--text)">${v?fmt(v):'—'}</td>`).join('')}</tr>
${filtered.map(c=>{
const ce=cumExp[c.name];const paid=clPay[c.name]||0;
return`<tr>
<td class="sticky-col col-name">${cl(c.name)}</td>
${cc.mgr?`<td style="font-size:12px;color:var(--text2)">${c.mgr||'—'}</td>`:''}
${cc.hudud?`<td style="font-size:12px;color:var(--text2)">${c.hudud||'—'}</td>`:''}
${cc.mrr?`<td class="mono text-r" style="font-weight:600">${c.mrr?fmt(c.mrr):'—'}</td>`:''}
${cc.deal?`<td class="mono text-c" style="color:var(--text3);font-size:11px">${c.dealStart||'—'}</td>`:''}
${cc.end?`<td class="mono text-c" style="color:var(--text3);font-size:11px">${c.dealEnd||'—'}</td>`:''}
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
  if(!mg.length) return`<div class="page-header"><div><div class="page-title">Menejerlar</div><div class="page-sub">Ma'lumot yuklanmagan</div></div></div><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:12px;color:var(--text3)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><div style="font-size:14px;font-weight:600">Menejer ma'lumotlari topilmadi</div><div style="font-size:12px">Shartnomalar yuklanib, Manager ustuni to'ldirilganda bu sahifa faollashadi.</div></div>`;
  const tM=mg.reduce((s,x)=>s+x.initialMRR,0);
  const co=['#1746a2','#117a52','#c42b1c','#6941b8','#a36207','#0e7c7b','#d4537e','#5a5955','#854f0b','#993556'];
  const view=S.mgrView||'umumiy';
  let h=`<div class="page-header"><div><div class="page-title">Menejerlar</div><div class="page-sub">${mg.length} ta menejer</div></div></div>`;
  h+=_pageTabs([{v:'umumiy',l:'Acquisition'},{v:'reyting',l:'MRR Harakati'}],view,'mgrView');

  if(view==='reyting'){
    const mb=calcManagerBoard();
    h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent2)"></span>MRR Harakati Reytingi <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">· tanlangan davr</span></span></div>
    <div class="card-body dash-new-full" style="padding:0"><div class="tbl-scroll" style="max-height:calc(100vh - 220px)"><table><thead><tr><th>#</th><th>Menejer</th><th class="text-r" title="Yangi mijozlardan kelgan MRR">Yangi</th><th class="text-r col-hide" title="Ketgan mijozlardan yo'qotilgan MRR">Churn</th><th class="text-r col-hide" title="Kengaygan shartnomalardan qo'shimcha MRR">Exp</th><th class="text-r col-hide" title="Qisqargan shartnomalardan kamaygan MRR">Con</th><th class="text-r" title="Yangi + Exp − Churn − Con">Sof MRR</th></tr></thead><tbody>`;
    mb.forEach((m,i)=>{
      const nc=m.netMRR>=0?'var(--green)':'var(--red)';
      h+=`<tr><td style="font-weight:700;color:var(--text3)">${i+1}</td><td style="font-weight:600;font-size:12px"><span class="mgr-link" onclick="showMgrStats('${m.name.replace(/'/g,"\\'")}')">${m.name}</span></td><td class="text-r"><span class="up mono" style="font-size:11px">+${fmt(m.newMRR)}</span> <span style="font-size:9px;color:var(--text3)">(${m.newCount})</span></td><td class="text-r col-hide"><span class="dn mono" style="font-size:11px">-${fmt(m.churnMRR)}</span> <span style="font-size:9px;color:var(--text3)">(${m.churnCount})</span></td><td class="text-r col-hide mono" style="font-size:11px;color:var(--green)">${m.expMRR>0?'+'+fmt(m.expMRR):'—'}</td><td class="text-r col-hide mono" style="font-size:11px;color:${m.conMRR>0?'var(--amber)':'var(--text3)'}">${m.conMRR>0?'-'+fmt(m.conMRR):'—'}</td><td class="text-r mono" style="font-weight:700;color:${nc}">${m.netMRR>=0?'+':''}${fmt(m.netMRR)}</td></tr>`;
    });
    h+=`</tbody></table></div></div></div>`;
  }else{
    h+=`<div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>Olib kelingan MRR ($)</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMM"></canvas></div></div></div>
    <div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--green)"></span>Mijozlar soni</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMC"></canvas></div></div></div></div>
    <div class="tbl-wrap" style="margin-top:14px"><table><thead><tr><th>Menejer</th><th class="text-r">Mijozlar</th><th class="text-r">Olib kelgan MRR ($)</th><th class="text-r">O'rtacha</th><th>Ulush</th></tr></thead><tbody>${mg.map((x,i)=>{const p=tM?Math.round(x.initialMRR/tM*100):0;const av=x.clients?Math.round(x.initialMRR/x.clients):0;return`<tr><td style="font-weight:600"><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${co[i%co.length]};margin-right:7px;vertical-align:middle"></span><span class="mgr-link" onclick="showMgrStats('${x.name.replace(/'/g,"\\'")}')">${x.name}</span></td><td class="text-r mono">${x.clients}</td><td class="text-r mono" style="font-weight:600">${fmt(x.initialMRR)}</td><td class="text-r mono">${fmt(av)}</td><td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${p}%;background:${co[i%co.length]};border-radius:3px;transition:width .5s ease"></div></div><span class="mono" style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${p}%</span></div></td></tr>`}).join('')}</tbody></table></div>`;
  }
  return h;
}

// === CLIENTS ===
function rCl(){
const dr=dashRange();
const ch=calcClientHealth();
const view=S.clView||'umumiy';
const healthy=ch.filter(c=>c.status==='healthy').length, warn=ch.filter(c=>c.status==='warning').length, crit=ch.filter(c=>c.status==='critical').length;

let h=`<div class="page-header"><div><div class="page-title">Mijozlar</div><div class="page-sub">${ch.length} ta korxona tahlili</div></div></div>`;

if(view==='shartnomalar'){
  return h+_rCBody();
}

if(view==='tahlil'){
  const rg=calcRegionalPerf();
  const cq=calcCohorts();
  const maxMRR=Math.max(...rg.map(r=>r.mrr),1);
  const lVal=dr.ltv||0;
  const logoC=Math.round((dr.logoChurnRate||0)*10)/10;
  const revC=Math.round((dr.revenueChurnRate||0)*10)/10;
  h+=`<div class="grid-2">
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--teal)"></span>Hudud bo'yicha tahlil</span></div>
  <div class="card-body dash-new-full" style="padding:0;max-height:400px;overflow-y:auto"><table><thead><tr><th>Hudud</th><th class="text-r">MRR</th><th></th><th class="text-r">Mijozlar</th></tr></thead><tbody>`;
  rg.forEach(r=>{const w=Math.round(r.mrr/maxMRR*100);h+=`<tr style="cursor:pointer" onclick="showRegionModal(${JSON.stringify(r.name)})" title="${r.name} mijozlarini ko'rish"><td style="font-weight:600;font-size:12px">${r.name}</td><td class="text-r mono" style="font-size:11px">${fmt(r.mrr)}</td><td><div style="background:var(--bg3);border-radius:3px;height:12px;overflow:hidden"><div style="width:${w}%;height:100%;background:var(--teal);border-radius:3px"></div></div></td><td class="text-r" style="font-weight:600">${r.count}</td></tr>`;});
  h+=`</tbody></table></div></div>
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--purple)"></span>Mijozlar sadoqati (Retention)</span></div>
  <div class="card-body" style="padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">LOGO CHURN</div><div style="font-size:24px;font-weight:700;color:${logoC>5?'var(--red)':'var(--green)'}">${logoC}%</div></div>
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">REV CHURN</div><div style="font-size:24px;font-weight:700;color:${revC>5?'var(--red)':'var(--green)'}">${revC}%</div></div>
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">LTV</div><div style="font-size:24px;font-weight:700;color:var(--accent)">${lVal>0?fmt(lVal)+'$':'N/A'}</div></div>
      ${dr.ltvCac>0?`<div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">LTV:CAC</div><div style="font-size:24px;font-weight:700;color:${dr.ltvCac>=3?'var(--green)':dr.ltvCac>=1?'var(--amber)':'var(--red)'}">${dr.ltvCac.toFixed(1)}x</div></div>`:''}
    </div>
    <div style="font-size:11.5px;color:var(--text2);line-height:1.5;padding:12px;background:var(--bg2);border-radius:8px">Mijozlar soni va daromad yo'qotish ko'rsatkichlari. LTV (Lifetime Value) - bir mijozdan kutiladigan jami daromad.</div>
  </div></div></div>`;
  if(cq.length){
    h+=`<div class="card" style="margin-top:16px"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>Mijozlar sadoqati (Cohort Heatmap)</span></div>
    <div style="overflow-x:auto;padding-bottom:10px"><table class="u-table" style="font-size:11.5px;min-width:800px;text-align:center">
    <thead><tr><th style="text-align:left;width:120px">Kogort (Ulangan oyi)</th><th style="width:80px">Mijozlar</th>`;
    let maxM=0;cq.forEach(d=>maxM=Math.max(maxM,d.months.length));
    for(let i=0;i<maxM;i++)h+=`<th>Oy ${i}</th>`;
    h+=`</tr></thead><tbody>`;
    cq.forEach(d=>{
      h+=`<tr><td style="text-align:left;font-weight:600;background:var(--bg3)">${d.name}</td><td style="font-weight:600">${d.total} ta</td>`;
      d.months.forEach((m,i)=>{const pct=d.total>0?Math.round((m/d.total)*100):0;const alpha=pct/100;const bg=i===0?`rgba(46,204,148,0.8)`:`rgba(23,70,162,${alpha*0.8})`;h+=`<td style="color:${alpha>0.5?'#fff':'var(--text)'};background:${bg}">${pct}%<div style="font-size:9px;opacity:0.7">${m} ta</div></td>`;});
      for(let j=d.months.length;j<maxM;j++)h+=`<td></td>`;
      h+=`</tr>`;
    });
    h+=`</tbody></table></div></div>`;
  }
  return h;
}

// DEFAULT: umumiy — health scores + client list
h+=`<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--green)"></span>Mijoz Sog'ligi — <span style="color:var(--green)">${healthy}</span> sog'lom / <span style="color:var(--amber)">${warn}</span> ogohlantirish / <span style="color:var(--red)">${crit}</span> xavfli</span></div>
<div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Mijoz</th><th class="text-r">MRR</th><th class="text-r">Ball</th><th>Holat</th><th class="text-r col-hide">Qarz</th><th class="text-r col-hide">Shartnoma</th><th class="text-r col-hide">Staj</th></tr></thead><tbody>`;
ch.forEach(c=>{
  const bc=c.status==='healthy'?'b-green':c.status==='warning'?'b-amber':'b-red';
  const bl=c.status==='healthy'?'Sog\'lom':c.status==='warning'?'⚠️ Xavf':'🔴 Kritik';
  const dayDisp=c.daysToEnd===-999?'<span style="color:var(--red);font-weight:600">Tugagan</span>':(c.daysToEnd>0?c.daysToEnd+' kun':'—');
  h+=`<tr><td style="font-weight:600;font-size:12px">${cl(c.name)}</td><td class="text-r mono" style="font-size:11px">${fmt(c.mrr)}</td><td class="text-r mono" style="font-weight:700;color:${c.score>=80?'var(--green)':c.score>=50?'var(--amber)':'var(--red)'}">${c.score}</td><td><span class="badge ${bc}" style="font-size:9px;padding:2px 6px">${bl}</span></td><td class="text-r col-hide mono" style="font-size:11px;color:${c.debt>0?'var(--red)':'var(--text3)'}">${c.debt>0?fmt(c.debt):'—'}</td><td class="text-r col-hide mono" style="font-size:11px">${dayDisp}</td><td class="text-r col-hide" style="font-size:11px">${c.tenureM} oy</td></tr>`;
});
h+=`</tbody></table></div></div>`;

const m={};S.rows.forEach(r=>{const c=r.Client||'?';if(!m[c])m[c]={n:c,ct:0,a:0,mrr:0,s:0,mg:new Set(),reg:new Set(),lastDate:null};m[c].ct++;m[c].mrr+=r._mUSD;m[c].s+=r._sUSD;if(r.Manager)m[c].mg.add(r.Manager);if(r.Hudud)m[c].reg.add(r.Hudud);if(sc(r.status)==='A')m[c].a++;const d=pd(r.sanasi);if(d&&(!m[c].lastDate||d>m[c].lastDate)){m[c].lastDate=d;m[c].lastMgr=r.Manager||''}});
let dList=Object.values(m).sort((a,b)=>(b.lastDate||0)-(a.lastDate||0));
if(S.clQ){const q=S.clQ.toLowerCase();dList=dList.filter(r=>r.n.toLowerCase().includes(q)||[...r.mg].join(' ').toLowerCase().includes(q))}
const t=dList.length,pg=Math.ceil(t/S.clN),sl=dList.slice(S.clP*S.clN,(S.clP+1)*S.clN);

h+=`<div class="toolbar" style="margin-top:16px"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz yoki menejer..." value="${S.clQ}" oninput="onSearch('clQ',this.value)"><button class="search-clear" onclick="onSearch('clQ','');render()" type="button">&times;</button></div></div>
<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>Mijoz</th><th>Menejer</th><th class="text-r">Shartnomalar</th><th class="text-r">Aktiv</th><th>Hudud</th><th class="text-r">MRR ($)</th><th class="text-r">Jami ($)</th><th>Oxirgi sana</th></tr></thead><tbody>${sl.map(r=>`<tr><td style="font-weight:600">${cl(r.n)}</td><td style="font-size:12px">${r.lastMgr||[...r.mg].join(', ')||'—'}</td><td class="text-r mono">${r.ct}</td><td class="text-r">${r.a?`<span class="badge b-green">${r.a}</span>`:'<span class="badge b-gray">0</span>'}</td><td style="font-size:11px">${[...r.reg].join(', ')||'—'}</td><td class="text-r mono" style="font-weight:600">${fmt(r.mrr)}</td><td class="text-r mono">${fmt(r.s)}</td><td class="mono" style="font-size:10.5px;color:var(--text2)">${r.lastDate?r.lastDate.toLocaleDateString('ru-RU'):'—'}</td></tr>`).join('')}</tbody></table></div></div>${pag(S.clP,pg,t,S.clN,'clP')}`;

return h;
}

// === TOP MRR ===
function rT(){
const act=activeR().sort((a,b)=>b._mUSD-a._mUSD),tM=act.reduce((s,r)=>s+r._mUSD,0);
const t5=act.slice(0,5).reduce((s,r)=>s+r._mUSD,0),t10=act.slice(0,10).reduce((s,r)=>s+r._mUSD,0),t20=act.slice(0,20).reduce((s,r)=>s+r._mUSD,0);
const view=S.topView||'metrka';
let h=`<div class="page-header"><div><div class="page-title">Top MRR</div><div class="page-sub">Eng yirik aktiv shartnomalar</div></div></div>`;
h+=_pageTabs([{v:'metrka',l:'Ko\'rsatkichlar'},{v:'jadval',l:"Ro'yxat"}],view,'topView');
if(view==='jadval'){
  h+=`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:40px">#</th><th>Mijoz</th><th>Firma</th><th>Menejer</th><th>Hudud</th><th class="text-r">Oylik $</th><th class="text-r">Ulush</th><th style="width:160px">Nisbat</th></tr></thead><tbody>${act.slice(0,40).map((r,i)=>{const p=tM?(r._mUSD/tM*100):0;const rc=i===0?'rk1':i===1?'rk2':i===2?'rk3':'rkn';const bc=i<3?'var(--accent)':i<10?'var(--green)':'var(--amber)';return`<tr><td><span class="rank ${rc}">${i+1}</span></td><td style="font-weight:600">${r.Client?cl(r.Client):'—'}</td><td style="color:var(--text2);font-size:11px">${r['Firma nomi']||'—'}</td><td style="font-size:12px">${r.Manager||'—'}</td><td style="font-size:11px">${r.Hudud||'—'}</td><td class="text-r mono" style="font-weight:700;font-size:13px">${fmt(r._mUSD)}</td><td class="text-r mono" style="font-size:11px;color:var(--text2)">${p.toFixed(1)}%</td><td><div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${act[0]?Math.min(r._mUSD/act[0]._mUSD*100,100):0}%;background:${bc};border-radius:4px;transition:width .5s ease"></div></div></td></tr>`}).join('')}</tbody></table></div></div>`;
}else{
  h+=`<div class="metrics" style="grid-template-columns:repeat(4,minmax(0,1fr))">
  <div class="metric c5"><div class="metric-lbl">Top 5</div><div class="metric-val">${tM?Math.round(t5/tM*100):0}%</div><div class="metric-foot">${fmt(t5)} $</div></div>
  <div class="metric c1"><div class="metric-lbl">Top 10</div><div class="metric-val">${tM?Math.round(t10/tM*100):0}%</div><div class="metric-foot">${fmt(t10)} $</div></div>
  <div class="metric c2"><div class="metric-lbl">Top 20</div><div class="metric-val">${tM?Math.round(t20/tM*100):0}%</div><div class="metric-foot">${fmt(t20)} $</div></div>
  <div class="metric c3"><div class="metric-lbl">O'rtacha</div><div class="metric-val">${fmt(act.length?Math.round(tM/act.length):0)}</div><div class="metric-foot">per shartnoma</div></div></div>
  <div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>Top 10</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chT"></canvas></div></div></div>
  <div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--purple)"></span>Konsentratsiya</span></div><div class="card-body"><div class="chart-wrap" style="height:220px"><canvas id="chK"></canvas></div></div></div></div>`;
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

let h=`<div class="page-header"><div><div class="page-title">Qarzdorlik</div><div class="page-sub">${repLabel} oy oxiriga · ${dt.length} ta mijoz</div></div>
<div style="display:flex;gap:6px;align-items:center">
<input type="date" class="flt" style="font-size:12px;padding:6px 10px" value="${repDate.toISOString().slice(0,10)}" onchange="S.debtDate=new Date(this.value);clearCache();render()">
<button class="btn-outline" style="padding:7px 11px" onclick="showDlMenu(this,'debts')" title="Yuklab olish">${_dlSvg}</button>
</div></div>`;
h+=_pageTabs([{v:'umumiy',l:"Ko'rsatkichlar"},{v:'jadval',l:'Qarz jadvali'}],view,'debtView');

if(view==='jadval'){
  S.debtMobCol=S.debtMobCol||'oy';
  window.switchDMC=function(c){S.debtMobCol=c;render()};
  const isM=window.innerWidth<=768;
  let filtered=dt;
  if(S.debtQ){const q=S.debtQ.toLowerCase();filtered=dt.filter(r=>r.name.toLowerCase().includes(q));}
  let mobTabs='';
  if(isM){const tabs=[{k:'sh',l:'Sh. qoldiq'},{k:'oy',l:'Oy oxiri'},{k:'kel',l:'Kelishuv'},{k:'lp',l:"Oxirgi to'lov"}];mobTabs='<div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 12px;border-bottom:1px solid var(--border);margin-bottom:12px">'+tabs.map(t=>`<button class="btn" style="flex-shrink:0;${S.debtMobCol===t.k?'background:var(--accent);color:#fff;border-color:var(--accent)':''}" onclick="switchDMC('${t.k}')">${t.l}</button>`).join('')+'</div>';}
  const fsIcon=S.debtFs?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  h+=`<div id="debtContainer"${S.debtFs?' class="debt-fs-active"':''}>`;
  h+=`<div class="toolbar" style="margin-bottom:12px;gap:10px">
<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz nomi..." value="${S.debtQ||''}" oninput="onSearch('debtQ',this.value)"><button class="search-clear" onclick="onSearch('debtQ','');render()" type="button">&times;</button></div>
<div style="margin-left:auto"><button class="btn${S.debtFs?' btn-primary':''}" style="padding:8px 12px" onclick="toggleDebtFs()" title="${S.debtFs?'Kichraytirish':'To\'liq ekran'}">${fsIcon}</button></div>
</div>`;
  h+=mobTabs+`<div class="tbl-wrap"><div class="tbl-scroll" style="max-height:calc(100vh - ${S.debtFs?'72':'220'}px)"><table><thead><tr><th>Mijoz</th>
${(!isM||S.debtMobCol==='sh')?`<th class="text-r">Sh. qoldiq</th>`:''}
${(!isM||S.debtMobCol==='oy')?`<th class="text-r">Oy oxiri</th>`:''}
${(!isM||S.debtMobCol==='kel')?`<th class="text-r">Kelishuv</th>`:''}
${(!isM||S.debtMobCol==='lp')?`<th class="text-r">Oxirgi to'lov</th>`:''}
</tr></thead><tbody>${filtered.length?filtered.map(r=>{
const oyC=r.oyQarz>0?'var(--amber)':'var(--green)';const kelC=r.kelQarz>0?'var(--red)':'var(--green)';
const lp=r.lastPay;
let lpCell='<td class="text-r" style="font-size:11px;color:var(--text3)">—</td>';
if(lp){
  const ds=fmtD(lp.date);
  const tips=lp.allOnDate.map(p=>{
    const isUsd=p.val==='USD';const ks=p.kassa?String(p.kassa).trim():'';const origS=String(p.origSum).trim();
    let amtStr=isUsd?`${origS}$`:`${origS} UZS`;
    if(p.type==='perevod'&&p.val==='UZS'&&(!origS||origS==='0'))amtStr=`${fmt(p.usdSum)}$`;
    let txt='';const t=p.type;
    if(t==='naqd')txt=ks?`${ks}ga naqd bergan`:`naqd bergan`;
    else if(t==='karta')txt=ks?`${ks} kartasiga tushirgan`:`kartasiga tushirgan`;
    else if(t==='bank'||t==='perevod')txt=ks?`${ks}ga tushirgan`:`Bank orqali`;
    else txt=t||"to'lov";
    return`${amtStr} - ${txt}`;
  }).filter(Boolean).join('&#10;');
  lpCell='<td class="text-r has-tip" data-tip="'+(tips||ds)+'" style="font-size:11px;color:var(--accent);cursor:default">'+ds+'</td>';
}
return'<tr><td style="font-weight:500">'+cl(r.name)+'</td>'+
((!isM||S.debtMobCol==='sh')?`<td class="text-r mono" style="font-size:11px;color:var(--text3)">${r.qoldiq>0?fmt(r.qoldiq):'—'}</td>`:'')+
((!isM||S.debtMobCol==='oy')?`<td class="text-r mono" style="font-size:11px;color:${oyC};font-weight:${r.oyQarz>0?'600':'400'}">${r.oyQarz>0?fmt(r.oyQarz):'—'}</td>`:'')+
((!isM||S.debtMobCol==='kel')?`<td class="text-r mono" style="font-size:11px;color:${kelC};font-weight:${r.kelQarz>0?'700':'400'}">${r.kelQarz>0?fmt(r.kelQarz):'—'}</td>`:'')+
((!isM||S.debtMobCol==='lp')?lpCell:'')+'</tr>'}).join(''):`<tr><td colspan="${isM?2:5}" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>`}</tbody></table></div></div>`;
  h+=`</div>`;
}else{
  h+=`<div class="metrics" style="grid-template-columns:repeat(4,1fr)">
  <div class="metric c6"><div class="metric-lbl">To'lov muddati (DSO)</div><div class="metric-val" style="color:${dsoColor}">${dsoVal} <span style="font-size:14px">kun</span></div></div>
  <div class="metric c2"><div class="metric-lbl">Konsentratsiya (Top 5)</div><div class="metric-val" style="color:${concColor}">${conc5}%</div></div>
  <div class="metric c4"><div class="metric-lbl">Oy oxiri qarzi</div><div class="metric-val">${fmt(totalOy)}</div></div>
  <div class="metric c4"><div class="metric-lbl">Kelishuv qarzi</div><div class="metric-val">${fmt(totalKel)}</div></div></div>
  <div class="card" style="margin-top:16px"><div class="card-head"><span class="card-label">Qarz taqsimoti</span></div>
  <div class="card-body">
    ${dt.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div><div style="font-size:11px;color:var(--text3);margin-bottom:8px">Oy oxiri qarz bo'yicha TOP 5</div>
    ${dt.filter(r=>r.oyQarz>0).sort((a,b)=>b.oyQarz-a.oyQarz).slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><span style="font-weight:500">${r.name}</span><span class="mono" style="color:var(--amber);font-weight:600">${fmt(r.oyQarz)}</span></div>`).join('')}
    </div>
    <div><div style="font-size:11px;color:var(--text3);margin-bottom:8px">Kelishuv qarz bo'yicha TOP 5</div>
    ${dt.filter(r=>r.kelQarz>0).sort((a,b)=>b.kelQarz-a.kelQarz).slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><span style="font-weight:500">${r.name}</span><span class="mono" style="color:var(--red);font-weight:600">${fmt(r.kelQarz)}</span></div>`).join('')}
    </div></div>`:'<div style="text-align:center;color:var(--text3);padding:24px">Qarzdor mijozlar yo\'q ✅</div>'}
  </div></div>`;
}
return h;
}

// === MOLIYA / CFO PAGE ===
function rMoliya(){
  const mos=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  // === AR Aging ===
  const aging=calcARaging();
  const agingTotal=aging.reduce((s,b)=>s+b.total,0);
  if(!S.arAgingFilter)S.arAgingFilter=[];
  const af=S.arAgingFilter;
  let agingCards='';
  aging.forEach(b=>{
    const pct=agingTotal>0?Math.round(b.total/agingTotal*100):0;
    const isActive=af.includes(b.label);
    agingCards+=`<div class="metric" style="border-top:3px solid ${b.color};cursor:pointer;${isActive?`box-shadow:0 0 0 2px ${b.color};background:var(--bg3)`:''}" onclick="toggleAgingFilter('${b.label}')" title="${b.label} bo'yicha filterlash">
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
      <td style="font-weight:500">${cl(c.name)}</td>
      <td><span class="badge" style="background:${c.color}20;color:${c.color};border:1px solid ${c.color}40">${c.bucket}</span></td>
      <td class="text-r mono" style="color:var(--red);font-weight:600">${fmt(c.qarz)}</td>
      <td class="text-r mono" style="font-size:11px;color:var(--text3)">${c.kelQarz>0?fmt(c.kelQarz):'—'}</td>
      <td class="text-r" style="font-size:12px">${c.days<999?c.days+' kun':'—'}</td>
      <td style="font-size:11px;color:var(--text3)">${c.lastPayDate}</td>
    </tr>`;
  });
  const agingSection=`<div class="card" style="margin-bottom:16px">
    <div class="card-head">
      <span class="card-label">AR Aging — Qarz yoshi bo'yicha tahlil${af.length?` · <span style="color:var(--accent)">${af.join(', ')}</span>`:''}</span>
      <div style="display:flex;gap:6px;align-items:center">
        ${af.length?`<button class="btn" style="font-size:11px;padding:5px 10px" onclick="S.arAgingFilter=[];render()">✕ Filterni tozala</button>`:''}
        <button class="btn-outline" style="padding:6px 10px" onclick="showDlMenu(this,'araging')" title="Yuklab olish">${_dlSvg}</button>
      </div>
    </div>
    <div class="card-body">
      <div class="metrics" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">${agingCards}</div>
      ${agingRows?`<div class="tbl-scroll"><table><thead><tr>
        <th>Mijoz</th><th>Muddat</th><th class="text-r">Oy qarzi</th><th class="text-r">Kelishuv</th><th class="text-r">Kechikish</th><th>Oxirgi to'lov</th>
      </tr></thead><tbody>${agingRows}</tbody></table></div>`:'<div style="text-align:center;color:var(--text3);padding:24px">Qarzdor mijozlar yo\'q ✅</div>'}
    </div>
  </div>`;

  // === Collection Rate ===
  const cr=calcCollectionRate();
  const now=new Date();
  const curMon=mos[now.getMonth()]+' '+now.getFullYear();
  let crRows='';
  cr.slice(0,50).forEach(c=>{
    const rateCol=c.rate>=90?'var(--green)':c.rate>=70?'var(--amber)':'var(--red)';
    const barW=Math.min(100,c.rate);
    const deltaCol=c.delta>=0?'var(--green)':'var(--red)';
    crRows+=`<tr>
      <td style="font-weight:500">${cl(c.name)}</td>
      <td class="text-r mono" style="font-size:11px">${fmt(c.expected)}</td>
      <td class="text-r mono" style="font-size:11px">${fmt(c.paid)}</td>
      <td class="text-r mono" style="font-size:11px;color:${deltaCol};font-weight:600">${c.delta>=0?'+':''}${fmt(c.delta)}</td>
      <td style="min-width:120px">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;background:var(--border);border-radius:4px;height:8px">
            <div style="width:${barW}%;background:${rateCol};height:8px;border-radius:4px"></div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${rateCol};min-width:36px;text-align:right">${c.rate}%</span>
        </div>
      </td>
    </tr>`;
  });
  const avgRate=cr.length?Math.round(cr.reduce((s,c)=>s+c.rate,0)/cr.length):0;
  const avgRateCol=avgRate>=90?'var(--green)':avgRate>=70?'var(--amber)':'var(--red)';
  const crSection=`<div class="card">
    <div class="card-head">
      <span class="card-label">Inkasso (To'lov undiruvi) — ${curMon}</span>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:13px;font-weight:700;color:${avgRateCol}">${avgRate}% o'rtacha</span>
        <button class="btn-outline" style="padding:6px 10px" onclick="showDlMenu(this,'collection')" title="Yuklab olish">${_dlSvg}</button>
      </div>
    </div>
    <div class="card-body" style="padding:0">
      ${cr.length?`<div class="tbl-scroll"><table><thead><tr>
        <th>Mijoz</th><th class="text-r" title="Shartnoma bo'yicha kutilgan to'lovlar (yil boshidan)">Kutilgan</th>
        <th class="text-r" title="Haqiqiy to'langan summa">To'langan</th>
        <th class="text-r">Farq</th><th>Undiruv darajasi</th>
      </tr></thead><tbody>${crRows}</tbody></table></div>
      <div style="padding:12px 16px;font-size:11px;color:var(--text3);border-top:1px solid var(--border)">
        Jami ${cr.length} ta mijoz · ${cr.filter(c=>c.rate>=90).length} ta ≥90% · ${cr.filter(c=>c.rate<70).length} ta &lt;70%
      </div>`
      :'<div style="text-align:center;color:var(--text3);padding:24px">Ma\'lumot yo\'q</div>'}
    </div>
  </div>`;

  // === Tahlil (Data Quality Audit) ===
  const audit=calcDataAudit();
  let auditRows='';
  audit.forEach(a=>{
    auditRows+=`<tr>
      <td style="font-weight:500">${cl(a.client)}</td>
      <td style="font-size:12px">${a.raqami||'—'}</td>
      <td style="font-size:12px">${a.type}</td>
      <td style="font-size:12px;max-width:300px">${a.detail}</td>
    </tr>`;
  });
  const auditSection=`<div class="card" style="margin-bottom:16px">
    <div class="card-head">
      <span class="card-label">Ma'lumotlar tahlili · ${audit.length} ta xatolik</span>
    </div>
    <div class="card-body">
      ${audit.length?`<div class="tbl-scroll"><table><thead><tr>
        <th>Mijoz</th><th>Shartnoma</th><th>Xatolik turi</th><th>Tafsilot</th>
      </tr></thead><tbody>${auditRows}</tbody></table></div>`:'<div style="text-align:center;color:var(--green);padding:24px">Xatolik topilmadi ✅</div>'}
    </div>
  </div>`;

  const view=S.molView||'aging';
  const header=`<div class="page-header"><div><div class="page-title">Finance</div><div class="page-sub">AR Aging · Inkasso · Tahlil</div></div></div>`;
  const tabs=_pageTabs([{v:'aging',l:'AR Aging'},{v:'inkasso',l:'Inkasso'},{v:'tahlil',l:'Tahlil'}],view,'molView');
  if(view==='inkasso') return header+tabs+crSection;
  if(view==='tahlil') return header+tabs+auditSection;
  return header+tabs+agingSection;
}
