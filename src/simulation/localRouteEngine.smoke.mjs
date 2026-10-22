// 本地线网引擎冒烟测试：node src/simulation/localRouteEngine.smoke.mjs
import { planLocalRoute } from './localRouteEngine.js';

const cases = [
  ['前海湾', '岗厦北'],      // 11号线直达
  ['机场东', '沙田'],        // 1→11→14 两次换乘
  ['福保', '小梅沙'],        // 3→2/8 一次换乘
  ['前海湾站', '岗厦北'],    // 站名带"站"后缀归一化
  ['深圳北站', '宝安中心'],  // 数据集站名不带"站"后缀，归一化后命中
  ['赤湾', '赤湾'],          // 起终点相同 → null
  ['银湖', '岗厦北'],        // 未收录站名 → null
  ['罗湖', '双龙']           // 1→3 经老街
];

for (const [start, end] of cases) {
  const result = planLocalRoute(start, end);
  if (!result) {
    console.log(`- ${start} → ${end}: null`);
    continue;
  }
  const segText = result.segments
    .map((s) => `${s.lineName}:${s.boardingStation}→${s.alightingStation}(${s.stationCount}站,${s.durationMin}分)`)
    .join(' ⟹ ');
  console.log(`✓ ${start} → ${end} | 总${result.totalStationCount}站/${result.totalDurationMin}分/换${result.transferCount}次(${result.transferStations.join(',')})\n    ${segText}`);
}
