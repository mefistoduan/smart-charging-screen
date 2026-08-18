/* ============================================================
   eco/js/main.js — 青绿生态主逻辑
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[eco]', e.message); } }
  const { STATIONS } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const T2 = '#6fa389', LINE = 'rgba(61,220,151,.18)';
  const AXIS = {
    axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false },
    axisLabel: { color: T2, fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(61,220,151,.07)' } },
  };
  const TIP = { backgroundColor: 'rgba(6,24,16,.94)', borderColor: 'rgba(61,220,151,.4)', textStyle: { color: '#d9f5e7', fontSize: 12 } };

  /* 时钟（立即可跑） */
  function tick() { const d = new Date(); document.getElementById('clk').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
  tick(); setInterval(tick, 1000);

  /* 主初始化：延迟到 load，确保容器尺寸就绪（0 尺寸画布会引发 echarts 异常） */
  function init() {
  const T = STATIONS.reduce((a, s) => ({ kwh: a.kwh + s.kwh, piles: a.piles + s.piles }), { kwh: 0, piles: 0 });
  const co2 = +(T.kwh * 0.012).toFixed(1);
  const live = { kwh: T.kwh, co2, pv: 3.2, esSoc: 68, chKw: 20.1 * 1000, charging: 297 };

  /* 碳足迹环 */
  const ARC_MAX = 327;
  function setCo2(val) {
    const pct = Math.min(1, val / (co2 * 1.6));
    document.getElementById('co2-arc').style.strokeDashoffset = ARC_MAX * (1 - pct * 0.86);
  }
  function countUp(el, target, from = 0, dur = 1500, fmtFn = (v) => fmt(v, 1)) {
    const t0 = performance.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtFn(from + (target - from) * e);
      if (p >= 1) clearInterval(timer);
    }, 33);
  }
  countUp(document.getElementById('co2-n'), co2, 0, 1800);
  setTimeout(() => setCo2(co2), 300);
  document.getElementById('co2-facts').innerHTML = `
    <div class="fact"><span class="ic">🌳</span><div>等效植树 <b>${fmt(co2 * 55, 0)}</b> 棵</div><span>按每棵年吸碳 18kg</span></div>
    <div class="fact"><span class="ic">🚗</span><div>替代燃油车 <b>${fmt(co2 / 0.018 * 10, 0)}</b> 公里</div><span>按百公里 1.8kg 排放</span></div>
    <div class="fact"><span class="ic">⚡</span><div>绿电占比 <b>37%</b></div><span>光伏+储能</span></div>`;

  /* 绿电构成 */
  const green = echarts.init(document.getElementById('green'));
  CHARTS.push(green);
  const gMix = { pv: 8.2, es: 12.6, grid: 79.2 };
  green.setOption({
    tooltip: { ...TIP, trigger: 'item', formatter: '{b}: {d}%' },
    legend: { bottom: 2, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: T2, fontSize: 10 } },
    series: [{
      type: 'pie', radius: ['44%', '66%'], center: ['50%', '42%'],
      itemStyle: { borderColor: '#06180f', borderWidth: 3 }, label: { show: false },
      data: [
        { value: gMix.pv, name: '光伏', itemStyle: { color: '#ffd166' } },
        { value: gMix.es, name: '储能', itemStyle: { color: '#35d0ba' } },
        { value: gMix.grid, name: '市电', itemStyle: { color: '#1d7a55' } },
      ],
    }],
  });

  /* 生态榜 */
  const ecoHost = document.getElementById('eco-list');
  function renderEco() {
    const top = [...STATIONS].sort((a, b) => b.kwh - a.kwh).slice(0, 7);
    ecoHost.innerHTML = top.map((s, i) => `
      <div class="e-it"><span class="e-rank">${i + 1}</span><span class="e-nm">${s.name}</span>
        <span class="e-leaf">🌿 ${(s.kwh * 0.012).toFixed(1)}t</span><span class="e-v">${fmt(s.kwh)} kWh</span></div>`).join('');
  }
  renderEco();

  /* 地图（safe 隔离：effectScatter 在 0 尺寸画布下可能抛错，不能拖垮后续模块） */
  const C = { normal: '#3ddc97', busy: '#ffd166', alarm: '#ff6b6b', offline: '#3f6b56' };
  const HUB = STATIONS[0];
  let map = null;
  safe(() => {
    echarts.registerMap('jinan', window.CITY_GEOJSON);
    map = echarts.init(document.getElementById('map'));
    CHARTS.push(map);
    map.setOption({
    geo: {
      map: 'jinan', roam: false, aspectScale: .86, layoutCenter: ['50%', '50%'], layoutSize: '100%',
      label: { show: true, color: 'rgba(150,220,185,.5)', fontSize: 10 },
      itemStyle: {
        areaColor: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,66,45,.8)' }, { offset: 1, color: 'rgba(6,28,19,.9)' }] },
        borderColor: 'rgba(61,220,151,.45)', borderWidth: 1.1,
        shadowColor: 'rgba(23,145,95,.4)', shadowBlur: 16, shadowOffsetY: 8,
      },
      emphasis: { label: { color: '#7dffc4' }, itemStyle: { areaColor: 'rgba(23,110,74,.92)' } },
    },
    tooltip: { ...TIP, trigger: 'item', formatter: (p) => p.data.st ? `<b style="color:#7dffc4">${p.data.st.name}</b><br/>${p.data.st.district} · ${p.data.st.piles} 桩<br/>今日 ${fmt(p.data.st.kwh)} kWh · 减碳 ${(p.data.st.kwh * .012).toFixed(1)}t<br/><i style="color:#6fa389">点击进入场站详情 →</i>` : p.name },
    series: [
      ...STATIONS.map((st) => ({
        type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
        rippleEffect: { brushType: 'stroke', scale: st.status === 'alarm' ? 3.4 : 2.4, period: st.status === 'alarm' ? 2 : 4 },
        symbolSize: st.status === 'offline' ? 7 : 9 + st.piles * .32,
        itemStyle: { color: C[st.status], shadowBlur: 10, shadowColor: C[st.status] },
        data: [{ value: [st.lon, st.lat], name: st.name, st }],
      })),
      { type: 'lines', coordinateSystem: 'geo', zlevel: 3,
        effect: { show: true, period: 5, trailLength: .55, symbol: 'circle', symbolSize: 3.5, color: '#7dffc4' },
        lineStyle: { color: 'rgba(61,220,151,.3)', width: 1, curveness: .25 },
        data: ['ST010', 'ST013', 'ST016']
          .map((id) => STATIONS.find((s) => s.id === id))
          .filter((t) => t && HUB)
          .map((t) => ({ coords: [[HUB.lon, HUB.lat], [t.lon, t.lat]] })) },
    ],
    });
    /* 点击站点下钻详情 */
    map.on('click', (p) => {
      if (p.data && p.data.st) location.href = 'station.html?id=' + p.data.st.id;
    });
  });

  /* 光储充能量流（自定义 SVG，带粒子流动画） */
  const flowHost = document.getElementById('sankey');
  const flow = { pv: 3.2, es: 14.5, grid: 62.4, ch: 68.9, other: 11.2 };
  function setFlow() {
    const srcs = [
      { n: '☀ 光伏', v: flow.pv, c: '#ffd166' },
      { n: '▣ 储能', v: flow.es, c: '#35d0ba' },
      { n: '⚡ 市电', v: flow.grid, c: '#2f9b74' },
    ];
    const dsts = [
      { n: '充电负荷', v: flow.ch, c: '#3ddc97' },
      { n: '站用电', v: flow.other, c: '#2b5e46' },
    ];
    const tot = flow.pv + flow.es + flow.grid;
    let s = `<svg viewBox="0 0 640 250" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">`;
    /* 左侧源节点（按功率占比分高度） */
    let y = 18;
    const segs = [];
    srcs.forEach((src) => {
      const h = Math.max(26, (src.v / tot) * 194);
      segs.push({ y, h, ...src });
      s += `<rect x="20" y="${y}" width="14" height="${h - 6}" rx="4" fill="${src.c}"/>
        <text x="42" y="${y + h / 2}" fill="#d9f5e7" font-size="13">${src.n}</text>
        <text x="42" y="${y + h / 2 + 14}" fill="#6fa389" font-size="11" font-family="Bahnschrift">${src.v.toFixed(1)} kW</text>`;
      y += h;
    });
    /* 右侧汇节点 */
    const dTot = flow.ch + flow.other;
    let dy = 30;
    const dsegs = [];
    dsts.forEach((d) => {
      const h = Math.max(34, (d.v / dTot) * 170);
      dsegs.push({ y: dy, h, ...d });
      s += `<rect x="606" y="${dy}" width="14" height="${h - 6}" rx="4" fill="${d.c}"/>
        <text x="596" y="${dy + h / 2}" fill="#d9f5e7" font-size="13" text-anchor="end">${d.n}</text>
        <text x="596" y="${dy + h / 2 + 14}" fill="#6fa389" font-size="11" text-anchor="end" font-family="Bahnschrift">${d.v.toFixed(1)} kW</text>`;
      dy += h;
    });
    /* 能量带（源→汇贝塞尔）+ 流动粒子 */
    const links = [
      { s: 0, d: 0, v: flow.pv, c: '#ffd166' },
      { s: 1, d: 0, v: flow.es, c: '#35d0ba' },
      { s: 2, d: 0, v: flow.grid * .88, c: '#2f9b74' },
      { s: 2, d: 1, v: flow.other, c: '#2b5e46' },
    ];
    links.forEach((L, i) => {
      const sa = segs[L.s], da = dsegs[L.d];
      const y1 = sa.y + (sa.h - 6) / 2, y2 = da.y + (da.h - 6) / 2;
      const w = Math.max(3, (L.v / tot) * 60);
      s += `<path d="M34,${y1} C300,${y1} 340,${y2} 606,${y2}" fill="none" stroke="${L.c}" stroke-opacity=".16" stroke-width="${w}"/>`;
      s += `<circle r="${Math.max(2, w / 2.2)}" fill="${L.c}" opacity=".95">
        <animateMotion dur="${(3.2 - i * 0.4).toFixed(1)}s" repeatCount="indefinite" path="M34,${y1} C300,${y1} 340,${y2} 606,${y2}"/>
      </circle>`;
    });
    s += `</svg>`;
    flowHost.innerHTML = s;
  }
  safe(setFlow);

  /* 桩群 */
  let piles = null;
  const pd = { charging: 297, idle: 143, fault: 21, offline: 41 };
  safe(() => {
    piles = echarts.init(document.getElementById('piles'));
    CHARTS.push(piles);
    piles.setOption({
    tooltip: { ...TIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
    legend: { right: 8, top: 'middle', orient: 'vertical', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: T2, fontSize: 10 } },
    series: [{
      type: 'pie', radius: ['46%', '68%'], center: ['34%', '52%'],
      itemStyle: { borderColor: '#06180f', borderWidth: 3 }, label: { show: false },
      data: [
        { value: pd.charging, name: '充电中', itemStyle: { color: '#3ddc97' } },
        { value: pd.idle, name: '空闲', itemStyle: { color: '#17915f' } },
        { value: pd.fault, name: '故障', itemStyle: { color: '#ff6b6b' } },
        { value: pd.offline, name: '离线', itemStyle: { color: '#3f6b56' } },
      ],
    }],
    });
  });

  /* 24H 绿色负荷 */
  let load = null;
  safe(() => {
  load = echarts.init(document.getElementById('load'));
  CHARTS.push(load);
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const nowH = new Date().getHours();
  const lAt = (h) => +((1.4 + Math.exp(-((h - 10.5) ** 2) / 9) * 8.5 + Math.exp(-((h - 20) ** 2) / 7) * 11.8)).toFixed(2);
  const lAll = hours.map((_, h) => (h <= nowH ? lAt(h) : null));
  const lGreen = hours.map((_, h) => (h <= nowH ? +(lAt(h) * .37).toFixed(2) : null));
  load.setOption({
    tooltip: { ...TIP, trigger: 'axis' },
    grid: { left: 6, right: 8, top: 26, bottom: 2, containLabel: true },
    legend: { right: 4, top: 0, textStyle: { color: T2, fontSize: 10 }, itemWidth: 12 },
    xAxis: { type: 'category', boundaryGap: false, data: hours, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '总负荷', type: 'line', data: lAll, smooth: .4, showSymbol: false, lineStyle: { color: '#35d0ba', width: 2 }, itemStyle: { color: '#35d0ba' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(53,208,186,.3)' }, { offset: 1, color: 'rgba(53,208,186,.02)' }] } } },
      { name: '绿电供给', type: 'line', data: lGreen, smooth: .4, showSymbol: false, lineStyle: { color: '#3ddc97', width: 2 }, itemStyle: { color: '#3ddc97' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(61,220,151,.35)' }, { offset: 1, color: 'rgba(61,220,151,.02)' }] } } },
    ],
    });
  });

  /* 事件 */
  const POOL = [
    ['高', 'ST022 百脉泉公园站 <b>V03 桩</b> 过温降功率，运维已出动。'],
    ['中', '汉峪金谷站 <b>储能系统</b> SOC 低于 22%，切换保守策略。'],
    ['低', '今日光伏出力峰值 <b>3.8 kW</b>，出现在 12:40。'],
    ['中', '园博园文旅站市电波动，储能缓冲中。'],
    ['低', '谷时绿电充储联动就绪，预计转移负荷 8%。'],
    ['低', '本月碳积分已结算 <b>1,240</b> 笔。'],
  ];
  const evHost = document.getElementById('events');
  function evItem() {
    const [lv, tx] = pick(POOL);
    const t = new Date(Date.now() - rndInt(0, 120) * 60000);
    return `<span class="t">${pad(t.getHours())}:${pad(t.getMinutes())}</span><span class="lv ${lv === '高' ? 'h' : lv === '中' ? 'm' : 's'}">${lv}</span><span class="x">${tx}</span>`;
  }
  for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'ev'; d.innerHTML = evItem(); evHost.appendChild(d); }
  let eOff = 0, ePause = false, eLast = performance.now();
  evHost.addEventListener('mouseenter', () => (ePause = true));
  evHost.addEventListener('mouseleave', () => (ePause = false));
  (function eScroll(t) {
    const dt = (t - eLast) / 1000; eLast = t;
    if (!ePause && evHost.scrollHeight > evHost.clientHeight) {
      eOff += 13 * dt;
      const f = evHost.firstElementChild;
      if (f) { const h = f.getBoundingClientRect().height; if (eOff >= h) { eOff -= h; f.innerHTML = evItem(); evHost.appendChild(f); } }
      evHost.style.transform = `translateY(${-eOff}px)`;
    }
    requestAnimationFrame(eScroll);
  })(performance.now());

  /* 脉动 */
  const pvEl = document.getElementById('pv-kw'), esEl = document.getElementById('es-soc'), chEl = document.getElementById('ch-kw');
  chEl.textContent = (live.charging * 68).toFixed(0);
  setInterval(() => {
    STATIONS.forEach((s) => { if (s.status !== 'offline') s.kwh += rndInt(3, 11); });
    const prev = { ...live };
    live.kwh = STATIONS.reduce((a, s) => a + s.kwh, 0);
    live.co2 = +(live.kwh * 0.012).toFixed(1);
    live.pv = +Math.max(0, Math.min(4.2, live.pv + rnd(-.3, .3))).toFixed(1);
    live.esSoc = Math.max(15, Math.min(95, live.esSoc + rndInt(-1, 1)));
    live.charging = Math.max(240, Math.min(360, live.charging + rndInt(-2, 3)));
    live.chKw = live.charging * 68;
    countUp(document.getElementById('co2-n'), live.co2, prev.co2, 1400);
    pvEl.textContent = live.pv.toFixed(1);
    esEl.textContent = live.esSoc;
    chEl.textContent = live.chKw.toFixed(0);
    flow.pv = live.pv; flow.es = live.chKw * .18; flow.grid = live.chKw * .74; flow.ch = live.chKw * .92; flow.other = live.chKw * .08;
    setFlow();
    pd.charging = live.charging; pd.idle = 440 - live.charging;
    if (piles) piles.setOption({ series: [{ data: [
      { value: pd.charging, name: '充电中', itemStyle: { color: '#3ddc97' } },
      { value: pd.idle, name: '空闲', itemStyle: { color: '#17915f' } },
      { value: pd.fault, name: '故障', itemStyle: { color: '#ff6b6b' } },
      { value: pd.offline, name: '离线', itemStyle: { color: '#3f6b56' } },
    ] }] });
    lAll[nowH] = +Math.max(.8, lAll[nowH] + rnd(-.4, .5)).toFixed(2);
    lGreen[nowH] = +(lAll[nowH] * .37).toFixed(2);
    if (load) load.setOption({ series: [{ data: lAll }, { data: lGreen }] });
    const neu = Math.min(96, 42 + Math.round((live.kwh - T.kwh) / 500));
    document.getElementById('neu-p').textContent = neu + '%';
    document.getElementById('neu-fi').style.width = neu + '%';
  }, 5000);
  setInterval(renderEco, 12000);

  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
