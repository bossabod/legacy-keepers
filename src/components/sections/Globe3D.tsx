"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WORLD_POLYGONS } from "@/lib/world-polygons";
import { OPERATIONAL_CITIES } from "@/lib/earth-data";

/* ==================================================================
   Globe3D — a true 3D Earth globe built with Three.js.
   - Draws continents from real country polygons projected onto a sphere.
   - Glowing city markers + thin connection arcs between hubs.
   - Slow auto-rotation, drag to spin, wheel to zoom.
   - Dark premium intelligence aesthetic (obsidian ocean, silver land).
   ================================================================== */

const R = 5;

function latLonToVec3(lat: number, lon: number, radius: number, origin?: [number, number, number]): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  if (origin) {
    return new THREE.Vector3(x + origin[0], y + origin[1], z + origin[2]);
  }
  return new THREE.Vector3(x, y, z);
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

    // ----- ocean sphere (obsidian) -----
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x0a1420,
      emissive: 0x050b12,
      emissiveIntensity: 0.35,
      shininess: 20,
      transparent: true,
      opacity: 0.96,
    });
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), oceanMat);
    globe.add(ocean);

    // ----- draw continents from country polygons as thin shells -----
    const landMat = new THREE.MeshBasicMaterial({ color: 0x9aa5b3, side: THREE.DoubleSide });
    const landInnerMat = new THREE.MeshBasicMaterial({ color: 0x0d1218, side: THREE.DoubleSide });
    const rr = R * 0.996;
    const merged: number[] = [];
    const mergedInner: number[] = [];

    for (const poly of WORLD_POLYGONS) {
      if (!poly || poly.length < 3) continue;
      const start = merged.length / 3;
      const innerStart = mergedInner.length / 3;
      const c = latLonToVec3(0, 0, 0); // unused placeholder origin for projection
      // centroid of polygon (lon/lat average)
      let latSum = 0, lonSum = 0;
      for (const [lon, lat] of poly) { latSum += lat; lonSum += lon; }
      const cLat = latSum / poly.length;
      const cLon = lonSum / poly.length;
      const norm = latLonToVec3(cLat, cLon, 1);
      const centroid = norm.clone().normalize().multiplyScalar(R * 1.001);

      // fan triangulation: centroid + each consecutive edge pair
      for (let i = 0; i < poly.length; i++) {
        const a = latLonToVec3(poly[i][1], poly[i][0], rr);
        const b = latLonToVec3(poly[(i + 1) % poly.length][1], poly[(i + 1) % poly.length][0], rr);
        // outer shell
        merged.push(centroid.x, centroid.y, centroid.z, a.x, a.y, a.z, b.x, b.y, b.z);
        // inner (slightly darker) shifted inward
        const ai = a.clone().lerp(centroid, 0.02);
        const bi = b.clone().lerp(centroid, 0.02);
        mergedInner.push(centroid.x, centroid.y, centroid.z, ai.x, ai.y, ai.z, bi.x, bi.y, bi.z);
      }
      void start; void innerStart; void c;
    }

    if (merged.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(merged), 3));
      geo.computeVertexNormals();
      const land = new THREE.Mesh(geo, landMat);
      land.renderOrder = 2;
      globe.add(land);

      const geoInner = new THREE.BufferGeometry();
      geoInner.setAttribute("position", new THREE.BufferAttribute(new Float32Array(mergedInner), 3));
      const inner = new THREE.Mesh(geoInner, landInnerMat);
      inner.renderOrder = 1;
      inner.position.multiplyScalar(1.0);
      globe.add(inner);
    }

    // ----- city markers + arcs -----
    const cityMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const city of OPERATIONAL_CITIES) {
      const p = latLonToVec3(city.lat, city.lon, R * 1.015);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), cityMat);
      dot.position.copy(p);
      globe.add(dot);
    }

    // connection arcs between the 5 hubs (NY, London, Riyadh, Oslo, Perth)
    const hubCoords = OPERATIONAL_CITIES.map((c) => latLonToVec3(c.lat, c.lon, R));
    const arcMat = new THREE.LineBasicMaterial({ color: 0x4a5560, transparent: true, opacity: 0.5 });
    for (let i = 0; i < hubCoords.length; i++) {
      for (let j = i + 1; j < hubCoords.length; j++) {
        const a = hubCoords[i], b = hubCoords[j];
        const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.35);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts = curve.getPoints(32);
        const geoLine = new THREE.BufferGeometry().setFromPoints(pts);
        globe.add(new THREE.Line(geoLine, arcMat));
      }
    }

    // ----- stars backdrop -----
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 60;
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.6 }));
    scene.add(stars);

    // lights
    scene.add(new THREE.AmbientLight(0x334, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(8, 6, 8);
    scene.add(dir);

    // ----- interaction: drag to spin, wheel to zoom -----
    let dragging = false;
    let px = 0, py = 0;
    let targetRotY = 0, targetRotX = 0;
    let zoom = 14;
    const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetRotY += (e.clientX - px) * 0.005;
      targetRotX += (e.clientY - py) * 0.003;
      targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(8, Math.min(22, zoom + e.deltaY * 0.01));
    };
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    // ----- animate -----
    let raf = 0;
    const tick = () => {
      if (!dragging) targetRotY += 0.0015; // slow auto-rotation
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
