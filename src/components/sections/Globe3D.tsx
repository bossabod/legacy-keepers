"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OPERATIONAL_CITIES } from "@/lib/earth-data";

/* ==================================================================
   Globe3D — a realistic 3D Earth globe built with Three.js.
   The sphere is skinned with a high-detail photorealistic Earth texture
   (satellite Blue-Marble style) bundled in the project, so it always
   renders — no external network dependency. Continents, oceans, deserts,
   ice caps, mountains are all part of the texture.
   Slow auto-rotation, drag to spin, wheel to zoom.
   ================================================================== */

const R = 5;

/* Resolve the correct public path for the Earth texture, accounting for
   the gh-pages base path (/legacy-keepers) vs local dev (/). */
function earthTexturePath(): string {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  if (p.startsWith("/legacy-keepers")) return "/legacy-keepers/textures/earth.png";
  return "/textures/earth.png";
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

    // Earth sphere with the bundled photorealistic texture.
    const texLoader = new THREE.TextureLoader();
    const earthTex = texLoader.load(earthTexturePath(), () => {}, undefined, () => {
      const fallback = buildFallbackTexture();
      (earth.material as THREE.MeshPhongMaterial).map = fallback;
      (earth.material as THREE.MeshPhongMaterial).needsUpdate = true;
    });
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = 8;

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
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

    // arcs between hubs
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

/* Simple procedural fallback world texture (used only if the bundled
   photorealistic texture cannot be loaded). */
function buildFallbackTexture(): THREE.Texture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size / 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0a1420";
  ctx.fillRect(0, 0, size, size / 2);
  // simple green land blob approximations
  ctx.fillStyle = "#2c5a2e";
  [[0.55, 0.4, 0.2], [0.45, 0.3, 0.2], [0.5, 0.6, 0.15], [0.2, 0.4, 0.18], [0.75, 0.45, 0.16], [0.4, 0.7, 0.12]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x * size, y * (size / 2), r * size, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
