/* ============================================================
   data.js — 模拟数据源（两个大屏共享）
   坐标为杭州市经纬度，仅作演示
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
    { id: 'ST001', name: '钱江新城核心枢纽站', district: '上城区', addr: '市民街 98 号 P3 停车场', lon: 120.211, lat: 30.246, piles: 32, fast: 16, kwh: 18420, orders: 386, income: 31260, util: 82, status: 'busy' },
    { id: 'ST002', name: '城站火车站东站',     district: '上城区', addr: '环城东路 1 号 B2 层', lon: 120.178, lat: 30.249, piles: 24, fast: 12, kwh: 12630, orders: 271, income: 20940, util: 74, status: 'normal' },
    { id: 'ST003', name: '西湖文化广场站',     district: '下城区', addr: '中山北路 581 号', lon: 120.163, lat: 30.279, piles: 18, fast: 8,  kwh: 8210, orders: 178, income: 13650, util: 63, status: 'normal' },
    { id: 'ST004', name: '武林银泰快充站',     district: '下城区', addr: '延安路 528 号屋顶停车场', lon: 120.166, lat: 30.274, piles: 20, fast: 14, kwh: 11240, orders: 236, income: 19870, util: 79, status: 'busy' },
    { id: 'ST005', name: '黄龙体育中心站',     district: '西湖区', addr: '黄龙路 1 号北门', lon: 120.134, lat: 30.266, piles: 28, fast: 12, kwh: 9860, orders: 197, income: 16120, util: 58, status: 'normal' },
    { id: 'ST006', name: '西溪湿地北门站',     district: '西湖区', addr: '天目山路 518 号', lon: 120.075, lat: 30.275, piles: 16, fast: 8,  kwh: 5340, orders: 112, income: 8790, util: 44, status: 'normal' },
    { id: 'ST007', name: '云栖小镇智算站',     district: '西湖区', addr: '河山路 1 号产业园区', lon: 120.088, lat: 30.190, piles: 22, fast: 16, kwh: 10980, orders: 189, income: 18230, util: 71, status: 'normal' },
    { id: 'ST008', name: '滨江星光大道站',     district: '滨江区', addr: '江南大道 2286 号', lon: 120.212, lat: 30.208, piles: 26, fast: 14, kwh: 12170, orders: 253, income: 20450, util: 69, status: 'normal' },
    { id: 'ST009', name: '滨江高新区软件园站', district: '滨江区', addr: '伟业路 1 号苏泊尔大厦', lon: 120.189, lat: 30.194, piles: 14, fast: 8,  kwh: 6120, orders: 131, income: 10080, util: 52, status: 'normal' },
    { id: 'ST010', name: '萧山国际机场 T3 站', district: '萧山区', addr: '空港大道 1 号 T3 停车楼', lon: 120.431, lat: 30.242, piles: 36, fast: 24, kwh: 21650, orders: 412, income: 36540, util: 88, status: 'busy' },
    { id: 'ST011', name: '萧山人民广场站',     district: '萧山区', addr: '市心中路 900 号', lon: 120.264, lat: 30.184, piles: 20, fast: 10, kwh: 8730, orders: 176, income: 14120, util: 56, status: 'normal' },
    { id: 'ST012', name: '湘湖旅游度假区站',   district: '萧山区', addr: '湘湖路 92 号', lon: 120.218, lat: 30.142, piles: 12, fast: 6,  kwh: 3980, orders: 84, income: 6540, util: 37, status: 'normal' },
    { id: 'ST013', name: '未来科技城枢纽站',   district: '余杭区', addr: '文一西路 998 号', lon: 119.996, lat: 30.285, piles: 30, fast: 18, kwh: 15420, orders: 298, income: 25890, util: 77, status: 'busy' },
    { id: 'ST014', name: '阿里巴巴西溪园区站', district: '余杭区', addr: '文一西路 969 号', lon: 120.015, lat: 30.277, piles: 24, fast: 16, kwh: 11890, orders: 241, income: 19760, util: 72, status: 'normal' },
    { id: 'ST015', name: '良渚文化村站',       district: '余杭区', addr: '玉鸟路 12 号', lon: 120.052, lat: 30.341, piles: 14, fast: 6,  kwh: 4520, orders: 96, income: 7420, util: 41, status: 'normal' },
    { id: 'ST016', name: '临平银泰城站',       district: '临平区', addr: '临平世纪大道 1 号', lon: 120.301, lat: 30.420, piles: 22, fast: 12, kwh: 9650, orders: 188, income: 15830, util: 61, status: 'normal' },
    { id: 'ST017', name: '钱塘高端装备园站',   district: '钱塘区', addr: '江东大道 4567 号', lon: 120.382, lat: 30.318, piles: 18, fast: 10, kwh: 7840, orders: 152, income: 12960, util: 59, status: 'normal' },
    { id: 'ST018', name: '下沙大学城站',       district: '钱塘区', addr: '学源街 258 号', lon: 120.351, lat: 30.312, piles: 16, fast: 8,  kwh: 6230, orders: 143, income: 10270, util: 55, status: 'normal' },
    { id: 'ST019', name: '富阳硅谷小镇站',     district: '富阳区', addr: '创新路 1 号', lon: 119.960, lat: 30.048, piles: 16, fast: 8,  kwh: 5410, orders: 107, income: 8890, util: 47, status: 'normal' },
    { id: 'ST020', name: '富春江畔文旅站',     district: '富阳区', addr: '江滨东大道 5 号', lon: 119.932, lat: 30.036, piles: 10, fast: 4,  kwh: 2890, orders: 62, income: 4760, util: 33, status: 'offline' },
    { id: 'ST021', name: '临安青山湖科技城站', district: '临安区', addr: '青山湖街道科技大道', lon: 119.748, lat: 30.241, piles: 18, fast: 10, kwh: 7020, orders: 134, income: 11580, util: 54, status: 'normal' },
    { id: 'ST022', name: '天目山生态旅游站',   district: '临安区', addr: '天目山镇景秀路', lon: 119.432, lat: 30.343, piles: 8,  fast: 4,  kwh: 1930, orders: 38, income: 3180, util: 26, status: 'alarm' },
    { id: 'ST023', name: '桐庐高铁站枢纽站',   district: '桐庐县', addr: '桐庐站南广场', lon: 119.692, lat: 29.808, piles: 14, fast: 8,  kwh: 5230, orders: 104, income: 8620, util: 49, status: 'normal' },
    { id: 'ST024', name: '千岛湖游客中心站',   district: '淳安县', addr: '千岛湖镇梦姑路', lon: 119.032, lat: 29.609, piles: 12, fast: 6,  kwh: 3560, orders: 71, income: 5870, util: 38, status: 'normal' },
    { id: 'ST025', name: '建德新安江广场站',   district: '建德市', addr: '新安路 108 号', lon: 119.281, lat: 29.475, piles: 12, fast: 6,  kwh: 3140, orders: 66, income: 5160, util: 36, status: 'normal' },
    { id: 'ST026', name: '拱墅运河财富中心站', district: '拱墅区', addr: '大关路 98 号', lon: 120.146, lat: 30.312, piles: 20, fast: 10, kwh: 8560, orders: 172, income: 14090, util: 60, status: 'offline' },
  ];

  /* 详情页场站车位布局：4 行 × 8 列 */
  const LAYOUT_ROWS = 4, LAYOUT_COLS = 8;

  const CAR_PLATES = () => {
    const a = '浙A', b = 'ABCDEFGHJKLMNPQRSUVWXY', d = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return a + pick(b) + pick(d) + pick(d) + pick(d) + pick(d) + pick(d);
  };
  function pick(s) { return s[Math.floor(Math.random() * s.length)]; }

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
