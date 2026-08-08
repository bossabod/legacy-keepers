"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WORLD_POLYGONS } from "@/lib/world-polygons";
import { OPERATIONAL_CITIES } from "@/lib/earth-data";

/* ==================================================================
   Globe3D — a true, clean 3D Earth globe built with Three.js.
   The continents are drawn once into a high-res Canvas texture
   (equirectangular projection of the real country polygons) and wrapped
   around the sphere, so the land is smooth and natural — no triangle
   distortion, no jittery borders. Cities appear as glowing markers with
   thin connection arcs between operational hubs. Slow auto-rotation,
   drag to spin, wheel to zoom.
   ================================================================== */

const R = 5;

/* Build an equirectangular world texture from the country polygons. */
function buildEarthTexture(size = 2048): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext("2d")!;

  // deep obsidian ocean
  ctx.fillStyle = "#0a1420";
  ctx.fillRect(0, 0, size, size / 2);
  // subtle ocean gradient
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.28, 0, size * 0.5, size * 0.28, size * 0.6);
  grad.addColorStop(0, "rgba(20,40,60,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size / 2);

  // land fill
  ctx.beginPath();
  for (const poly of WORLD_POLYGONS) {
    if (!poly || poly.length < 2) continue;
    for (let i = 0; i < poly.length; i++) {
      const lon = poly[i][0];
      const lat = poly[i][1];
      const x = ((lon + 180) / 360) * size;
      const y = ((90 - lat) / 180) * (size / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fillStyle = "#8f9aa8";
  ctx.fill();

  // subtle inner land shading (darker near coasts / lighter core) — draw a
  // second pass with a faint gradient so land has depth
  ctx.globalCompositeOperation = "source-atop";
  const landShade = ctx.createRadialGradient(size * 0.5, size * 0.25, size * 0.05, size * 0.5, size * 0.25, size * 0.55);
  landShade.addColorStop(0, "rgba(255,255,255,0.14)");
  landShade.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = landShade;
  ctx.fillRect(0, 0, size, size / 2);
  ctx.globalCompositeOperation = "source-over";

  // fine coastline stroke
  ctx.beginPath();
  for (const poly of WORLD_POLYGONS) {
    if (!poly || poly.length < 2) continue;
    for (let i = 0; i < poly.length; i++) {
      const lon = poly[i][0];
      const lat = poly[i][1];
      const x = ((lon + 180) / 360) * size;
      const y = ((90 - lat) / 180) * (size / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.strokeStyle = "rgba(214,222,232,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();

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

    // ---- the Earth sphere with the generated land texture ----
    const earthMat = new THREE.MeshPhongMaterial({
      map: buildEarthTexture(2048),
      specular: 0x111111,
      shininess: 18,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), earthMat);
    globe.add(earth);

    // very faint atmosphere glow (transparent outer shell)
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x2a4a66,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 64, 64), atmoMat));

    // ---- city markers + arcs ----
    function ll2v(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    const cityMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const city of OPERATIONAL_CITIES) {
      const p = ll2v(city.lat, city.lon, R * 1.012);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), cityMat);
      dot.position.copy(p);
      globe.add(dot);
      // tiny glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
      );
      glow.position.copy(p);
      globe.add(glow);
    }

    // connection arcs between hubs
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

    // starfield
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

    // ---- interaction ----
    let dragging = false;
    let px = 0, py = 0;
    let targetRotY = 0, targetRotX = 0;
    let zoom = 14;
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
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
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
