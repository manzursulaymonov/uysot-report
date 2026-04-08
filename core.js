/* ============================================================
   UYSOT — Core: State, Utils, Data, Calculations
   ============================================================ */

// === STATE ===
let _sc=localStorage.getItem('uysot_cards'); _sc=_sc?JSON.parse(_sc):{mrr:{s:1,arr:1,g:1},nrr:{s:1,n:1,c:1,e:1},cust:{s:1,g:1,c:1},arpa:{s:1,g:1},cac:{s:1,d:1},cash:{s:1},dso:{s:1},conc:{s:1},ltv:{s:1},qr:{s:1},lc:{s:1}};
// Migrate: backfill any missing card keys for existing users
const _defs={cash:{s:1},dso:{s:1},conc:{s:1},ltv:{s:1},qr:{s:1},lc:{s:1},tRenew:{s:1},tRegion:{s:1},tMgr:{s:1},tHealth:{s:1},cMrrGr:{s:1},cNetMov:{s:1}};Object.keys(_defs).forEach(k=>{if(!_sc[k])_sc[k]=_defs[k]});
const S={rows:[],qRows:[],payRows:[],y2024Rows:[],perevodRows:[],mktRows:[],mgrRows:[],marketingCosts:JSON.parse(localStorage.getItem('uysot_mkt')||'{}'),config:null,sec:'dashboard',cP:0,cN:40,cQ:'',cS:'',cM:'',cR:'',mP:0,mN:40,mQ:'',clP:0,clN:40,clQ:'',mrrP:0,mrrQ:'',mrrYear:2026,mrrView:'main',clView:'umumiy',mgrView:'umumiy',topView:'metrka',debtView:'umumiy',cView:'royyat',molView:'aging',dashPre:'y',dashFrom:new Date(2026,0,1),dashTo:new Date(),mrrCols:{mgr:true,hudud:false,mrr:false,deal:false,end:false},mrrSet:false,mrrFs:false,debtDate:new Date(),debtQ:'',debtFs:false,arAgingFilter:null,apiKey:localStorage.getItem('uysot_apikey')||'',geminiKey:localStorage.getItem('uysot_geminikey')||'',aiProvider:localStorage.getItem('uysot_ai')||'none',repSec:null,dashCards:_sc,_cache:{}};

// === THEME ===
const EO_STYLES=[
  {id:'default',name:'Standart'},
  {id:'obsidian',name:'Executive Obsidian'}
];
function applyThemeStyle(styleId){
  const html=document.documentElement;
  if(styleId&&styleId!=='default')html.setAttribute('data-style',styleId);
  else html.removeAttribute('data-style');
  localStorage.setItem('uysot_style',styleId||'default');
}
function initTheme(){
  const savedMode=localStorage.getItem('uysot_theme');
  const savedStyle=localStorage.getItem('uysot_style');
  if(savedMode==='dark')document.documentElement.setAttribute('data-theme','dark');
  else if(!savedMode&&window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark');
  if(savedStyle&&savedStyle!=='default')document.documentElement.setAttribute('data-style',savedStyle);
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':'dark';
  if(next==='dark')document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('uysot_theme',next);
  render();
}
initTheme();

// === GLOBAL KEYBOARD HANDLER ===
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){const ovs=document.querySelectorAll('.overlay');if(ovs.length)ovs[ovs.length-1].remove()}
});

// === MOBILE SIDEBAR ===
function toggleSidebar(){
  const sb=document.querySelector('.sidebar');
  const ov=document.querySelector('.sidebar-overlay');
  const hb=document.querySelector('.hamburger');
  sb.classList.toggle('open');ov.classList.toggle('active');hb.classList.toggle('active');
}
function closeSidebar(){
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
  document.querySelector('.hamburger')?.classList.remove('active');
}

// === TOAST ===
function showToast(msg,type='info'){
  let c=document.querySelector('.toast-container');
  if(!c){c=document.createElement('div');c.className='toast-container';document.body.appendChild(c)}
  while(c.children.length>=3)c.firstChild.remove();
  const t=document.createElement('div');t.className='toast toast-'+type;
  const icons={success:'✓',error:'✕',info:'ℹ'};
  t.innerHTML='<span class="text-sm font-bold">'+icons[type]+'</span> '+msg;
  c.appendChild(t);setTimeout(()=>t.remove(),4000);
}

// === DEBOUNCE ===
function debounce(fn,ms=250){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}}

// === MEMOIZATION ===
function clearCache(){S._cache={}}
function cached(key,fn){
  if(S._cache[key])return S._cache[key];
  const r=fn();S._cache[key]=r;return r;
}

// === UTILS ===
function pn(s){if(typeof s==='number')return s;return parseFloat((s||'').toString().replace(/[$\s]/g,'').replace(/,/g,''))||0}
function fmt(n){return n?Math.round(n).toLocaleString('en-US').replace(/,/g,' '):'—'}
function fk(n){const a=Math.abs(n);if(a>=1e6)return(n/1e6).toFixed(1).replace(/\.0$/,'')+'M';if(a>=1000)return(n/1000).toFixed(1).replace(/\.0$/,'')+'K';return Math.round(n)}
function fmtD(d){const dd=d.getDate(),mm=d.getMonth()+1,yy=d.getFullYear()%100;return(dd<10?'0':'')+dd+'.'+(mm<10?'0':'')+mm+'.'+yy}
function snapEl(el,btn){
  if(!el||typeof html2canvas==='undefined')return showToast("html2canvas yuklanmagan",'error');
  const orig=btn?.innerHTML;if(btn)btn.innerHTML='⏳';
  html2canvas(el,{backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#fff',scale:2,useCORS:true}).then(c=>{
    c.toBlob(blob=>{
      if(!blob)return showToast("Rasm yaratilmadi",'error');
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{
        showToast('Nusxalandi! Ctrl+V bilan joylashtiring','success');if(btn)btn.innerHTML=orig;
      }).catch(()=>{
        // Fallback: download
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='shartnomalar.png';a.click();URL.revokeObjectURL(a.href);
        showToast('Yuklandi (clipboard ruxsat bermadi)','info');if(btn)btn.innerHTML=orig;
      });
    },'image/png');
  }).catch(e=>{showToast('Xatolik: '+e.message,'error');if(btn)btn.innerHTML=orig});
}
function pd(s){if(!s)return null;let p=s.split('.');if(p.length===3)return new Date(+p[2],+p[1]-1,+p[0]);p=s.split('-');if(p.length===3)return new Date(+p[2],+p[1]-1,+p[0]);return null}

// === PARSE ===
function parse(t){const r=Papa.parse(t,{skipEmptyLines:true});const h=r.data[0];return r.data.slice(1).map(row=>{const o={};h.forEach((k,i)=>o[k.trim()]=(row[i]||'').trim());o._mUSD=pn(o['Oylik USD']);o._mUZS=pn(o['oylik UZS']);o._sUSD=pn(o['sum USD']);o._sUZS=pn(o['sum UZS']);o._tUSD=pn(o['Tadbiq USD']);o._tUZS=pn(o['Tadbiq UZS']);o._dur=parseFloat(o['muddati (oy)'])||0;o._pre=parseInt(o['Prepayment'])||1;return o}).filter(r=>r.Client||r['Firma nomi'])}
function parseRaw(t){const r=Papa.parse(t,{skipEmptyLines:true});const h=r.data[0];return r.data.slice(1).map(row=>{const o={};h.forEach((k,i)=>o[k.trim()]=(row[i]||'').trim());return o})}
function mgrDisplayName(name){
  if(!name)return 'Tayinlanmagan';
  const n=name.trim();
  if(!S.mgrRows.length)return n;
  const row=S.mgrRows.find(r=>(r.Menejer||'').trim().toLowerCase()===n.toLowerCase());
  if(row&&(row.Status||'').trim().toLowerCase()==='ketgan')return 'Boshqalar';
  return n;
}
function parseMkt(t){
  const r=Papa.parse(t,{skipEmptyLines:true});
  const h=r.data[0]||[];
  const rows = r.data.slice(1).map(row=>{
    const o={}; h.forEach((k,i)=>o[k.trim()]=(row[i]||'').trim());
    const y=parseInt(o['Yil']||o['Year']||row[0]), m=parseInt(o['Oy']||o['Month']||row[1]), val=pn(o['Summa']||o['Amount']||row[2]);
    if(!isNaN(y)&&!isNaN(m)){ S.marketingCosts[y+'-'+m]=val; }
    return o;
  });
  localStorage.setItem('uysot_mkt', JSON.stringify(S.marketingCosts));
  return rows;
}

// === STATUS ===
function sc(s){if(!s)return'?';const l=s.toLowerCase();if(l.includes('active')||l==='yangi')return'A';if(l.includes('bajarildi'))return'D';if(l.includes('muammo')||l.includes('katta'))return'P';if(l.includes('eski qarz')||l.includes('tolov qilmagan'))return'Q';if(l.includes('ortiqcha'))return'O';if(l.includes('tugatildi')||l.includes('bekor'))return'X';return'B'}
function sb(s){const c=sc(s);const m={A:'b-green',D:'b-blue',P:'b-red',Q:'b-amber',O:'b-purple',X:'b-gray',B:'b-gray','?':'b-gray'};return`<span class="badge ${m[c]}">${s||'—'}</span>`}
function activeR(){return S.rows.filter(r=>sc(r.status)==='A')}
function uq(key){return[...new Set(S.rows.map(r=>r[key]).filter(Boolean))].sort()}

// === PAYMENTS ===
function calcPayments(){
  return cached('payments',()=>{
    const pm={};
    S.payRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].pay+=pn(r.USD)});
    S.y2024Rows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].y24+=pn(r.USD)});
    S.perevodRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].per+=pn(r['Tolov(usd)'])});
    Object.values(pm).forEach(v=>v.total=v.pay+v.y24+v.per);
    return pm;
  });
}
function calcPaymentsUZS(){
  return cached('paymentsUZS',()=>{
    const pm={};
    S.payRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].pay+=pn(r.UZS||r.summasi||'0')});
    S.y2024Rows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].y24+=pn(r.UZS||'0')});
    S.perevodRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].per+=pn(r['Tolov']||'0')});
    Object.values(pm).forEach(v=>v.total=v.pay+v.y24+v.per);
    return pm;
  });
}
function calcClientPayments(){
  return cached('clientPay',()=>{
    const pm=calcPayments();const cp={};
    Object.values(pm).forEach(v=>{cp[v.client]=(cp[v.client]||0)+v.total});
    S.rows.forEach(r=>{if(r.Client&&r._tUSD)cp[r.Client]=(cp[r.Client]||0)-r._tUSD});
    S.qRows.forEach(r=>{const t=pn(r['Tadbiq USD']);if(r.Client&&t)cp[r.Client]=(cp[r.Client]||0)-t});
    return cp;
  });
}

// === CONTRACTS ===
function buildContracts(){
  return cached('contracts',()=>{
    const all=[],qAll=[];
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);all.push({client:r.Client,musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',dur:r._dur||0,tUSD:r._tUSD||0,sUSD:r._sUSD||0,izoh:r.izoh||'',raqami:r.raqami||''})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const musd=pn(r['Oylik USD']);if(!musd)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);qAll.push({client:r.Client,musd,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',dur:0,tUSD:0,sUSD:0,izoh:'',raqami:''})});
    // Mijoz hududini faqat birinchi shartnomadan olish
    const _firstH={};
    all.forEach(c=>{if(!_firstH[c.client]||c.st<_firstH[c.client].st)_firstH[c.client]={st:c.st,hudud:c.hudud}});
    all.forEach(c=>{c.hudud=(_firstH[c.client]||{}).hudud||''});
    qAll.forEach(c=>{c.hudud=(_firstH[c.client]||{}).hudud||c.hudud});
    return{all,qAll};
  });
}

// === MRR ON DATE ===
function mrrOnDate(dt,allCts,qCts){
  let total=0;const active=new Set();const contracts=[];
  allCts.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd>0){total+=ct.musd;active.add(ct.client);contracts.push(ct)}});
  qCts.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd!==0){total+=ct.musd;if(ct.musd>0)active.add(ct.client);contracts.push(ct)}});
  return{total:Math.round(total),active,contracts};
}

// === DEBT TABLE ===
// === LAST PAYMENTS ===
function calcLastPayments(){
  return cached('lastPayments',()=>{
    const lp={};
    const proc=(rows,dateK,origSK,usdSK,typeK,kassaK,valK,defType)=>{
      if(!rows)return;
      rows.forEach(r=>{
        const c=r.Client?.trim();if(!c)return;
        const dStr=r[dateK];if(!dStr)return;
        const d=pd(dStr);if(!d)return;
        const origSum=(r[origSK]||'0').trim();
        const usdSum=pn(r[usdSK]||'0');
        const type=(r[typeK]||defType||'').toLowerCase();
        const kassa=r[kassaK]||'';
        const val=(r[valK]||(type==='perevod'?'UZS':'USD')).toUpperCase();
        if(!lp[c]||d>lp[c].date){
          lp[c]={date:d,dateStr:dStr,allOnDate:[]};
        }
        if(lp[c]&&d.getTime()===lp[c].date.getTime()){
          lp[c].allOnDate.push({origSum,usdSum,type,kassa,val});
        }
      });
    };
    proc(S.payRows,'sanasi','summasi','USD','tolov turi','kassa','Valyuta','');
    proc(S.perevodRows,'Sanasi','Tolov','Tolov(usd)','izoh','','','perevod');
    // For y24 we just fallback to generic sums if needed
    return lp;
  });
}

function calcDebtTable(reportDate){
  if(!reportDate)reportDate=new Date();
  const repMonthEnd=new Date(reportDate.getFullYear(),reportDate.getMonth()+1,0);
  const repYear=reportDate.getFullYear();
  const repMonth=reportDate.getMonth();
  // Use same cumExp as MRR table
  const cumExp=calcCumExpected(repYear);
  // Use same payment totals as MRR table (just totalPayments by client)
  const pm=calcPayments();
  const clPay={};
  Object.values(pm).forEach(v=>{clPay[v.client]=(clPay[v.client]||0)+v.total});
  const clients={};
  S.rows.forEach(r=>{
    if(!r.Client||!r.sanasi)return;
    const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;
    const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);
    const c=r.Client;
    if(!clients[c])clients[c]={name:c,contracts:[],totalSum:0,firma:r['Firma nomi']||''};
    clients[c].totalSum+=r._sUSD;
    if(r._mUSD>0||r._tUSD>0)clients[c].contracts.push({musd:r._mUSD,tUSD:r._tUSD,st,endD,pre:r._pre||1,isMain:true});
  });
  S.qRows.forEach(r=>{
    if(!r.Client||!r.sanasi)return;
    const musd=pn(r['Oylik USD']),tUSD=pn(r['Tadbiq USD']);
    const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;
    const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);
    const c=r.Client;
    if(!clients[c])clients[c]={name:c,contracts:[],totalSum:0,firma:''};
    if(musd>0){
      const sheetSum=pn(r['sum USD'])||0;
      let actualSum=tUSD||0;
      if(sheetSum>0){
        // Use sheet total directly to avoid proration rounding errors
        actualSum+=sheetSum;
      } else {
        let d=new Date(st.getFullYear(),st.getMonth(),1);
        const fmE=new Date(st.getFullYear(),st.getMonth()+1,0);
        const fmDays=Math.round((fmE-st)/864e5)+1;const on1st=st.getDate()===1;
        const firstMP=on1st?musd:Math.round(musd*fmDays/fmE.getDate());
        while(d<=endD){
          const mE=new Date(d.getFullYear(),d.getMonth()+1,0);
          if(st>mE||endD<d){d.setMonth(d.getMonth()+1);continue}
          const isF=(st.getFullYear()===d.getFullYear()&&st.getMonth()===d.getMonth());
          const isL=(endD.getFullYear()===d.getFullYear()&&endD.getMonth()===d.getMonth());
          if(isF&&isL){actualSum+=Math.round(musd*Math.round((endD-st)/864e5+1)/mE.getDate())}
          else if(isF){actualSum+=firstMP}
          else if(isL){const mS=new Date(d);actualSum+=Math.round(musd*Math.round((endD-mS)/864e5+1)/mE.getDate())}
          else{actualSum+=musd}
          d.setMonth(d.getMonth()+1);
        }
      }
      clients[c].totalSum+=actualSum;
      clients[c].contracts.push({musd,tUSD:tUSD||0,st,endD,pre:1,isMain:false});
    }
  });
  Object.values(clients).forEach(cl=>{
    const mainCts=cl.contracts.filter(c=>c.isMain&&c.musd>0);if(!mainCts.length)return;
    const anchor=mainCts.reduce((a,c)=>c.st<a.st?c:a,mainCts[0]);
    cl.contracts.filter(c=>!c.isMain).forEach(q=>{q.pre=anchor.pre});
  });
  const result=[];
  Object.values(clients).forEach(cl=>{
    const paid=clPay[cl.name]||0;const qoldiq=Math.round(cl.totalSum-paid);
    // oyQarz: use calcCumExpected (same as MRR table)
    const ce=cumExp[cl.name];
    const oyQarz=ce?Math.round(ce.cum[repMonth]-paid):Math.round(cl.totalSum-paid);
    const mainCts=cl.contracts.filter(c=>c.isMain&&c.musd>0);
    const anchor=mainCts.length?mainCts.reduce((a,c)=>c.st<a.st?c:a,mainCts[0]):cl.contracts.find(c=>c.musd>0);
    const anchorPre=anchor?(anchor.pre||1):1;
    let kelQarz;
    if(anchorPre<=1){
      // Prepayment 1 oy: kelQarz = oyQarz (bir xil logika)
      kelQarz=oyQarz;
    } else {
      // Prepayment 2+ oy: billing-block logikasi
      let kelExp=0;cl.contracts.forEach(ct=>{kelExp+=ct.tUSD});
      const aM0=anchor.st.getFullYear()*12+anchor.st.getMonth();
      const rM=repMonthEnd.getFullYear()*12+repMonthEnd.getMonth();
      const blocksDue=Math.floor(Math.max(0,rM-aM0)/anchorPre)+1;
      const paidThroughM=aM0+blocksDue*anchorPre-1;
      cl.contracts.forEach(ct=>{
        if(ct.musd<=0||ct.st>repMonthEnd)return;
        if(ct.isMain){
          const ctOn1st=ct.st.getDate()===1;
          const ctCalM=(ct.endD.getFullYear()-ct.st.getFullYear())*12+(ct.endD.getMonth()-ct.st.getMonth())+1;
          const ctEffM=ctOn1st?ctCalM:Math.max(ctCalM-1,1);
          const ctM0=ct.st.getFullYear()*12+ct.st.getMonth();const ctM1=ct.endD.getFullYear()*12+ct.endD.getMonth();
          const dueCalM=Math.max(0,Math.min(ctM1,paidThroughM)-ctM0+1);
          const dueEffM=dueCalM>=ctCalM?ctEffM:Math.min(dueCalM,ctEffM);
          kelExp+=ct.musd*dueEffM;
        }else{
          const ctM0=ct.st.getFullYear()*12+ct.st.getMonth();const ctM1=ct.endD.getFullYear()*12+ct.endD.getMonth();
          const dueEnd=Math.min(ctM1,paidThroughM);
          for(let mi=ctM0;mi<=dueEnd;mi++){
            const y=Math.floor(mi/12),m=mi%12;const mS=new Date(y,m,1),mE=new Date(y,m+1,0);
            const isF=(mi===ctM0&&ct.st.getDate()!==1);const isL=(mi===ctM1);
            if(isF&&isL){kelExp+=Math.round(ct.musd*Math.round((ct.endD-ct.st)/864e5+1)/mE.getDate())}
            else if(isF){kelExp+=Math.round(ct.musd*Math.round((mE-ct.st)/864e5+1)/mE.getDate())}
            else if(isL){kelExp+=Math.round(ct.musd*Math.round((ct.endD-mS)/864e5+1)/mE.getDate())}
            else{kelExp+=ct.musd}
          }
        }
      });
      kelQarz=Math.round(kelExp-paid);
    }
    const lastP=calcLastPayments();const lp=lastP[cl.name]||null;
    const payDay=anchor?anchor.st.getDate():null;
    if(qoldiq>1||oyQarz>1||kelQarz>1)result.push({name:cl.name,firma:cl.firma,qoldiq,oyQarz,kelQarz,totalSum:Math.round(cl.totalSum),paid:Math.round(paid),lastPay:lp,payDay});
  });
  result.sort((a,b)=>b.kelQarz-a.kelQarz);return result;
}

// === DASHBOARD PRESETS ===
function dateStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function toDate(s){const p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}

// === SPOTLIGHT CLIENT SEARCH ===
function openSpotlight(initialChar){
  if(document.querySelector('.spot-overlay'))return;
  const {all,qAll}=buildContracts();
  const now=new Date();
  const snap=mrrOnDate(now,all,qAll);
  // Build unique client list with metadata
  const cMap={};
  S.rows.forEach(r=>{
    if(!r.Client)return;
    const n=r.Client.trim();
    if(!cMap[n])cMap[n]={name:n,firma:r['Firma nomi']||'',mgr:r.Manager||'',hudud:r.Hudud||'',mrr:0,status:r.status||''};
  });
  snap.contracts.forEach(c=>{if(cMap[c.client])cMap[c.client].mrr+=c.musd});
  const dt=calcDebtTable(now);
  const debtMap={};dt.forEach(d=>{if(d.oyQarz>0)debtMap[d.name]=d.oyQarz});
  const clients=Object.values(cMap).sort((a,b)=>b.mrr-a.mrr);
  let idx=-1;

  const o=document.createElement('div');o.className='spot-overlay';
  o.innerHTML=`<div class="spot-box">
    <div class="spot-head">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input class="spot-input" placeholder="Search clients..." autocomplete="off" spellcheck="false">
      <kbd>ESC</kbd>
    </div>
    <div class="spot-list"></div>
    <div class="spot-foot">
      <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span><kbd>Enter</kbd> open</span>
      <span><kbd>Esc</kbd> close</span>
    </div>
  </div>`;

  const inp=o.querySelector('.spot-input');
  const list=o.querySelector('.spot-list');

  function renderList(q){
    const query=(q||'').toLowerCase();
    let filtered=clients;
    if(query)filtered=clients.filter(c=>c.name.toLowerCase().includes(query)||c.firma.toLowerCase().includes(query)||(c.mgr||'').toLowerCase().includes(query)||(c.hudud||'').toLowerCase().includes(query));
    filtered=filtered.slice(0,30);
    idx=filtered.length?0:-1;
    const colors=['#1746a2','#117a52','#6941b8','#0e7c7b','#a36207','#c42b1c','#d4537e','#854f0b'];
    list.innerHTML=filtered.map((c,i)=>{
      const ini=c.name.charAt(0).toUpperCase();
      const col=colors[ini.charCodeAt(0)%colors.length];
      const debt=debtMap[c.name];
      const mrrTag=c.mrr>0?`<span class="spot-tag tag-mrr">${fk(c.mrr)} $/mo</span>`:'<span class="spot-tag" style="opacity:.3">—</span>';
      const debtTag=debt?`<span class="spot-tag tag-debt">${fk(debt)}</span>`:(c.mrr>0?`<span class="spot-tag tag-ok">OK</span>`:'');
      return`<div class="spot-item${i===0?' spot-active':''}" data-idx="${i}" data-name="${c.name.replace(/"/g,'&quot;')}">
        <div class="spot-ava" style="background:${col}">${ini}</div>
        <div class="spot-col1">
          <div class="spot-name">${_hl(c.name,query)}</div>
          ${c.firma?'<div class="spot-firma">'+_hl(c.firma,query)+'</div>':''}
        </div>
        <div class="spot-col2">${c.hudud||''}</div>
        <div class="spot-col3">${mrrTag}</div>
        <div class="spot-col4">${debtTag}</div>
      </div>`;
    }).join('');
  }

  function _hl(text,q){
    if(!q)return text;
    const i=text.toLowerCase().indexOf(q);
    if(i===-1)return text;
    return text.slice(0,i)+'<mark style="background:var(--accent-bg);color:var(--accent);border-radius:2px;padding:0 1px">'+text.slice(i,i+q.length)+'</mark>'+text.slice(i+q.length);
  }

  function setActive(newIdx){
    const items=list.querySelectorAll('.spot-item');
    if(!items.length)return;
    if(newIdx<0)newIdx=items.length-1;
    if(newIdx>=items.length)newIdx=0;
    items.forEach(el=>el.classList.remove('spot-active'));
    items[newIdx].classList.add('spot-active');
    items[newIdx].scrollIntoView({block:'nearest'});
    idx=newIdx;
  }

  function openSelected(){
    const active=list.querySelector('.spot-active');
    if(!active)return;
    const name=active.dataset.name;
    o.remove();
    showClientCard(name);
  }

  inp.addEventListener('input',()=>renderList(inp.value));
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();setActive(idx+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();setActive(idx-1)}
    else if(e.key==='Enter'){e.preventDefault();openSelected()}
    else if(e.key==='Escape'){e.preventDefault();o.remove()}
  });
  o.addEventListener('click',e=>{
    if(e.target===o)o.remove();
    const item=e.target.closest('.spot-item');
    if(item){const name=item.dataset.name;o.remove();showClientCard(name)}
  });

  document.body.appendChild(o);
  renderList('');
  if(initialChar){inp.value=initialChar;renderList(initialChar)}
  inp.focus();
}

// Global keyboard listener — open spotlight on typing
(function(){
  document.addEventListener('keydown',function(e){
    // Skip if already in an input, textarea, overlay, or modal
    const t=e.target.tagName;
    if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT')return;
    if(document.querySelector('.overlay')||document.querySelector('.spot-overlay'))return;
    // Ctrl/Cmd+K shortcut
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openSpotlight();return}
    // Single printable character — open spotlight with that char
    if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&/[a-zA-Z0-9\u0400-\u04FF\u0600-\u06FF]/.test(e.key)){
      e.preventDefault();
      openSpotlight(e.key);
    }
  });
})();

// === AI METRIC RECOMMENDATION ===
async function aiRecommend(metricKey){
  // Auto-detect provider based on available keys
  if(S.aiProvider==='none'||(S.aiProvider==='gemini'&&!S.geminiKey)||(S.aiProvider==='claude'&&!S.apiKey)){
    if(S.geminiKey)S.aiProvider='gemini';
    else if(S.apiKey)S.aiProvider='claude';
    else S.aiProvider='none';
    localStorage.setItem('uysot_ai',S.aiProvider);
  }
  if(!S.apiKey&&!S.geminiKey){
    // Show inline message
    const overlays=document.querySelectorAll('.overlay .modal');
    const m=overlays.length?overlays[overlays.length-1]:null;
    if(m){let b=m.querySelector('.ai-rec-box');if(!b){b=document.createElement('div');b.className='ai-rec-box';const cb=m.querySelector('.btn-primary');if(cb)cb.parentNode.insertBefore(b,cb);else m.appendChild(b);}b.innerHTML='<div class="p-3 rounded-lg mt-2 text-[12px]" style="background:var(--amber-bg);border:1px solid var(--amber);color:var(--amber)">⚠️ AI sozlamalarida API kalit kiritilmagan. <span style="text-decoration:underline;cursor:pointer" onclick="document.querySelectorAll(\'.overlay\').forEach(o=>o.remove());showConfig()">Sozlamalarni ochish →</span></div>';}
    return;
  }
  // Close the metric info modal and open a dedicated AI modal
  const existingMetricOverlays=document.querySelectorAll('.overlay');
  // Keep client card overlay (first one), remove metric info (last one)
  if(existingMetricOverlays.length>1)existingMetricOverlays[existingMetricOverlays.length-1].remove();
  else if(existingMetricOverlays.length===1){
    // Only metric info open (from dashboard), remove it
    const m=existingMetricOverlays[0].querySelector('.modal');
    if(m&&!m.querySelector('.client-card-scroll'))existingMetricOverlays[0].remove();
  }

  // Create dedicated AI recommendation overlay
  const aiOverlay=document.createElement('div');aiOverlay.className='overlay';
  aiOverlay.onclick=e=>{if(e.target===aiOverlay)aiOverlay.remove()};
  aiOverlay.innerHTML=`<div class="modal" style="max-width:600px;max-height:90vh;display:flex;flex-direction:column;padding:0">
    <div style="padding:18px 24px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
      <div style="font-weight:700;font-size:15px;color:var(--accent)">💡 AI Tavsiya</div>
      <button onclick="this.closest('.overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3);padding:0 4px">×</button>
    </div>
    <div class="ai-rec-body" style="padding:20px 24px;overflow-y:auto;flex:1">
      <div class="text-center py-6 text-[13px] text-subtle"><span class="inline-block animate-pulse" style="font-size:20px">⏳</span><div style="margin-top:8px">AI tahlil qilmoqda...</div></div>
    </div>
  </div>`;
  document.body.appendChild(aiOverlay);
  const box=aiOverlay.querySelector('.ai-rec-body');

  // === BUILD RICH CONTEXT ===
  const names={mrr:'MRR (Monthly Recurring Revenue)',nrr:'NRR (Net Revenue Retention)',grr:'GRR (Gross Revenue Retention)',cust:'Active Customers',arpa:'ARPA (Average Revenue Per Account)',cac:'CAC (Customer Acquisition Cost)',cash:'Net Cash In',qr:'SaaS Quick Ratio',dso:'DSO (Days Sales Outstanding)',conc:'Revenue Concentration',ltv:'LTV (Customer Lifetime Value)',lc:'Logo vs Revenue Churn',cur_mrr:'Current MRR',total_cv:'Total Contract Value',total_paid:'Total Paid',outstanding:'Outstanding Balance',health:'Health Score',pay_rate:'Payment Rate',days_exp:'Days to Expiry',avg_monthly:'Avg. Monthly Payment'};
  const mName=names[metricKey]||metricKey;
  let ctx='';

  try{
    const isClientMetric=['cur_mrr','total_cv','total_paid','outstanding','health','pay_rate','days_exp','avg_monthly'].includes(metricKey);

    if(isClientMetric){
      // --- CLIENT CARD CONTEXT ---
      const ccModal=document.querySelector('.client-card-scroll');
      if(ccModal){
        const parentModal=ccModal.closest('.modal');
        // Client name from header
        const nameEl=parentModal?.querySelector('.font-bold.text-lg');
        const clientName=nameEl?nameEl.textContent.trim():'';
        // All 8 KPIs
        const kpis=parentModal?.querySelectorAll('.client-kpi-grid .mono, .client-kpi-grid2 .mono');
        const kLabels=['Current MRR','Total Contract Value','Total Paid','Outstanding Balance','Health Score','Payment Rate','Days to Expiry','Avg Monthly Payment'];
        let kpiData=[];
        if(kpis)kpis.forEach((el,i)=>{if(i<8)kpiData.push(kLabels[i]+': '+el.textContent.trim())});
        // Health badge
        const badge=parentModal?.querySelector('.badge');
        const healthStatus=badge?badge.textContent.trim():'';
        // Contract count & tenure from subtitle
        const subtles=parentModal?.querySelectorAll('.text-subtle');
        let tenure='',contracts='';
        subtles?.forEach(el=>{const t=el.textContent;if(t.includes('oy'))tenure=t.trim();if(t.includes('shartnoma'))contracts=t.trim()});
        // Debt info
        const warnEl=parentModal?.querySelector('.text-warn');
        const debtInfo=warnEl?warnEl.textContent.trim():'';

        ctx='MIJOZ: '+clientName+'\n';
        if(tenure)ctx+='Hamkorlik: '+tenure+'\n';
        if(contracts)ctx+='Shartnomalar: '+contracts+'\n';
        ctx+='KO\'RSATKICHLAR:\n'+kpiData.join('\n')+'\n';
        if(healthStatus)ctx+='Sog\'liq holati: '+healthStatus+'\n';
        if(debtInfo)ctx+='Qarz: '+debtInfo+'\n';
      }
    }else{
      // --- DASHBOARD CONTEXT ---
      if(typeof dashRange==='function'){
        const dr=dashRange();
        const t=dr.totals;const curMRR=t[t.length-1]||0;const startMRR=dr.baseMRR||0;
        const mrrGrowth=startMRR?Math.round((curMRR-startMRR)/startMRR*100):0;
        const curCl=dr.cpmArr[dr.cpmArr.length-1]||0;
        ctx='DASHBOARD KO\'RSATKICHLARI:\n';
        ctx+='MRR: '+fmt(curMRR)+' $ ('+(mrrGrowth>=0?'+':'')+mrrGrowth+'% o\'sish)\n';
        ctx+='NRR: '+(dr.nrr||0)+'%\n';
        ctx+='GRR: '+(dr.grr||0)+'%\n';
        ctx+='Aktiv mijozlar: '+curCl+'\n';
        ctx+='ARPA: '+fmt(dr.arpa||0)+' $\n';
        ctx+='Cash In: '+fmt(dr.cashIn||0)+' $\n';
        ctx+='DSO: '+Math.round(dr.dso||0)+' kun\n';
        ctx+='Quick Ratio: '+(dr.quickRatio?.toFixed(2)||'?')+'x\n';
        ctx+='LTV: '+fmt(dr.ltv||0)+' $\n';
        ctx+='Top-5 konsentratsiya: '+Math.round(dr.top5Conc||0)+'%\n';
        ctx+='Yangi: '+dr.newClients.length+' ta (+'+fmt(dr.newClients.reduce((s,c)=>s+c.mrr,0))+' $)\n';
        ctx+='Churn: '+dr.churnClients.length+' ta (-'+fmt(dr.churnClients.reduce((s,c)=>s+c.mrr,0))+' $)\n';
        if(dr.logoChurnRate)ctx+='Logo Churn: '+Math.round(dr.logoChurnRate*10)/10+'%\n';
        if(dr.revenueChurnRate)ctx+='Revenue Churn: '+Math.round(dr.revenueChurnRate*10)/10+'%\n';
      }
    }
  }catch(e){}

  const prompt='Sen tajribali SaaS CRM moliyaviy maslahatchisan. Quyidagi real ma\'lumotlar asosida '+mName+' ko\'rsatkichini tahlil qil.\n\n'
    +ctx
    +'\nSORALGAN METRIKA: '+mName
    +'\n\nVAZIFA: O\'zbek tilida 3-4 ta ANIQ tavsiya ber. Har bir tavsiya:\n'
    +'- Yuqoridagi real raqamlarga asoslangan bo\'lsin\n'
    +'- Qanday harakat qilish kerakligi aniq ko\'rsatilsin\n'
    +'- Kutilgan natija yoki maqsad raqam berilsin\n'
    +'Faqat tavsiyalar yoz, boshqa narsa emas.';

  try{
    const result=await _callAI(prompt);
    box.innerHTML='<div style="font-size:13px;line-height:1.7;color:var(--text);white-space:pre-wrap">'+result.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</div>';
  }catch(e){
    box.innerHTML='<div class="p-3 rounded-lg text-[12px]" style="background:var(--red-bg);border:1px solid var(--red);color:var(--red)">❌ '+e.message+'</div>';
  }
}

function dashPreset(key){
  const now=new Date();const y=now.getFullYear(),m=now.getMonth(),d=now.getDate();
  const dow=now.getDay()||7;const wkS=new Date(y,m,d-(dow-1));
  const presets={
    'w':{from:wkS,to:now,label:'Bu hafta'},'m':{from:new Date(y,m,1),to:now,label:'Bu oy'},
    'q':{from:new Date(y,Math.floor(m/3)*3,1),to:now,label:'Bu chorak'},'y':{from:new Date(y,0,1),to:now,label:y+''},
    '30':{from:new Date(y,m,d-30),to:now,label:'30 kun'},'90':{from:new Date(y,m,d-90),to:now,label:'90 kun'},
    '25':{from:new Date(2025,0,1),to:new Date(2025,11,31),label:'2025'},'24':{from:new Date(2024,0,1),to:new Date(2024,11,31),label:'2024'},
  };
  return presets[key]||presets['y'];
}
function applyPreset(key){S.dashPre=key;const p=dashPreset(key);S.dashFrom=p.from;S.dashTo=p.to;clearCache();render()}

function toggleWeekPicker(btn){
  const ex=document.querySelector('.wk-drop');
  if(ex){ex.remove();return}
  const mn=['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
  const now=new Date();const dow=now.getDay()||7;
  const thisSat=new Date(now.getFullYear(),now.getMonth(),now.getDate()+(6-dow));
  const weeks=[];
  for(let i=0;i<10;i++){
    const sat=new Date(thisSat);sat.setDate(sat.getDate()-i*7);
    const mon=new Date(sat);mon.setDate(mon.getDate()-5);
    weeks.push({from:mon,to:sat});
  }
  const fmtD=d=>d.getDate()+'-'+mn[d.getMonth()];
  const cur=S.dashPre==='w'?dateStr(S.dashFrom):'';
  const d=document.createElement('div');d.className='wk-drop';
  d.innerHTML=weeks.map(w=>{
    const active=dateStr(w.from)===cur?' wk-active':'';
    return`<button class="wk-item${active}" data-f="${dateStr(w.from)}" data-t="${dateStr(w.to)}">${fmtD(w.from)} — ${fmtD(w.to)}</button>`;
  }).join('');
  btn.closest('.wk-pick-wrap').appendChild(d);
  d.querySelectorAll('.wk-item').forEach(b=>b.onclick=function(){
    S.dashPre='w';S.dashFrom=toDate(this.dataset.f);S.dashTo=toDate(this.dataset.t);clearCache();render();
  });
  setTimeout(()=>{const close=e=>{if(!d.contains(e.target)&&e.target!==btn){d.remove();document.removeEventListener('click',close)}};document.addEventListener('click',close)},0);
}

function showPeriodPicker(){
  const now=new Date(),curY=now.getFullYear();
  let selY=curY;
  const months=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
  const o=document.createElement('div');o.className='overlay';o.onclick=e=>{if(e.target===o)o.remove()};

  function pick(from,to){
    S.dashPre='p';S.dashFrom=from;S.dashTo=to;clearCache();render();o.remove();
  }

  function build(){
    return`<div class="modal" style="width:480px">
    <div class="flex items-center justify-between mb-5">
      <h2 style="margin:0">Davrni tanlash</h2>
      <button class="btn" onclick="this.closest('.overlay').remove()" style="padding:4px 8px;font-size:18px;line-height:1">&times;</button>
    </div>
    <div class="pp-year-row">
      <button class="btn pp-arr" data-dir="-1">&#8249;</button>
      <span class="pp-year-lbl">${selY} yil</span>
      <button class="btn pp-arr" data-dir="1">&#8250;</button>
    </div>
    <div class="pp-grid pp-months">
      ${months.map((m,i)=>`<button class="btn pp-cell" data-type="month" data-m="${i}">${m}</button>`).join('')}
    </div>
    <div class="pp-divider"></div>
    <div class="pp-grid pp-quarters">
      <button class="btn pp-cell" data-type="q" data-q="0">1-chorak</button>
      <button class="btn pp-cell" data-type="period" data-p="half1">Yarim yillik</button>
      <button class="btn pp-cell" data-type="q" data-q="1">2-chorak</button>
      <button class="btn pp-cell" data-type="period" data-p="half2">2-yarim yil</button>
      <button class="btn pp-cell" data-type="q" data-q="2">3-chorak</button>
      <button class="btn pp-cell" data-type="period" data-p="9m">9 oy</button>
      <button class="btn pp-cell" data-type="q" data-q="3">4-chorak</button>
      <button class="btn pp-cell" data-type="period" data-p="year">Yil</button>
    </div></div>`;
  }

  o.innerHTML=build();
  o.querySelectorAll('.pp-arr').forEach(b=>b.onclick=function(e){
    e.stopPropagation();selY+=parseInt(this.dataset.dir);o.querySelector('.pp-year-lbl').textContent=selY+' yil';
  });
  o.querySelectorAll('[data-type="month"]').forEach(b=>b.onclick=function(e){
    e.stopPropagation();const m=parseInt(this.dataset.m);
    const last=new Date(selY,m+1,0);pick(new Date(selY,m,1),new Date()<=last?new Date():last);
  });
  o.querySelectorAll('[data-type="q"]').forEach(b=>b.onclick=function(e){
    e.stopPropagation();const q=parseInt(this.dataset.q);
    const last=new Date(selY,q*3+3,0);pick(new Date(selY,q*3,1),new Date()<=last?new Date():last);
  });
  o.querySelectorAll('[data-type="period"]').forEach(b=>b.onclick=function(e){
    e.stopPropagation();const p=this.dataset.p;let from,to;
    if(p==='half1'){from=new Date(selY,0,1);to=new Date(selY,5,30)}
    else if(p==='half2'){from=new Date(selY,6,1);to=new Date(selY,11,31)}
    else if(p==='9m'){from=new Date(selY,0,1);to=new Date(selY,8,30)}
    else{from=new Date(selY,0,1);to=new Date(selY,11,31)}
    pick(from,new Date()<=to?new Date():to);
  });
  document.body.appendChild(o);
}

function downloadCSV(rows,filename){
  if(!rows||!rows.length){showToast("Ma'lumot yo'q",'error');return}
  const hs=Object.keys(rows[0]);
  const esc=v=>{const s=v==null?'':String(v);return(s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s.replace(/"/g,'""')+'"':s};
  const csv=[hs.join(','),...rows.map(r=>hs.map(h=>esc(r[h])).join(','))].join('\r\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download=filename+'_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);showToast(filename+' yuklandi','success')
}

// === DOWNLOAD MENU (XLSX / PDF) ===
const _dlSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

function showDlMenu(btn,type){
  const ex=document.getElementById('_dlMenu');
  if(ex){ex.remove();if(ex._src===btn)return;}
  const m=document.createElement('div');m.id='_dlMenu';m._src=btn;
  m.style.cssText='position:fixed;background:var(--bg2);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:600;overflow:hidden;min-width:150px;animation:modalIn .12s ease';
  const r=btn.getBoundingClientRect();
  m.style.top=(r.bottom+4)+'px';m.style.right=(window.innerWidth-r.right)+'px';
  m.innerHTML=[{l:'📊 XLSX',f:`exportXLSX('${type}')`},{l:'🖨 PDF',f:`exportPDF('${type}')`}]
    .map(o=>`<div onclick="${o.f};document.getElementById('_dlMenu')?.remove()" class="py-2.5 px-4 cursor-pointer text-[13px] whitespace-nowrap hover:bg-hover">${o.l}</div>`).join('');
  document.body.appendChild(m);
  setTimeout(()=>document.addEventListener('click',function h(e){if(!m.contains(e.target)&&e.target!==btn){m.remove();document.removeEventListener('click',h)}}),0);
}

function _dlRows(type){
  if(type==='contracts'){
    if(!S.rows.length)return null;
    const pm=calcPayments();
    return S.rows.map(r=>{const p=pm[r.Client+'|'+r.raqami]||{};return{'Raqami':r.raqami||'','Mijoz':r.Client||'','Firma':r['Firma nomi']||'','Hudud':r.Hudud||'','Menejer':r.Manager||'','Boshlanish':r.sanasi||'','Tugash':r['amal qilishi']||'','Oylik USD':Math.round(r._mUSD||0),'Jami USD':Math.round(r._sUSD||0),"To'langan":Math.round(p.total||0),'Qarz':Math.round((r._sUSD||0)-(p.total||0)),'Status':r.status||''}});
  }
  if(type==='debts'){
    return calcDebtTable(S.debtDate||new Date()).map(r=>({'Mijoz':r.name,"Sh. qoldig'i":Math.round(r.qoldiq||0),'Oy oxiri qarzi':Math.round(r.oyQarz||0),'Kelishuv qarzi':Math.round(r.kelQarz||0)}));
  }
  if(type==='araging'){
    return calcARaging().flatMap(b=>b.clients.map(c=>({'Mijoz':c.name,'Muddat':b.label,'Oy qarzi':Math.round(c.qarz),'Kelishuv':Math.round(c.kelQarz||0),'Kechikish (kun)':c.days<999?c.days:'',"Oxirgi to'lov":c.lastPayDate})));
  }
  if(type==='collection'){
    return calcCollectionRate().map(c=>({'Mijoz':c.name,'Kutilgan':c.expected,"To'langan":c.paid,'Farq':c.delta,'Undiruv %':c.rate}));
  }
  if(type==='audit'){
    return calcDataAudit().map(a=>({'Mijoz':a.client,'Shartnoma':a.raqami,'Xatolik turi':a.type,'Tafsilot':a.detail}));
  }
  return null;
}

function exportXLSX(type){
  const rows=_dlRows(type);
  if(!rows||!rows.length){showToast("Ma'lumot yo'q",'error');return;}
  if(typeof XLSX==='undefined'){showToast('XLSX kutubxona yuklanmadi','error');return;}
  const ws=XLSX.utils.json_to_sheet(rows);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Ma'lumot");
  const fn={contracts:'Shartnomalar',debts:'Qarzdorlik',araging:'AR_Aging',collection:'Inkasso',audit:'Tahlil'}[type]||type;
  XLSX.writeFile(wb,fn+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast(fn+' XLSX yuklandi','success');
}

function exportPDF(type){
  const rows=_dlRows(type);
  if(!rows||!rows.length){showToast("Ma'lumot yo'q",'error');return;}
  const title={contracts:'Shartnomalar',debts:'Qarzdorlik',araging:'AR Aging',collection:'Inkasso'}[type]||type;
  const hs=Object.keys(rows[0]);
  const tbl='<table><thead><tr>'+hs.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+hs.map(h=>`<td>${r[h]??''}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Segoe UI",sans-serif;padding:15mm 18mm;color:#1a1917;font-size:9pt}h1{font-size:14pt;font-weight:700;margin-bottom:3px}p{font-size:8.5pt;color:#666;margin-bottom:14px}table{width:100%;border-collapse:collapse;font-size:8.5pt}th{background:#f0efeb;font-weight:600;text-align:left;padding:6px 8px;border:1px solid #ccc}td{padding:5px 8px;border:1px solid #ddd}tr:nth-child(even){background:#fafaf8}@media print{@page{size:A4 landscape;margin:12mm}}</style></head><body><h1>${title}</h1><p>UYSOT · ${new Date().toLocaleDateString('uz-UZ')}</p>${tbl}</body></html>`;
  const w=window.open('','_blank');
  if(!w){showToast("Popup bloklangan — brauzer sozlamalarini tekshiring",'error');return;}
  w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),600);
}
