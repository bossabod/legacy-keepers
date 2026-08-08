"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ==================================================================
   NYC3D — a detailed procedural 3D model of New York City styled like
   an Apple Maps "map view": soft beige landmass, blue water, green
   parks, light-gray towers, white street grid. The city is STATIONARY
   (no auto-orbit) — the user can drag to look around and scroll / use
   the buttons to zoom.
   ================================================================== */

interface Tower {
  x: number; z: number;
  w: number; d: number;
  h: number;
  landmark?: boolean;
  spire?: boolean;
}

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    /* ---- Apple Maps light palette ---- */
    const BG = 0xd9e6ee;        // soft sky / water surround
    const WATER = 0xa7cfe6;     // light blue water
    const LAND = 0xece8da;      // warm beige landmass
    const PARK = 0xb9e0a5;      // fresh green park
    const STREET = 0xffffff;    // white streets
    const BLDG_DARK = 0xc6bfae;
    const BLDG_MID = 0xd1cbbd;
    const BLDG_LIGHT = 0xddd7ca;

    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.FogExp2(BG, 0.004);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    camera.position.set(0, 26, 62);
    camera.lookAt(0, 8, 0);

    const city = new THREE.Group();
    scene.add(city);

    const rnd = mulberry(0x8f2);
    const towers: Tower[] = [];

    /* ---------------- GEOMETRY PLAN ----------------
       Manhattan runs along the X axis (west-east across the screen),
       centered near the origin. Hudson river on the -X side, East river
       on the +X side. Z = north-south (Central Park around z=+18).
    */

    // ---- surrounding water (everything below / around the land) ----
    const waterMat = new THREE.MeshPhongMaterial({
      color: WATER, shininess: 60, specular: 0xffffff,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.08;
    city.add(ocean);

    // ---- landmass (warm beige island + boroughs) ----
    const landMat = new THREE.MeshPhongMaterial({ color: LAND, shininess: 4 });
    const land = new THREE.Mesh(new THREE.PlaneGeometry(100, 70), landMat);
    land.rotation.x = -Math.PI / 2;
    land.position.set(4, -0.04, 0);
    city.add(land);

    // ---- rivers (blue strips cutting through the land) ----
    const riverMat = new THREE.MeshPhongMaterial({
      color: WATER, shininess: 80, specular: 0xffffff,
    });
    const hudson = new THREE.Mesh(new THREE.PlaneGeometry(9, 70), riverMat);
    hudson.rotation.x = -Math.PI / 2;
    hudson.position.set(-36, 0.0, 0);
    city.add(hudson);
    const east = new THREE.Mesh(new THREE.PlaneGeometry(9, 70), riverMat);
    east.rotation.x = -Math.PI / 2;
    east.position.set(42, 0.0, 0);
    city.add(east);

    // ---- Central Park (green space within Manhattan) ----
    const parkMat = new THREE.MeshPhongMaterial({ color: PARK, shininess: 6 });
    const park = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 22), parkMat);
    park.position.set(-6, 0.12, 18);
    city.add(park);

    // smaller green spaces (square / parklets)
    const pocketMat = new THREE.MeshPhongMaterial({ color: PARK, shininess: 6 });
    const pockets: [number, number, number, number][] = [
      [-4, 8, 2.4, 2.4], [2, 10, 1.8, 1.8], [-12, 4, 1.6, 1.6],
      [10, 6, 1.4, 1.4], [-20, -6, 2, 1.6], [16, -2, 1.5, 1.5],
      [-2, -16, 2.2, 2.2], [6, -14, 1.4, 1.4],
    ];
    for (const [px, pz, pw, pd] of pockets) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.14, pd), pocketMat);
      p.position.set(px, 0.08, pz);
      city.add(p);
    }

    // ---- street grid (dense Manhattan blocks) ----
    const streetMat = new THREE.LineBasicMaterial({ color: STREET, transparent: true, opacity: 0.85 });
    // Avenues (vertical, along Z) every ~2 units
    for (let x = -32; x <= 34; x += 2) {
      const pts = [new THREE.Vector3(x, 0.02, -33), new THREE.Vector3(x, 0.02, 33)];
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), streetMat);
      city.add(l);
    }
    // Streets (horizontal, along X) every ~2 units
    for (let z = -32; z <= 32; z += 2) {
      const pts = [new THREE.Vector3(-40, 0.02, z), new THREE.Vector3(46, 0.02, z)];
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), streetMat);
      city.add(l);
    }
    // Major avenues (wider, slightly warm tint)
    const avenueMat = new THREE.LineBasicMaterial({ color: 0xf4e9cd, transparent: true, opacity: 0.6 });
    for (const x of [-30, -22, -14, -6, 2, 10, 18, 26]) {
      const pts = [new THREE.Vector3(x, 0.03, -33), new THREE.Vector3(x, 0.03, 33)];
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), avenueMat);
      city.add(l);
    }

    /* ---------------- BOROUGHS & BUILDINGS ---------------- */
    // Several density zones across the city
    // (x, z, radiusX, radiusZ, heightBase, density)
    const zones = [
      { x: 0, z: 0, rx: 16, rz: 14, hBase: 16, dens: 1.0 },   // Midtown / Downtown
      { x: -14, z: -10, rx: 10, rz: 10, hBase: 8, dens: 0.7 }, // Chelsea / West
      { x: 14, z: -8, rx: 10, rz: 10, hBase: 9, dens: 0.7 },   // East Village
      { x: -2, z: 26, rx: 10, rz: 9, hBase: 5, dens: 0.5 },    // Harlem (north)
      { x: -20, z: 18, rx: 8, rz: 8, hBase: 6, dens: 0.5 },    // Upper West
      { x: 20, z: 16, rx: 8, rz: 8, hBase: 6, dens: 0.5 },     // Upper East
      { x: -28, z: -20, rx: 12, rz: 12, hBase: 5, dens: 0.45 },// Jersey side (west)
      { x: 30, z: -20, rx: 12, rz: 12, hBase: 5, dens: 0.45 }, // Brooklyn (east)
      { x: 0, z: -28, rx: 14, rz: 10, hBase: 6, dens: 0.5 },   // Financial / south
    ];

    const totalTowers = 1300;
    for (let i = 0; i < totalTowers; i++) {
      let zz = zones[0];
      let pick = rnd();
      let acc = 0;
      const totalDens = zones.reduce((s, z) => s + z.dens, 0);
      for (const z of zones) {
        acc += z.dens / totalDens;
        if (pick <= acc) { zz = z; break; }
      }
      const gx = (rnd() + rnd() - 1) * zz.rx;
      const gz = (rnd() + rnd() - 1) * zz.rz;
      const x = zz.x + gx;
      const z = zz.z + gz;
      const h = zz.hBase * (0.4 + rnd() * 1.4) * (zz.dens > 0.9 ? 1.2 : 1);
      const w = 0.6 + rnd() * 1.4;
      const d = 0.6 + rnd() * 1.4;
      towers.push({ x, z, w, d, h });
    }

    // landmark towers (downtown & midtown)
    const landmarks: Tower[] = [
      { x: 0, z: 0, w: 3.6, d: 3.6, h: 46, landmark: true, spire: true },   // One WTC
      { x: 9, z: 4, w: 2.8, d: 2.8, h: 36, landmark: true, spire: true },   // Empire State
      { x: -8, z: 6, w: 2.6, d: 2.6, h: 30, landmark: true, spire: true },  // midtown tower
      { x: 5, z: -8, w: 2.4, d: 2.4, h: 27, landmark: true },               // downtown
      { x: -6, z: -10, w: 2.2, d: 2.2, h: 24, landmark: true },
      { x: 13, z: -4, w: 2.6, d: 2.6, h: 29, landmark: true, spire: true },  // east side
      { x: -14, z: -6, w: 2.2, d: 2.2, h: 22, landmark: true },             // Chelsea
      { x: 18, z: 8, w: 2.2, d: 2.2, h: 23, landmark: true },               // upper east
    ];
    towers.push(...landmarks);

    // materials — Apple-Maps light gray towers
    const bodyDark = new THREE.MeshPhongMaterial({ color: BLDG_DARK, shininess: 20, specular: 0xffffff });
    const bodyMid = new THREE.MeshPhongMaterial({ color: BLDG_MID, shininess: 24, specular: 0xffffff });
    const bodyLight = new THREE.MeshPhongMaterial({ color: BLDG_LIGHT, shininess: 28, specular: 0xffffff });
    const spireMat = new THREE.MeshPhongMaterial({ color: 0x8f8a80, shininess: 40 });

    // batch building via InstancedMesh for performance
    function buildGroup(meshTowers: Tower[], mat: THREE.Material) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const inst = new THREE.InstancedMesh(geo, mat, meshTowers.length);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      meshTowers.forEach((t, idx) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(t.x, t.h / 2, t.z),
          q,
          new THREE.Vector3(t.w, t.h, t.d)
        );
        inst.setMatrixAt(idx, m4);
      });
      inst.instanceMatrix.needsUpdate = true;
      return inst;
    }

    const dark = towers.filter((t) => !t.landmark && t.h <= 8);
    const mid = towers.filter((t) => !t.landmark && t.h > 8 && t.h <= 14);
    const light = towers.filter((t) => !t.landmark && t.h > 14);
    const landmarkArr = towers.filter((t) => t.landmark);

    city.add(buildGroup(dark, bodyDark));
    city.add(buildGroup(mid, bodyMid));
    city.add(buildGroup(light, bodyLight));

    // landmark towers individually (with tiers + spires)
    for (const t of landmarkArr) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), bodyLight);
      body.position.y = t.h / 2;
      g.add(body);
      const tiers = Math.min(4, Math.floor(t.h / 8));
      for (let k = 1; k <= tiers; k++) {
        const scale = 1 - k * 0.15;
        const tier = new THREE.Mesh(new THREE.BoxGeometry(t.w * scale, 2.2, t.d * scale), bodyLight);
        tier.position.y = t.h - 2.2 * (k - 0.5);
        g.add(tier);
      }
      if (t.spire) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.8, 8), spireMat);
        spire.position.y = t.h + 1.4;
        g.add(spire);
      }
      g.position.set(t.x, 0, t.z);
      city.add(g);
    }

    /* ---------------- BRIDGES ---------------- */
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0xbfb9aa, shininess: 16 });
    function addBridge(x1: number, z1: number, x2: number, z2: number, width = 1.2) {
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const mid = new THREE.Vector3((x1 + x2) / 2, 4, (z1 + z2) / 2);
      const angle = Math.atan2(dz, dx);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, width), bridgeMat);
      bridge.position.copy(mid);
      bridge.rotation.y = -angle;
      city.add(bridge);
      // suspension cables
      const cableMat = new THREE.LineBasicMaterial({ color: 0x8f8a80, transparent: true, opacity: 0.5 });
      const cablePts: THREE.Vector3[] = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const y = 4 + Math.sin(f * Math.PI) * 6;
        cablePts.push(new THREE.Vector3(x1 + dx * f, y, z1 + dz * f));
      }
      const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePts), cableMat);
      city.add(cable);
    }
    addBridge(14, -6, 32, -20);   // Brooklyn Bridge
    addBridge(12, -10, 30, -26);  // Manhattan Bridge
    addBridge(16, -2, 32, -14);   // Williamsburg
    addBridge(20, 12, 40, 22);    // Queensboro (upper east)
    addBridge(-16, 28, -40, 30);  // George Washington Bridge (west)

    /* ---------------- window dots (subtle, warm light) ---------------- */
    const dotMat = new THREE.PointsMaterial({ color: 0xfdf7e0, size: 0.08, transparent: true, opacity: 0.35 });
    const dotPos = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      dotPos[i * 3] = (rnd() - 0.5) * 70;
      dotPos[i * 3 + 1] = rnd() * 38;
      dotPos[i * 3 + 2] = (rnd() - 0.5) * 60;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    const dots = new THREE.Points(dotGeo, dotMat);
    city.add(dots);

    // ---- lights (bright, soft — daylight look) ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const sun = new THREE.DirectionalLight(0xfff7e8, 1.35);
    sun.position.set(35, 55, 25);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xe8f1f7, 0.55);
    fill.position.set(-30, 12, -25);
    scene.add(fill);
    scene.add(new THREE.PointLight(0xffffff, 0.35, 120));

    // ---- interaction (drag to look around, scroll / buttons to zoom) ----
    let dragging = false, px = 0, py = 0;
    let targetRotY = 0.5, targetRotX = 0.35;
    let zoom = 62;
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY += (e.clientX - px) * 0.004;
      targetRotX = Math.max(0.05, Math.min(1.2, targetRotX + (e.clientY - py) * 0.003));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoom = Math.max(30, Math.min(130, zoom + e.deltaY * 0.06)); };
    const api = {
      zoomIn: () => { zoom = Math.max(30, zoom - 6); },
      zoomOut: () => { zoom = Math.min(130, zoom + 6); },
    };
    (mount as any).__globeApi = api;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      // STATIONARY: the city does NOT auto-rotate. It only eases to the
      // last drag position (or the initial framing) and holds still.
      city.rotation.y += (targetRotY - city.rotation.y) * 0.06;
      city.rotation.x += (targetRotX - city.rotation.x) * 0.06;
      const target = new THREE.Vector3(0, 8, 0);
      const dir2 = camera.position.clone().sub(target).normalize();
      const curDist = camera.position.distanceTo(target);
      camera.position.copy(target).addScaledVector(dir2, curDist + (zoom - curDist) * 0.06);
      camera.lookAt(target);
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
