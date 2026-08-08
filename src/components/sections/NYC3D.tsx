"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ==================================================================
   NYC3D — a cinematic 3D model of New York City (Manhattan skyline).
   A dense procedural skyline of dark towers (varied heights/widths)
   with several iconic landmark towers emphasised, an obsidian grid of
   streets, soft atmospheric haze and slow auto-orbit. Drag to rotate,
   scroll to zoom. Monochrome premium aesthetic.
   ================================================================== */

interface Tower {
  x: number; z: number; // ground position
  w: number; d: number; // footprint
  h: number;            // height
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
    scene.fog = new THREE.FogExp2(0x05070c, 0.012);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 18, 46);
    camera.lookAt(0, 6, 0);

    const city = new THREE.Group();
    scene.add(city);

    // ---- ground / street grid ----
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x0b0e13 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    city.add(ground);

    // street lines (thin dark-grey grid)
    const streetMat = new THREE.LineBasicMaterial({ color: 0x1a2026, transparent: true, opacity: 0.6 });
    const half = 44, step = 4;
    for (let i = -half; i <= half; i += step) {
      const pts1 = [new THREE.Vector3(i, 0, -half), new THREE.Vector3(i, 0, half)];
      const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), streetMat);
      l1.position.y = 0.01;
      city.add(l1);
      const pts2 = [new THREE.Vector3(-half, 0, i), new THREE.Vector3(half, 0, i)];
      const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), streetMat);
      l2.position.y = 0.01;
      city.add(l2);
    }

    // ---- procedural skyline ----
    const rnd = mulberry(0x5a3);
    const towers: Tower[] = [];

    // Manhattan core: dense cluster
    for (let i = 0; i < 260; i++) {
      // bias towards central cluster
      const ring = Math.pow(rnd(), 1.4);
      const ang = rnd() * Math.PI * 2;
      const x = Math.cos(ang) * ring * 30;
      const z = Math.sin(ang) * ring * 26;
      const w = 0.5 + rnd() * 1.6;
      const d = 0.5 + rnd() * 1.6;
      const h = 2 + rnd() * 20;
      towers.push({ x, z, w, d, h });
    }

    // landmark towers (One WTC, Empire State, etc.)
    const landmarks: Tower[] = [
      { x: 0, z: 0, w: 3.4, d: 3.4, h: 40, landmark: true, spire: true },       // One World Trade Center
      { x: 9, z: 4, w: 2.6, d: 2.6, h: 32, landmark: true, spire: true },        // Empire State
      { x: -8, z: 6, w: 2.4, d: 2.4, h: 27, landmark: true, spire: true },       // midtown tower
      { x: 5, z: -7, w: 2.2, d: 2.2, h: 24, landmark: true },                    // downtown
      { x: -6, z: -9, w: 2.0, d: 2.0, h: 22, landmark: true },
      { x: 12, z: -4, w: 2.4, d: 2.4, h: 26, landmark: true, spire: true },      // east side
    ];
    towers.push(...landmarks);

    // tower materials
    const bodyDark = new THREE.MeshPhongMaterial({ color: 0x232a33, shininess: 20, specular: 0x20242a });
    const bodyMid = new THREE.MeshPhongMaterial({ color: 0x2b333e, shininess: 22, specular: 0x2a2f36 });
    const bodyLight = new THREE.MeshPhongMaterial({ color: 0x37414e, shininess: 24, specular: 0x333a44 });
    const spireMat = new THREE.MeshPhongMaterial({ color: 0x9aa5b3, shininess: 40 });

    for (const t of towers) {
      const group = new THREE.Group();
      // choose material by height
      const mat = t.landmark ? bodyLight : t.h > 14 ? bodyMid : bodyDark;
      const body = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), mat);
      body.position.y = t.h / 2;
      group.add(body);

      if (t.landmark) {
        // add stepped tiers for landmark towers
        const tierH = 2.2;
        const tiers = Math.min(3, Math.floor(t.h / 8));
        for (let k = 1; k <= tiers; k++) {
          const scale = 1 - k * 0.16;
          const tier = new THREE.Mesh(
            new THREE.BoxGeometry(t.w * scale, tierH, t.d * scale),
            bodyLight
          );
          tier.position.y = t.h - tierH * (k - 0.5);
          group.add(tier);
        }
        // windows glow band
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.08 });
        const band = new THREE.Mesh(new THREE.BoxGeometry(t.w * 1.02, t.h * 0.5, t.d * 1.02), glowMat);
        band.position.y = t.h * 0.35;
        group.add(band);
        if (t.spire) {
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.4, 8), spireMat);
          spire.position.y = t.h + 1.2;
          group.add(spire);
        }
      }

      group.position.set(t.x, 0, t.z);
      // tiny deterministic rotation for variety on non-landmark towers
      if (!t.landmark) group.rotation.y = rnd() * Math.PI * 2;
      city.add(group);
    }

    // ---- ambient glow points (windows) scattered ----
    const dotMat = new THREE.PointsMaterial({ color: 0xdfe8f2, size: 0.06, transparent: true, opacity: 0.5 });
    const dotPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      dotPos[i * 3] = (rnd() - 0.5) * 60;
      dotPos[i * 3 + 1] = rnd() * 30;
      dotPos[i * 3 + 2] = (rnd() - 0.5) * 52;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    const dots = new THREE.Points(dotGeo, dotMat);
    city.add(dots);

    // ---- lights ----
    scene.add(new THREE.AmbientLight(0x445, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(30, 40, 20);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x8fa0b8, 0.6);
    rim.position.set(-20, 10, -25);
    scene.add(rim);
    const low = new THREE.PointLight(0xdfe8f2, 0.6, 80);
    low.position.set(0, 2, 0);
    scene.add(low);

    // ---- interaction ----
    let dragging = false, px = 0, py = 0;
    let targetRotY = 0.4, targetRotX = 0.3;
    let zoom = 46;
    let tgtX = 0, tgtY = 18, tgtZ = 46;
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY += (e.clientX - px) * 0.005;
      targetRotX = Math.max(0.05, Math.min(1.1, targetRotX + (e.clientY - py) * 0.004));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(22, Math.min(90, zoom + e.deltaY * 0.06));
    };
    const api = {
      zoomIn: () => { zoom = Math.max(22, zoom - 5); },
      zoomOut: () => { zoom = Math.min(90, zoom + 5); },
    };
    (mount as any).__globeApi = api;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      if (!dragging) targetRotY += 0.0007; // very slow auto-orbit
      city.rotation.y += (targetRotY - city.rotation.y) * 0.05;
      city.rotation.x += (targetRotX - city.rotation.x) * 0.05;
      // camera zoom
      const d = (zoom - camera.position.distanceTo(new THREE.Vector3(0, 6, 0))) * 0.06;
      const dir2 = camera.position.clone().sub(new THREE.Vector3(0, 6, 0)).normalize();
      camera.position.addScaledVector(dir2, d);
      camera.lookAt(0, 6, 0);
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
