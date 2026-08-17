# ⚡ 智慧充电站大屏系统 · Smart Charging Station Screen

深空赛博 HUD 风格的充电运营可视化大屏，纯 H5 静态实现（零构建、零后端），打开即用。

**作者 / 联系方式：[duanchangpeng@gmail.com](mailto:duanchangpeng@gmail.com)**

---

## 页面

| 页面 | 说明 |
| --- | --- |
| `index.html` | **全市站点总览大屏**：杭州市地图 26 座站点打点（涟漪呼吸灯），能源馈线飞线动画，KPI 翻牌、桩状态环图、全市负荷功率曲线（含预测）、24h 电量/订单趋势、站点排行、实时订单流水、告警监控、跑马灯快报 |
| `station.html?id=ST001` | **单站详情大屏**：场站档案、SVG 场站布局实况（光伏/储能/电网三路供能 + 能量流动画 + 桩位车形态）、桩群实时监视（SOC 进度条、功率脉动）、利用率水球、本站订单与事件流 |

两屏互跳：总览大屏点击站点（或排行/浮窗“进入详情”）→ 场站详情大屏 → 左上角返回总览。

## 交互与动画

- 开机自检动画（进度条 + 分步文案）
- 1920×1080 设计稿等比缩放，任意分辨率不留白不变形
- 数字翻牌（count-up）、水球波浪、跑马灯、无缝滚动列表（悬停暂停）
- 地图站点涟漪、飞线粒子流、自动巡检弹窗（8s 轮换，手动操作后暂停）
- 行政区筛选联动地图、站点浮窗 → 详情大屏跳转
- 详情页布局图 ↔ 桩卡片**双向点击联动**高亮
- SOC 每 4s 递增、功率实时抖动、粒子网络背景

## 技术栈

HTML5 + CSS3 + 原生 JS + [ECharts 5](https://echarts.apache.org/)（本地内置，无 CDN 依赖）。地图数据为阿里 DataV 杭州市 GeoJSON（简化处理）。

## 运行

无需构建，任选一种：

```bash
# 方式一：任意静态服务器
python -m http.server 8080
# 访问 http://localhost:8080/index.html
```

或直接部署到 GitHub Pages / Nginx / OSS。

## 目录

```
smart-charging-screen/
├── index.html          # 全市总览大屏
├── station.html        # 单站详情大屏
├── css/style.css       # HUD 设计系统
└── js/
    ├── common.js       # 缩放适配/开机动画/粒子背景/组件构建
    ├── data.js         # 模拟数据源（26 站点）
    ├── city.js         # 总览大屏逻辑
    ├── station.js      # 详情大屏逻辑
    ├── map-hangzhou.js # 杭州 GeoJSON（DataV，简化）
    └── lib/echarts.min.js
```

## 数据说明

所有数据为**前端模拟**（确定性伪随机，刷新不跳变），仅作演示用途。接入真实数据只需替换 `js/data.js` 与各 `setInterval` 推送逻辑。

## License

MIT © duanchangpeng
