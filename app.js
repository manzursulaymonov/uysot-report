/* ============================================================
   UYSOT — UI: Dashboard Range, Render, Pages, Charts, Config
   ============================================================ */

// === DASHBOARD RANGE ===
function dashRange(){
  const cacheKey='dr_'+S.dashPre+'_'+S.dashFrom?.getTime()+'_'+S.dashTo?.getTime()+'_v3';
  return cached(cacheKey,()=>{
    const from=S.dashFrom,to=S.dashTo;const days=Math.round((to-from)/864e5);
    let gran=days<=31?'day':'month';const points=[];
    if(gran==='day'){for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1))points.push(new Date(d))}
    else{for(let d=new Date(from.getFullYear(),from.getMonth(),1);d<=to;d.setMonth(d.getMonth()+1))points.push(new Date(d))}
    if(!points.length)points.push(new Date(from));
    const labels=points.map(d=>{
      if(gran==='day')return fmtD(d);
      const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
      const span=(to.getFullYear()-from.getFullYear())*12+(to.getMonth()-from.getMonth());
      return span>11?mos[d.getMonth()]+' '+(d.getFullYear()%100):mos[d.getMonth()];
    }); const {all, qAll} = buildContracts();
    const allData = all.concat(qAll).filter(c=>c.musd!==0);
    const names = [...new Set(allData.filter(c=>c.musd>0).map(c=>c.client))];
    const now = new Date();

    const getMRR = (name, date) => allData.filter(c=>c.client===name && c.st<=date && c.endD>=date).reduce((s,x)=>s+x.musd,0);
    
    const baseDate = new Date(from.getTime() - 1); 
    const nextDay = from;

    const clientMeta = {};
    names.forEach(name => {
        const cts = allData.filter(c=>c.client===name);
        const firstEver = cts.reduce((a,c)=>c.st < a.st ? c : a);
        const lastEver = cts.reduce((a,c)=>c.endD > a.endD ? c : a);
        const firstMgrs = firstEver.mgr || 'Tayinlanmagan';
        
        const mBase = getMRR(name, baseDate);
        const inBase = mBase > 0 && firstEver.st < from;
        
        const joinedInPeriod = firstEver.st >= from && firstEver.st <= to;
        const leftInPeriod = lastEver.endD >= baseDate && lastEver.endD <= to;
        const renewedSoon = allData.some(c=>c.client===name && c.st.getTime() === lastEver.endD.getTime()+1);
        const actuallyLeft = leftInPeriod && !renewedSoon;

        let cat = 'Other';
        if(joinedInPeriod && actuallyLeft) cat = 'Transient';
        else if(joinedInPeriod) cat = 'New';
        else if(actuallyLeft && inBase) cat = 'Churn';
        else if(inBase) cat = 'Retained';
        else if(firstEver.st < from && getMRR(name, now) > 0) cat = 'Resurrected';
        
        clientMeta[name] = {cat, firstEver, lastEver, firstMgrs, mrrBase: inBase ? mBase : 0};
    });

    const newClients=[], churnClients=[], expClients=[];
    const seenNew=new Set(), seenChurn=new Set(), seenExp=new Set();
    let startMRRsum = 0, exactBaseClients = 0;
    const newPerPt=[],churnPerPt=[],newMrrArr=[],churnMrrArr=[],expMrrArr=[],conMrrArr=[],totals=[],cpmArr=[];

    points.forEach((pt, i) => {
        const binStart = gran==='day' ? new Date(pt) : new Date(pt.getFullYear(), pt.getMonth(), 1);
        let binEnd = gran==='day' ? new Date(pt) : new Date(pt.getFullYear(), pt.getMonth()+1, 0, 23, 59, 59);
        let binOut = gran==='day' ? new Date(pt.getFullYear(), pt.getMonth(), pt.getDate() + 1) : new Date(pt.getFullYear(), pt.getMonth()+1, 1);
        
        if(binEnd > now) binEnd = now;
        if(binOut > now) binOut = now;
        
        const sSnap = mrrOnDate(new Date(binStart.getTime() - 1), all, qAll);
        const eSnap = mrrOnDate(new Date(binOut.getTime() - 1), all, qAll);
        
        let newM=0, churnM=0, expM=0, conM=0;
        let newCount=0, churnCount=0;
        
        totals.push(Math.round(eSnap.total));
        cpmArr.push(eSnap.active.size);
        
        names.forEach(name => {
           const meta = clientMeta[name];
           if (meta.cat === 'Other') return;

           const mStart = sSnap.contracts.filter(c=>c.client===name).reduce((s,x)=>s+x.musd,0);
           const mEnd = eSnap.contracts.filter(c=>c.client===name).reduce((s,x)=>s+x.musd,0);
           const delta = mEnd - mStart;
           const mgr = meta.firstMgrs;

           // === ATRIBUCIYA (Confirmed Spec) ===
           if (meta.cat === 'New' || meta.cat === 'Transient') {
              if (delta > 0) newM += delta;
              if (meta.cat === 'Transient' && delta < 0) churnM += Math.abs(delta);
              
              if (!seenNew.has(name) && delta > 0) {
                 seenNew.add(name);
                 let activeCt = meta.firstEver;
                 const binCts = allData.filter(c => c.client === name && c.st <= binEnd && c.musd > 0);
                 if (binCts.length) activeCt = binCts.reduce((a,c) => c.st > a.st ? c : a);
                 newClients.push({
                    name, 
                    date: activeCt.st, 
                    mgr, 
                    mrr: activeCt.musd, 
                    hudud: activeCt.hudud || '', 
                    dur: activeCt.dur || 0, 
                    tUSD: activeCt.tUSD || 0,
                    sUSD: activeCt.sUSD || 0,
                    izoh: activeCt.izoh || ''
                 });
              }
              if (meta.cat === 'Transient' && !seenChurn.has(name) && delta < 0) {
                 seenChurn.add(name);
                 const cDate = new Date(meta.lastEver.endD.getFullYear(), meta.lastEver.endD.getMonth(), meta.lastEver.endD.getDate() + 1);
                 churnClients.push({name, date: cDate, mgr, mrr: Math.round(mStart), izoh: 'Joined & Left in period'});
              }
           }
           else if (meta.cat === 'Churn') {
              const isDeparture = meta.lastEver.endD >= new Date(binStart.getTime() - 1) && meta.lastEver.endD <= binEnd;
              if (isDeparture) {
                 churnM += mStart; churnCount++;
                 if (!seenChurn.has(name)) {
                    seenChurn.add(name);
                    const cDate = new Date(meta.lastEver.endD.getFullYear(), meta.lastEver.endD.getMonth(), meta.lastEver.endD.getDate() + 1);
                    churnClients.push({name, date: cDate, mgr, mrr: Math.round(meta.mrrBase), izoh: '', hudud: meta.firstEver?.hudud||''});
                 }
              }
              // Non-departure bins: Churn client's pre-departure MRR changes
              // are not attributed to the waterfall to avoid double-counting.
           }
           else if (meta.cat === 'Retained' || meta.cat === 'Resurrected') {
              // Intra-period movement check
              const binCts = allData.filter(c => c.client === name && c.musd > 0 && c.st <= binEnd && c.endD >= binStart);
              const intraChurn = binCts.find(c => c.endD >= binStart && c.endD < binEnd && !allData.some(c2 => c2.client===name && c2.musd>0 && c2.st.getTime() === c.endD.getTime()+1));
              const intraReturn = binCts.find(c => c.st > binStart && c.st <= binEnd && !allData.some(c2 => c2.client===name && c2.musd>0 && c2.endD.getTime() === c.st.getTime()-1));

              if (intraChurn) {
                  conM += mStart;
                  if(!seenChurn.has(name)) {
                      seenChurn.add(name);
                      churnClients.push({name, date: new Date(intraChurn.endD.getTime()+864e5), mgr, mrr: Math.round(mStart), isIntra: true});
                  }
              }
              if (intraReturn) {
                  expM += mEnd;
                  if(!seenExp.has(name)) {
                      seenExp.add(name);
                      expClients.push({name, mrrStart: 0, mrrEnd: Math.round(mEnd), delta: Math.round(mEnd), mgr, date: intraReturn.st, isIntra: true, isRes: meta.cat === 'Resurrected'});
                  }
              }

              if (!intraReturn && Math.abs(delta) > 1) {
                if (delta > 0) expM += delta; else conM += Math.abs(delta);
                if (!seenExp.has(name)) {
                   seenExp.add(name);
                   const mToday = getMRR(name, now);
                   let lastDate = binStart;
                   const evts = [];
                   allData.filter(c=>c.client===name).forEach(c=>{
                       const sD=new Date(c.st.getFullYear(),c.st.getMonth(),c.st.getDate());
                       if(sD>=from&&sD<=to)evts.push(sD);
                       const eD=new Date(c.endD.getFullYear(),c.endD.getMonth(),c.endD.getDate()+1);
                       if(eD>=from&&eD<=to)evts.push(eD);
                   });
                   if(evts.length){evts.sort((a,b)=>b-a);lastDate=evts[0]}
                   expClients.push({name, mrrStart: Math.round(meta.mrrBase), mrrEnd: Math.round(mToday), delta: Math.round(mToday - meta.mrrBase), mgr, date: lastDate, isRes: meta.cat === 'Resurrected'});
                }
              }
           }
           if (i === 0 && meta.mrrBase > 0) { startMRRsum += meta.mrrBase; exactBaseClients++; }
        });
        
        newMrrArr.push(Math.round(newM));
        churnMrrArr.push(Math.round(churnM));
        expMrrArr.push(Math.round(expM));
        conMrrArr.push(Math.round(conM));
        newPerPt.push(newCount);
        churnPerPt.push(churnCount);
    });

    newClients.sort((a,b)=>b.date-a.date); churnClients.sort((a,b)=>b.date-a.date);
    expClients.sort((a,b)=>b.date-a.date);
    
    // === DSO & CONCENTRATION ===
    const debtTable = calcDebtTable(to);
    const endingDebt = debtTable.reduce((s,r)=>s+Math.max(0,r.oyQarz),0);
    // Period Total Revenue (accrued MRR)
    let periodRevenue = 0;
    totals.forEach((v, i) => {
       const mDays = gran === 'day' ? 1 : new Date(points[i].getFullYear(), points[i].getMonth() + 1, 0).getDate();
       periodRevenue += v * (mDays / 30); // Normalize MRR to period duration
    });
    const dso = periodRevenue > 0 ? (endingDebt / periodRevenue) * days : 0;

    // Concentration (End weights)
    const endWeights = names.map(n => ({ name: n, mrr: getMRR(n, to) })).sort((a,b)=>b.mrr - a.mrr);
    const totalEndMRR = endWeights.reduce((s,x)=>s+x.mrr, 0);
    const top5MRR = endWeights.slice(0,5).reduce((s,x)=>s+x.mrr,0);
    const top10MRR = endWeights.slice(0,10).reduce((s,x)=>s+x.mrr,0);
    const top5Conc = totalEndMRR > 0 ? (top5MRR / totalEndMRR * 100) : 0;
    const top10Conc = totalEndMRR > 0 ? (top10MRR / totalEndMRR * 100) : 0;

    let cashIn=0, cashInBreak={naqd:0,karta:0,bank:0};
    if(S.payRows) S.payRows.forEach(r=>{
      const d=pd(r['sanasi']);
      if(d&&d>=from&&d<=to){
        const v=pn(r['USD']||'0');
        cashIn+=v;
        const tt=(r['tolov turi']||'').toLowerCase();
        if(tt.includes('naqd')) cashInBreak.naqd+=v;
        else if(tt.includes('karta')) cashInBreak.karta+=v;
        else if(tt.includes('bank')) cashInBreak.bank+=v;
      }
    });

    // === LTV, QUICK RATIO, LOGO vs REVENUE CHURN ===
    const curClients = cpmArr[cpmArr.length-1]||0;
    const curMRR = totals[totals.length-1]||0;
    const arpa = curClients > 0 ? curMRR / curClients : 0;
    const logoChurnRate = exactBaseClients > 0 ? (churnClients.length / exactBaseClients) * 100 : 0;
    const revenueChurnRate = startMRRsum > 0 ? (churnClients.reduce((s,c)=>s+c.mrr,0) / startMRRsum) * 100 : 0;
    const monthlyChurnRate = logoChurnRate / Math.max(1, Math.round(days / 30));
    const ltv = monthlyChurnRate > 0 ? Math.round(arpa / (monthlyChurnRate / 100)) : 0;
    const mrrGrowth = newClients.reduce((s,c)=>s+c.mrr,0) + expClients.filter(x=>x.delta>0).reduce((s,x)=>s+x.delta,0);
    const mrrLost = churnClients.reduce((s,c)=>s+c.mrr,0) + expClients.filter(x=>x.delta<0).reduce((s,x)=>s+Math.abs(x.delta),0);
    const quickRatio = mrrLost > 0 ? mrrGrowth / mrrLost : (mrrGrowth > 0 ? 99 : 0);

    // MRR Growth % per period (include first point using pre-period baseline)
    const mrrGrowthPcts = totals.map((v,i) => {
      if(i===0){
        const preDate = new Date(from); preDate.setDate(preDate.getDate()-1);
        const preMRR=mrrOnDate(preDate,all,qAll).total;
        return preMRR>0 ? Math.round((v-preMRR)/preMRR*1000)/10 : 0;
      }
      return totals[i-1]>0 ? Math.round((v-totals[i-1])/totals[i-1]*1000)/10 : 0;
    });

    // Net MRR Movement (Variant B: new client intra-period expansion → Expansion)
    const endSnap = mrrOnDate(to, all, qAll);
    const endClientMRR = {};
    endSnap.contracts.forEach(c => { endClientMRR[c.client] = (endClientMRR[c.client]||0) + c.musd; });
    let newClientIntraExp = 0;
    newClients.forEach(c => {
      const endMRR = endClientMRR[c.name] || 0;
      if(endMRR > c.mrr) newClientIntraExp += Math.round(endMRR - c.mrr);
    });
    const netMovement = {
      newMRR: newClients.reduce((s,c)=>s+c.mrr,0),
      churnMRR: churnClients.reduce((s,c)=>s+c.mrr,0),
      expMRR: expClients.filter(x=>x.delta>0).reduce((s,x)=>s+x.delta,0) + newClientIntraExp,
      conMRR: expClients.filter(x=>x.delta<0).reduce((s,x)=>s+Math.abs(x.delta),0),
      newClientIntraExp
    };
    netMovement.net = netMovement.newMRR + netMovement.expMRR - netMovement.churnMRR - netMovement.conMRR;

    // === CAC & LTV:CAC ===
    let marketingSpend = 0;
    const mCosts = S.marketingCosts || {};
    // Iterate through months in range
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d.setMonth(d.getMonth() + 1)) {
        const key = d.getFullYear() + '-' + (d.getMonth() + 1);
        marketingSpend += (mCosts[key] || 0);
    }
    const cac = newClients.length > 0 ? (marketingSpend / newClients.length) : 0;
    const ltvCac = cac > 0 ? (ltv / cac) : 0;

    // === GRR (Gross Revenue Retention) ===
    // GRR measures retention WITHOUT expansion — losses only.
    // Formula: (startMRR - churnMRR - contractionMRR) / startMRR × 100, capped at 100%.
    const grr = startMRRsum > 0
      ? Math.min(100, Math.max(0, Math.round(
          (startMRRsum - netMovement.churnMRR - netMovement.conMRR) / startMRRsum * 1000
        ) / 10))
      : 0;

    return {labels, totals, cpmArr, newPerPt, churnPerPt, addedMRR: newMrrArr, lostMRR: churnMrrArr, expMRR: expMrrArr, conMRR: conMrrArr, newClients, churnClients, expClients, gran, points, baseMRR: Math.round(startMRRsum), baseClients: exactBaseClients, cashIn, cashInBreak, dso, top5Conc, top10Conc, ltv, quickRatio, logoChurnRate, revenueChurnRate, mrrGrowthPcts, netMovement, cac, ltvCac, clientMeta, grr};
  });
}



// === CONTRACT RENEWAL CALENDAR ===
function calcRenewals(){
  return cached('renewals_v3',()=>{
    const now=new Date(), map={};
    const allCts=[...S.rows,...S.qRows];
    allCts.forEach(r=>{
      if(!r.Client)return;
      const musd=r._mUSD||pn(r['Oylik USD'])||0; if(musd<=0)return;
      const en=pd(r['amal qilishi']); if(!en)return;
      const name=r.Client;
      if(!map[name]) map[name]={name, endDate:en, mrr:0};
      map[name].mrr+=musd;
      if(en<map[name].endDate) map[name].endDate=en;
    });
    const res=[];
    Object.values(map).forEach(c=>{
      c.daysLeft=Math.round((c.endDate-now)/864e5);
      // Show: up to 7 days ahead + expired up to 7 days ago
      if(c.daysLeft<=7 && c.daysLeft>=-7) res.push(c);
    });
    res.sort((a,b)=>a.daysLeft-b.daysLeft);
    return res;
  });
}

// === REGIONAL PERFORMANCE ===
function calcRegionalPerf(){
  return cached('regional_v1',()=>{
    const dr=dashRange(), regions={};
    const now=S.dashTo;
    const {all,qAll}=buildContracts();
    const snap=mrrOnDate(now,all,qAll);
    snap.contracts.forEach(c=>{
      const h=c.hudud||'Nomalum';
      if(!regions[h]) regions[h]={name:h, mrr:0, clients:new Set(), count:0};
      regions[h].mrr+=c.musd; regions[h].clients.add(c.client);
    });
    Object.values(regions).forEach(r=>r.count=r.clients.size);
    dr.newClients.forEach(c=>{const h=c.hudud||'Nomalum'; if(regions[h]) regions[h].newCount=(regions[h].newCount||0)+1});
    dr.churnClients.forEach(c=>{
      const h=c.hudud||'Nomalum';
      if(regions[h]) regions[h].churnCount=(regions[h].churnCount||0)+1;
    });
    return Object.values(regions).sort((a,b)=>b.mrr-a.mrr);
  });
}

// === MANAGER LEADERBOARD ===
function calcManagerBoard(){
  return cached('mgrboard_v1',()=>{
    const dr=dashRange(), mgrs={};
    const add=(mRaw,type,countVal,mrrVal)=>{
      const list=mRaw.split(',').map(n=>n.trim()).filter(Boolean);
      const split=list.length||1;
      list.forEach(m=>{
        if(!mgrs[m]) mgrs[m]={name:m, newCount:0, newMRR:0, churnCount:0, churnMRR:0, expMRR:0, conMRR:0};
        if(type==='new'){ mgrs[m].newCount+=countVal; mgrs[m].newMRR+=mrrVal/split; }
        else if(type==='churn'){ mgrs[m].churnCount+=countVal; mgrs[m].churnMRR+=mrrVal/split; }
        else if(type==='exp'){ mgrs[m].expMRR+=mrrVal/split; }
        else if(type==='con'){ mgrs[m].conMRR+=mrrVal/split; }
      });
    };
    dr.newClients.forEach(c=>add(c.mgr||'Nomalum','new',1,c.mrr));
    dr.churnClients.forEach(c=>add(c.mgr||'Nomalum','churn',1,c.mrr));
    dr.expClients.forEach(c=>{
      const r=S.rows.find(x=>x.Client===c.name);
      const m=r?.Manager||'Nomalum';
      if(c.delta>0) add(m,'exp',0,c.delta);
      else add(m,'con',0,Math.abs(c.delta));
    });
    Object.values(mgrs).forEach(m=>m.netMRR=m.newMRR+m.expMRR-m.conMRR-m.churnMRR);
    return Object.values(mgrs).sort((a,b)=>b.netMRR-a.netMRR);
  });
}

// === CLIENT HEALTH SCORE ===
function calcClientHealth(){
  return cached('health_v1',()=>{
    const now=new Date(), debt=calcDebtTable(now), res=[];
    const {all,qAll}=buildContracts();
    
    const firstDates={};
    [...all, ...qAll].forEach(c=>{
      if(!firstDates[c.client] || c.st < firstDates[c.client]) firstDates[c.client] = c.st;
    });

    const snap=mrrOnDate(now,all,qAll);
    const debtMap={}; debt.forEach(d=>debtMap[d.name]=d);
    const clients=new Set(); snap.contracts.forEach(c=>clients.add(c.client));
    clients.forEach(name=>{
      const cts=snap.contracts.filter(c=>c.client===name);
      if(!cts.length)return;
      const mrr=cts.reduce((s,c)=>s+c.musd,0);
      const earliestEnd=cts.reduce((a,c)=>c.endD<a?c.endD:a, cts[0].endD);
      const daysToEnd=Math.round((earliestEnd-now)/864e5);
      const d=debtMap[name];
      let score=100;
      if(d){
        if(d.oyQarz>mrr*2) score-=40;
        else if(d.oyQarz>mrr) score-=25;
        else if(d.oyQarz>0) score-=10;
      }
      if(daysToEnd<30) score-=20;
      else if(daysToEnd<60) score-=10;
      const earliest=firstDates[name] || cts.reduce((a,c)=>c.st<a?c.st:a, new Date());
      const tenureM=Math.round((now-earliest)/864e5/30);
      if(tenureM<3) score-=10;
      score=Math.max(0,Math.min(100,score));
      const status=score>=80?'healthy':score>=50?'warning':'critical';
      res.push({name, mrr, score, status, daysToEnd, debt:d?d.oyQarz:0, tenureM});
    });

    debt.forEach(d => {
      if(d.oyQarz > 0 && !clients.has(d.name)){
        let score = d.oyQarz > 500 ? 30 : 50;
        const status = score >= 50 ? 'warning' : 'critical';
        const earliest = firstDates[d.name] || now;
        const tenureM = Math.round((now - earliest) / 864e5 / 30);
        res.push({name: d.name, mrr: 0, score, status, daysToEnd: -999, debt: d.oyQarz, tenureM});
      }
    });

    res.sort((a,b)=>a.score-b.score);
    return res;
  });
}

// === COHORT ANALYSIS ===
function calcCohorts() {
  return cached('cohorts_v1',()=>{
    const clStart = {};
    const {all, qAll} = buildContracts();
    const now = new Date();
    all.filter(c=>c.musd>0).forEach(c=>{
        const st = new Date(c.st.getFullYear(), c.st.getMonth(), 1);
        if(!clStart[c.client] || st < clStart[c.client]) clStart[c.client] = st;
    });
    const cohorts = {};
    Object.keys(clStart).forEach(cn => {
        const sd = clStart[cn];
        const key = sd.getFullYear()+'-'+String(sd.getMonth()+1).padStart(2,'0');
        if(!cohorts[key]) cohorts[key] = { date: sd, clients: [] };
        if(sd.getFullYear() >= 2024) cohorts[key].clients.push(cn);
    });
    const keys = Object.keys(cohorts).sort((a,b)=>cohorts[a].date - cohorts[b].date);
    return keys.map(k => {
        const cgt = cohorts[k];
        const row = { name: k, total: cgt.clients.length, months: [] };
        if(row.total === 0) return row;
        const y = cgt.date.getFullYear(), m = cgt.date.getMonth();
        const diffMonths = (now.getFullYear() - y)*12 + (now.getMonth() - m);
        
        for(let i=0; i<=diffMonths; i++) {
            const tDate = new Date(y, m + i + 1, 0, 23, 59, 59);
            if(tDate > new Date(now.getFullYear(), now.getMonth()+1, 0)) break;
            
            let active = 0;
            cgt.clients.forEach(cn => {
                const isAct = all.concat(qAll).some(x => x.client===cn && x.musd!==0 && x.st<=tDate && x.endD>=tDate);
                if(isAct) active++;
            });
            row.months.push(active);
        }
        return row;
    }).filter(r=>r.total>0);
  });
}
 
function calcManagerAcquisition() {
    return cached('managerAcq', () => {
        const clients = {};
        S.rows.forEach(r => {
            if (!r.Client || !r.sanasi) return;
            const name = r.Client;
            const mrr = r._mUSD || 0;
            const st = pd(r.sanasi);
            if (!st) return;

            if (!clients[name]) {
                const mgrRaw = r.Manager || 'Tayinlanmagan';
                clients[name] = { 
                    managers: new Set(mgrRaw.split(',').map(n => n.trim()).filter(Boolean)), 
                    firstMRR: mrr, 
                    firstDate: st 
                };
            } else {
                if (st < clients[name].firstDate) {
                    const mgrRaw = r.Manager || 'Tayinlanmagan';
                    clients[name].managers = new Set(mgrRaw.split(',').map(n => n.trim()).filter(Boolean));
                    clients[name].firstMRR = mrr;
                    clients[name].firstDate = st;
                }
            }
        });

        const mgrs = {};
        Object.entries(clients).forEach(([name, data]) => {
            const mSet = data.managers;
            const count = mSet.size;
            const splitMRR = data.firstMRR / count;
            mSet.forEach(m => {
                if (!mgrs[m]) mgrs[m] = { clients: 0, initialMRR: 0 };
                mgrs[m].clients += 1;
                mgrs[m].initialMRR += splitMRR;
            });
        });

        return Object.entries(mgrs).map(([name, d]) => ({ name, ...d })).sort((a,b) => b.initialMRR - a.initialMRR);
    });
}

// === MRR DATA ===
function mrrData(year){
  year=year||S.mrrYear||2026;
  const cacheKey='mrr_'+year;
  return cached(cacheKey,()=>{
    const now=new Date();
    const allC={};
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);const c=r.Client;if(!allC[c])allC[c]=[];allC[c].push({musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',sanasi:r.sanasi||'',amal:r['amal qilishi']||''})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);const c=r.Client;if(!allC[c])allC[c]=[];allC[c].push({musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',sanasi:r.sanasi||'',amal:r['amal qilishi']||'',isQ:true})});
    
    const cmap={};
    Object.entries(allC).forEach(([name,contracts])=>{
      const paid=contracts.filter(ct=>ct.musd!==0);
      if(!paid.length) return;
      
      const mains = contracts.filter(c => !c.isQ).sort((a,b)=>a.st-b.st);
      if(!mains.length) return; // Qo'shimchani o'zi bo'lsa, mijoz sanalmaydi
      
      const firstMgr=mains[0].mgr, firstDeal=mains[0].sanasi, firstSt=mains[0].st;
      const latest=mains.reduce((a,b)=>b.endD>a.endD?b:a,mains[0]);
      
      const monthly=new Array(12).fill(0);
      
      for(let m=0; m<12; m++) {
        const mS = new Date(year, m, 1);
        const mE = new Date(year, m + 1, 0, 23, 59, 59);
        const act = paid.filter(ct => ct.st <= mE && ct.endD >= mS);
        
        if(!act.length) continue;
        
        // MRR for this month — check which contracts are active on month-end date
        let dayMrr = 0;
        for(let i=0; i<act.length; i++) {
            const ct = act[i];
            if(ct.st <= mE && ct.endD >= mE) {
                dayMrr += ct.musd;
            }
        }
        // If no contract active on month-end (mid-month transition), check month-start
        if(dayMrr===0){
          for(let i=0; i<act.length; i++) {
            const ct = act[i];
            if(ct.st <= mS && ct.endD >= mS) {
              dayMrr += ct.musd;
            }
          }
        }
        monthly[m] = dayMrr;
      }
      
      if(Math.max(...monthly) > 0) {
          cmap[name]={name,mgr:firstMgr,hudud:mains[0].hudud,mrr:0,dealStart:firstDeal,dealEnd:latest.amal,startDate:firstSt,monthly};
      }
    });

    const curM=now.getFullYear()===year?now.getMonth():(year<now.getFullYear()?11:0);
    Object.values(cmap).forEach(c=>{c.mrr=c.monthly[curM]||Math.max(...c.monthly)});
    const clients=Object.values(cmap).sort((a,b)=>(a.startDate||0)-(b.startDate||0));
    
    const totals=new Array(12).fill(0);
    clients.forEach(c=>c.monthly.forEach((v,i)=>totals[i]+=v));
    
    let prevDec=0;
    const pdS=new Date(year-1, 11, 1);
    const pdE=new Date(year-1, 11, 31, 23, 59, 59);
    Object.values(allC).forEach(contracts=>{
        const paid=contracts.filter(ct=>ct.musd>0);
        if(!paid.length) return;
        const act=paid.filter(ct=>ct.st<=pdE && ct.endD>=pdS);
        if(!act.length) return;
        
        let dayMrr = 0;
        for(let i=0; i<act.length; i++) {
            const ct = act[i];
            if(ct.st <= pdE && ct.endD >= pdE) {
                dayMrr += ct.musd;
            }
        }
        prevDec += dayMrr;
    });
    
    const mom=totals.map((v,i)=>{const prev=i===0?prevDec:totals[i-1];return prev?((v-prev)/prev*100):0});
    const cSets=Array.from({length:12},()=>new Set());
    clients.forEach(c=>c.monthly.forEach((v,i)=>{if(v>0)cSets[i].add(c.name)}));
    const cpm=cSets.map(s=>s.size);
    const prevDecCl=new Set();clients.forEach(c=>{const pAct=(allC[c.name]||[]).filter(ct=>ct.musd>0&&ct.st<=pdE&&ct.endD>=pdE);if(pAct.length)prevDecCl.add(c.name)});
    const newPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).length});
    const churnPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...prev].filter(n=>!s.has(n)).length});
    const newNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n))});
    const churnNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...prev].filter(n=>!s.has(n))});
    const everBefore=Array.from({length:12},()=>new Set());const preYear=new Set();const yrStart=new Date(year,0,1);
    Object.entries(allC).forEach(([name,cts])=>{if(cts.some(ct=>ct.musd>0&&ct.endD<yrStart))preYear.add(name)});
    prevDecCl.forEach(n=>preYear.add(n));
    for(let m=0;m<12;m++){preYear.forEach(n=>everBefore[m].add(n));for(let j=0;j<m;j++)cSets[j].forEach(n=>everBefore[m].add(n))}
    const rechurnPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).filter(n=>everBefore[i].has(n)).length});
    const rechurnNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).filter(n=>everBefore[i].has(n))});
    const mrrChange=totals.map((v,i)=>{const prev=i===0?prevDec:totals[i-1];return v-prev});
    return{clients,totals,mom,year,cpm,newPM,churnPM,newNames,churnNames,rechurnPM,rechurnNames,mrrChange,prevDec};
  });
}

// === CUM EXPECTED ===
function calcCumExpected(year){
  return cached('cumExp_'+year,()=>{
    const result={};const allCts={};
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st||!r._mUSD||r._mUSD<=0)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd:r._mUSD,tUSD:r._tUSD||0,st,endD,isQ:false})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const musd=pn(r['Oylik USD']);if(!musd)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd,tUSD:pn(r['Tadbiq USD'])||0,st,endD,isQ:true})});
    Object.entries(allCts).forEach(([name,cts])=>{
      // Precompute firstMP and lastMP per contract (mirrors calcDebtTable logic)
      cts.forEach(ct=>{
        const fmE=new Date(ct.st.getFullYear(),ct.st.getMonth()+1,0);
        const on1st=ct.st.getDate()===1;
        ct._fmp=on1st?ct.musd:Math.round(ct.musd*Math.max(1,Math.round((fmE-ct.st)/864e5)+1)/fmE.getDate());
        if(!ct.isQ){
          const lmE=new Date(ct.endD.getFullYear(),ct.endD.getMonth()+1,0);
          ct._lmp=on1st
            ?(ct.endD.getDate()===lmE.getDate()?ct.musd:Math.round(ct.musd*ct.endD.getDate()/lmE.getDate()))
            :ct.musd-ct._fmp;
        }
      });
      const minSt=cts.reduce((a,c)=>c.st<a?c.st:a,cts[0].st);
      let cumTotal=0,preYear=0;const cum12=new Array(12).fill(0);
      for(let y=minSt.getFullYear();y<=year;y++){
        const m0=(y===minSt.getFullYear()?minSt.getMonth():0);
        for(let m=m0;m<=11;m++){
          const mS=new Date(y,m,1),mE=new Date(y,m+1,0);const dim=mE.getDate();let monthExp=0;
          cts.forEach(ct=>{if(ct.st>mE||ct.endD<mS)return;const isFirst=(ct.st>=mS&&ct.st<=mE),isLast=(ct.endD>=mS&&ct.endD<=mE);
            if(isFirst)monthExp+=ct.tUSD||0;
            if(isFirst&&isLast){monthExp+=Math.round(ct.musd*Math.max(1,Math.round((ct.endD-ct.st)/864e5)+1)/dim)}
            else if(isFirst){monthExp+=ct._fmp}
            else if(isLast&&!ct.isQ){monthExp+=ct._lmp}
            else if(isLast&&ct.isQ){monthExp+=Math.round(ct.musd*Math.max(1,ct.endD.getDate())/dim)}
            else{monthExp+=ct.musd}
          });
          cumTotal+=monthExp;if(y===year)cum12[m]=Math.round(cumTotal);
        }
        if(y===year-1)preYear=Math.round(cumTotal);
      }
      result[name]={cum:cum12,preYear};
    });
    return result;
  });
}

// === CUM EXPECTED UZS ===
function calcCumExpectedUZS(year){
  return cached('cumExpUZS_'+year,()=>{
    const result={};const allCts={};
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st||!r._mUZS||r._mUZS<=0)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);endD.setHours(23,59,59,999);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd:r._mUZS,tUSD:r._tUZS||0,st,endD,isQ:false})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const musd=pn(r['oylik UZS']);if(!musd)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd,tUSD:pn(r['Tadbiq UZS'])||0,st,endD,isQ:true})});
    Object.entries(allCts).forEach(([name,cts])=>{
      cts.forEach(ct=>{
        const fmE=new Date(ct.st.getFullYear(),ct.st.getMonth()+1,0);
        const on1st=ct.st.getDate()===1;
        ct._fmp=on1st?ct.musd:Math.round(ct.musd*Math.max(1,Math.round((fmE-ct.st)/864e5)+1)/fmE.getDate());
        if(!ct.isQ){
          const lmE=new Date(ct.endD.getFullYear(),ct.endD.getMonth()+1,0);
          ct._lmp=on1st
            ?(ct.endD.getDate()===lmE.getDate()?ct.musd:Math.round(ct.musd*ct.endD.getDate()/lmE.getDate()))
            :ct.musd-ct._fmp;
        }
      });
      const minSt=cts.reduce((a,c)=>c.st<a?c.st:a,cts[0].st);
      let cumTotal=0,preYear=0;const cum12=new Array(12).fill(0);
      for(let y=minSt.getFullYear();y<=year;y++){
        const m0=(y===minSt.getFullYear()?minSt.getMonth():0);
        for(let m=m0;m<=11;m++){
          const mS=new Date(y,m,1),mE=new Date(y,m+1,0);const dim=mE.getDate();let monthExp=0;
          cts.forEach(ct=>{if(ct.st>mE||ct.endD<mS)return;const isFirst=(ct.st>=mS&&ct.st<=mE),isLast=(ct.endD>=mS&&ct.endD<=mE);
            if(isFirst)monthExp+=ct.tUSD||0;
            if(isFirst&&isLast){monthExp+=Math.round(ct.musd*Math.max(1,Math.round((ct.endD-ct.st)/864e5)+1)/dim)}
            else if(isFirst){monthExp+=ct._fmp}
            else if(isLast&&!ct.isQ){monthExp+=ct._lmp}
            else if(isLast&&ct.isQ){monthExp+=Math.round(ct.musd*Math.max(1,ct.endD.getDate())/dim)}
            else{monthExp+=ct.musd}
          });
          cumTotal+=monthExp;if(y===year)cum12[m]=Math.round(cumTotal);
        }
        if(y===year-1)preYear=Math.round(cumTotal);
      }
      result[name]={cum:cum12,preYear};
    });
    return result;
  });
}

// === DATA AUDIT ===
function calcDataAudit(){
  return cached('dataAudit_v2',()=>{
    const issues=[];
    const clientContracts={};
    S.rows.forEach(r=>{
      if(!r.Client||!r.sanasi)return;
      const c=r.Client.trim();
      if(!clientContracts[c])clientContracts[c]=[];
      const st=pd(r.sanasi),en=pd(r['amal qilishi']);
      if(!st)return;
      const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);
      clientContracts[c].push({raqami:r.raqami||'',st,endD,sanasi:r.sanasi,amal:r['amal qilishi']||'',musd:r._mUSD||0,sUSD:r._sUSD||0,dur:r._dur||0,status:r.status||'',firma:r['Firma nomi']||''});
    });

    Object.entries(clientContracts).forEach(([name,cts])=>{
      if(cts.length<2)return;
      const sorted=[...cts].sort((a,b)=>a.st-b.st);

      for(let i=0;i<sorted.length-1;i++){
        const cur=sorted[i],next=sorted[i+1];

        // 1. Yangi shartnoma eski tugashidan oldin boshlangan (overlap)
        // Firmasi turli va sanalari aynan bir xil bo'lsa — bu parallel shartnomalar, xatolik emas
        const sameDate=cur.st.getTime()===next.st.getTime()&&cur.endD.getTime()===next.endD.getTime();
        const diffFirma=cur.firma&&next.firma&&cur.firma!==next.firma;
        if(next.st<=cur.endD&&!(sameDate&&diffFirma)){
          const gap=Math.round((cur.endD-next.st)/864e5);
          issues.push({
            client:name,raqami:next.raqami,
            type:'Sanalar ustma-ust',
            detail:`"${cur.raqami}" ${cur.amal} da tugaydi, "${next.raqami}" ${next.sanasi} da boshlangan. ${gap} kun ustma-ust. MRR ikki marta hisoblanishi mumkin.`
          });
        }

        // 2. Shartnomalar orasida bo'shliq (gap)
        const gapDays=Math.round((next.st-cur.endD)/864e5);
        if(gapDays>30){
          issues.push({
            client:name,raqami:next.raqami,
            type:'Uzilish',
            detail:`"${cur.raqami}" ${cur.amal} da tugagan, "${next.raqami}" ${next.sanasi} da boshlangan. ${gapDays} kun uzilish.`
          });
        }
      }
    });

    // 3. Oylik MRR = 0 bo'lgan aktiv shartnomalar
    S.rows.forEach(r=>{
      if(!r.Client||!r.sanasi)return;
      const st=pd(r.sanasi),en=pd(r['amal qilishi']);
      if(!st)return;
      const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);
      const now=new Date();
      if(st<=now&&endD>=now&&(r._mUSD||0)===0&&(r._sUSD||0)>0){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'MRR nol',
          detail:`Aktiv shartnoma (${r.sanasi} — ${r['amal qilishi']||'?'}), jami $${fmt(r._sUSD||0)} lekin oylik MRR $0.`
        });
      }
    });

    // 4. Tugash sanasi yo'q
    S.rows.forEach(r=>{
      if(!r.Client||!r.sanasi)return;
      if(!r['amal qilishi']&&(r._mUSD||0)>0){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Tugash sanasi yo\'q',
          detail:`Shartnoma ${r.sanasi} da boshlangan, muddati ${r._dur||'?'} oy, lekin tugash sanasi kiritilmagan.`
        });
      }
    });

    // 5. Jami summa va (oylik × muddat) mos kelmaydi
    S.rows.forEach(r=>{
      if(!r.Client||!r.sanasi||!r._mUSD||!r._dur)return;
      const expected=Math.round(r._mUSD*r._dur);
      const actual=Math.round(r._sUSD||0);
      const diff=Math.abs(expected-actual);
      if(diff>0&&actual>0){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Summa nomuvofiq',
          detail:`Oylik $${fmt(r._mUSD)} × ${r._dur} oy = $${fmt(expected)}, lekin jami $${fmt(actual)} kiritilgan. Farq: $${fmt(diff)}.`
        });
      }
    });

    // 6. To'lov shartnomaga bog'lanmagan
    const pm=calcPayments();
    const contractKeys=new Set();
    S.rows.forEach(r=>{if(r.Client&&r.raqami)contractKeys.add(r.Client.trim()+'|'+r.raqami.trim())});
    Object.entries(pm).forEach(([k,v])=>{
      if(v.total>0&&!contractKeys.has(k)){
        issues.push({
          client:v.client,raqami:v.shartnoma,
          type:'Bog\'lanmagan to\'lov',
          detail:`$${fmt(v.total)} to'lov "${v.shartnoma}" shartnomaga bog'langan, lekin bunday shartnoma topilmadi.`
        });
      }
    });

    // 7. Takroriy shartnoma raqami
    const raqamCount={};
    S.rows.forEach(r=>{
      if(!r.raqami)return;
      const k=r.raqami.trim();
      if(!raqamCount[k])raqamCount[k]=[];
      raqamCount[k].push(r.Client||'?');
    });
    Object.entries(raqamCount).forEach(([raq,clients])=>{
      if(clients.length>1){
        issues.push({
          client:clients.join(', '),raqami:raq,
          type:'Takroriy raqam',
          detail:`"${raq}" shartnoma raqami ${clients.length} marta ishlatilgan: ${clients.join(', ')}.`
        });
      }
    });

    // 8. Qo'shimcha kelishuv sanasi shartnomadan mos kelmaydi
    const mainByClientRaqami={};
    S.rows.forEach(r=>{if(r.raqami&&r.Client){const en=pd(r['amal qilishi']);const st=pd(r.sanasi);if(en)mainByClientRaqami[r.Client.trim()+'|'+r.raqami.trim()]={endD:en,st,client:r.Client,amal:r['amal qilishi']||''}}});
    S.qRows.forEach(r=>{
      if(!r.Client||!r.raqami||!r.sanasi)return;
      const main=mainByClientRaqami[r.Client.trim()+'|'+r.raqami.trim()];
      if(!main)return;
      const qEnd=pd(r['amal qilishi']);
      if(!qEnd)return;
      const diff=Math.round((qEnd-main.endD)/864e5);
      if(diff>0){
        issues.push({
          client:r.Client,raqami:r.raqami,
          type:'Qo\'shimcha sana xato',
          detail:`Qo'shimcha kelishuv ${r['amal qilishi']} da tugaydi, asosiy shartnoma ${main.amal} da tugaydi. ${diff} kun keyinroq — shartnomadan oshib ketgan.`
        });
      } else if(diff>=-7&&diff<0){
        issues.push({
          client:r.Client,raqami:r.raqami,
          type:'Qo\'shimcha sana xato',
          detail:`Qo'shimcha kelishuv ${r['amal qilishi']} da tugaydi, asosiy shartnoma ${main.amal} da tugaydi. ${Math.abs(diff)} kun oldinroq — shartnoma bilan mos emas.`
        });
      }
    });

    // 9. Valyuta farqi — USD va UZS qoldiqlarni solishtirish
    S.rows.forEach(r=>{
      if(!r.Client||!r.raqami)return;
      const k=r.Client+'|'+r.raqami;
      const p=pm[k]||{total:0};
      const sUSD=r._sUSD||0;
      const sUZS=r._sUZS||0;
      if(!sUSD&&!sUZS)return;
      const qoldiqUSD=Math.round(sUSD-p.total);
      // UZS to'lovlarni hisoblash
      let paidUZS=0;
      S.payRows.forEach(pr=>{
        if(pr.Client?.trim()!==r.Client||pr.shartnoma?.trim()!==r.raqami?.trim())return;
        const val=(pr.Valyuta||'USD').toUpperCase();
        if(val==='UZS'||val==='SUM')paidUZS+=pn(pr.summasi||'0');
      });
      const qoldiqUZS=sUZS>0?Math.round(sUZS-paidUZS):0;
      // USD da yopilgan, UZS da qarz yoki aksincha
      if(Math.abs(qoldiqUSD)<=1&&sUZS>0&&Math.abs(qoldiqUZS)>1000){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Valyuta farqi',
          detail:`USD bo'yicha yopilgan (qoldiq: $${fmt(qoldiqUSD)}), lekin UZS bo'yicha ${qoldiqUZS>0?fmt(qoldiqUZS)+' so\'m qarz':fmt(Math.abs(qoldiqUZS))+' so\'m ortiqcha'}.`
        });
      } else if(qoldiqUSD>10&&sUZS>0&&Math.abs(qoldiqUZS)<=1000){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Valyuta farqi',
          detail:`USD bo'yicha $${fmt(qoldiqUSD)} qarz, lekin UZS bo'yicha yopilgan (${fmt(qoldiqUZS)} so'm).`
        });
      } else if(qoldiqUSD<-10&&sUZS>0&&qoldiqUZS>1000){
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Valyuta farqi',
          detail:`USD bo'yicha $${fmt(Math.abs(qoldiqUSD))} ortiqcha, lekin UZS bo'yicha ${fmt(qoldiqUZS)} so'm qarz. Kurs farqi bo'lishi mumkin.`
        });
      }
    });

    // 10. To'lov shartnomaga mos emas (to'langan > jami summa, 10% dan ko'p)
    S.rows.forEach(r=>{
      if(!r.Client||!r.raqami)return;
      const k=r.Client+'|'+r.raqami;
      const p=pm[k]||{total:0};
      const sUSD=r._sUSD||0;
      if(sUSD>0&&p.total>sUSD*1.1){
        const ortiqcha=Math.round(p.total-sUSD);
        issues.push({
          client:r.Client,raqami:r.raqami||'',
          type:'Ortiqcha to\'lov',
          detail:`Shartnoma jami: $${fmt(sUSD)}, to'langan: $${fmt(p.total)}. $${fmt(ortiqcha)} ortiqcha — noto'g'ri bog'lanish yoki kurs farqi.`
        });
      }
    });

    issues.sort((a,b)=>{
      const order={'Takroriy raqam':0,'Sanalar ustma-ust':1,'Qo\'shimcha sana xato':2,'Valyuta farqi':3,'Ortiqcha to\'lov':4,'Summa nomuvofiq':5,'MRR nol':6,'Tugash sanasi yo\'q':7,'Uzilish':8,'Bog\'lanmagan to\'lov':9};
      return(order[a.type]||99)-(order[b.type]||99);
    });
    return issues;
  });
}

// === QARZDOR START DATE (cumExp based) ===
function _findQarzdorDate(name,totalPaid){
  const now=new Date();
  const ceYear=now.getFullYear();
  const ce=calcCumExpected(ceYear)[name];
  const cePrev=calcCumExpected(ceYear-1)[name];
  if(!ce&&!cePrev)return null;
  // Find earliest contract start date for this client
  let firstSt=null;
  S.rows.forEach(r=>{if(r.Client?.trim()===name){const d=pd(r.sanasi);if(d&&(!firstSt||d<firstSt))firstSt=d}});
  S.qRows.forEach(r=>{if(r.Client?.trim()===name){const d=pd(r.sanasi);if(d&&(!firstSt||d<firstSt))firstSt=d}});
  const allCums=[];
  if(cePrev){for(let m=0;m<12;m++)allCums.push({y:ceYear-1,m,cum:cePrev.cum[m]})}
  if(ce){for(let m=0;m<12;m++)allCums.push({y:ceYear,m,cum:ce.cum[m]})}
  let lastPaidIdx=-1;
  for(let i=0;i<allCums.length;i++){
    if(allCums[i].cum>0&&allCums[i].cum<=totalPaid)lastPaidIdx=i;
  }
  let debtIdx=-1;
  for(let i=0;i<allCums.length;i++){
    if(allCums[i].cum>totalPaid&&allCums[i].cum>0){debtIdx=i;break;}
  }
  let result=null;
  if(lastPaidIdx>=0&&lastPaidIdx+1<allCums.length&&allCums[lastPaidIdx+1].cum>totalPaid){
    const lp=allCums[lastPaidIdx],nx=allCums[lastPaidIdx+1];
    const monthPortion=nx.cum-lp.cum;
    const overpaid=totalPaid-lp.cum;
    const dim=new Date(nx.y,nx.m+1,0).getDate();
    const daysCovered=monthPortion>0?Math.floor(overpaid/monthPortion*dim):0;
    result=new Date(nx.y,nx.m,Math.min(daysCovered+1,dim));
  } else if(debtIdx>=0){
    const de=allCums[debtIdx];
    const prevCum=debtIdx>0?allCums[debtIdx-1].cum:0;
    const monthPortion=de.cum-(prevCum||0);
    const overpaid=totalPaid-(prevCum||0);
    const dim=new Date(de.y,de.m+1,0).getDate();
    const daysCovered=monthPortion>0?Math.max(0,Math.floor(overpaid/monthPortion*dim)):0;
    result=new Date(de.y,de.m,Math.min(daysCovered+1,dim));
  }
  // Qarzdor sanasi birinchi shartnoma boshlanishidan oldin bo'lmasligi kerak
  if(result&&firstSt&&result<firstSt)result=firstSt;
  return result;
}

// === AR AGING ===
function calcARaging(){
  return cached('arAging_v2',()=>{
    const now=new Date();
    const dt=calcDebtTable(now);
    const lp=calcLastPayments();
    const pm=calcPayments();
    const clPay={};
    Object.values(pm).forEach(v=>{clPay[v.client]=(clPay[v.client]||0)+v.total});
    const buckets=[
      {label:'0–30 kun',min:0,max:30,color:'var(--amber)',tag:'b-amber',clients:[],total:0},
      {label:'31–60 kun',min:31,max:60,color:'var(--red)',tag:'b-red',clients:[],total:0},
      {label:'61–90 kun',min:61,max:90,color:'var(--red)',tag:'b-red',clients:[],total:0},
      {label:'90+ kun',min:91,max:9999,color:'var(--purple)',tag:'b-purple',clients:[],total:0}
    ];
    dt.forEach(d=>{
      if(d.oyQarz<=0)return;
      const lastP=lp[d.name];
      const totalPaid=clPay[d.name]||0;
      const qarzdorDate=_findQarzdorDate(d.name,totalPaid);
      const days=qarzdorDate?Math.round((now-qarzdorDate)/864e5):(lastP?Math.round((now-lastP.date)/864e5):999);
      const b=days<=30?buckets[0]:days<=60?buckets[1]:days<=90?buckets[2]:buckets[3];
      b.clients.push({name:d.name,qarz:d.oyQarz,kelQarz:d.kelQarz,days,lastPayDate:lastP?lastP.dateStr:'Hech qachon'});
      b.total+=d.oyQarz;
    });
    return buckets;
  });
}

// === GROWTH-BASED MRR FORECAST (6 oy) ===
function calcGrowthForecast(){
  return cached('growthForecast_v1',()=>{
    const now=new Date();
    const {all,qAll}=buildContracts();
    const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    // Analyze last 12 months: new clients, churn, MRR changes
    const monthlyNew=[], monthlyChurn=[], monthlyMRR=[];
    for(let i=12;i>=1;i--){
      const absM=now.getMonth()-i;
      const y=now.getFullYear()+Math.floor(absM/12);
      const m=((absM%12)+12)%12;
      const mStart=new Date(y,m,1);
      const mEnd=new Date(y,m+1,0,23,59,59);
      const prevEnd=new Date(y,m,0,23,59,59);
      const snapCur=mrrOnDate(mEnd,all,qAll);
      const snapPrev=mrrOnDate(prevEnd,all,qAll);
      const newC=[...snapCur.active].filter(c=>!snapPrev.active.has(c));
      const churnC=[...snapPrev.active].filter(c=>!snapCur.active.has(c));
      monthlyNew.push(newC.length);
      monthlyChurn.push(churnC.length);
      monthlyMRR.push(snapCur.total);
    }
    // Average monthly rates
    const avgNew=Math.round(monthlyNew.reduce((s,v)=>s+v,0)/monthlyNew.length);
    const avgChurn=Math.round(monthlyChurn.reduce((s,v)=>s+v,0)/monthlyChurn.length);
    // Average MRR growth rate
    const mrrChanges=[];
    for(let i=1;i<monthlyMRR.length;i++){
      if(monthlyMRR[i-1]>0) mrrChanges.push(monthlyMRR[i]/monthlyMRR[i-1]);
    }
    const avgGrowthRate=mrrChanges.length?mrrChanges.reduce((s,v)=>s+v,0)/mrrChanges.length:1;
    // Current snapshot
    const curSnap=mrrOnDate(now,all,qAll);
    let projMRR=curSnap.total;
    let projClients=curSnap.active.size;
    const result=[];
    for(let i=0;i<=5;i++){
      const absM=now.getMonth()+i;
      const y=now.getFullYear()+Math.floor(absM/12);
      const m=absM%12;
      if(i===0){
        result.push({label:mos[m]+' \''+(y%100),mrr:Math.round(projMRR),clients:projClients,newPerMonth:avgNew,churnPerMonth:avgChurn});
      } else {
        projMRR=Math.round(projMRR*avgGrowthRate);
        projClients=Math.max(0,projClients+avgNew-avgChurn);
        result.push({label:mos[m]+' \''+(y%100),mrr:projMRR,clients:projClients,newPerMonth:avgNew,churnPerMonth:avgChurn});
      }
    }
    return result;
  });
}

// === MRR FORECAST (6 oy) ===
function calcMrrForecast(){
  return cached('mrrForecast_v1',()=>{
    const now=new Date();
    const {all,qAll}=buildContracts();
    const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    const months=[];
    for(let i=0;i<=5;i++){
      const absM=now.getMonth()+i;
      const y=now.getFullYear()+Math.floor(absM/12);
      const m=absM%12;
      const mEnd=new Date(y,m+1,0,23,59,59);
      const snap=mrrOnDate(mEnd,all,qAll);
      const expiring=all.concat(qAll).filter(c=>c.musd>0&&c.endD.getFullYear()===y&&c.endD.getMonth()===m);
      const expiringMRR=Math.round(expiring.reduce((s,c)=>s+c.musd,0));
      months.push({
        label:mos[m]+' \''+(y%100),
        mrr:Math.round(snap.total),
        clients:snap.active.size,
        expiringMRR,
        expiringCount:expiring.length,
        expiring:expiring.map(c=>({name:c.client,mrr:c.musd,mgr:c.mgr}))
      });
    }
    return months;
  });
}

// === INKASSO / COLLECTION RATE ===
function calcCollectionRate(mode){
  mode=mode||S.inkassoMode||'oy';
  return cached('collRate_v3_'+mode,()=>{
    const now=new Date();
    const curM=now.getMonth();
    const cumExp=calcCumExpected(now.getFullYear());
    const pm=calcPayments();
    const clientPaid={};
    Object.values(pm).forEach(v=>{clientPaid[v.client]=(clientPaid[v.client]||0)+v.total});

    // Shu oy davomida to'langan summani hisoblash
    const monthPaid={};
    const mS=new Date(now.getFullYear(),curM,1);
    const addMonthPay=(rows,dateK,usdK)=>{
      if(!rows)return;
      rows.forEach(r=>{
        const c=r.Client?.trim();if(!c)return;
        const d=pd(r[dateK]);if(!d)return;
        if(d>=mS&&d<=now){monthPaid[c]=(monthPaid[c]||0)+pn(r[usdK]||'0')}
      });
    };
    addMonthPay(S.payRows,'sanasi','USD');
    addMonthPay(S.y2024Rows,'sanasi','USD');

    if(mode==='kelishuv'){
      // Kelishuv bo'yicha: calcDebtTable dan
      const dt=calcDebtTable(now);
      return dt.map(d=>{
        const mPaid=Math.round(monthPaid[d.name]||0);
        const oyBoshi=d.kelQarz+mPaid; // oy boshida qarz = hozirgi qarz + shu oyda to'langan
        const expected=Math.max(0,oyBoshi);
        if(expected<1)return null;
        const rate=expected>0?Math.round(mPaid/expected*100):0;
        return{name:d.name,expected,paid:mPaid,rate,delta:mPaid-expected};
      }).filter(Boolean).sort((a,b)=>a.rate-b.rate);
    }

    // Oy oxiri: cumExp dan
    return Object.entries(cumExp).map(([name,data])=>{
      const cumCur=data.cum[curM]||0;
      const cumPrev=curM>0?(data.cum[curM-1]||0):data.preYear;
      const totalPaid=clientPaid[name]||0;
      const mPaid=Math.round(monthPaid[name]||0);
      // Oy boshidagi qarz (oldingi oygacha kutilgan - oy boshigacha to'langan)
      const paidBeforeMonth=totalPaid-mPaid; // shu oydan oldin to'langan
      const oyBoshiQarz=Math.round(cumPrev-paidBeforeMonth);
      // Shu oy kutilgani
      const oyKutilgan=Math.round(cumCur-cumPrev);
      // Agar oy boshida ortiqcha to'langan bo'lsa, kutilgandan ayirish
      const expected=Math.max(0,oyBoshiQarz+oyKutilgan);
      if(expected<1)return null;
      const rate=expected>0?Math.round(mPaid/expected*100):0;
      return{name,expected,paid:mPaid,rate,delta:mPaid-expected};
    }).filter(Boolean).sort((a,b)=>a.rate-b.rate);
  });
}

// === RENDER ===
let _rdT;function render(){clearTimeout(_rdT);_rdT=setTimeout(_render,0)}
let _lastSec=null;
function _render(){
  if(!S.rows.length){showWelcome();return}
  const ae=document.activeElement;const isInput=ae&&ae.tagName==='INPUT'&&ae.type==='text';
  const sel=isInput?{s:ae.selectionStart,e:ae.selectionEnd,sec:S.sec,ph:ae.placeholder}:null;
  const f={dashboard:rD,contracts:rC,mrrtable:rMRR,managers:rM,clients:rCl,topmrr:rT,debts:rDebt,moliya:rMoliya};
  // Save scroll positions before re-render
  const tbl=document.querySelector('.tbl-scroll');
  const savedTop=tbl?tbl.scrollTop:0;
  const savedLeft=tbl?tbl.scrollLeft:0;
  const root=document.getElementById('root');
  const secChanged=_lastSec!==S.sec;
  _lastSec=S.sec;
  const html=(f[S.sec]||rD)();
  root.innerHTML=secChanged?'<div class="page-enter">'+html+'</div>':html;
  iC();
  // Sync clients sub-nav active state
  const clientsSub=document.getElementById('clients-sub');
  if(clientsSub&&S.sec==='clients'){
    clientsSub.querySelectorAll('.nav-sub-item').forEach(el=>{
      el.classList.toggle('active',el.dataset.clview===(S.clView||'umumiy'));
    });
  }
  // Restore scroll positions after re-render (prevents jitter)
  if(!secChanged&&(savedTop>0||savedLeft>0)){
    requestAnimationFrame(()=>{const t=document.querySelector('.tbl-scroll');if(t){t.scrollTop=savedTop;t.scrollLeft=savedLeft;}});
  }
  if(S.sec==='dashboard')requestAnimationFrame(animateNumbers);
  if(sel&&sel.sec===S.sec){const inp=document.querySelector('input[placeholder="'+sel.ph+'"]');if(inp){inp.focus();inp.setSelectionRange(sel.s,sel.e)}}
}

function animateNumbers(){
  document.querySelectorAll('.anim-val').forEach(el=>{
    const end=parseFloat(el.dataset.val)||0;
    const isFmt=el.dataset.fmt;
    const isSign=el.dataset.sign==='1';
    if(end===0){el.textContent=isFmt==='1'?fmt(0):isFmt==='2'?'0': '0';return}
    const dur=800,st=performance.now();
    const update=t=>{
      let p=(t-st)/dur;if(p>1)p=1;
      const cur=end*(p===1?1:1-Math.pow(2,-10*p));
      let txt=isFmt==='1'?((isSign&&cur>0?'+':'')+fmt(Math.round(cur))):isFmt==='2'?((isSign&&cur>0?'+':'')+fk(cur)):Math.round(cur).toString();
      el.textContent=txt;
      if(p<1)requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

// === PAGINATION ===
function pag(p,t,c,n,k){if(t<=1)return'';return`<div class="pager"><span>${p*n+1}–${Math.min((p+1)*n,c)} / ${c}</span><div class="pager-btns"><button class="pg" onclick="S.${k}=${p-1};render()"${p===0?' disabled':''}>←</button>${Array.from({length:Math.min(t,7)},(_,i)=>{let x=i;if(t>7){if(p<4)x=i;else if(p>t-5)x=t-7+i;else x=p-3+i}return`<button class="pg${x===p?' on':''}" onclick="S.${k}=${x};render()">${x+1}</button>`}).join('')}<button class="pg" onclick="S.${k}=${p+1};render()"${p>=t-1?' disabled':''}>→</button></div></div>`}

// === DEBOUNCED SEARCH HANDLERS ===
const _debouncedSearch=debounce(()=>{clearCache();render()},250);
function onSearch(field,val){S[field]=val;S.cP=0;S.clP=0;_debouncedSearch()}
function toggleAgingFilter(label){if(!S.arAgingFilter)S.arAgingFilter=[];var i=S.arAgingFilter.indexOf(label);if(i>=0)S.arAgingFilter.splice(i,1);else S.arAgingFilter.push(label);render()}

// === NAV ===
function initNav(){
  const mrrSub=document.getElementById('mrr-sub');
  const clientsSub=document.getElementById('clients-sub');
  document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    el.classList.add('active');
    S.sec=el.dataset.sec;
    if(mrrSub){
      if(S.sec==='mrrtable'){mrrSub.classList.add('open')}
      else{mrrSub.classList.remove('open')}
    }
    if(clientsSub){
      if(S.sec==='clients'){clientsSub.classList.add('open')}
      else{clientsSub.classList.remove('open')}
    }
    clearCache();render();closeSidebar();
  }));
  if(mrrSub){
    mrrSub.querySelectorAll('.nav-sub-item').forEach(el=>el.addEventListener('click',e=>{
      e.stopPropagation();
      mrrSub.querySelectorAll('.nav-sub-item').forEach(n=>n.classList.remove('active'));
      el.classList.add('active');
      S.mrrView=el.dataset.view;
      render();
    }));
  }
  if(clientsSub){
    clientsSub.querySelectorAll('.nav-sub-item').forEach(el=>el.addEventListener('click',e=>{
      e.stopPropagation();
      clientsSub.querySelectorAll('.nav-sub-item').forEach(n=>n.classList.remove('active'));
      el.classList.add('active');
      S.clView=el.dataset.clview;
      clearCache();render();
    }));
  }
}

function showMgrStats(mgrName) {
    const dr = dashRange();
    const cls = [];
    Object.keys(dr.clientMeta || {}).forEach(name => {
        const meta = dr.clientMeta[name];
        const mgrs = (meta.firstMgrs || '').split(',').map(n => n.trim()).filter(Boolean);
        if (mgrs.includes(mgrName)) {
            cls.push({
                name,
                date: meta.firstEver.st,
                mrr: meta.firstEver.musd
            });
        }
    });
    cls.sort((a,b) => b.date - a.date);

    const o = document.createElement('div');
    o.className = 'overlay';
    o.onclick = e => { if (e.target === o) o.remove(); };
    
    o.innerHTML = `<div class="modal" style="max-width:540px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
            <h3 style="margin:0;font-size:16px">${mgrName} — Mijozlar</h3>
            <button class="btn-close" onclick="this.closest('.overlay').remove()" style="background:none;border:none;cursor:pointer;color:var(--text3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="tbl-wrap" style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
            <table style="width:100%;border-collapse:collapse">
                <thead style="position:sticky;top:0;background:var(--bg2);z-index:10;box-shadow:0 1px 0 var(--border)">
                    <tr><th style="text-align:left;padding:10px">Mijoz</th><th style="padding:10px">Sana</th><th style="text-align:right;padding:10px">Olib kelgan MRR ($)</th></tr>
                </thead>
                <tbody>
                    ${cls.map(c => `<tr>
                        <td style="padding:10px;font-weight:600;font-size:12px">${c.name}</td>
                        <td style="padding:10px;text-align:center;font-size:11px" class="mono">${fmtD(c.date)}</td>
                        <td style="padding:10px;text-align:right;font-size:11px" class="mono">${fmt(c.mrr)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        ${cls.length === 0 ? '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Mijozlar topilmadi</div>' : ''}
        <div style="margin-top:20px;text-align:right">
            <button class="btn btn-primary" onclick="this.closest('.overlay').remove()">Yopish</button>
        </div>
    </div>`;
    document.body.appendChild(o);
}
