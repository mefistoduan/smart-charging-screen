/* ============================================================
   light/js/station.js — 蓝白极简 · 场站详情
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[light-st]', e.message); } }
  const { STATIONS, buildPiles } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const T2 = '#64748b', LINE = '#e6eaf1';
  const AXIS = { axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false }, axisLabel: { color: T2, fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9' } } };
  const TIP = { backgroundColor: '#fff', borderColor: LINE, textStyle: { color: '#1e293b', fontSize: 12 }, extraCssText: 'box-shadow:0 8px 24px rgba(15,23,42,.12);border-radius:8px;' };

  function updTime() { const d = new Date(); document.getElementById('upd').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  function init() {
    updTime(); setInterval(updTime, 5000);
    const qs = new URLSearchParams(location.search);
    const st = STATIONS.find((s) => s.id === qs.get('id')) || STATIONS[0];
    const piles = buildPiles(st);
    const cnt = { charging: 0, idle: 0, fault: 0, offline: 0 };
    piles.forEach((p) => cnt[p.status]++);
    const curPower = +piles.reduce((a, p) => a + (p.status === 'charging' ? p.power : 0), 0).toFixed(1);

    document.getElementById('st-name').innerHTML = `${st.name} <span>Station Detail · ${st.id}</span>`;
    document.getElementById('pile-pill').textContent = `${st.piles} 桩 · 快充 ${st.fast}`;

    /* 指标卡 */
    const defs = [
      { ic: '⚡', bg: '#ecfdf5', c: '#10b981', k: '实时功率', v: curPower, u: 'kW', d: 1, dd: `峰值能力 <b class="up">${st.fast * 150} kW</b>` },
      { ic: '🔋', bg: '#eff4ff', c: '#2563eb', k: '充电中', v: cnt.charging, u: '桩', d: 0, dd: `空闲 <b class="up">${cnt.idle}</b> 桩` },
      { ic: '⚡', bg: '#ecfdf5', c: '#10b981', k: '今日充电量', v: st.kwh, u: 'kWh', d: 0, dd: `<b class="up">↑ 正常</b> 运行` },
      { ic: '🧾', bg: '#f5f3ff', c: '#8b5cf6', k: '今日订单', v: st.orders, u: '单', d: 0, dd: '客单 <b>82.4</b> 元' },
      { ic: '💰', bg: '#fffbeb', c: '#f59e0b', k: '今日营收', v: st.income, u: '元', d: 0, dd: '均价 <b>1.42</b> 元/度' },
      { ic: '◎', bg: '#eff4ff', c: '#06b6d4', k: '桩位利用率', v: st.util, u: '%', d: 0, dd: `${{ normal: '正常', busy: '高负荷', alarm: '告警', offline: '检修' }[st.status]} 状态` },
    ];
    document.getElementById('metrics').innerHTML = defs.map((x) => `
      <div class="m-card"><span class="ic" style="background:${x.bg};color:${x.c}">${x.ic}</span>
        <span class="k">${x.k}</span><span class="v" style="color:${x.c}">0</span><span class="d">${x.dd}</span></div>`).join('');
    const mEls = [...document.querySelectorAll('.m-card .v')];
    function countUp(el, target, from = 0, digits = 0, unit = '', dur = 1200) {
      const t0 = performance.now();
      const timer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.innerHTML = fmt(from + (target - from) * e, digits) + (unit ? `<small>${unit}</small>` : '');
        if (p >= 1) clearInterval(timer);
      }, 33);
    }
    defs.forEach((x, i) => setTimeout(() => countUp(mEls[i], x.v, 0, x.d, x.u), 120 + i * 70));

    /* 功率曲线 */
    let power = null;
    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const nowH = new Date().getHours();
    const peak = Math.max(st.fast * 90, 60);
    const pAt = (h) => +(peak * (0.12 + Math.exp(-((h - 10.5) ** 2) / 9) * .55 + Math.exp(-((h - 20) ** 2) / 7) * .85)).toFixed(1);
    const pData = hours.map((_, h) => (h <= nowH ? pAt(h) : null));
    safe(() => {
      power = echarts.init(document.getElementById('power'));
      CHARTS.push(power);
      power.setOption({
        tooltip: { ...TIP, trigger: 'axis' },
        grid: { left: 6, right: 8, top: 26, bottom: 2, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: hours, ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [{ name: '功率', type: 'line', data: pData, smooth: .4, showSymbol: false,
          lineStyle: { color: '#2563eb', width: 2 }, itemStyle: { color: '#2563eb' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,.25)' }, { offset: 1, color: 'rgba(37,99,235,.02)' }] } } }],
      });
    });

    /* 桩群环图 */
    let donut = null;
    safe(() => {
      donut = echarts.init(document.getElementById('donut'));
      CHARTS.push(donut);
      donut.setOption({
        tooltip: { ...TIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: T2, fontSize: 10 } },
        series: [{
          type: 'pie', radius: ['46%', '68%'], center: ['50%', '42%'],
          itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: false },
          data: [
            { value: cnt.charging, name: '充电中', itemStyle: { color: '#2563eb' } },
            { value: cnt.idle, name: '空闲', itemStyle: { color: '#93c5fd' } },
            { value: cnt.fault, name: '故障', itemStyle: { color: '#ef4444' } },
            { value: cnt.offline, name: '离线', itemStyle: { color: '#cbd5e1' } },
          ],
        }],
      });
    });

    /* 桩位实况（网格滚动） */
    function pCard(p) {
      const badge = { charging: ['run', '充电中'], idle: ['idle', '空闲'], fault: ['err', '故障'], offline: ['off', '离线'] }[p.status];
      const mid = p.status === 'charging'
        ? `<span class="kw">${p.power.toFixed(1)}<small> kW</small></span><span class="eta">剩余 <b>${p.eta}</b></span>`
        : `<span class="kw ${p.status === 'idle' ? 'idle' : 'off'}">${badge[1]}</span><span class="eta">${p.type}</span>`;
      const stCls = { run: 'run', idle: 'ok', err: 'run', off: '' }[badge[0]];
      return `<div class="pile-card" data-id="${p.id}">
        <div class="r1"><span class="pid">${p.id}</span><span class="pt">${p.type === '直流快充' ? p.kw + 'kW' : '7kW'}</span>
          <span class="badge ${p.status === 'charging' ? 'run' : 'ok'}" style="margin-left:auto">${badge[1]}</span></div>
        <div class="plate">${p.status === 'charging' ? p.plate : p.type + ' · ' + (p.status === 'fault' ? '待检修' : p.status === 'offline' ? '计划检修' : '可预约')}</div>
        <div class="m2">${mid}</div>
        <div class="soc"><i class="${p.status === 'fault' ? 'bad' : ''}" style="width:${p.soc}%"></i></div>
      </div>`;
    }
    let cursor = 0;
    function rowHtml() {
      let h = '';
      for (let k = 0; k < 4; k++) { if (cursor >= piles.length) cursor = 0; h += pCard(piles[cursor++]); }
      return h;
    }
    const track = document.getElementById('pile-track');
    track.innerHTML = rowHtml() + rowHtml() + rowHtml();
    const flow = document.getElementById('pile-flow');
    let pfOff = 0, pfPause = false, pfLast = performance.now();
    flow.addEventListener('mouseenter', () => (pfPause = true));
    flow.addEventListener('mouseleave', () => (pfPause = false));
    (function pfScroll(t) {
      const dt = (t - pfLast) / 1000; pfLast = t;
      if (!pfPause && track.scrollHeight > flow.clientHeight) {
        pfOff += 14 * dt;
        const kids = track.children;
        if (kids[0]) { const h = kids[0].getBoundingClientRect().height + 10; if (pfOff >= h) { pfOff -= h; const f = kids[0]; f.innerHTML = rowHtml(); track.appendChild(f); } }
        track.style.transform = `translateY(${-pfOff}px)`;
      }
      requestAnimationFrame(pfScroll);
    })(performance.now());
    track.addEventListener('click', (e) => {
      const c = e.target.closest('.pile-card');
      if (!c) return;
      const id = c.dataset.id;
      track.querySelectorAll('.pile-card').forEach((x) => x.classList.toggle('sel', x.dataset.id === id));
    });

    /* 订单 */
    const ordHost = document.getElementById('orders');
    function ordRow() {
      const chg = piles.filter((x) => x.status === 'charging');
      const p = chg.length ? pick(chg) : pick(piles);
      const kwh = rnd(10, 78).toFixed(1), money = (kwh * rnd(.9, 1.5)).toFixed(2);
      const done = Math.random() < .55;
      const t = new Date();
      return `<span class="n">${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}</span>
        <span class="n">${p.id}</span><span class="s">${done ? pick(['鲁A', '鲁A', '鲁B']) + '·' + pad(rndInt(0, 99)) + pick(['K', 'M', 'F']) + pick(['8', '5', '6']) : p.plate}</span>
        <span class="n">${kwh}</span><span class="n">¥${money}</span>
        <span>${done ? '<span class="badge ok">已结算</span>' : '<span class="badge run">充电中</span>'}</span>`;
    }
    for (let i = 0; i < 8; i++) { const r = document.createElement('div'); r.className = 'tb-row'; r.style.gridTemplateColumns = '4rem 4rem minmax(0,1fr) 3.4rem 3.8rem 4rem'; r.innerHTML = ordRow(); ordHost.appendChild(r); }
    let oOff = 0, oPause = false, oLast = performance.now();
    const oWrap = document.querySelector('.tb-scroll');
    oWrap.addEventListener('mouseenter', () => (oPause = true));
    oWrap.addEventListener('mouseleave', () => (oPause = false));
    (function oScroll(t) {
      const dt = (t - oLast) / 1000; oLast = t;
      if (!oPause && ordHost.scrollHeight > oWrap.clientHeight) {
        oOff += 16 * dt;
        const f = ordHost.firstElementChild;
        if (f) { const h = f.getBoundingClientRect().height; if (oOff >= h) { oOff -= h; f.innerHTML = ordRow(); ordHost.appendChild(f); } }
        ordHost.style.transform = `translateY(${-oOff}px)`;
      }
      requestAnimationFrame(oScroll);
    })(performance.now());

    /* 站点信息 */
    document.getElementById('info').innerHTML = [
      ['站点编号', st.id], ['行政区域', st.district], ['站点地址', st.addr],
      ['桩位规模', `${st.piles} 桩（快充 ${st.fast} / 慢充 ${st.piles - st.fast}）`],
      ['运营时段', '24 小时无人值守'], ['运营状态', { normal: '正常运行', busy: '高负荷运转', alarm: '故障告警', offline: '离线检修' }[st.status]],
    ].map(([k, v]) => `<div class="info-r"><span>${k}</span><b>${v}</b></div>`).join('');

    /* 脉动 */
    let livePower = curPower;
    const liveSt = { kwh: st.kwh, orders: st.orders, income: st.income };
    setInterval(() => {
      let total = 0;
      piles.forEach((p) => {
        if (p.status === 'charging') {
          p.soc = Math.min(99, p.soc + rndInt(0, 2));
          p.power = Math.max(12, Math.min(p.kw, +(p.power + rnd(-5, 5)).toFixed(1)));
          total += p.power;
        }
      });
      const shown = +total.toFixed(1);
      countUp(mEls[0], shown, livePower, 1, 'kW', 900);
      livePower = shown;
      pData[nowH] = +Math.max(5, total).toFixed(1);
      if (power) power.setOption({ series: [{ data: pData }] });
      track.querySelectorAll('.pile-card').forEach((c) => {
        const p = piles.find((x) => x.id === c.dataset.id);
        if (p && p.status === 'charging') {
          c.querySelector('.soc i').style.width = p.soc + '%';
          c.querySelector('.kw').innerHTML = `${p.power.toFixed(1)}<small> kW</small>`;
        }
      });
    }, 4000);
    setInterval(() => {
      const prev = { ...liveSt };
      liveSt.kwh += rndInt(4, 14); liveSt.income += rndInt(18, 60);
      if (Math.random() < .5) liveSt.orders += 1;
      countUp(mEls[2], liveSt.kwh, prev.kwh, 0, 'kWh', 1100);
      countUp(mEls[3], liveSt.orders, prev.orders, 0, '单', 900);
      countUp(mEls[4], liveSt.income, prev.income, 0, '元', 1100);
    }, 5000);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
