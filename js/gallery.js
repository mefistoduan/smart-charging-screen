/* ============================================================
   gallery.js — 风格展厅：卡片生成 + iframe 实时缩放预览
   ============================================================ */
(function () {
  'use strict';

  const STYLES = [
    {
      key: 'cyber',
      url: 'cyber/index.html',
      name: '深空赛博 HUD',
      en: 'DEEP-SPACE CYBER HUD',
      tag: '旗舰版',
      tagBg: 'rgba(55,230,255,.14)', tagC: '#37e6ff',
      openBg: 'linear-gradient(90deg,#37e6ff,#7dd0ff)',
      desc: '双屏联动的全市总览 + 场站详情大屏。济南地图 26 站点涟漪打点与飞线、KPI 翻牌、SVG 场站布局实况（光储充母线 + 能量流动画 + 车位 SOC）、水球利用率、订单/告警滚动流。',
      feats: ['全市总览+单站详情', '地图打点/飞线', '开机自检动画', '7:3 弹性布局', '双向选中联动'],
    },
    {
      key: 'amber',
      url: 'amber/index.html',
      name: '熔金指挥舱',
      en: 'AMBER COMMAND CONSOLE',
      tag: '暖金色系',
      tagBg: 'rgba(255,181,46,.14)', tagC: '#ffb52e',
      openBg: 'linear-gradient(90deg,#ffb52e,#ffd98a)',
      desc: '深炭底琥珀金的指挥中枢风。非对称大地图 + 右侧竖排面板；点击地图站点下钻单站详情：金主题布局实况（能量流动画+车位 SOC）、桩监视卡、功率曲线、本站快报。',
      feats: ['总览+单站详情下钻', '非对称布局', '金橙玫瑰图', '计划基线对比', '区县电量榜'],
    },
    {
      key: 'light',
      url: 'light/index.html',
      name: '蓝白极简视界',
      en: 'MINIMAL LIGHT CONSOLE',
      tag: '浅色系',
      tagBg: 'rgba(59,130,246,.14)', tagC: '#60a5fa',
      openBg: 'linear-gradient(90deg,#3b82f6,#93c5fd)',
      desc: 'SaaS 后台风的白卡网格布局：左侧导航 + 指标卡 + 卡片网格；点击地图站点下钻单站详情：桩位实况网格（点击高亮）、功率曲线、本站订单与站点信息卡。',
      feats: ['总览+单站详情下钻', '浅色系白卡', '侧导航+筛选', '指标卡网格', 'TOP5/订单表'],
    },
    {
      key: 'eco',
      url: 'eco/index.html',
      name: '青绿生态网络',
      en: 'GREEN ECO GRID',
      tag: '双碳主题',
      tagBg: 'rgba(61,220,151,.14)', tagC: '#3ddc97',
      openBg: 'linear-gradient(90deg,#3ddc97,#7dffc4)',
      desc: '面向光储充一体化与双碳叙事：碳足迹环、绿电构成、能量流粒子图、绿电负荷曲线；点击地图站点下钻单站详情：绿主题布局实况、本站能量流、减碳数据。',
      feats: ['总览+单站详情下钻', '碳足迹环', '能量流粒子动画', '绿电构成', '生态站点榜'],
    },
  ];

  const grid = document.querySelector('.g-grid');
  grid.innerHTML = STYLES.map((s) => `
    <article class="g-card" data-key="${s.key}">
      <div class="g-shot">
        <iframe src="${s.url}" loading="lazy" scrolling="no" tabindex="-1"></iframe>
        <span class="veil"></span>
        <span class="hint">LIVE PREVIEW</span>
      </div>
      <div class="g-meta">
        <div class="row1">
          <span class="g-tag" style="background:${s.tagBg};color:${s.tagC}">${s.tag}</span>
          <h2>${s.name}</h2>
          <span style="font-family:Bahnschrift,sans-serif;font-size:.6rem;letter-spacing:.22em;color:var(--dim)">${s.en}</span>
        </div>
        <p class="desc">${s.desc}</p>
        <div class="feat">${s.feats.map((f) => `<span>${f}</span>`).join('')}</div>
        <a class="g-open" style="background:${s.openBg}" href="${s.url}" target="_blank" rel="noopener">全屏打开 →</a>
      </div>
    </article>`).join('');

  /* iframe 按容器宽度缩放，形成实时迷你预览 */
  function fitShots() {
    document.querySelectorAll('.g-shot').forEach((shot) => {
      const scale = shot.clientWidth / 1920;
      const ifr = shot.querySelector('iframe');
      ifr.style.transform = `scale(${scale})`;
    });
  }
  fitShots();
  window.addEventListener('resize', fitShots);
  /* 字体加载完成后可能引起宽度微变，再校一次 */
  setTimeout(fitShots, 600);
})();
