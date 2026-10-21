const EMPTY_ROUTE = {
  originStationName: '',
  destinationStationName: '',
  totalDurationMin: 0,
  totalStationCount: 0,
  transferCount: 0,
  transferStations: [],
  segments: [],
  raw: null
};

function normalizeStationName(value) {
  if (value == null) return '';
  return String(value)
    .replace(/\s+/g, '')
    .replace(/站$/, '')
    .trim();
}

function normalizeLineName(value) {
  if (value == null) return '未知线路';
  return String(value).replace(/\s+/g, '').trim() || '未知线路';
}

function asPositiveNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function durationToMinutes(value) {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return value > 600 ? Math.ceil(value / 60) : Math.ceil(value);
  }

  const text = String(value);
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(小时|h|hour)/i);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(分钟|min|m)/i);
  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*(秒|s|sec)/i);
  let minutes = 0;
  if (hourMatch) minutes += Number(hourMatch[1]) * 60;
  if (minMatch) minutes += Number(minMatch[1]);
  if (secondMatch) minutes += Number(secondMatch[1]) / 60;
  if (minutes > 0) return Math.ceil(minutes);

  const numericMatch = text.match(/\d+(?:\.\d+)?/);
  return numericMatch ? Math.ceil(Number(numericMatch[0])) : 0;
}

function stationCountFromValue(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  const match = String(value).match(/(\d+)\s*站/);
  return match ? Number(match[1]) : 0;
}

function getNestedValue(source, paths) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function unwrapBaiduDirection(raw) {
  const payload = raw && raw.raw ? raw.raw : raw;
  const direction = payload?.direction || payload;
  const json = payload?.json || direction?.json || payload?.result || payload?.data;
  const panel = payload?.directionPanel || direction?.directionPanel || direction?.subway?.directionPanel;
  const curSLines = payload?.curSLines || direction?.curSLines || panel?.curSLines || panel?.lines;

  return { payload, direction, json, panel, curSLines };
}

function getBaiduScheme(json) {
  if (!json) return null;
  if (Array.isArray(json.content)) {
    return json.content.find((item) => item && (item.lines || item.steps || item.exts)) || json.content[0] || null;
  }
  if (json.content && typeof json.content === 'object') return json.content;
  if (json.result && typeof json.result === 'object') return json.result;
  return json;
}

function extractJsonLineGroups(scheme) {
  if (!scheme) return [];
  if (Array.isArray(scheme.lines?.[0])) return scheme.lines[0];
  if (Array.isArray(scheme.lines)) return scheme.lines;
  if (Array.isArray(scheme.steps)) return scheme.steps;
  return [];
}

function extractJsonStopGroups(scheme) {
  if (!scheme) return [];
  if (Array.isArray(scheme.stops?.[0])) return scheme.stops[0];
  if (Array.isArray(scheme.stops)) return scheme.stops;
  return [];
}

function stationFromStop(stop, keys) {
  if (!stop) return '';
  const value = getNestedValue(stop, keys);
  if (typeof value === 'string') return normalizeStationName(value);
  if (value && typeof value === 'object') {
    return normalizeStationName(value.name || value.station_name || value.title);
  }
  return '';
}

function buildSegmentsFromBMapSub(rawInfo) {
  const { curSLines, json } = rawInfo;
  if (!Array.isArray(curSLines) || curSLines.length === 0) return [];

  const scheme = getBaiduScheme(json);
  const jsonLines = extractJsonLineGroups(scheme);
  const jsonStops = extractJsonStopGroups(scheme);

  return curSLines.map((line, index) => {
    const jsonLine = jsonLines[index] || {};
    const jsonStop = jsonStops[index] || {};
    const stationList = Array.isArray(line.stations) ? line.stations : [];
    const stationCount = asPositiveNumber(
      line.stationCount || line.station_num || line.stationNum || jsonLine.station_num || jsonLine.stationCount,
      Math.max(0, stationList.length - 1)
    );

    const boardingStation = normalizeStationName(
      line.sname ||
        line.start_name ||
        stationFromStop(jsonStop, ['getOn.name', 'geton.name', 'start.name', 'sname']) ||
        stationList[0]?.name
    );
    const alightingStation = normalizeStationName(
      line.ename ||
        line.end_name ||
        stationFromStop(jsonStop, ['getOff.name', 'getoff.name', 'end.name', 'ename']) ||
        stationList[stationList.length - 1]?.name
    );

    return {
      lineName: normalizeLineName(line.lname || jsonLine.name || jsonLine.line_name || line.lineName),
      boardingStation,
      alightingStation,
      stationCount,
      durationMin: durationToMinutes(line.duration || line.time || line.wtime || jsonLine.duration || jsonLine.time),
      direction: normalizeStationName(line.nname || line.direction || jsonLine.end_name || jsonLine.direction || '')
    };
  });
}

function buildSegmentsFromJson(rawInfo) {
  const scheme = getBaiduScheme(rawInfo.json);
  const jsonLines = extractJsonLineGroups(scheme);
  const jsonStops = extractJsonStopGroups(scheme);
  if (!jsonLines.length && !jsonStops.length) return [];

  const length = Math.max(jsonLines.length, jsonStops.length);
  return Array.from({ length }, (_, index) => {
    const line = jsonLines[index] || {};
    const stop = jsonStops[index] || {};
    const stationCount = asPositiveNumber(line.station_num || line.stationCount || line.stops, 0);

    return {
      lineName: normalizeLineName(line.name || line.line_name || line.lname),
      boardingStation: stationFromStop(stop, ['getOn.name', 'geton.name', 'start.name', 'sname']) || normalizeStationName(line.start_name),
      alightingStation: stationFromStop(stop, ['getOff.name', 'getoff.name', 'end.name', 'ename']) || normalizeStationName(line.end_name),
      stationCount,
      durationMin: durationToMinutes(line.duration || line.time || line.wtime),
      direction: normalizeStationName(line.end_name || line.direction || line.nname || '')
    };
  }).filter((segment) => segment.boardingStation || segment.alightingStation || segment.lineName !== '未知线路');
}

function parseFallbackRoute(fallback = {}) {
  const text = [fallback.fallbackText, fallback.routeDescription, fallback.summaryText].filter(Boolean).join(' ');
  const duration = durationToMinutes(text);
  const stationCount = stationCountFromValue(text);

  return {
    ...EMPTY_ROUTE,
    originStationName: normalizeStationName(fallback.originStationName || fallback.startStationName || fallback.startNode),
    destinationStationName: normalizeStationName(fallback.destinationStationName || fallback.endStationName || fallback.endNode),
    totalDurationMin: duration,
    totalStationCount: stationCount,
    raw: null
  };
}

function inferTransferStations(segments) {
  const stations = [];
  for (let index = 1; index < segments.length; index += 1) {
    const previous = segments[index - 1];
    const current = segments[index];
    const station = normalizeStationName(previous.alightingStation || current.boardingStation);
    if (station && station === normalizeStationName(current.boardingStation) && !stations.includes(station)) {
      stations.push(station);
    } else if (station && !stations.includes(station)) {
      stations.push(station);
    }
  }
  return stations;
}

export function parseBaiduTransitRoute(raw, fallback = {}) {
  if (!raw) return parseFallbackRoute(fallback);

  const rawInfo = unwrapBaiduDirection(raw);
  const scheme = getBaiduScheme(rawInfo.json);
  const segments = buildSegmentsFromBMapSub(rawInfo).length
    ? buildSegmentsFromBMapSub(rawInfo)
    : buildSegmentsFromJson(rawInfo);

  if (!segments.length) return parseFallbackRoute({ ...fallback, fallbackText: fallback.fallbackText });

  const jsonDuration = getNestedValue(scheme, ['exts.0.time', 'exts.time', 'duration', 'time']);
  const panelDuration = getNestedValue(rawInfo, ['panel.totalTimes', 'payload.totalTimes', 'direction.totalTimes']);
  const totalDurationMin =
    durationToMinutes(jsonDuration) ||
    durationToMinutes(panelDuration) ||
    segments.reduce((sum, segment) => sum + durationToMinutes(segment.durationMin), 0) ||
    durationToMinutes(fallback.fallbackText);

  const jsonStationCount = getNestedValue(scheme, ['exts.0.station_num', 'station_num', 'stationCount']);
  const panelStationCount = getNestedValue(rawInfo, ['panel.totalStops', 'payload.totalStops', 'direction.totalStops']);
  const totalStationCount =
    stationCountFromValue(jsonStationCount) ||
    stationCountFromValue(panelStationCount) ||
    segments.reduce((sum, segment) => sum + stationCountFromValue(segment.stationCount), 0) ||
    stationCountFromValue(fallback.fallbackText);

  const originStationName =
    normalizeStationName(fallback.originStationName || fallback.startStationName || fallback.startNode) ||
    segments[0]?.boardingStation ||
    '';
  const destinationStationName =
    normalizeStationName(fallback.destinationStationName || fallback.endStationName || fallback.endNode) ||
    segments[segments.length - 1]?.alightingStation ||
    '';

  return {
    originStationName,
    destinationStationName,
    totalDurationMin,
    totalStationCount,
    transferCount: Math.max(0, segments.length - 1),
    transferStations: inferTransferStations(segments),
    segments,
    raw
  };
}

export default parseBaiduTransitRoute;
