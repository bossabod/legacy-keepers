"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ==================================================================
   NYC3D — a detailed procedural 3D model of New York City.
   A dense, full-city reconstruction: Manhattan grid streets, five
   borough areas with differing densities, Central Park green space,
   the Hudson & East rivers, bridges, and a rich skyline with iconic
   landmark towers. Monochrome premium aesthetic, slow auto-orbit,
   drag to rotate, scroll / buttons to zoom.
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
    scene.fog = new THREE.FogExp2(0x05070c, 0.010);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    camera.position.set(0, 26, 62);
    camera.lookAt(0, 8, 0);

    const city = new THREE.Group();
    scene.add(city);

    const rnd = mulberry(0x8f2);
    const towers: Tower[] = [];

    /* ---------------- GEOMETRY PLAN ----------------
       Manhattan runs along the X axis (west-east across screen width),
       centered at origin. Hudson river on -X side, East river on +X.
       Z = north-south (Central Park around z=+18).
    */

    // ---- base terrain (dark) ----
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x0b0e13 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    city.add(ground);

    // ---- rivers (Hudson left, East right) ----
    const riverMat = new THREE.MeshPhongMaterial({ color: 0x0e1c2c, shininess: 30, specular: 0x203040 });
    const hudson = new THREE.Mesh(new THREE.PlaneGeometry(10, 90), riverMat);
    hudson.rotation.x = -Math.PI / 2;
    hudson.position.set(-40, 0.01, 0);
    city.add(hudson);
    const east = new THREE.Mesh(new THREE.PlaneGeometry(12, 90), riverMat);
    east.rotation.x = -Math.PI / 2;
    east.position.set(46, 0.01, 0);
    city.add(east);

    // ---- Central Park (green island within Manhattan) ----
    const parkMat = new THREE.MeshPhongMaterial({ color: 0x152c1c, shininess: 8 });
    const park = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 22), parkMat);
    park.position.set(-6, 0.1, 18);
    city.add(park);

    // ---- street grid (dense, Manhattan blocks) ----
    const streetMat = new THREE.LineBasicMaterial({ color: 0x151b22, transparent: true, opacity: 0.7 });
    // Avenues (vertical, along Z) every ~2 units
    for (let x = -30; x <= 30; x += 2) {
      const pts = [new THREE.Vector3(x, 0.02, -30), new THREE.Vector3(x, 0.02, 32)];
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), streetMat);
      city.add(l);
    }
    // Streets (horizontal, along X) every ~2 units
    for (let z = -30; z <= 32; z += 2) {
      const pts = [new THREE.Vector3(-34, 0.02, z), new THREE.Vector3(34, 0.02, z)];
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), streetMat);
      city.add(l);
    }

    /* ---------------- BOROUGHS & BUILDINGS ---------------- */
    // Define several density zones across the city
    // (x, z, radius, heightBase, density, towerScale)
    const zones = [
      { x: 0, z: 0, rx: 16, rz: 14, hBase: 16, dens: 1.0, label: "Midtown / Downtown" },   // Manhattan core
      { x: -14, z: -10, rx: 10, rz: 10, hBase: 8, dens: 0.7, label: "West side / Chelsea" },
      { x: 14, z: -8, rx: 10, rz: 10, hBase: 9, dens: 0.7, label: "East village" },
      { x: -2, z: 26, rx: 10, rz: 9, hBase: 5, dens: 0.5, label: "Harlem" },               // north
      { x: -20, z: 18, rx: 8, rz: 8, hBase: 6, dens: 0.5, label: "Upper west" },
      { x: 20, z: 16, rx: 8, rz: 8, hBase: 6, dens: 0.5, label: "Upper east" },
      { x: -28, z: -20, rx: 12, rz: 12, hBase: 5, dens: 0.45, label: "Jersey side (west)" },
      { x: 30, z: -20, rx: 12, rz: 12, hBase: 5, dens: 0.45, label: "Brooklyn (east)" },
      { x: 0, z: -28, rx: 14, rz: 10, hBase: 6, dens: 0.5, label: "Financial / south" },
    ];

    const totalTowers = 1100;
    for (let i = 0; i < totalTowers; i++) {
      // pick a zone weighted by density
      let zz = zones[0];
      let pick = rnd();
      let acc = 0;
      const totalDens = zones.reduce((s, z) => s + z.dens, 0);
      for (const z of zones) {
        acc += z.dens / totalDens;
        if (pick <= acc) { zz = z; break; }
      }
      // gaussian-ish offset within zone
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

    // materials
    const bodyDark = new THREE.MeshPhongMaterial({ color: 0x20262e, shininess: 20, specular: 0x1c2025 });
    const bodyMid = new THREE.MeshPhongMaterial({ color: 0x29313b, shininess: 22, specular: 0x262c34 });
    const bodyLight = new THREE.MeshPhongMaterial({ color: 0x36404c, shininess: 24, specular: 0x303844 });
    const spireMat = new THREE.MeshPhongMaterial({ color: 0x9aa5b3, shininess: 40 });

    // batch building via InstancedMesh for performance
    // group towers into instanced meshes by material tier
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

    // landmark towers individually (with tiers + spires + glow)
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
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.07 });
      const band = new THREE.Mesh(new THREE.BoxGeometry(t.w * 1.02, t.h * 0.5, t.d * 1.02), glowMat);
      band.position.y = t.h * 0.35;
      g.add(band);
      if (t.spire) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.6, 8), spireMat);
        spire.position.y = t.h + 1.3;
        g.add(spire);
      }
      g.position.set(t.x, 0, t.z);
      city.add(g);
    }

    /* ---------------- BRIDGES ---------------- */
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0x2a313b, shininess: 16 });
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
      const cableMat = new THREE.LineBasicMaterial({ color: 0x9aa5b3, transparent: true, opacity: 0.5 });
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
    // Brooklyn Bridge (downtown to Brooklyn)
    addBridge(14, -6, 32, -20);
    // Manhattan Bridge
    addBridge(12, -10, 30, -26);
    // Williamsburg
    addBridge(16, -2, 32, -14);
    // Queensboro (upper east to queens)
    addBridge(20, 12, 40, 22);
    // George Washington Bridge (far west to Jersey)
    addBridge(-16, 28, -40, 30);

    /* ---------------- window glow points ---------------- */
    const dotMat = new THREE.PointsMaterial({ color: 0xdfe8f2, size: 0.07, transparent: true, opacity: 0.5 });
    const dotPos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      dotPos[i * 3] = (rnd() - 0.5) * 70;
      dotPos[i * 3 + 1] = rnd() * 36;
      dotPos[i * 3 + 2] = (rnd() - 0.5) * 60;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    const dots = new THREE.Points(dotGeo, dotMat);
    city.add(dots);

    // ---- lights ----
    scene.add(new THREE.AmbientLight(0x445, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.3);
    dir.position.set(30, 45, 20);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x8fa0b8, 0.6);
    rim.position.set(-25, 10, -30);
    scene.add(rim);
    const low = new THREE.PointLight(0xdfe8f2, 0.5, 100);
    low.position.set(0, 2, 0);
    scene.add(low);

    // ---- interaction ----
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
      if (!dragging) targetRotY += 0.0005;
      city.rotation.y += (targetRotY - city.rotation.y) * 0.05;
      city.rotation.x += (targetRotX - city.rotation.x) * 0.05;
      const target = new THREE.Vector3(0, 8, 0);
      const dir2 = camera.position.clone().sub(target).normalize();
      const curDist = camera.position.distanceTo(target);
      camera.position.copy(target).addScaledVector(dir2, curDist + (zoom - curDist) * 0.06);
      camera.lookAt(target);
      dots.rotation.y += 0.0003;
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
