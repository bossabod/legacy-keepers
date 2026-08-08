"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { fetchNycRealData } from "@/lib/nyc-osm";

/* ==================================================================
   NYC3D — the REAL New York City, rendered as a 3D city map in the
   visual language of Apple Maps.

   Instead of any procedurally-generated stand-in, this component loads
   REAL OpenStreetMap data for all five boroughs — real building
   footprints with real heights, the real street network, real rivers &
   coastlines, and real parks — and extrudes it into 3D at true
   geographic coordinates (a local metric projection around midtown).

   • Elevated oblique aerial camera (orbit + zoom, no auto-spin).
   • Real building heights / locations / density / skyline distribution.
   • Natural palette (grey/beige/white buildings, grey roads, pale-blue
     water, natural green), soft daylight, subtle shadows.
   ================================================================== */

// metric tangent-plane bounds of the NYC bbox
const OCEAN_W = 62000, OCEAN_D = 62000, OCEAN_X = 2500, OCEAN_Z = 1000;
const FOCUS = new THREE.Vector3(1892, 0, -4653); // midtown Manhattan (local m)

const WATER_BASE = 0x9fc8e4;
const WATER = 0xa6cde7;
const LAND = 0xeee9db;
const GREEN = 0xa9d59a;
const ROAD_MAJOR = 0xc6c0ae;
const ROAD_LOCAL = 0xdbd6c9;
const SKY = 0xd8e7f0;

const BLD_LOW = [0xcfc4ab, 0xc8bda0, 0xb8a890, 0xd5cdbb, 0xbfab8e];
const BLD_MID = [0xcfcbc0, 0xc4c0b6, 0xbdb6a8, 0xd5d2c9, 0xc8c2b4];
const BLD_HIGH = [0xbcbcbb, 0xc8c8c7, 0xafafae, 0xd2d2d1, 0xa9a9a8];
const BLD_SKY = [0xe3e3e2, 0xcfcfcf, 0xbdbdbc, 0xe9e9e8];

function polygonMesh(ring: [number, number][], color: number, y: number, minArea = 400) {
  if (ring.length < 3) return null;
  const v2 = ring.map((p) => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []);
  // rough area via shoelace
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  if (Math.abs(area) / 2 < minArea) return null;
  const pos: number[] = [];
  for (const t of tris) {
    for (const idx of t) {
      pos.push(ring[idx][0], y, ring[idx][1]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, shininess: 4 }));
  mesh.receiveShadow = true;
  return mesh;
}

export default function NYC3D({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState("جارٍ تحميل خريطة نيويورك الحقيقية…");
  const [ready, setReady] = useState(false);

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
    scene.fog = new THREE.Fog(SKY, 18000, 62000);

    const camera = new THREE.PerspectiveCamera(48, width / height, 1, 160000);

    // ---- lights (soft daylight + shadows) ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    scene.add(new THREE.HemisphereLight(0xeaf3fb, 0xc9c0a8, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.2);
    sun.position.set(3000, 9000, 2000);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 24000;
    sun.shadow.camera.left = -9000;
    sun.shadow.camera.right = 9000;
    sun.shadow.camera.top = 9000;
    sun.shadow.camera.bottom = -9000;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfeaf4, 0.5);
    fill.position.set(-3000, 4000, -5000);
    scene.add(fill);

    // ---- base ocean + land (real water polygons carve the rivers) ----
    const oceanGeo = new THREE.PlaneGeometry(OCEAN_W, OCEAN_D);
    const ocean = new THREE.Mesh(oceanGeo, new THREE.MeshPhongMaterial({ color: WATER_BASE, shininess: 60, specular: 0xffffff }));
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(OCEAN_X, -3, OCEAN_Z);
    scene.add(ocean);
    const landGeo = new THREE.PlaneGeometry(OCEAN_W - 400, OCEAN_D - 400);
    const land = new THREE.Mesh(landGeo, new THREE.MeshPhongMaterial({ color: LAND, shininess: 2 }));
    land.rotation.x = -Math.PI / 2;
    land.position.set(OCEAN_X, -1.6, OCEAN_Z);
    land.receiveShadow = true;
    scene.add(land);

    // ---- load REAL data ----
    (async () => {
      const data = await fetchNycRealData((m) => { if (!disposed) setStage(m); });

      if (disposed) return;

      // water polygons
      for (const poly of data.water) for (const ring of poly.pts) {
        const m = polygonMesh(ring, WATER, 0.04);
        if (m) { m.castShadow = false; scene.add(m); }
      }
      // parks / greens
      for (const poly of data.greens) for (const ring of poly.pts) {
        const m = polygonMesh(ring, GREEN, 0.1);
        if (m) { m.castShadow = true; scene.add(m); }
      }

      // ---- REAL streets (thin extruded boxes) ----
      const roadGeos: { p1: THREE.Vector3; p2: THREE.Vector3; width: number; major: boolean }[] = [];
      let segCount = 0;
      for (const road of data.roads) {
        const pts = road.pts;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segCount > 320000) break;
          roadGeos.push({ p1: new THREE.Vector3(pts[i][0], 0.25, pts[i][1]), p2: new THREE.Vector3(pts[i + 1][0], 0.25, pts[i + 1][1]), width: road.width, major: road.major });
          segCount++;
        }
        if (segCount > 320000) break;
      }
      if (roadGeos.length > 0) {
        const rGeo = new THREE.BoxGeometry(1, 0.5, 1);
        const rInst = new THREE.InstancedMesh(rGeo, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 2 }), roadGeos.length);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        const s = new THREE.Vector3();
        const c = new THREE.Color();
        roadGeos.forEach((seg, idx) => {
          const dir = seg.p2.clone().sub(seg.p1);
          const len = dir.length();
          q.setFromAxisAngle(up, Math.atan2(dir.x, dir.z));
          s.set(len, 0.5, seg.width);
          m4.compose(seg.p1.clone().add(seg.p2).multiplyScalar(0.5), q, s);
          rInst.setMatrixAt(idx, m4);
          c.setHex(seg.major ? ROAD_MAJOR : ROAD_LOCAL);
          rInst.setColorAt(idx, c);
        });
        rInst.instanceMatrix.needsUpdate = true;
        if (rInst.instanceColor) rInst.instanceColor.needsUpdate = true;
        rInst.receiveShadow = true;
        scene.add(rInst);
      }

      // ---- REAL buildings (oriented footprints, real heights) ----
      if (data.buildings.length > 0) {
        const bGeo = new THREE.BoxGeometry(1, 1, 1);
        const bInst = new THREE.InstancedMesh(bGeo, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 6, specular: 0x222222 }), data.buildings.length);
        bInst.castShadow = true;
        bInst.receiveShadow = true;
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const c = new THREE.Color();
        data.buildings.forEach((b, idx) => {
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot);
          m4.compose(new THREE.Vector3(b.x, b.h / 2, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
          bInst.setMatrixAt(idx, m4);
          const palette = b.h < 6 ? BLD_LOW : b.h < 15 ? BLD_MID : b.h < 35 ? BLD_HIGH : BLD_SKY;
          c.setHex(palette[(Math.random() * palette.length) | 0]).multiplyScalar(0.92 + Math.random() * 0.18);
          bInst.setColorAt(idx, c);
        });
        bInst.instanceMatrix.needsUpdate = true;
        if (bInst.instanceColor) bInst.instanceColor.needsUpdate = true;
        scene.add(bInst);
      }

      if (!disposed) {
        setReady(true);
        setStage(data.message ? "تنبيه: " + data.message : "");
      }
    })();

    // ---- camera (orbit + zoom around midtown) ----
    let radius = 6200, yaw = 0.33, pitch = 0.72;
    const clampPitch = () => { pitch = Math.max(0.25, Math.min(1.35, pitch)); };
    const camPos = () => new THREE.Vector3(
      FOCUS.x + radius * Math.cos(pitch) * Math.sin(yaw),
      FOCUS.y + radius * Math.sin(pitch),
      FOCUS.z + radius * Math.cos(pitch) * Math.cos(yaw)
    );
    const applyCam = () => {
      camera.position.copy(camPos());
      camera.lookAt(FOCUS);
    };
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
      radius = Math.max(900, Math.min(60000, radius * Math.exp(e.deltaY * 0.0011)));
    };
    const api = {
      zoomIn: () => { radius = Math.max(900, radius / 1.14); },
      zoomOut: () => { radius = Math.min(60000, radius * 1.14); },
    };
    (mount as any).__globeApi = api;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      applyCam();
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
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-5 py-3 text-[0.8rem] text-[#3c4a58] shadow-sm backdrop-blur-md">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5d96b8] border-t-transparent" />
            {stage}
          </div>
        </div>
      )}
    </div>
  );
}
