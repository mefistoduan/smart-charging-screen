/* ============================================================
   assets/layout.js — 通用场站布局 SVG 生成器（各风格详情页共用）
   STLayout.build(stage, piles, { theme, onPick }) → { rebuild, updateSoc, getSelected }
   ============================================================ */
(function (global) {
  'use strict';

  function build(stage, piles, opts) {
    const O = opts || {};
    const theme = Object.assign({
      charging: '#2df0a6', idle: '#37e6ff', fault: '#ff5d7a', offline: '#5a7492',
      bus: 'rgba(80,160,255,.5)', lane: 'rgba(90,140,200,.22)',
      text: '#cfeeff', dim: '#7d9cbf', car: '#16345f', bayFill: 'rgba(12,32,70,.5)',
      bayStroke: 'rgba(90,170,255,.32)', slot: 'rgba(8,24,54,.7)', sel: '#eaffff',
      sources: [
        { ico: '⚡', label: '电网接入', color: '#37e6ff' },
        { ico: '☀', label: '光伏系统', color: '#ffc53d' },
        { ico: '▣', label: '储能系统', color: '#9d7bff' },
      ],
    }, O.theme);
    const onPick = O.onPick || function () {};

    const cols = 8;
    const rows = Math.max(3, Math.min(5, Math.ceil(piles.length / cols)));
    let rowGap = 100;
    let selected = null;
    const rowMid = (r) => 78 + r * rowGap;
    const bayX = (c) => 178 + c * 99;
    const COLOR = (s) => ({ charging: theme.charging, idle: theme.idle, fault: theme.fault, offline: theme.offline }[s]);

    function fitRowGap() {
      const w = stage.clientWidth || 1000, h = stage.clientHeight || 440;
      const targetH = (1000 * h) / w;
      rowGap = Math.min(152, Math.max(86, (targetH - 140) / Math.max(1, rows - 1)));
    }

    function render() {
      fitRowGap();
      const svgH = rowMid(rows - 1) + 62;
      let s = `<svg viewBox="0 0 1000 ${svgH}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">
      <style>
        .jl-bay { cursor: pointer; }
        .jl-bay rect.jl-frame { transition: stroke .2s; }
        .jl-bay.jl-sel rect.jl-frame { stroke: ${theme.sel}; stroke-width: 2; filter: drop-shadow(0 0 6px ${theme.sel}); }
        .jl-energy { stroke-dasharray: 6 90; animation: jl-flow 2.4s linear infinite; }
        @keyframes jl-flow { to { stroke-dashoffset: -96; } }
        .jl-lamp { animation: jl-blink 1.6s ease-in-out infinite; }
        @keyframes jl-blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
      </style>`;
      /* 能量源 */
      const srcYs = [rowMid(1) - 96, rowMid(1) - 8, rowMid(1) + 80];
      theme.sources.forEach((src, i) => {
        const y = srcYs[i % 3];
        s += `<g>
          <rect x="14" y="${y - 20}" width="104" height="46" rx="6" fill="rgba(12,32,70,.75)" stroke="${src.color}" stroke-opacity=".55"/>
          <text x="28" y="${y + 8}" fill="${src.color}" font-size="17" font-weight="700">${src.ico}</text>
          <text x="52" y="${y + 3}" fill="${theme.dim}" font-size="11" letter-spacing="2">${src.label}</text>
          <line class="jl-energy" x1="118" y1="${y + 3}" x2="152" y2="${y + 3}" stroke="${src.color}" stroke-width="1.6" stroke-opacity=".8"/>
        </g>`;
      });
      /* 母线 */
      s += `<line x1="152" y1="${rowMid(0)}" x2="152" y2="${rowMid(rows - 1)}" stroke="${theme.bus}" stroke-width="2.5"/>`;
      /* 行 × 列 */
      for (let r = 0; r < rows; r++) {
        const y = rowMid(r);
        s += `<text x="164" y="${y + 4}" fill="${theme.dim}" font-size="11" letter-spacing="2">${String.fromCharCode(65 + r)} 区</text>`;
        s += `<line x1="176" y1="${y}" x2="978" y2="${y}" stroke="${theme.bus}" stroke-opacity=".6" stroke-width="1.4"/>`;
        for (let c = 0; c < cols; c++) {
          const p = piles[r * cols + c];
          const x = bayX(c);
          if (!p) {
            s += `<g><rect x="${x}" y="${y - 34}" width="88" height="68" rx="5" fill="rgba(0,0,0,.14)" stroke="${theme.lane}" stroke-dasharray="4 4"/>
            <text x="${x + 44}" y="${y + 3}" text-anchor="middle" fill="${theme.dim}" font-size="10">备用车位</text></g>`;
            continue;
          }
          const color = COLOR(p.status);
          if (p.status === 'charging') {
            s += `<line class="jl-energy" x1="176" y1="${y - 18}" x2="${x + 2}" y2="${y - 18}" stroke="${color}" stroke-width="1.4" stroke-opacity=".75"/>`;
          }
          s += `<g class="jl-bay${selected === p.id ? ' jl-sel' : ''}" data-id="${p.id}" transform="translate(${x}, ${y - 34})">
            <rect width="88" height="68" fill="transparent"/>
            <rect class="jl-frame" x="0" y="0" width="88" height="68" rx="5" fill="${theme.bayFill}" stroke="${theme.bayStroke}"/>
            <rect x="26" y="8" width="56" height="52" rx="3" fill="${theme.slot}" stroke="rgba(70,140,220,.35)" stroke-dasharray="3 3"/>
            <rect x="5" y="14" width="15" height="32" rx="2" fill="rgba(28,66,124,.9)" stroke="${color}" stroke-opacity=".9"/>
            <circle class="jl-lamp" cx="12.5" cy="22" r="2.8" fill="${color}" ${p.status === 'fault' ? 'style="animation-duration:.6s"' : ''}/>
            <text x="12.5" y="40" text-anchor="middle" fill="${theme.dim}" font-size="10">${p.id.split('-')[1]}</text>`;
          if (p.status === 'charging') {
            s += `<g>
              <rect x="30" y="16" width="48" height="28" rx="7" fill="${theme.car}" stroke="rgba(120,200,255,.45)"/>
              <rect x="36" y="20" width="14" height="7" rx="2" fill="rgba(0,0,0,.4)"/>
              <rect x="56" y="20" width="14" height="7" rx="2" fill="rgba(0,0,0,.4)"/>
              <text class="jl-soc" data-id="${p.id}" x="54" y="38" text-anchor="middle" fill="${theme.text}" font-size="12" font-weight="700">${p.soc}%</text>
            </g>`;
          } else {
            s += `<text class="jl-soc" data-id="${p.id}" x="54" y="38" text-anchor="middle" fill="${p.status === 'idle' ? theme.idle : theme.offline}" font-size="11">${{ idle: '空闲', fault: '故障', offline: '离线' }[p.status]}</text>`;
          }
          s += `<text x="44" y="63" text-anchor="middle" fill="${theme.dim}" font-size="10">${p.type === '直流快充' ? 'DC·' + p.kw + 'kW' : 'AC·7kW'}</text>
          </g>`;
        }
      }
      s += `</svg>`;
      stage.innerHTML = s;
      /* 点击选中 */
      stage.querySelectorAll('.jl-bay').forEach((g) => {
        g.addEventListener('click', () => {
          const id = g.getAttribute('data-id');
          selected = selected === id ? null : id;
          stage.querySelectorAll('.jl-bay').forEach((x) => x.classList.toggle('jl-sel', x.getAttribute('data-id') === selected));
          onPick(selected);
        });
      });
    }

    render();

    let rsTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(rsTimer);
      rsTimer = setTimeout(render, 200);
    });

    return {
      rebuild: render,
      updateSoc(id, txt) {
        const el = stage.querySelector(`.jl-soc[data-id="${id}"]`);
        if (el) el.textContent = txt;
      },
      getSelected: () => selected,
    };
  }

  global.STLayout = { build };
})(window);
