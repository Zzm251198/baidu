
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SubwayMap, StationNode } from './components/SubwayMap';
import { StatsCards } from './components/StatsCards';
import { AutoScrollChart } from './components/AutoScrollChart';
import { AGV } from './components/agv.tsx';
import { RightPanel } from './components/RightPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { LINES } from './components/StationData';
import Metro3DView from './components/Metro3DView';

// --- Authoritative Logical Data (Golden Truth for Simulation) ---
// Keys updated to match LINES constant in StationData.ts for linking
const STATION_DATA_LOGICAL: Record<string, string[]> = {
  "1号线/罗宝线": ["机场东", "后瑞", "固戍", "西乡", "坪洲", "宝体", "宝安中心", "新安", "前海湾", "鲤鱼门", "大新", "桃园", "深大", "高新园", "白石洲", "世界之窗", "华侨城", "侨城东", "竹子林", "车公庙", "香蜜湖", "购物公园", "会展中心", "岗厦", "华强路", "科学馆", "大剧院", "老街", "国贸", "罗湖"],
  "2号线/8号线": ["赤湾", "蛇口港", "海上世界", "水湾", "东角头", "湾厦", "海月", "登良", "后海", "科苑", "红树湾", "世界之窗", "侨城北", "深康", "安托山", "侨香", "香蜜", "香梅北", "景田", "莲花西", "福田", "市民中心", "岗厦北", "华强北", "燕南", "大剧院", "湖贝", "黄贝岭", "新秀", "莲塘口岸", "仙湖路", "莲塘", "梧桐山南", "沙头角", "海山", "盐田港西", "深外高中", "盐田路", "鸿安围", "盐田墟", "大梅沙", "小梅沙", "溪涌"],
  "3号线/龙岗线": ["福保", "益田", "石厦", "购物公园", "福田", "少年宫", "莲花村", "华新", "通新岭", "红岭", "老街", "晒布", "翠竹", "田贝", "水贝", "草埔", "布吉", "木棉湾", "大芬", "丹竹头", "六约", "塘坑", "横岗", "永湖", "荷坳", "大运", "爱联", "吉祥", "龙城广场", "南联", "双龙", "梨园", "新生", "坪西", "低碳城", "白石塘", "富坪", "坪地六联"],
  "4号线/龙华线": ["福田口岸", "福民", "会展中心", "市民中心", "少年宫", "莲花北", "上梅林", "民乐", "白石龙", "深圳北站", "红山", "上塘", "龙胜", "龙华", "清湖", "竹村", "茜坑", "长湖", "观澜", "松元厦", "观澜湖", "牛湖"],
  "5号线/环中线": ["赤湾", "荔湾", "铁路公园", "妈湾", "前海湾", "临海", "宝华", "宝安中心", "翻身", "灵芝", "洪浪北", "兴东", "留仙洞", "西丽", "大学城", "塘朗", "长岭陂", "深圳北站", "民治", "五和", "坂田", "杨美", "上水径", "下水径", "长龙", "布吉", "百鸽笼", "布心", "太安", "怡景", "黄贝岭"],
  "6号线/光明线": ["科学馆", "通新岭", "莲花北", "梅林关", "深圳北站", "红山", "上塘", "元芬", "阳台山东", "官田", "长圳", "观光路", "光明大街", "光明", "凤凰城", "红花山", "公明广场", "合水口", "薯田埔", "松岗"],
  "6号线支线": ["光明", "圳美", "中大七院", "深理工"],
  "7号线/西丽线": ["西丽湖", "深大丽湖", "丽湖", "茶光", "珠光", "龙井", "桃源村", "深云", "安托山", "农林", "车公庙", "上沙", "沙尾", "石厦", "皇岗村", "福民", "皇岗口岸", "赤尾", "华强南", "华强北", "华新", "黄木岗", "八卦岭", "红岭北", "笋岗", "洪湖", "田贝", "太安"],
  "8号线": ["梧桐山南", "沙头角", "海山", "盐田港西", "深外高中", "盐田路"],
  "9号线/梅林线": ["前湾", "前湾公园", "梦海", "怡海", "荔林", "南油西", "南油", "南山书城", "后海", "红树湾南", "深湾", "深圳湾公园", "车公庙", "香梅", "景田", "梅景", "下梅林", "梅村", "上梅林", "孖岭", "银湖", "泥岗", "红岭北", "园岭", "红岭", "大剧院", "鹿丹村", "人民南", "文锦"],
  "10号线/坂田线": ["福田口岸", "福民", "岗厦", "岗厦北", "莲花村", "冬瓜岭", "孖岭", "雅宝", "南坑", "光雅园", "五和", "坂田", "贝尔路", "华为", "岗头", "雪象", "甘坑", "凉帽山", "上李朗", "木古", "华南城", "禾花", "平湖", "双拥街"],
  "11号线/机场线": ["华强南", "岗厦北", "车公庙", "红树湾南", "后海", "南山", "前海湾", "宝安", "碧海湾", "机场", "机场北", "福永", "桥头", "塘尾", "马安山", "沙井", "后亭", "松岗", "碧头"],
  "12号线/南宝线": ["左炮台东", "赤湾", "蛇口港", "海上世界", "水湾", "东角头", "湾厦", "南油", "南油西", "桃园", "南山", "新安公园", "灵芝", "上川", "流塘", "西乡", "臣田", "钟屋南", "黄田", "兴围", "机场东", "翠岗", "沙井西", "海上田园东", "松岗"],
  "13号线/石岩线": ["深圳湾口岸", "人才公园", "后海", "科苑", "粤海门", "深大", "高新中"],
  "14号线/东部快线": ["岗厦北", "黄木岗", "罗湖北", "布吉", "石芽岭", "六约北", "塘坑", "坳背", "大运", "南约", "宝龙", "坪环", "坪山广场", "坪山围", "朱洋坑", "坑梓", "沙田"],
  "16号线/龙坪线": ["大运", "龙城公园", "黄阁坑", "回龙埔", "龙平西", "双龙", "新塘围", "龙东", "坪地", "六联", "坪山", "新和", "坪山围", "坪环", "江岭", "沙壆", "燕子岭", "石井", "技术大学", "田心"],
  "20号线/福永线": ["机场北", "重庆路", "国展南", "国展", "会展城"]
};

// Helper: Normalize station names for fuzzy matching (remove '站', trim spaces)
const normalizeName = (name: string) => name.replace(/[站\s]/g, '').trim();

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'monitor' | 'data' | 'simulation' | 'visualization'>('monitor');

  // --- Simulation State ---
  const [mapStations, setMapStations] = useState<StationNode[]>([]);

  const [startLineName, setStartLineName] = useState('');
  const [endLineName, setEndLineName] = useState('');

  const [simParams, setSimParams] = useState({
      startStationName: '',
      endStationName: '',
      cargoMode: 'weight' as 'weight' | 'count',
      cargoValue: ''
  });
  const [simResult, setSimResult] = useState<{
      pathIds: string[];
      timeCost: number;
      transferCount: number;
      routeDescription: string;
      baseCost: number;
      transferCost: number;
      totalCost: number;
      revenue: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeRequestKey, setRouteRequestKey] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<'fast' | 'economy' | 'green'>('economy');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      setCurrentTime(now.toLocaleString('zh-CN', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const subwayStationsByLine = useMemo(() => {
      const grouped: Record<string, string[]> = {};

      mapStations.forEach((station) => {
          const lineName = station.lineName || station.lineId;
          if (!lineName || !station.name) return;

          if (!grouped[lineName]) {
              grouped[lineName] = [];
          }

          if (!grouped[lineName].includes(station.name)) {
              grouped[lineName].push(station.name);
          }
      });

      return grouped;
  }, [mapStations]);

  const subwayLineNames = useMemo(() => Object.keys(subwayStationsByLine), [subwayStationsByLine]);

  const startStations = useMemo(() => {
      if (!startLineName) return [];
      return subwayStationsByLine[startLineName] || [];
  }, [startLineName, subwayStationsByLine]);

  const endStations = useMemo(() => {
      if (!endLineName) return [];
      return subwayStationsByLine[endLineName] || [];
  }, [endLineName, subwayStationsByLine]);

  const scenarios = useMemo(() => {
      if (!simResult) return null;
      const baseTime = simResult.timeCost;
      const baseCost = simResult.totalCost;
      const baseCarbon = baseCost * 0.1;

      return [
          {
              id: 'fast',
              name: '极速模式',
              icon: 'fa-bolt',
              color: 'text-blue-400',
              borderColor: 'border-blue-500',
              bgActive: 'bg-blue-500/10',
              shadow: 'shadow-blue-500/20',
              time: Math.round(baseTime * 0.8),
              cost: (baseCost * 1.4).toFixed(1),
              carbon: (baseCarbon * 1.2).toFixed(2),
              desc: '优先时间，成本较高'
          },
          {
              id: 'economy',
              name: '经济模式',
              icon: 'fa-jpy',
              color: 'text-yellow-400',
              borderColor: 'border-yellow-500',
              bgActive: 'bg-yellow-500/10',
              shadow: 'shadow-yellow-500/20',
              time: baseTime,
              cost: baseCost.toFixed(1),
              carbon: baseCarbon.toFixed(2),
              desc: '综合最优，默认推荐'
          },
          {
              id: 'green',
              name: '绿色模式',
              icon: 'fa-leaf',
              color: 'text-green-400',
              borderColor: 'border-green-500',
              bgActive: 'bg-green-500/10',
              shadow: 'shadow-green-500/20',
              time: Math.round(baseTime * 1.15),
              cost: (baseCost * 0.9).toFixed(1),
              carbon: (baseCarbon * 0.6).toFixed(2),
              desc: '碳排最低，节能环保'
          }
      ];
  }, [simResult]);

    // 下拉框默认值（替换为新维度）
    const [selectedLine, setSelectedLine] = useState('all'); // 地铁线路
    const [selectedStation, setSelectedStation] = useState('all'); // 车站名称
    const [selectedTransportTime, setSelectedTransportTime] = useState('all'); // 运输时间
    const [selectedCargoCategory, setSelectedCargoCategory] = useState('all'); // 货物品类
    const [selectedWaybillNo, setSelectedWaybillNo] = useState('all'); // 运单号

    // 下拉框选项数据（替换为新维度）
    const lineOptions = [
        { value: 'all', label: '全部线路' },
        { value: '1', label: '1号线/罗宝线' },
        { value: '2', label: '2号线/8号线' },
        { value: '5', label: '5号线/环中线' },
        { value: '11', label: '11号线/机场线' },
        { value: '14', label: '14号线/东部快线' },
    ];

    const stationOptions = [
        { value: 'all', label: '全部车站' },
        { value: 'futian', label: '福田站' },
        { value: 'nanshan', label: '南山站' },
        { value: 'luohu', label: '罗湖站' },
        { value: 'baoan', label: '宝安站' },
        { value: 'longgang', label: '龙岗站' },
    ];

    const transportTimeOptions = [
        { value: 'all', label: '全部时间' },
        { value: '202403', label: '2024年03月' },
        { value: '202402', label: '2024年02月' },
        { value: '202401', label: '2024年01月' },
        { value: '202312', label: '2023年12月' },
    ];

    const cargoCategoryOptions = [
        { value: 'all', label: '全部品类' },
        { value: 'electronics', label: '电子产品' },
        { value: 'food', label: '生鲜食品' },
        { value: 'daily', label: '日用百货' },
        { value: 'industrial', label: '工业配件' },
        { value: 'medical', label: '医疗物资' },
    ];

    const waybillNoOptions = [
        { value: 'all', label: '全部运单' },
        { value: 'YD202403001', label: 'YD202403001' },
        { value: 'YD202403002', label: 'YD202403002' },
        { value: 'YD202403003', label: 'YD202403003' },
        { value: 'YD202403004', label: 'YD202403004' },
    ];

    const timelineSegments = useMemo(() => {
      if (!simResult) return [];
      const secTime = 5;
      const waitTime = 4;
      const transferTime = simResult.transferCount * 8;
      const runTime = simResult.timeCost;
      const lastMileTime = 3;

      const total = secTime + waitTime + transferTime + runTime + lastMileTime;

      return [
          { name: '安检', time: secTime, color: 'bg-gray-500', width: (secTime/total)*100 },
          { name: '转运', time: transferTime, color: 'bg-orange-500', width: (transferTime/total)*100 },
          { name: '候车', time: waitTime, color: 'bg-yellow-600', width: (waitTime/total)*100 },
          { name: '运行', time: runTime, color: 'bg-green-500', width: (runTime/total)*100 },
          { name: '末端', time: lastMileTime, color: 'bg-purple-500', width: (lastMileTime/total)*100 },
      ].filter(s => s.width > 0);
  }, [simResult]);

  const costData = useMemo(() => {
      if (!simResult) return null;
      const totalRevenue = simResult.baseCost * 1.5 + simResult.transferCount * 10;
      const totalCost = simResult.totalCost;
      const profit = totalRevenue - totalCost;
      return { totalRevenue, totalCost, profit };
  }, [simResult]);

  // --- 1. Graph Construction (Adjacency List) ---
  const logicalGraph = useMemo(() => {
      const adj = new Map<string, string[]>();

      const addEdge = (u: string, v: string) => {
          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);
          if (!adj.get(u)!.includes(v)) adj.get(u)!.push(v);
          if (!adj.get(v)!.includes(u)) adj.get(v)!.push(u);
      };

      Object.values(STATION_DATA_LOGICAL).forEach(stations => {
          for (let i = 0; i < stations.length - 1; i++) {
              addEdge(stations[i], stations[i+1]);
          }
      });

      return adj;
  }, []);

  const calculateRoute = () => {
      if (!simParams.startStationName || !simParams.endStationName || !simParams.cargoValue) {
          alert('\u8bf7\u5b8c\u5584\u4eff\u771f\u53c2\u6570\u8f93\u5165');
          return;
      }

      setIsSimulating(true);

      const routeStart = simParams.startStationName;
      const routeEnd = simParams.endStationName;
      const cargoVal = parseFloat(simParams.cargoValue);
      const unitPrice = simParams.cargoMode === 'weight' ? 1 : 3;
      const baseFreight = cargoVal * unitPrice;
      const totalCost = baseFreight;
      const profit = baseFreight * 0.5;

      setRouteRequestKey((value) => value + 1);
      setSimResult({
          pathIds: [],
          timeCost: 0,
          transferCount: 0,
          routeDescription: `${routeStart} \u2192 ${routeEnd}`,
          baseCost: baseFreight,
          transferCost: 0,
          totalCost,
          revenue: profit
      });
      setSelectedScenario('economy');

      window.setTimeout(() => {
          setIsSimulating(false);
      }, 500);
      return;

      if (!simParams.startStationName || !simParams.endStationName || !simParams.cargoValue) {
          alert("请完善仿真参数输入");
          return;
      }
      setIsSimulating(true);

      const start = simParams.startStationName;
      const end = simParams.endStationName;

      // --- 2. Pathfinding Algorithm (BFS) ---
      const queue: string[][] = [[start]];
      const visited = new Set<string>();
      let pathFound: string[] | null = null;

      while (queue.length > 0) {
          const path = queue.shift()!;
          const node = path[path.length - 1];

          if (node === end) {
              pathFound = path;
              break;
          }

          if (!visited.has(node)) {
              visited.add(node);
              const neighbors = logicalGraph.get(node) || [];
              for (const neighbor of neighbors) {
                  queue.push([...path, neighbor]);
              }
          }
      }

      setTimeout(() => {
          if (pathFound) {
              // --- 3. Data Mapping & Segment Rendering Preparation ---
              let transferCount = 0;
              const precisePathIds: string[] = [];
              const normalizedMapStations = mapStations.map(s => ({...s, normName: normalizeName(s.name)}));

              for (let i = 0; i < pathFound.length - 1; i++) {
                  const uName = pathFound[i];
                  const vName = pathFound[i+1];

                  // Find the Logical Line that connects these two stations
                  // This is crucial: we must look up the Visual Nodes associated with *this specific line*
                  const commonLineKey = Object.keys(STATION_DATA_LOGICAL).find(lineKey =>
                      STATION_DATA_LOGICAL[lineKey].includes(uName) && STATION_DATA_LOGICAL[lineKey].includes(vName)
                  );

                  if (commonLineKey) {
                      // Map Logical Line Name to Visual Line ID
                      const lineId = Object.keys(LINES).find(id => LINES[id].name === commonLineKey);

                      if (lineId) {
                          // Find matching Visual Nodes using Normalized Names and Line ID context
                          const uNode = normalizedMapStations.find(s => s.normName === normalizeName(uName) && s.lineId === lineId);
                          const vNode = normalizedMapStations.find(s => s.normName === normalizeName(vName) && s.lineId === lineId);

                          if (uNode && vNode) {
                              // If this is the start of the path, add the first node
                              if (precisePathIds.length === 0) {
                                  precisePathIds.push(uNode.id);
                              } else {
                                  // Transfer Logic:
                                  // If the last node ID in our path is NOT the current uNode ID,
                                  // it means we are at the same logical station but on a different line.
                                  // We add uNode.id to draw the "transfer walk" link.
                                  const lastId = precisePathIds[precisePathIds.length - 1];
                                  if (lastId !== uNode.id) {
                                      precisePathIds.push(uNode.id);
                                      transferCount++;
                                  }
                              }
                              // Always add the next node
                              precisePathIds.push(vNode.id);
                          }
                      }
                  }
              }

              // Route Description
              const stationsCount = pathFound.length - 1;
              const desc = `${start} → ${end} (共 ${stationsCount} 站)`;

              // Calculations
              const cargoVal = parseFloat(simParams.cargoValue);
              const timeCost = (stationsCount * 2) + (transferCount * 3);
              const unitPrice = simParams.cargoMode === 'weight' ? 1 : 3;
              const baseFreight = cargoVal * unitPrice;
              const transferFee = transferCount * 5;
              const totalCost = baseFreight + transferFee;
              const pricing = baseFreight * 1.5;
              const profit = pricing - totalCost;

              setSimResult({
                  pathIds: precisePathIds,
                  timeCost,
                  transferCount,
                  routeDescription: desc,
                  baseCost: baseFreight,
                  transferCost: transferFee,
                  totalCost,
                  revenue: profit
              });
              setSelectedScenario('economy');
          } else {
              alert("未找到可行路径（可能是孤立站点）");
          }
          setIsSimulating(false);
      }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-light/80 backdrop-blur-md border-b border-gray-700/30 fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 w-1/3">
            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
              <i className="fa fa-subway text-xl text-white"></i>
            </div>
            <h1 className="text-xl font-bold tracking-wide truncate">
              {/*<span className="text-white">深圳地铁</span>*/}
              <span className="text-secondary ml-2 hidden sm:inline">城市轨道交通货运智能监测与调度仿真系统</span>
            </h1>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-dark p-1 rounded-lg border border-gray-700/50 flex space-x-1">
                <button onClick={() => setActiveTab('monitor')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'monitor' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i className="fa fa-eye mr-2"></i>实时监控</button>
                <button onClick={() => setActiveTab('data')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'data' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i className="fa fa-bar-chart mr-2"></i>货运数据</button>
                 <button onClick={() => setActiveTab('simulation')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'simulation' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i className="fa fa-cogs mr-2"></i>仿真模拟</button>
                 {/*<button onClick={() => setActiveTab('visualization')} className={`px-4 lg:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${activeTab === 'visualization' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i className="fa fa-cube mr-2"></i>可视化</button>*/}
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 w-1/4">
            <div className="hidden md:flex flex-col items-end mr-2">
                <div className="text-xs text-gray-400">系统时间</div>
                <div className="text-sm font-mono text-secondary font-bold">{currentTime}</div>
            </div>
            <div className="relative cursor-pointer group">
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">3</span>
              <div className="p-2 rounded-full hover:bg-white/10 transition-colors"><i className="fa fa-bell text-gray-300 group-hover:text-white text-lg"></i></div>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer pl-2 border-l border-gray-700">
              <img src="https://picsum.photos/id/1005/40/40" alt="Avatar" className="h-8 w-8 rounded-full object-cover border-2 border-gray-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 pt-24 pb-12 flex-grow flex flex-col min-h-0">
          {activeTab === 'monitor' && (
              <div className="animate-fade-in flex flex-col h-[calc(100vh-140px)] w-full overflow-hidden">
                  {/* 顶部状态栏 - 固定高度 */}
                  <div className="flex justify-between items-center mb-4 px-1">
                      <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                          <span className="text-gray-300 font-bold text-sm">全网运行正常</span>
                      </div>
                      <div className="text-xs text-gray-500">
                          数据实时刷新中 <i className="fa fa-refresh fa-spin ml-1"></i>
                      </div>
                  </div>

                  {/* 主体内容 - 重新布局：StatsCards(左) + 地图(中) + RightPanel(右) */}
                  <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* 左侧：StatsCards - 占 3 列 */}
                      <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                          <StatsCards />
                      </div>
                      {/* 中间：地铁地图 - 占 6 列 */}
                      <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
                          <section className="monitor-map-panel h-full flex flex-col overflow-hidden">
                              <div className="monitor-map-title flex items-center flex-shrink-0">
                                  <span className="monitor-map-title-bar"></span>
                                  <span className="monitor-map-title-dot"></span>
                                  深圳轨道物流线网图
                              </div>
                              <div className="monitor-map-frame flex-1 min-h-0">
                                  <SubwayMap mode="monitor" onMapLoaded={setMapStations} />
                              </div>
                          </section>
                      </div>
                      {/* 右侧：RightPanel - 占 3 列 */}
                      <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
                          <RightPanel />
                      </div>
                  </div>
              </div>
          )}

        {activeTab === 'data' && (
            <div className="animate-fade-in space-y-8 pb-8 bg-transparent">
                {/* 顶部科技风下拉筛选栏 - 5个新维度下拉框 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 bg-transparent">
                    {/* 1. 地铁线路下拉框 */}
                    <div className="relative bg-transparent">
                        <label className="block text-xs text-cyan-400 mb-2 tracking-wider">地铁线路</label>
                        <select
                            value={selectedLine}
                            onChange={(e) => setSelectedLine(e.target.value)}
                            className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
                        >
                            {lineOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-gray-800 text-cyan-200 border-none"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
                            <i className="fa fa-chevron-down text-xs"></i>
                        </div>
                    </div>

                    {/* 2. 车站名称下拉框 */}
                    <div className="relative bg-transparent">
                        <label className="block text-xs text-cyan-400 mb-2 tracking-wider">车站名称</label>
                        <select
                            value={selectedStation}
                            onChange={(e) => setSelectedStation(e.target.value)}
                            className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
                        >
                            {stationOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-gray-800 text-cyan-200 border-none"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
                            <i className="fa fa-chevron-down text-xs"></i>
                        </div>
                    </div>

                    {/* 3. 运输时间下拉框 */}
                    <div className="relative bg-transparent">
                        <label className="block text-xs text-cyan-400 mb-2 tracking-wider">运输时间</label>
                        <select
                            value={selectedTransportTime}
                            onChange={(e) => setSelectedTransportTime(e.target.value)}
                            className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
                        >
                            {transportTimeOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-gray-800 text-cyan-200 border-none"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
                            <i className="fa fa-chevron-down text-xs"></i>
                        </div>
                    </div>

                    {/* 4. 货物品类下拉框 */}
                    <div className="relative bg-transparent">
                        <label className="block text-xs text-cyan-400 mb-2 tracking-wider">货物品类</label>
                        <select
                            value={selectedCargoCategory}
                            onChange={(e) => setSelectedCargoCategory(e.target.value)}
                            className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
                        >
                            {cargoCategoryOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-gray-800 text-cyan-200 border-none"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
                            <i className="fa fa-chevron-down text-xs"></i>
                        </div>
                    </div>

                    {/* 5. 运单号下拉框 */}
                    <div className="relative bg-transparent">
                        <label className="block text-xs text-cyan-400 mb-2 tracking-wider">运单号</label>
                        <select
                            value={selectedWaybillNo}
                            onChange={(e) => setSelectedWaybillNo(e.target.value)}
                            className="w-full bg-gray-900/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 appearance-none cursor-pointer backdrop-blur-sm"
                        >
                            {waybillNoOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    className="bg-gray-800 text-cyan-200 border-none"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-10 pointer-events-none text-cyan-400">
                            <i className="fa fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

                {/* 第一行图表区域 - 保持原有样式 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
                    <div className="lg:col-span-2 h-full">
                        <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl"></div>
                            <ChartsPanel type="composed" title="各线路运力与实际负载分析" />
                        </div>
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl"></div>
                            <ChartsPanel type="pie" title="运输货物类型分布" />
                        </div>
                    </div>
                </div>

                {/* 第二行图表区域 - 保持原有样式 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[380px]">
                    <div className="h-full">
                        <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl"></div>
                            <ChartsPanel type="scatter" title="线路运输效能矩阵 (距离/耗时/货量)" />
                        </div>
                    </div>
                    <div className="h-full">
                        <div className="h-full w-full bg-transparent border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl"></div>
                            <ChartsPanel type="area" title="全网24小时货运流量趋势" />
                        </div>
                    </div>
                </div>

                {/* 排行榜区域 - 保持原有样式 */}
                <div className="w-full bg-transparent">
                    <div className="bg-transparent rounded-xl p-6 border border-cyan-500/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-cyan-400/30 rounded-tl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-cyan-400/30 rounded-br-xl"></div>

                        <h3 className="font-bold text-cyan-300 mb-6 flex items-center relative z-10">
                            <i className="fa fa-trophy text-yellow-400 mr-3 text-lg"></i>
                            <span className="tracking-wider">综合效率排行榜</span>
                            <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                        </h3>

                        <div className="h-[220px] relative z-10 bg-transparent">
                            <AutoScrollChart />
                        </div>
                    </div>
                </div>

                {/* 全局科技风样式补充 */}
                <style>{`
          /* 强制透明背景 */
          .bg-transparent {
            background-color: transparent !important;
          }
          
          /* 淡入动画优化 */
          .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          /* 科技风边框hover效果 */
          [class*="border-cyan-500/20"]:hover,
          select:hover {
            border-color: rgba(34, 211, 238, 0.4);
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
            transition: all 0.3s ease;
          }
          
          /* 移除下拉框默认样式 */
          select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
          
          /* 下拉框选项美化 */
          option {
            padding: 8px 12px;
          }
          
          /* 响应式调整 - 适配5个下拉框 */
          @media (max-width: 1024px) {
            .grid-cols-5 {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .grid-cols-5 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 480px) {
            .grid-cols-5 {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
            </div>
        )}

          {activeTab === 'simulation' && (
              <div className="animate-fade-in simulation-layout flex flex-col min-h-[calc(100vh-140px)] p-6 gap-8 overflow-y-auto custom-scrollbar bg-transparent">
                  {/* 主内容区域 - 统一左右模块高度 */}
                  <div className="simulation-main-grid grid grid-cols-1 lg:grid-cols-12 gap-6 bg-transparent">
                      {/* 左侧参数配置面板 - 统一高度设置 */}
                      <div className="lg:col-span-4 bg-transparent rounded-xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 h-full min-h-[620px] flex flex-col relative overflow-hidden">
                          {/* 科技风装饰角标 */}
                          <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>
                          <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-400/30 rounded-br-xl pointer-events-none"></div>

                          <h3 className="text-cyan-300 font-bold mb-6 flex items-center flex-shrink-0 relative z-10">
                              <span className="w-1.5 h-6 bg-cyan-500 rounded mr-3"></span>
                              仿真参数配置
                              <div className="ml-4 h-0.5 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                          </h3>

                          {/* 内容容器 - 自动填充剩余空间，确保底部按钮对齐 */}
                          <div className="space-y-6 relative z-10 flex-grow flex flex-col">
                              {/* 起点选择 */}
                              <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                                  <label className="text-xs font-bold text-cyan-400 flex items-center">
                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-lg shadow-emerald-500/20"></span>
                                      起点选择
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <select
                                          className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                                          value={startLineName}
                                          onChange={e => {
                                              setStartLineName(e.target.value);
                                              setSimParams(p => ({...p, startStationName: ''}));
                                          }}
                                      >
                                          <option value="">选择线路</option>
                                          {subwayLineNames.map((name) => (
                                              <option key={name} value={name} className="bg-gray-800 text-cyan-200">
                                                  {name}
                                              </option>
                                          ))}
                                      </select>
                                      <select
                                          className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                          value={simParams.startStationName}
                                          onChange={e => setSimParams({...simParams, startStationName: e.target.value})}
                                          disabled={!startLineName}
                                      >
                                          <option value="">选择站点</option>
                                          {startStations.map(sName => (
                                              <option key={sName} value={sName} className="bg-gray-800 text-cyan-200">
                                                  {sName}
                                              </option>
                                          ))}
                                      </select>
                                  </div>
                              </div>

                              {/* 终点选择 */}
                              <div className="space-y-4 p-5 bg-gray-900/20 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                                  <label className="text-xs font-bold text-cyan-400 flex items-center">
                                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 shadow-lg shadow-rose-500/20"></span>
                                      终点选择
                                  </label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <select
                                          className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm"
                                          value={endLineName}
                                          onChange={e => {
                                              setEndLineName(e.target.value);
                                              setSimParams(p => ({...p, endStationName: ''}));
                                          }}
                                      >
                                          <option value="">选择线路</option>
                                          {subwayLineNames.map((name) => (
                                              <option key={name} value={name} className="bg-gray-800 text-cyan-200">
                                                  {name}
                                              </option>
                                          ))}
                                      </select>
                                      <select
                                          className="bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                          value={simParams.endStationName}
                                          onChange={e => setSimParams({...simParams, endStationName: e.target.value})}
                                          disabled={!endLineName}
                                      >
                                          <option value="">选择站点</option>
                                          {endStations.map(sName => (
                                              <option key={sName} value={sName} className="bg-gray-800 text-cyan-200">
                                                  {sName}
                                              </option>
                                          ))}
                                      </select>
                                  </div>
                              </div>

                              {/* 货运参数 */}
                              <div className="space-y-4 pt-6 border-t border-cyan-500/10">
                                  <label className="text-xs text-cyan-400">货运参数</label>
                                  <div className="flex items-center space-x-6">
                                      <label className="flex items-center cursor-pointer">
                                          <input
                                              type="radio"
                                              name="cargoMode"
                                              className="form-radio text-cyan-500 focus:ring-cyan-500 bg-gray-900/60 border-cyan-500/30 h-4 w-4"
                                              checked={simParams.cargoMode === 'weight'}
                                              onChange={() => setSimParams({...simParams, cargoMode: 'weight'})}
                                          />
                                          <span className="ml-2 text-sm text-gray-300">货运重量 (kg)</span>
                                      </label>
                                      <label className="flex items-center cursor-pointer">
                                          <input
                                              type="radio"
                                              name="cargoMode"
                                              className="form-radio text-cyan-500 focus:ring-cyan-500 bg-gray-900/60 border-cyan-500/30 h-4 w-4"
                                              checked={simParams.cargoMode === 'count'}
                                              onChange={() => setSimParams({...simParams, cargoMode: 'count'})}
                                          />
                                          <span className="ml-2 text-sm text-gray-300">货运件数 (件)</span>
                                      </label>
                                  </div>
                                  <input
                                      type="number"
                                      placeholder="请输入数值"
                                      className="w-full bg-gray-900/60 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-sm"
                                      value={simParams.cargoValue}
                                      onChange={e => setSimParams({...simParams, cargoValue: e.target.value})}
                                  />
                              </div>

                              {/* 自动推到底部的按钮容器 */}
                              <div className="mt-auto pt-4">
                                  {/* 开始仿真按钮 - 科技风 */}
                                  <button
                                      onClick={calculateRoute}
                                      disabled={isSimulating}
                                      className={`w-full py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                                          isSimulating
                                              ? 'bg-gray-700/60 cursor-not-allowed border border-gray-600'
                                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/30 border border-cyan-500/30'
                                      }`}
                                  >
                                      {isSimulating ? (
                                          <span><i className="fa fa-spinner fa-spin mr-2"></i>计算中最优路径...</span>
                                      ) : (
                                          <span><i className="fa fa-rocket mr-2"></i>开始仿真</span>
                                      )}
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* 右侧分析面板 - 完全匹配左侧高度 */}
                      <div className="lg:col-span-8 w-full bg-transparent">
                          <div className="bg-transparent rounded-xl p-6 border border-cyan-500/20 relative overflow-hidden h-full min-h-[620px] flex flex-col">
                              <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>
                              <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-cyan-400/30 rounded-br-xl pointer-events-none"></div>

                              <h3 className="font-bold text-cyan-300 mb-6 flex items-center relative z-10 flex-shrink-0">
                                  <i className="fa fa-list-alt text-yellow-400 mr-3 text-lg"></i>
                                  <span className="tracking-wider">订单数据</span>
                                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent rounded-full"></div>
                              </h3>

                              {/* 内容区域 - 填充剩余空间 */}
                              <div className="flex-1 min-h-[400px] relative z-10 bg-transparent">
                                  <AGV />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* 底部地图和动画区域 - 优化间距和高度 */}
                  <div className="simulation-bottom-grid flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent">
                      {/* 左侧地图可视化 */}
                      <div className="simulation-route-panel bg-transparent rounded-xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 flex flex-col relative overflow-hidden">
                          {/* 科技风装饰 */}
                          <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-cyan-400/30 rounded-tl-xl pointer-events-none"></div>

                          <div className="flex justify-between items-center mb-6 flex-shrink-0 relative z-10 flex-wrap gap-4">
                              <h3 className="font-bold text-cyan-300 flex items-center">
                                  <span className="w-1.5 h-6 bg-blue-500 rounded mr-3"></span>
                                  仿真线路规划可视化
                              </h3>
                              <div className="text-xs text-cyan-400 bg-gray-900/40 px-3 py-1 rounded-lg border border-cyan-500/10 backdrop-blur-sm">
                                  {simResult ? simResult.routeDescription : '等待仿真...'}
                              </div>
                          </div>

                          <div className="simulation-route-map-frame relative rounded-lg overflow-hidden bg-gray-900/20 border border-cyan-500/10 backdrop-blur-sm">
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 pointer-events-none"></div>
                              <SubwayMap
                                  mode="simulation"
                                  onMapLoaded={setMapStations}
                                  startStationName={simParams.startStationName}
                                  endStationName={simParams.endStationName}
                                  routeRequestKey={routeRequestKey}
                              />
                              {false && !simResult && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
                                      <div className="bg-gray-900/80 px-6 py-3 rounded-xl text-sm text-cyan-300 border border-cyan-500/20 backdrop-blur-sm shadow-lg">
                                          <i className="fa fa-map-marker mr-2 text-cyan-500"></i>
                                          请在左侧配置参数并开始仿真
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="simulation-reserved-panel flex items-center justify-center">
                          <div className="text-center">
                              <div className="text-cyan-300/80 text-sm font-semibold tracking-wider">预留功能区</div>
                              <div className="mt-2 text-[11px] text-cyan-200/35">Reserved Module</div>
                          </div>
                      </div>
                  </div>

                  {/* 全局样式 - 禁用所有模块内部滚动条 */}
                  <style>{`
  /* 强制透明背景 */
  .bg-transparent {
    background-color: transparent !important;
  }
  
  /* 淡入动画 */
  .animate-fade-in {
    animation: fadeIn 0.8s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* AGV动画优化 */
  .demo-agv {
    animation: agv-cycle 8s infinite ease-in-out;
  }
  
  @keyframes agv-cycle {
    0% { 
      left: 10%; 
      background: linear-gradient(to right, #2563EB, #06B6D4); 
      box-shadow: 0 0 20px #2563EB; 
      transform: translateX(-50%) scale(1); 
    }
    15% { 
      left: 10%; 
      background: linear-gradient(to right, #3B82F6, #22D3EE); 
      box-shadow: 0 0 30px #3B82F6; 
      transform: translateX(-50%) scale(1.2); 
    }
    20% { 
      left: 10%; 
      background: linear-gradient(to right, #2563EB, #06B6D4); 
      box-shadow: 0 0 20px #2563EB; 
      transform: translateX(-50%) scale(1); 
    }
    50% { 
      left: 90%; 
      background: linear-gradient(to right, #2563EB, #06B6D4); 
      transform: translateX(-50%) skewX(-5deg); 
    }
    60% { 
      left: 90%; 
      background: linear-gradient(to right, #10B981, #34D399); 
      box-shadow: 0 0 30px #10B981; 
      transform: translateX(-50%) scale(1.2) skewX(0); 
    }
    85% { 
      left: 90%; 
      background: linear-gradient(to right, #10B981, #34D399); 
      transform: translateX(-50%) scale(1); 
      opacity: 1; 
    }
    95% { 
      left: 90%; 
      opacity: 0; 
    }
    100% { 
      left: 10%; 
      opacity: 0; 
    }
  }
  
  /* 全局禁用内部滚动条 - 只保留最外层滚动 */
  * {
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* IE/Edge */
  }
  
  *::-webkit-scrollbar {
    display: none !important; /* Chrome/Safari/Opera */
  }
  
  /* 只保留最外层的滚动功能（如果需要） */
  .custom-scrollbar {
    overflow-y: auto !important;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    display: block !important;
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 211, 238, 0.5);
  }

  /* 防止元素溢出和重叠 */
  .h-fit {
    height: fit-content !important;
  }

  /* 响应式调整 */
  @media (max-width: 1024px) {
    .min-h-[500px] {
      min-height: 400px !important;
    }
    .h-[380px] {
      height: 300px !important;
    }
  }
`}</style>
              </div>
          )}
      </main>
    </div>
  );
};

export default App;
