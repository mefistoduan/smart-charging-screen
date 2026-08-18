/* ============================================================
   amber/js/main.js — 熔金指挥舱主逻辑
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[amber]', e.message); } }
  const { STATIONS, ST_STATUS } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- 时钟 ---------- */
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  function tick() {
    const d = new Date();
    document.getElementById('clk').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.getElementById('dte').textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${WEEK[d.getDay()]}`;
  }
  tick(); setInterval(tick, 1000);

  /* ---------- 汇总 ---------- */
  const TOTAL = STATIONS.reduce((a, s) => ({
    piles: a.piles + s.piles, fast: a.fast + s.fast, kwh: a.kwh + s.kwh,
    orders: a.orders + s.orders, income: a.income + s.income,
  }), { piles: 0, fast: 0, kwh: 0, orders: 0, income: 0 });
  const live = { kwh: TOTAL.kwh, orders: TOTAL.orders, income: TOTAL.income, charging: 297 };

  /* ---------- countUp（setInterval 时间轴，后台标签页也能完成） ---------- */
  function countUp(el, target, from = 0, dur = 1400, unit = '') {
    const t0 = performance.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const txt = fmt(from + (target - from) * e);
      el.innerHTML = unit ? txt + `<small>${unit}</small>` : txt;
      if (p >= 1) clearInterval(timer);
    }, 33);
  }

  /* ---------- KPI ---------- */
  const kpiDefs = [
    { k: '在营站点 STATIONS', v: STATIONS.length, u: '座', d: '覆盖济南 12 区县' },
    { k: '充电桩总数 PILES', v: TOTAL.piles, u: '桩', d: '快充 <b>274</b> · 慢充 <b>228</b>' },
    { k: '今日充电量 ENERGY', v: TOTAL.kwh, u: 'kWh', d: '同比 <b>+12.4%</b>' },
    { k: '今日订单 ORDERS', v: TOTAL.orders, u: '单', d: '同比 <b>+8.7%</b>' },
    { k: '今日营收 REVENUE', v: TOTAL.income, u: '元', d: '均价 <b>1.42</b> 元/度' },
    { k: '实时充电中 ACTIVE', v: live.charging, u: '桩', d: '空闲 <b>143</b> 桩待命' },
  ];
  document.getElementById('kpis').innerHTML = kpiDefs.map((x, i) => `
    <div class="kpi">
      <span class="k">${x.k}</span>
      <span class="v" data-i="${i}">0<small>${x.u}</small></span>
      <span class="d">${x.d}</span>
    </div>`).join('');
  const kpiEls = [...document.querySelectorAll('#kpis .v')];
  kpiDefs.forEach((x, i) => {
    setTimeout(() => countUp(kpiEls[i], x.v, 0, 1400, x.u), 200 + i * 90);
  });

  /* ---------- 地图 ---------- */
  let map = null;
  safe(() => {
    echarts.registerMap('jinan', window.CITY_GEOJSON);
    map = echarts.init(document.getElementById('map'));
    CHARTS.push(map);
  const COLOR = { normal: '#ffb52e', busy: '#ff7a1a', alarm: '#ff5d5d', offline: '#6b5a3e' };
  const HUB = STATIONS[0];
  map.setOption({
    geo: {
      map: 'jinan', roam: false, aspectScale: .86, layoutCenter: ['50%', '50%'], layoutSize: '100%',
      label: { show: true, color: 'rgba(240,210,150,.5)', fontSize: 10 },
      itemStyle: {
        areaColor: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(58,38,10,.8)' }, { offset: 1, color: 'rgba(26,16,4,.9)' }] },
        borderColor: 'rgba(255,181,46,.5)', borderWidth: 1.1,
        shadowColor: 'rgba(255,150,30,.35)', shadowBlur: 18, shadowOffsetY: 8,
      },
      emphasis: { label: { color: '#ffd98a' }, itemStyle: { areaColor: 'rgba(110,70,16,.92)' } },
    },
    tooltip: {
      trigger: 'item', backgroundColor: 'rgba(20,13,4,.95)', borderColor: 'rgba(255,181,46,.5)',
      textStyle: { color: '#f2e6cc', fontSize: 12 },
      formatter: (p) => p.data.st
        ? `<b style="color:#ffd98a">${p.data.st.name}</b><br/>${p.data.st.district} · 桩 ${p.data.st.piles}（快充 ${p.data.st.fast}）<br/>今日 ${fmt(p.data.st.kwh)} kWh · 利用率 ${p.data.st.util}%`
        : p.name,
    },
    series: [
      ...STATIONS.map((st) => ({
        type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
        rippleEffect: { brushType: 'stroke', scale: st.status === 'alarm' ? 3.6 : 2.4, period: st.status === 'alarm' ? 2 : 4 },
        symbolSize: st.status === 'offline' ? 8 : 10 + st.piles * .34,
        itemStyle: { color: COLOR[st.status], shadowBlur: 10, shadowColor: COLOR[st.status] },
        data: [{ value: [st.lon, st.lat], name: st.name, st }],
      })),
      { type: 'lines', coordinateSystem: 'geo', zlevel: 3,
        effect: { show: true, period: 5, trailLength: .5, symbol: 'circle', symbolSize: 3.5, color: '#ffd98a' },
        lineStyle: { color: 'rgba(255,160,50,.35)', width: 1, curveness: .25 },
        data: ['ST010', 'ST013', 'ST016', 'ST021', 'ST026']
          .map((id) => STATIONS.find((s) => s.id === id))
          .filter((t) => t && HUB)
          .map((t) => ({ coords: [[HUB.lon, HUB.lat], [t.lon, t.lat]] })) },
    ],
    });
  });

  /* ---------- 桩群玫瑰图 ---------- */
  const rose = echarts.init(document.getElementById('rose'));
  CHARTS.push(rose);
  const pileDist = { charging: 297, idle: 143, fault: 21, offline: 41 };
  rose.setOption({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(20,13,4,.95)', borderColor: 'rgba(255,181,46,.5)', textStyle: { color: '#f2e6cc' }, formatter: '{b}: {c} 桩 ({d}%)' },
    legend: { right: 8, top: 'middle', orient: 'vertical', icon: 'diamond', itemWidth: 8, itemHeight: 8, textStyle: { color: '#a08a5e', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['30%', '72%'], center: ['36%', '52%'], roseType: 'radius',
      itemStyle: { borderColor: '#160f05', borderWidth: 2 }, label: { show: false },
      data: [
        { value: pileDist.charging, name: '充电中', itemStyle: { color: '#ffb52e' } },
        { value: pileDist.idle, name: '空闲', itemStyle: { color: '#8a6a2f' } },
        { value: pileDist.fault, name: '故障', itemStyle: { color: '#ff5d5d' } },
        { value: pileDist.offline, name: '离线', itemStyle: { color: '#5a4c33' } },
      ],
    }],
  });

  /* ---------- 负荷曲线 ---------- */
  const load = echarts.init(document.getElementById('load'));
  CHARTS.push(load);
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const nowH = new Date().getHours();
  const loadAt = (h) => { const m = Math.exp(-((h - 10.5) ** 2) / 9) * 8.8, e = Math.exp(-((h - 20) ** 2) / 7) * 12.2; return +(1.5 + m + e).toFixed(2); };
  const loadReal = hours.map((_, h) => (h <= nowH ? loadAt(h) : null));
  const loadPlan = hours.map((_, h) => +loadAt(h).toFixed(2));
  load.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(20,13,4,.95)', borderColor: 'rgba(255,181,46,.5)', textStyle: { color: '#f2e6cc' } },
    grid: { left: 6, right: 10, top: 24, bottom: 2, containLabel: true },
    legend: { right: 4, top: 0, textStyle: { color: '#a08a5e', fontSize: 10 }, itemWidth: 12 },
    xAxis: { type: 'category', boundaryGap: false, data: hours, axisLine: { lineStyle: { color: 'rgba(255,181,46,.3)' } }, axisLabel: { color: '#a08a5e', fontSize: 10 }, axisTick: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,181,46,.08)' } }, axisLabel: { color: '#a08a5e', fontSize: 10 } },
    series: [
      { name: '实际负荷', type: 'line', data: loadReal, smooth: .4, showSymbol: false,
        lineStyle: { color: '#ffb52e', width: 2.2, shadowBlur: 10, shadowColor: 'rgba(255,181,46,.5)' }, itemStyle: { color: '#ffb52e' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,181,46,.4)' }, { offset: 1, color: 'rgba(255,181,46,.02)' }] } } },
      { name: '计划基线', type: 'line', data: loadPlan, smooth: .4, showSymbol: false,
        lineStyle: { color: 'rgba(255,122,26,.6)', width: 1.3, type: 'dashed' }, itemStyle: { color: '#ff7a1a' } },
    ],
  });

  /* ---------- 区县电量横条 ---------- */
  const distHost = document.getElementById('dist');
  function renderDist() {
    const byD = {};
    STATIONS.forEach((s) => { byD[s.district] = (byD[s.district] || 0) + s.kwh; });
    const top = Object.entries(byD).sort((a, b) => b[1] - a[1]).slice(0, 7);
    distHost.innerHTML = top.map(([n, v]) => `
      <div class="bar-it"><span class="n">${n}</span>
        <span class="track"><span class="fill" data-w="${(v / top[0][1] * 100).toFixed(1)}"></span></span>
        <span class="v">${fmt(v)}<span style="color:var(--dim);font-size:.62rem"> kWh</span></span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      distHost.querySelectorAll('.fill').forEach((f) => (f.style.width = f.dataset.w + '%'));
    }));
  }
  renderDist();

  /* ---------- 指挥快报 ---------- */
  const POOL = [
    ['高', 'ST022 百脉泉公园站 <b>V03 桩</b> 直流模块过温，已降功率 60kW 运行。'],
    ['中', '遥墙机场 T2 站排队车辆 <b>6 台</b>，建议引导至济南东站枢纽站。'],
    ['中', 'ST020 园博园文旅站市电波动，已切入储能缓冲。'],
    ['低', '谷时优惠 22:00 生效，参与站点 <b>18 座</b>。'],
    ['低', '今日消防巡检完成率 <b>96%</b>，无重大隐患。'],
    ['高', '全市电网负荷率 <b>82%</b>，触发有序充电策略。'],
  ];
  const alist = document.getElementById('alist');
  function aItem() {
    const [lv, tx] = pick(POOL);
    const t = new Date(Date.now() - rndInt(0, 90) * 60000);
    return `<span class="t">${pad(t.getHours())}:${pad(t.getMinutes())}</span><span class="l ${lv === '高' ? 'h' : lv === '中' ? 'm' : 's'}">${lv}</span><span class="x">${tx}</span>`;
  }
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('div'); d.className = 'a-it'; d.innerHTML = aItem(); alist.appendChild(d);
  }
  let aOff = 0, aPause = false, aLast = performance.now();
  alist.addEventListener('mouseenter', () => (aPause = true));
  alist.addEventListener('mouseleave', () => (aPause = false));
  (function aScroll(t) {
    const dt = (t - aLast) / 1000; aLast = t;
    if (!aPause && alist.scrollHeight > alist.clientHeight) {
      aOff += 14 * dt;
      const f = alist.firstElementChild;
      if (f) { const h = f.getBoundingClientRect().height; if (aOff >= h) { aOff -= h; f.innerHTML = aItem(); alist.appendChild(f); } }
      alist.style.transform = `translateY(${-aOff}px)`;
    }
    requestAnimationFrame(aScroll);
  })(performance.now());

  /* ---------- 底部跑马灯 ---------- */
  const msgs = [
    ['调度', `全市 ${live.charging} 桩作业中，实时负荷 ${(live.charging * 68 / 1000).toFixed(1)} MW。`],
    ['活动', '今晚 22:00-24:00 谷时优惠，参与站点 18 座。'],
    ['工单', 'ST022 通信模块异常工单已派出，预计 40 分钟到达。'],
    ['双碳', `本月减碳约 ${fmt(live.kwh * .012 * 30)} 吨，相当于植树 ${fmt(live.kwh * .012 * 30 * 55 / 1000)} 千棵。`],
  ];
  const tk = document.getElementById('ticker');
  tk.innerHTML = msgs.map(([a, b]) => `<b>【${a}】</b>${b}`).join('<span>◆</span>');
  let tkW = 0, tkX = 0;
  setTimeout(() => (tkW = tk.scrollWidth / 2), 800);
  setInterval(() => { if (tkW) { tk.innerHTML += tk.innerHTML; tkW = tk.scrollWidth / 2; } }, 30000);
  (function tkMove() {
    if (tkW) { tkX = (tkX + .7) % tkW; tk.style.transform = `translateX(${-tkX}px)`; }
    requestAnimationFrame(tkMove);
  })();

  document.getElementById('map-foot').innerHTML =
    `<span>GRID FREQ <b>50.02 Hz</b></span><span>LOAD RATE <b>82%</b></span><span>TOU PERIOD <b>平段</b></span><span>DATA LINK <b>OK</b></span>`;

  /* ---------- 实时脉动 ---------- */
  setInterval(() => {
    STATIONS.forEach((s) => { if (s.status !== 'offline') { s.kwh += rndInt(3, 11); s.income += rndInt(12, 46); if (Math.random() < .4) s.orders += 1; } });
    const prev = { ...live };
    live.kwh = STATIONS.reduce((a, s) => a + s.kwh, 0);
    live.orders = STATIONS.reduce((a, s) => a + s.orders, 0);
    live.income = STATIONS.reduce((a, s) => a + s.income, 0);
    live.charging = Math.max(240, Math.min(360, live.charging + rndInt(-2, 3)));
    [2, 3, 4, 5].forEach((idx) => {
      const val = [0, 0, live.kwh, live.orders, live.income, live.charging][idx];
      const from = [0, 0, prev.kwh, prev.orders, prev.income, prev.charging][idx];
      countUp(kpiEls[idx], val, from, 1200, kpiDefs[idx].u);
    });
    pileDist.charging = live.charging;
    pileDist.idle = 440 - live.charging;
    rose.setOption({ series: [{ data: [
      { value: pileDist.charging, name: '充电中', itemStyle: { color: '#ffb52e' } },
      { value: pileDist.idle, name: '空闲', itemStyle: { color: '#8a6a2f' } },
      { value: pileDist.fault, name: '故障', itemStyle: { color: '#ff5d5d' } },
      { value: pileDist.offline, name: '离线', itemStyle: { color: '#5a4c33' } },
    ] }] });
    loadReal[nowH] = +Math.max(.8, loadReal[nowH] + rnd(-.5, .6)).toFixed(2);
    load.setOption({ series: [{ data: loadReal }, { data: loadPlan }] });
  }, 5000);
  setInterval(renderDist, 12000);

  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
