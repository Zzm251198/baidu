import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SVG_MAP_CONTENT, LINES } from './StationData';

const Metro3DView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const composerRef = useRef<EffectComposer>();
  const controlsRef = useRef<OrbitControls>();
  const animationIdRef = useRef<number>();
  const stationsRef = useRef<THREE.Group[]>([]);
  const particlesRef = useRef<THREE.Points>(); // 粒子系统引用
  const trainsRef = useRef<any[]>([]); // 列车引用
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredObjectRef = useRef<THREE.Object3D | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass>(); // Bloom效果引用

  const [lineCount, setLineCount] = useState(0);
  const [stationCount, setStationCount] = useState(0);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllStations, setShowAllStations] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [highlightedStation, setHighlightedStation] = useState<string | null>(null);
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const stationsMeshRef = useRef<THREE.Group[]>([]); // 存储站点网格引用

  // Parse SVG path to 3D coordinates
  const parsePathToPoints = (pathD: string): [number, number, number][] => {
    const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    const points: [number, number, number][] = [];
    let currentX = 0,
      currentY = 0;

    commands.forEach((cmd) => {
      const type = cmd[0];
      const coords = cmd.substring(1).trim().split(/[\s,]+/).map(Number);

      switch (type) {
        case 'M':
          currentX = coords[0];
          currentY = coords[1];
          points.push([currentX, currentY, 0]);
          break;
        case 'L':
          currentX = coords[0];
          currentY = coords[1];
          points.push([currentX, currentY, 0]);
          break;
        case 'm':
          currentX += coords[0];
          currentY += coords[1];
          points.push([currentX, currentY, 0]);
          break;
        case 'l':
          currentX += coords[0];
          currentY += coords[1];
          points.push([currentX, currentY, 0]);
          break;
        case 'C':
        case 'S':
        case 'Q':
        case 'T':
          if (coords.length >= 4) {
            currentX = coords[coords.length - 2];
            currentY = coords[coords.length - 1];
            points.push([currentX, currentY, 0]);
          }
          break;
        case 'A':
          if (coords.length >= 7) {
            currentX = coords[5];
            currentY = coords[6];
            points.push([currentX, currentY, 0]);
          }
          break;
      }
    });

    return points;
  };

  // Parse SVG data
  const sceneData = useMemo(() => {
    const parser = new DOMParser();
    // 包装在 svg 根元素中以正确解析
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">${SVG_MAP_CONTENT}</svg>`;
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const paths = Array.from(svgDoc.querySelectorAll('g#g-lines path'));
    const circles = Array.from(svgDoc.querySelectorAll('g#g-stations circle'));

    // 建立线路ID到颜色的映射
    const lineColorMap = new Map<string, string>();
    paths.forEach((path) => {
      const lineId = path.getAttribute('name') || '';
      const color = path.getAttribute('stroke') || '#ffffff';
      if (lineId) {
        lineColorMap.set(lineId, color);
      }
    });

    const lineData: Array<{ points: THREE.Vector3[]; color: string; lineId: string; lineName: string }> = [];
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    paths.forEach((path) => {
      const d = path.getAttribute('d') || '';
      const color = path.getAttribute('stroke') || '#2196F3';
      const lineId = path.getAttribute('name') || '';

      if (d) {
        const points = parsePathToPoints(d);
        const vectorPoints = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));

        // 获取线路名称
        const lineName = (lineId && LINES[lineId]) ? LINES[lineId].name : '未知线路';

        lineData.push({
          points: vectorPoints,
          color: color,
          lineId: lineId,
          lineName: lineName
        });

        points.forEach(([x, y, z]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      }
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const maxDim = Math.max(maxX - minX, maxY - minY);
    const scale = 6500 / maxDim; // 进一步增大缩放比例，让线路图更大

    const scaledLineData = lineData.map((line) => ({
      points: line.points.map(
        (p) => new THREE.Vector3((p.x - centerX) * scale, 0, (p.y - centerY) * scale) // 将 Y 直接映射到 Z
      ),
      color: line.color,
      lineId: line.lineId,
      lineName: line.lineName
    }));

    const stationData: Array<{
      position: [number, number, number];
      color: string;
      label: string;
      fullName: string; // 完整站点名称，用于搜索
      lineId: string;
      lineName: string;
      status: string;
    }> = [];

    // 获取 SVG 中的 text 元素以获取站点名称
    const textElements = Array.from(svgDoc.querySelectorAll('text'));
    const stationNameMap = new Map<string, string>();

    circles.forEach((circle) => {
      const cx = parseFloat(circle.getAttribute('cx') || '0');
      const cy = parseFloat(circle.getAttribute('cy') || '0');
      const stationId = circle.getAttribute('data-station-id') || '';

      // 查找最近的 text 元素作为站点名称
      let closestText = '';
      let minDist = Infinity;

      textElements.forEach((text) => {
        const tx = parseFloat(text.getAttribute('x') || '0');
        const ty = parseFloat(text.getAttribute('y') || '0');
        const dist = Math.sqrt(Math.pow(tx - cx, 2) + Math.pow(ty - cy, 2));

        if (dist < 100 && dist < minDist) {
          minDist = dist;
          closestText = text.textContent?.trim() || '';
        }
      });

      if (closestText) {
        stationNameMap.set(stationId, closestText);
      }
    });

    circles.forEach((circle, index) => {
      // 显示所有站点
      // if (index % 2 !== 0) return;

      const cx = parseFloat(circle.getAttribute('cx') || '0');
      const cy = parseFloat(circle.getAttribute('cy') || '0');
      const stationId = circle.getAttribute('data-station-id') || '';

      // 从站点ID中提取线路ID（前12位）并获取对应的颜色
      const lineId = stationId.substring(0, 12);
      const baseColor = lineColorMap.get(lineId) || '#00ff88'; // 默认绿色

      // 获取线路名称
      const lineName = (lineId && LINES[lineId]) ? LINES[lineId].name : '未知线路';

      // 随机分配站点状态
      const status = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'busy' : 'warning') : 'normal';
      let color = baseColor;
      if (status === 'busy') {
        color = '#ff6b6b'; // 红色 - 繁忙
      } else if (status === 'warning') {
        color = '#ffd93d'; // 黄色 - 警告
      }

      const scaledX = (cx - centerX) * scale;
      const scaledY = (cy - centerY) * scale;

      // 优先使用真实站点名称，否则使用 ID
      const stationName = stationNameMap.get(stationId) || stationId.slice(-4);

      // 只显示站点名称的前 2-4 个字符，避免标签过长
      const shortLabel = stationName.length > 5 ? stationName.substring(0, 4) : stationName;

      const statusText = status === 'busy' ? '繁忙' : (status === 'warning' ? '警告' : '正常');

      stationData.push({
        position: [scaledX, 0, scaledY], // 将 Y 直接映射到 Z
        color,
        label: shortLabel,
        fullName: stationName, // 保存完整名称用于搜索
        lineId: lineId,
        lineName: lineName,
        status: statusText
      });
    });

    return { lineData: scaledLineData, stationData };
  }, []);

  // Create thick glowing line
  const createMetroLine = (points: THREE.Vector3[], color: string): THREE.Group => {
    const group = new THREE.Group();

    // 柔和光效 - 从 6 层减少到 3 层
    const layers = [
      { width: 20, opacity: 0.3, transparent: true }, // 外层柔和光晕
      { width: 12, opacity: 0.6, transparent: true }, // 中层光晕
      { width: 8, opacity: 1.0, transparent: false } // 主线路
    ];

    layers.forEach((layer) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: layer.transparent,
        opacity: layer.opacity,
        linewidth: layer.width
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });

    return group;
  };

  // Create animated station with glow
  const createStation = (
    position: [number, number, number],
    color: string,
    label: string
  ): THREE.Group => {
    const group = new THREE.Group();
    group.position.set(position[0], position[1], position[2]);

    // 创建站点子组（用于脉动动画）
    const sphereGroup = new THREE.Group();
    group.add(sphereGroup);

    // 多层光晕效果 - 从内到外
    const glowLayers = [
      { radius: 6, opacity: 1.0, color: 0xffffff }, // 核心白点
      { radius: 10, opacity: 0.95, color: color }, // 主球体
      { radius: 14, opacity: 0.5, color: color }, // 内层光晕
      { radius: 20, opacity: 0.25, color: color }, // 中层光晕
      { radius: 28, opacity: 0.1, color: color } // 外层光晕
    ];

    glowLayers.forEach((layer) => {
      const geometry = new THREE.SphereGeometry(
        layer.radius,
        layer.radius <= 10 ? 24 : 16,
        layer.radius <= 10 ? 24 : 16
      );
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(layer.color === color ? color : layer.color),
        transparent: layer.opacity < 1,
        opacity: layer.opacity
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphereGroup.add(sphere); // 添加到 sphereGroup 参与脉动
    });

    // 添加环状装饰
    const ringGeometry = new THREE.RingGeometry(16, 18, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    sphereGroup.add(ring); // 添加到 sphereGroup 参与脉动

    // 添加第二个环
    const ring2Geometry = new THREE.RingGeometry(22, 23, 32);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI / 2;
    sphereGroup.add(ring2); // 添加到 sphereGroup 参与脉动

    // 创建引导线（从站点到标签）- 不参与脉动动画
    const linePoints = [
      new THREE.Vector3(0, 0, 0), // 从站点中心
      new THREE.Vector3(0, 150, 0) // 到标签位置（高度150）
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6
    });
    const guideLine = new THREE.Line(lineGeometry, lineMaterial);
    group.add(guideLine); // 直接添加到 group，不参与脉动

    // Add label as HTML element (will be positioned in animation loop)
    const labelDiv = document.createElement('div');
    labelDiv.className = 'station-label';
    labelDiv.textContent = label;
    labelDiv.style.cssText = `
      position: absolute;
      transform: translate(-50%, -50%);
      pointer-events: none;
      user-select: none;
      background-color: rgba(0, 0, 0, 0.95);
      color: #fff;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 16px;
      white-space: nowrap;
      font-family: Arial, 'Microsoft YaHei', sans-serif;
      font-weight: bold;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(8px);
      text-shadow: 0 0 10px rgba(255, 255, 255, 1);
      z-index: 100;
    `;
    (group as any).userData = { label: labelDiv, guideLine }; // 存储标签和引导线

    stationsRef.current.push(group);
    return group;
  };

  // Create background particles with floating animation
  const createParticles = (): THREE.Points => {
    const count = 500; // 增加粒子数量
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3); // 每个粒子的速度

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4000; // Y轴范围减小
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8000;

      // 随机速度，缓慢漂浮
      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3)); // 存储速度

    const material = new THREE.PointsMaterial({
      size: 4,
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending // 加法混合，让粒子更亮
    });

    return new THREE.Points(geometry, material);
  };

  // Create trains that run along the lines
  const createTrains = (lineData: Array<{ points: THREE.Vector3[]; color: string }>) => {
    const trains: any[] = [];

    lineData.forEach((line, lineIndex) => {
      // 每条线路1-2列车
      const trainCount = 1 + Math.floor(Math.random() * 2);

      for (let i = 0; i < trainCount; i++) {
        // 创建列车组 - 包含车身和方向指示
        const trainGroup = new THREE.Group();

        // 主车身 - 更流线型的设计
        const bodyGeometry = new THREE.BoxGeometry(50, 16, 20);
        const bodyMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(line.color),
          transparent: true,
          opacity: 0.95,
          toneMapped: false
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        trainGroup.add(body);

        // 车顶 - 弧形车顶效果
        const roofGeometry = new THREE.BoxGeometry(48, 6, 18);
        const roofMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(line.color),
          transparent: true,
          opacity: 0.8,
          toneMapped: false
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 11;
        trainGroup.add(roof);

        // 车顶装饰线
        const stripeGeometry = new THREE.BoxGeometry(46, 2, 19);
        const stripeMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          toneMapped: false
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.y = 11;
        trainGroup.add(stripe);

        // 车窗带 - 大面积连续车窗
        const windowBandGeometry = new THREE.BoxGeometry(38, 7, 21);
        const windowBandMaterial = new THREE.MeshBasicMaterial({
          color: 0xe6f0ff,
          transparent: true,
          opacity: 0.7,
          toneMapped: false
        });
        const windowBand = new THREE.Mesh(windowBandGeometry, windowBandMaterial);
        windowBand.position.set(0, 2, 0);
        trainGroup.add(windowBand);

        // 车窗分隔柱
        for (let j = -2; j <= 2; j++) {
          const pillarGeometry = new THREE.BoxGeometry(2, 6, 22);
          const pillarMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.9,
            toneMapped: false
          });
          const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
          pillar.position.set(j * 7, 2, 0);
          trainGroup.add(pillar);
        }

        // 车身装饰线条 - 底部
        const bottomLineGeometry = new THREE.BoxGeometry(49, 2, 21);
        const bottomLineMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(line.color),
          transparent: true,
          opacity: 0.5,
          toneMapped: false
        });
        const bottomLine = new THREE.Mesh(bottomLineGeometry, bottomLineMaterial);
        bottomLine.position.y = -7;
        trainGroup.add(bottomLine);

        // 前照灯 - 三角形聚光灯效果
        const frontLightGroup = new THREE.Group();

        // 主前灯
        const mainLightGeometry = new THREE.SphereGeometry(4, 16, 16);
        const mainLightMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: 1.0,
          toneMapped: false
        });
        const mainLight = new THREE.Mesh(mainLightGeometry, mainLightMaterial);
        mainLight.position.set(25, 0, 0);
        frontLightGroup.add(mainLight);

        // 左右副灯
        const subLightGeometry = new THREE.SphereGeometry(2.5, 12, 12);
        const subLightMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: 0.8,
          toneMapped: false
        });
        const subLight1 = new THREE.Mesh(subLightGeometry, subLightMaterial);
        subLight1.position.set(25, 0, 7);
        frontLightGroup.add(subLight1);

        const subLight2 = new THREE.Mesh(subLightGeometry, subLightMaterial);
        subLight2.position.set(25, 0, -7);
        frontLightGroup.add(subLight2);

        trainGroup.add(frontLightGroup);

        // 尾灯
        const tailLightGroup = new THREE.Group();
        const tailLightMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3333,
          transparent: true,
          opacity: 0.9,
          toneMapped: false
        });

        const tailLight1 = new THREE.Mesh(
          new THREE.SphereGeometry(3, 12, 12),
          tailLightMaterial
        );
        tailLight1.position.set(-25, 0, 6);
        tailLightGroup.add(tailLight1);

        const tailLight2 = new THREE.Mesh(
          new THREE.SphereGeometry(3, 12, 12),
          tailLightMaterial
        );
        tailLight2.position.set(-25, 0, -6);
        tailLightGroup.add(tailLight2);

        trainGroup.add(tailLightGroup);

        // 底部滑板/轮组 - 更详细
        const undercarriageGeometry = new THREE.BoxGeometry(44, 4, 19);
        const undercarriageMaterial = new THREE.MeshBasicMaterial({
          color: 0x2a2a3a,
          transparent: true,
          opacity: 1.0,
          toneMapped: false
        });
        const undercarriage = new THREE.Mesh(undercarriageGeometry, undercarriageMaterial);
        undercarriage.position.y = -10;
        trainGroup.add(undercarriage);

        // 轮子
        for (let j = -1; j <= 1; j++) {
          const wheelGeometry = new THREE.CylinderGeometry(3, 3, 21, 16);
          const wheelMaterial = new THREE.MeshBasicMaterial({
            color: 0x3a3a4a,
            transparent: true,
            opacity: 0.9,
            toneMapped: false
          });
          const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(j * 15, -10, 0);
          trainGroup.add(wheel);
        }

        trainGroup.position.copy(line.points[0]);
        trainGroup.position.y += 14; // 略高于线路

        trains.push({
          mesh: trainGroup,
          points: line.points,
          progress: i / trainCount,
          speed: 0.00008 + Math.random() * 0.00005 // 大幅降低速度
        });
      }
    });

    return trains;
  };

  // Create grid floor
  const createGridFloor = (): THREE.Group => {
    const group = new THREE.Group();

    // 主网格 - 简洁版，没有发光效果
    const gridHelper = new THREE.GridHelper(10000, 100, 0x333333, 0x1a1a1a);
    gridHelper.position.y = -200; // 放在下方
    group.add(gridHelper);

    // 深色平面
    const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000510,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -201;
    group.add(plane);

    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Update counts
    setLineCount(sceneData.lineData.length);
    setStationCount(sceneData.stationData.length);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    scene.fog = new THREE.FogExp2(0x000510, 0.0001);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      1,
      15000
    );
    camera.position.set(0, 2000, 2000); // 从斜上方观看，XZ 平面
    camera.lookAt(0, 0, 0); // 看向中心
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto'; // 确保接收鼠标事件
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.zIndex = '0'; // 在最底层，但仍然接收事件
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 500;
    controls.maxDistance = 8000;
    controls.zoomSpeed = 1;
    controls.panSpeed = 1;
    controls.rotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 用于区分拖拽和点击
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;

    // 添加鼠标事件监听以改变 cursor
    renderer.domElement.addEventListener('mousedown', (event) => {
      mouseDownPos = { x: event.clientX, y: event.clientY };
      isDragging = false;
      renderer.domElement.style.cursor = 'grabbing';
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
      // 检测是否在拖拽（移动距离超过5像素）
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - mouseDownPos.x, 2) +
        Math.pow(event.clientY - mouseDownPos.y, 2)
      );
      if (moveDistance > 5) {
        isDragging = true;
      }
    });

    renderer.domElement.addEventListener('mouseup', () => {
      renderer.domElement.style.cursor = 'grab';
    });

    // 添加鼠标移动事件用于悬停检测
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Post-processing - BLOOM EFFECT
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      3.0,
      0.4,
      0.85
    );

    bloomPass.threshold = 0;
    bloomPass.strength = 2.0; // 柔和光效 - 降低强度
    bloomPass.radius = 0.4; // 柔和光效 - 减小发光半径
    bloomPassRef.current = bloomPass; // 保存引用

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1000, 1000, 2000);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4fc3f7, 0.8, 5000);
    pointLight1.position.set(0, 0, 1500);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6b6b, 0.5, 5000);
    pointLight2.position.set(-1000, -1000, 1500);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x4ecdc4, 0.5, 5000);
    pointLight3.position.set(1000, -1000, 1500);
    scene.add(pointLight3);

    // Add particles
    const particles = createParticles();
    scene.add(particles);
    particlesRef.current = particles;

    // Add grid floor
    const gridFloor = createGridFloor();
    scene.add(gridFloor);

    // Add metro lines - 根据过滤状态显示
    const lineMeshes: THREE.Group[] = [];
    sceneData.lineData.forEach((line) => {
      const lineMesh = createMetroLine(line.points, line.color);
      // 使用更精确的线路编号提取，避免1号线影响11号线
      const isHidden = Array.from(hiddenLines).some(hiddenLineName => {
        // 从hiddenLineName中提取线路编号（如"1号线" -> "1"）
        const hiddenMatch = hiddenLineName.match(/(\d+)号线/);
        if (!hiddenMatch) return false;
        const hiddenNum = hiddenMatch[1];

        // 从line.lineName中提取线路编号（如"1号线/罗宝线" -> "1"）
        const lineMatch = line.lineName.match(/(\d+)号线/);
        if (!lineMatch) return false;
        const lineNum = lineMatch[1];

        // 精确比较线路编号
        return hiddenNum === lineNum;
      });

      if (!isHidden) {
        scene.add(lineMesh);
        lineMeshes.push(lineMesh);
      }
    });

    // 保存线路网格引用，用于动态显示/隐藏
    (scene as any).userData.lineMeshes = lineMeshes;

    // Add trains
    const trains = createTrains(sceneData.lineData);
    trains.forEach(train => scene.add(train.mesh));
    trainsRef.current = trains;

    // Add stations
    const labelsContainer = document.createElement('div');
    labelsContainer.style.position = 'absolute';
    labelsContainer.style.top = '0';
    labelsContainer.style.left = '0';
    labelsContainer.style.width = '100%';
    labelsContainer.style.height = '100%';
    labelsContainer.style.pointerEvents = 'none'; // 标签不阻挡鼠标事件
    labelsContainer.style.overflow = 'hidden';
    labelsContainer.style.zIndex = '10'; // 提高 z-index 确保标签在最上层
    containerRef.current.appendChild(labelsContainer);

    sceneData.stationData.forEach((station) => {
      // 检查车站所属线路是否被隐藏
      const isHidden = Array.from(hiddenLines).some(hiddenLineName => {
        // 从hiddenLineName中提取线路编号（如"1号线" -> "1"）
        const hiddenMatch = hiddenLineName.match(/(\d+)号线/);
        if (!hiddenMatch) return false;
        const hiddenNum = hiddenMatch[1];

        // 从station.lineName中提取线路编号
        const lineMatch = station.lineName.match(/(\d+)号线/);
        if (!lineMatch) return false;
        const lineNum = lineMatch[1];

        // 精确比较线路编号
        return hiddenNum === lineNum;
      });

      const stationMesh = createStation(station.position, station.color, station.label);
      scene.add(stationMesh);

      // 存储完整的站点信息到userData，保留label和guideLine
      const existingUserData = (stationMesh as any).userData;
      (stationMesh as any).userData = {
        ...station,
        label: existingUserData.label,
        guideLine: existingUserData.guideLine
      };

      // 如果线路被隐藏，则隐藏车站
      if (isHidden) {
        stationMesh.visible = false;
        const label = (stationMesh as any).userData.label;
        if (label) {
          label.style.display = 'none';
        }
        const guideLine = (stationMesh as any).userData.guideLine;
        if (guideLine) {
          guideLine.visible = false;
        }
      }

      stationsMeshRef.current.push(stationMesh);

      // Add label to container
      const label = (stationMesh as any).userData.label;
      if (label) {
        labelsContainer.appendChild(label);
      }
    });

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Animate particles - 缓慢漂浮
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
          // 更新位置
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];

          // 边界检测，超出范围则反弹
          if (Math.abs(positions[i * 3]) > 4000) velocities[i * 3] *= -1;
          if (Math.abs(positions[i * 3 + 1]) > 2000) velocities[i * 3 + 1] *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 4000) velocities[i * 3 + 2] *= -1;
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Animate trains - 列车沿线路移动
      trainsRef.current.forEach((train) => {
        const points = train.points;

        // 更新进度
        train.progress = (train.progress + train.speed) % 1;

        // 计算当前位置
        const totalSegments = points.length - 1;
        const currentSegment = Math.floor(train.progress * totalSegments);
        const segmentProgress = (train.progress * totalSegments) % 1;

        const nextSegment = Math.min(currentSegment + 1, totalSegments);
        const p1 = points[currentSegment];
        const p2 = points[nextSegment];

        // 线性插值计算位置
        train.mesh.position.lerpVectors(p1, p2, segmentProgress);
        train.mesh.position.y += 10; // 保持在线路上方

        // 计算列车朝向 - 使列车面向移动方向
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        // BoxGeometry长轴沿X轴，需要计算Y轴旋转角度
        // 使用 atan2 计算在XZ平面上的角度
        const angle = Math.atan2(direction.z, direction.x);
        train.mesh.rotation.y = angle;
      });

      // 根据相机距离动态调整Bloom强度 - 距离越近Bloom越弱
      if (bloomPassRef.current && cameraRef.current && controlsRef.current) {
        const distance = cameraRef.current.position.distanceTo(controlsRef.current.target);
        // 距离范围大约500-4000，将Bloom强度从0.5调整到2.5
        const bloomStrength = Math.max(0.5, Math.min(2.5, distance / 1000));
        bloomPassRef.current.strength = bloomStrength;
      }

      // Raycaster 悬停检测
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;

        // 查找最近的站点或线路
        let targetObject = object;
        while (targetObject.parent && targetObject.parent.type !== 'Scene') {
          if ((targetObject as any).userData && (targetObject as any).userData.label) {
            break;
          }
          targetObject = targetObject.parent;
        }

        if (hoveredObjectRef.current !== targetObject && (targetObject as any).userData?.label) {
          // 恢复之前的对象
          if (hoveredObjectRef.current) {
            const prevGroup = hoveredObjectRef.current as THREE.Group;
            const prevSphereGroup = prevGroup.children.find((child: any) =>
              child.type === 'Group' && child !== prevGroup
            );
            if (prevSphereGroup) {
              prevSphereGroup.scale.setScalar(1);
            }
          }

          // 高亮新对象
          hoveredObjectRef.current = targetObject;
          const sphereGroup = (targetObject as THREE.Group).children.find((child: any) =>
            child.type === 'Group' && child !== targetObject
          );
          if (sphereGroup) {
            sphereGroup.scale.setScalar(1.5); // 放大1.5倍
          }

          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        // 清除高亮
        if (hoveredObjectRef.current) {
          const prevGroup = hoveredObjectRef.current as THREE.Group;
          const prevSphereGroup = prevGroup.children.find((child: any) =>
            child.type === 'Group' && child !== prevGroup
          );
          if (prevSphereGroup) {
            prevSphereGroup.scale.setScalar(1);
          }
          hoveredObjectRef.current = null;
        }
        renderer.domElement.style.cursor = 'grab';
      }

      // Animate stations - pulsing effect（只作用于球体，不影响引导线）
      stationsRef.current.forEach((station) => {
        const stationData = (station as any).userData;
        const isHighlighted = highlightedStation && stationData.fullName === highlightedStation;
        const isHovered = hoveredObjectRef.current === station;

        // 只对 sphereGroup 进行脉动缩放
        const sphereGroup = (station as any).children.find((child: any) =>
          child.type === 'Group' && child !== station
        );

        if (sphereGroup && !isHovered) {
          // 搜索高亮或正常脉动
          if (isHighlighted) {
            sphereGroup.scale.setScalar(2.0); // 搜索高亮更大
          } else {
            const scale = 1 + Math.sin(time * 4) * 0.2;
            sphereGroup.scale.setScalar(scale);
          }
        }

        // Update label position
        if ((station as any).userData.label && containerRef.current) {
          const vector = station.position.clone();
          vector.y += 150; // 标签在站点上方150单位，与引导线对齐
          vector.project(camera);

          const x = (vector.x * 0.5 + 0.5) * containerRef.current.clientWidth;
          const y = (-(vector.y * 0.5) + 0.5) * containerRef.current.clientHeight;

          const label = (station as any).userData.label;
          label.style.left = `${x}px`;
          label.style.top = `${y}px`;

          // 智能渲染 - 根据相机距离和视野动态显示/隐藏
          const distance = camera.position.distanceTo(station.position);
          const showLabelDistance = 1000;

          const guideLine = (station as any).userData.guideLine;

          // 视野外或距离太远则隐藏
          const isInFrustum = vector.z >= -1 && vector.z <= 1 && vector.x >= -1 && vector.x <= 1 && vector.y >= -1 && vector.y <= 1;

          if (vector.z > 1 || distance > showLabelDistance || !isInFrustum) {
            label.style.display = 'none';
            if (guideLine) guideLine.visible = false;
          } else {
            label.style.display = 'block';
            if (guideLine) guideLine.visible = true;
          }
        }
      });

      controls.update();
      composer.render();
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer || !composer) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      composer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 点击事件 - 显示站点详情（只有在非拖拽时才触发）
    const handleClick = () => {
      // 如果是拖拽操作，不触发点击事件
      if (isDragging) return;

      if (hoveredObjectRef.current) {
        const data = (hoveredObjectRef.current as any).userData;
        const stationName = data.label?.textContent || '未知站点';

        // 使用真实的站点数据
        setSelectedStation({
          name: stationName,
          line: data.lineName || '未知线路',
          status: data.status || '正常',
          position: hoveredObjectRef.current.position.clone()
        });
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      // Remove labels
      stationsRef.current.forEach((station) => {
        const label = (station as any).userData.label;
        if (label && label.parentNode) {
          label.parentNode.removeChild(label);
        }
      });

      // Dispose Three.js resources
      renderer.dispose();
      composer.dispose();
    };
  }, [sceneData]);

  // 动态更新线路显示状态 - 响应线路过滤变化
  useEffect(() => {
    if (sceneRef.current && (sceneRef.current as any).userData.lineMeshes) {
      const lineMeshes = (sceneRef.current as any).userData.lineMeshes as THREE.Group[];
      const allLineData = sceneData.lineData;

      lineMeshes.forEach((mesh, index) => {
        if (allLineData[index]) {
          const line = allLineData[index];
          // 使用正则精确提取线路编号，避免1号线影响11号线
          const isHidden = Array.from(hiddenLines).some(hiddenLineName => {
            const hiddenMatch = hiddenLineName.match(/(\d+)号线/);
            if (!hiddenMatch) return false;
            const hiddenNum = hiddenMatch[1];

            const lineMatch = line.lineName.match(/(\d+)号线/);
            if (!lineMatch) return false;
            const lineNum = lineMatch[1];

            return hiddenNum === lineNum;
          });

          mesh.visible = !isHidden;
        }
      });
    }

    // 同时更新车站的显示状态
    if (stationsMeshRef.current) {
      stationsMeshRef.current.forEach((station) => {
        const stationData = (station as any).userData;
        if (stationData.lineId) {
          // 使用正则精确提取线路编号
          const isHidden = Array.from(hiddenLines).some(hiddenLineName => {
            const hiddenMatch = hiddenLineName.match(/(\d+)号线/);
            if (!hiddenMatch) return false;
            const hiddenNum = hiddenMatch[1];

            const lineMatch = stationData.lineName.match(/(\d+)号线/);
            if (!lineMatch) return false;
            const lineNum = lineMatch[1];

            return hiddenNum === lineNum;
          });

          station.visible = !isHidden;
          // 隐藏标签
          const label = stationData.label;
          if (label) {
            label.style.display = isHidden ? 'none' : 'block';
          }
          // 隐藏引导线
          const guideLine = stationData.guideLine;
          if (guideLine) {
            guideLine.visible = !isHidden;
          }
        }
      });
    }
  }, [hiddenLines, sceneData]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor: '#000510',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Top Title Bar */}
      <div
        className="absolute top-0 left-0 right-0 px-6 py-4 z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(0,5,16,0.98) 0%, rgba(0,5,16,0.7) 100%)',
          pointerEvents: 'none' // 允许鼠标事件穿透到 Canvas
        }}
      >
        <h1 className="text-white text-xl font-bold tracking-wide">
          <span
            style={{
              color: '#00ff88',
              textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88',
              fontSize: '24px'
            }}
          >
            ●
          </span>
          {' 城市轨道交通线网全景驾驶舱 '}
          <span
            style={{
              color: '#ffd700',
              textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700',
              fontSize: '24px'
            }}
          >
            ●
          </span>
        </h1>
      </div>

      {/* Left Top Stats */}
      <div className="absolute top-20 left-4 z-10" style={{ pointerEvents: 'none' }}>
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '2px solid rgba(0, 255, 136, 0.5)',
            boxShadow:
              '0 0 30px rgba(0, 255, 136, 0.3), 0 0 60px rgba(0, 255, 136, 0.2)'
          }}
        >
          <div
            className="text-white font-bold text-base mb-3"
            style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.8)' }}
          >
            📊 线网统计
          </div>
          <div className="text-sm space-y-2">
            <div className="text-white/90 flex items-center">
              <span
                style={{ color: '#00ff88', textShadow: '0 0 15px #00ff88', marginRight: '8px' }}
              >
                ●
              </span>
              线路:
              <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>{lineCount}</span>
              条
            </div>
            <div className="text-white/90 flex items-center">
              <span
                style={{ color: '#ffd700', textShadow: '0 0 15px #ffd700', marginRight: '8px' }}
              >
                ●
              </span>
              站点:
              <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>{stationCount}</span>
              个
            </div>
          </div>
        </div>
      </div>

      {/* Right Control Panel - 线路过滤和搜索 */}
      <div className="absolute top-20 right-4 z-20" style={{ pointerEvents: 'auto' }}>
        {/* 折叠按钮 */}
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          style={{
            position: 'absolute',
            left: '-40px',
            top: '0',
            width: '36px',
            height: '36px',
            borderRadius: '8px 0 0 8px',
            backgroundColor: 'rgba(0, 255, 136, 0.8)',
            border: '2px solid rgba(0, 255, 136, 0.5)',
            borderRight: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          {isPanelCollapsed ? '◀' : '▶'}
        </button>

        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
            borderRadius: '10px',
            border: '2px solid rgba(0, 255, 136, 0.5)',
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
            width: isPanelCollapsed ? '0' : '280px',
            overflow: 'hidden',
            opacity: isPanelCollapsed ? 0 : 1,
            transition: 'all 0.3s ease'
          }}
        >
            {/* 搜索框 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 搜索站点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {/* 搜索建议列表 */}
              {searchQuery && sceneData.stationData.filter(s =>
                s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 && (
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginTop: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {sceneData.stationData
                    .filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((station, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(station.fullName);
                          setHighlightedStation(station.fullName);

                          // 移动相机到搜索的站点
                          if (controlsRef.current && cameraRef.current) {
                            const targetStation = stationsMeshRef.current.find(s =>
                              (s as any).userData.fullName === station.fullName
                            );
                            if (targetStation) {
                              // 平滑移动相机
                              const targetPos = targetStation.position.clone();
                              controlsRef.current.target.copy(targetPos);
                              const cameraPos = targetPos.clone().add(new THREE.Vector3(0, 800, 800));
                              cameraRef.current.position.copy(cameraPos);
                            }
                          }
                        }}
                        style={{
                          padding: '8px 12px',
                          color: '#fff',
                          cursor: 'pointer',
                          borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{station.fullName}</div>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>{station.lineName}</div>
                      </div>
                    ))}
                </div>
              )}

            {/* 线路过滤 */}
            <div className="text-white text-sm font-bold mb-2">线路过滤</div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {sceneData.lineData.map((line) => {
                // 提取线路编号（如"1号线/罗宝线" -> "1号线"）
                const lineShortName = line.lineName.split('/')[0];
                // 检查是否被隐藏 - 使用正则精确匹配
                const isChecked = !Array.from(hiddenLines).some(hiddenLineName => {
                  const hiddenMatch = hiddenLineName.match(/(\d+)号线/);
                  if (!hiddenMatch) return false;
                  const hiddenNum = hiddenMatch[1];

                  const lineMatch = line.lineName.match(/(\d+)号线/);
                  if (!lineMatch) return false;
                  const lineNum = lineMatch[1];

                  return hiddenNum === lineNum;
                });

                return (
                  <div key={line.lineId} className="flex items-center mb-2 text-white/80 text-sm">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const newHidden = new Set(hiddenLines);
                        if (isChecked) {
                          newHidden.add(lineShortName);
                        } else {
                          newHidden.delete(lineShortName);
                        }
                        setHiddenLines(newHidden);
                      }}
                      className="mr-2"
                    />
                    <span>{line.lineName}</span>
                  </div>
                );
              })}
            </div>

            {/* 实时统计 */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-white text-sm font-bold mb-2">📊 实时统计</div>
              <div className="space-y-1 text-xs text-white/70">
                <div>🚇 运行列车: <span className="text-green-400 font-bold">47</span> / 50</div>
                <div>📦 AGV总数: <span className="text-yellow-400 font-bold">1,234</span></div>
                <div>⚡ 今日运量: <span className="text-blue-400 font-bold">8.5万吨</span></div>
                <div>⚠️ 繁忙站点: <span className="text-red-400 font-bold">12</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 站点详情弹窗 */}
      {selectedStation && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid rgba(0, 255, 136, 0.6)',
              boxShadow: '0 0 50px rgba(0, 255, 136, 0.5)',
              minWidth: '300px',
              pointerEvents: 'auto'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">{selectedStation.name}</h2>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-white/80">
              <div>📍 所属线路: <span className="text-green-400">{selectedStation.line}</span></div>
              <div>📊 当前状态: <span className="text-yellow-400">{selectedStation.status}</span></div>
              <div>🚃 到达列车: <span className="text-blue-400">3</span></div>
              <div>📦 AGV数量: <span className="text-purple-400">28</span></div>
              <div>⏱️ 下一班: <span className="text-orange-400">2分钟</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Right Bottom Controls Hint */}
      <div className="absolute bottom-6 right-6 z-10" style={{ pointerEvents: 'none' }}>
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '12px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
          }}
        >
          <div
            className="text-white/90 text-sm"
            style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }}
          >
            🖱️ 拖拽平移 | 🔄 滚轮缩放 | ✨ 旋转查看
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metro3DView;
