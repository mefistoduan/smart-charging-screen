/* ============================================================
   station.js — 单站详情大屏
   ============================================================ */
(function () {
  'use strict';
  const { STATIONS, ST_STATUS, buildPiles, LAYOUT_ROWS, LAYOUT_COLS } = window.DATA;
  const CC = window.CC;

  /* ---------- 解析站点 ---------- */
  const qs = new URLSearchParams(location.search);
  const st = STATIONS.find((s) => s.id === qs.get('id')) || STATIONS[0];
  const piles = buildPiles(st);
  const pileStat = { charging: 0, idle: 0, fault: 0, offline: 0 };
  piles.forEach((p) => pileStat[p.status]++);
  const curPower = +piles.reduce((s, p) => s + (p.status === 'charging' ? p.power : 0), 0).toFixed(1);
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- 启动 ---------- */
  CC.fitScreen();
  const CHARTS = [];
  CC.buildHeader({
    title: `${st.name} · 场站详情`,
    subtitle: `STATION DETAIL · ${st.id} · ${st.district}`,
    back: true,
  });
  CC.decoratePanels();
  CC.playBoot(`${st.name}`);
  CC.plexus();

  CC.buildTicker([
    ['本站', `当前实时功率 ${curPower} kW，充电中 ${pileStat.charging} 桩，空闲 ${pileStat.idle} 桩。`],
    ['服务', '本站支持即插即充、V2L 对外放电与预约锁桩，会员享受谷时 8.8 折。'],
    ['运维', `今日巡检 2 次，${pileStat.fault} 台故障桩已派单，平均修复时长 47 分钟。`],
    ['安全', '消防系统自检通过，烟感/温度/水浸三路传感器在线。'],
    ['互动', `本月本站累计服务车主 ${fmt(st.orders * 26)} 人次，满意度 4.9 / 5.0。`],
  ]);

  /* ---------- 场站档案 ---------- */
  const badge = { normal: ['ok', '正常运行'], busy: ['run', '高负荷'], alarm: ['err', '故障告警'], offline: ['warn', '离线检修'] }[st.status];
  document.getElementById('st-badge-host').innerHTML = `<span class="st-badge ${badge[0]}">${badge[1]}</span>`;
  document.getElementById('info-grid').innerHTML = `
    <div class="info-it"><span class="k">今日充电量</span><span class="v big"><span id="ig-kwh">${fmt(st.kwh)}</span><small> kWh</small></span></div>
    <div class="info-it"><span class="k">今日营收</span><span class="v big"><span style="color:var(--amber)">¥</span><span id="ig-income" style="color:var(--amber)">${fmt(st.income)}</span><small> 元</small></span></div>
    <div class="info-it"><span class="k">站点地址</span><span class="v">${st.addr}</span></div>
    <div class="info-it"><span class="k">行政区域</span><span class="v">${st.district} · ${st.id}</span></div>
    <div class="info-it"><span class="k">桩位规模</span><span class="v">${st.piles} 桩（快充 ${st.fast} / 慢充 ${st.piles - st.fast}）</span></div>
    <div class="info-it"><span class="k">运营时段</span><span class="v">24 小时无人值守</span></div>`;

  /* ---------- 中央指标带 ---------- */
  const stripStats = [
    { v: curPower, l: '实时功率', u: 'kW', d: 1, accent: '#2df0a6' },
    { v: pileStat.charging, l: '充电中', u: '桩', accent: '#37e6ff' },
    { v: pileStat.idle, l: '空闲待命', u: '桩', accent: '#3d8bff' },
    { v: st.orders, l: '今日订单', u: '单', accent: '#9d7bff' },
    { v: st.util, l: '桩位利用率', u: '%', d: 0, accent: '#ffc53d' },
  ];
  document.getElementById('stat-strip').innerHTML = stripStats.map((s, i) => `
    <div class="stat" style="--accent:${s.accent}">
      <div class="v" data-count="${s.v}" data-d="${s.d || 0}">0</div>
      <div class="l">${s.l} <b>/${s.u}</b></div>
    </div>`).join('');
  document.querySelectorAll('#stat-strip .v').forEach((el) => CC.countUp(el, +el.dataset.count, { digits: +el.dataset.d, duration: 1400 }));

  /* ---------- 桩状态环图 ---------- */
  const stDonut = echarts.init(document.getElementById('chart-st-donut'));
  CHARTS.push(stDonut);
  stDonut.setOption({
    tooltip: { ...CC.TOOLTIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
    legend: { orient: 'vertical', right: 14, top: 'middle', icon: 'diamond', itemWidth: 9, itemHeight: 9, itemGap: 12, textStyle: { color: '#a9c6e4', fontSize: 12 } },
    title: {
      text: `${st.piles}`, subtext: '桩位总数', left: '30%', top: '38%', textAlign: 'center',
      textStyle: { color: '#f2faff', fontSize: 28, fontFamily: 'Bahnschrift', fontWeight: 700 },
      subtextStyle: { color: '#6d89ad', fontSize: 12 },
    },
    series: [{
      type: 'pie', radius: ['50%', '72%'], center: ['31%', '52%'], label: { show: false },
      itemStyle: { borderColor: '#04101f', borderWidth: 2 },
      emphasis: { scaleSize: 5 },
      animationType: 'scale', animationEasing: 'elasticOut',
      data: [
        { value: pileStat.charging, name: '充电中', itemStyle: { color: '#37e6ff' } },
        { value: pileStat.idle, name: '空闲', itemStyle: { color: '#3d8bff' } },
        { value: pileStat.fault, name: '故障', itemStyle: { color: '#ff5d7a' } },
        { value: pileStat.offline, name: '离线', itemStyle: { color: '#5a7492' } },
      ],
    }],
  });

  /* ---------- 功率曲线 ---------- */
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const nowHour = new Date().getHours();
  const peak = Math.max(st.fast * 90, 60);
  function stPowerAt(h) {
    const morning = Math.exp(-Math.pow(h - 10.5, 2) / 9);
    const evening = Math.exp(-Math.pow(h - 20, 2) / 7);
    return +(peak * (0.12 + morning * 0.55 + evening * 0.85)).toFixed(1);
  }
  const stPowerChart = echarts.init(document.getElementById('chart-st-power'));
  const stPowerData = hours.map((_, h) => (h <= nowHour ? stPowerAt(h) : null));
  CHARTS.push(stPowerChart);
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
  stPowerChart.setOption({
    tooltip: { ...CC.TOOLTIP, trigger: 'axis', valueFormatter: (v) => v == null ? '-' : v + ' kW' },
    grid: { left: 8, right: 14, top: 28, bottom: 4, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: hours, ...CC.AXIS },
    yAxis: { type: 'value', name: 'kW', nameTextStyle: { color: '#6d89ad' }, ...CC.AXIS },
    series: [{
      name: '场站功率', type: 'line', smooth: 0.4,
      data: stPowerData,
      lineStyle: { color: '#2df0a6', width: 2.2, shadowBlur: 10, shadowColor: 'rgba(45,240,166,.55)' },
      itemStyle: { color: '#2df0a6' }, showSymbol: false,
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(45,240,166,.38)' }, { offset: 1, color: 'rgba(45,240,166,.02)' }] } },
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(157,123,255,.10)' },
        label: { color: '#9d7bff', fontSize: 10, position: 'insideTop' },
        data: [[{ name: '谷时时段', xAxis: '00' }, { xAxis: '06' }], [{ name: '谷时时段', xAxis: '22' }, { xAxis: '23' }]],
      },
    }],
  });
  document.getElementById('st-power-now').textContent = `▲ 当前 ${curPower} kW`;

  /* ============================================================
     场站布局 SVG
     ============================================================ */
  const C = { charging: '#2df0a6', idle: '#37e6ff', fault: '#ff5d7a', offline: '#5a7492' };
  const stage = document.getElementById('layout-stage');
  const cols = LAYOUT_COLS;
  const rows = Math.max(3, Math.min(5, Math.ceil(st.piles / cols))); // 3~5 行自适应，多余格画备用车位
  /* 行距根据容器宽高比自适应：让 SVG 以 contain 铺满面板，消除竖向留白 */
  let rowGap = 100;
  function fitRowGap() {
    const w = stage.clientWidth || 1000, h = stage.clientHeight || 440;
    const targetH = (1000 * h) / w;              // 与容器等比的 viewBox 高
    let gap = (targetH - 78 - 62) / Math.max(1, rows - 1);
    rowGap = Math.min(152, Math.max(86, gap));
  }
  const rowMid = (r) => 78 + r * rowGap;
  const bayX = (c) => 178 + c * 99;
  const svgH = () => rowMid(rows - 1) + 62;

  function buildLayout() {
    fitRowGap();
    let s = `<svg viewBox="0 0 1000 ${svgH()}" preserveAspectRatio="xMidYMid meet">`;
    /* 能源源头 */
    const sources = [
      { x: 14, y: rowMid(1) - 96, label: '电网接入', color: '#37e6ff', ico: '⚡' },
      { x: 14, y: rowMid(1) - 8, label: '光伏系统', color: '#ffc53d', ico: '☀' },
      { x: 14, y: rowMid(1) + 80, label: '储能系统', color: '#9d7bff', ico: '▣' },
    ];
    sources.forEach((src) => {
      s += `<g>
        <rect x="${src.x}" y="${src.y - 20}" width="104" height="46" rx="6" fill="rgba(12,32,70,.8)" stroke="${src.color}" stroke-opacity=".55"/>
        <text x="${src.x + 14}" y="${src.y + 8}" fill="${src.color}" font-size="17" font-weight="700">${src.ico}</text>
        <text class="src-txt" x="${src.x + 38}" y="${src.y + 3}">${src.label}</text>
        <line class="energy-line" x1="${src.x + 104}" y1="${src.y + 3}" x2="152" y2="${src.y + 3}" stroke="${src.color}" stroke-width="1.6" stroke-opacity=".8"/>
      </g>`;
    });
    /* 母线 */
    s += `<line x1="152" y1="${rowMid(0)}" x2="152" y2="${rowMid(rows - 1)}" stroke="rgba(80,160,255,.5)" stroke-width="2.5"/>`;
    /* 每行 */
    for (let r = 0; r < rows; r++) {
      const y = rowMid(r);
      s += `<text class="zone-txt" x="166" y="${y + 4}">${String.fromCharCode(65 + r)} 区</text>`;
      s += `<line x1="176" y1="${y}" x2="978" y2="${y}" stroke="rgba(80,160,255,.30)" stroke-width="1.4"/>`;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const p = piles[i];
        const x = bayX(c);
        if (!p) { /* 备用车位 */
          s += `<g><rect x="${x}" y="${y - 34}" width="88" height="68" rx="5" fill="rgba(10,26,56,.35)" stroke="rgba(90,140,200,.22)" stroke-dasharray="4 4"/>
          <text class="id-txt" x="${x + 44}" y="${y + 3}" text-anchor="middle">备用车位</text></g>`;
          continue;
        }
        const color = C[p.status];
        if (p.status === 'charging') {
          s += `<line class="energy-line" x1="176" y1="${y - 18}" x2="${x + 2}" y2="${y - 18}" stroke="${color}" stroke-width="1.4" stroke-opacity=".75"/>`;
        }
        s += `<g class="bay" data-id="${p.id}" transform="translate(${x}, ${y - 34})">
          <rect class="bay-hit" width="88" height="68"/>
          <rect class="bay-frame" x="0" y="0" width="88" height="68" rx="5" fill="rgba(12,32,70,.5)" stroke="rgba(90,170,255,.32)"/>
          <rect x="26" y="8" width="56" height="52" rx="3" fill="rgba(8,24,54,.7)" stroke="rgba(70,140,220,.35)" stroke-dasharray="3 3"/>
          <rect x="5" y="14" width="15" height="32" rx="2" fill="rgba(28,66,124,.9)" stroke="${color}" stroke-opacity=".9"/>
          <circle class="pile-lamp" cx="12.5" cy="22" r="2.8" fill="${color}" ${p.status === 'fault' ? 'style="animation-duration:.6s"' : ''}/>
          <text class="id-txt" x="12.5" y="40" text-anchor="middle">${p.id.split('-')[1]}</text>`;
        if (p.status === 'charging') {
          s += `<g class="car-body">
            <rect x="30" y="16" width="48" height="28" rx="7" fill="#16345f" stroke="rgba(120,200,255,.45)"/>
            <rect x="36" y="20" width="14" height="7" rx="2" fill="#0a1e3c"/>
            <rect x="56" y="20" width="14" height="7" rx="2" fill="#0a1e3c"/>
            <text class="soc-txt" data-id="${p.id}" x="54" y="38" text-anchor="middle">${p.soc}%</text>
          </g>`;
        } else {
          s += `<text class="soc-txt" data-id="${p.id}" x="54" y="38" text-anchor="middle" fill="${p.status === 'idle' ? '#7fa8cf' : '#5a7492'}" style="font-size:11px;font-weight:400">${{ idle: '空闲', fault: '故障', offline: '离线' }[p.status]}</text>`;
        }
        s += `<text class="id-txt" x="44" y="63" text-anchor="middle">${p.type === '直流快充' ? 'DC·' + p.kw + 'kW' : 'AC·7kW'}</text>
        </g>`;
      }
    }
    s += `</svg>`;
    stage.innerHTML = s;
    if (selected) { // 重建后恢复选中高亮
      const bay = stage.querySelector(`.bay[data-id="${selected}"]`);
      if (bay) bay.classList.add('sel');
    }
  }
  let selected = null;
  buildLayout();
  /* 容器尺寸变化时重算行距重建（防抖） */
  let rsTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(buildLayout, 200);
  });

  /* ============================================================
     桩监视网格（4 列行 + 无缝滚动）
     ============================================================ */
  const ST_MAP = {
    charging: { cls: 'run', txt: '充电中' },
    idle: { cls: 'dim', txt: '空闲' },
    fault: { cls: 'err', txt: '故障' },
    offline: { cls: 'warn', txt: '离线' },
  };
  document.getElementById('pile-count-lab').textContent = `共 ${st.piles} 桩 · 快充 ${st.fast}`;

  function pileCard(p) {
    const sm = ST_MAP[p.status];
    const kwHtml = p.status === 'charging'
      ? `<span class="kw">${p.power.toFixed(1)}<small> kW</small></span><span class="eta">剩余 <b>${p.eta}</b></span>`
      : `<span class="kw ${p.status === 'idle' ? 'idle' : 'off'}">${p.status === 'idle' ? '待机' : p.status === 'fault' ? '故障' : '离线'}</span><span class="eta">${p.type}</span>`;
    return `
    <div class="pile" data-id="${p.id}">
      <div class="row1"><span class="pid">${p.id}</span><span class="pt">${p.type === '直流快充' ? p.kw + 'kW' : '7kW'}</span><span class="st"><span class="st-badge ${sm.cls}">${sm.txt}</span></span></div>
      <div class="plate">${p.status === 'charging' ? p.plate : p.type + ' · ' + (p.status === 'fault' ? '待检修' : p.status === 'offline' ? '计划检修' : '可预约')}</div>
      <div class="metrics">${kwHtml}</div>
      <div class="soc-bar"><span class="soc-fi" style="width:${p.soc}%; ${p.status === 'fault' ? 'background:linear-gradient(90deg,#8a2a3c,#ff5d7a);box-shadow:0 0 8px rgba(255,93,122,.5)' : ''}"></span></div>
    </div>`;
  }

  let cursor = 0;
  function nextBatch() {
    const batch = [];
    for (let k = 0; k < 4; k++) {
      if (cursor >= piles.length) cursor = 0;
      batch.push(piles[cursor++]);
    }
    return batch;
  }
  const pileRowsHost = document.getElementById('pile-rows');
  for (let r = 0; r < 6; r++) {
    const row = document.createElement('div');
    row.className = 'pile-row';
    row.innerHTML = nextBatch().map(pileCard).join('');
    pileRowsHost.appendChild(row);
  }
  CC.vMarquee(document.getElementById('pile-scroll'), {
    speed: 14,
    onRecycle: (row) => { row.innerHTML = nextBatch().map(pileCard).join(''); },
  });

  /* ---------- 双向选中联动 ---------- */
  function selectPile(id) {
    selected = id === selected ? null : id;
    document.querySelectorAll('.pile').forEach((el) => el.classList.toggle('sel', el.dataset.id === selected));
    document.querySelectorAll('.bay').forEach((el) => el.classList.toggle('sel', el.dataset.id === selected));
  }
  stage.addEventListener('click', (e) => {
    const bay = e.target.closest('.bay');
    if (bay) selectPile(bay.dataset.id);
  });
  document.getElementById('pile-rows').addEventListener('click', (e) => {
    const card = e.target.closest('.pile');
    if (card) selectPile(card.dataset.id);
  });

  /* ============================================================
     水球
     ============================================================ */
  const WAVE_D = 'M420,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C514,6.5,518,4.7,528.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H420z M420,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C326,6.5,322,4.7,311.5,2.7C304.3,1.4,293.6-0.1,280,0c0,0,0,0,0,0v20H420z M140,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C234,6.5,238,4.7,248.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H140z M140,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C46,6.5,42,4.7,31.5,2.7C24.3,1.4,13.6-0.1,0,0c0,0,0,0,0,0l0,20H140z';
  const wbLegends = [
    { c: '#37e6ff', n: '快充使用率', v: Math.min(99, Math.round(st.util * 1.12)) + '%' },
    { c: '#3d8bff', n: '慢充使用率', v: Math.max(5, Math.round(st.util * 0.45)) + '%' },
    { c: '#9d7bff', n: '峰值同时率', v: Math.min(99, Math.round(st.util * 1.35)) + '%' },
    { c: '#2df0a6', n: '车位周转', v: CC.rndInt(3, 6) + ' 次/日' },
  ];
  document.getElementById('wb-wrap').innerHTML = `
    <div class="wb-box">
      <div class="wb-water" id="wb-water" style="transform:translateY(100%)">
        <svg class="wb-wave back" viewBox="0 0 560 20" preserveAspectRatio="none"><path d="${WAVE_D}"/></svg>
        <svg class="wb-wave front" viewBox="0 0 560 20" preserveAspectRatio="none"><path d="${WAVE_D}"/></svg>
      </div>
      <div class="wb-pct"><div class="n" id="wb-n">0</div><div class="t">利用率 UTILIZATION</div></div>
    </div>
    <div class="wb-legend">
      ${wbLegends.map((l) => `<div class="it"><i style="color:${l.c};background:${l.c}"></i><span class="nm">${l.n}</span><span class="pv">${l.v}</span></div>`).join('')}
    </div>`;
  setTimeout(() => {
    CC.countUp(document.getElementById('wb-n'), st.util, { duration: 2000, suffix: '' });
    document.getElementById('wb-water').style.transform = `translateY(${100 - st.util}%)`;
  }, 600);

  /* ============================================================
     实时订单（本站）
     ============================================================ */
  const orderBody = document.getElementById('order-body');
  let orderClock = new Date();
  function orderRow() {
    const p = CC.pick(piles.filter((x) => x.status === 'charging').length ? piles.filter((x) => x.status === 'charging') : piles);
    const kwh = CC.rnd(10, 78).toFixed(1);
    const money = (kwh * CC.rnd(0.9, 1.5)).toFixed(2);
    const done = Math.random() < 0.55;
    orderClock = new Date(orderClock.getTime() + CC.rndInt(3, 30) * 1000);
    return `
      <span class="num">${CC.pad(orderClock.getHours())}:${CC.pad(orderClock.getMinutes())}:${CC.pad(orderClock.getSeconds())}</span>
      <span class="pl">${p.id}</span>
      <span class="st">${done ? CC.pick(['鲁A', '鲁A', '鲁B']) + '·' + CC.pad(CC.rndInt(0, 99)) + CC.pick(['K', 'M', 'F', '8', '6']) + CC.pick(['8', '5', '2', 'D']) : p.plate}</span>
      <span class="num">${kwh}</span>
      <span class="num">¥${money}</span>
      <span style="text-align:right">${done ? '<span class="st-badge ok">已结算</span>' : '<span class="st-badge run">充电中</span>'}</span>`;
  }
  for (let i = 0; i < 12; i++) {
    const row = document.createElement('div');
    row.className = 'ord-row st';
    row.innerHTML = orderRow();
    orderBody.appendChild(row);
  }
  CC.vMarquee(document.getElementById('order-scroll'), {
    speed: 16,
    onRecycle: (row) => { row.innerHTML = orderRow(); },
  });

  /* ---------- 事件 ---------- */
  const EVENTS = [
    ['中', `<b>${st.name}</b> 储能系统 SOC 充至 68%，进入浮充状态。`],
    ['低', `<b>谷时时段</b> 22:00 启动，充电价格下浮 0.32 元/kWh。`],
    ['中', `运维班组 <b>ZC-07</b> 完成 ${Math.max(1, pileStat.fault)} 张检修工单闭环。`],
    ['低', `<b>车牌识别</b> 相机今日识别 ${CC.rndInt(180, 420)} 次，准确率 99.6%。`],
    ['高', pileStat.fault > 0 ? `检测到 <b>${pileStat.fault} 台故障桩</b>，请关注桩群监视面板。` : `<b>配电房</b> 温度 38.2℃，处于正常阈值内。`],
    ['低', `今日 <b>会员充电</b> 占比 ${CC.rndInt(38, 62)}%，客单价高于均值 14%。`],
  ];
  const alertHost = document.getElementById('alert-list');
  const highCount = EVENTS.filter((e) => e[0] === '高').length;
  document.getElementById('evt-high').textContent = `高危 ${highCount}`;
  function evtItem() {
    const [lv, tx] = CC.pick(EVENTS);
    const t = new Date(Date.now() - CC.rndInt(0, 120) * 60000);
    return `<span class="tm">${CC.pad(t.getHours())}:${CC.pad(t.getMinutes())}</span><span class="lv ${lv === '高' ? 'h' : lv === '中' ? 'm' : 'l'}">${lv}</span><span class="tx">${tx}</span>`;
  }
  for (let i = 0; i < 6; i++) {
    const it = document.createElement('div');
    it.className = 'alert-it';
    it.innerHTML = evtItem();
    alertHost.appendChild(it);
  }
  CC.vMarquee(document.getElementById('alert-scroll'), { speed: 11, onRecycle: (it) => { it.innerHTML = evtItem(); } });

  /* ============================================================
     实时脉动：SOC/功率 4s · 经营指标 5s · 水球利用率 12s
     ============================================================ */
  const statEls = [...document.querySelectorAll('#stat-strip .v')];
  const igKwh = document.getElementById('ig-kwh');
  const igIncome = document.getElementById('ig-income');
  const liveSt = { kwh: st.kwh, orders: st.orders, income: st.income };
  let livePower = curPower;

  setInterval(() => { // SOC 递增 / 功率抖动 → 指标带 + 功率曲线
    let total = 0;
    piles.forEach((p) => {
      if (p.status === 'charging') {
        p.soc = Math.min(99, p.soc + CC.rndInt(0, 2));
        p.power = Math.max(12, Math.min(p.kw, +(p.power + CC.rnd(-5, 5)).toFixed(1)));
        p.eta = (Math.round((100 - p.soc) * 1.4) + 4) + ' 分钟';
        total += p.power;
        const txt = stage.querySelector(`.soc-txt[data-id="${p.id}"]`);
        if (txt) txt.textContent = p.soc + '%';
      }
    });
    const shown = +total.toFixed(1);
    document.getElementById('st-power-now').textContent = `▲ 当前 ${shown} kW`;
    if (statEls[0]) CC.countUp(statEls[0], shown, { from: livePower, digits: 1, duration: 900 });
    livePower = shown;
    stPowerData[nowHour] = +Math.max(5, total).toFixed(1);
    stPowerChart.setOption({ series: [{ data: stPowerData }] });
  }, 4000);

  setInterval(() => { // 经营指标微增 → 档案 + 指标带翻牌
    const prev = { ...liveSt };
    liveSt.kwh += CC.rndInt(4, 14);
    liveSt.income += CC.rndInt(18, 60);
    if (Math.random() < 0.5) liveSt.orders += 1;
    st.kwh = liveSt.kwh; st.orders = liveSt.orders; st.income = liveSt.income;
    CC.countUp(igKwh, liveSt.kwh, { from: prev.kwh, duration: 1200 });
    CC.countUp(igIncome, liveSt.income, { from: prev.income, duration: 1200 });
    CC.countUp(statEls[3], liveSt.orders, { from: prev.orders, duration: 1000 });
  }, 5000);

  setInterval(() => { // 水球利用率微扰
    const prevUtil = st.util;
    st.util = Math.max(15, Math.min(96, st.util + CC.rndInt(-2, 2)));
    CC.countUp(document.getElementById('wb-n'), st.util, { from: prevUtil, duration: 1400 });
    document.getElementById('wb-water').style.transform = `translateY(${100 - st.util}%)`;
  }, 12000);
})();
