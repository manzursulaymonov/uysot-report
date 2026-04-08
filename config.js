/* ============================================================
   UYSOT — Charts, Config, Data Loading, Report, Init
   ============================================================ */

// === CHARTS ===
function iC(){
const s=getComputedStyle(document.documentElement);
const tc=s.getPropertyValue('--text3').trim() || '#918f88';
const gridColor=s.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.1)';
const gc='rgba(0,0,0,.03)',bo={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}};
const co=['#1746a2','#117a52','#c42b1c','#6941b8','#a36207','#0e7c7b','#d4537e','#888','#854f0b','#993556'];

const fkK=v=>{const a=Math.abs(v);if(a>=1000)return '$'+Math.round(v/1000)+'k';return '$'+v};

const eTrend=document.getElementById('chTrend');
if(eTrend){
  if(Chart.getChart(eTrend)) Chart.getChart(eTrend)?.destroy();
  const dr=dashRange();
  const prs=dr.totals.length>20?0:3;
  new Chart(eTrend,{
    type:'line',
    data: {
      labels: dr.labels,
      datasets: [{
        data: dr.totals,
        borderColor: '#20c997',
        borderWidth: 2,
        backgroundColor: ctx => {
            const chart = ctx.chart;
            const {ctx: context, chartArea} = chart;
            if(!chartArea) return null;
            const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(32, 201, 151, 0.4)');
            gradient.addColorStop(1, 'rgba(32, 201, 151, 0.0)');
            return gradient;
        },
        fill: true,
        pointRadius: prs,
        pointBackgroundColor: '#20c997',
        tension: 0.3
      }]
    },
    options: {
      ...bo,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => '$' + fmt(c.raw) } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 }, maxTicksLimit: 12 } },
        y: { 
          grid: { color: gridColor }, 
          ticks: { color: tc, font: { size: 10 }, callback: v => fkK(v) },
          beginAtZero: true
        }
      }
    }
  });
}

const eComp=document.getElementById('chComponents');
if(eComp){
  if(Chart.getChart(eComp)) Chart.getChart(eComp)?.destroy();
  const dr=dashRange();
  new Chart(eComp,{
    type:'bar',
    data: {
      labels: dr.labels,
      datasets: [
        { label: 'New', data: dr.addedMRR, backgroundColor: '#20c997', borderRadius: 2 },
        { label: 'Expansion', data: dr.expMRR, backgroundColor: '#1746a2', borderRadius: 2 },
        { label: 'Contraction', data: dr.conMRR, backgroundColor: '#f97316', borderRadius: 2 },
        { label: 'Churn', data: dr.lostMRR, backgroundColor: '#c42b1c', borderRadius: 2 }
      ]
    },
    options: {
      ...bo,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: c => c.dataset.label + ': $' + fmt(c.raw)
            }
        }
      },
      scales: {
        x: { 
          grid: { display: false }, 
          ticks: { color: tc, font: { size: 10 }, maxTicksLimit: 12 }
        },
        y: { 
          grid: { color: gridColor }, 
          ticks: { color: tc, font: { size: 10 }, callback: v => fkK(v) },
          beginAtZero: true
        }
      }
    }
  });
}

const e4=document.getElementById('chMM');if(e4){if(Chart.getChart(e4)) Chart.getChart(e4)?.destroy();const mg=calcManagerAcquisition().slice(0,10);new Chart(e4,{type:'bar',data:{labels:mg.map(x=>x.name),datasets:[{data:mg.map(x=>x.initialMRR),backgroundColor:co,borderRadius:4}]},options:{...bo,indexAxis:'y',scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:11},callback:v=>fk(v)}},y:{grid:{display:false},ticks:{color:tc,font:{size:11}}}}}})}

const e5=document.getElementById('chMC');if(e5){if(Chart.getChart(e5)) Chart.getChart(e5)?.destroy();const mg=calcManagerAcquisition().sort((a,b)=>b.clients-a.clients).slice(0,10);new Chart(e5,{type:'bar',data:{labels:mg.map(x=>x.name),datasets:[{data:mg.map(x=>x.clients),backgroundColor:co.map(c=>c+'cc'),borderRadius:4}]},options:{...bo,indexAxis:'y',scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:11}}},y:{grid:{display:false},ticks:{color:tc,font:{size:11}}}}}})}

const e6=document.getElementById('chT');if(e6){if(Chart.getChart(e6)) Chart.getChart(e6)?.destroy();const a=activeR().sort((a,b)=>b._mUSD-a._mUSD).slice(0,10);new Chart(e6,{type:'bar',data:{labels:a.map(r=>r.Client||'?'),datasets:[{data:a.map(r=>r._mUSD),backgroundColor:'#1746a2',borderRadius:4}]},options:{...bo,indexAxis:'y',scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:11},callback:v=>fk(v)}},y:{grid:{display:false},ticks:{color:tc,font:{size:11}}}}}})}

const e7=document.getElementById('chK');if(e7){if(Chart.getChart(e7)) Chart.getChart(e7)?.destroy();const a=activeR().sort((x,y)=>y._mUSD-x._mUSD);const t=a.reduce((s,r)=>s+r._mUSD,0);const s=[a.slice(0,5),a.slice(5,10),a.slice(10,20),a.slice(20)].map(g=>g.reduce((s,r)=>s+r._mUSD,0));new Chart(e7,{type:'doughnut',data:{labels:['Top 5','Top 6-10','Top 11-20','Qolgan'],datasets:[{data:s,backgroundColor:['#c42b1c','#a36207','#1746a2','#cccbc5'],borderWidth:0}]},options:{...bo,cutout:'60%',plugins:{legend:{display:true,position:'right',labels:{boxWidth:10,padding:8,font:{size:11},color:tc}}}}})}

// MRR tooltip
document.querySelectorAll('.mcell-y[data-tip]').forEach(el=>{
  el.addEventListener('mouseenter',e=>{
    let t=document.getElementById('mrrTip');
    if(!t){t=document.createElement('div');t.id='mrrTip';t.className='mrr-tip';document.body.appendChild(t)}
    t.innerHTML=el.dataset.tip.replace(/&#10;/g,'<br>');t.style.display='block';
    const r=el.getBoundingClientRect();
    t.style.left=Math.min(r.left,window.innerWidth-230)+'px';
    t.style.top=(r.top-t.offsetHeight-6)+'px';
  });
  el.addEventListener('mouseleave',()=>{const t=document.getElementById('mrrTip');if(t)t.style.display='none'});
})}

// === CONFIG ===
function showConfig(){
const hasSaved=!!localStorage.getItem('uysot_config');
const sheets=[
  {k:'shartnomalar',l:'Shartnomalar',d:'Asosiy shartnomalar jadvali',n:S.rows.length,ft:'main'},
  {k:'qoshimcha',l:'Qo\'shimcha',d:'Qo\'shimcha kelishuvlar',n:S.qRows.length,ft:'extra'},
  {k:'payments',l:'Payments',d:'2025+ to\'lovlar reestri',n:S.payRows.length,ft:'pay'},
  {k:'2024',l:'2024',d:'2025 gacha jami to\'lovlar',n:S.y2024Rows.length,ft:'y24'},
  {k:'perevod',l:'Perevod',d:'O\'zaro hisob-kitob, kurs farqi',n:S.perevodRows.length,ft:'per'},
  {k:'mkt',l:'Marketing',d:'Marketing xarajatlari (Yil, Oy, Summa)',n:S.mktRows.length,ft:'mkt'},
  {k:'menejerlar',l:'Menejerlar',d:'Menejer nomi va statusi (aktiv/ketgan)',n:S.mgrRows.length,ft:'mgr'}
];
const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
o.innerHTML=`<div class="modal max-w-[520px] max-h-[90vh] overflow-y-auto">
<h2 class="flex items-center gap-2"><svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Sozlamalar</h2>

<div class="mb-4">
<div class="text-xs font-semibold text-muted mb-2">Ma'lumot manbalari holati</div>
<div class="flex flex-col gap-1">
${sheets.map(s=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg3);border-radius:6px;font-size:12px">
<div><span class="font-semibold">${s.l}</span><span style="color:var(--text3);margin-left:6px;font-size:10.5px">${s.d}</span></div>
${s.n?`<span style="color:var(--green);font-weight:600;font-size:11px">${s.n} qator</span>`:'<span style="color:var(--text3);font-size:11px">yuklanmagan</span>'}
</div>`).join('')}
</div></div>

<div class="mb-4">
<div class="text-xs font-semibold text-muted mb-2">JSON config bilan yuklash</div>
<div class="flex gap-2">
<label class="btn cursor-pointer flex-1 justify-center p-2.5" style="background:var(--accent-bg);border:1px solid var(--accent);color:var(--accent);font-weight:600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>JSON yuklash<input type="file" accept=".json" onchange="loadJsonConfig(this)" class="hidden"></label>
${hasSaved?`<button class="btn p-2.5" onclick="if(S.config)loadFromConfig(S.config)">Qayta yuklash</button>`:''}
</div>
<div class="text-[10.5px] text-subtle mt-1.5 leading-normal"><b>uysot_config.json</b> fayli orqali Google Sheets havolalarini yuklang.</div></div>

<div class="mb-4">
<div class="text-xs font-semibold text-muted mb-2">Interfeys temasi</div>
<select class="flt text-xs py-1.5 px-2.5" style="width:100%" onchange="applyThemeStyle(this.value);render()">
${EO_STYLES.map(s=>'<option value="'+s.id+'"'+((localStorage.getItem('uysot_style')||'default')===s.id?' selected':'')+'>'+s.name+'</option>').join('')}
</select>
</div>

<div class="mb-4">
<div class="text-xs font-semibold text-muted mb-2">AI hisobot (ixtiyoriy)</div>
<div class="flex flex-col gap-1.5">
<div class="flex gap-2 items-center">
<span class="text-[11px] min-w-[55px] text-subtle">Claude:</span>
<input type="password" class="flt flex-1 text-[11px] py-1.5 px-2.5 font-mono" placeholder="sk-ant-api..." value="${S.apiKey||''}" onchange="S.apiKey=this.value;localStorage.setItem('uysot_apikey',this.value)">
</div>
<div class="flex gap-2 items-center">
<span class="text-[11px] min-w-[55px] text-subtle">Gemini:</span>
<input type="password" class="flt flex-1 text-[11px] py-1.5 px-2.5 font-mono" placeholder="AIza..." value="${S.geminiKey||''}" onchange="S.geminiKey=this.value;localStorage.setItem('uysot_geminikey',this.value)">
</div></div>
<div class="text-[10.5px] text-subtle mt-1">Kalitlar: <a href="https://console.anthropic.com/settings/keys" target="_blank" class="text-accent2">Claude</a> · <a href="https://aistudio.google.com/apikey" target="_blank" class="text-accent2">Gemini</a>. AI ixtiyoriy — oddiy hisobot AI'siz ham ishlaydi.</div></div>

${hasSaved?`<div style="border-top:1px solid var(--border);padding-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center">
<div class="flex gap-1.5 flex-wrap">
<button class="btn text-danger border-danger text-[11px]" onclick="if(confirm('Saqlangan config o\\'chiriladi')){localStorage.removeItem('uysot_config');localStorage.removeItem('uysot_data');S.config=null;S.rows=[];S.qRows=[];S.payRows=[];S.y2024Rows=[];S.perevodRows=[];S.mgrRows=[];clearCache();this.closest('.overlay').remove();showWelcome()}">Ma'lumot keshini tozalash</button>
<button class="btn text-[11px]" onclick="if('caches' in window){caches.keys().then(k=>Promise.all(k.map(n=>caches.delete(n)))).then(()=>{if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(r=>r.forEach(w=>w.unregister()));showToast('Brauzer keshi tozalandi','success');setTimeout(()=>location.reload(),500)})}else{showToast('Cache API mavjud emas','error')}">Brauzer keshini tozalash</button>
</div>
<button class="btn" onclick="this.closest('.overlay').remove()">Yopish</button>
</div>`:`<div class="modal-btns"><button class="btn" onclick="this.closest('.overlay').remove()">Yopish</button></div>`}
</div>`;document.body.appendChild(o)}

// === REPORT MODAL ===
function showReportModal(){
  if(!S.repSec)S.repSec={};
  ['summary','mrr','newc','churn','cash','debt','mgrs','region','forecast','health'].forEach(k=>{if(S.repSec[k]===undefined)S.repSec[k]=true});
  if(!S.repFmt)S.repFmt='pdf';
  const ai=S.aiProvider||'none';
  const secs=[
    {k:'summary',l:'Ijroiya xulosasi',d:'KPI, tendensiyalar'},
    {k:'mrr',l:'MRR tahlili',d:'Waterfall, o\'sish'},
    {k:'newc',l:'Yangi mijozlar',d:'Kelishlar, menejer'},
    {k:'churn',l:'Churn & Retention',d:'NRR, GRR'},
    {k:'cash',l:'Kassa & Inkasso',d:'DSO, undiruv'},
    {k:'debt',l:'Qarzdorlik (AR)',d:'Aging, qarzdorlar'},
    {k:'mgrs',l:'Menejerlar',d:'Samaradorlik'},
    {k:'region',l:'Hududlar',d:'Mintaqaviy MRR'},
    {k:'forecast',l:'Prognoz',d:'6 oylik bashorat'},
    {k:'health',l:'Portfolio salomatligi',d:'Health scores'},
  ];
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  const iDoc='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
  const iSlide='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
  o.innerHTML=`<div class="modal max-w-[540px] max-h-[90vh] overflow-y-auto p-6">
<div class="flex items-center gap-2.5 mb-1">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
  <h2 class="m-0 text-[17px]">Hisobot tayyorlash</h2>
</div>
<p class="text-xs text-subtle mb-5">CFO/CEO darajasi · investorlar uchun tayyor format</p>
<div class="text-[10.5px] font-bold text-subtle uppercase tracking-[0.7px] mb-2">Format</div>
<div class="grid grid-cols-2 gap-2 mb-5">
${[{id:'_rfPDF',v:'pdf',ic:iDoc,t:'PDF Hisobot',s:"To'liq moliyaviy hujjat"},
   {id:'_rfSlide',v:'slide',ic:iSlide,t:'Investor Slides',s:'16:9 taqdimot'}].map(x=>`<div id="${x.id}" onclick="S.repFmt='${x.v}';['_rfPDF','_rfSlide'].forEach(function(i){var el=document.getElementById(i);var act=el.id==this.id;el.style.borderColor=act?'var(--accent)':'var(--border)';el.style.background=act?'rgba(23,70,162,.08)':'var(--bg3)'},this)" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;background:${S.repFmt===x.v?'rgba(23,70,162,.08)':'var(--bg3)'};border-radius:10px;cursor:pointer;border:2px solid ${S.repFmt===x.v?'var(--accent)':'var(--border)'};transition:.15s">${x.ic}<div style="font-size:12px;font-weight:700">${x.t}</div><div class="text-[10px] text-subtle">${x.s}</div></div>`).join('')}
</div>
<div class="text-[10.5px] font-bold text-subtle uppercase tracking-[0.7px] mb-2">Bo'limlar</div>
<div class="grid grid-cols-2 gap-1 mb-5">
${secs.map(s=>`<label style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:var(--bg3);border-radius:7px;cursor:pointer"><input type="checkbox" ${S.repSec[s.k]!==false?'checked':''} onchange="S.repSec['${s.k}']=this.checked" style="accent-color:var(--accent);margin-top:1px;width:14px;height:14px;flex-shrink:0"><div><div style="font-size:11.5px;font-weight:600;line-height:1.3">${s.l}</div><div class="text-[10px] text-subtle">${s.d}</div></div></label>`).join('')}
</div>
<div class="text-[10.5px] font-bold text-subtle uppercase tracking-[0.7px] mb-2">AI sharh <span class="bg-hover py-px px-1.5 rounded-[4px] font-normal normal-case tracking-normal text-[10px] text-muted">ixtiyoriy</span></div>
<div class="flex flex-col gap-1 mb-5">
${[{v:'none',t:"AI'siz",s:'Tezkor, offlayn ishlaydi'},
   {v:'gemini',t:'Gemini AI',s:S.geminiKey?'Kalit ulangan ✓':"Kalit yo'q — sozlamalar"},
   {v:'claude',t:'Claude AI',s:S.apiKey?(S.geminiKey?'Kalit ulangan ✓ (Gemini zaxira)':'Kalit ulangan — tarmoq bloki xavfi'):"Kalit yo'q — sozlamalar"}]
.map(x=>`<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg3);border-radius:7px;cursor:pointer"><input type="radio" name="_airep" value="${x.v}" ${ai===x.v?'checked':''} onchange="S.aiProvider='${x.v}';localStorage.setItem('uysot_ai','${x.v}')" style="accent-color:var(--accent)"><div><div style="font-size:12px;font-weight:600">${x.t}</div><div style="font-size:10.5px;color:var(--text3)">${x.s}</div></div></label>`).join('')}
</div>
<div class="modal-btns m-0"><button class="btn" onclick="this.closest('.overlay').remove()">Bekor qilish</button><button class="btn btn-primary" onclick="var f=S.repFmt==='slide';this.closest('.overlay').remove();f?generateSlides():generateReport()">Yaratish</button></div>
</div>`;
  document.body.appendChild(o);
}
function showDashSettingsModal(){
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};
  const c=S.dashCards||{};
  if(!c.mrr) c.mrr={s:1,arr:1,g:1};
  if(!c.nrr) c.nrr={s:1,n:1,c:1,e:1};
  if(!c.cust) c.cust={s:1,g:1,ch:1};
  if(!c.arpa) c.arpa={s:1,g:1};
  if(!c.cac) c.cac={s:0,d:1};
  if(!c.cash) c.cash={s:1};
  if(!c.dso) c.dso={s:1};
  if(!c.conc) c.conc={s:1};
  if(!c.ltv) c.ltv={s:1};
  if(!c.qr) c.qr={s:1};
  if(!c.lc) c.lc={s:1};
  if(!c.cMrrGr) c.cMrrGr={s:1};
  if(!c.cNetMov) c.cNetMov={s:1};
  if(!c.tRenew) c.tRenew={s:1};
  if(!c.tRegion) c.tRegion={s:1};
  if(!c.tMgr) c.tMgr={s:1};
  if(!c.tHealth) c.tHealth={s:1};
  const up=(g,k,v)=>{if(!S.dashCards[g])S.dashCards[g]={};S.dashCards[g][k]=v;localStorage.setItem('uysot_cards',JSON.stringify(S.dashCards));if(window.render)render()};
  
  o.innerHTML=`<div class="modal max-w-[560px] p-0 overflow-hidden border-none bg-page shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
    <div class="p-5 bg-card border-b border-brd flex items-center justify-between">
      <h3 class="m-0 flex items-center gap-2.5 text-[17px] text-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        Dashboard Sozlamalari
      </h3>
      <button class="btn-close" onclick="this.closest('.overlay').remove()" class="bg-transparent border-none text-subtle cursor-pointer"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
    
    <div class="p-6 max-h-[75vh] overflow-y-auto bg-page">
      <!-- KPI SECTION -->
      <div class="mb-[30px]">
        <div class="text-xs uppercase text-primary tracking-[1px] mb-[15px] font-extrabold flex items-center gap-2.5">
          <span class="bg-accent w-1 h-3.5 rounded-sm"></span>
          1. KPI KARTALARI (TOP)
        </div>
        <div class="grid grid-cols-1 gap-3">
          
          <!-- MRR CARD -->
          <div class="bg-card border border-brd rounded-xl overflow-hidden">
            <div class="py-3 px-[15px] bg-[rgba(255,255,255,0.03)] border-b border-brd flex items-center gap-2.5">
              <input type="checkbox" ${c.mrr?.s?'checked':''} onchange="(${up.toString()})('mrr','s',this.checked)" class="w-4 h-4">
              <span class="font-bold text-sm">MRR (Monthly Recurring Revenue)</span>
            </div>
            <div style="padding:12px 15px; display:flex; gap:20px; font-size:12px; opacity:${c.mrr?.s?1:0.5}; pointer-events:${c.mrr?.s?'auto':'none'}">
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.mrr?.g?'checked':''} onchange="(${up.toString()})('mrr','g',this.checked)"> O'sish (Growth %)</label>
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.mrr?.arr?'checked':''} onchange="(${up.toString()})('mrr','arr',this.checked)"> ARR (Yillik)</label>
            </div>
          </div>

          <!-- NRR CARD -->
          <div class="bg-card border border-brd rounded-xl overflow-hidden">
            <div class="py-3 px-[15px] bg-[rgba(255,255,255,0.03)] border-b border-brd flex items-center gap-2.5">
              <input type="checkbox" ${c.nrr?.s?'checked':''} onchange="(${up.toString()})('nrr','s',this.checked)" class="w-4 h-4">
              <span class="font-bold text-sm">NRR (Net Revenue Retention)</span>
            </div>
            <div style="padding:12px 15px; display:flex; flex-wrap:wrap; gap:15px; font-size:12px; opacity:${c.nrr?.s?1:0.5}; pointer-events:${c.nrr?.s?'auto':'none'}">
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.nrr?.n?'checked':''} onchange="(${up.toString()})('nrr','n',this.checked)"> New/Reactivated</label>
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.nrr?.e?'checked':''} onchange="(${up.toString()})('nrr','e',this.checked)"> Net Expansion</label>
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.nrr?.c?'checked':''} onchange="(${up.toString()})('nrr','c',this.checked)"> Churn (Yo'qotish)</label>
            </div>
          </div>

          <!-- Active Customers CARD -->
          <div class="bg-card border border-brd rounded-xl overflow-hidden">
            <div class="py-3 px-[15px] bg-[rgba(255,255,255,0.03)] border-b border-brd flex items-center gap-2.5">
              <input type="checkbox" ${c.cust?.s?'checked':''} onchange="(${up.toString()})('cust','s',this.checked)" class="w-4 h-4">
              <span class="font-bold text-sm">Active Customers</span>
            </div>
            <div style="padding:12px 15px; display:flex; gap:20px; font-size:12px; opacity:${c.cust?.s?1:0.5}; pointer-events:${c.cust?.s?'auto':'none'}">
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.cust?.g?'checked':''} onchange="(${up.toString()})('cust','g',this.checked)"> Sof o'sish</label>
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.cust?.ch?'checked':''} onchange="(${up.toString()})('cust','ch',this.checked)"> Churn Rate (%)</label>
            </div>
          </div>

          <!-- ARPA CARD -->
          <div class="bg-card border border-brd rounded-xl overflow-hidden">
            <div class="py-3 px-[15px] bg-[rgba(255,255,255,0.03)] border-b border-brd flex items-center gap-2.5">
              <input type="checkbox" ${c.arpa?.s?'checked':''} onchange="(${up.toString()})('arpa','s',this.checked)" class="w-4 h-4">
              <span class="font-bold text-sm">ARPA (Average Revenue Per Account)</span>
            </div>
            <div style="padding:12px 15px; display:flex; gap:20px; font-size:12px; opacity:${c.arpa?.s?1:0.5}; pointer-events:${c.arpa?.s?'auto':'none'}">
              <label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" ${c.arpa?.g?'checked':''} onchange="(${up.toString()})('arpa','g',this.checked)"> O'sish dinamikasi</label>
            </div>
          </div>

        </div>
        <div class="dash-set-grp">
          <div class="dash-set-lbl">💰 Financial Metrics</div>
          ${renderSetCard('cash', 'Net Cash In (Phases 21+)', c.cash?.s !== false, up)}
          ${renderSetCard('cac', 'CAC (Customer Acquisition Cost)', c.cac?.s !== false, up)}
        </div>
        <div class="dash-set-grp">
          <div class="dash-set-lbl">📊 Business Efficiency</div>
          ${renderSetCard('dso', 'DSO (Days Sales Outstanding)', c.dso?.s !== false, up)}
          ${renderSetCard('conc', 'Revenue Concentration', c.conc?.s !== false, up)}
          ${renderSetCard('ltv', 'LTV (Lifetime Value)', c.ltv?.s !== false, up)}
          ${renderSetCard('qr', 'SaaS Quick Ratio', c.qr?.s !== false, up)}
          ${renderSetCard('lc', 'Logo vs Revenue Churn', c.lc?.s !== false, up)}
        </div>
      </div>

      <!-- CHARTS SECTION -->
      <div class="mb-[30px]">
        <div class="text-xs uppercase text-primary tracking-[1px] mb-[15px] font-extrabold flex items-center gap-2.5">
          <span class="bg-warn w-1 h-3.5 rounded-sm"></span>
          2. GRAFIK VA DIAGRAMMALAR
        </div>
        <div class="grid grid-cols-1 gap-2.5">
          ${renderSetCard('chTrend', 'Total MRR Trend (Line Chart)', c.chTrend?.s !== false, up)}
          ${renderSetCard('chComp', 'MRR Components (Bar Chart)', c.chComp?.s !== false, up)}
          ${renderSetCard('cMrrGr', 'MRR Growth Rate (Sparkline)', c.cMrrGr?.s !== false, up)}
          ${renderSetCard('cNetMov', 'Net MRR Movement', c.cNetMov?.s !== false, up)}
        </div>
      </div>

      <!-- TABLES SECTION -->
      <div>
        <div class="text-xs uppercase text-primary tracking-[1px] mb-[15px] font-extrabold flex items-center gap-2.5">
          <span class="bg-success w-1 h-3.5 rounded-sm"></span>
          3. BATAFSIL JADVALLAR
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          ${renderSetCard('tNew', 'Yangi mijozlar', c.tNew?.s !== false, up)}
          ${renderSetCard('tChurn', 'Yo\'qotilganlar', c.tChurn?.s !== false, up)}
          ${renderSetCard('tExp', 'Kengayishlar', c.tExp?.s !== false, up)}
          ${renderSetCard('tCohort', 'Cohort Analysis', c.tCohort?.s !== false, up)}
          ${renderSetCard('tRenew', 'Shartnoma Kalendari', c.tRenew?.s !== false, up)}
          ${renderSetCard('tRegion', 'Hudud bo\'yicha', c.tRegion?.s !== false, up)}
          ${renderSetCard('tMgr', 'Menejer Reytingi', c.tMgr?.s !== false, up)}
          ${renderSetCard('tHealth', 'Mijoz Sog\'ligi', c.tHealth?.s !== false, up)}
        </div>
      </div>

    </div>

    <div class="py-[15px] px-6 bg-card border-t border-brd flex justify-end gap-2.5">
      <button class="btn btn-primary py-2.5 px-[30px] font-semibold" onclick="this.closest('.overlay').remove()">Tayyor</button>
    </div>
  </div>`;
  document.body.appendChild(o);
}

function renderSetCard(key, label, val, upFn) {
  return `<label class="bg-card p-[15px] rounded-xl border border-brd text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 set-item">
    <input type="checkbox" ${val?'checked':''} onchange="(${upFn.toString()})('${key}','s',this.checked)" class="w-4 h-4">
    <span class="font-semibold">${label}</span>
  </label>`;
}
// === SMART LOADING SCREEN ===
const LOAD_TIPS=[
  {e:'📊',t:'MRR nima?',b:'Monthly Recurring Revenue — har oylik takrorlanuvchi daromad. Biznesingiz barqarorligini ko\'rsatuvchi asosiy metrika. MRR o\'sgani sari biznes qiymati ham oshib boradi.'},
  {e:'📉',t:'Churn nima?',b:'Mijozning ketishi yoki to\'lovni to\'xtatishi. Churn rate qanchalik past bo\'lsa, biznes shunchalik barqaror. Yangi mijoz jalb qilishdan ko\'ra mavjudlarni saqlash 5x arzon.'},
  {e:'💡',t:'NRR nima?',b:'Net Revenue Retention — mavjud mijozlardan daromad saqlanish darajasi. 100%+ bo\'lsa, yangi mijozlarsiz ham o\'sish mumkin. World-class SaaS kompaniyalarda NRR 120%+ bo\'ladi.'},
  {e:'⏱',t:'DSO nima?',b:'Days Sales Outstanding — hisob-fakturadan to\'lovgacha o\'rtacha kun soni. DSO qanchalik kam bo\'lsa, cash flow shunchalik sog\'lom va biznes operatsiyalari samarali.'},
  {e:'🔄',t:'Expansion MRR',b:'Mavjud mijozlardan yangi shartnoma yoki xizmat kengaytirish orqali kelgan qo\'shimcha daromad. Bu o\'sishning eng arzon yo\'li — marketing xarajatisiz daromad oshadi.'},
  {e:'📅',t:'ARR nima?',b:'Annual Recurring Revenue = MRR × 12. Yillik daromadni rejalashtirish, investor bilan muloqot va biznes qiymatini baholashda asosiy ko\'rsatkich sifatida ishlatiladi.'},
  {e:'🎯',t:'ARPA nima?',b:'Average Revenue Per Account — mijoz boshiga o\'rtacha daromad. ARPA oshishi pricing strategiyasi to\'g\'ri ishlayotganidan dalolat beradi. Segmentlar bo\'yicha tahlil qilib ko\'ring.'},
  {e:'🏆',t:'LTV nima?',b:'Customer Lifetime Value — mijozning butun hamkorlik davridagi umumiy qiymati. Sog\'lom biznesda LTV/CAC nisbati 3:1 dan yuqori bo\'ladi. LTV kam bo\'lsa — churn muammo bor.'},
  {e:'⚡',t:'Cash Flow vs MRR',b:'MRR yuqori bo\'lsa ham to\'lovlar kechiksa, cash flow muammo yaratadi. Shartnoma summasi bilan real tushumlar o\'rtasidagi farqni doim kuzatib boring — bu DSO ni yaxshilaydi.'},
  {e:'🧮',t:'Gross Margin',b:'Daromaddan to\'g\'ridan-to\'g\'ri xarajatlar chegirilgandan qolgan ulush. SaaS va xizmat biznesida 70-80% gross margin norma hisoblanadi. Bundan past bo\'lsa xarajatlarni qayta ko\'ring.'},
  {e:'📌',t:'Payback Period',b:'Yangi mijoz jalb qilish xarajatini (CAC) qoplash uchun ketadigan vaqt. 12 oydan kam bo\'lsa biznes modeli samarali. 24 oydan oshsa — pricing yoki CAC ni optimallashtirish kerak.'},
  {e:'🔐',t:'Resurrection MRR',b:'Oldin to\'xtatgan, endi qaytgan mijozdan tushgan daromad. Resurrected mijozlar ko\'pincha yangilardan sadiqroq bo\'ladi — chunki ular muammoni bilib qaytdi va qadrini biladi.'},
  {e:'📈',t:'Cohort tahlil',b:'Bir vaqtda boshlagan mijozlar guruhining vaqt o\'tishi bilan rivojlanishini kuzatish. Cohort tahlili qaysi oy/davr mijozlari eng uzoq turganini aniq ko\'rsatib beradi.'},
  {e:'💼',t:'B2B xususiyatlari',b:'B2B biznesda mijoz soni kam, lekin har biri katta. Shu sababli bitta mijoz yo\'qotilishi MRR ga katta ta\'sir qiladi. Top 10 mijozga alohida e\'tibor va qayta-qayta muloqot muhim.'},
];
let _ldEl=null,_ldTimer=null,_ldTip=0,_ldTips=[],_ldReady=false,_ldMinDone=false;

function showSmartLoader(){
  if(_ldEl){_ldEl.remove();_ldEl=null;}
  _ldReady=false;_ldMinDone=false;
  // Pick 3 random non-repeating tips
  const pool=[...LOAD_TIPS].sort(()=>Math.random()-.5).slice(0,3);
  _ldTips=pool;_ldTip=0;
  const el=document.createElement('div');el.id='smart-loader';
  el.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:0';
  el.innerHTML='<div class="flex items-center gap-2.5 mb-7">'
    +'<div class="w-9 h-9 bg-accent rounded-[9px] flex items-center justify-center text-white font-extrabold text-lg">U</div>'
    +'<div class="font-bold text-[17px] text-primary">UYSOT <span class="text-subtle font-normal text-[13px]">CRM</span></div>'
    +'</div>'
    +'<div style="width:min(460px,92vw)">'
    +'<div class="flex justify-between items-center mb-[7px]">'
    +'<div id="sl-lbl" class="text-xs text-subtle">Tayyorlanmoqda…</div>'
    +'<div id="sl-pct" class="text-[13px] font-bold text-accent font-mono">0%</div>'
    +'</div>'
    +'<div class="h-[7px] bg-brd rounded-[4px] overflow-hidden mb-2.5">'
    +'<div id="sl-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent),#20c997);border-radius:4px;transition:width .5s cubic-bezier(.4,0,.2,1)"></div>'
    +'</div>'
    +'<div class="mb-[22px]"></div>'
    +'</div>'
    +'<div id="sl-tip" style="width:min(460px,92vw);background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:22px 24px;min-height:100px;transition:opacity .3s ease"></div>'
    +'<div id="sl-dots" class="flex gap-[5px] mt-3.5"></div>';
  document.body.appendChild(el);_ldEl=el;
  _renderLdTip(true);
  // Rotate through the 3 tips: each shown for 15s
  _ldTimer=setInterval(()=>{
    _ldTip=(_ldTip+1)%_ldTips.length;
    _renderLdTip();
    if(_ldTip===0)_ldMinDone=true;
  },15000);
}

function _renderLdTip(instant){
  if(!_ldEl||!_ldTips.length)return;
  const tip=_ldTips[_ldTip];
  const te=_ldEl.querySelector('#sl-tip'),de=_ldEl.querySelector('#sl-dots');
  if(!te)return;
  if(!instant)te.style.opacity='0';
  setTimeout(()=>{
    te.innerHTML='<div class="flex items-start gap-4">'
      +'<div style="font-size:30px;line-height:1;flex-shrink:0;margin-top:2px">'+tip.e+'</div>'
      +'<div><div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:7px">'+tip.t+'</div>'
      +'<div style="font-size:13px;color:var(--text2);line-height:1.65">'+tip.b+'</div></div></div>';
    te.style.opacity='1';
    // If data finished loading while tip was showing, hide now
    if(_ldReady&&_ldMinDone)_doHide();
  },instant?0:200);
  if(de)de.innerHTML=_ldTips.map((_,i)=>'<div style="height:5px;width:'+(i===_ldTip?'22px':'5px')+';border-radius:3px;background:'+(i===_ldTip?'var(--accent)':'var(--border)')+';transition:all .35s ease"></div>').join('');
}

function updateLoader(done,total,label){
  if(!_ldEl)return;
  const pct=Math.round(done/total*100);
  const b=_ldEl.querySelector('#sl-bar'),p=_ldEl.querySelector('#sl-pct'),l=_ldEl.querySelector('#sl-lbl');
  if(b)b.style.width=pct+'%';
  if(p)p.textContent=pct+'%';
  if(l)l.textContent=label+(done<total?' yuklanmoqda…':' — tayyor!');
}

function _doHide(){
  if(_ldTimer){clearInterval(_ldTimer);_ldTimer=null;}
  if(_ldEl){const el=_ldEl;el.style.transition='opacity .4s';el.style.opacity='0';setTimeout(()=>el.remove(),420);_ldEl=null;}
}

function hideSmartLoader(){
  _doHide();
}

// === DATA LOADING ===
async function fetchCsv(url,label){
  console.log('['+label+'] Yuklanmoqda: '+url);
  try{const r=await fetch(url);if(r.ok){const t=await r.text();
  if(t.startsWith('<!') || t.startsWith('<html')){throw new Error('HTML')}
  if(t.length>10){return t}}}catch(e){console.warn('['+label+'] Direct:',e.message)}
  try{const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url));
  if(r.ok){const j=await r.json();if(j.contents&&j.contents.length>10&&!j.contents.startsWith('<!'))return j.contents}
  }catch(e){console.warn('['+label+'] allorigins:',e.message)}
  throw new Error('['+label+'] Yuklab bo\'lmadi.')
}

async function loadFromConfig(config){
  // Count active sources for progress tracking
  const _steps=[];
  if(config.shartnomalar)_steps.push('Shartnomalar');
  if(config.qoshimcha)_steps.push("Qo'shimcha");
  if(config.payments&&config.payments!=='HAVOLA_KIRITING')_steps.push("To'lovlar");
  if(config['2024']&&config['2024']!=='HAVOLA_KIRITING')_steps.push('2024 arxiv');
  if(config.perevod&&config.perevod!=='HAVOLA_KIRITING')_steps.push('Perevodlar');
  const _tot=_steps.length||1;let _done=0;
  showSmartLoader();updateLoader(0,_tot,_steps[0]||'Ma\'lumotlar');
  try{
    if(config.shartnomalar){updateLoader(_done,_tot,'Shartnomalar');const csv=await fetchCsv(config.shartnomalar,'Shartnomalar');S.rows=parse(csv);_done++;updateLoader(_done,_tot,_steps[_done]||'Tugadi');}
    if(config.qoshimcha){updateLoader(_done,_tot,"Qo'shimcha");try{const csv=await fetchCsv(config.qoshimcha,"Qo'shimcha");S.qRows=parse(csv)}catch(e){S.qRows=[]}_done++;updateLoader(_done,_tot,_steps[_done]||'Tugadi');}
    if(config.payments&&config.payments!=='HAVOLA_KIRITING'){updateLoader(_done,_tot,"To'lovlar");try{const csv=await fetchCsv(config.payments,'Payments');S.payRows=parseRaw(csv)}catch(e){S.payRows=[]}_done++;updateLoader(_done,_tot,_steps[_done]||'Tugadi');}
    if(config['2024']&&config['2024']!=='HAVOLA_KIRITING'){updateLoader(_done,_tot,'2024 arxiv');try{const csv=await fetchCsv(config['2024'],'2024');S.y2024Rows=parseRaw(csv)}catch(e){S.y2024Rows=[]}_done++;updateLoader(_done,_tot,_steps[_done]||'Tugadi');}
    if(config.perevod&&config.perevod!=='HAVOLA_KIRITING'){updateLoader(_done,_tot,'Perevodlar');try{const csv=await fetchCsv(config.perevod,'Perevod');S.perevodRows=parseRaw(csv)}catch(e){S.perevodRows=[]}_done++;updateLoader(_done,_tot,'Tayyor!');}
    if(config.mkt&&config.mkt!=='HAVOLA_KIRITING'){try{const csv=await fetchCsv(config.mkt,'Marketing');S.mktRows=parseMkt(csv)}catch(e){S.mktRows=[];}}
    if(config.menejerlar&&config.menejerlar!=='HAVOLA_KIRITING'){try{const csv=await fetchCsv(config.menejerlar,'Menejerlar');S.mgrRows=parseRaw(csv)}catch(e){S.mgrRows=[];}}
    saveCache();clearCache();
    document.getElementById('upd').textContent=new Date().toLocaleTimeString('uz');
    document.querySelector('.overlay')?.remove();
    showToast(S.rows.length+' ta shartnoma yuklandi','success');
    hideSmartLoader();
    render();
  }catch(e){
    console.error('Xatolik:',e);
    hideSmartLoader();
    showToast('Yuklanmadi: '+e.message,'error');
    document.getElementById('root').innerHTML=errPage('Yuklanmadi',e.message.replace(/\n/g,'<br>')+'<br><br>JSON config faylni qayta yuklang')
  }
}

function saveCache(){try{const cache={rows:S.rows,qRows:S.qRows,payRows:S.payRows,y2024Rows:S.y2024Rows,perevodRows:S.perevodRows,mktRows:S.mktRows,mgrRows:S.mgrRows,ts:Date.now()};localStorage.setItem('uysot_data',JSON.stringify(cache))}catch(e){console.warn('[Cache]',e.message)}}
function loadCache(){try{const raw=localStorage.getItem('uysot_data');if(!raw)return false;const cache=JSON.parse(raw);if(!cache.rows||!cache.rows.length)return false;S.rows=cache.rows;S.qRows=cache.qRows||[];S.payRows=cache.payRows||[];S.y2024Rows=cache.y2024Rows||[];S.perevodRows=cache.perevodRows||[];S.mktRows=cache.mktRows||[];S.mgrRows=cache.mgrRows||[];return true}catch(e){return false}}

function loadJsonConfig(input){const f=input.files[0];if(!f)return;
const r=new FileReader();r.onload=e=>{try{const config=JSON.parse(e.target.result);if(!config.shartnomalar)throw new Error('"shartnomalar" havolasi topilmadi');localStorage.setItem('uysot_config',e.target.result);S.config=config;loadFromConfig(config)}catch(e){alert('JSON xatolik: '+e.message)}};r.readAsText(f)}

function errPage(title,detail){return`<div class="loading gap-3">
<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
<div style="font-weight:600;color:var(--red);font-size:16px">${title}</div>
<div style="color:var(--text2);font-size:12px;text-align:left;max-width:520px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;line-height:1.7">${detail}</div>
<div class="flex gap-1.5 mt-1">
<label class="btn btn-primary cursor-pointer">JSON config yuklash<input type="file" accept=".json" onchange="loadJsonConfig(this)" class="hidden"></label>
</div><button class="btn" onclick="showConfig()">Sozlamalar</button></div>`}

function loadFile(i,type){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{
const t=e.target.result;
const map={main:['rows','parse'],extra:['qRows','parse'],pay:['payRows','parseRaw'],y24:['y2024Rows','parseRaw'],per:['perevodRows','parseRaw'],mkt:['mktRows','parseMkt'],mgr:['mgrRows','parseRaw']};
const [key,fnStr]=map[type]||['rows','parse'];
const fn = fnStr==='parse'?parse:(fnStr==='parseRaw'?parseRaw:parseMkt);
S[key]=fn(t);
saveCache();clearCache();
document.querySelector('.overlay')?.remove();
document.getElementById('upd').textContent=new Date().toLocaleTimeString('uz');
showToast(S[key].length+' ta qator yuklandi','success');
showConfig();render()
}catch(e){alert('Xatolik: '+e.message)}};r.readAsText(f)}

function showWelcome(){document.getElementById('root').innerHTML=`<div class="loading"><div class="logo-mark w-[52px] h-[52px] text-xl rounded-xl">U</div><h2 class="text-xl font-bold mt-1">UYSOT Shartnomalar</h2><p class="text-muted text-center max-w-[400px] text-[13px] leading-[1.7]">Google Sheets ma'lumotlarini <b>uysot_config.json</b> file orqali ulang.<br>JSON ichida shartnomalar va qo'shimcha CSV havolalari bo'ladi.</p><div class="flex gap-2.5 mt-4"><label class="btn btn-primary py-2.5 px-[22px] cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>JSON config yuklash<input type="file" accept=".json" onchange="loadJsonConfig(this)" class="hidden"></label><button class="btn" onclick="showConfig()" class="py-2.5 px-[22px]">Boshqa usullar</button></div></div>`}

// === REPORT & SLIDES ENGINE ===

function _buildReportData(){
  const dr=dashRange();
  const to=S.dashTo||new Date();
  const nm=dr.netMovement;
  const curMRR=dr.totals[dr.totals.length-1]||0;
  const startMRR=dr.baseMRR||0;
  const arr=curMRR*12;
  const mrrGrowthPct=startMRR?Math.round((curMRR-startMRR)/startMRR*100):0;
  const nrr=startMRR>0?Math.round((startMRR-nm.churnMRR-nm.conMRR+nm.expMRR)/startMRR*100):0;
  const curClients=dr.cpmArr[dr.cpmArr.length-1]||0;
  const arpa=curClients>0?Math.round(curMRR/curClients):0;
  const periodLabel=dr.labels.length>1?dr.labels[0]+' \u2013 '+dr.labels[dr.labels.length-1]:dr.labels[0]||'';
  const dt=calcDebtTable(to);
  const mb=calcManagerBoard();
  const rp=calcRegionalPerf();
  const ch=calcClientHealth();
  const ar=calcARaging();
  const fc=calcMrrForecast();
  const cr=calcCollectionRate();
  const totalDebt=dt.reduce((s,r)=>s+Math.max(0,r.oyQarz),0);
  const healthy=ch.filter(c=>c.status==='healthy').length;
  const warning=ch.filter(c=>c.status==='warning').length;
  const critical=ch.filter(c=>c.status==='critical').length;
  return{dr,dt,mb,rp,ch,ar,fc,cr,nm,periodLabel,to,curMRR,startMRR,arr,mrrGrowthPct,nrr,curClients,arpa,totalDebt,healthy,warning,critical};
}

async function _callGemini(prompt){
  if(!S.geminiKey)throw new Error("Gemini kaliti yo'q");
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+S.geminiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.6,maxOutputTokens:2000}})});
  const d=await r.json();
  if(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts[0].text)return d.candidates[0].content.parts[0].text;
  throw new Error(d.error&&d.error.message||'Gemini xatosi');
}

async function _callAI(prompt){
  if(S.aiProvider==='gemini'){
    return _callGemini(prompt);
  }
  if(S.aiProvider==='claude'&&S.apiKey){
    try{
      const ctrl=new AbortController();
      const tid=setTimeout(()=>ctrl.abort(),12000);
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json','x-api-key':S.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2000,messages:[{role:'user',content:prompt}]})});
      clearTimeout(tid);
      const d=await r.json();
      if(d.content&&d.content[0]&&d.content[0].text)return d.content[0].text;
      throw new Error(d.error&&d.error.message||'Claude xatosi');
    }catch(e){
      // Claude API brauzerdan bloklanishi mumkin — Gemini'ga o'tish
      if(S.geminiKey){
        showToast('Claude API blok — Gemini\'ga o\'tildi','info');
        return _callGemini(prompt);
      }
      if(e.name==='AbortError')throw new Error('Claude API vaqt tugadi (tarmoq bloki). Gemini ishlatish tavsiya etiladi.');
      throw new Error('Claude API ulanmadi: '+e.message+'. Gemini ishlatish tavsiya etiladi.');
    }
  }
  throw new Error("AI kalit yo'q");
}

async function generateReport(){
  showToast('Hisobot shakllantirilmoqda...','info');
  const sec=S.repSec||{};
  const rd=_buildReportData();
  const{dr,dt,mb,rp,ch,ar,fc,cr,nm,periodLabel,curMRR,startMRR,arr,mrrGrowthPct,nrr,curClients,arpa,totalDebt,healthy,warning,critical}=rd;

  let aiText='';
  if(S.aiProvider!=='none'&&(S.apiKey||S.geminiKey)){
    try{
      showToast('AI tahlil yozilmoqda...','info');
      const p='Siz moliyaviy tahlilchisiz. Quyidagi ko\'rsatkichlar asosida O\'zbek tilida CFO/CEO uchun ijroiya xulosasi yozing (3-4 paragraf, 250-300 so\'z). Faqat oddiy matn, hech qanday belgi yo\'q:\n\nDAVR: '+periodLabel+'\nJoriy MRR: $'+fmt(curMRR)+' ('+( mrrGrowthPct>0?'+':'')+mrrGrowthPct+'%)\nARR: $'+fmt(arr)+'\nAktiv mijozlar: '+curClients+' (boshlang\'ich: '+dr.baseClients+')\nNRR: '+nrr+'%\nARPA: $'+arpa+'\nYangi MRR: +$'+fmt(nm.newMRR)+' ('+dr.newClients.length+' ta mijoz)\nChurn MRR: -$'+fmt(nm.churnMRR)+' ('+dr.churnClients.length+' ta)\nKengayish: +$'+fmt(nm.expMRR)+'\nQisqarish: -$'+fmt(nm.conMRR)+'\nNetto: '+(nm.net>=0?'+':'')+fmt(nm.net)+'\nQuick Ratio: '+dr.quickRatio.toFixed(2)+'x\nGRR: '+dr.grr+'%\nDSO: '+Math.round(dr.dso)+' kun\nLTV: $'+fmt(dr.ltv)+'\nTop-5 konsentratsiya: '+Math.round(dr.top5Conc)+'%\nJami oy qarzi: $'+fmt(totalDebt)+'\nKassa: $'+fmt(dr.cashIn)+'\nSog\'lom/Xavf/Kritik: '+healthy+'/'+warning+'/'+critical+'\n\nYutuqlar, xavflar va tavsiyalar bo\'lsin.';
      aiText=await _callAI(p);
    }catch(e){showToast('AI: '+e.message,'error')}
  }

  // CSS
  const css='*{margin:0;padding:0;box-sizing:border-box}html,body{font-family:"Segoe UI",system-ui,Arial,sans-serif;color:#1a1917;background:#fff;font-size:9.5pt;line-height:1.5}@page{size:A4 portrait;margin:16mm 18mm 20mm}@media print{.pb{page-break-before:always}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.noprint{display:none!important}}.cover{min-height:100vh;background:linear-gradient(145deg,#0f2a6b 0%,#1746a2 55%,#0e5a7b 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px}.logo{width:54px;height:54px;background:rgba(255,255,255,.18);border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24pt;font-weight:900;margin:0 auto 24px;border:2px solid rgba(255,255,255,.3)}.badge{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 14px;font-size:9pt;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:22px;display:inline-block}.ct{font-size:26pt;font-weight:800;margin-bottom:8px;line-height:1.1}.cs{font-size:14pt;opacity:.85;margin-bottom:30px}.cm{font-size:10pt;opacity:.7;line-height:1.9}.section{margin-bottom:6mm}.sh{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:8px;border-bottom:2.5px solid #1746a2}.sn{width:26px;height:26px;background:#1746a2;color:#fff;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:800;flex-shrink:0}.st{font-size:13pt;font-weight:700}.kg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.kc{border:1px solid #e0dedd;border-radius:8px;padding:10px 12px;background:#fafaf8}.kl{font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kv{font-size:15pt;font-weight:800;font-family:"Courier New",monospace;color:#1a1917;line-height:1.1}.kd{font-size:8pt;margin-top:3px}.up{color:#117a52}.dn{color:#c42b1c}.neu{color:#666}table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:10px}thead th{background:#1746a2;color:#fff;font-weight:600;padding:6px 8px;text-align:left;font-size:8pt}tbody tr:nth-child(even){background:#f5f4f2}td{padding:5px 8px;border-bottom:1px solid #e8e6e3;vertical-align:middle}.tr{text-align:right}.mono{font-family:"Courier New",monospace}.fw{font-weight:700}h3{font-size:10.5pt;font-weight:700;color:#333;margin:12px 0 6px}p{font-size:9pt;color:#444;line-height:1.55;margin:6px 0}small{font-size:8pt;color:#888}.formula{background:#f0f7ff;border-left:3px solid #1746a2;padding:7px 10px;font-family:"Courier New",monospace;font-size:8pt;color:#1a4080;margin:8px 0;border-radius:0 4px 4px 0}.ai-block{background:#f0f7ff;border:1px solid #bbd4f5;border-radius:8px;padding:12px 14px;margin:10px 0}.ai-lbl{font-size:8pt;font-weight:700;color:#1746a2;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}.ai-text{font-size:9pt;color:#1a1917;line-height:1.6;white-space:pre-wrap}.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}.box{background:#fafaf8;border:1px solid #e0dedd;border-radius:7px;padding:10px 12px}.bl{font-size:8.5pt;font-weight:700;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}';

  // Helpers
  const xe=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
  const kpi=function(l,v,d,cls){return '<div class="kc"><div class="kl">'+xe(l)+'</div><div class="kv">'+xe(v)+'</div>'+(d?'<div class="kd '+(cls||'neu')+'">'+d+'</div>':'')+'</div>'};
  const th=function(hs){return '<thead><tr>'+hs.map(function(h){return'<th>'+xe(h)+'</th>'}).join('')+'</tr></thead>'};
  const tr=function(cells){return '<tr>'+cells.map(function(c){return'<td>'+c+'</td>'}).join('')+'</tr>'};

  let body='';

  // Cover
  body+='<div class="cover"><div class="logo">U</div><div class="badge">Maxfiy \xb7 Investorlar uchun</div><div class="ct">UYSOT Shartnomalar</div><div class="cs">Moliyaviy Faoliyat Hisoboti</div><div class="cm"><b>'+xe(periodLabel)+'</b><br>Tayyorlangan: '+fmtD(new Date())+'<br>'+S.rows.length+' ta shartnoma \xb7 '+curClients+' ta aktiv mijoz</div></div>';

  // S1: Executive Summary
  if(sec.summary!==false){
    body+='<div class="section pb"><div class="sh"><div class="sn">1</div><div class="st">Ijroiya Xulosasi</div></div>';
    body+='<div class="kg">'
      +kpi('Joriy MRR','$'+fk(curMRR),(mrrGrowthPct>=0?'+':'')+mrrGrowthPct+'% o\'zgarish',mrrGrowthPct>=0?'up':'dn')
      +kpi('ARR (yillik)','$'+fk(arr),'MRR \xd7 12','neu')
      +kpi('Aktiv mijozlar',''+curClients,(curClients-dr.baseClients>=0?'+':'')+(curClients-dr.baseClients)+' netto',curClients>=dr.baseClients?'up':'dn')
      +kpi('NRR',''+nrr+'%','Net Revenue Retention',nrr>=100?'up':nrr>=80?'neu':'dn')
      +kpi('Quick Ratio',dr.quickRatio.toFixed(2)+'x',dr.quickRatio>=1?'Sog\'lom o\'sish':'Xavfli zona',dr.quickRatio>=1?'up':'dn')
      +kpi('GRR',''+dr.grr+'%','Gross Retention',dr.grr>=85?'up':dr.grr>=70?'neu':'dn')
      +kpi('ARPA','$'+fmt(arpa),'Har bir mijoz/oy MRR','neu')
      +kpi('DSO',Math.round(dr.dso)+' kun','Debitorlik davri',dr.dso<=45?'up':dr.dso<=90?'neu':'dn')
      +'</div>';
    body+='<div class="row2">'
      +'<div class="box"><div class="bl">MRR harakati (davr)</div><table>'+th(['Komponent','Summa'])+'<tbody>'
      +tr(['Boshlang\'ich MRR','<span class="mono fw">$'+fmt(startMRR)+'</span>'])
      +tr(['+ Yangi MRR','<span class="up mono">+$'+fmt(nm.newMRR)+'</span>'])
      +tr(['+ Kengayish','<span class="up mono">+$'+fmt(nm.expMRR)+'</span>'])
      +tr(['\u2212 Qisqarish','<span class="dn mono">\u2212$'+fmt(nm.conMRR)+'</span>'])
      +tr(['\u2212 Churn MRR','<span class="dn mono">\u2212$'+fmt(nm.churnMRR)+'</span>'])
      +tr(['<b>Yopilish MRR</b>','<span class="mono fw">$'+fmt(curMRR)+'</span>'])
      +'</tbody></table></div>'
      +'<div class="box"><div class="bl">Mijozlar harakati</div><table>'+th(['Holat','Soni','MRR'])+'<tbody>'
      +tr(['Yangi','<span class="up">'+dr.newClients.length+'</span>','<span class="up mono">+$'+fmt(nm.newMRR)+'</span>'])
      +tr(['Churn','<span class="dn">'+dr.churnClients.length+'</span>','<span class="dn mono">\u2212$'+fmt(nm.churnMRR)+'</span>'])
      +tr(['Kengayish',''+dr.expClients.filter(function(x){return x.delta>0}).length,'<span class="up mono">+$'+fmt(nm.expMRR)+'</span>'])
      +tr(['Qisqarish',''+dr.expClients.filter(function(x){return x.delta<0}).length,'<span class="dn mono">\u2212$'+fmt(nm.conMRR)+'</span>'])
      +tr(['<b>Netto</b>','<b>'+(nm.net>=0?'+':'')+(curClients-dr.baseClients)+'</b>','<b class="'+(nm.net>=0?'up':'dn')+' mono">'+(nm.net>=0?'+':'\u2212')+'$'+fmt(Math.abs(nm.net))+'</b>'])
      +'</tbody></table></div></div>';
    if(aiText)body+='<div class="ai-block"><div class="ai-lbl">AI Ijroiya Tahlili</div><div class="ai-text">'+xe(aiText)+'</div></div>';
    body+='</div>';
  }

  // S2: MRR Analysis
  if(sec.mrr!==false){
    body+='<div class="section pb"><div class="sh"><div class="sn">2</div><div class="st">MRR Tahlili \u2014 Daromad Tarkibi</div></div>';
    body+='<h3>MRR Waterfall</h3>';
    body+='<div class="formula">NRR = (Opening MRR \u2212 Churn \u2212 Qisqarish + Kengayish) / Opening MRR \xd7 100 = '+nrr+'%</div>';
    body+='<div class="formula">GRR = (Opening MRR \u2212 Churn \u2212 Qisqarish) / Opening MRR \xd7 100 = '+dr.grr+'%</div>';
    body+='<div class="formula">Quick Ratio = (Yangi MRR + Kengayish) / (Churn + Qisqarish) = '+dr.quickRatio.toFixed(2)+'x</div>';
    var maxW=Math.max(startMRR,curMRR,nm.newMRR,nm.expMRR,nm.churnMRR,nm.conMRR)||1;
    var wfb=function(v,c){return'<span style="display:inline-block;width:'+Math.max(4,Math.round(Math.abs(v)/maxW*160))+'px;height:11px;background:'+c+';border-radius:2px;vertical-align:middle"></span>'};
    body+='<table>'+th(['Komponent','Vizual','Miqdor','Izoh'])+'<tbody>'
      +tr(['<b>Boshlang\'ich MRR</b>',wfb(startMRR,'#1746a2'),'<span class="mono fw">$'+fmt(startMRR)+'</span>','Davr boshidagi MRR'])
      +tr(['+ Yangi MRR',wfb(nm.newMRR,'#117a52'),'<span class="up mono">+$'+fmt(nm.newMRR)+'</span>',dr.newClients.length+' ta yangi mijoz'])
      +tr(['+ Kengayish',wfb(nm.expMRR,'#10b981'),'<span class="up mono">+$'+fmt(nm.expMRR)+'</span>','Mavjud mijozlar upsell'])
      +tr(['\u2212 Qisqarish',wfb(nm.conMRR,'#f59e0b'),'<span class="dn mono">\u2212$'+fmt(nm.conMRR)+'</span>','Mavjud mijozlar downsell'])
      +tr(['\u2212 Churn MRR',wfb(nm.churnMRR,'#c42b1c'),'<span class="dn mono">\u2212$'+fmt(nm.churnMRR)+'</span>',dr.churnClients.length+' ta ketgan mijoz'])
      +tr(['<b>Yopilish MRR</b>',wfb(curMRR,'#1746a2'),'<span class="mono fw">$'+fmt(curMRR)+'</span>','Davr oxiridagi MRR'])
      +'</tbody></table>';
    if(dr.labels.length>1){
      body+='<h3>MRR Trendi</h3><table>'+th(['Oy','MRR','Mijozlar','O\'sish %'])+'<tbody>';
      dr.labels.forEach(function(l,i){var gp=dr.mrrGrowthPcts[i];body+=tr([xe(l),'<span class="mono">$'+fmt(dr.totals[i]||0)+'</span>',''+( dr.cpmArr[i]||0),'<span class="'+(gp>=0?'up':'dn')+'">'+(gp>=0?'+':'')+gp+'%</span>'])});
      body+='</tbody></table>';
    }
    body+='<p><small>ARR (yillik daromad mo\'ljali) = Joriy MRR \xd7 12 = <b>$'+fmt(arr)+'</b>. Investorlar va kreditchilar uchun asosiy o\'lchov.</small></p></div>';
  }

  // S3: New Clients
  if(sec.newc!==false&&dr.newClients.length){
    body+='<div class="section pb"><div class="sh"><div class="sn">3</div><div class="st">Yangi Mijozlar \u2014 Yangi Biznes</div></div>';
    body+='<div class="kg">'
      +kpi('Yangi mijozlar',''+dr.newClients.length,'Davr ichida','up')
      +kpi('Yangi MRR','$'+fmt(nm.newMRR),'Qo\'shilgan daromad','up')
      +kpi('O\'rtacha yangi ARPA','$'+fmt(dr.newClients.length?Math.round(nm.newMRR/dr.newClients.length):0),'Yangi ARPA','neu')
      +kpi('CAC',dr.cac>0?'$'+fmt(Math.round(dr.cac)):'Ma\'lumot yo\'q',dr.ltvCac>0?'LTV:CAC '+dr.ltvCac.toFixed(1)+'x':'','neu')
      +'</div>';
    body+='<table>'+th(['Mijoz','Hudud','Menejer','MRR','Muddat','Sana'])+'<tbody>';
    dr.newClients.slice().sort(function(a,b){return b.mrr-a.mrr}).forEach(function(c){body+=tr([xe(c.name),xe(c.hudud||'\u2014'),xe(c.mgr||'\u2014'),'<span class="mono up">$'+fmt(c.mrr)+'</span>',c.dur?c.dur+' oy':'\u2014',c.date?fmtD(c.date):'\u2014'])});
    body+='</tbody></table></div>';
  }

  // S4: Churn & Retention
  if(sec.churn!==false){
    var lcPct=Math.round(dr.logoChurnRate*10)/10, rcPct=Math.round(dr.revenueChurnRate*10)/10;
    body+='<div class="section pb"><div class="sh"><div class="sn">4</div><div class="st">Churn & Retention Tahlili</div></div>';
    body+='<div class="kg">'
      +kpi('Churn soni',''+dr.churnClients.length,'Ketgan mijozlar','dn')
      +kpi('Churn MRR','$'+fmt(nm.churnMRR),'Yo\'qotilgan daromad','dn')
      +kpi('Logo Churn',lcPct+'%','Mijoz soni bo\'yicha',lcPct<=5?'up':lcPct<=15?'neu':'dn')
      +kpi('Revenue Churn',rcPct+'%','MRR bo\'yicha',rcPct<=5?'up':rcPct<=15?'neu':'dn')
      +'</div>';
    body+='<div class="row2"><div class="box"><div class="bl">Retention formulalari</div>'
      +'<p><b>NRR</b> = '+nrr+'%<br><small>($'+fmt(startMRR)+' \u2212 $'+fmt(nm.churnMRR)+' \u2212 $'+fmt(nm.conMRR)+' + $'+fmt(nm.expMRR)+') / $'+fmt(startMRR)+' \xd7 100</small></p>'
      +'<p style="margin-top:8px"><b>GRR</b> = '+dr.grr+'%<br><small>($'+fmt(startMRR)+' \u2212 $'+fmt(nm.churnMRR)+' \u2212 $'+fmt(nm.conMRR)+') / $'+fmt(startMRR)+' \xd7 100</small></p></div>'
      +'<div class="box"><div class="bl">Jahon standarti mezonlari</div>'
      +'<p>NRR \u2265 100% \u2014 <span class="up">Mukammal</span> (kengayish churni qoplaydi)</p>'
      +'<p>GRR \u2265 85% \u2014 <span class="up">Sog\'lom</span> (B2B SaaS standarti)</p>'
      +'<p>Logo Churn \u2264 5%/davr \u2014 <span class="up">Barqaror</span></p>'
      +'<p>Quick Ratio \u2265 4x \u2014 <span class="up">Yuqori o\'sish</span></p></div></div>';
    if(dr.churnClients.length){
      body+='<h3>Churn bo\'lgan mijozlar</h3><table>'+th(['Mijoz','Sana','Menejer','MRR yo\'qotish'])+'<tbody>';
      dr.churnClients.slice().sort(function(a,b){return b.mrr-a.mrr}).forEach(function(c){body+=tr([xe(c.name),c.date?fmtD(c.date):'\u2014',xe(c.mgr||'\u2014'),'<span class="dn mono">\u2212$'+fmt(c.mrr)+'</span>'])});
      body+='</tbody></table>';
    }
    body+='</div>';
  }

  // S5: Cash & Collections
  if(sec.cash!==false){
    var cashIn=dr.cashIn,cb=dr.cashInBreak,dso=dr.dso;
    body+='<div class="section pb"><div class="sh"><div class="sn">5</div><div class="st">Kassa va Inkasso Tahlili</div></div>';
    body+='<div class="kg">'
      +kpi('Jami kassa','$'+fmt(cashIn),'Davr tushumlari','up')
      +kpi('Naqd','$'+fmt(cb.naqd),Math.round(cashIn?cb.naqd/cashIn*100:0)+'%','neu')
      +kpi('Karta','$'+fmt(cb.karta),Math.round(cashIn?cb.karta/cashIn*100:0)+'%','neu')
      +kpi('Bank','$'+fmt(cb.bank),Math.round(cashIn?cb.bank/cashIn*100:0)+'%','neu')
      +'</div>';
    body+='<div class="formula">DSO (Days Sales Outstanding) = (Umumiy qarz / Davr daromadi) \xd7 Kun soni = '+Math.round(dso)+' kun</div>';
    body+='<p>DSO '+(dso<=30?"<span class='up'>A'lo (&lt;30 kun \u2014 industria standarti)</span>":dso<=60?"<span class='neu'>O'rta (30\u201360 kun \u2014 qabul qilinadi)</span>":"<span class='dn'>Yuqori (&gt;60 kun \u2014 inkasso kuchaytirilishi kerak)</span>")+'. Har bir qo\'shimcha DSO kuni ushlab turilgan kapital.</p>';
    var worst=cr.filter(function(c){return c.rate<100}).slice(0,12);
    if(worst.length){
      body+='<h3>Inkasso darajasi (past undiruv)</h3><table>'+th(['Mijoz','Kutilgan','To\'langan','Undiruv %','Farq'])+'<tbody>';
      worst.forEach(function(c){body+=tr([xe(c.name),'<span class="mono">$'+fmt(c.expected)+'</span>','<span class="mono">$'+fmt(c.paid)+'</span>','<span class="'+(c.rate>=90?'neu':'dn')+'">'+c.rate+'%</span>','<span class="dn mono">\u2212$'+fmt(Math.abs(c.delta))+'</span>'])});
      body+='</tbody></table>';
    }
    body+='</div>';
  }

  // S6: AR Aging & Debts
  if(sec.debt!==false){
    body+='<div class="section pb"><div class="sh"><div class="sn">6</div><div class="st">Debitorlik Qarzi \u2014 AR Aging</div></div>';
    body+='<div class="kg">';
    ar.forEach(function(b,i){body+=kpi(b.label,'$'+fk(b.total),b.clients.length+' ta mijoz',i===0?'neu':'dn')});
    body+='</div>';
    body+='<p>AR Aging \u2014 debitorlik qarzi yoshi tasnifi. 90+ kun guruhi <b class="text-danger">yuqori xavf</b> \u2014 ular uchun alohida inkasso chora ko\'rilishi kerak.</p>';
    body+='<table>'+th(['Muddat','Mijoz','Oy qarzi','Kelishuv qarzi','Kechikish','Oxirgi to\'lov'])+'<tbody>';
    ar.forEach(function(b){b.clients.forEach(function(c){var dc=c.days>90?'dn':c.days>30?'neu':'';body+=tr(['<span class="'+(c.days>90?'dn':c.days>60?'dn':c.days>30?'neu':'')+'">'+xe(b.label)+'</span>',xe(c.name),'<span class="dn mono">$'+fmt(c.qarz)+'</span>','<span class="mono">$'+fmt(c.kelQarz||0)+'</span>','<span class="'+dc+'">'+(c.days<999?c.days+' kun':'\u2014')+'</span>',xe(c.lastPayDate||'\u2014')])})});
    body+='</tbody></table></div>';
  }

  // S7: Managers
  if(sec.mgrs!==false&&mb.length){
    body+='<div class="section pb"><div class="sh"><div class="sn">7</div><div class="st">Menejerlar Samaradorligi</div></div>';
    body+='<table>'+th(['Menejer','Yangi','Yangi MRR','Churn','Churn MRR','Kengayish','Netto MRR'])+'<tbody>';
    mb.forEach(function(m){var n=m.netMRR||0;body+=tr(['<b>'+xe(m.name)+'</b>',''+( m.newCount||0),'<span class="up mono">+$'+fmt(Math.round(m.newMRR||0))+'</span>',''+( m.churnCount||0),'<span class="dn mono">\u2212$'+fmt(Math.round(m.churnMRR||0))+'</span>','<span class="up mono">+$'+fmt(Math.round(m.expMRR||0))+'</span>','<span class="'+(n>=0?'up':'dn')+' mono fw">'+(n>=0?'+':'\u2212')+'$'+fmt(Math.abs(Math.round(n)))+'</span>'])});
    body+='</tbody></table>';
    body+='<p><small>Netto MRR = Yangi MRR + Kengayish \u2212 Churn \u2212 Qisqarish. Menejerning umumiy biznesga qo\'shgan qiymati.</small></p></div>';
  }

  // S8: Regions
  if(sec.region!==false&&rp.length){
    var totMRR=rp.reduce(function(s,r){return s+r.mrr},0)||1;
    body+='<div class="section pb"><div class="sh"><div class="sn">8</div><div class="st">Mintaqaviy Tahlil</div></div>';
    body+='<table>'+th(['Hudud','MRR','Ulush %','Mijozlar','Yangi','Churn'])+'<tbody>';
    rp.forEach(function(r){var p=Math.round(r.mrr/totMRR*100);body+=tr(['<b>'+xe(r.name)+'</b>','<span class="mono">$'+fmt(r.mrr)+'</span>','<span class="'+(p>=20?'up':'neu')+'">'+p+'%</span>',''+( r.count||0),r.newCount?'<span class="up">+'+r.newCount+'</span>':'\u2014',r.churnCount?'<span class="dn">\u2212'+r.churnCount+'</span>':'\u2014'])});
    body+='</tbody></table><p><small>Bitta hudud MRR ning &gt;50% ni tashkil etsa, diversifikatsiya strategiyasi zarur.</small></p></div>';
  }

  // S9: Forecast
  if(sec.forecast!==false){
    body+='<div class="section pb"><div class="sh"><div class="sn">9</div><div class="st">MRR Prognoz \u2014 6 Oylik Ko\'rinish</div></div>';
    body+='<p>Prognoz <b>mavjud shartnomalar</b> asosida hisoblanadi. Yangi savdo va churn hisobga olinmagan. At-Risk MRR \u2014 ushbu oyda tugaydigan shartnomalar qiymati.</p>';
    body+='<table>'+th(['Oy','Prognoz MRR','Mijozlar','At-Risk MRR','Xavf %'])+'<tbody>';
    fc.forEach(function(m){var rp2=m.mrr>0?Math.round(m.expiringMRR/m.mrr*100):0;body+=tr(['<b>'+xe(m.label)+'</b>','<span class="mono">$'+fmt(m.mrr)+'</span>',''+m.clients,'<span class="dn mono">$'+fmt(m.expiringMRR)+'</span>','<span class="'+(rp2>30?'dn':rp2>15?'neu':'up')+'">'+rp2+'%</span>'])});
    body+='</tbody></table></div>';
  }

  // S10: Portfolio Health
  if(sec.health!==false&&ch.length){
    var total=ch.length;
    body+='<div class="section pb"><div class="sh"><div class="sn">10</div><div class="st">Portfolio Salomatligi</div></div>';
    body+='<div class="kg">'
      +kpi('Sog\'lom',''+healthy,Math.round(healthy/total*100)+'%','up')
      +kpi('Xavf',''+warning,Math.round(warning/total*100)+'%','neu')
      +kpi('Kritik',''+critical,Math.round(critical/total*100)+'%','dn')
      +kpi('Jami',''+total,'Baholangan mijozlar','neu')
      +'</div>';
    body+='<p>Health Score 0\u2013100: qarz yuklamasi (\u221240 ball), shartnoma tugash yaqinligi (\u221220 ball), yangi mijoz (\u221210 ball). Score &lt;50 kritik.</p>';
    var crit=ch.filter(function(c){return c.status==='critical'}).slice(0,15);
    if(crit.length){
      body+='<h3>Kritik holat mijozlar</h3><table>'+th(['Mijoz','Score','MRR','Qarz (oy)','Shartnoma (kun)'])+'<tbody>';
      crit.forEach(function(c){body+=tr(['<b>'+xe(c.name)+'</b>','<span class="dn">'+c.score+'</span>','<span class="mono">$'+fmt(c.mrr)+'</span>',c.debt>0?'<span class="dn mono">$'+fmt(c.debt)+'</span>':'\u2014',c.daysToEnd>-900?c.daysToEnd+' kun':'Faol emas'])});
      body+='</tbody></table>';
    }
    body+='</div>';
  }

  var fullHtml='<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>UYSOT Hisobot \u2014 '+xe(periodLabel)+'<\/title><style>'+css+'<\/style><\/head><body>'+body+'<div class="noprint fixed bottom-4 right-4 flex gap-2 z-[999]"><button onclick="window.print()" style="background:#1746a2;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.15)">\uD83D\uDDB6 PDF saqlash<\/button><button onclick="window.close()" style="background:#f0efeb;color:#333;border:1px solid #ccc;border-radius:8px;padding:10px 18px;font-size:13px;cursor:pointer">Yopish<\/button><\/div><\/body><\/html>';
  var w=window.open('','_blank');
  if(!w){showToast('Popup bloklangan \u2014 brauzer ruxsat bering','error');return}
  w.document.write(fullHtml);w.document.close();w.focus();
  setTimeout(function(){w.print()},700);
  showToast('Hisobot tayyor!','success');
}

async function generateSlides(){
  showToast('Taqdimot yaratilmoqda...','info');
  const rd=_buildReportData();
  const{dr,dt,mb,rp,ch,ar,fc,nm,periodLabel,curMRR,startMRR,arr,mrrGrowthPct,nrr,curClients,arpa,totalDebt,healthy,warning,critical}=rd;

  let an={};
  if(S.aiProvider!=='none'&&(S.apiKey||S.geminiKey)){
    try{
      showToast('AI slide matnlari...','info');
      var sp='Investor taqdimot uchun O\'zbek tilida har bir slide uchun 1-2 gap yozing. JSON: {"s1":"...","s2":"...","s3":"...","s4":"...","s5":"...","s6":"...","s7":"...","s8":"...","s9":"...","s10":"..."}\n\nDAVR:'+periodLabel+'\nMRR:$'+fmt(curMRR)+'('+mrrGrowthPct+'%)\nARR:$'+fmt(arr)+'\nMijoz:'+curClients+'\nNRR:'+nrr+'%\nQR:'+dr.quickRatio.toFixed(1)+'x\nYangi:'+dr.newClients.length+' Churn:'+dr.churnClients.length+'\nQarz:$'+fmt(totalDebt)+'\n\nS1=Ijroiya xulosasi, S2=MRR tendensiya, S3=Waterfall, S4=Mijozlar, S5=Unit Economics, S6=Kassa, S7=Hudud&Menejerlar, S8=Portfolio, S9=Prognoz, S10=Xulosa';
      var txt=await _callAI(sp);
      try{an=JSON.parse(txt.replace(/```json\n?|\n?```/g,'').trim())}catch(e2){an={}}
    }catch(e){showToast('AI: '+e.message,'error')}
  }

  var xe=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
  var kc=function(l,v,d,c){return'<div class="skc"><div class="skl">'+xe(l)+'</div><div class="skv '+(c||'w')+'">'+xe(v)+'</div>'+(d?'<div class="skd '+(c||'w')+'">'+d+'</div>':'')+'</div>'};

  var maxT=Math.max.apply(null,dr.totals)||1;
  var bars=dr.labels.map(function(l,i){var h=Math.max(4,Math.round(dr.totals[i]/maxT*72));var c=i===dr.totals.length-1?'#3b82f6':'rgba(255,255,255,.3)';return'<div class="bar-item"><div class="bar-fill" style="height:'+h+'px;background:'+c+'"></div><div class="bar-lbl">'+xe(l)+'</div></div>'}).join('');

  var maxW=Math.max(startMRR,curMRR,nm.newMRR,nm.expMRR,nm.churnMRR,nm.conMRR)||1;
  var wfb=function(label,v,c){return'<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><div style="width:120px;font-size:12px;color:rgba(255,255,255,.7)">'+xe(label)+'</div><div style="flex:1;height:9px;background:rgba(255,255,255,.08);border-radius:3px"><div style="width:'+Math.max(2,Math.round(Math.abs(v)/maxW*100))+'%;height:100%;background:'+c+';border-radius:3px"></div></div><div style="width:70px;text-align:right;font-family:monospace;font-size:11px;color:rgba(255,255,255,.7)">'+(v>0?'+':'\u2212')+'$'+fk(Math.abs(v))+'</div></div>'};

  var sls=[];

  // Slide 1: Cover
  sls.push('<div class="sl sl-cover on"><div class="flex-1 flex flex-col justify-center"><div style="width:56px;height:56px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.25);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;margin-bottom:28px">U</div><div class="sl-label">UYSOT Shartnomalar</div><div class="sl-title">Moliyaviy Faoliyat<br><span>Hisoboti</span></div><div class="sl-sub">'+xe(periodLabel)+' \xb7 '+fmtD(new Date())+'<br>'+curClients+' ta aktiv mijoz \xb7 $'+fk(arr)+' ARR</div></div></div>');

  // Slide 2: KPIs
  sls.push('<div class="sl"><div class="sl-label">Ijroiya Xulosasi</div><div class="sl-title">Asosiy Ko\'rsatkichlar</div>'+(an.s1?'<div class="sl-sub">'+xe(an.s1)+'</div>':'')+'<div class="skg">'+kc('Joriy MRR','$'+fk(curMRR),(mrrGrowthPct>=0?'+':'')+mrrGrowthPct+'%',mrrGrowthPct>=0?'g':'r')+kc('ARR','$'+fk(arr),'Yillik daromad','b')+kc('Aktiv mijozlar',''+curClients,(curClients-dr.baseClients>=0?'+':'')+(curClients-dr.baseClients)+' netto',curClients>=dr.baseClients?'g':'r')+kc('NRR',''+nrr+'%',nrr>=100?'Mukammal':nrr>=80?'Yaxshi':'Xavf',nrr>=100?'g':nrr>=80?'a':'r')+kc('Quick Ratio',dr.quickRatio.toFixed(2)+'x',dr.quickRatio>=2?'A\'lo':dr.quickRatio>=1?'Normada':'Xavf',dr.quickRatio>=2?'g':dr.quickRatio>=1?'a':'r')+kc('GRR',''+dr.grr+'%','Gross Retention',dr.grr>=85?'g':dr.grr>=70?'a':'r')+kc('ARPA','$'+fmt(arpa),'Har bir mijoz','w')+kc('DSO',Math.round(dr.dso)+' kun','Debitorlik',dr.dso<=45?'g':dr.dso<=90?'a':'r')+'</div></div>');

  // Slide 3: Waterfall
  sls.push('<div class="sl"><div class="sl-label">MRR Waterfall</div><div class="sl-title">Netto Harakatlar: <span>'+(nm.net>=0?'+':'\u2212')+'$'+fk(Math.abs(nm.net))+'</span></div>'+(an.s3?'<div class="sl-sub">'+xe(an.s3)+'</div>':'')+'<div class="sc2"><div class="sbox"><div class="sbox-t">Komponentlar</div>'+wfb('+ Yangi MRR',nm.newMRR,'#34d399')+wfb('+ Kengayish',nm.expMRR,'#10b981')+wfb('\u2212 Qisqarish',nm.conMRR,'#f59e0b')+wfb('\u2212 Churn MRR',nm.churnMRR,'#f87171')+'</div><div class="sbox"><div class="sbox-t">Retention metrikalari</div><table class="stbl"><tbody><tr><td>NRR</td><td class="tr '+(nrr>=100?'g':nrr>=80?'a':'r')+' font-bold">'+nrr+'%</td></tr><tr><td>GRR</td><td class="tr '+(dr.grr>=85?'g':dr.grr>=70?'a':'r')+' font-bold">'+dr.grr+'%</td></tr><tr><td>Quick Ratio</td><td class="tr '+(dr.quickRatio>=1?'g':'r')+' font-bold">'+dr.quickRatio.toFixed(2)+'x</td></tr><tr><td>Logo Churn</td><td class="tr '+(dr.logoChurnRate<=5?'g':dr.logoChurnRate<=15?'a':'r')+'">'+Math.round(dr.logoChurnRate*10)/10+'%</td></tr></tbody></table></div></div></div>');

  // Slide 5: Customer Movements
  sls.push('<div class="sl"><div class="sl-label">Mijozlar Harakati</div><div class="sl-title"><span class="g">+'+dr.newClients.length+'</span> yangi \xb7 <span class="r">\u2212'+dr.churnClients.length+'</span> churn</div>'+(an.s4?'<div class="sl-sub">'+xe(an.s4)+'</div>':'')+'<div class="sc2"><div class="sbox"><div class="sbox-t">Yangi mijozlar (top 8)</div><table class="stbl"><thead><tr><th>Mijoz</th><th class="tr">MRR</th><th>Menejer</th></tr></thead><tbody>'+dr.newClients.slice(0,8).map(function(c){return'<tr><td>'+xe(c.name)+'</td><td class="tr g font-mono">+$'+fmt(c.mrr)+'</td><td class="text-[rgba(255,255,255,0.6)]">'+xe(c.mgr||'\u2014')+'</td></tr>'}).join('')+'</tbody></table></div><div class="sbox"><div class="sbox-t">Churn bo\'lganlar (top 8)</div><table class="stbl"><thead><tr><th>Mijoz</th><th class="tr">MRR</th><th>Sana</th></tr></thead><tbody>'+( dr.churnClients.length?dr.churnClients.slice(0,8).map(function(c){return'<tr><td>'+xe(c.name)+'</td><td class="tr r font-mono">\u2212$'+fmt(c.mrr)+'</td><td class="text-[rgba(255,255,255,0.6)]">'+(c.date?fmtD(c.date):'\u2014')+'</td></tr>'}).join(''):'<tr><td colspan="3" class="text-center text-[rgba(255,255,255,0.3)] p-5">Churn yo\'q \u2713</td></tr>')+'</tbody></table></div></div></div>');

  // Slide 6: Unit Economics
  sls.push('<div class="sl"><div class="sl-label">Unit Economics</div><div class="sl-title">Mijoz Qiymati <span>Tahlili</span></div>'+(an.s5?'<div class="sl-sub">'+xe(an.s5)+'</div>':'')+'<div class="skg">'+kc('ARPA','$'+fmt(arpa),'Har bir mijoz/oy','b')+kc('LTV','$'+fk(dr.ltv),'Mijoz umr bo\'yi','g')+kc('CAC',dr.cac>0?'$'+fmt(Math.round(dr.cac)):'N/A',dr.ltvCac>0?'LTV:CAC='+dr.ltvCac.toFixed(1)+'x':'Marketing ma\'lumot yo\'q','w')+kc('Logo Churn',Math.round(dr.logoChurnRate*10)/10+'%/davr','Ketish ulushi',dr.logoChurnRate<=5?'g':dr.logoChurnRate<=15?'a':'r')+'</div><div class="sc2" style="margin-top:16px"><div class="sbox"><div class="sbox-t">LTV hisob-kitobi</div><p style="color:rgba(255,255,255,.7);font-size:13px;margin-top:8px;line-height:1.8">LTV = ARPA / Oylik Churn Rate<br>= $'+fmt(arpa)+' / '+Math.round(dr.logoChurnRate*100)/100+'%<br>= <b style="color:#60a5fa;font-size:18px">$'+fk(dr.ltv)+'</b></p></div><div class="sbox"><div class="sbox-t">Sog\'liqli biznes mezonlari</div><p style="color:rgba(255,255,255,.7);font-size:12px;line-height:1.9">LTV:CAC \u2265 3x \u2014 Barqaror<br>LTV:CAC \u2265 5x \u2014 A\'lo<br>Quick Ratio \u2265 4x \u2014 Yuqori o\'sish<br>NRR \u2265 120% \u2014 Kengayish hududi</p></div></div></div>');

  // Slide 7: Cash & Collections
  var cb=dr.cashInBreak;
  sls.push('<div class="sl"><div class="sl-label">Kassa & Inkasso</div><div class="sl-title"><span>$'+fk(dr.cashIn)+'</span> Kassa Tushumi</div>'+(an.s6?'<div class="sl-sub">'+xe(an.s6)+'</div>':'')+'<div class="sc2"><div class="sbox"><div class="sbox-t">To\'lov turlari</div><table class="stbl"><tbody><tr><td>Naqd</td><td class="tr font-mono">$'+fmt(cb.naqd)+'</td><td class="tr">'+Math.round(dr.cashIn?cb.naqd/dr.cashIn*100:0)+'%</td></tr><tr><td>Karta</td><td class="tr font-mono">$'+fmt(cb.karta)+'</td><td class="tr">'+Math.round(dr.cashIn?cb.karta/dr.cashIn*100:0)+'%</td></tr><tr><td>Bank</td><td class="tr font-mono">$'+fmt(cb.bank)+'</td><td class="tr">'+Math.round(dr.cashIn?cb.bank/dr.cashIn*100:0)+'%</td></tr></tbody></table><div style="margin-top:14px"><div class="sbox-t">DSO</div><div style="font-size:40px;font-weight:800;font-family:monospace;color:'+(dr.dso<=45?'#34d399':dr.dso<=90?'#fbbf24':'#f87171')+'">'+Math.round(dr.dso)+' kun</div></div></div><div class="sbox"><div class="sbox-t">AR Aging (qarzdorlik yoshi)</div><table class="stbl"><tbody>'+ar.map(function(b){return'<tr><td>'+xe(b.label)+'</td><td class="tr r font-mono">$'+fmt(b.total)+'</td><td class="tr" style="color:rgba(255,255,255,.5)">'+b.clients.length+' ta</td></tr>'}).join('')+'<tr><td><b>Jami qarz</b></td><td class="tr r font-mono font-bold"><b>$'+fmt(totalDebt)+'</b></td><td></td></tr></tbody></table></div></div></div>');

  // Slide 8: Regions & Managers
  var totRP=rp.reduce(function(s,r){return s+r.mrr},0)||1;
  sls.push('<div class="sl"><div class="sl-label">Hudud & Menejerlar</div><div class="sl-title">Kuch <span>Manbalari</span></div>'+(an.s7?'<div class="sl-sub">'+xe(an.s7)+'</div>':'')+'<div class="sc2"><div class="sbox"><div class="sbox-t">Hududlar (MRR)</div><table class="stbl"><thead><tr><th>Hudud</th><th class="tr">MRR</th><th class="tr">%</th></tr></thead><tbody>'+rp.slice(0,7).map(function(r){return'<tr><td>'+xe(r.name)+'</td><td class="tr b font-mono">$'+fmt(r.mrr)+'</td><td class="tr">'+Math.round(r.mrr/totRP*100)+'%</td></tr>'}).join('')+'</tbody></table></div><div class="sbox"><div class="sbox-t">Menejerlar (Netto MRR)</div><table class="stbl"><thead><tr><th>Menejer</th><th class="tr">Yangi</th><th class="tr">Netto MRR</th></tr></thead><tbody>'+mb.slice(0,7).map(function(m){var n=m.netMRR||0;return'<tr><td>'+xe(m.name)+'</td><td class="tr g">'+( m.newCount||0)+'</td><td class="tr '+(n>=0?'g':'r')+' font-mono font-bold">'+(n>=0?'+':'\u2212')+'$'+fmt(Math.abs(Math.round(n)))+'</td></tr>'}).join('')+'</tbody></table></div></div></div>');

  // Slide 9: Health
  var htot=ch.length||1;
  sls.push('<div class="sl"><div class="sl-label">Portfolio Salomatligi</div><div class="sl-title"><span class="g">'+healthy+'</span> sog\'lom \xb7 <span class="a">'+warning+'</span> xavf \xb7 <span class="r">'+critical+'</span> kritik</div>'+(an.s8?'<div class="sl-sub">'+xe(an.s8)+'</div>':'')+'<div class="sc2"><div class="sbox"><div class="sbox-t">Kritik mijozlar</div><table class="stbl"><thead><tr><th>Mijoz</th><th class="tr">Score</th><th class="tr">Qarz</th></tr></thead><tbody>'+( ch.filter(function(c){return c.status==='critical'}).length?ch.filter(function(c){return c.status==='critical'}).slice(0,8).map(function(c){return'<tr><td>'+xe(c.name)+'</td><td class="tr r">'+c.score+'</td><td class="tr r font-mono">$'+fmt(c.debt)+'</td></tr>'}).join(''):'<tr><td colspan="3" class="text-center text-[rgba(255,255,255,0.3)] p-5">Kritik mijoz yo\'q \u2713</td></tr>')+'</tbody></table></div><div class="sbox"><div class="sbox-t">Taqsimot</div><div style="display:flex;flex-direction:column;gap:14px;margin-top:10px">'+[{l:'Sog\'lom',n:healthy,c:'#34d399'},{l:'Xavf',n:warning,c:'#fbbf24'},{l:'Kritik',n:critical,c:'#f87171'}].map(function(x){return'<div><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:'+x.c+'">'+x.l+'</span><span class="font-mono">'+x.n+' ('+Math.round(x.n/htot*100)+'%)</span></div><div style="height:8px;background:rgba(255,255,255,.1);border-radius:4px"><div style="width:'+Math.round(x.n/htot*100)+'%;height:100%;background:'+x.c+';border-radius:4px"></div></div></div>'}).join('')+'</div></div></div></div>');

  // Slide 10: Forecast (growth-based)
  var gfc=calcGrowthForecast();
  sls.push('<div class="sl"><div class="sl-label">MRR Prognoz</div><div class="sl-title">6 Oylik <span>Ko\'rinish</span></div>'+(an.s9?'<div class="sl-sub">'+xe(an.s9)+'</div>':'')+'<div class="sc2-full"><table class="stbl"><thead><tr><th>Oy</th><th class="tr">Prognoz MRR</th><th class="tr">Mijozlar</th><th class="tr">Yangi/oy</th><th class="tr">Churn/oy</th></tr></thead><tbody>'+gfc.map(function(m){return'<tr><td><b>'+xe(m.label)+'</b></td><td class="tr b font-mono font-bold">$'+fmt(m.mrr)+'</td><td class="tr">'+m.clients+'</td><td class="tr g">+'+m.newPerMonth+'</td><td class="tr r">\u2212'+m.churnPerMonth+'</td></tr>'}).join('')+'</tbody></table><p style="color:rgba(255,255,255,.5);font-size:12px;margin-top:12px">Oxirgi 12 oy yangi mijoz va churn nisbatlariga asoslangan prognoz.</p></div></div>');

  // Slide 11: Closing
  sls.push('<div class="sl sl-cover"><div class="flex-1 flex flex-col justify-center"><div class="sl-label">Xulosa</div><div class="sl-title">Savollar va<br><span>Muhokama</span></div>'+(an.s10?'<div class="sl-sub" style="margin-top:20px">'+xe(an.s10)+'</div>':'')+'</div></div>');

  var scss='*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;font-family:"Segoe UI",system-ui,sans-serif;background:#060e1f}.deck{width:100vw;height:100vh;position:relative}.sl{position:absolute;inset:0;display:none;flex-direction:column;padding:52px 80px 88px;background:linear-gradient(145deg,#060e1f 0%,#0d1b35 100%)}.sl.on{display:flex}.sl-cover{background:linear-gradient(145deg,#0f2a6b 0%,#1746a2 55%,#0a3d55 100%)}.sl-label{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.45);margin-bottom:12px}.sl-title{font-size:40px;font-weight:800;color:#fff;line-height:1.1;margin-bottom:14px}.sl-title span{color:#60a5fa}.sl-sub{font-size:15px;color:rgba(255,255,255,.65);line-height:1.5;max-width:750px}.skg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}.skc{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:18px 20px}.skl{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.45);margin-bottom:8px}.skv{font-size:28px;font-weight:800;font-family:monospace;color:#fff;line-height:1}.skd{font-size:12px;margin-top:5px}.sc2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;flex:1}.sc2-full{margin-top:16px;flex:1}.sbox{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px 18px}.sbox-t{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.4);margin-bottom:10px}.stbl{width:100%;border-collapse:collapse;font-size:13px}.stbl th{padding:7px 10px;text-align:left;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.4px}.stbl td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.05);color:rgba(255,255,255,.85)}.tr{text-align:right}.g{color:#34d399}.r{color:#f87171}.a{color:#fbbf24}.b{color:#60a5fa}.w{color:rgba(255,255,255,.85)}.bars{display:flex;align-items:flex-end;gap:3px;height:72px;margin-top:8px}.bar-item{display:flex;flex-direction:column;align-items:center;flex:1;gap:3px}.bar-fill{width:100%;border-radius:2px 2px 0 0}.bar-lbl{font-size:7px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden}.nav{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;z-index:100;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:40px;padding:7px 14px}.nav button{background:none;border:none;color:rgba(255,255,255,.7);font-size:13px;cursor:pointer;padding:4px 10px;border-radius:6px;transition:.15s}.nav button:hover{background:rgba(255,255,255,.1);color:#fff}.cnt{color:rgba(255,255,255,.4);font-size:12px;min-width:52px;text-align:center}.pbar{position:fixed;top:0;left:0;height:2px;background:#3b82f6;transition:width .3s;z-index:200}@media print{.nav,.pbar{display:none!important}.sl{display:flex!important;page-break-after:always;position:relative!important}}';

  var navJs='var cur=0,sls=document.querySelectorAll(".sl"),tot=sls.length;function go(i){sls[cur].classList.remove("on");cur=Math.max(0,Math.min(i,tot-1));sls[cur].classList.add("on");document.getElementById("_ct").textContent=(cur+1)+" / "+tot;document.getElementById("_pb").style.width=((cur+1)/tot*100)+"%"}function nx(){go(cur+1)}function pv(){go(cur-1)}document.addEventListener("keydown",function(e){if(e.key==="ArrowRight"||e.key==="ArrowDown"||e.key===" "){e.preventDefault();nx()}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();pv()}if(e.key==="Escape")go(0)});document.getElementById("_pb").style.width=(1/tot*100)+"%";';

  var slideHtml='<!DOCTYPE html><html lang="uz"><head><meta charset="utf-8"><title>UYSOT Taqdimot \u2014 '+xe(periodLabel)+'<\/title><style>'+scss+'<\/style><\/head><body><div class="pbar" id="_pb"><\/div><div class="deck">'+sls.join('\n')+'<\/div><nav class="nav"><button onclick="pv()">&#8592;<\/button><span class="cnt" id="_ct">1 \/ '+sls.length+'<\/span><button onclick="nx()">&#8594;<\/button><button onclick="window.print()" title="Chop etish">\uD83D\uDDB6<\/button><\/nav><script>'+navJs+'<\/scr'+'ipt><\/body><\/html>';

  var w=window.open('','_blank');
  if(!w){showToast('Popup bloklangan \u2014 brauzer ruxsat bering','error');return}
  w.document.write(slideHtml);w.document.close();w.focus();
  showToast('Taqdimot tayyor! \u2190\u2192 navigatsiya',  'success');
}

// === EXPORTS ===
window.exportContracts=function(){
  if(!S.rows.length){showToast("Ma'lumot yo'q",'error');return}
  const pm=calcPayments();
  const rows=S.rows.map(r=>{
    const p=pm[r.Client+'|'+r.raqami]||{};
    return{
      'Raqami':r.raqami||'',
      'Mijoz':r.Client||'',
      'Firma':r['Firma nomi']||'',
      'Hudud':r.Hudud||'',
      'Menejer':r.Manager||'',
      'Boshlanish':r.sanasi||'',
      'Tugash':r['amal qilishi']||'',
      'Oylik USD':Math.round(r._mUSD||0),
      'Jami USD':Math.round(r._sUSD||0),
      "To'langan":Math.round(p.total||0),
      'Qarz':Math.round((r._sUSD||0)-(p.total||0)),
      'Status':r.status||''
    }
  });
  downloadCSV(rows,'Shartnomalar')
};

window.exportDebts=function(){
  const now=S.debtDate||new Date();
  const dt=calcDebtTable(now);
  const rows=dt.map(r=>({
    'Mijoz':r.name,
    'Shartnoma qoldig\'i':Math.round(r.qoldiq||0),
    'Oy oxiri qarzi':Math.round(r.oyQarz||0),
    'Kelishuv qarzi':Math.round(r.kelQarz||0)
  }));
  downloadCSV(rows,'Qarzdorlik')
};

window.exportARaging=function(){
  const aging=calcARaging();
  const rows=aging.flatMap(b=>b.clients.map(c=>({
    'Mijoz':c.name,
    'Muddat':b.label,
    'Oy qarzi':Math.round(c.qarz),
    'Kelishuv qarzi':Math.round(c.kelQarz||0),
    'Kechikish (kun)':c.days<999?c.days:'',
    "Oxirgi to'lov":c.lastPayDate
  })));
  downloadCSV(rows,'AR_Aging')
};

window.exportCollectionRate=function(){
  const cr=calcCollectionRate();
  const rows=cr.map(c=>({
    'Mijoz':c.name,
    'Kutilgan':c.expected,
    "To'langan":c.paid,
    'Farq':c.delta,
    'Undiruv %':c.rate
  }));
  downloadCSV(rows,'Inkasso')
};

window.exportAudit=function(){
  const audit=calcDataAudit();
  const rows=audit.map(a=>({
    'Mijoz':a.client,
    'Shartnoma':a.raqami,
    'Xatolik turi':a.type,
    'Tafsilot':a.detail
  }));
  downloadCSV(rows,'Tahlil')
};

window.exportMrrForecast=function(){
  const fc=calcMrrForecast();
  const rows=fc.map(m=>({
    'Oy':m.label,
    'MRR ($)':m.mrr,
    'Mijozlar':m.clients,
    'Xavf MRR':m.expiringMRR,
    'Tugaydiganlar soni':m.expiringCount
  }));
  downloadCSV(rows,'MRR_Prognoz')
};

// === DEBUG ===
function debugMRRcompare(){const dt=S.dashTo||new Date();const yr=dt.getFullYear(),m=dt.getMonth();const {all,qAll}=buildContracts();const snap=mrrOnDate(dt,all,qAll);const byClient1={};all.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd>0)byClient1[ct.client]=(byClient1[ct.client]||0)+ct.musd});qAll.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd)byClient1[ct.client]=(byClient1[ct.client]||0)+ct.musd});const d=mrrData(yr);const byClient2={};d.clients.forEach(c=>{if(c.monthly[m])byClient2[c.name]=c.monthly[m]});const allN=new Set([...Object.keys(byClient1),...Object.keys(byClient2)]);const diffs=[];allN.forEach(n=>{const v1=Math.round(byClient1[n]||0),v2=Math.round(byClient2[n]||0);if(v1!==v2)diffs.push({name:n,dashboard:v1,jadval:v2,farq:v2-v1})});diffs.sort((a,b)=>Math.abs(b.farq)-Math.abs(a.farq));console.table(diffs);return diffs}
window.debugMRR=debugMRRcompare;

// === INIT ===
(function(){
  if(loadCache()){
    const saved=localStorage.getItem('uysot_config');
    if(saved){try{S.config=JSON.parse(saved)}catch(e){}}
    const ts=JSON.parse(localStorage.getItem('uysot_data')||'{}').ts;
    const ago=ts?Math.round((Date.now()-ts)/60000):0;
    const lbl=ago<60?ago+' daq. oldin':ago<1440?Math.round(ago/60)+' soat oldin':Math.round(ago/1440)+' kun oldin';
    document.getElementById('upd').textContent=lbl;
    render();return;
  }
  const saved=localStorage.getItem('uysot_config');
  if(saved){try{const c=JSON.parse(saved);S.config=c;loadFromConfig(c);return}catch(e){}}
  showWelcome();
})();

// Init nav after DOM ready
initNav();
