// 本地线网兜底引擎：百度 Direction 查询失败/超时时的离线备用路径规划。
// 原理：把深圳地铁骨干线网建成"站点图"（相邻站连边、同名站即换乘），
// 用 Dijkstra 求"少站数 + 惩罚换乘"的最优路径，输出与 baiduRouteParser.js
// 完全一致的 routeSummary 结构，simulateOrder 无需任何改动即可消费。
//
// ⚠️ 线网数据依据公开线路图整理（2024-2025 年状态，1/2/3/5/11/14 六条骨干线），
//    比赛演示前请对照深圳地铁官方线路图核对站名与顺序。
//    未覆盖的线路（4/6/7/8二期以外的支线/9/10/12/13/16/20 等）会返回 null，由调用方提示。

// ─────────────────────────── 线网数据 ───────────────────────────

// 同时导出线网定义：数据页在百度线网尚未加载时用它做兜底线网
export const LINE_DEFINITIONS = [
  {
    id: 'line1',
    name: '1号线/罗宝线',
    stations: [
      '罗湖', '国贸', '老街', '大剧院', '科学馆', '华强路', '岗厦', '会展中心', '购物公园', '香蜜湖',
      '车公庙', '竹子林', '侨城东', '华侨城', '世界之窗', '白石洲', '高新园', '深大', '桃园', '大新',
      '鲤鱼门', '前海湾', '新安', '宝安中心', '宝体', '坪洲', '西乡', '固戍', '后瑞', '机场东'
    ]
  },
  {
    id: 'line2',
    name: '2号线/8号线',
    stations: [
      '赤湾', '蛇口港', '海上世界', '水湾', '东角头', '湾厦', '海月', '登良', '后海', '科苑',
      '红树湾', '世界之窗', '侨城北', '深康', '安托山', '侨香', '香蜜', '香梅北', '景田', '莲花西',
      '福田', '市民中心', '岗厦北', '华强北', '燕南', '大剧院', '湖贝', '黄贝岭', '新秀',
      '莲塘口岸', '仙湖路', '莲塘', '梧桐山南', '沙头角', '海山', '盐田港西', '深外高中', '盐田路', '大梅沙', '小梅沙'
    ]
  },
  {
    id: 'line3',
    name: '3号线/龙岗线',
    stations: [
      '福保', '益田', '石厦', '购物公园', '福田', '少年宫', '莲花村', '华新', '通新岭', '红岭',
      '老街', '晒布', '翠竹', '田贝', '水贝', '草埔', '布吉', '木棉湾', '大芬', '丹竹头',
      '六约', '塘坑', '横岗', '永湖', '荷坳', '大运', '爱联', '吉祥', '龙城广场', '南联', '双龙'
    ]
  },
  {
    id: 'line5',
    name: '5号线/环中线',
    stations: [
      '赤湾', '荔湾', '铁路公园', '妈湾', '前湾公园', '前湾', '桂湾', '前海湾', '临海', '宝华',
      '宝安中心', '翻身', '灵芝', '洪浪北', '兴东', '留仙洞', '西丽', '大学城', '塘朗', '长岭陂',
      '民治', '深圳北', '白石龙', '民乐', '坂田', '杨美', '上水径', '下水径', '长龙', '布吉',
      '百鸽笼', '布心', '太安', '怡景', '黄贝岭'
    ]
  },
  {
    id: 'line11',
    name: '11号线/机场线',
    stations: [
      '岗厦北', '华强南', '红岭南', '福田', '车公庙', '红树湾南', '后海', '南山', '前海湾', '宝安',
      '碧海湾', '机场', '机场北', '福永', '桥头', '塘尾', '马安山', '沙井', '后亭', '松岗', '碧头'
    ]
  },
  {
    id: 'line14',
    name: '14号线/东部快线',
    stations: [
      '岗厦北', '黄木岗', '清水河', '布吉', '石芽岭', '六约北', '四联', '坳背', '大运', '宝龙',
      '锦龙', '坪山围', '坪山广场', '坪山中心', '坑梓', '沙田'
    ]
  }
];

// ─────────────────────────── 参数（可按业务校准） ───────────────────────────

const MINUTES_PER_STATION = 2.5;   // 深圳地铁平均站间运行时间（分钟）
const TRANSFER_PENALTY_STATIONS = 3; // 换乘惩罚：换 1 次车 ≈ 多坐 3 站的代价（避免"少坐1站换3次车"）
const TRANSFER_MINUTES = 5;        // 每次换乘预留的走行+候车时间（分钟）

// ─────────────────────────── 工具函数 ───────────────────────────

function normalizeStationName(value) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, '').replace(/站$/, '').trim();
}

// 邻接表：站名 -> [{ to: 邻站名, lineId }]
const ADJACENCY = (() => {
  const map = new Map();

  const addEdge = (from, to, lineId) => {
    if (!map.has(from)) map.set(from, []);
    map.get(from).push({ to, lineId });
  };

  for (const line of LINE_DEFINITIONS) {
    for (let i = 0; i < line.stations.length - 1; i += 1) {
      addEdge(line.stations[i], line.stations[i + 1], line.id);
      addEdge(line.stations[i + 1], line.stations[i], line.id);
    }
  }

  return map;
})();

const LINE_BY_ID = new Map(LINE_DEFINITIONS.map((line) => [line.id, line]));

// ─────────────────────────── Dijkstra 核心 ───────────────────────────
// 状态 = (站名, 当前乘坐的线路)。把"当前线路"纳入状态，
// 才能在换线时施加换乘惩罚；起点尚未上车，currentLine 记为 null。

function findShortestPath(startName, endName) {
  if (!ADJACENCY.has(startName) || !ADJACENCY.has(endName)) return null;
  if (startName === endName) return null;

  // cost：以"等效站数"计价。key = `${station}|${lineId}`
  const bestCost = new Map();
  const cameFrom = new Map();
  const queue = [{ station: startName, lineId: null, cost: 0 }];

  bestCost.set(`${startName}|null`, 0);

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const currentKey = `${current.station}|${current.lineId}`;
    if (current.cost > (bestCost.get(currentKey) ?? Infinity)) continue;

    if (current.station === endName) {
      return rebuildPath(cameFrom, current);
    }

    for (const edge of ADJACENCY.get(current.station) || []) {
      const transferHappened = current.lineId !== null && current.lineId !== edge.lineId;
      const nextCost = current.cost + 1 + (transferHappened ? TRANSFER_PENALTY_STATIONS : 0);
      const nextKey = `${edge.to}|${edge.lineId}`;

      if (nextCost < (bestCost.get(nextKey) ?? Infinity)) {
        bestCost.set(nextKey, nextCost);
        cameFrom.set(nextKey, current);
        queue.push({ station: edge.to, lineId: edge.lineId, cost: nextCost });
      }
    }
  }

  return null;
}

function rebuildPath(cameFrom, endState) {
  const path = [];
  let state = endState;

  while (state) {
    path.unshift({ station: state.station, lineId: state.lineId });
    state = cameFrom.get(`${state.station}|${state.lineId}`);
  }

  return path;
}

// ─────────────────────────── 路径 → segments（对齐百度解析器格式） ───────────────────────────

function directionOfSegment(line, boardingIndex, alightingIndex) {
  // direction 字段 = 列车驶向的终点站（该线两端中，行驶方向所指的那端）
  return boardingIndex < alightingIndex
    ? line.stations[line.stations.length - 1]
    : line.stations[0];
}

function buildSegments(path) {
  const segments = [];

  // path[i].lineId = "到达第 i 站所乘的线路"，即第 i-1→i 步所用的线路。
  // 一段 = 连续使用同一条线的一串移动；换乘站既是上一段的下车站，也是下一段的上车站。
  let runStart = 0;
  for (let i = 1; i < path.length; i += 1) {
    const lineChanged = i > 1 && path[i].lineId !== path[i - 1].lineId;
    const isLast = i === path.length - 1;

    if (lineChanged || isLast) {
      const moveEnd = isLast ? i : i - 1;
      const line = LINE_BY_ID.get(path[runStart + 1].lineId);
      const boardingStation = path[runStart].station;
      const alightingStation = path[moveEnd].station;
      const boardingIndex = line.stations.indexOf(boardingStation);
      const alightingIndex = line.stations.indexOf(alightingStation);
      const stationCount = Math.abs(alightingIndex - boardingIndex);

      segments.push({
        lineName: line.name,
        boardingStation,
        alightingStation,
        stationCount,
        durationMin: Math.max(1, Math.round(stationCount * MINUTES_PER_STATION)),
        direction: directionOfSegment(line, boardingIndex, alightingIndex)
      });
      runStart = moveEnd;
    }
  }

  return segments;
}

// ─────────────────────────── 对外入口 ───────────────────────────

/**
 * 规划起终点间的地铁路径。
 * @returns 与 parseBaiduTransitRoute 同构的 routeSummary；任一站不在数据集内或不可达时返回 null。
 */
export function planLocalRoute(rawStartStationName, rawEndStationName) {
  const start = normalizeStationName(rawStartStationName);
  const end = normalizeStationName(rawEndStationName);

  const path = findShortestPath(start, end);
  if (!path || path.length < 2) return null;

  const segments = buildSegments(path);
  if (!segments.length) return null;

  const transferStations = segments.slice(0, -1).map((segment) => segment.alightingStation);
  const totalStationCount = segments.reduce((sum, segment) => sum + segment.stationCount, 0);
  const totalDurationMin = segments.reduce((sum, segment) => sum + segment.durationMin, 0)
    + transferStations.length * TRANSFER_MINUTES;

  return {
    originStationName: start,
    destinationStationName: end,
    totalDurationMin,
    totalStationCount,
    transferCount: Math.max(0, segments.length - 1),
    transferStations,
    segments,
    raw: null,
    source: 'local'
  };
}

export default planLocalRoute;
