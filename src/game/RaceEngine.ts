import * as THREE from 'three';

export type RaceEngineCallbacks = {
  onSpeed: (kmh: number) => void;
  onGate: (gateIndex: number) => void;
  onLane: (laneIndex: number) => void;
};

type CarRig = {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  steerPivots: THREE.Group[];
  body: THREE.Group;
};

type GateRig = {
  group: THREE.Group;
  board: THREE.Mesh;
  glow: THREE.Mesh;
  frameMaterial: THREE.MeshStandardMaterial;
  letter: string;
  flashMaterial: THREE.MeshBasicMaterial;
};

const START_Z = 18;
// From the start grid this is about 180 world units away: roughly 20 seconds
// at the 90 km/h auto-cruise speed, while gas and turbo can shorten the run.
const GATE_Z = -162;
const LANE_X = [-12, -4, 4, 12];
const LANE_HALF = 3.8;
const MAX_SPEED = 32;
const ACCEL = 17;
const BRAKE = 30;
const DRAG = 5.5;
// Auto-drive: the race never turns into a stationary quiz screen.
// Releasing throttle settles into a cruise; braking still leaves rolling speed.
const CRUISE_SPEED = 9;
const MIN_ROLLING_SPEED = 3.2;
const AUTO_ACCEL = 7;
const LANE_CHANGE_TIME = 0.3;
const GATE_COLORS = ['#ef4444', '#3b82f6', '#f2b63a', '#22c55e'];
const LETTERS = ['A', 'B', 'C', 'D'];

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#34383d';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const x = rand(i + 1) * 512;
    const y = rand(i + 17) * 512;
    const v = Math.floor(rand(i + 40) * 55);
    ctx.fillStyle = `rgba(${v + 30},${v + 33},${v + 36},0.5)`;
    ctx.fillRect(x, y, 2, 2);
  }
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(20,22,25,0.12)';
    ctx.beginPath();
    ctx.ellipse(rand(i + 3) * 512, rand(i + 8) * 512, rand(i + 12) * 80 + 20, 8 + rand(i + 4) * 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 44);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeGrassTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#4b7c49';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const g = Math.floor(rand(i) * 60);
    ctx.fillStyle = `rgba(${40 + g},${100 + g},${55 + g * 0.6},0.75)`;
    ctx.fillRect(rand(i + 3) * 256, rand(i + 7) * 256, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(30, 70);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCrowdTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1b2637';
  ctx.fillRect(0, 0, 512, 256);
  const palette = ['#f8c8c8', '#e63946', '#f1c40f', '#3498db', '#ecf0f1', '#9ad0c2', '#ff9f68', '#c084fc'];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 60; col++) {
      if (rand(row * 77 + col * 13) < 0.48) continue;
      const x = col * 9 + 3 + rand(row + col) * 3;
      const y = row * 19 + 7;
      ctx.fillStyle = palette[Math.floor(rand(row * 3 + col * 7) * palette.length)];
      ctx.beginPath();
      ctx.arc(x, y, 3.2 + rand(col + row) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

function makeFlagTexture(text: string, accent = '#e11d2e') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a1729';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 1024, 20);
  ctx.fillRect(0, 236, 1024, 20);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 26;
  for (let i = -256; i < 1280; i += 88) {
    ctx.beginPath();
    ctx.moveTo(i, 256);
    ctx.lineTo(i + 150, 0);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 102px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 512, 134);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeBoardTexture(letter: string, text: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 720;
  c.height = 680;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#08172b';
  ctx.fillRect(0, 0, 720, 680);
  const grad = ctx.createLinearGradient(0, 0, 720, 680);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 680);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 720, 118);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 105, 720, 13);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(67, 59, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = '900 58px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 67, 62);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '800 38px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(`GERBANG ${letter}`, 128, 55);
  ctx.font = '600 22px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText('LEWATI GERBANG INI', 129, 90);

  const maxTextWidth = 610;
  let fontSize = 52;
  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;
  let lines = wrapLines(ctx, text, maxTextWidth);
  while (lines.length > 7 && fontSize > 30) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;
    lines = wrapLines(ctx, text, maxTextWidth);
  }
  const lineHeight = fontSize * 1.32;
  const total = lines.length * lineHeight;
  let y = 118 + (562 - total) / 2 + fontSize * 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  for (const line of lines) {
    ctx.fillText(line, 360, y);
    y += lineHeight;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 704, 664);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildCar(bodyColor: string, accentColor: string): CarRig {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paint = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.55, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: '#14191f', metalness: 0.5, roughness: 0.5 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#242b34', metalness: 0.6, roughness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.35, roughness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: '#f4f6f8', metalness: 0.2, roughness: 0.4 });
  const tyre = new THREE.MeshStandardMaterial({ color: '#121417', roughness: 0.92 });
  const rim = new THREE.MeshStandardMaterial({ color: '#c9b27a', metalness: 0.9, roughness: 0.25 });

  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    body.add(mesh);
    return mesh;
  };

  // floor / chassis
  addBox(1.7, 0.24, 3.5, 0, 0.52, 0.1, carbon);
  // main body
  addBox(1.02, 0.5, 2.05, 0, 0.8, 0.12, paint);
  // nose cone
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.42, 1.5, 12), paint);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.74, -1.62);
  nose.castShadow = true;
  body.add(nose);
  // nose tip
  addBox(0.68, 0.1, 0.45, 0, 0.6, -2.34, white);
  // side pods
  addBox(0.44, 0.38, 1.35, -0.74, 0.7, 0.22, paint);
  addBox(0.44, 0.38, 1.35, 0.74, 0.7, 0.22, paint);
  addBox(0.16, 0.2, 1.0, -0.99, 0.67, 0.25, accent);
  addBox(0.16, 0.2, 1.0, 0.99, 0.67, 0.25, accent);
  // engine cover
  addBox(0.58, 0.42, 1.15, 0, 1.0, 0.85, paint);
  addBox(0.3, 0.26, 0.55, 0, 1.16, 0.42, dark);
  const fin = addBox(0.08, 0.4, 0.8, 0, 1.18, 1.24, white);
  fin.rotation.x = -0.16;
  // cockpit + halo
  addBox(0.6, 0.22, 0.72, 0, 1.02, -0.28, dark);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), accent);
  helmet.position.set(0, 1.18, -0.16);
  helmet.castShadow = true;
  body.add(helmet);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 22), dark);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 1.27, -0.13);
  body.add(halo);
  const haloBar = addBox(0.07, 0.07, 0.6, 0, 1.28, -0.44, dark);
  haloBar.rotation.x = 0.15;
  // front wing
  addBox(2.0, 0.07, 0.55, 0, 0.44, -2.3, carbon);
  addBox(0.12, 0.26, 0.62, -1.0, 0.55, -2.3, paint);
  addBox(0.12, 0.26, 0.62, 1.0, 0.55, -2.3, paint);
  addBox(1.5, 0.05, 0.24, 0, 0.37, -2.6, white);
  // rear wing
  addBox(1.85, 0.09, 0.4, 0, 1.36, 1.62, paint);
  addBox(0.1, 0.4, 0.46, -0.92, 1.3, 1.62, white);
  addBox(0.1, 0.4, 0.46, 0.92, 1.3, 1.62, white);
  addBox(0.09, 0.65, 0.12, 0, 1.02, 1.62, carbon);
  addBox(1.6, 0.05, 0.3, 0, 1.16, 1.5, carbon);
  // diffuser + lights
  addBox(1.35, 0.22, 0.38, 0, 0.48, 1.72, carbon);
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.13, 0.05),
    new THREE.MeshBasicMaterial({ color: '#ff2d2d' }),
  );
  tail.position.set(0, 0.72, 1.83);
  body.add(tail);
  // number decals / stripes
  addBox(0.2, 0.02, 1.4, 0, 1.04, -0.7, white);
  addBox(0.02, 0.2, 0.9, -0.52, 0.8, 0.1, white);
  addBox(0.02, 0.2, 0.9, 0.52, 0.8, 0.1, white);

  const wheels: THREE.Mesh[] = [];
  const steerPivots: THREE.Group[] = [];
  const makeWheel = (x: number, z: number, front: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.46, z);
    const tyreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.4, 20), tyre);
    tyreMesh.geometry.rotateZ(Math.PI / 2);
    tyreMesh.castShadow = true;
    pivot.add(tyreMesh);
    const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.43, 14), rim);
    rimMesh.geometry.rotateZ(Math.PI / 2);
    pivot.add(rimMesh);
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.3), accent);
    pivot.add(hub);
    wheels.push(tyreMesh);
    if (front) steerPivots.push(pivot);
    group.add(pivot);
  };
  makeWheel(-1.02, -1.35, true);
  makeWheel(1.02, -1.35, true);
  makeWheel(-1.02, 1.38, false);
  makeWheel(1.02, 1.38, false);

  group.scale.setScalar(1);
  return { group, wheels, steerPivots, body };
}

export class RaceEngine {
  private container: HTMLElement;
  private callbacks: RaceEngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private player: CarRig;
  private playerShadow: THREE.Mesh;
  private rivals: { rig: CarRig; baseRankOffset: number; lane: number; noise: number; targetX: number }[] = [];
  private gates: GateRig[] = [];
  private smoke: { sprite: THREE.Sprite; life: number; maxLife: number; vel: THREE.Vector3; spawnOffset: THREE.Vector3 }[] = [];
  private smokePoolIndex = 0;
  private flames: THREE.Sprite[] = [];
  private flags: { mesh: THREE.Mesh; phase: number }[] = [];
  private startLights: THREE.Mesh[] = [];
  private startLightIndex = 0;
  private sunSprite: THREE.Sprite | null = null;

  private input = { up: false, down: false, left: false, right: false };
  private laneTarget = 2;
  private laneFrom = 2;
  private laneTimer = 0;
  private steerRepeat = 0;
  private speed = 0;
  private playerZ = START_Z;
  private prevZ = START_Z;
  private lateralVelocity = 0;
  private carX = LANE_X[2];
  private frozen = true;
  private answered = false;
  private turboTimer = 0;
  private turboVisual = false;
  private shake = 0;
  private currentRank = 2;
  private rankAnim = 2;
  private lastSpeedCb = 0;
  private lastLaneCb = 2;
  private wheelSpin = 0;
  private smokeCooldown = 0;
  private boardTextures: THREE.Texture[] = [];
  private highlightIndex = -1;

  constructor(container: HTMLElement, callbacks: RaceEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    const isMobile = window.matchMedia('(max-width: 820px)').matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#b9dceb', 150, 420);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
    this.camera.position.set(0, 4.0, 20);

    this.buildSky();
    this.buildLights();
    this.buildGroundAndTrack();
    this.buildScenery();

    this.player = buildCar('#db1f2f', '#f2c14e');
    this.player.group.position.set(this.carX, 0, this.playerZ);
    this.player.group.rotation.y = 0;
    this.scene.add(this.player.group);
    this.playerShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 5.2),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }),
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.set(this.carX, 0.018, this.playerZ);
    this.scene.add(this.playerShadow);

    const rivalSpecs = [
      { color: '#2f6fed', accent: '#ffffff', lane: 0 },
      { color: '#f1c232', accent: '#14181f', lane: 1 },
      { color: '#8b5cf6', accent: '#f0e6ff', lane: 3 },
    ];
    this.rivals = rivalSpecs.map((spec, i) => {
      const rig = buildCar(spec.color, spec.accent);
      const lane = spec.lane;
      rig.group.position.set(LANE_X[lane], 0, START_Z + 5 + i * 3);
      this.scene.add(rig.group);
      return { rig, baseRankOffset: i, lane, noise: i * 2.2 + 1, targetX: LANE_X[lane] };
    });

    this.buildGates();
    this.buildSmoke();
    this.buildFlames();
    this.setRank(2);
    this.resize();
    window.addEventListener('resize', this.resize);
    this.clock.start();
    this.animate();
  }

  private buildSky() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1f639f');
    g.addColorStop(0.42, '#74b9e0');
    g.addColorStop(0.72, '#cbe8f2');
    g.addColorStop(1, '#f4ead6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = tex;

    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 256;
    sunCanvas.height = 256;
    const sctx = sunCanvas.getContext('2d')!;
    const sg = sctx.createRadialGradient(128, 128, 4, 128, 128, 120);
    sg.addColorStop(0, 'rgba(255,250,220,1)');
    sg.addColorStop(0.24, 'rgba(255,240,180,0.85)');
    sg.addColorStop(1, 'rgba(255,235,170,0)');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 256, 256);
    const sunTex = new THREE.CanvasTexture(sunCanvas);
    sunTex.colorSpace = THREE.SRGBColorSpace;
    const sunMat = new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false });
    this.sunSprite = new THREE.Sprite(sunMat);
    this.sunSprite.scale.set(90, 90, 1);
    this.sunSprite.position.set(100, 120, -350);
    this.scene.add(this.sunSprite);

    const cloudMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, fog: false });
    for (let i = 0; i < 9; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(7 + rand(i + j * 3) * 5, 10, 8), cloudMat);
        puff.position.set(j * 8 - 12, rand(i + j) * 2, 0);
        puff.scale.y = 0.44;
        cloud.add(puff);
      }
      cloud.position.set(-160 + rand(i) * 320, 46 + rand(i + 6) * 34, -170 - rand(i + 2) * 130);
      this.scene.add(cloud);
    }
  }

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight('#cfe9ff', '#4b5b45', 1.55));
    const ambient = new THREE.AmbientLight('#ffffff', 0.35);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight('#fff1d0', 2.35);
    sun.position.set(36, 58, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
  }

  private buildGroundAndTrack() {
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(760, 760),
      new THREE.MeshStandardMaterial({ map: makeGrassTexture(), roughness: 1 }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.08, -160);
    this.scene.add(grass);

    const asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(33, 470),
      new THREE.MeshStandardMaterial({ map: makeAsphaltTexture(), roughness: 0.86, metalness: 0.05 }),
    );
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.set(0, 0, -170);
    asphalt.receiveShadow = true;
    this.scene.add(asphalt);

    const lineMat = new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.5 });
    const edgeGeo = new THREE.BoxGeometry(0.3, 0.03, 470);
    [-15.6, 15.6].forEach((x) => {
      const line = new THREE.Mesh(edgeGeo, lineMat);
      line.position.set(x, 0.02, -170);
      this.scene.add(line);
    });

    // dashed lane separators (instanced)
    const dashGeo = new THREE.BoxGeometry(0.16, 0.03, 2.2);
    const dashMat = new THREE.MeshStandardMaterial({ color: '#e7eef5', roughness: 0.6, transparent: true, opacity: 0.55 });
    const dashCount = Math.ceil((40 + 380) / 6.5);
    const dashMesh = new THREE.InstancedMesh(dashGeo, dashMat, dashCount * 3);
    const matrix = new THREE.Matrix4();
    let di = 0;
    [-8, 0, 8].forEach((x) => {
      for (let z = 40; z > -380; z -= 6.5) {
        matrix.makeTranslation(x, 0.022, z);
        dashMesh.setMatrixAt(di++, matrix);
      }
    });
    dashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(dashMesh);

    // kerbs (instanced, alternating red/white)
    const kerbGeo = new THREE.BoxGeometry(1.35, 0.14, 1.8);
    const redMat = new THREE.MeshStandardMaterial({ color: '#d92b35', roughness: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.6 });
    const kerbRed = new THREE.InstancedMesh(kerbGeo, redMat, 220);
    const kerbWhite = new THREE.InstancedMesh(kerbGeo, whiteMat, 220);
    let redI = 0;
    let whiteI = 0;
    let idx = 0;
    for (let z = 48; z > -390; z -= 2) {
      [-16.8, 16.8].forEach((x) => {
        matrix.makeTranslation(x, 0.07, z);
        if (idx % 2 === 0) kerbRed.setMatrixAt(redI++, matrix);
        else kerbWhite.setMatrixAt(whiteI++, matrix);
      });
      idx++;
    }
    kerbRed.count = redI;
    kerbWhite.count = whiteI;
    kerbRed.instanceMatrix.needsUpdate = true;
    kerbWhite.instanceMatrix.needsUpdate = true;
    this.scene.add(kerbRed, kerbWhite);

    // safety barriers with banners (instanced)
    const barrierMat = new THREE.MeshStandardMaterial({ color: '#dde3e9', metalness: 0.25, roughness: 0.6 });
    const barrierRed = new THREE.MeshStandardMaterial({ color: '#c51f2c', metalness: 0.2, roughness: 0.55 });
    const barrierGeo = new THREE.BoxGeometry(0.35, 1.25, 4.2);
    const barrierCount = Math.ceil((44 + 380) / 4.4) + 1;
    const barrierLightMesh = new THREE.InstancedMesh(barrierGeo, barrierMat, barrierCount * 2);
    const barrierRedMesh = new THREE.InstancedMesh(barrierGeo, barrierRed, barrierCount * 2);
    let bl = 0;
    let br = 0;
    for (let z = 44; z > -380; z -= 4.4) {
      [-18.3, 18.3].forEach((x) => {
        matrix.makeTranslation(x, 0.65, z);
        if (Math.round(z / 4.4) % 2 === 0) barrierLightMesh.setMatrixAt(bl++, matrix);
        else barrierRedMesh.setMatrixAt(br++, matrix);
      });
    }
    barrierLightMesh.count = bl;
    barrierRedMesh.count = br;
    barrierLightMesh.instanceMatrix.needsUpdate = true;
    barrierRedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(barrierLightMesh, barrierRedMesh);

    // checkered start + finish strips
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 512;
    checkerCanvas.height = 128;
    const cctx = checkerCanvas.getContext('2d')!;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 16; x++) {
        cctx.fillStyle = (x + y) % 2 === 0 ? '#f7f8fa' : '#141922';
        cctx.fillRect(x * 32, y * 32, 32, 32);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    checkerTex.colorSpace = THREE.SRGBColorSpace;
    const stripMat = new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.7 });
    [15, -68].forEach((z) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(33, 3.2), stripMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(0, 0.035, z);
      this.scene.add(strip);
    });
  }

  private buildScenery() {
    const crowdTex = makeCrowdTexture();
    const concrete = new THREE.MeshStandardMaterial({ color: '#dfe5ea', roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: '#2b3c50', roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#f3f5f7', metalness: 0.35, roughness: 0.35 });
    const crowdMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 0.9 });

    const addStand = (side: number) => {
      const stand = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(16, 3.4, 190), concrete);
      base.position.set(side * 33, 1.7, -65);
      base.receiveShadow = true;
      stand.add(base);
      for (let tier = 0; tier < 5; tier++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 190), tier % 2 ? concrete : dark);
        step.position.set(side * (27 + tier * 3), 3.4 + tier * 1.4, -65);
        stand.add(step);
        const crowd = new THREE.Mesh(new THREE.PlaneGeometry(190, 1.5), crowdMat);
        crowd.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        crowd.position.set(side * (25.4 + tier * 3), 3.6 + tier * 1.4, -65);
        stand.add(crowd);
      }
      Array.from({ length: 9 }).forEach((_, i) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 16, 8), dark);
        col.position.set(side * 43, 8, 10 - i * 22);
        stand.add(col);
      });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(21, 0.55, 194), roofMat);
      roof.position.set(side * 34, 16.2, -65);
      roof.rotation.z = side > 0 ? -0.07 : 0.07;
      stand.add(roof);
      this.scene.add(stand);
    };
    addStand(-1);
    addStand(1);

    // palms
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#7b5b3d', roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#2f7a52', roughness: 0.85 });
    for (let i = 0; i < 22; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 7, 6), trunkMat);
      trunk.position.y = 3.5;
      palm.add(trunk);
      for (let l = 0; l < 6; l++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.5, 5), leafMat);
        leaf.position.y = 7 + rand(i + l) * 0.6;
        leaf.rotation.z = Math.PI / 2.8;
        leaf.rotation.y = (l / 6) * Math.PI * 2;
        palm.add(leaf);
      }
      palm.position.set(side * (23 + rand(i) * 7), 0, 30 - i * 18);
      this.scene.add(palm);
    }

    // distant hills
    const hillMat = new THREE.MeshStandardMaterial({ color: '#6f9891', roughness: 1 });
    for (let i = 0; i < 9; i++) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(50 + rand(i) * 40, 45 + rand(i + 5) * 35, 5), hillMat);
      hill.position.set(-280 + i * 70, 0, -390 - rand(i) * 40);
      this.scene.add(hill);
    }

    // big themed billboards
    const boards: { text: string; x: number; z: number; side: number }[] = [
      { text: 'BUKAN SEKADAR BALAPAN', x: -24.5, z: -58, side: 1 },
      { text: 'TETAPI BALAPAN PENGETAHUAN', x: 24.5, z: -92, side: -1 },
      { text: 'JEJAK SANG PAHLAWAN', x: -24.5, z: -140, side: 1 },
    ];
    boards.forEach((b) => {
      const tex = makeFlagTexture(b.text, '#f2b63a');
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 3.25),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
      );
      board.position.set(b.x, 5.8, b.z);
      board.rotation.y = b.side > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(board);
      const postMat = new THREE.MeshStandardMaterial({ color: '#334155' });
      [-5, 5].forEach((off) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.4, 6), postMat);
        post.position.set(b.x, 2.7, b.z + off);
        this.scene.add(post);
      });
    });

    // start gantry with lights
    const gantryMat = new THREE.MeshStandardMaterial({ color: '#e9edf2', metalness: 0.45, roughness: 0.35 });
    const postGeo = new THREE.BoxGeometry(0.6, 12.4, 0.6);
    [-17.4, 17.4].forEach((x) => {
      const post = new THREE.Mesh(postGeo, gantryMat);
      post.position.set(x, 6.2, 40);
      post.castShadow = true;
      this.scene.add(post);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(35.6, 1.4, 1.1), gantryMat);
    beam.position.set(0, 12.1, 40);
    this.scene.add(beam);
    const bannerTex = makeFlagTexture('JEJAK SANG PAHLAWAN', '#e11d2e');
    const checkerBand = new THREE.Mesh(
      new THREE.PlaneGeometry(35.4, 0.42),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture((() => {
        const cc = document.createElement('canvas');
        cc.width = 512;
        cc.height = 32;
        const cx = cc.getContext('2d')!;
        for (let x = 0; x < 32; x++) {
          cx.fillStyle = x % 2 ? '#f8fafc' : '#101a26';
          cx.fillRect(x * 16, 0, 16, 32);
        }
        const t = new THREE.CanvasTexture(cc);
        t.colorSpace = THREE.SRGBColorSpace;
        return cc;
      })()) }),
    );
    checkerBand.position.set(0, 11.36, 40.4);
    this.scene.add(checkerBand);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.8), new THREE.MeshBasicMaterial({ map: bannerTex }));
    banner.position.set(0, 10.6, 40.4);
    this.scene.add(banner);
    for (let i = 0; i < 5; i++) {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 14, 10),
        new THREE.MeshStandardMaterial({ color: '#3a1418', emissive: '#ff2233', emissiveIntensity: 0.25 }),
      );
      light.position.set(-2 + i, 11.05, 40.55);
      this.scene.add(light);
      this.startLights.push(light);
    }

    // floating flags on poles
    const poleMat = new THREE.MeshStandardMaterial({ color: '#d7dde4', metalness: 0.4, roughness: 0.4 });
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6, 6), poleMat);
      pole.position.set(side * 15.9, 3, 22 - i * 24);
      this.scene.add(pole);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.2, 8, 4),
        new THREE.MeshStandardMaterial({
          color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#ffffff' : '#0f3f8c',
          side: THREE.DoubleSide,
          roughness: 0.7,
        }),
      );
      flag.position.set(side * (15.9 - side * 0.95), 5.3, 22 - i * 24);
      this.scene.add(flag);
      this.flags.push({ mesh: flag, phase: i * 0.6 });
    }

    // distant ferris wheel for a festival feel
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#e5e9ee', metalness: 0.4, roughness: 0.4 });
    const wheel = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 0.6, 8, 40), wheelMat);
    wheel.add(ring);
    for (let i = 0; i < 10; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.22, 28, 0.22), wheelMat);
      spoke.rotation.z = (i / 10) * Math.PI;
      wheel.add(spoke);
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.6, 1.6),
        new THREE.MeshStandardMaterial({ color: i % 2 ? '#e11d2e' : '#f2b63a' }),
      );
      cab.position.set(Math.cos((i / 10) * Math.PI * 2) * 15, Math.sin((i / 10) * Math.PI * 2) * 15, 0);
      wheel.add(cab);
    }
    wheel.position.set(58, 19, -118);
    this.scene.add(wheel);
  }

  private buildGates() {
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      group.position.set(LANE_X[i], 0, GATE_Z);
      const color = GATE_COLORS[i];
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: '#16233a',
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.16,
      });
      const pillarGeo = new THREE.BoxGeometry(0.5, 11.2, 0.65);
      [-LANE_HALF, LANE_HALF].forEach((x) => {
        const pillar = new THREE.Mesh(pillarGeo, frameMaterial);
        pillar.position.set(x, 5.6, 0);
        pillar.castShadow = true;
        group.add(pillar);
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 10.2, 0.14),
          new THREE.MeshBasicMaterial({ color }),
        );
        strip.position.set(x + (x < 0 ? 0.27 : -0.27), 5.6, 0.36);
        group.add(strip);
      });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(LANE_HALF * 2 + 0.5, 0.55, 0.75), frameMaterial);
      beam.position.set(0, 11.2, 0);
      group.add(beam);
      const topStrip = new THREE.Mesh(
        new THREE.BoxGeometry(LANE_HALF * 2, 0.17, 0.74),
        new THREE.MeshBasicMaterial({ color }),
      );
      topStrip.position.set(0, 10.8, 0.02);
      group.add(topStrip);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(LANE_HALF * 2 + 1.6, 11),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      glow.position.set(0, 5.8, -0.4);
      group.add(glow);

      const boardGeo = new THREE.PlaneGeometry(7.3, 7.0);
      const board = new THREE.Mesh(
        boardGeo,
        new THREE.MeshBasicMaterial({ map: null, side: THREE.DoubleSide, toneMapped: false }),
      );
      board.position.set(0, 6.35, 0.42);
      group.add(board);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 7.2, 0.18),
        new THREE.MeshStandardMaterial({ color: '#0c1728', metalness: 0.4, roughness: 0.5 }),
      );
      back.position.set(0, 6.35, 0.32);
      group.add(back);

      const flashMaterial = new THREE.MeshBasicMaterial({
        color: '#22c55e',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const flash = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 11.6), flashMaterial);
      flash.position.set(0, 5.8, -0.1);
      group.add(flash);

      this.gates.push({ group, board, glow, frameMaterial, letter: LETTERS[i], flashMaterial });
      this.scene.add(group);
    }
  }

  private buildSmoke() {
    const tex = makeParticleTexture();
    for (let i = 0; i < 22; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        color: '#e7edf2',
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.scene.add(sprite);
      this.smoke.push({
        sprite,
        life: 0,
        maxLife: 1,
        vel: new THREE.Vector3(),
        spawnOffset: new THREE.Vector3(),
      });
    }
  }

  private buildFlames() {
    const tex = makeParticleTexture();
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: i % 2 === 0 ? '#ffb347' : '#ff5b2e',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const flame = new THREE.Sprite(mat);
      flame.scale.set(1.1, 0.8, 1);
      flame.position.set(i % 2 === 0 ? -0.3 : 0.3, 0.6, 1.95);
      this.player.group.add(flame);
      this.flames.push(flame);
    }
  }

  private updateBoards(options: string[]) {
    const nextTextures: THREE.Texture[] = [];
    this.gates.forEach((gate, i) => {
      const tex = makeBoardTexture(LETTERS[i], options[i] ?? '', GATE_COLORS[i]);
      const mat = gate.board.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.map = tex;
      mat.needsUpdate = true;
      nextTextures.push(tex);
    });
    this.boardTextures = nextTextures;
  }

  setQuestion(options: string[]) {
    this.updateBoards(options);
  }

  setRank(rank: number) {
    this.currentRank = Math.max(1, Math.min(4, rank));
  }

  setControl(control: 'up' | 'down' | 'left' | 'right', pressed: boolean) {
    const was = this.input[control];
    this.input[control] = pressed;
    if (pressed && !was) {
      if (control === 'left') this.shiftLane(-1);
      if (control === 'right') this.shiftLane(1);
      if (control === 'left' || control === 'right') this.steerRepeat = 0.25;
    }
  }

  /** Instantly target a specific lane (used by the mobile quick lane switcher). */
  setLane(index: number) {
    if (this.frozen || this.answered) return;
    const target = Math.max(0, Math.min(3, Math.floor(index)));
    if (target === this.laneTarget) return;
    this.laneFrom = this.laneTarget;
    this.laneTarget = target;
    this.laneTimer = 0;
    this.steerRepeat = 0.3;
    if (target !== this.lastLaneCb) {
      this.lastLaneCb = target;
      this.callbacks.onLane(target);
    }
  }

  private shiftLane(direction: number) {
    if (this.frozen || this.answered) return;
    const target = Math.max(0, Math.min(3, this.laneTarget + direction));
    if (target === this.laneTarget) return;
    this.laneFrom = this.laneTarget;
    this.laneTarget = target;
    this.laneTimer = 0;
    if (this.laneTarget !== this.lastLaneCb) {
      this.lastLaneCb = this.laneTarget;
      this.callbacks.onLane(this.laneTarget);
    }
  }

  setFrozen(frozen: boolean) {
    this.frozen = frozen;
    // Launch from the grid automatically; resuming a pause preserves rolling speed.
    if (!frozen && this.speed === 0) this.speed = CRUISE_SPEED;
  }

  setTurbo(on: boolean) {
    this.turboVisual = on;
    if (on) {
      this.turboTimer = 1.8;
      this.speed = Math.min(MAX_SPEED, Math.max(this.speed + 9, 24));
    }
  }

  /** Lock further answers while keeping the race visibly in motion. */
  beginEvaluation() {
    this.answered = true;
    this.frozen = false;
    this.speed = Math.max(MIN_ROLLING_SPEED, this.speed);
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;
  }

  highlightGate(index: number, correct: boolean) {
    this.highlightIndex = index;
    this.gates.forEach((gate, i) => {
      if (i === index) {
        gate.flashMaterial.color.set(correct ? '#22c55e' : '#ef4444');
        gate.flashMaterial.opacity = 0.25;
        gate.frameMaterial.emissive.set(correct ? '#22c55e' : '#ef4444');
        gate.frameMaterial.emissiveIntensity = 0.85;
      } else {
        gate.flashMaterial.opacity = 0;
        gate.frameMaterial.emissive.set(GATE_COLORS[i]);
        gate.frameMaterial.emissiveIntensity = 0.12;
      }
    });
  }

  clearHighlight() {
    this.highlightIndex = -1;
    this.gates.forEach((gate, i) => {
      gate.flashMaterial.opacity = 0;
      gate.frameMaterial.emissive.set(GATE_COLORS[i]);
      gate.frameMaterial.emissiveIntensity = 0.16;
    });
  }

  beginRound(options?: string[]) {
    if (options) this.setQuestion(options);
    this.clearHighlight();
    this.speed = Math.max(CRUISE_SPEED, Math.min(this.speed, MAX_SPEED * 0.65));
    this.laneFrom = 2;
    this.laneTarget = 2;
    this.laneTimer = 0;
    this.carX = LANE_X[2];
    this.playerZ = START_Z;
    this.prevZ = START_Z;
    this.answered = false;
    this.frozen = false;
    this.turboTimer = 0;
    this.shake = 0;
    this.player.group.position.set(this.carX, 0, this.playerZ);
    this.player.group.rotation.set(0, 0, 0);
    this.player.body.rotation.set(0, 0, 0);
    this.playerShadow.position.set(this.carX, 0.018, this.playerZ);
    this.lastLaneCb = 2;
    this.callbacks.onLane(2);
    this.camera.position.set(this.carX, 4.0, this.playerZ + 10.4);
    this.startLights.forEach((light) => {
      const mat = light.material as THREE.MeshStandardMaterial;
      mat.color.set('#3a1418');
      mat.emissive.set('#ff2233');
      mat.emissiveIntensity = 0.25;
    });
  }

  setStartLights(count: number) {
    this.startLights.forEach((light, i) => {
      const mat = light.material as THREE.MeshStandardMaterial;
      if (i < count) {
        mat.emissive.set('#ff2233');
        mat.emissiveIntensity = 2.2;
      } else if (count >= 5) {
        mat.emissive.set('#2eff7b');
        mat.emissiveIntensity = 2.4;
      } else {
        mat.emissiveIntensity = 0.2;
      }
    });
    this.startLightIndex = count;
  }

  private spawnSmoke(index: number) {
    const pool = this.smoke[this.smokePoolIndex++ % this.smoke.length];
    const left = index === 0;
    pool.sprite.visible = true;
    pool.sprite.position.set(this.carX + (left ? -0.95 : 0.95), 0.35, this.playerZ + 1.6);
    pool.sprite.scale.setScalar(0.7 + Math.random() * 0.4);
    (pool.sprite.material as THREE.SpriteMaterial).opacity = 0.5;
    pool.life = 0;
    pool.maxLife = 0.8 + Math.random() * 0.4;
    pool.vel.set((left ? -1 : 1) * (0.35 + Math.random() * 0.8), 0.55 + Math.random() * 0.5, 1.2 + Math.random());
  }

  private updateSmoke(dt: number) {
    this.smoke.forEach((p) => {
      if (!p.sprite.visible) return;
      p.life += dt;
      const t = p.life / p.maxLife;
      if (t >= 1) {
        p.sprite.visible = false;
        return;
      }
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.scale.addScalar(dt * 2.1);
      (p.sprite.material as THREE.SpriteMaterial).opacity = 0.45 * (1 - t);
    });
  }

  private updateRivals(dt: number, time: number) {
    this.rankAnim += (this.currentRank - this.rankAnim) * Math.min(1, dt * 2.6);
    const playerRankNow = this.currentRank;
    const rivalRanks: number[] = [];
    for (let r = 1; r <= 4; r++) if (r !== playerRankNow) rivalRanks.push(r);
    this.rivals.forEach((rival, i) => {
      const rank = rivalRanks[i] ?? i + 2;
      const ahead = rank < playerRankNow;
      const gap = Math.abs(rank - playerRankNow);
      const targetZ = this.playerZ - (ahead ? 6 + gap * 4.2 : 2.2 + gap * 1.6);
      const group = rival.rig.group;
      group.position.z += (targetZ - group.position.z) * Math.min(1, dt * 2.4);
      let baseLane = rival.lane;
      if (baseLane === this.laneTarget) baseLane = (baseLane + 2) % 4;
      if (!ahead) baseLane = this.laneTarget < 2 ? 3 : 0;
      rival.targetX = LANE_X[baseLane] + Math.sin(time * 0.55 + rival.noise) * 0.75;
      group.position.x += (rival.targetX - group.position.x) * Math.min(1, dt * 1.8);
      group.position.y = Math.sin(time * 7 + i) * 0.025;
      group.rotation.y = Math.atan2(rival.targetX - group.position.x, 8) * 0.8;
      group.rotation.z = (rival.targetX - group.position.x) * -0.025;
      rival.rig.wheels.forEach((wheel) => (wheel.rotation.x += dt * (8 + this.speed)));
      rival.rig.steerPivots.forEach((pivot) => {
        pivot.rotation.y = (rival.targetX - group.position.x) * 0.12;
      });
    });
  }

  private adjustCamera(narrow: boolean) {
    this.camera.fov = narrow ? 71 : 60;
    this.camera.updateProjectionMatrix();
  }

  private resize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.adjustCamera(width / height < 1);
    this.camera.updateProjectionMatrix();
  };

  private animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    // Keep real racing speed on lower-frame-rate phones. Gate collision uses a
    // crossed-plane test (previous/current Z), so larger steps cannot skip it.
    const dt = Math.min(1, this.clock.getDelta());
    const time = this.clock.elapsedTime;

    if (!this.frozen) {
      const controlsActive = !this.answered;
      if (!controlsActive) {
        // Keep the circuit flowing during evaluation. A correct answer gives a real speed surge.
        if (this.turboTimer > 0) {
          this.speed = Math.min(MAX_SPEED, this.speed + ACCEL * 1.35 * dt);
        } else {
          this.speed += (CRUISE_SPEED - this.speed) * Math.min(1, dt * 1.8);
        }
      } else if (this.input.down) {
        this.speed = Math.max(MIN_ROLLING_SPEED, this.speed - BRAKE * dt);
      } else if (this.input.up) {
        this.speed = Math.min(MAX_SPEED, this.speed + ACCEL * dt);
      } else if (this.speed > CRUISE_SPEED) {
        this.speed = Math.max(CRUISE_SPEED, this.speed - DRAG * dt);
      } else {
        this.speed = Math.min(CRUISE_SPEED, this.speed + AUTO_ACCEL * dt);
      }

      if (controlsActive && (this.input.left || this.input.right)) {
        this.steerRepeat -= dt;
        if (this.steerRepeat <= 0 && Math.abs(this.carX - LANE_X[this.laneTarget]) < 0.25) {
          this.shiftLane(this.input.left ? -1 : 1);
          this.steerRepeat = 0.28;
        }
      }

      if (this.laneTimer < LANE_CHANGE_TIME) {
        this.laneTimer = Math.min(LANE_CHANGE_TIME, this.laneTimer + dt);
        const t = this.laneTimer / LANE_CHANGE_TIME;
        const eased = t * t * (3 - 2 * t);
        this.carX = LANE_X[this.laneFrom] + (LANE_X[this.laneTarget] - LANE_X[this.laneFrom]) * eased;
      } else {
        this.carX = LANE_X[this.laneTarget];
      }

      this.prevZ = this.playerZ;
      this.playerZ -= this.speed * dt;
      this.lateralVelocity = (this.carX - this.player.group.position.x) / Math.max(dt, 0.001);

      const targetYaw = (LANE_X[this.laneTarget] - this.carX) * 0.12 + THREE.MathUtils.clamp(this.lateralVelocity * 0.006, -0.09, 0.09);
      this.player.group.rotation.y += (targetYaw - this.player.group.rotation.y) * Math.min(1, dt * 8);
      const targetRoll = THREE.MathUtils.clamp(-this.lateralVelocity * 0.012, -0.09, 0.09);
      this.player.body.rotation.z += (targetRoll - this.player.body.rotation.z) * Math.min(1, dt * 8);
      this.player.body.rotation.x = -this.speed * 0.0022;
      this.player.group.position.set(this.carX, Math.sin(time * 18) * 0.012 * (this.speed / MAX_SPEED), this.playerZ);
      this.playerShadow.position.set(this.carX, 0.018, this.playerZ);

      this.wheelSpin += this.speed * dt * 2.6;
      this.player.wheels.forEach((wheel) => (wheel.rotation.x = this.wheelSpin));
      const steering = (LANE_X[this.laneTarget] - this.carX) * 0.1;
      this.player.steerPivots.forEach((pivot) => (pivot.rotation.y += (steering - pivot.rotation.y) * Math.min(1, dt * 10)));

      this.smokeCooldown -= dt;
      if (this.smokeCooldown <= 0 && this.speed > 6 && (Math.abs(this.lateralVelocity) > 4 || this.speed > MAX_SPEED * 0.86)) {
        this.spawnSmoke(Math.random() > 0.5 ? 0 : 1);
        this.smokeCooldown = 0.055;
      }

      if (controlsActive && this.playerZ <= GATE_Z + 0.6 && this.prevZ > GATE_Z + 0.6) {
        this.answered = true;
        const nearest = LANE_X.reduce(
          (best, x, i) => (Math.abs(x - this.carX) < Math.abs(LANE_X[best] - this.carX) ? i : best),
          0,
        );
        this.callbacks.onGate(nearest);
      }
    }

    if (this.turboTimer > 0) {
      this.turboTimer -= dt;
      this.turboVisual = true;
    } else if (this.turboVisual) {
      this.turboVisual = false;
    }
    const turboStrength = this.turboVisual ? Math.min(1, Math.max(0, this.turboTimer / 1.2)) : 0;
    this.flames.forEach((flame, i) => {
      const mat = flame.material as THREE.SpriteMaterial;
      mat.opacity = turboStrength * (0.65 + Math.random() * 0.35);
      const s = 0.4 + turboStrength * (0.7 + Math.random() * 0.5);
      flame.scale.set(s * 1.2, s, 1);
      flame.position.z = 1.95 + turboStrength * (0.4 + Math.random() * 0.6);
      void i;
    });

    const speedRatio = this.speed / MAX_SPEED;
    const camDist = this.camera.aspect < 1 ? 12.8 : 10.4;
    const camHeight = this.camera.aspect < 1 ? 5.0 : 3.95;
    const shakeAmount = (this.turboVisual ? 0.045 : 0) * speedRatio + this.shake;
    const camTarget = new THREE.Vector3(
      this.carX * 0.58 + (Math.random() - 0.5) * shakeAmount,
      camHeight + speedRatio * 0.35 + (Math.random() - 0.5) * shakeAmount,
      this.playerZ + camDist,
    );
    this.camera.position.lerp(camTarget, Math.min(1, dt * (this.frozen ? 3 : 5.2)));
    this.camera.lookAt(this.carX * 0.62, 1.5 + speedRatio * 0.2, this.playerZ - 16);
    const targetFov = (this.camera.aspect < 1 ? 71 : 60) + speedRatio * 8 + (this.turboVisual ? 6 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
    this.shake = Math.max(0, this.shake - dt * 0.8);

    this.updateRivals(dt, time);
    this.updateSmoke(dt);
    this.flags.forEach((flag) => {
      flag.mesh.rotation.y = Math.sin(time * 1.4 + flag.phase) * 0.22;
      flag.mesh.rotation.z = Math.sin(time * 1.9 + flag.phase) * 0.06;
    });
    this.gates.forEach((gate, i) => {
      const pulse = i === this.highlightIndex ? 0.3 + Math.sin(time * 5) * 0.15 : 0.13 + Math.sin(time * 1.8 + i) * 0.025;
      (gate.glow.material as THREE.MeshBasicMaterial).opacity = pulse;
    });
    if (this.sunSprite) this.sunSprite.material.rotation = 0;

    if (time - this.lastSpeedCb > 0.1) {
      this.lastSpeedCb = time;
      this.callbacks.onSpeed(Math.round(speedRatio * 320));
    }
    this.renderer.render(this.scene, this.camera);
  };

  playTransition(options: string[]) {
    this.setQuestion(options);
    this.speed = CRUISE_SPEED;
    this.playerZ = START_Z;
    this.player.group.position.set(LANE_X[2], 0, START_Z);
    this.frozen = true;
    this.answered = false;
  }

  get speedKmh() {
    return Math.round((this.speed / MAX_SPEED) * 320);
  }

  get isAnswered() {
    return this.answered;
  }

  get startLightsCount() {
    return this.startLightIndex;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else if (material) material.dispose();
    });
    this.boardTextures.forEach((tex) => tex.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
