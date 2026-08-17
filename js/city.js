/* ============================================================
   city.js — 全市站点总览大屏
   ============================================================ */
(function () {
  'use strict';
  const { STATIONS, ST_STATUS, buildPiles } = window.DATA;
  const CC = window.CC;
  const CHARTS = [];

  /* ---------- 全局聚合 ---------- */
  const TOTAL = {
    piles: 0, fast: 0, kwh: 0, orders: 0, income: 0,
    charging: 0, idle: 0, fault: 0, offline: 0,
  };
  const pileCache = {};
  STATIONS.forEach((st) => {
    TOTAL.piles += st.piles; TOTAL.fast += st.fast;
    TOTAL.kwh += st.kwh; TOTAL.orders += st.orders; TOTAL.income += st.income;
    const piles = buildPiles(st);
    pileCache[st.id] = piles;
    piles.forEach((p) => { TOTAL[p.status] = (TOTAL[p.status] || 0) + 1; });
  });
  const CO2 = +(TOTAL.kwh * 0.012).toFixed(1); // 度电减排系数演示值

  /* ---------- 启动 ---------- */
  CC.fitScreen();
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
  CC.buildHeader({
    title: '济南市智慧充电运营监管平台',
    subtitle: 'JINAN SMART CHARGING OPERATION SUPERVISORY PLATFORM',
  });
  CC.decoratePanels();
  CC.playBoot('智慧充电运营监管平台');
  CC.plexus();
  document.getElementById('pile-total-lab').textContent = `${TOTAL.piles} PILES`;
  document.getElementById('map-nodes-lab').textContent = `GEO-NET LINKED · ${STATIONS.length} NODES`;

  CC.buildTicker([
    ['调度', `全市 ${TOTAL.charging} 台充电桩正在作业，实时负荷 ${(TOTAL.charging * 68 / 1000).toFixed(1)} MW，电网运行平稳。`],
    ['活动', '今晚 22:00-24:00 谷时充电优惠上线，参与站点 18 座，预计分流高峰负荷 12%。'],
    ['工单', 'ST022 百脉泉公园站 3 号桩通信模块异常，运维班组已派出，预计 40 分钟内到达。'],
    ['公告', '历城区新增 2 座超充站规划公示，合计 48 桩，含 480kW 液冷超充 12 桩。'],
    ['安全', '今日全市消防巡检完成率 96%，未发现重大安全隐患。'],
    ['双碳', `本月累计充电 ${fmt(TOTAL.kwh * 30 / 10000, 1)} 万 kWh，折合减碳约 ${fmt(CO2 * 30, 0)} 吨。`],
  ]);

  function fmt(n, d = 0) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* ---------- 中央指标带 ---------- */
  const stripStats = [
    { v: STATIONS.length, l: '在营站点', u: '座', accent: '#37e6ff' },
    { v: TOTAL.piles, l: '充电桩总数', u: '桩', accent: '#3d8bff' },
    { v: TOTAL.fast, l: '直流快充', u: '桩', accent: '#9d7bff' },
    { v: TOTAL.charging, l: '正在充电', u: '桩', accent: '#2df0a6' },
    { v: TOTAL.idle, l: '空闲可用', u: '桩', accent: '#8fd8f5' },
    { v: TOTAL.fault + TOTAL.offline, l: '故障/离线', u: '桩', accent: '#ff5d7a' },
  ];
  document.getElementById('stat-strip').innerHTML = stripStats.map((s, i) => `
    <div class="stat" style="--accent:${s.accent}; animation-delay:${0.08 * i}s">
      <div class="v" data-count="${s.v}">0</div>
      <div class="l">${s.l} <b>/${s.u}</b></div>
    </div>`).join('');
  document.querySelectorAll('#stat-strip .v').forEach((el) => CC.countUp(el, +el.dataset.count, { duration: 1400 + Math.random() * 600 }));

  /* ---------- KPI 四宫格 ---------- */
  const kpis = [
    { lab: '今日总充电量', en: 'ENERGY TODAY', val: TOTAL.kwh, unit: 'kWh', digits: 0, accent: '#37e6ff', trend: 12.4, cmp: '较昨日' },
    { lab: '今日订单数', en: 'ORDERS TODAY', val: TOTAL.orders, unit: '单', digits: 0, accent: '#3d8bff', trend: 8.7, cmp: '较昨日' },
    { lab: '今日营收', en: 'REVENUE TODAY', val: TOTAL.income, unit: '元', digits: 0, accent: '#ffc53d', trend: 6.2, cmp: '较昨日' },
    { lab: '累计减碳', en: 'CO₂ REDUCED', val: CO2, unit: '吨', digits: 1, accent: '#2df0a6', trend: 15.1, cmp: '较昨日' },
  ];
  document.getElementById('kpi-grid').innerHTML = kpis.map((k, i) => `
    <div class="kpi" style="--accent:${k.accent}; animation-delay:${0.1 * i}s">
      <div class="lab">${k.lab}<span class="en">${k.en}</span></div>
      <div><span class="val" data-count="${k.val}" data-digits="${k.digits}">0</span><span class="unit">${k.unit}</span></div>
      <div class="foot"><span class="trend up">+${k.trend}%</span><span class="cmp">${k.cmp}同时段</span></div>
    </div>`).join('');
  document.querySelectorAll('#kpi-grid .val').forEach((el) => CC.countUp(el, +el.dataset.count, { digits: +el.dataset.digits, duration: 1800 }));

  /* ============================================================
     地图
     ============================================================ */
  echarts.registerMap('jinan', window.CITY_GEOJSON);
  const mapChart = echarts.init(document.getElementById('chart-map'));
  CHARTS.push(mapChart);

  const HUB = STATIONS[0];
  const lineTargets = ['ST010', 'ST013', 'ST016', 'ST021', 'ST026', 'ST008'];
  const mapBase = {
    geo: {
      map: 'jinan',
      roam: false,
      zoom: 1.08,
      layoutCenter: ['50%', '54%'],
      layoutSize: '108%',
      label: { show: true, color: 'rgba(150,200,240,.55)', fontSize: 10 },
      itemStyle: {
        areaColor: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(20,60,130,.75)' },
            { offset: 1, color: 'rgba(8,24,60,.85)' },
          ],
        },
        borderColor: 'rgba(80,190,255,.55)',
        borderWidth: 1.2,
        shadowColor: 'rgba(40,150,255,.45)',
        shadowBlur: 22,
        shadowOffsetY: 10,
      },
      emphasis: {
        label: { color: '#aef3ff' },
        itemStyle: { areaColor: 'rgba(35,110,190,.9)' },
      },
    },
    tooltip: {
      ...CC.TOOLTIP,
      trigger: 'item',
      formatter: (p) => {
        if (p.seriesType === 'effectScatter' && p.data.st) {
          const st = p.data.st;
          return `<b style="color:#aef3ff">${st.name}</b><br/>
            ${st.district} · ${st.addr}<br/>
            充电桩 ${st.piles}（快充 ${st.fast}）· 利用率 ${st.util}%<br/>
            今日电量 ${fmt(st.kwh)} kWh · 订单 ${st.orders} 单`;
        }
        if (p.seriesType === 'lines') return `能源馈线 · ${p.data.toName}`;
        return p.name;
      },
    },
    series: [],
  };

  function stationSeries(list) {
    return list.map((st) => ({
      type: 'effectScatter',
      coordinateSystem: 'geo',
      name: st.district,
      rippleEffect: { brushType: 'stroke', scale: st.status === 'alarm' ? 4 : 2.6, period: st.status === 'alarm' ? 2 : 4 },
      symbolSize: st.status === 'offline' ? 8 : 9 + st.piles * 0.34,
      itemStyle: { color: ST_STATUS[st.status].color, shadowBlur: 12, shadowColor: ST_STATUS[st.status].color },
      data: [{
        value: [st.lon, st.lat, st.piles],
        name: st.name,
        id: st.id,
        st,
      }],
      zlevel: 2,
    }));
  }

  function linesSeries(list) {
    const ok = list.some((s) => s.id === HUB.id);
    if (!ok) return [];
    return [{
      type: 'lines',
      coordinateSystem: 'geo',
      zlevel: 3,
      effect: { show: true, period: 4.5, trailLength: 0.55, symbol: 'circle', symbolSize: 4, color: '#7ff0ff' },
      lineStyle: { color: '#2ea8ff', width: 1.1, opacity: 0.35, curveness: 0.25 },
      data: lineTargets
        .filter((id) => list.some((s) => s.id === id))
        .map((id) => {
          const t = STATIONS.find((s) => s.id === id);
          return { coords: [[HUB.lon, HUB.lat], [t.lon, t.lat]], toName: t.name };
        }),
    }];
  }

  const FOCUS = { id: 'focus', type: 'scatter', coordinateSystem: 'geo', zlevel: 4, symbolSize: 30, itemStyle: { color: 'transparent', borderColor: '#eaffff', borderWidth: 1.6, shadowBlur: 14, shadowColor: '#7df0ff' }, data: [] };

  function renderMap(list) {
    mapChart.setOption({ ...mapBase, series: [...stationSeries(list), ...linesSeries(list), FOCUS] }, { replaceMerge: ['series'] });
  }
  renderMap(STATIONS);

  /* ---------- 站点浮窗 ---------- */
  const pop = document.getElementById('st-pop');
  let selectedId = null;
  function showStation(st, fromAuto) {
    selectedId = st.id;
    document.getElementById('sp-name').textContent = st.name;
    document.getElementById('sp-addr').textContent = `${st.district} · ${st.addr}`;
    document.getElementById('sp-piles').innerHTML = `${st.piles} <small>桩</small>`;
    document.getElementById('sp-kwh').innerHTML = `${fmt(st.kwh)} <small>kWh</small>`;
    document.getElementById('sp-orders').innerHTML = `${st.orders} <small>单</small>`;
    document.getElementById('sp-income').innerHTML = `¥${fmt(st.income)} <small>元</small>`;
    document.getElementById('sp-util').innerHTML = `${st.util} <small>%</small>`;
    const badge = { normal: ['ok', '正常运行'], busy: ['run', '高负荷'], alarm: ['err', '故障告警'], offline: ['warn', '离线检修'] }[st.status];
    document.getElementById('sp-status').innerHTML = `<span class="st-badge ${badge[0]}">${badge[1]}</span>`;
    pop.classList.add('show');
    FOCUS.data = [{ value: [st.lon, st.lat] }];
    mapChart.setOption({ series: [{ id: 'focus', data: FOCUS.data }] });
    if (!fromAuto) autoLockUntil = Date.now() + 60_000;
  }
  document.getElementById('st-pop-close').addEventListener('click', () => {
    pop.classList.remove('show');
    selectedId = null;
    FOCUS.data = [];
    mapChart.setOption({ series: [{ id: 'focus', data: [] }] });
    autoLockUntil = 0;
  });
  document.getElementById('sp-go').addEventListener('click', () => {
    location.href = `station.html?id=${selectedId}`;
  });

  /* ---------- 行政区筛选 ---------- */
  const DISTRICTS = ['全部', '历下区', '市中区', '槐荫区', '天桥区', '历城区', '章丘区', '长清区'];
  const chipsHost = document.getElementById('dist-chips');
  chipsHost.innerHTML = DISTRICTS.map((d, i) => `<span class="dist-chip${i === 0 ? ' on' : ''}" data-d="${d}">${d}</span>`).join('');
  chipsHost.addEventListener('click', (e) => {
    const chip = e.target.closest('.dist-chip');
    if (!chip) return;
    chipsHost.querySelectorAll('.dist-chip').forEach((c) => c.classList.remove('on'));
    chip.classList.add('on');
    const d = chip.dataset.d;
    renderMap(d === '全部' ? STATIONS : STATIONS.filter((s) => s.district === d));
    pop.classList.remove('show');
    autoLockUntil = Date.now() + 30_000;
  });

  /* ---------- 地图点击 ---------- */
  mapChart.on('click', (params) => {
    if (params.seriesType === 'effectScatter' && params.data.st) showStation(params.data.st);
  });

  /* ---------- 自动巡检 ---------- */
  let patrolIdx = 0, autoLockUntil = 0;
  setInterval(() => {
    if (Date.now() < autoLockUntil || pop.matches(':hover')) return;
    showStation(STATIONS[patrolIdx % STATIONS.length], true);
    patrolIdx++;
  }, 8000);

  /* ============================================================
     桩状态环图
     ============================================================ */
  const donut = echarts.init(document.getElementById('chart-donut'));
  CHARTS.push(donut);
  donut.setOption({
    tooltip: { ...CC.TOOLTIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
    legend: {
      orient: 'vertical', right: 12, top: 'middle', icon: 'diamond', itemWidth: 9, itemHeight: 9,
      textStyle: { color: '#a9c6e4', fontSize: 12 }, itemGap: 14,
    },
    title: {
      text: `${TOTAL.piles}`, subtext: '桩总数', left: '31%', top: '38%',
      textAlign: 'center', textStyle: { color: '#f2faff', fontSize: 30, fontFamily: 'Bahnschrift', fontWeight: 700 },
      subtextStyle: { color: '#6d89ad', fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['32%', '52%'],
      label: { show: false },
      emphasis: { scaleSize: 6, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(55,230,255,.5)' } },
      itemStyle: { borderColor: '#04101f', borderWidth: 2 },
      animationType: 'scale', animationEasing: 'elasticOut',
      data: [
        { value: TOTAL.charging, name: '充电中', itemStyle: { color: '#37e6ff' } },
        { value: TOTAL.idle, name: '空闲', itemStyle: { color: '#3d8bff' } },
        { value: TOTAL.fault, name: '故障', itemStyle: { color: '#ff5d7a' } },
        { value: TOTAL.offline, name: '离线', itemStyle: { color: '#5a7492' } },
      ],
    }],
  });

  /* ============================================================
     全市负荷功率
     ============================================================ */
  const powerChart = echarts.init(document.getElementById('chart-power'));
  CHARTS.push(powerChart);
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  function powerAt(h) { // 双峰曲线 + 噪声
    const morning = Math.exp(-Math.pow(h - 10.5, 2) / 9) * 9.2;
    const evening = Math.exp(-Math.pow(h - 20, 2) / 7) * 12.6;
    const base = 1.6 + Math.sin(h) * 0.15;
    return +(base + morning + evening).toFixed(2);
  }
  const nowHour = new Date().getHours();
  const powerData = hours.map((_, h) => (h <= nowHour ? powerAt(h) : null));
  const powerForecast = hours.map((_, h) => (h >= nowHour ? powerAt(h) : null));
  powerChart.setOption({
    tooltip: { ...CC.TOOLTIP, trigger: 'axis', valueFormatter: (v) => v == null ? '-' : v + ' MW' },
    grid: { left: 8, right: 14, top: 30, bottom: 4, containLabel: true },
    legend: { right: 6, top: 0, textStyle: { color: '#6d89ad', fontSize: 11 }, itemWidth: 14, icon: 'rect' },
    xAxis: { type: 'category', boundaryGap: false, data: hours, ...CC.AXIS },
    yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#6d89ad' }, ...CC.AXIS },
    series: [
      {
        name: '实时负荷', type: 'line', data: powerData, smooth: 0.4,
        lineStyle: { color: '#37e6ff', width: 2.2, shadowBlur: 10, shadowColor: 'rgba(55,230,255,.6)' },
        itemStyle: { color: '#37e6ff' }, showSymbol: false,
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(55,230,255,.4)' }, { offset: 1, color: 'rgba(55,230,255,.02)' },
          ] },
        },
        markLine: {
          symbol: 'none', label: { color: '#ffc53d', fontSize: 10, formatter: '峰值预警 {c}MW' },
          lineStyle: { color: 'rgba(255,197,61,.7)', type: 'dashed' },
          data: nowHour > 17 ? [{ yAxis: 14 }] : [],
        },
      },
      {
        name: '预测曲线', type: 'line', data: powerForecast, smooth: 0.4,
        lineStyle: { color: 'rgba(157,123,255,.75)', width: 1.6, type: 'dashed' },
        itemStyle: { color: '#9d7bff' }, showSymbol: false,
      },
    ],
  });
  const nowPower = powerAt(nowHour);
  document.getElementById('power-now').textContent = `▲ 当前 ${nowPower.toFixed(1)} MW`;

  /* ============================================================
     24 小时电量与订单
     ============================================================ */
  const trendChart = echarts.init(document.getElementById('chart-24h'));
  CHARTS.push(trendChart);
  const kwhSeries = hours.map((_, h) => (h <= nowHour ? Math.round(powerAt(h) * 1000 * 1.28 + (h * 37) % 260) : null));
  const orderSeries = hours.map((_, h) => (h <= nowHour ? Math.round(powerAt(h) * 128 + (h * 13) % 40) : null));
  trendChart.setOption({
    tooltip: { ...CC.TOOLTIP, trigger: 'axis' },
    grid: { left: 10, right: 12, top: 34, bottom: 2, containLabel: true },
    legend: { right: 8, top: 0, textStyle: { color: '#6d89ad', fontSize: 11 }, itemWidth: 14 },
    xAxis: { type: 'category', data: hours, ...CC.AXIS },
    yAxis: [
      { type: 'value', name: 'kWh', nameTextStyle: { color: '#6d89ad' }, ...CC.AXIS, splitLine: { show: false } },
      { type: 'value', name: '单', nameTextStyle: { color: '#6d89ad' }, ...CC.AXIS, splitLine: { show: false } },
    ],
    series: [
      {
        name: '充电量', type: 'bar', data: kwhSeries, barWidth: '46%',
        itemStyle: {
          borderRadius: [2, 2, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: '#37e6ff' }, { offset: 1, color: 'rgba(20,80,180,.35)' },
          ] },
        },
        markPoint: {
          symbolSize: 42, itemStyle: { color: 'rgba(255,197,61,.9)' },
          label: { fontSize: 9, color: '#3a2500' },
          data: [{ type: 'max', name: '峰值' }],
        },
      },
      {
        name: '订单数', type: 'line', yAxisIndex: 1, data: orderSeries, smooth: true,
        lineStyle: { color: '#2df0a6', width: 2 }, itemStyle: { color: '#2df0a6' }, showSymbol: false,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(45,240,166,.22)' }, { offset: 1, color: 'rgba(45,240,166,0)' },
        ] } },
      },
    ],
  });

  /* ============================================================
     站点排行
     ============================================================ */
  const rankHost = document.getElementById('rank-list');
  function renderRank() {
    const top = [...STATIONS].sort((a, b) => b.kwh - a.kwh).slice(0, 8);
    rankHost.innerHTML = top.map((st, i) => `
      <div class="rank-it" data-id="${st.id}">
        <span class="rank-no">${i + 1}</span>
        <span class="nm" title="${st.name}">${st.name}</span>
        <span class="bar-bg"><span class="bar-fi" data-w="${(st.kwh / top[0].kwh * 100).toFixed(1)}"></span></span>
        <span class="pv">${fmt(st.kwh)}<small style="color:var(--dim);font-size:10px"> kWh</small></span>
      </div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rankHost.querySelectorAll('.bar-fi').forEach((b) => (b.style.width = b.dataset.w + '%'));
    }));
  }
  renderRank();
  rankHost.addEventListener('click', (e) => {
    const it = e.target.closest('.rank-it');
    if (!it) return;
    const st = STATIONS.find((s) => s.id === it.dataset.id);
    renderMap(STATIONS);
    chipsHost.querySelectorAll('.dist-chip').forEach((c, i) => c.classList.toggle('on', i === 0));
    showStation(st);
  });

  /* ============================================================
     实时订单流水
     ============================================================ */
  const orderBody = document.getElementById('order-body');
  const PAY = ['微信', '支付宝', 'APP', '刷卡', '会员'];
  let orderClock = new Date();
  function orderRow() {
    const st = CC.pick(STATIONS);
    const pile = CC.pick(pileCache[st.id]);
    const kwh = CC.rnd(12, 86).toFixed(1);
    const money = (kwh * CC.rnd(0.9, 1.5)).toFixed(2);
    const done = Math.random() < 0.55;
    orderClock = new Date(orderClock.getTime() + CC.rndInt(4, 40) * 1000);
    return `
      <span class="num">${CC.pad(orderClock.getHours())}:${CC.pad(orderClock.getMinutes())}:${CC.pad(orderClock.getSeconds())}</span>
      <span class="st" title="${st.name}">${st.name.replace('站', '')}</span>
      <span class="pl">${pile ? pile.id : '--'}</span>
      <span class="num">${kwh}</span>
      <span class="num">¥${money}</span>
      <span style="text-align:right">${done ? '<span class="st-badge ok">已结算</span>' : '<span class="st-badge run">充电中</span>'}</span>`;
  }
  function fillOrders(n) {
    orderBody.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const row = document.createElement('div');
      row.className = 'ord-row';
      row.innerHTML = orderRow();
      orderBody.appendChild(row);
    }
  }
  fillOrders(18);
  CC.vMarquee(document.getElementById('order-scroll'), {
    speed: 16,
    onRecycle: (row) => {
      row.innerHTML = orderRow();
      row.classList.remove('new-row');
      void row.offsetWidth;
      row.classList.add('new-row');
    },
  });

  /* ============================================================
     告警列表
     ============================================================ */
  const ALERT_POOL = [
    ['高', 'ST022 百脉泉公园站 <b>V03 桩</b> 直流模块过温保护触发，已自动降功率至 60kW，请尽快巡检。'],
    ['中', 'ST020 园博园文旅站 <b>市电接入</b> 波动 ±8%，已切入储能缓冲，预计 15 分钟恢复。'],
    ['中', 'ST026 莱芜会展中心站 <b>通信网关</b> 心跳丢失，离线检修计划已同步运维班组。'],
    ['低', 'ST010 遥墙机场 T2 站 <b>充电排队</b> 车辆 6 台，建议引导至 ST013 济南东站枢纽站。'],
    ['低', 'ST004 恒隆广场站 <b>V12 桩</b> 枪头归位异常提醒，工单已自动派发。'],
    ['高', '全市电网 <b>负荷率 82%</b>，触发有序充电策略，120kW 以上桩动态限流 10%。'],
    ['中', 'ST013 济南东站枢纽站 <b>储能 SOC</b> 低于 22%，充放策略已切换为保守模式。'],
  ];
  const alertHost = document.getElementById('alert-list');
  function alertItem() {
    const [lv, tx] = CC.pick(ALERT_POOL);
    const t = new Date(Date.now() - CC.rndInt(0, 90) * 60000);
    return `<span class="tm">${CC.pad(t.getHours())}:${CC.pad(t.getMinutes())}</span><span class="lv ${lv === '高' ? 'h' : lv === '中' ? 'm' : 'l'}">${lv}</span><span class="tx">${tx}</span>`;
  }
  for (let i = 0; i < 7; i++) {
    const it = document.createElement('div');
    it.className = 'alert-it';
    it.innerHTML = alertItem();
    alertHost.appendChild(it);
  }
  CC.vMarquee(document.getElementById('alert-scroll'), {
    speed: 12,
    onRecycle: (it) => { it.innerHTML = alertItem(); },
  });

  /* ============================================================
     实时数据脉动：每 5s 随机微调全量指标，翻牌平滑滚动
     ============================================================ */
  const kpiEls = [...document.querySelectorAll('#kpi-grid .val')];
  const statEls = [...document.querySelectorAll('#stat-strip .v')];
  const LIVE = { kwh: TOTAL.kwh, orders: TOTAL.orders, income: TOTAL.income, co2: CO2, charging: TOTAL.charging, idle: TOTAL.idle };
  const CHG_IDLE_SUM = TOTAL.charging + TOTAL.idle;

  function refreshPopIfOpen() {
    if (!pop.classList.contains('show') || !selectedId) return;
    const s = STATIONS.find((x) => x.id === selectedId);
    if (!s) return;
    document.getElementById('sp-kwh').innerHTML = `${fmt(s.kwh)} <small>kWh</small>`;
    document.getElementById('sp-orders').innerHTML = `${s.orders} <small>单</small>`;
    document.getElementById('sp-income').innerHTML = `¥${fmt(s.income)} <small>元</small>`;
  }

  setInterval(() => {
    // 1) 站点级微增（离线站不计）
    STATIONS.forEach((s) => {
      if (s.status === 'offline') return;
      s.kwh += CC.rndInt(3, 11);
      s.income += CC.rndInt(12, 46);
      if (Math.random() < 0.4) s.orders += 1;
    });
    // 2) KPI 汇总翻牌（从当前值滚到新值）
    const prev = { ...LIVE };
    LIVE.kwh = STATIONS.reduce((a, s) => a + s.kwh, 0);
    LIVE.orders = STATIONS.reduce((a, s) => a + s.orders, 0);
    LIVE.income = STATIONS.reduce((a, s) => a + s.income, 0);
    LIVE.co2 = +(LIVE.kwh * 0.012).toFixed(1);
    TOTAL.kwh = LIVE.kwh; TOTAL.orders = LIVE.orders; TOTAL.income = LIVE.income;
    CC.countUp(kpiEls[0], LIVE.kwh, { from: prev.kwh, duration: 1200 });
    CC.countUp(kpiEls[1], LIVE.orders, { from: prev.orders, duration: 1200 });
    CC.countUp(kpiEls[2], LIVE.income, { from: prev.income, duration: 1200 });
    CC.countUp(kpiEls[3], LIVE.co2, { from: prev.co2, digits: 1, duration: 1200 });
    // 3) 充电中/空闲微扰（总量守恒）+ 环图联动
    LIVE.charging = Math.max(240, Math.min(360, LIVE.charging + CC.rndInt(-2, 3)));
    LIVE.idle = CHG_IDLE_SUM - LIVE.charging;
    CC.countUp(statEls[3], LIVE.charging, { from: prev.charging, duration: 1000 });
    CC.countUp(statEls[4], LIVE.idle, { from: prev.idle, duration: 1000 });
    donut.setOption({
      series: [{
        data: [
          { value: LIVE.charging, name: '充电中', itemStyle: { color: '#37e6ff' } },
          { value: LIVE.idle, name: '空闲', itemStyle: { color: '#3d8bff' } },
          { value: TOTAL.fault, name: '故障', itemStyle: { color: '#ff5d7a' } },
          { value: TOTAL.offline, name: '离线', itemStyle: { color: '#5a7492' } },
        ],
      }],
    });
    // 4) 负荷/趋势图当前小时点位抖动
    powerData[nowHour] = +(Math.max(0.8, powerData[nowHour] + CC.rnd(-0.5, 0.6))).toFixed(2);
    powerChart.setOption({ series: [{ data: powerData }, { data: powerForecast }] });
    kwhSeries[nowHour] += CC.rndInt(25, 140);
    orderSeries[nowHour] += CC.rndInt(1, 6);
    trendChart.setOption({ series: [{ data: kwhSeries }, { data: orderSeries }] });
    // 5) 浮窗联动刷新
    refreshPopIfOpen();
  }, 5000);

  /* 排行榜 10s 重排（站点电量已微增，名次可能互换） */
  setInterval(renderRank, 10000);

  /* 负荷标签 3s 微跳（活感） */
  setInterval(() => {
    document.querySelector('#power-now').textContent = `▲ 当前 ${(nowPower + CC.rnd(-0.4, 0.4)).toFixed(1)} MW`;
  }, 3000);
})();
