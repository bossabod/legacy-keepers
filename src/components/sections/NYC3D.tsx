"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ==================================================================
   NYC3D — a COMPLETE 3D CITY MAP in the visual language of Apple Maps.
   Built horizontally first: a real street network forms city blocks,
   and buildings are placed INSIDE those blocks, following the roads.

     • Aerial oblique camera (elevated, angled — not top-down, no orbit).
     • Manhattan island (centre), New Jersey (west), Brooklyn/Queens (east),
       Hudson & East rivers, and a southern harbour.
     • Hundreds of streets (avenues + cross streets + minor lanes + a
       diagonal Broadway) that actually separate neighborhoods and blocks.
     • Blocks are filled with many building TYPES — small houses, low-rise,
       3–5, 6–10 storeys, mid-rise offices, apartments, commercial,
       industrial, and only a FEW skyscrapers in the central districts.
     • Natural height distribution: low outskirts, medium through most
       neighborhoods, dense high-rise in a few central areas, a handful of
       landmark towers.
     • Waterfront, piers, parks, plazas, parking lots, bridges, open spaces.
     • Apple-Maps palette: grey/beige/white/light-brown buildings, grey
       roads, pale-blue water, natural green, soft daylight + subtle shadows.
   The city is STATIONARY; drag to look around, scroll / +/− to zoom.
   ================================================================== */

interface Tower { x: number; z: number; w: number; d: number; h: number; c: number; }

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function NYC3D({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    /* ---- Apple Maps palette ---- */
    const SKY = 0xcfe0eb;
    const WATER = 0x9fc8e4;
    const LAND = 0xeee9db;
    const PARK = 0xa9d59a;
    const ROAD = 0xd8d3c6;
    const ROAD_MAJOR = 0xcfc9b8;
    const LANE = 0xe6e1d6;
    const PLAZA = 0xe4ded0;
    const PARKING = 0xb8b6ae;

    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 320, 700);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    const FOCUS = new THREE.Vector3(2, 0, 0);
    camera.position.set(2, 84, 124);
    camera.lookAt(FOCUS);

    const city = new THREE.Group();
    scene.add(city);

    const rnd = mulberry(0x51c2);
    const towers: Tower[] = [];

    /* ============ LANDMASS & GEOGRAPHY ============ */
    const oceanMat = new THREE.MeshPhongMaterial({ color: WATER, shininess: 90, specular: 0xffffff });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(340, 260), oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.6, 0);
    ocean.receiveShadow = true;
    city.add(ocean);

    const landMat = new THREE.MeshPhongMaterial({ color: LAND, shininess: 3 });
    function addLand(x0: number, x1: number, z0: number, z1: number, y = -0.5) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), landMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      mesh.receiveShadow = true;
      city.add(mesh);
    }
    addLand(-27, 25, -29, 44);   // Manhattan island
    addLand(-59, -39, -45, 45);  // New Jersey (west)
    addLand(36, 61, -45, 45);    // Brooklyn / Queens (east)

    const inHudson = (x: number) => x > -39 && x < -27;
    const inEast = (x: number) => x > 25 && x < 36;
    const inHarbor = (x: number, z: number) => z < -29 && x > -27 && x < 25 && z > -34;
    const inWater = (x: number, z: number) => inHudson(x) || inEast(x) || inHarbor(x, z);
    const onManhattan = (x: number, z: number) => x > -27 && x < 25 && z > -29 && z < 44;
    const onJersey = (x: number, z: number) => x > -59 && x < -39 && z > -45 && z < 45;
    const onBrooklyn = (x: number, z: number) => x > 36 && x < 61 && z > -45 && z < 45;

    /* ---- parks & green spaces ---- */
    const parkMat = new THREE.MeshPhongMaterial({ color: PARK, shininess: 6 });
    const parks: [number, number, number, number][] = [
      [-9.2, 22, 7.4, 25.5],                                   // Central Park
      [-4.5, 3.5, 2.2, 2.2], [2.5, 5.5, 1.6, 1.6], [-13, 2, 1.8, 1.8],
      [9, 4, 1.3, 1.3], [-20, -8, 2.2, 1.6], [14, 0, 1.4, 1.4],
      [-6, -18, 2.4, 2.4], [6, -16, 1.5, 1.5], [-2, 34, 2.0, 1.8],
      [-18, 30, 1.6, 1.6], [12, 26, 1.5, 1.5], [-1, 12, 1.2, 1.2],
      [-25, 6, 0.9, 5.0], [-25, 24, 0.9, 5.0], [23, 10, 0.9, 4.5],
      [-49, -30, 3, 2.4], [-48, 10, 2.4, 2], [44, -28, 3, 2.2], [46, 12, 2, 2],
      [-45, 32, 2.2, 2], [50, 32, 2.4, 2], [40, 0, 1.8, 1.8],
    ];
    for (const [px, pz, pw, pd] of parks) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.35, pd), parkMat);
      p.position.set(px, 0.12, pz);
      p.castShadow = true;
      city.add(p);
    }
    const inPark = (x: number, z: number) => {
      for (const [px, pz, pw, pd] of parks) {
        if (Math.abs(x - px) < pw / 2 && Math.abs(z - pz) < pd / 2) return true;
      }
      return false;
    };

    /* ============ STREET NETWORK (draw lines + build blocks) ============ */
    const roadMajorMat = new THREE.LineBasicMaterial({ color: ROAD_MAJOR });
    const roadMat = new THREE.LineBasicMaterial({ color: ROAD, transparent: true, opacity: 0.9 });
    const laneMat = new THREE.LineBasicMaterial({ color: LANE, transparent: true, opacity: 0.5 });
    function line(x1: number, z1: number, x2: number, z2: number, mat: THREE.Material) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, 0.02, z1), new THREE.Vector3(x2, 0.02, z2)]);
      city.add(new THREE.Line(g, mat));
    }

    // Generate avenue/street positions (irregular, block-like spacing)
    function makeGrid(x0: number, x1: number, z0: number, z1: number, avgW: number, avgD: number) {
      const ax: number[] = [], sz: number[] = [];
      for (let x = x0; x < x1 - 0.5; x += avgW * (0.7 + rnd() * 0.7)) ax.push(x);
      for (let z = z0; z < z1 - 0.5; z += avgD * (0.7 + rnd() * 0.7)) sz.push(z);
      return { ax, sz };
    }
    function drawGrid(g: { ax: number[]; sz: number[] }, x0: number, x1: number, z0: number, z1: number, majorEvery: number) {
      g.ax.forEach((x, i) => line(x, z0, x, z1, i % majorEvery === 0 ? roadMajorMat : roadMat));
      g.sz.forEach((z, i) => line(x0, z, x1, z, i % majorEvery === 0 ? roadMajorMat : roadMat));
    }

    const manhattan = makeGrid(-26, 24, -28, 43, 2.3, 2.3);
    const jersey = makeGrid(-58, -40, -44, 44, 3.6, 3.6);
    const brooklyn = makeGrid(37, 60, -44, 44, 3.4, 3.6);

    drawGrid(manhattan, -26, 24, -28, 43, 5);
    drawGrid(jersey, -58, -40, -44, 44, 4);
    drawGrid(brooklyn, 37, 60, -44, 44, 4);

    // Broadway — the diagonal cutting across Manhattan
    const BR = { x1: 6, z1: -28, x2: -24, z2: 43 };
    {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 48; i++) { const f = i / 48; pts.push(new THREE.Vector3(BR.x1 + (BR.x2 - BR.x1) * f, 0.03, BR.z1 + (BR.z2 - BR.z1) * f)); }
      city.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), roadMajorMat));
    }
    function nearBroadway(x: number, z: number) {
      const vx = BR.x2 - BR.x1, vz = BR.z2 - BR.z1, len2 = vx * vx + vz * vz;
      const t = Math.max(0, Math.min(1, ((x - BR.x1) * vx + (z - BR.z1) * vz) / len2));
      const px = BR.x1 + vx * t, pz = BR.z1 + vz * t, dx = x - px, dz = z - pz;
      return dx * dx + dz * dz < 0.6 * 0.6;
    }

    // minor lanes (short alleys) inside a few Manhattan blocks
    for (let bx = -24; bx < 22; bx += 6) for (let bz = -24; bz < 38; bz += 6) {
      if (rnd() < 0.45) line(bx + 1.0 + rnd(), bz, bx + 1.0 + rnd(), bz + 4.5, laneMat);
    }

    /* ============ BLOCKS & BUILDINGS ============ */
    const NAT = [0xbcb8b0, 0xc9c6be, 0xa8a6a2, 0xcfcabf, 0xbfb6a4, 0xcbbfaa, 0xb3a98f, 0xd9d5cc, 0x9d9a97, 0xd2cdc1, 0xc1b8a6, 0xe0dcd2];
    const BRICK = [0x9c6b4f, 0xa8755a, 0x8a5f46, 0x7e5a46, 0xb0805f, 0x9a6f53];
    const CONC = [0xb5b0a4, 0xa8a294, 0x9f9a90, 0xbdb8ac];

    // district configs
    type District = {
      type: string; lotW: number; lotD: number; gap: number; open: number;
      hMin: number; hMax: number; sk?: number; skMin?: number; skMax?: number;
      green: boolean; parking: boolean; brick: boolean; concrete: boolean;
    };
    const DIST: Record<string, District> = {
      cbd:        { type: "cbd", lotW: 2.5, lotD: 2.5, gap: 0.14, open: 0.06, hMin: 22, hMax: 52, sk: 0.08, skMin: 55, skMax: 70, green: false, parking: true, brick: false, concrete: false },
      commercial: { type: "commercial", lotW: 2.3, lotD: 2.3, gap: 0.15, open: 0.12, hMin: 12, hMax: 34, sk: 0.03, skMin: 48, skMax: 60, green: false, parking: true, brick: false, concrete: false },
      resmid:     { type: "resmid", lotW: 2.0, lotD: 2.0, gap: 0.20, open: 0.14, hMin: 7, hMax: 18, sk: 0, green: true, parking: true, brick: false, concrete: false },
      reslow:     { type: "reslow", lotW: 2.2, lotD: 2.2, gap: 0.32, open: 0.24, hMin: 4, hMax: 11, sk: 0, green: true, parking: true, brick: true, concrete: false },
      townhouse:  { type: "townhouse", lotW: 1.5, lotD: 1.7, gap: 0.12, open: 0.10, hMin: 3, hMax: 6, sk: 0, green: true, parking: false, brick: true, concrete: false },
      house:      { type: "house", lotW: 2.0, lotD: 2.4, gap: 0.55, open: 0.35, hMin: 2.5, hMax: 5, sk: 0, green: true, parking: true, brick: true, concrete: false },
      industrial: { type: "industrial", lotW: 3.6, lotD: 3.6, gap: 0.3, open: 0.2, hMin: 4, hMax: 9, sk: 0, green: false, parking: true, brick: false, concrete: true },
    };

    function inCircle(x: number, z: number, cx: number, cz: number, r: number) {
      const dx = x - cx, dz = z - cz;
      return dx * dx + dz * dz < r * r;
    }
    function classify(x: number, z: number): District | null {
      if (onManhattan(x, z)) {
        if (inCircle(x, z, 2, 4, 11) || inCircle(x, z, 0, -18, 9)) return DIST.cbd;
        if (inCircle(x, z, -4, 0, 5) || inCircle(x, z, 0, -25, 5)) return DIST.commercial;
        if (inCircle(x, z, -2, 32, 9)) return DIST.reslow;
        if (x < -19 || x > 17) return DIST.townhouse;           // island edges → row houses
        return DIST.resmid;
      }
      if (onJersey(x, z)) {
        if (inCircle(x, z, -46, -10, 9)) return DIST.commercial;
        return DIST.house;
      }
      if (onBrooklyn(x, z)) {
        if (inCircle(x, z, 42, -20, 9)) return DIST.commercial;
        if (inCircle(x, z, 44, 26, 13)) return DIST.industrial;
        return DIST.house;
      }
      return null;
    }

    // secondary meshes (small green, parking, plaza)
    function addGreen(cx: number, cz: number, w: number, d: number) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), parkMat);
      p.position.set(cx, 0.08, cz); p.castShadow = true; city.add(p);
    }
    const parkingMat = new THREE.MeshPhongMaterial({ color: PARKING, shininess: 6 });
    function addParking(cx: number, cz: number, w: number, d: number) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), parkingMat);
      p.position.set(cx, 0.06, cz); p.receiveShadow = true; city.add(p);
    }
    const plazaMat = new THREE.MeshPhongMaterial({ color: PLAZA, shininess: 8 });
    function addPlaza(cx: number, cz: number, w: number, d: number) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), plazaMat);
      p.position.set(cx, 0.07, cz); p.receiveShadow = true; city.add(p);
    }

    function towerColor(dist: District, h: number) {
      if ((dist.brick && rnd() < 0.7) || (!dist.concrete && h <= 6.2 && rnd() < 0.5)) {
        return BRICK[(rnd() * BRICK.length) | 0];
      }
      if (dist.concrete) return CONC[(rnd() * CONC.length) | 0];
      return NAT[(rnd() * NAT.length) | 0];
    }
    function pickHeight(dist: District) {
      if (dist.sk && rnd() < dist.sk) return (dist.skMin || 55) + rnd() * ((dist.skMax || 70) - (dist.skMin || 55));
      return dist.hMin + rnd() * (dist.hMax - dist.hMin);
    }

    function fillBlock(x0: number, x1: number, z0: number, z1: number, dist: District) {
      const bw = x1 - x0, bd = z1 - z0;
      if (bw < 0.4 || bd < 0.4) return;
      const nx = Math.max(1, Math.round(bw / dist.lotW));
      const nz = Math.max(1, Math.round(bd / dist.lotD));
      const lw = bw / nx, ld = bd / nz;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const cx = x0 + i * lw + lw / 2, cz = z0 + j * ld + ld / 2;
        if (inPark(cx, cz) || nearBroadway(cx, cz)) continue;
        const r = rnd();
        if (r < dist.open) {
          if (dist.green && r < dist.open * 0.5) addGreen(cx, cz, lw * 0.6, ld * 0.6);
          else if (dist.parking && r < dist.open * 0.82) addParking(cx, cz, lw * 0.8, ld * 0.8);
          else if (!dist.green && r < dist.open * 0.7) addPlaza(cx, cz, lw * 0.7, ld * 0.7);
          continue;
        }
        const gap = dist.gap;
        const w = Math.max(0.6, (lw - gap * 2) * (0.72 + rnd() * 0.45));
        const d = Math.max(0.6, (ld - gap * 2) * (0.72 + rnd() * 0.45));
        const h = pickHeight(dist);
        towers.push({ x: cx, z: cz, w, d, h, c: towerColor(dist, h) });
      }
    }

    // iterate blocks formed by the street grid
    function buildRegion(g: { ax: number[]; sz: number[] }, x0: number, z0: number) {
      for (let i = 0; i < g.ax.length - 1; i++) for (let j = 0; j < g.sz.length - 1; j++) {
        const bx0 = g.ax[i], bx1 = g.ax[i + 1], bz0 = g.sz[j], bz1 = g.sz[j + 1];
        const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
        if (inWater(cx, cz) || inPark(cx, cz)) continue;
        const dist = classify(cx, cz);
        if (!dist) continue;
        fillBlock(bx0, bx1, bz0, bz1, dist);
      }
    }
    buildRegion(manhattan, -26, -28);
    buildRegion(jersey, -58, -44);
    buildRegion(brooklyn, 37, -44);

    /* ---- central plazas (public open spaces) ---- */
    addPlaza(-4, -28, 6, 3);     // Battery Park esplanade
    addPlaza(12, 24, 4, 2.4);    // Upper East plaza
    addParking(43, 26, 6, 3);    // industrial yard

    /* ---- render all regular buildings (instanced, per-building colour) ---- */
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 6, specular: 0x222222 }), towers.length);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    towers.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
      m4.compose(new THREE.Vector3(t.x, t.h / 2, t.z), q, new THREE.Vector3(t.w, t.h, t.d));
      inst.setMatrixAt(i, m4);
      col.setHex(t.c).multiplyScalar(0.9 + rnd() * 0.25);
      inst.setColorAt(i, col);
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    city.add(inst);

    /* ---- LANDMARK skyscrapers (only a few, only in central districts) ---- */
    const lmMat = new THREE.MeshPhongMaterial({ color: 0xc6c2b8, shininess: 12, specular: 0x444444 });
    const lmMat2 = new THREE.MeshPhongMaterial({ color: 0xb9b2a4, shininess: 12, specular: 0x444444 });
    const spireMat = new THREE.MeshPhongMaterial({ color: 0x9b968c, shininess: 30 });
    const landmarks: { x: number; z: number; w: number; d: number; h: number; spire?: boolean; mat: THREE.Material }[] = [
      { x: 2, z: -18, w: 4.2, d: 4.2, h: 64, spire: true, mat: lmMat },      // One WTC
      { x: 9, z: 3, w: 3.2, d: 3.2, h: 45, spire: true, mat: lmMat2 },       // Empire State
      { x: 4, z: 5, w: 3.0, d: 3.0, h: 41, spire: true, mat: lmMat2 },       // Central Park Tower
      { x: 11, z: 2, w: 2.6, d: 2.6, h: 35, spire: true, mat: lmMat },       // One Vanderbilt
      { x: -8, z: 6, w: 2.9, d: 2.9, h: 38, mat: lmMat },                    // Midtown tower
      { x: -4, z: 12, w: 2.7, d: 2.7, h: 32, mat: lmMat2 },                  // Columbus Circle
      { x: 6, z: -6, w: 2.5, d: 2.5, h: 30, mat: lmMat },                    // Downtown tower
      { x: 44, z: -21, w: 2.8, d: 2.8, h: 30, spire: true, mat: lmMat2 },    // Brooklyn tower
    ];
    for (const L of landmarks) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(L.w, L.h, L.d), L.mat);
      body.position.y = L.h / 2; g.add(body);
      const tiers = Math.min(5, Math.floor(L.h / 9));
      for (let k = 1; k <= tiers; k++) {
        const scale = 1 - k * 0.13;
        const tier = new THREE.Mesh(new THREE.BoxGeometry(L.w * scale, 2.4, L.d * scale), L.mat);
        tier.position.y = L.h - 2.4 * (k - 0.5); g.add(tier);
      }
      if (L.spire) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 3.4, 8), spireMat);
        spire.position.y = L.h + 1.7; g.add(spire);
      }
      g.position.set(L.x, 0, L.z);
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      city.add(g);
    }

    /* ---- piers & waterfront promenades ---- */
    const pierMat = new THREE.MeshPhongMaterial({ color: 0xd6cdb8, shininess: 8 });
    const promMat = new THREE.MeshPhongMaterial({ color: 0xe4ded0, shininess: 6 });
    const piers: [number, number, number][] = [
      [-26.5, 6, 6], [-26.5, 16, 8], [-26.5, 26, 7], [-26.5, -2, 5],
      [24.5, 14, 6], [24.5, 24, 7], [24.5, -4, 5],
    ];
    for (const [px, pz, plen] of piers) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, plen), pierMat);
      pier.position.set(px, 0.1, pz); pier.rotation.z = px < 0 ? 0.02 : -0.02;
      pier.castShadow = true; city.add(pier);
    }
    for (const [px, pz] of [[-26.5, -24], [-26.5, 34], [24.5, -22], [24.5, 34]]) {
      const prom = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 10), promMat);
      prom.position.set(px, 0.09, pz); prom.castShadow = true; city.add(prom);
    }

    /* ---- bridges ---- */
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0xc3bca9, shininess: 14 });
    const deckMat = new THREE.MeshPhongMaterial({ color: 0xb7b09c, shininess: 10 });
    function addBridge(x1: number, z1: number, x2: number, z2: number, width = 2.2) {
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      const mid = new THREE.Vector3((x1 + x2) / 2, 3, (z1 + z2) / 2);
      const angle = Math.atan2(dz, dx);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, width), deckMat);
      deck.position.copy(mid); deck.rotation.y = -angle; deck.castShadow = true; city.add(deck);
      const cableMat = new THREE.LineBasicMaterial({ color: 0x8f8a80, transparent: true, opacity: 0.45 });
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 34; i++) { const f = i / 34; pts.push(new THREE.Vector3(x1 + dx * f, 3 + Math.sin(f * Math.PI) * 9, z1 + dz * f)); }
      city.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 11, width + 0.8), bridgeMat);
      for (const f of [0.22, 0.78]) { const pp = pylon.clone(); pp.position.set(x1 + dx * f, 5.5, z1 + dz * f); city.add(pp); }
    }
    addBridge(12, -6, 38, -10, 2.4);  // Brooklyn Bridge
    addBridge(9, -14, 38, -18, 2.2);  // Manhattan Bridge
    addBridge(13, 0, 41, 7, 2.2);     // Williamsburg
    addBridge(19, 20, 45, 28, 2.0);   // Queensboro
    addBridge(-24, 30, -41, 31, 2.4); // George Washington

    /* ============ LIGHTING ============ */
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    scene.add(new THREE.HemisphereLight(0xeaf3fb, 0xc9c0a8, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.4);
    sun.position.set(60, 140, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
    sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill2 = new THREE.DirectionalLight(0xdfeaf4, 0.5);
    fill2.position.set(-40, 40, -60);
    scene.add(fill2);

    /* ============ INTERACTION ============ */
    let dragging = false, px = 0, py = 0;
    let targetRotY = 0.3, targetRotX = 0.55;
    let zoom = camera.position.distanceTo(FOCUS);
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY += (e.clientX - px) * 0.003;
      targetRotX = Math.max(0.2, Math.min(1.2, targetRotX + (e.clientY - py) * 0.002));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoom = Math.max(80, Math.min(300, zoom + e.deltaY * 0.08)); };
    const api = {
      zoomIn: () => { zoom = Math.max(80, zoom - 9); },
      zoomOut: () => { zoom = Math.min(300, zoom + 9); },
    };
    (mount as any).__globeApi = api;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      city.rotation.y += (targetRotY - city.rotation.y) * 0.05;
      city.rotation.x += (targetRotX - city.rotation.x) * 0.05;
      const dir2 = camera.position.clone().sub(FOCUS).normalize();
      const curDist = camera.position.distanceTo(FOCUS);
      camera.position.copy(FOCUS).addScaledVector(dir2, curDist + (zoom - curDist) * 0.06);
      camera.lookAt(FOCUS);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const w = mount.clientWidth || 1, h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} data-globe className={className} style={{ width: "100%", height: "100%" }} />;
}
