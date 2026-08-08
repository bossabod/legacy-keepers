"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WORLD_POLYGONS } from "@/lib/world-polygons";
import { OPERATIONAL_CITIES } from "@/lib/earth-data";

/* ==================================================================
   Globe3D — a realistic 3D Earth globe built with Three.js.
   A detailed equirectangular map is painted procedurally on a Canvas
   (ocean gradient, shaded land, dark-green mountains, white snow caps,
   deserts, coastal depth, city markers) and wrapped around the sphere.
   No external assets — everything renders in-browser and always works.
   Slow auto-rotation, drag to spin, wheel to zoom.
   ================================================================== */

const R = 5;

/* ------------------------------------------------------------------ */
/*  Build a realistic Earth texture.                                   */
/* ------------------------------------------------------------------ */
function buildEarthTexture(size = 2048): THREE.Texture {
  const W = size, H = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ---- deep ocean with subtle gradient ----
  const ocean = ctx.createLinearGradient(0, 0, 0, H);
  ocean.addColorStop(0, "#07131f");
  ocean.addColorStop(0.5, "#0a1b2c");
  ocean.addColorStop(1, "#06101a");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);

  // ---- land raster mask + shading ----
  // Paint land with elevation-based colors
  const landCanvas = document.createElement("canvas");
  landCanvas.width = W; landCanvas.height = H;
  const lctx = landCanvas.getContext("2d")!;

  // draw land base
  lctx.beginPath();
  for (const poly of WORLD_POLYGONS) {
    if (!poly || poly.length < 2) continue;
    for (let i = 0; i < poly.length; i++) {
      const lon = poly[i][0], lat = poly[i][1];
      const x = ((lon + 180) / 360) * W;
      const y = ((90 - lat) / 180) * H;
      if (i === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    }
    lctx.closePath();
  }

  // desert sand base
  lctx.fillStyle = "#b9a878";
  lctx.fill();
  // dark-green land fill over everything (vegetation), deserts will be
  // re-exposed by latitude-based bands
  lctx.globalCompositeOperation = "source-over";
  lctx.fillStyle = "rgba(18,36,22,0.85)";
  lctx.fill();

  // ---- simplify: draw lat bands clipped to land via 'destination-in' ----
  // Keep a mask of land on separate canvas
  const mask = document.createElement("canvas");
  mask.width = W; mask.height = H;
  const mctx = mask.getContext("2d")!;
  mctx.beginPath();
  for (const poly of WORLD_POLYGONS) {
    if (!poly || poly.length < 2) continue;
    for (let i = 0; i < poly.length; i++) {
      const lon = poly[i][0], lat = poly[i][1];
      const x = ((lon + 180) / 360) * W;
      const y = ((90 - lat) / 180) * H;
      if (i === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    }
    mctx.closePath();
  }
  mctx.fillStyle = "#fff";
  mctx.fill();

  // draw base land gradient (green lowlands -> dark green mountains)
  const landLayer = document.createElement("canvas");
  landLayer.width = W; landLayer.height = H;
  const llc = landLayer.getContext("2d")!;
  llc.fillStyle = "#2c5a2e"; // lowland green
  llc.fillRect(0, 0, W, H);
  // add latitude climate bands on top of land layer (before masking)
  // high latitude snow
  const snowGrad = llc.createLinearGradient(0, 0, 0, H);
  // We'll paint zones by drawing rects then masking to land.
  // North snow band
  llc.fillStyle = "rgba(238,244,250,0.95)";
  llc.fillRect(0, 0, W, H * 0.13);
  // South snow band
  llc.fillStyle = "rgba(238,244,250,0.95)";
  llc.fillRect(0, H * 0.87, W, H * 0.13);
  // desert belt ~ 10-30N
  llc.fillStyle = "rgba(180,150,96,0.7)";
  llc.fillRect(0, H * 0.33, W, H * 0.17);
  // southern desert belt ~ 10-28S
  llc.fillStyle = "rgba(180,150,96,0.55)";
  llc.fillRect(0, H * 0.66, W, H * 0.12);
  // mountain ranges: dark green high areas — draw dark patches near known
  // ranges via simple latitude/longitude boxes (Himalaya, Andes, Rockies)
  const mountains: [number, number, number, number][] = [
    // [latCenter, lonCenter, latR, lonR] boxes in degrees
    [33, 84, 6, 18], // Himalaya
    [-28, -68, 8, 6], // Andes S
    [-1, -78, 6, 6], // Andes N
    [44, -112, 8, 10], // Rockies
    [46, 8, 4, 8], // Alps
    [55, -118, 8, 8], // Canadian Rockies
  ];
  for (const [clat, clon, latR, lonR] of mountains) {
    const x = ((clon + 180) / 360) * W;
    const y = ((90 - clat) / 180) * H;
    const rw = (lonR / 360) * W;
    const rh = (latR / 180) * H;
    llc.fillStyle = "rgba(16,32,20,0.85)";
    llc.fillRect(x - rw, y - rh, rw * 2, rh * 2);
  }

  // mask landLayer to land
  llc.globalCompositeOperation = "destination-in";
  llc.drawImage(mask, 0, 0);
  llc.globalCompositeOperation = "source-over";

  // composite land onto base ocean
  ctx.drawImage(landLayer, 0, 0);

  // coastline stroke
  ctx.strokeStyle = "rgba(210,220,230,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const poly of WORLD_POLYGONS) {
    if (!poly || poly.length < 2) continue;
    for (let i = 0; i < poly.length; i++) {
      const lon = poly[i][0], lat = poly[i][1];
      const x = ((lon + 180) / 360) * W;
      const y = ((90 - lat) / 180) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.stroke();

  // subtle vignette on ocean for depth
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function Globe3D({ className = "" }: { className?: string }) {
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
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    const globe = new THREE.Group();
    scene.add(globe);

    const earthMat = new THREE.MeshPhongMaterial({
      map: buildEarthTexture(2048),
      specular: 0x111111,
      shininess: 18,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), earthMat);
    globe.add(earth);

    // atmosphere glow
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x2a4a66, transparent: true, opacity: 0.06, side: THREE.BackSide });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 64, 64), atmoMat));

    function ll2v(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    }

    // cities
    for (const city of OPERATIONAL_CITIES) {
      const p = ll2v(city.lat, city.lon, R * 1.012);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dot.position.copy(p);
      globe.add(dot);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
      glow.position.copy(p);
      globe.add(glow);
    }

    // arcs
    const hubs = OPERATIONAL_CITIES.map((c) => ll2v(c.lat, c.lon, R));
    const arcMat = new THREE.LineBasicMaterial({ color: 0x5a6a7a, transparent: true, opacity: 0.5 });
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const a = hubs[i], b = hubs[j];
        const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.35);
        const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(40);
        globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat));
      }
    }

    // stars
    const starCount = 500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 70;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0x223344, 1.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(8, 6, 8);
    scene.add(dir);

    let dragging = false, px = 0, py = 0, targetRotY = 0, targetRotX = 0, zoom = 14;
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY += (e.clientX - px) * 0.005;
      targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX + (e.clientY - py) * 0.003));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoom = Math.max(8, Math.min(22, zoom + e.deltaY * 0.01)); };
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      if (!dragging) targetRotY += 0.0016;
      globe.rotation.y += (targetRotY - globe.rotation.y) * 0.08;
      globe.rotation.x += (targetRotX - globe.rotation.x) * 0.08;
      camera.position.z += (zoom - camera.position.z) * 0.08;
      camera.lookAt(0, 0, 0);
      stars.rotation.y += 0.0002;
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

  return <div ref={mountRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
