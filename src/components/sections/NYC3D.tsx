"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ==================================================================
   NYC3D — a complete, realistic 3D model of New York City rendered in
   the visual style of an Apple Maps 3D "map view":
     • Elevated oblique aerial camera (not top-down, not orbiting).
     • A full city that fills the frame — Manhattan island in the
       centre, Jersey to the west, Brooklyn/Queens to the east.
     • Dense, tall towers in the core that taper gradually toward the
       outskirts, each building with its own height / footprint / tone.
     • A real branching road network (avenues, streets, minor lanes,
       plus a diagonal Broadway) rather than a random grid.
     • Piers, waterfront promenades, distributed parks and green spaces.
     • Natural palette: grey / beige / white / light-brown buildings,
       grey roads, pale-blue water, natural green parks.
     • Soft daylight, real (soft) shadows, no neon/cartoon colours.
   The city is STATIONARY (no auto-orbit); the user may drag to look
   around and scroll / use the +/− buttons to zoom.
   ================================================================== */

interface Tower {
  x: number; z: number;
  w: number; d: number;
  h: number;
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    /* ---- Apple Maps palette (natural, calm) ---- */
    const SKY = 0xcfe0eb;      // soft pale-blue sky
    const WATER = 0x9fc8e4;    // pale blue water
    const LAND = 0xeee9db;     // warm light-beige landmass
    const PARK = 0xa9d59a;     // natural green
    const ROAD = 0xd8d3c6;     // light grey roads
    const ROAD_MAJOR = 0xcfc9b8;
    const LANE = 0xe5e0d4;

    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 300, 620);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    const FOCUS = new THREE.Vector3(2, 0, 0);
    camera.position.set(2, 82, 122);
    camera.lookAt(FOCUS);

    const city = new THREE.Group();
    scene.add(city);

    const rnd = mulberry(0x9c21);
    const towers: Tower[] = [];

    /* ---------------- LANDMASS ----------------
       Manhattan island centre; Hudson river on the west, East river on
       the east, a southern harbour below the island's tip. */
    const oceanMat = new THREE.MeshPhongMaterial({
      color: WATER, shininess: 90, specular: 0xffffff,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(340, 260), oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.6, 0);
    ocean.receiveShadow = true;
    city.add(ocean);

    const landMat = new THREE.MeshPhongMaterial({ color: LAND, shininess: 3 });
    function addLand(x0: number, x1: number, z0: number, z1: number, y = -0.5) {
      const w = x1 - x0, d = z1 - z0;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), landMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      mesh.receiveShadow = true;
      city.add(mesh);
    }
    addLand(-27, 25, -29, 44);     // Manhattan island
    addLand(-59, -39, -45, 45);    // New Jersey (west)
    addLand(36, 61, -45, 45);      // Brooklyn / Queens (east)

    // ---- water regions (used to avoid placing buildings on water) ----
    const inHudson = (x: number) => x > -39 && x < -27;
    const inEast = (x: number) => x > 25 && x < 36;
    const inHarbor = (x: number, z: number) =>
      z < -29 && x > -27 && x < 25 && z > -34;   // bay below Manhattan tip
    const inWater = (x: number, z: number) =>
      inHudson(x) || inEast(x) || inHarbor(x, z);

    /* ---------------- PARKS & GREEN SPACES ---------------- */
    const parkMat = new THREE.MeshPhongMaterial({ color: PARK, shininess: 6 });
    const parks: [number, number, number, number][] = [
      // Central Park (Manhattan core)
      [-9.2, 22, 7.4, 25.5],
      // pocket parks / squares distributed across the city
      [-4.5, 3.5, 2.2, 2.2], [2.5, 5.5, 1.6, 1.6], [-13, 2, 1.8, 1.8],
      [9, 4, 1.3, 1.3], [-20, -8, 2.2, 1.6], [14, 0, 1.4, 1.4],
      [-6, -18, 2.4, 2.4], [6, -16, 1.5, 1.5], [-2, 34, 2.0, 1.8],
      [-18, 30, 1.6, 1.6], [12, 26, 1.5, 1.5], [-1, 12, 1.2, 1.2],
      // waterfront green (riverside)
      [-25, 6, 0.9, 5.0], [-25, 24, 0.9, 5.0], [23, 10, 0.9, 4.5],
      // borough parks
      [-49, -30, 3, 2.4], [-48, 10, 2.4, 2], [44, -28, 3, 2.2], [46, 12, 2, 2],
      [-45, 32, 2.2, 2], [50, 32, 2.4, 2], [40, 0, 1.8, 1.8],
    ];
    function addPark(px: number, pz: number, pw: number, pd: number) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.35, pd), parkMat);
      p.position.set(px, 0.12, pz);
      p.castShadow = true;
      city.add(p);
    }
    for (const [px, pz, pw, pd] of parks) addPark(px, pz, pw, pd);

    const inPark = (x: number, z: number) => {
      for (const [px, pz, pw, pd] of parks) {
        if (Math.abs(x - px) < pw / 2 && Math.abs(z - pz) < pd / 2) return true;
      }
      return false;
    };

    /* ---------------- ROAD NETWORK ----------------
       Real branching streets: major avenues/arterials + secondary
       streets + fine minor lanes, with irregular (block-like) spacing
       and a diagonal Broadway cutting across Manhattan. */
    const roadMajorMat = new THREE.LineBasicMaterial({ color: ROAD_MAJOR });
    const roadMat = new THREE.LineBasicMaterial({ color: ROAD, transparent: true, opacity: 0.9 });
    const laneMat = new THREE.LineBasicMaterial({ color: LANE, transparent: true, opacity: 0.5 });

    function line(x1: number, z1: number, x2: number, z2: number, mat: THREE.Material) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.02, z1),
        new THREE.Vector3(x2, 0.02, z2),
      ]);
      const l = new THREE.Line(g, mat);
      city.add(l);
    }

    // irregular avenue & street positions per district
    function drawDistrict(
      x0: number, x1: number, z0: number, z1: number,
      avgW: number, avgD: number, majorEvery: number
    ) {
      // avenues (north-south)
      let x = x0 + (rnd() * 1.5);
      let majorC = 0;
      while (x < x1 - 0.5) {
        const mat = majorC % majorEvery === 0 ? roadMajorMat : roadMat;
        line(x, z0, x, z1, mat);
        majorC++;
        x += avgW * (0.6 + rnd() * 0.9);
      }
      // cross streets (east-west)
      let z = z0 + (rnd() * 1.5);
      majorC = 0;
      while (z < z1 - 0.5) {
        const mat = majorC % majorEvery === 0 ? roadMajorMat : roadMat;
        line(x0, z, x1, z, mat);
        majorC++;
        z += avgD * (0.6 + rnd() * 0.9);
      }
    }

    // Manhattan: tight blocks, frequent major cross streets
    drawDistrict(-26.5, 24.5, -28, 43, 2.6, 2.4, 5);
    // Broadway — the famous diagonal, from Battery up the west side
    {
      const steps = 40;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        pts.push(new THREE.Vector3(6 - f * 30, 0.03, -28 + f * 70));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      city.add(new THREE.Line(g, roadMajorMat));
    }
    // secondary "minor lanes" inside a few Manhattan blocks
    for (let bx = -24; bx < 22; bx += 6) {
      for (let bz = -24; bz < 38; bz += 6) {
        if (rnd() < 0.5) {
          line(bx + 1.2 + rnd() * 1.0, bz, bx + 1.2 + rnd() * 1.0, bz + 5, laneMat);
        }
      }
    }
    // New Jersey
    drawDistrict(-58, -40, -44, 44, 4.4, 4.2, 4);
    // Brooklyn / Queens
    drawDistrict(37, 60, -44, 44, 4.0, 4.2, 4);

    /* ---------------- PIERS & WATERFRONT ---------------- */
    const pierMat = new THREE.MeshPhongMaterial({ color: 0xd6cdb8, shininess: 8 });
    const piers: [number, number, number][] = [
      // west shore piers (Hudson)
      [-26.5, 6, 6], [-26.5, 16, 8], [-26.5, 26, 7], [-26.5, -2, 5],
      // east shore piers (East River)
      [24.5, 14, 6], [24.5, 24, 7], [24.5, -4, 5],
    ];
    for (const [px, pz, plen] of piers) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, plen), pierMat);
      pier.position.set(px, 0.1, pz);
      pier.rotation.z = px < 0 ? 0.02 : -0.02;
      pier.castShadow = true;
      city.add(pier);
    }

    /* ---------------- BUILDINGS (full city, density gradient) ---------------- */
    // downtown / midtown hubs that pull density & height upward
    const hubs: [number, number, number, number][] = [
      [0, 6, 1.5, 11],      // Midtown core
      [0, -20, 1.35, 9],    // Financial district
      [-3, 0, 0.55, 6],     // Times Sq area
      [42, -22, 0.7, 10],   // Downtown Brooklyn
      [-47, -16, 0.55, 9],  // Jersey City
      [32, 22, 0.45, 8],    // Long Island City / Queens
      [-2, 34, 0.4, 8],     // Harlem
    ];
    function densityAt(x: number, z: number) {
      let v = 0;
      for (const [hx, hz, w, s] of hubs) {
        const dx = x - hx, dz = z - hz;
        v += w * Math.exp(-(dx * dx + dz * dz) / (2 * s * s));
      }
      if (x > -26 && x < 24) v += 0.5;         // Manhattan baseline
      if (z < -28 && x > -26 && x < 24) v -= 0.2; // taper at island tip
      return v;
    }
    function heightAt(d: number) {
      const base = Math.min(64, 7 + d * 54);
      return base * (0.5 + rnd() * 1.05) * (d > 1.0 ? 1.12 : 1);
    }

    const STEP = 1.7;
    const X0 = -58, X1 = 60, Z0 = -43, Z1 = 43;
    for (let z = Z0; z < Z1; z += STEP) {
      for (let x = X0; x < X1; x += STEP) {
        if (inWater(x, z) || inPark(x, z)) continue;
        // only on land
        const onManhattan = x > -27 && x < 25 && z > -29 && z < 44;
        const onJersey = x > -59 && x < -39 && z > -45 && z < 45;
        const onBrooklyn = x > 36 && x < 61 && z > -45 && z < 45;
        if (!onManhattan && !onJersey && !onBrooklyn) continue;
        const d = densityAt(x, z);
        if (d <= 0.05) continue;
        // empty lots / courtyards
        if (rnd() > Math.min(1, d) * 0.72) continue;
        const h = heightAt(d);
        // dense core → narrower, taller; outskirts → wider, lower
        const foot = 1.1 + rnd() * 1.9 - Math.min(0.9, d * 0.5);
        const w = Math.max(0.9, foot * (0.8 + rnd() * 0.6));
        const dd = Math.max(0.9, foot * (0.8 + rnd() * 0.6));
        towers.push({ x, z, w, d: dd, h });
      }
    }

    /* ---- natural building colours (grey / beige / white / brown) ---- */
    const PALETTE = [
      0xbcb8b0, 0xc9c6be, 0xa8a6a2, 0xcfcabf, 0xbfb6a4,
      0xcbbfaa, 0xb3a98f, 0xd9d5cc, 0x9d9a97, 0xaa9f8a,
      0xd2cdc1, 0xc1b8a6, 0x958f8a, 0xe0dcd2,
    ];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshPhongMaterial({
      color: 0xffffff, shininess: 6, specular: 0x222222,
    }), towers.length);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    towers.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(t.x, t.h / 2, t.z),
        q,
        new THREE.Vector3(t.w, t.h, t.d)
      );
      inst.setMatrixAt(i, m4);
      col.setHex(PALETTE[(rnd() * PALETTE.length) | 0]).multiplyScalar(0.9 + rnd() * 0.25);
      inst.setColorAt(i, col);
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    city.add(inst);

    /* ---------------- LANDMARK TOWERS (famous, tiers + spire) ---------------- */
    const landmarkMat = new THREE.MeshPhongMaterial({
      color: 0xc6c2b8, shininess: 12, specular: 0x444444,
    });
    const landmarkMat2 = new THREE.MeshPhongMaterial({
      color: 0xb9b2a4, shininess: 12, specular: 0x444444,
    });
    const spireMat = new THREE.MeshPhongMaterial({ color: 0x9b968c, shininess: 30 });
    const landmarks: { x: number; z: number; w: number; d: number; h: number; spire?: boolean; mat?: THREE.Material; name: string }[] = [
      { x: 2, z: -20, w: 4.2, d: 4.2, h: 62, spire: true, mat: landmarkMat, name: "One WTC" },
      { x: 9, z: 3, w: 3.2, d: 3.2, h: 44, spire: true, mat: landmarkMat2, name: "Empire State" },
      { x: -8, z: 6, w: 2.9, d: 2.9, h: 38, mat: landmarkMat, name: "Midtown tower" },
      { x: 4, z: 5, w: 3.0, d: 3.0, h: 40, spire: true, mat: landmarkMat2, name: "Central Park Tower" },
      { x: 11, z: 2, w: 2.6, d: 2.6, h: 34, spire: true, mat: landmarkMat, name: "One Vanderbilt" },
      { x: -4, z: 12, w: 2.7, d: 2.7, h: 32, mat: landmarkMat2, name: "Columbus Circle" },
      { x: 6, z: -6, w: 2.5, d: 2.5, h: 30, mat: landmarkMat, name: "Downtown tower" },
      { x: -13, z: 20, w: 2.3, d: 2.3, h: 26, mat: landmarkMat2, name: "Riverside tower" },
      { x: 15, z: 12, w: 2.4, d: 2.4, h: 28, spire: true, mat: landmarkMat, name: "Upper East tower" },
      { x: 44, z: -22, w: 2.8, d: 2.8, h: 30, spire: true, mat: landmarkMat2, name: "Brooklyn tower" },
    ];
    for (const L of landmarks) {
      const g = new THREE.Group();
      const mat = L.mat || landmarkMat;
      const body = new THREE.Mesh(new THREE.BoxGeometry(L.w, L.h, L.d), mat);
      body.position.y = L.h / 2;
      g.add(body);
      const tiers = Math.min(5, Math.floor(L.h / 9));
      for (let k = 1; k <= tiers; k++) {
        const scale = 1 - k * 0.13;
        const tier = new THREE.Mesh(
          new THREE.BoxGeometry(L.w * scale, 2.4, L.d * scale), mat
        );
        tier.position.y = L.h - 2.4 * (k - 0.5);
        g.add(tier);
      }
      if (L.spire) {
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 3.4, 8), spireMat);
        spire.position.y = L.h + 1.7;
        g.add(spire);
      }
      g.position.set(L.x, 0, L.z);
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      city.add(g);
    }

    /* ---------------- BRIDGES ---------------- */
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0xc3bca9, shininess: 14 });
    const deckMat = new THREE.MeshPhongMaterial({ color: 0xb7b09c, shininess: 10 });
    function addBridge(x1: number, z1: number, x2: number, z2: number, width = 2.2) {
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const mid = new THREE.Vector3((x1 + x2) / 2, 3, (z1 + z2) / 2);
      const angle = Math.atan2(dz, dx);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, width), deckMat);
      deck.position.copy(mid);
      deck.rotation.y = -angle;
      deck.castShadow = true;
      city.add(deck);
      // suspension cables
      const cableMat = new THREE.LineBasicMaterial({ color: 0x8f8a80, transparent: true, opacity: 0.45 });
      const cablePts: THREE.Vector3[] = [];
      const steps = 34;
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const y = 3 + Math.sin(f * Math.PI) * 9;
        cablePts.push(new THREE.Vector3(x1 + dx * f, y, z1 + dz * f));
      }
      const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePts), cableMat);
      city.add(cable);
      // tower pylons
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 11, width + 0.8), bridgeMat);
      for (const f of [0.22, 0.78]) {
        const pp = pylon.clone();
        pp.position.set(x1 + dx * f, 5.5, z1 + dz * f);
        city.add(pp);
      }
    }
    addBridge(12, -6, 38, -10, 2.4);   // Brooklyn Bridge
    addBridge(9, -14, 38, -18, 2.2);   // Manhattan Bridge
    addBridge(13, 0, 41, 7, 2.2);      // Williamsburg
    addBridge(19, 20, 45, 28, 2.0);    // Queensboro
    addBridge(-24, 30, -41, 31, 2.4);  // George Washington (west)

    /* ---------------- LIGHTS (soft, natural daylight + soft shadows) ---------------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    scene.add(new THREE.HemisphereLight(0xeaf3fb, 0xc9c0a8, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.4);
    sun.position.set(60, 140, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 420;
    sun.shadow.camera.left = -140;
    sun.shadow.camera.right = 140;
    sun.shadow.camera.top = 140;
    sun.shadow.camera.bottom = -140;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill2 = new THREE.DirectionalLight(0xdfeaf4, 0.5);
    fill2.position.set(-40, 40, -60);
    scene.add(fill2);

    // ---- interaction (drag to look around, scroll / buttons to zoom) ----
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
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(80, Math.min(300, zoom + e.deltaY * 0.08));
    };
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
      // STATIONARY: eases to the initial framing / last drag and holds.
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
