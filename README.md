# ⚡ 智慧充电站大屏系统 · 风格展厅

济南智慧充电运营可视化大屏合集，**4 套完整风格 + 展厅首页**，纯 H5 静态实现（零构建、零后端），打开即用。

**在线预览：https://mefistoduan.github.io/smart-charging-screen/**

**作者 / 联系方式：[duanchangpeng@gmail.com](mailto:duanchangpeng@gmail.com)**

---

## 风格总览

| # | 风格 | 入口 | 色系 | 定位 |
| --- | --- | --- | --- | --- |
| 0 | **风格展厅** | [`index.html`](index.html) | 深空渐变 | iframe 实时预览 4 套大屏，卡片式导航 |
| 1 | **深空赛博 HUD** | [`cyber/index.html`](cyber/index.html) | 深蓝+青霓虹 | 旗舰双屏：全市总览 + 单站详情 |
| 2 | **熔金指挥舱** | [`amber/index.html`](amber/index.html) | 深炭+琥珀金 | 指挥中枢风，非对称大地图布局 |
| 3 | **蓝白极简视界** | [`light/index.html`](light/index.html) | 浅灰白+品牌蓝 | SaaS 后台风，适合管理/汇报 |
| 4 | **青绿生态网络** | [`eco/index.html`](eco/index.html) | 深绿+荧光绿 | 光储充一体化 + 双碳主题 |

## 各风格亮点

**cyber · 深空赛博 HUD（旗舰版）**
济南市地图 26 站点涟漪打点 + 能源馈线飞线、KPI 翻牌、桩状态环图、负荷功率曲线（含预测）、24h 电量/订单趋势、排行/订单/告警流；单站详情含 SVG 场站布局实况（光储充母线 + 能量流动画 + 车位 SOC）、水球利用率、双向选中联动。

**amber · 熔金指挥舱**
通栏 KPI + 非对称大地图（四角金括）+ 右侧竖排面板（玫瑰图/负荷基线/区县横条榜/指挥快报），顶部金线扫描与对角丝纹氛围。

**light · 蓝白极简视界**
左侧导航 + 指标卡网格 + 白卡网格布局，浅色地图、TOP5 进度条、订单滚动表、区县柱图，今日/本周/本月筛选。

**eco · 青绿生态网络**
碳足迹进度环（等效植树/替代里程）、绿电构成环、光储充能量流（SVG 贝塞尔 + 粒子流）、绿电负荷曲线、碳中和进度条、顶栏能量流呼吸动画。

## 共通特性

- 数据每 5 秒随机脉动（翻牌滚动、图表联动），模拟实时上报
- 响应式流式布局（rem+vw），任意比例屏幕撑满不留白
- countUp 采用 setInterval 时间轴，后台标签页也能完成动画
- 图表模块 safe 隔离 + load 后初始化，单模块异常不拖垮整页

## 技术栈

HTML5 + CSS3 + 原生 JS + [ECharts 5](https://echarts.apache.org/)（本地内置）。地图：阿里 DataV 济南市 GeoJSON（简化）。

## 目录

```
smart-charging-screen/
├── index.html / css / js     # 展厅首页（iframe 实时预览）
├── cyber/                    # ① 深空赛博 HUD（总览+详情双屏）
├── amber/                    # ② 熔金指挥舱
├── light/                    # ③ 蓝白极简视界
├── eco/                      # ④ 青绿生态网络
└── assets/                   # 共享：echarts / 济南地图 / 数据源
```

## 数据说明

所有数据为**前端模拟**（站点档案确定性伪随机；运行期指标每数秒脉动），仅作演示。接入真实数据只需替换 `assets/data.js` 与各 `setInterval` 推送逻辑。

## License

MIT © duanchangpeng
