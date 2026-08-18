/* ============================================================
   data.js — 模拟数据源（两个大屏共享）· 济南市
   坐标为济南市经纬度，仅作演示
   ============================================================ */
(function (global) {
  'use strict';

  const ST_STATUS = {
    normal: { color: '#37e6ff', text: '正常运行' },
    busy:   { color: '#ffc53d', text: '高负荷运转' },
    alarm:  { color: '#ff5d7a', text: '故障告警' },
    offline:{ color: '#5a7492', text: '离线检修' },
  };

  /* 26 个站点：id/名称/行政区/地址/经纬度/桩数/快充/今日电量/订单/收入/利用率/状态 */
  const STATIONS = [
    { id: 'ST001', name: '泉城广场枢纽站',     district: '历下区', addr: '泺源大街 99 号地下车库', lon: 117.018, lat: 36.661, piles: 32, fast: 16, kwh: 18420, orders: 386, income: 31260, util: 82, status: 'busy' },
    { id: 'ST002', name: '济南站北广场站',     district: '天桥区', addr: '车站街 19 号', lon: 116.995, lat: 36.684, piles: 24, fast: 12, kwh: 12630, orders: 271, income: 20940, util: 74, status: 'normal' },
    { id: 'ST003', name: '大明湖东门站',       district: '历下区', addr: '大明湖路 271 号', lon: 117.032, lat: 36.677, piles: 18, fast: 8,  kwh: 8210, orders: 178, income: 13650, util: 63, status: 'normal' },
    { id: 'ST004', name: '恒隆广场快充站',     district: '历下区', addr: '泉城路 288 号屋顶停车场', lon: 117.021, lat: 36.668, piles: 20, fast: 14, kwh: 11240, orders: 236, income: 19870, util: 79, status: 'busy' },
    { id: 'ST005', name: '省博物馆站',         district: '历下区', addr: '经十东路 11899 号', lon: 117.104, lat: 36.662, piles: 28, fast: 12, kwh: 9860, orders: 197, income: 16120, util: 58, status: 'normal' },
    { id: 'ST006', name: '千佛山景区西站',     district: '历下区', addr: '经十一路 18 号', lon: 117.026, lat: 36.648, piles: 16, fast: 8,  kwh: 5340, orders: 112, income: 8790, util: 44, status: 'normal' },
    { id: 'ST007', name: '齐鲁软件园站',       district: '历下区', addr: '新泺大街 2008 号', lon: 117.116, lat: 36.679, piles: 22, fast: 16, kwh: 10980, orders: 189, income: 18230, util: 71, status: 'normal' },
    { id: 'ST008', name: '奥体中心东站',       district: '历下区', addr: '经十路 20109 号', lon: 117.128, lat: 36.652, piles: 26, fast: 14, kwh: 12170, orders: 253, income: 20450, util: 69, status: 'normal' },
    { id: 'ST009', name: '汉峪金谷站',         district: '历下区', addr: '经十路 7000 号', lon: 117.148, lat: 36.643, piles: 14, fast: 8,  kwh: 6120, orders: 131, income: 10080, util: 52, status: 'normal' },
    { id: 'ST010', name: '遥墙国际机场 T2 站', district: '历城区', addr: '机场路 1 号 T2 停车楼', lon: 117.223, lat: 36.861, piles: 36, fast: 24, kwh: 21650, orders: 412, income: 36540, util: 88, status: 'busy' },
    { id: 'ST011', name: '唐冶国际中心站',     district: '历城区', addr: '唐冶西路 4567 号', lon: 117.208, lat: 36.712, piles: 20, fast: 10, kwh: 8730, orders: 176, income: 14120, util: 56, status: 'normal' },
    { id: 'ST012', name: '华山湖公园站',       district: '历城区', addr: '华山街道荷花路 11 号', lon: 117.086, lat: 36.748, piles: 12, fast: 6,  kwh: 3980, orders: 84, income: 6540, util: 37, status: 'normal' },
    { id: 'ST013', name: '济南东站枢纽站',     district: '历城区', addr: '王舍人街道工业北路', lon: 117.243, lat: 36.729, piles: 30, fast: 18, kwh: 15420, orders: 298, income: 25890, util: 77, status: 'busy' },
    { id: 'ST014', name: '领秀城贵和站',       district: '市中区', addr: '英雄山路 101 号', lon: 116.997, lat: 36.596, piles: 24, fast: 16, kwh: 11890, orders: 241, income: 19760, util: 72, status: 'normal' },
    { id: 'ST015', name: '大观园商埠站',       district: '市中区', addr: '经四路 223 号', lon: 116.990, lat: 36.667, piles: 14, fast: 6,  kwh: 4520, orders: 96, income: 7420, util: 41, status: 'normal' },
    { id: 'ST016', name: '济南西站枢纽站',     district: '槐荫区', addr: '齐鲁大道 3177 号', lon: 116.923, lat: 36.668, piles: 22, fast: 12, kwh: 9650, orders: 188, income: 15830, util: 61, status: 'normal' },
    { id: 'ST017', name: '印象济南泉世界站',   district: '槐荫区', addr: '腊山河西路中段', lon: 116.944, lat: 36.664, piles: 18, fast: 10, kwh: 7840, orders: 152, income: 12960, util: 59, status: 'normal' },
    { id: 'ST018', name: '西市场商贸站',       district: '槐荫区', addr: '经一路 289 号', lon: 116.957, lat: 36.674, piles: 16, fast: 8,  kwh: 6230, orders: 143, income: 10270, util: 55, status: 'normal' },
    { id: 'ST019', name: '长清大学城站',       district: '长清区', addr: '大学路 1 号商业街', lon: 116.782, lat: 36.552, piles: 16, fast: 8,  kwh: 5410, orders: 107, income: 8890, util: 47, status: 'normal' },
    { id: 'ST020', name: '园博园文旅站',       district: '长清区', addr: '大学路 3366 号', lon: 116.755, lat: 36.523, piles: 10, fast: 4,  kwh: 2890, orders: 62, income: 4760, util: 33, status: 'offline' },
    { id: 'ST021', name: '章丘双山政务站',     district: '章丘区', addr: '双山街道铁道北路 8 号', lon: 117.526, lat: 36.714, piles: 18, fast: 10, kwh: 7020, orders: 134, income: 11580, util: 54, status: 'normal' },
    { id: 'ST022', name: '百脉泉公园站',       district: '章丘区', addr: '汇泉路 2017 号', lon: 117.537, lat: 36.722, piles: 8,  fast: 4,  kwh: 1930, orders: 38, income: 3180, util: 26, status: 'alarm' },
    { id: 'ST023', name: '济阳开元大街站',     district: '济阳区', addr: '开元大街 100 号', lon: 117.173, lat: 36.978, piles: 14, fast: 8,  kwh: 5230, orders: 104, income: 8620, util: 49, status: 'normal' },
    { id: 'ST024', name: '平阴玫瑰小镇站',     district: '平阴县', addr: '翠屏街 68 号', lon: 116.456, lat: 36.287, piles: 12, fast: 6,  kwh: 3560, orders: 71, income: 5870, util: 38, status: 'normal' },
    { id: 'ST025', name: '商河温泉基地站',     district: '商河县', addr: '商中路 9 号', lon: 117.157, lat: 37.312, piles: 12, fast: 6,  kwh: 3140, orders: 66, income: 5160, util: 36, status: 'normal' },
    { id: 'ST026', name: '莱芜会展中心站',     district: '莱芜区', addr: '鲁中东大街 59 号', lon: 117.671, lat: 36.214, piles: 20, fast: 10, kwh: 8560, orders: 172, income: 14090, util: 60, status: 'offline' },
  ];

  /* 详情页场站车位布局：列数固定，行数按桩数自适应 3~5 行 */
  const LAYOUT_ROWS = 4, LAYOUT_COLS = 8;

  function pick(s) { return s[Math.floor(Math.random() * s.length)]; }

  const CAR_PLATES = () => {
    const b = 'ABCDEFGHJKLMNPQRSUVWXY', d = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return '鲁A' + pick(b) + pick(d) + pick(d) + pick(d) + pick(d) + pick(d);
  };

  /* 各站点桩清单生成（确定式伪随机，刷新不变） */
  function buildPiles(st) {
    const piles = [];
    let seed = 0;
    for (const ch of st.id) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 1; i <= st.piles; i++) {
      const r = rand();
      let status = 'idle', soc = 0, power = 0, plate = '--', eta = '--';
      if (st.status === 'offline') {
        status = r < 0.2 ? 'fault' : 'offline';
      } else if (st.status === 'alarm' && i % 4 === 0) {
        status = 'fault';
      } else {
        if (r < st.util / 100) {
          status = 'charging';
          soc = Math.round(28 + rand() * 62);
          power = Math.round((38 + rand() * 82) * 10) / 10;
          plate = CAR_PLATES();
          eta = (Math.round((100 - soc) * 1.4) + 4) + ' 分钟';
        } else if (r < st.util / 100 + 0.06) {
          status = 'fault';
        }
      }
      piles.push({
        id: `${st.id.slice(2)}-V${String(i).padStart(2, '0')}`,
        type: i <= st.fast ? '直流快充' : '交流慢充',
        kw: i <= st.fast ? (rand() < .5 ? 120 : 180) : 7,
        status, soc, power, plate, eta,
      });
    }
    return piles;
  }

  global.DATA = { STATIONS, ST_STATUS, LAYOUT_ROWS, LAYOUT_COLS, buildPiles };
})(window);
