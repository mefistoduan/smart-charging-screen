/* ============================================================
   common.js — 大屏公共运行时
   缩放适配 / 头部底部构建 / 开机动画 / 粒子背景 / 工具函数
   ============================================================ */
(function (global) {
  'use strict';

  const CONTACT = 'duanchangpeng@gmail.com';

  /* ---------- 随机 & 格式化 ---------- */
  const rnd = (min, max) => min + Math.random() * (max - min);
  const rndInt = (min, max) => Math.floor(rnd(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fmt = (n, digits = 0) =>
    Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- 数字翻牌（缓动 count-up，支持从当前值滚动） ---------- */
  function countUp(el, target, { duration = 1600, digits = 0, suffix = '', from = 0 } = {}) {
    const start = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (target - from) * eased, digits) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 竖向无缝滚动（rAF 像素级） ---------- */
  function vMarquee(wrap, opts = {}) {
    const speed = opts.speed || 18; // px/s
    let offset = 0, last = performance.now(), paused = false;
    wrap.addEventListener('mouseenter', () => (paused = true));
    wrap.addEventListener('mouseleave', () => (paused = false));
    function step(t) {
      const dt = (t - last) / 1000; last = t;
      const inner = wrap.querySelector('.scroll-inner');
      if (inner && !paused && inner.scrollHeight > wrap.clientHeight) {
        offset += speed * dt;
        const first = inner.firstElementChild;
        if (first) {
          const h = first.getBoundingClientRect().height / currentScale();
          if (offset >= h) {
            offset -= h;
            if (opts.onRecycle) opts.onRecycle(first);
            inner.appendChild(first); // 移到末尾（可在此刷新内容）
          }
        }
        inner.style.transform = `translateY(${-offset}px)`;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function currentScale() { return 1; }

  /* ---------- 布局已改为纯 CSS 流式响应，无需 JS 缩放（保留空实现兼容调用） ---------- */
  function fitScreen() {}

  /* ---------- HUD 六边形闪电 Logo（SVG） ---------- */
  const LOGO_SVG = `
  <svg class="logo-hex" viewBox="0 0 54 60" fill="none">
    <defs>
      <linearGradient id="lg1" x1="27" y1="0" x2="27" y2="60">
        <stop offset="0" stop-color="#37e6ff"/><stop offset="1" stop-color="#1e6cff"/>
      </linearGradient>
    </defs>
    <path d="M27 1.5 51 15v30L27 58.5 3 45V15Z" stroke="url(#lg1)" stroke-width="2" fill="rgba(14,50,110,.35)"/>
    <path d="M27 8.5 45 19v22L27 52 9 41V19Z" stroke="rgba(55,230,255,.35)" stroke-width="1" fill="none"/>
    <path d="M30 16 21 32h6l-3 12 11-17h-7z" fill="#8ff3ff">
      <animate attributeName="fill" values="#8ff3ff;#ffffff;#8ff3ff" dur="2.2s" repeatCount="indefinite"/>
    </path>
  </svg>`;

  const ENVELOPE_SVG = `
  <svg class="ico" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="1" stroke="#37e6ff" stroke-width="1.2" fill="rgba(55,230,255,.08)"/>
    <path d="M1.5 3.5 8 8.5l6.5-5" stroke="#37e6ff" stroke-width="1.2"/>
  </svg>`;

  /* ---------- 构建头部 ---------- */
  function buildHeader(cfg) {
    const host = document.getElementById('hud-header');
    if (!host) return;
    host.className = 'hud';
    host.innerHTML = `
      <div class="wing wing-l"><div class="inner">
        ${cfg.back ? `<div class="btn-back" id="btn-back">◈ 返回总览</div>` : ''}
        <div class="chip time"><span class="k">TIME</span><span class="v" id="hud-clock">--:--:--</span></div>
        <div class="chip"><span class="k">DATE</span><span class="v" id="hud-date">----</span></div>
        <div class="chip env"><span class="k">ENV</span><span class="v">多云 26℃ · AQI 45 · 电网正常</span></div>
      </div></div>
      <div class="core">
        ${LOGO_SVG}
        <div class="hud-title">
          <h1>${cfg.title}</h1>
          <div class="sub">${cfg.subtitle}</div>
        </div>
      </div>
      <div class="wing wing-r"><div class="inner">
        <div class="chip operator"><span class="k">OPERATOR</span><span class="v">运营调度中心 · SC-01</span></div>
        <div class="chip contact" title="联系作者">
          ${ENVELOPE_SVG}
          <span class="lab">CONTACT</span><span class="v">${CONTACT}</span>
        </div>
      </div></div>`;
    if (cfg.back) {
      document.getElementById('btn-back').addEventListener('click', () => (location.href = 'index.html'));
    }
    // 时钟
    const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
    function tickClock() {
      const d = new Date();
      const clock = document.getElementById('hud-clock');
      const date = document.getElementById('hud-date');
      if (clock) clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      if (date) date.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${WEEK[d.getDay()]}`;
    }
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ---------- 构建底部滚动条 ---------- */
  function buildTicker(messages) {
    const host = document.getElementById('hud-ticker');
    if (!host) return;
    const items = messages
      .map((m) => `<b>${m[0]}</b>&nbsp;${m[1]}<span class="sep">◆</span>`)
      .join('');
    host.className = 'ticker';
    host.innerHTML = `
      <div class="tag"><i></i>实时快报 LIVE</div>
      <div class="ticker-view"><div class="ticker-track" id="ticker-track">${items}${items}</div></div>
      <div class="copy">© 2026 SMART CHARGING OPS · DESIGNED BY <a href="mailto:${CONTACT}">${CONTACT}</a></div>`;
    // 水平循环
    const track = document.getElementById('ticker-track');
    let w = 0;
    function measure() { w = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    let x = 0, last = performance.now();
    (function loop(t) {
      const dt = (t - last) / 1000; last = t;
      if (w > 0) {
        x = (x + 42 * dt) % w;
        track.style.transform = `translateX(${-x}px)`;
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  /* ---------- 面板四角括角注入 ---------- */
  function decoratePanels() {
    document.querySelectorAll('.panel').forEach((p) => {
      ['tl', 'tr', 'bl', 'br'].forEach((pos) => {
        const c = document.createElement('i');
        c.className = `corner ${pos}`;
        p.appendChild(c);
      });
    });
  }

  /* ---------- 开机动画 ---------- */
  function playBoot(title) {
    const boot = document.createElement('div');
    boot.id = 'boot';
    boot.innerHTML = `
      ${LOGO_SVG.replace('logo-hex', 'hex')}
      <h2>${title}</h2>
      <div class="bar-w"><div class="bar-i" id="boot-bar"></div></div>
      <div class="step" id="boot-step">INITIALIZING...</div>
      <div class="mail">${CONTACT}</div>`;
    document.body.appendChild(boot);
    const steps = ['加载地理信息数据 ...', '校准遥测链路 ...', '同步全场站充电桩遥测 ...', '渲染可视化场景 ...', 'SYSTEM READY'];
    const bar = boot.querySelector('#boot-bar');
    const stepEl = boot.querySelector('#boot-step');
    let i = 0;
    const timer = setInterval(() => {
      stepEl.textContent = steps[i];
      bar.style.width = `${((i + 1) / steps.length) * 100}%`;
      i++;
      if (i >= steps.length) {
        clearInterval(timer);
        setTimeout(() => boot.classList.add('done'), 320);
        setTimeout(() => boot.remove(), 1000);
      }
    }, 300);
    boot.addEventListener('click', () => { clearInterval(timer); boot.classList.add('done'); setTimeout(() => boot.remove(), 600); });
  }

  /* ---------- 粒子网络背景（画布尺寸跟随容器） ---------- */
  function plexus() {
    const cv = document.getElementById('fx-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0;
    const N = 42, PTS = [];
    function resize() {
      W = cv.width = Math.max(1, cv.clientWidth);
      H = cv.height = Math.max(1, cv.clientHeight);
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < N; i++) {
      PTS.push({ x: Math.random() * W, y: Math.random() * H, vx: rnd(-.12, .12), vy: rnd(-.12, .12), r: rnd(.8, 1.9) });
    }
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of PTS) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = PTS[i], b = PTS[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < 150) {
          ctx.strokeStyle = `rgba(60,150,255,${(1 - d / 150) * .14})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const p of PTS) {
        ctx.fillStyle = 'rgba(110,200,255,.5)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  }

  /* ---------- ECharts 通用样式 ---------- */
  const AXIS = {
    axisLine: { lineStyle: { color: 'rgba(90,160,240,.35)' } },
    axisTick: { show: false },
    axisLabel: { color: '#6d89ad', fontSize: 11, fontFamily: 'Bahnschrift' },
    splitLine: { lineStyle: { color: 'rgba(90,160,240,.10)', type: 'dashed' } },
  };
  const TOOLTIP = {
    backgroundColor: 'rgba(5,15,36,.94)',
    borderColor: 'rgba(55,230,255,.45)',
    borderWidth: 1,
    textStyle: { color: '#d9ecff', fontSize: 12 },
    axisPointer: { lineStyle: { color: 'rgba(55,230,255,.4)' } },
  };

  global.CC = {
    CONTACT, rnd, rndInt, pick, fmt, pad,
    countUp, vMarquee, fitScreen, currentScale,
    buildHeader, buildTicker, decoratePanels, playBoot, plexus,
    AXIS, TOOLTIP,
  };
})(window);
