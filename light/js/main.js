/* ============================================================
   light/js/main.js — 蓝白极简主逻辑
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[light]', e.message); } }
  const { STATIONS } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const T2 = '#64748b', LINE = '#e6eaf1';
  const AXIS = {
    axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false },
    axisLabel: { color: T2, fontSize: 10 },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  };
  const TIP = { backgroundColor: '#fff', borderColor: LINE, textStyle: { color: '#1e293b', fontSize: 12 }, extraCssText: 'box-shadow:0 8px 24px rgba(15,23,42,.12);border-radius:8px;' };

  /* 更新时间 */
  function updTime() { const d = new Date(); document.getElementById('upd').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
  updTime(); setInterval(updTime, 5000);

  /* 汇总 */
  const T = STATIONS.reduce((a, s) => ({ piles: a.piles + s.piles, kwh: a.kwh + s.kwh, orders: a.orders + s.orders, income: a.income + s.income }), { piles: 0, kwh: 0, orders: 0, income: 0 });
  const live = { kwh: T.kwh, orders: T.orders, income: T.income, charging: 297 };

  function countUp(el, target, from = 0, dur = 1300, unit = '') {
    const t0 = performance.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const txt = fmt(from + (target - from) * e);
      el.innerHTML = unit ? txt + `<small>${unit}</small>` : txt;
      if (p >= 1) clearInterval(timer);
    }, 33);
  }

  /* 指标卡 */
  const defs = [
    { ic: '📍', bg: '#eff4ff', c: '#2563eb', k: '在营站点', v: STATIONS.length, u: '座', d: '覆盖 12 区县' },
    { ic: '🔌', bg: '#eff4ff', c: '#06b6d4', k: '充电桩总数', v: T.piles, u: '桩', d: '<b class="up">54%</b> 为快充' },
    { ic: '⚡', bg: '#ecfdf5', c: '#10b981', k: '今日充电量', v: T.kwh, u: 'kWh', d: '<b class="up">↑ 12.4%</b> 较昨日' },
    { ic: '🧾', bg: '#f5f3ff', c: '#8b5cf6', k: '今日订单', v: T.orders, u: '单', d: '<b class="up">↑ 8.7%</b> 较昨日' },
    { ic: '💰', bg: '#fffbeb', c: '#f59e0b', k: '今日营收', v: T.income, u: '元', d: '均价 <b>1.42</b> 元/度' },
    { ic: '🔋', bg: '#ecfdf5', c: '#10b981', k: '实时充电中', v: live.charging, u: '桩', d: '空闲 <b>143</b> 桩' },
  ];
  document.getElementById('metrics').innerHTML = defs.map((x) => `
    <div class="m-card">
      <span class="ic" style="background:${x.bg};color:${x.c}">${x.ic}</span>
      <span class="k">${x.k}</span>
      <span class="v" style="color:${x.c}">0</span>
      <span class="d">${x.d}</span>
    </div>`).join('');
  const mEls = [...document.querySelectorAll('.m-card .v')];
  defs.forEach((x, i) => setTimeout(() => countUp(mEls[i], x.v, 0, 1300, x.u), 150 + i * 80));

  /* 地图 */
  let map = null;
  safe(() => {
    echarts.registerMap('jinan', window.CITY_GEOJSON);
    map = echarts.init(document.getElementById('map'));
    CHARTS.push(map);
  const C = { normal: '#2563eb', busy: '#f59e0b', alarm: '#ef4444', offline: '#94a3b8' };
  map.setOption({
    geo: {
      map: 'jinan', roam: false, aspectScale: .86, layoutCenter: ['50%', '50%'], layoutSize: '98%',
      label: { show: true, color: '#94a3b8', fontSize: 10 },
      itemStyle: { areaColor: '#eff4ff', borderColor: '#bfdbfe', borderWidth: 1.2, shadowColor: 'rgba(37,99,235,.12)', shadowBlur: 12, shadowOffsetY: 6 },
      emphasis: { label: { color: '#2563eb' }, itemStyle: { areaColor: '#dbeafe' } },
    },
    tooltip: { ...TIP, trigger: 'item', formatter: (p) => p.data.st ? `<b>${p.data.st.name}</b><br/>${p.data.st.district} · ${p.data.st.piles} 桩<br/>今日 ${fmt(p.data.st.kwh)} kWh<br/><i style="color:#94a3b8">点击进入场站详情 →</i>` : p.name },
    series: STATIONS.map((st) => ({
      type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
      symbolSize: st.status === 'offline' ? 7 : 8 + st.piles * .3,
      itemStyle: { color: C[st.status], borderColor: '#fff', borderWidth: 1.5, shadowBlur: 6, shadowColor: C[st.status] },
      rippleEffect: { brushType: 'stroke', scale: 2.2, period: 4 },
      data: [{ value: [st.lon, st.lat], name: st.name, st }],
    })),
    });
    /* 点击站点下钻详情 */
    map.on('click', (p) => {
      if (p.data && p.data.st) location.href = 'station.html?id=' + p.data.st.id;
    });
  });

  /* 趋势 */
  const trend = echarts.init(document.getElementById('trend'));
  CHARTS.push(trend);
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const nowH = new Date().getHours();
  const tAt = (h) => Math.round((1.5 + Math.exp(-((h - 10.5) ** 2) / 9) * 8.8 + Math.exp(-((h - 20) ** 2) / 7) * 12.2) * 128);
  const kwhS = hours.map((_, h) => (h <= nowH ? tAt(h) : null));
  const ordS = hours.map((_, h) => (h <= nowH ? Math.round(tAt(h) / 26) : null));
  trend.setOption({
    tooltip: { ...TIP, trigger: 'axis' },
    grid: { left: 6, right: 8, top: 28, bottom: 2, containLabel: true },
    legend: { right: 4, top: 0, textStyle: { color: T2, fontSize: 10 }, itemWidth: 12 },
    xAxis: { type: 'category', data: hours, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '充电量', type: 'bar', data: kwhS, barWidth: '46%', itemStyle: { borderRadius: [3, 3, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#bfdbfe' }] } } },
      { name: '订单', type: 'line', data: ordS, smooth: true, showSymbol: false, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' } },
    ],
  });

  /* 桩群环图 */
  const donut = echarts.init(document.getElementById('donut'));
  CHARTS.push(donut);
  const pd = { charging: 297, idle: 143, fault: 21, offline: 41 };
  donut.setOption({
    tooltip: { ...TIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: T2, fontSize: 10 } },
    series: [{
      type: 'pie', radius: ['48%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: false },
      emphasis: { scaleSize: 4 },
      data: [
        { value: pd.charging, name: '充电中', itemStyle: { color: '#2563eb' } },
        { value: pd.idle, name: '空闲', itemStyle: { color: '#93c5fd' } },
        { value: pd.fault, name: '故障', itemStyle: { color: '#ef4444' } },
        { value: pd.offline, name: '离线', itemStyle: { color: '#cbd5e1' } },
      ],
    }],
  });

  /* TOP5 */
  const rankHost = document.getElementById('rank');
  function renderRank() {
    const top = [...STATIONS].sort((a, b) => b.kwh - a.kwh).slice(0, 5);
    rankHost.innerHTML = top.map((s, i) => `
      <div class="r-it"><span class="r-no">${i + 1}</span><span class="r-nm">${s.name}</span>
        <span class="r-track"><span class="r-fill" data-w="${(s.kwh / top[0].kwh * 100).toFixed(1)}"></span></span>
        <span class="r-v">${fmt(s.kwh)}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rankHost.querySelectorAll('.r-fill').forEach((f) => (f.style.width = f.dataset.w + '%'));
    }));
  }
  renderRank();

  /* 订单流 */
  const ordHost = document.getElementById('orders');
  function ordRow() {
    const st = pick(STATIONS);
    const kwh = rnd(12, 86).toFixed(1), money = (kwh * rnd(.9, 1.5)).toFixed(2);
    const done = Math.random() < .55;
    const t = new Date();
    return `<span class="n">${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}</span>
      <span class="s">${st.name.replace('站', '')}</span><span class="n">${st.id.slice(2)}-V${pad(rndInt(1, st.piles))}</span>
      <span class="n">${kwh}</span><span class="n">¥${money}</span>
      <span>${done ? '<span class="badge ok">已结算</span>' : '<span class="badge run">充电中</span>'}</span>`;
  }
  for (let i = 0; i < 10; i++) {
    const r = document.createElement('div'); r.className = 'tb-row'; r.innerHTML = ordRow(); ordHost.appendChild(r);
  }
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

  /* 区县柱图 */
  const distbar = echarts.init(document.getElementById('distbar'));
  CHARTS.push(distbar);
  function distData() {
    const byD = {};
    STATIONS.forEach((s) => { byD[s.district] = (byD[s.district] || 0) + s.kwh; });
    return Object.entries(byD).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }
  distbar.setOption({
    tooltip: { ...TIP, trigger: 'axis' },
    grid: { left: 6, right: 8, top: 24, bottom: 2, containLabel: true },
    xAxis: { type: 'category', ...AXIS, axisLabel: { ...AXIS.axisLabel, interval: 0, fontSize: 9 } },
    yAxis: { type: 'value', ...AXIS },
    series: [{ type: 'bar', barWidth: '48%', data: [], itemStyle: { borderRadius: [3, 3, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#a5f3fc' }] } } }],
  });
  function setDist() {
    const d = distData();
    distbar.setOption({ xAxis: { data: d.map((x) => x[0]) }, series: [{ data: d.map((x) => x[1]) }] });
  }
  setDist();

  /* 脉动 */
  setInterval(() => {
    STATIONS.forEach((s) => { if (s.status !== 'offline') { s.kwh += rndInt(3, 11); s.income += rndInt(12, 46); if (Math.random() < .4) s.orders += 1; } });
    const prev = { ...live };
    live.kwh = STATIONS.reduce((a, s) => a + s.kwh, 0);
    live.orders = STATIONS.reduce((a, s) => a + s.orders, 0);
    live.income = STATIONS.reduce((a, s) => a + s.income, 0);
    live.charging = Math.max(240, Math.min(360, live.charging + rndInt(-2, 3)));
    [2, 3, 4, 5].forEach((i) => {
      const val = [0, 0, live.kwh, live.orders, live.income, live.charging][i];
      const from = [0, 0, prev.kwh, prev.orders, prev.income, prev.charging][i];
      countUp(mEls[i], val, from, 1100, defs[i].u);
    });
    pd.charging = live.charging; pd.idle = 440 - live.charging;
    donut.setOption({ series: [{ data: [
      { value: pd.charging, name: '充电中', itemStyle: { color: '#2563eb' } },
      { value: pd.idle, name: '空闲', itemStyle: { color: '#93c5fd' } },
      { value: pd.fault, name: '故障', itemStyle: { color: '#ef4444' } },
      { value: pd.offline, name: '离线', itemStyle: { color: '#cbd5e1' } },
    ] }] });
    kwhS[nowH] = (kwhS[nowH] || 0) + rndInt(25, 140);
    ordS[nowH] = (ordS[nowH] || 0) + rndInt(1, 6);
    trend.setOption({ series: [{ data: kwhS }, { data: ordS }] });
    setDist();
  }, 5000);
  setInterval(renderRank, 10000);

  /* tab/filters 演示交互 */
  document.querySelectorAll('.tab, .f').forEach((el) => {
    el.addEventListener('click', (e) => {
      const box = e.currentTarget.parentElement;
      box.querySelectorAll('.tab,.f').forEach((x) => x.classList.remove('on'));
      e.currentTarget.classList.add('on');
    });
  });

  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
