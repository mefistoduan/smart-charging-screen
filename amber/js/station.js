/* ============================================================
   amber/js/station.js — 熔金指挥舱 · 场站详情
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[amber-st]', e.message); } }
  const { STATIONS, buildPiles } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* 时钟 */
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  function tick() {
    const d = new Date();
    document.getElementById('clk').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.getElementById('dte').textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${WEEK[d.getDay()]}`;
  }
  tick(); setInterval(tick, 1000);

  function init() {
    const qs = new URLSearchParams(location.search);
    const st = STATIONS.find((s) => s.id === qs.get('id')) || STATIONS[0];
    const piles = buildPiles(st);
    const cnt = { charging: 0, idle: 0, fault: 0, offline: 0 };
    piles.forEach((p) => cnt[p.status]++);
    const curPower = +piles.reduce((a, p) => a + (p.status === 'charging' ? p.power : 0), 0).toFixed(1);

    document.getElementById('st-name').textContent = st.name;
    document.getElementById('st-sub').textContent = `STATION DETAIL · ${st.id} · ${st.district}`;
    document.getElementById('lay-lab').textContent = `${st.piles} PILES · FAST ${st.fast}`;

    /* KPI */
    const defs = [
      { k: '实时功率 POWER', v: curPower, u: 'kW', d: 1, dd: `峰值能力 <b>${st.fast * 150} kW</b>` },
      { k: '充电中 ACTIVE', v: cnt.charging, u: '桩', d: 0, dd: `空闲 <b>${cnt.idle}</b> 桩待命` },
      { k: '今日充电量 ENERGY', v: st.kwh, u: 'kWh', d: 0, dd: `订单 <b>${st.orders}</b> 单` },
      { k: '今日营收 REVENUE', v: st.income, u: '元', d: 0, dd: `均价 <b>1.42</b> 元/度` },
      { k: '桩位利用率 UTIL', v: st.util, u: '%', d: 0, dd: `故障 <b>${cnt.fault + cnt.offline}</b> 桩` },
      { k: '车位数 SLOTS', v: st.piles, u: '位', d: 0, dd: `${st.district} · ${st.addr}` },
    ];
    document.getElementById('kpis').innerHTML = defs.map((x) => `
      <div class="kpi"><span class="k">${x.k}</span>
        <span class="v">0<small>${x.u}</small></span><span class="d">${x.dd}</span></div>`).join('');
    const kpiEls = [...document.querySelectorAll('#kpis .v')];
    function countUp(el, target, from = 0, digits = 0, unit = '', dur = 1300) {
      const t0 = performance.now();
      const timer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.innerHTML = fmt(from + (target - from) * e, digits) + (unit ? `<small>${unit}</small>` : '');
        if (p >= 1) clearInterval(timer);
      }, 33);
    }
    defs.forEach((x, i) => setTimeout(() => countUp(kpiEls[i], x.v, 0, x.d, x.u), 120 + i * 80));

    /* 布局 SVG */
    let layout = null;
    safe(() => {
      layout = window.STLayout.build(document.getElementById('lay'), piles, {
        theme: {
          charging: '#ffb52e', idle: '#8a6a2f', fault: '#ff5d5d', offline: '#5a4c33',
          bus: 'rgba(255,181,46,.4)', lane: 'rgba(160,120,60,.25)',
          text: '#ffe6b0', dim: '#a08a5e', car: '#3a2a10', bayFill: 'rgba(45,31,10,.5)',
          bayStroke: 'rgba(200,150,70,.3)', slot: 'rgba(26,17,5,.7)', sel: '#ffd98a',
          sources: [
            { ico: '⚡', label: '电网接入', color: '#ffb52e' },
            { ico: '☀', label: '光伏系统', color: '#ffd98a' },
            { ico: '▣', label: '储能系统', color: '#c97a10' },
          ],
        },
        onPick(id) {
          document.querySelectorAll('.p-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === id));
        },
      });
    });

    /* 桩群玫瑰 */
    let rose = null;
    safe(() => {
      rose = echarts.init(document.getElementById('rose'));
      CHARTS.push(rose);
      rose.setOption({
        tooltip: { trigger: 'item', backgroundColor: 'rgba(20,13,4,.95)', borderColor: 'rgba(255,181,46,.5)', textStyle: { color: '#f2e6cc' }, formatter: '{b}: {c} 桩 ({d}%)' },
        legend: { right: 8, top: 'middle', orient: 'vertical', icon: 'diamond', itemWidth: 8, itemHeight: 8, textStyle: { color: '#a08a5e', fontSize: 11 } },
        series: [{
          type: 'pie', radius: ['30%', '72%'], center: ['36%', '52%'], roseType: 'radius',
          itemStyle: { borderColor: '#160f05', borderWidth: 2 }, label: { show: false },
          data: [
            { value: cnt.charging, name: '充电中', itemStyle: { color: '#ffb52e' } },
            { value: cnt.idle, name: '空闲', itemStyle: { color: '#8a6a2f' } },
            { value: cnt.fault, name: '故障', itemStyle: { color: '#ff5d5d' } },
            { value: cnt.offline, name: '离线', itemStyle: { color: '#5a4c33' } },
          ],
        }],
      });
    });

    /* 功率曲线 */
    let load = null;
    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const nowH = new Date().getHours();
    const peak = Math.max(st.fast * 90, 60);
    const pAt = (h) => +(peak * (0.12 + Math.exp(-((h - 10.5) ** 2) / 9) * .55 + Math.exp(-((h - 20) ** 2) / 7) * .85)).toFixed(1);
    const pData = hours.map((_, h) => (h <= nowH ? pAt(h) : null));
    safe(() => {
      load = echarts.init(document.getElementById('load'));
      CHARTS.push(load);
      load.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(20,13,4,.95)', borderColor: 'rgba(255,181,46,.5)', textStyle: { color: '#f2e6cc' } },
        grid: { left: 6, right: 10, top: 24, bottom: 2, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: hours, axisLine: { lineStyle: { color: 'rgba(255,181,46,.3)' } }, axisLabel: { color: '#a08a5e', fontSize: 10 }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,181,46,.08)' } }, axisLabel: { color: '#a08a5e', fontSize: 10 } },
        series: [{ name: '场站功率', type: 'line', data: pData, smooth: .4, showSymbol: false,
          lineStyle: { color: '#ffb52e', width: 2.2, shadowBlur: 10, shadowColor: 'rgba(255,181,46,.5)' }, itemStyle: { color: '#ffb52e' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,181,46,.4)' }, { offset: 1, color: 'rgba(255,181,46,.02)' }] } } }],
      });
    });

    /* 桩监视网格（滚动） */
    const ST_MAP = { charging: ['run', '充电中'], idle: ['idle', '空闲'], fault: ['err', '故障'], offline: ['off', '离线'] };
    function pCard(p) {
      const sm = ST_MAP[p.status];
      const mid = p.status === 'charging'
        ? `<span class="kw">${p.power.toFixed(1)}<small> kW</small></span><span class="eta">剩余 <b>${p.eta}</b></span>`
        : `<span class="kw ${p.status === 'idle' ? 'idle' : 'off'}">${sm[1]}</span><span class="eta">${p.type}</span>`;
      return `<div class="p-card" data-id="${p.id}">
        <div class="r1"><span class="pid">${p.id}</span><span class="pt">${p.type === '直流快充' ? p.kw + 'kW' : '7kW'}</span><span class="badge-s ${sm[0]}">${sm[1]}</span></div>
        <div class="plate">${p.status === 'charging' ? p.plate : p.type + ' · ' + (p.status === 'fault' ? '待检修' : p.status === 'offline' ? '计划检修' : '可预约')}</div>
        <div class="m2">${mid}</div>
        <div class="soc"><i class="${p.status === 'fault' ? 'bad' : ''}" style="width:${p.soc}%"></i></div>
      </div>`;
    }
    let cursor = 0;
    function batch() {
      const b = [];
      for (let k = 0; k < 4; k++) { if (cursor >= piles.length) cursor = 0; b.push(piles[cursor++]); }
      return b;
    }
    const pinner = document.getElementById('pinner');
    for (let r = 0; r < 4; r++) {
      const row = document.createElement('div');
      row.className = 'p-row';
      row.innerHTML = batch().map(pCard).join('');
      pinner.appendChild(row);
    }
    const pgrid = document.getElementById('pgrid');
    let pOff = 0, pPause = false, pLast = performance.now();
    pgrid.addEventListener('mouseenter', () => (pPause = true));
    pgrid.addEventListener('mouseleave', () => (pPause = false));
    (function pScroll(t) {
      const dt = (t - pLast) / 1000; pLast = t;
      if (!pPause && pinner.scrollHeight > pgrid.clientHeight) {
        pOff += 14 * dt;
        const f = pinner.firstElementChild;
        if (f) { const h = f.getBoundingClientRect().height; if (pOff >= h) { pOff -= h; f.innerHTML = batch().map(pCard).join(''); pinner.appendChild(f); } }
        pinner.style.transform = `translateY(${-pOff}px)`;
      }
      requestAnimationFrame(pScroll);
    })(performance.now());
    pinner.addEventListener('click', (e) => {
      const c = e.target.closest('.p-card');
      if (!c) return;
      const id = c.dataset.id;
      document.querySelectorAll('.p-card').forEach((x) => x.classList.toggle('sel', x.dataset.id === id));
      const bay = document.querySelector(`.jl-bay[data-id="${id}"]`);
      if (bay) bay.dispatchEvent(new Event('click'));
    });

    /* 快报 */
    const POOL = [
      ['高', cnt.fault > 0 ? `检测到 <b>${cnt.fault} 台故障桩</b>，工单已自动派发运维班组。` : `<b>配电房</b> 温度 38.2℃，阈值内正常运行。`],
      ['中', `<b>储能系统</b> SOC 68%，进入浮充状态。`],
      ['低', `<b>谷时时段</b> 22:00 启动，价格下浮 0.32 元/kWh。`],
      ['中', `今日 <b>巡检 2 次</b>，消防/烟感/水浸三路在线。`],
      ['低', `本月服务车主 <b>${fmt(st.orders * 26)}</b> 人次，满意度 4.9。`],
      ['低', `<b>车牌识别</b> 相机今日识别 ${rndInt(180, 420)} 次，准确率 99.6%。`],
    ];
    const alist = document.getElementById('alist');
    function aItem() {
      const [lv, tx] = pick(POOL);
      const t = new Date(Date.now() - rndInt(0, 90) * 60000);
      return `<span class="t">${pad(t.getHours())}:${pad(t.getMinutes())}</span><span class="l ${lv === '高' ? 'h' : lv === '中' ? 'm' : 's'}">${lv}</span><span class="x">${tx}</span>`;
    }
    for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'a-it'; d.innerHTML = aItem(); alist.appendChild(d); }
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

    /* 跑马灯 */
    document.getElementById('ticker').innerHTML = [
      `<b>【本站】</b>当前功率 ${fmt(curPower, 1)} kW · 充电中 ${cnt.charging} 桩 · 空闲 ${cnt.idle} 桩`,
      `<b>【地址】</b>${st.district} ${st.addr}`,
      `<b>【服务】</b>支持即插即充 / 预约锁桩 / V2L 放电，会员谷时 8.8 折`,
      `<b>【运维】</b>今日巡检 2 次 · 平均修复时长 47 分钟`,
    ].join('<span>◆</span>');

    document.getElementById('lay-foot').innerHTML =
      `<span>STATION <b>${st.id}</b></span><span>SLOTS <b>${st.piles}</b></span><span>FAST <b>${st.fast}</b></span><span>STATUS <b>${{ normal: '正常', busy: '高负荷', alarm: '告警', offline: '检修' }[st.status]}</b></span>`;

    /* 脉动：SOC/功率 4s · 经营指标 5s */
    const liveSt = { kwh: st.kwh, orders: st.orders, income: st.income };
    let livePower = curPower;
    setInterval(() => {
      let total = 0;
      piles.forEach((p) => {
        if (p.status === 'charging') {
          p.soc = Math.min(99, p.soc + rndInt(0, 2));
          p.power = Math.max(12, Math.min(p.kw, +(p.power + rnd(-5, 5)).toFixed(1)));
          p.eta = (Math.round((100 - p.soc) * 1.4) + 4) + ' 分钟';
          total += p.power;
          if (layout) layout.updateSoc(p.id, p.soc + '%');
        }
      });
      const shown = +total.toFixed(1);
      countUp(kpiEls[0], shown, livePower, 1, 'kW', 900);
      livePower = shown;
      pData[nowH] = +Math.max(5, total).toFixed(1);
      if (load) load.setOption({ series: [{ data: pData }] });
      pinner.querySelectorAll('.p-card').forEach((c) => {
        const p = piles.find((x) => x.id === c.dataset.id);
        if (p && p.status === 'charging') {
          const soc = c.querySelector('.soc i'); soc.style.width = p.soc + '%';
          c.querySelector('.kw').innerHTML = `${p.power.toFixed(1)}<small> kW</small>`;
        }
      });
    }, 4000);
    setInterval(() => {
      const prev = { ...liveSt };
      liveSt.kwh += rndInt(4, 14); liveSt.income += rndInt(18, 60);
      if (Math.random() < .5) liveSt.orders += 1;
      countUp(kpiEls[2], liveSt.kwh, prev.kwh, 0, 'kWh', 1100);
      countUp(kpiEls[3], liveSt.income, prev.income, 0, '元', 1100);
    }, 5000);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
