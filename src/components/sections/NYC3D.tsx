"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { fetchNycBuildingsTiled } from "@/lib/nyc-osm";

/* ==================================================================
   NYC3D — New York as a layered 3D city map (Apple-Maps visual style).

   PROGRESSIVE / FAIL-SAFE ARCHITECTURE:
   1. The BASE MAP (ocean, land, rivers, parks, the street network) is
      built synchronously from static, deterministic geometry — it
      renders IMMEDIATELY, with no network and no loading screen.
   2. The 3D BUILDING layer (REAL OSM building footprints + heights,
      loaded as per-borough "tiles") is fetched asynchronously on top,
      with a HARD TIMEOUT. If it succeeds the buildings appear; if it
      times out or fails, the base map stays visible. Nothing ever hangs.
   ================================================================== */

const FOCUS = new THREE.Vector3(2100, 0, -8200); // midtown Manhattan (local m)

const WATER = 0x9fc8e4;
const LAND = 0xeee9db;
const GREEN = 0xa9d59a;
const ROAD_MAJOR = 0xc4beac;
const ROAD = 0xdbd6c9;
const SKY = 0xd8e7f0;

const BLD_LOW = [0xcfc4ab, 0xc8bda0, 0xb8a890, 0xd5cdbb, 0xbfab8e];
const BLD_MID = [0xcfcbc0, 0xc4c0b6, 0xbdb6a8, 0xd5d2c9, 0xc8c2b4];
const BLD_HIGH = [0xbcbcbb, 0xc8c8c7, 0xafafae, 0xd2d2d1, 0xa9a9a8];
const BLD_SKY = [0xe3e3e2, 0xcfcfcf, 0xbdbdbc, 0xe9e9e8];

type Rect = [number, number, number, number]; // x0,x1,z0,z1

export default function NYC3D({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [buildingStatus, setBuildingStatus] = useState<"loading" | "done" | "off">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 22000, 70000);

    const camera = new THREE.PerspectiveCamera(48, width / height, 1, 160000);

    // ---------- lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    scene.add(new THREE.HemisphereLight(0xeaf3fb, 0xc9c0a8, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.2);
    sun.position.set(3000, 9000, 2000);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 26000;
    sun.shadow.camera.left = -10000;
    sun.shadow.camera.right = 10000;
    sun.shadow.camera.top = 10000;
    sun.shadow.camera.bottom = -10000;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfeaf4, 0.5);
    fill.position.set(-3000, 4000, -5000);
    scene.add(fill);

    /* ================= BASE MAP (renders instantly) ================= */
    // ocean base
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(40000, 50000),
      new THREE.MeshPhongMaterial({ color: WATER, shininess: 50, specular: 0xffffff })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(3000, -3, -7000);
    scene.add(ocean);

    const landMat = new THREE.MeshPhongMaterial({ color: LAND, shininess: 2 });
    const addLand = (r: Rect) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r[1] - r[0], r[3] - r[2]), landMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((r[0] + r[1]) / 2, -1.4, (r[2] + r[3]) / 2);
      m.receiveShadow = true;
      scene.add(m);
    };
    // borough landmasses (georeferenced local metres, approx real shape)
    addLand([-1800, 6200, -19000, 1600]);    // Manhattan
    addLand([-10800, -4200, -20500, 9000]);  // New Jersey (west)
    addLand([8200, 15600, -20500, 1600]);    // Brooklyn + Queens (east)
    addLand([1400, 6200, -26500, -19000]);   // Bronx (north)
    addLand([-4200, 1200, 2000, 10500]);     // Staten Island (south-west)

    // rivers & harbour (blue, over the land)
    const waterMat = new THREE.MeshPhongMaterial({ color: WATER, shininess: 70, specular: 0xffffff });
    const addWater = (r: Rect) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r[1] - r[0], r[3] - r[2]), waterMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((r[0] + r[1]) / 2, -1.1, (r[2] + r[3]) / 2);
      scene.add(m);
    };
    addWater([-4300, -1800, -26500, 9000]);  // Hudson River
    addWater([6200, 8200, -26500, 1600]);    // East River
    addWater([-4300, 8200, 1600, 3400]);     // Upper Bay / harbour
    addWater([-4300, 1200, 1200, 2000]);     // The Narrows

    // parks & green spaces
    const parkMat = new THREE.MeshPhongMaterial({ color: GREEN, shininess: 5 });
    const addPark = (r: Rect) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(r[1] - r[0], 0.4, r[3] - r[2]), parkMat);
      m.position.set((r[0] + r[1]) / 2, 0.1, (r[2] + r[3]) / 2);
      m.castShadow = true;
      scene.add(m);
    };
    addPark([2500, 4400, -9800, -5600]);     // Central Park
    addPark([10000, 11300, -12400, -10600]); // Prospect Park (Brooklyn)
    addPark([2900, 4600, -25000, -23400]);   // Van Cortlandt Park (Bronx)
    addPark([1800, 3400, -6200, -4400]);     // Riverside Park (west)
    addPark([4600, 5600, -8200, -7000]);     // east-side green
    addPark([8800, 10200, -5200, -3800]);    // borough green

    // street network (deterministic, georeferenced)
    const roadMajorMat = new THREE.LineBasicMaterial({ color: ROAD_MAJOR });
    const roadMat = new THREE.LineBasicMaterial({ color: ROAD, transparent: true, opacity: 0.9 });
    const roadLine = (x1: number, z1: number, x2: number, z2: number, mat: THREE.Material) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.02, z1), new THREE.Vector3(x2, 0.02, z2),
      ]);
      scene.add(new THREE.Line(g, mat));
    };
    const grid = (x0: number, x1: number, z0: number, z1: number, sx: number, sz: number, majorEvery = 8) => {
      let i = 0;
      for (let x = x0; x < x1; x += sx) roadLine(x, z0, x, z1, i++ % majorEvery === 0 ? roadMajorMat : roadMat);
      i = 0;
      for (let z = z0; z < z1; z += sz) roadLine(x0, z, x1, z, i++ % majorEvery === 0 ? roadMajorMat : roadMat);
    };
    grid(-1600, 6000, -18800, 1400, 270, 220);      // Manhattan grid (avenues+streets)
    grid(8300, 15400, -20300, 1400, 400, 400, 6);   // Brooklyn / Queens
    grid(1500, 6100, -26300, -19100, 360, 360, 6);  // Bronx
    grid(-10600, -4400, -20300, 8800, 480, 480, 6); // New Jersey
    grid(-4100, 1000, 2200, 10300, 450, 450, 6);    // Staten Island
    // Broadway — the famous diagonal through Manhattan
    {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        const f = i / 60;
        pts.push(new THREE.Vector3(-600 - 3700 * f, 0.03, 1400 - 11000 * f));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), roadMajorMat));
    }

    /* ================= REAL 3D BUILDING LAYER (async, time-boxed) ================= */
    const addBuildings = (buildings: { x: number; z: number; w: number; d: number; rot: number; h: number }[]) => {
      if (buildings.length === 0 || disposed) return;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const inst = new THREE.InstancedMesh(
        geo,
        new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 6, specular: 0x222222 }),
        buildings.length
      );
      inst.castShadow = true;
      inst.receiveShadow = true;
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const c = new THREE.Color();
      buildings.forEach((b, idx) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot);
        m4.compose(new THREE.Vector3(b.x, b.h / 2, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
        inst.setMatrixAt(idx, m4);
        const palette = b.h < 6 ? BLD_LOW : b.h < 15 ? BLD_MID : b.h < 35 ? BLD_HIGH : BLD_SKY;
        c.setHex(palette[(Math.random() * palette.length) | 0]).multiplyScalar(0.92 + Math.random() * 0.18);
        inst.setColorAt(idx, c);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      scene.add(inst);
    };

    (async () => {
      try {
        const buildings = await fetchNycBuildingsTiled({
          deadlineMs: 9000,
          perTileMs: 4500,
          onChunk: (n) => { if (!disposed) setBuildingStatus(n > 0 ? "loading" : "loading"); },
        });
        if (disposed) return;
        addBuildings(buildings);
        if (!disposed) setBuildingStatus(buildings.length > 0 ? "done" : "off");
      } catch {
        if (!disposed) setBuildingStatus("off");
      }
    })();

    /* ================= CAMERA (orbit + zoom) ================= */
    let radius = 6600, yaw = 0.42, pitch = 0.68;
    const clampPitch = () => { pitch = Math.max(0.25, Math.min(1.35, pitch)); };
    const camPos = () => new THREE.Vector3(
      FOCUS.x + radius * Math.cos(pitch) * Math.sin(yaw),
      FOCUS.y + radius * Math.sin(pitch),
      FOCUS.z + radius * Math.cos(pitch) * Math.cos(yaw)
    );
    const applyCam = () => { camera.position.copy(camPos()); camera.lookAt(FOCUS); };
    applyCam();

    let dragging = false, px = 0, py = 0;
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - px) * 0.0035;
      pitch += (e.clientY - py) * 0.0025;
      clampPitch();
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(1200, Math.min(60000, radius * Math.exp(e.deltaY * 0.0011)));
    };
    const api = {
      zoomIn: () => { radius = Math.max(1200, radius / 1.14); },
      zoomOut: () => { radius = Math.min(60000, radius * 1.14); },
    };
    (mount as any).__globeApi = api;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => { applyCam(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
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
      disposed = true;
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

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} data-globe className={className} style={{ width: "100%", height: "100%" }} />
      {/* non-blocking status badge — base map is always visible */}
      {buildingStatus === "loading" && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/60 bg-white/75 px-4 py-1.5 text-[0.62rem] text-[#4a5a68] shadow-sm backdrop-blur-md">
          جارٍ إضافة المباني ثلاثية الأبعاد الحقيقية…
        </div>
      )}
      {buildingStatus === "done" && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-4 py-1.5 text-[0.62rem] text-emerald-700 shadow-sm backdrop-blur-md">
          ✓ تم تحميل المباني الحقيقية
        </div>
      )}
    </div>
  );
}
