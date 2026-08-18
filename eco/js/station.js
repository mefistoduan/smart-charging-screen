/* ============================================================
   eco/js/station.js — 青绿生态 · 场站详情
   ============================================================ */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { console.warn('[eco-st]', e.message); } }
  const { STATIONS, buildPiles } = window.DATA;
  const CHARTS = [];
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const T2 = '#6fa389', LINE = 'rgba(61,220,151,.18)';
  const TIP = { backgroundColor: 'rgba(6,24,16,.94)', borderColor: 'rgba(61,220,151,.4)', textStyle: { color: '#d9f5e7', fontSize: 12 } };
  const AXIS = { axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false }, axisLabel: { color: T2, fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(61,220,151,.07)' } } };

  function tick() { const d = new Date(); document.getElementById('clk').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
  tick(); setInterval(tick, 1000);

  function countUp(el, target, from = 0, digits = 0, dur = 1300, fmtFn) {
    const t0 = performance.now();
    const f = fmtFn || ((v) => fmt(v, digits));
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = f(from + (target - from) * e);
      if (p >= 1) clearInterval(timer);
    }, 33);
  }

  function init() {
    const qs = new URLSearchParams(location.search);
    const st = STATIONS.find((s) => s.id === qs.get('id')) || STATIONS[0];
    const piles = buildPiles(st);
    const cnt = { charging: 0, idle: 0, fault: 0, offline: 0 };
    piles.forEach((p) => cnt[p.status]++);
    const curPower = +piles.reduce((a, p) => a + (p.status === 'charging' ? p.power : 0), 0).toFixed(1);
    const co2 = +(st.kwh * 0.012).toFixed(1);

    document.getElementById('st-name').textContent = st.name;
    document.getElementById('st-sub').textContent = `STATION ECO DETAIL · ${st.id} · ${st.district}`;
    document.getElementById('ch-kw').textContent = curPower.toFixed(0);

    /* 减碳环 */
    setTimeout(() => {
      const pct = Math.min(1, co2 / (co2 * 1.6));
      document.getElementById('co2-arc').style.strokeDashoffset = 327 * (1 - pct * .86);
    }, 300);
    countUp(document.getElementById('co2-n'), co2, 0, 1, 1800);
    document.getElementById('facts').innerHTML = `
      <div class="fact"><span class="ic">🌳</span><div>等效植树 <b>${fmt(co2 * 55, 0)}</b> 棵</div></div>
      <div class="fact"><span class="ic">🚗</span><div>替代燃油里程 <b>${fmt(co2 / 0.018 * 10, 0)}</b> km</div></div>
      <div class="fact"><span class="ic">⚡</span><div>今日充电 <b>${fmt(st.kwh)}</b> kWh</div></div>`;

    /* 桩群 */
    let pilesC = null;
    safe(() => {
      pilesC = echarts.init(document.getElementById('piles'));
      CHARTS.push(pilesC);
      pilesC.setOption({
        tooltip: { ...TIP, trigger: 'item', formatter: '{b}: {c} 桩 ({d}%)' },
        legend: { right: 8, top: 'middle', orient: 'vertical', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: T2, fontSize: 10 } },
        series: [{
          type: 'pie', radius: ['44%', '66%'], center: ['34%', '52%'],
          itemStyle: { borderColor: '#06180f', borderWidth: 3 }, label: { show: false },
          data: [
            { value: cnt.charging, name: '充电中', itemStyle: { color: '#3ddc97' } },
            { value: cnt.idle, name: '空闲', itemStyle: { color: '#17915f' } },
            { value: cnt.fault, name: '故障', itemStyle: { color: '#ff6b6b' } },
            { value: cnt.offline, name: '离线', itemStyle: { color: '#3f6b56' } },
          ],
        }],
      });
    });

    /* 站点信息 */
    document.getElementById('info').innerHTML = [
      ['站点编号', st.id], ['行政区域', st.district], ['站点地址', st.addr],
      ['桩位规模', `${st.piles} 桩（快充 ${st.fast}）`], ['运营时段', '24h 无人值守'],
      ['运营状态', { normal: '正常运行', busy: '高负荷', alarm: '告警', offline: '检修' }[st.status]],
    ].map(([k, v]) => `<div class="info-r"><span>${k}</span><b>${v}</b></div>`).join('');

    /* 布局 SVG（绿主题） */
    let layout = null;
    safe(() => {
      layout = window.STLayout.build(document.getElementById('lay'), piles, {
        theme: {
          charging: '#3ddc97', idle: '#35d0ba', fault: '#ff6b6b', offline: '#3f6b56',
          bus: 'rgba(61,220,151,.4)', lane: 'rgba(40,90,65,.3)',
          text: '#d9f5e7', dim: '#6fa389', car: '#0d3a28', bayFill: 'rgba(13,48,34,.55)',
          bayStroke: 'rgba(40,120,80,.35)', slot: 'rgba(6,24,16,.7)', sel: '#7dffc4',
          sources: [
            { ico: '⚡', label: '电网接入', color: '#3ddc97' },
            { ico: '☀', label: '光伏车棚', color: '#ffd166' },
            { ico: '▣', label: '储能系统', color: '#35d0ba' },
          ],
        },
        onPick(id) {
          document.querySelectorAll('.pl-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === id));
        },
      });
    });

    /* 本站能量流（复用 amber 同款 SVG 带粒子） */
    const flowHost = document.getElementById('sankey');
    const flow = { pv: 3.2, es: curPower * .18, grid: curPower * .74, ch: curPower * .92, other: curPower * .08 };
    function setFlow() {
      const srcs = [
        { n: '☀ 光伏', v: flow.pv, c: '#ffd166' },
        { n: '▣ 储能', v: flow.es, c: '#35d0ba' },
        { n: '⚡ 市电', v: flow.grid, c: '#2f9b74' },
      ];
      const tot = Math.max(1, flow.pv + flow.es + flow.grid);
      let s = `<svg viewBox="0 0 640 250" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">`;
      let y = 18; const segs = [];
      srcs.forEach((src) => {
        const h = Math.max(26, (src.v / tot) * 194);
        segs.push({ y, h, ...src });
        s += `<rect x="20" y="${y}" width="14" height="${h - 6}" rx="4" fill="${src.c}"/>
          <text x="42" y="${y + h / 2}" fill="#d9f5e7" font-size="13">${src.n}</text>
          <text x="42" y="${y + h / 2 + 14}" fill="#6fa389" font-size="11" font-family="Bahnschrift">${src.v.toFixed(1)} kW</text>`;
        y += h;
      });
      let dy = 30; const dsegs = [
        { n: '充电负荷', v: flow.ch, c: '#3ddc97' },
        { n: '站用电', v: flow.other, c: '#2b5e46' },
      ];
      const dTot = Math.max(1, flow.ch + flow.other);
      dsegs.forEach((d) => {
        const h = Math.max(34, (d.v / dTot) * 170);
        d.y = dy; d.h = h;
        s += `<rect x="606" y="${dy}" width="14" height="${h - 6}" rx="4" fill="${d.c}"/>
          <text x="596" y="${dy + h / 2}" fill="#d9f5e7" font-size="13" text-anchor="end">${d.n}</text>
          <text x="596" y="${dy + h / 2 + 14}" fill="#6fa389" font-size="11" text-anchor="end" font-family="Bahnschrift">${d.v.toFixed(1)} kW</text>`;
        dy += h;
      });
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
        const path = `M34,${y1} C300,${y1} 340,${y2} 606,${y2}`;
        s += `<path d="${path}" fill="none" stroke="${L.c}" stroke-opacity=".16" stroke-width="${w}"/>`;
        s += `<circle r="${Math.max(2, w / 2.2)}" fill="${L.c}" opacity=".95"><animateMotion dur="${(3.2 - i * 0.4).toFixed(1)}s" repeatCount="indefinite" path="${path}"/></circle>`;
      });
      s += `</svg>`;
      flowHost.innerHTML = s;
    }
    safe(setFlow);

    /* 功率曲线 */
    let load = null;
    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const nowH = new Date().getHours();
    const peak = Math.max(st.fast * 90, 60);
    const pAt = (h) => +(peak * (0.12 + Math.exp(-((h - 10.5) ** 2) / 9) * .55 + Math.exp(-((h - 20) ** 2) / 7) * .85)).toFixed(1);
    const pData = hours.map((_, h) => (h <= nowH ? pAt(h) : null));
    const gData = hours.map((_, h) => (h <= nowH ? +(pAt(h) * .37).toFixed(1) : null));
    safe(() => {
      load = echarts.init(document.getElementById('load'));
      CHARTS.push(load);
      load.setOption({
        tooltip: { ...TIP, trigger: 'axis' },
        grid: { left: 6, right: 8, top: 26, bottom: 2, containLabel: true },
        legend: { right: 4, top: 0, textStyle: { color: T2, fontSize: 10 }, itemWidth: 12 },
        xAxis: { type: 'category', boundaryGap: false, data: hours, ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [
          { name: '总功率', type: 'line', data: pData, smooth: .4, showSymbol: false, lineStyle: { color: '#35d0ba', width: 2 }, itemStyle: { color: '#35d0ba' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(53,208,186,.3)' }, { offset: 1, color: 'rgba(53,208,186,.02)' }] } } },
          { name: '绿电', type: 'line', data: gData, smooth: .4, showSymbol: false, lineStyle: { color: '#3ddc97', width: 2 }, itemStyle: { color: '#3ddc97' } },
        ],
      });
    });

    /* 桩监视 */
    function pCard(p) {
      const sm = { charging: ['run', '充电中'], idle: ['idle', '空闲'], fault: ['err', '故障'], offline: ['off', '离线'] }[p.status];
      const mid = p.status === 'charging'
        ? `<span class="kw">${p.power.toFixed(1)}<small> kW</small></span><span class="eta">剩余 <b>${p.eta}</b></span>`
        : `<span class="kw ${p.status === 'idle' ? 'idle' : 'off'}">${sm[1]}</span><span class="eta">${p.type}</span>`;
      return `<div class="pl-card" data-id="${p.id}">
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
    const plinner = document.getElementById('plinner');
    for (let r = 0; r < 4; r++) {
      const row = document.createElement('div');
      row.className = 'pl-row';
      row.innerHTML = batch().map(pCard).join('');
      plinner.appendChild(row);
    }
    const plgrid = document.getElementById('plgrid');
    let plOff = 0, plPause = false, plLast = performance.now();
    plgrid.addEventListener('mouseenter', () => (plPause = true));
    plgrid.addEventListener('mouseleave', () => (plPause = false));
    (function plScroll(t) {
      const dt = (t - plLast) / 1000; plLast = t;
      if (!plPause && plinner.scrollHeight > plgrid.clientHeight) {
        plOff += 13 * dt;
        const f = plinner.firstElementChild;
        if (f) { const h = f.getBoundingClientRect().height; if (plOff >= h) { plOff -= h; f.innerHTML = batch().map(pCard).join(''); plinner.appendChild(f); } }
        plinner.style.transform = `translateY(${-plOff}px)`;
      }
      requestAnimationFrame(plScroll);
    })(performance.now());
    plinner.addEventListener('click', (e) => {
      const c = e.target.closest('.pl-card');
      if (!c) return;
      const id = c.dataset.id;
      document.querySelectorAll('.pl-card').forEach((x) => x.classList.toggle('sel', x.dataset.id === id));
      const bay = document.querySelector(`.jl-bay[data-id="${id}"]`);
      if (bay) bay.dispatchEvent(new Event('click'));
    });

    /* 事件 */
    const POOL = [
      ['高', cnt.fault > 0 ? `<b>${cnt.fault} 台故障桩</b>，运维工单已派发。` : '配电房温度阈值内运行。'],
      ['中', `<b>储能 SOC</b> 正常，充放策略自动跟随峰谷。`],
      ['低', `<b>光伏车棚</b> 今日发电累计正常区间。`],
      ['低', `今日车牌识别 ${rndInt(150, 380)} 次，准确率 99.5%。`],
      ['中', `充电车辆 <b>${cnt.charging}</b> 台，排队预计 0~5 分钟。`],
    ];
    const evHost = document.getElementById('events');
    function evItem() {
      const [lv, tx] = pick(POOL);
      const t = new Date(Date.now() - rndInt(0, 90) * 60000);
      return `<span class="t">${pad(t.getHours())}:${pad(t.getMinutes())}</span><span class="lv ${lv === '高' ? 'h' : lv === '中' ? 'm' : 's'}">${lv}</span><span class="x">${tx}</span>`;
    }
    for (let i = 0; i < 5; i++) { const d = document.createElement('div'); d.className = 'ev'; d.innerHTML = evItem(); evHost.appendChild(d); }
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
    let livePower = curPower;
    let greenRate = 37;
    setInterval(() => {
      let total = 0;
      piles.forEach((p) => {
        if (p.status === 'charging') {
          p.soc = Math.min(99, p.soc + rndInt(0, 2));
          p.power = Math.max(12, Math.min(p.kw, +(p.power + rnd(-5, 5)).toFixed(1)));
          total += p.power;
          if (layout) layout.updateSoc(p.id, p.soc + '%');
        }
      });
      const shown = +total.toFixed(1);
      document.getElementById('ch-kw').textContent = shown.toFixed(0);
      livePower = shown;
      pData[nowH] = +Math.max(5, total).toFixed(1);
      gData[nowH] = +(pData[nowH] * (greenRate / 100)).toFixed(1);
      if (load) load.setOption({ series: [{ data: pData }, { data: gData }] });
      flow.pv = +Math.max(0, Math.min(4.2, flow.pv + rnd(-.3, .3))).toFixed(1);
      flow.es = shown * .18; flow.grid = shown * .74; flow.ch = shown * .92; flow.other = shown * .08;
      safe(setFlow);
      document.getElementById('pv-kw').textContent = flow.pv.toFixed(1);
      plinner.querySelectorAll('.pl-card').forEach((c) => {
        const p = piles.find((x) => x.id === c.dataset.id);
        if (p && p.status === 'charging') {
          c.querySelector('.soc i').style.width = p.soc + '%';
          c.querySelector('.kw').innerHTML = `${p.power.toFixed(1)}<small> kW</small>`;
        }
      });
      greenRate = Math.max(20, Math.min(60, greenRate + rndInt(-2, 2)));
      document.getElementById('neu-p').textContent = greenRate + '%';
      document.getElementById('neu-fi').style.width = greenRate + '%';
    }, 4000);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  window.addEventListener('resize', () => CHARTS.forEach((c) => c.resize()));
})();
