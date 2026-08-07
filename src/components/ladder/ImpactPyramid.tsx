"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ------------------------------------------------------------------ */
/*  ImpactPyramid — a real WebGL/Three.js INVERTED pyramid.            */
/*                                                                     */
/*  The pyramid rotates as ONE rigid body around its exact centre at a */
/*  constant speed, so the silhouette stays perfectly clean from every */
/*  angle — no stretching, clipping or wobble. Each of the nine levels */
/*  bears a tiny 01–09 label plus a hairline "blueprint" guide pointing  */
/*  toward the rank list. A thin white vertical line runs through the  */
/*  centre; it lights up when the pyramid is opened.                   */
/*                                                                     */
/*  Material is almost-black obsidian/graphite — only reflections and  */
/*  silver edges reveal the shape. Nothing sits beneath it except a    */
/*  soft shadow.                                                       */
/* ------------------------------------------------------------------ */

interface Props {
  opened: boolean;
  activeIndex: number | null;
  onHover: (index: number | null) => void;
  onPick: (index: number) => void;
}

const N = 9;
const TIER_H = 0.5;
const GAP_OPEN = 0.045; // tiny, ceremonial separation
const R_TOP = 3.3;
const R_APEX = 0.04;
const SLOPE = (R_TOP - R_APEX) / N;

// One slow, constant, synchronized rotation for the whole body (rad/s).
const OMEGA = 0.18;

interface TierRig {
  group: THREE.Group;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  halo: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  edgeMat: THREE.LineBasicMaterial;
  haloMat: THREE.MeshBasicMaterial;
  geometry: THREE.CylinderGeometry;
  baseColor: THREE.Color;
  speed: number; // relative rotation of this tier against the body (hover pause)
  focus: number; // -1 dimmed … 0 neutral … +1 focused
  label: THREE.Sprite;
  labelMat: THREE.SpriteMaterial;
  guide: THREE.Line;
  guideMat: THREE.LineBasicMaterial;
  labelTex: THREE.Texture;
}

/* Procedural brushed-metal bump map — fine brush strokes + micro-scratches. */
function makeBrushedTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#9aa2ad";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 1) {
    const a = 0.02 + Math.random() * 0.05;
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, size);
    ctx.stroke();
    ctx.strokeStyle = `rgba(0,0,0,${a * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(x - 1.2, 0);
    ctx.lineTo(x - 1.2 + (Math.random() - 0.5) * 8, size);
    ctx.stroke();
  }
  for (let s = 0; s < 320; s++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 2 + Math.random() * 10;
    const ang = (Math.random() - 0.5) * 0.9;
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.4 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const n = (Math.random() - 0.5) * 8;
    d[p] += n; d[p + 1] += n; d[p + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

/* Tiny elegant monochrome number label "01"…"09" rendered as a sprite. */
function makeLabelTexture(text: string): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.font = "700 64px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(220,230,240,0.9)";
  ctx.shadowColor = "rgba(230,238,248,0.5)";
  ctx.shadowBlur = 14;
  ctx.fillText(text, size / 2, size / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

export default function ImpactPyramid({ opened, activeIndex, onHover, onPick }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onHoverRef = useRef(onHover);
  const onPickRef = useRef(onPick);
  const activeRef = useRef(activeIndex);
  const openedRef = useRef(opened);

  useEffect(() => {
    onHoverRef.current = onHover;
    onPickRef.current = onPick;
    activeRef.current = activeIndex;
    openedRef.current = opened;
  }, [onHover, onPick, activeIndex, opened]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x020304, 0.008);
    scene.fog = fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Pyramid is centred at the origin; camera stays fixed so the body can
    // rotate about its exact centre with a perfectly clean silhouette.
    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.1, 80);
    camera.position.set(0, 0.55, 8.6);
    camera.lookAt(0, 0, 0);

    // ----- Soft cinematic lighting (monochrome) -----
    const ambient = new THREE.AmbientLight(0x9aa5b3, 0.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x7d8a9b, 0x04060a, 0.6);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xe6edf6, 1.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 25;
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.001;
    scene.add(key);
    scene.add(key.target);

    const fill = new THREE.DirectionalLight(0x4c596a, 0.4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xbccbdd, 0.7);
    scene.add(rim);

    // Faint light from inside used during the opening ceremony.
    const centerLight = new THREE.PointLight(0xffffff, 0, 9);
    scene.add(centerLight);

    // ----- Soft shadow catcher (the only thing beneath the pyramid) -----
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.35 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -((N - 1) / 2) * TIER_H - 0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- The inverted pyramid (one body, 9 levels) -----
    const pyramid = new THREE.Group();
    scene.add(pyramid);

    const brushTex = makeBrushedTexture();
    const rigs: TierRig[] = [];

    const labelX = -(R_TOP + 1.1); // labels + guides sit toward the rank list (left)

    for (let i = 0; i < N; i++) {
      const topR = R_TOP - i * SLOPE;
      const botR = R_TOP - (i + 1) * SLOPE;
      const geometry = new THREE.CylinderGeometry(topR, botR, TIER_H, 4, 1, false);

      // Almost-black obsidian / graphite. Barely any diffuse light; only
      // reflections and silver edges reveal the geometry.
      const light = 0.03 + (N - 1 - i) * 0.005;
      const baseColor = new THREE.Color().setHSL(0.585, 0.12, Math.min(Math.max(light, 0.026), 0.08));

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.9 - (N - 1 - i) * 0.012,
        roughness: 0.52 - (N - 1 - i) * 0.018,
        envMapIntensity: 0.45 + (N - 1 - i) * 0.02,
        bumpMap: brushTex,
        bumpScale: 0.01,
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = i;

      const edgeMat = new THREE.LineBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.12 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMat);

      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xe8eef6,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(geometry, haloMat);
      halo.scale.set(1.03, 1.015, 1.03);
      mesh.add(edges);
      mesh.add(halo);

      // --- Level label sprite "01"…"09" ---
      const labelTex = makeLabelTexture(String(i + 1).padStart(2, "0"));
      const labelMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        depthTest: false,
        sizeAttenuation: true,
      });
      const label = new THREE.Sprite(labelMat);
      label.scale.set(0.62, 0.62, 1);

      // --- Hairline blueprint guide toward the rank list ---
      const guideMat = new THREE.LineBasicMaterial({
        color: 0xcfdbe8,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        depthTest: false,
      });
      const guideGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(labelX, 0, 0),
        new THREE.Vector3(labelX + 1.6, 0, 0),
      ]);
      const guide = new THREE.Line(guideGeo, guideMat);

      const group = new THREE.Group();
      group.add(mesh);
      pyramid.add(group);
      pyramid.add(label);
      pyramid.add(guide);

      rigs.push({
        group, mesh, edges, halo, mat, edgeMat, haloMat, geometry,
        baseColor,
        speed: 0,
        focus: 0,
        label, labelMat, guide, guideMat, labelTex,
      });
    }

    // ----- Seam rings (thin glowing lines that appear on opening) -----
    const seams: THREE.Mesh[] = [];
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xeff4fb,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < N - 1; i++) {
      const r = R_TOP - (i + 1) * SLOPE;
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.98, r * 1.02, 4), seamMat);
      ring.rotation.x = -Math.PI / 2;
      pyramid.add(ring);
      seams.push(ring);
    }

    // ----- Central vertical line (through the exact centre) -----
    const topY = ((N - 1) / 2) * TIER_H;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, topY, 0),
      new THREE.Vector3(0, -topY, 0),
    ]);
    const axisMat = new THREE.LineBasicMaterial({
      color: 0xf2f7fd,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    });
    const axisLine = new THREE.Line(lineGeo, axisMat);
    pyramid.add(axisLine);

    // ----- Barely-visible ambient dust -----
    const dustCount = 130;
    const dustPos = new Float32Array(dustCount * 3);
    for (let p = 0; p < dustCount; p++) {
      dustPos[p * 3] = (Math.random() - 0.5) * 20;
      dustPos[p * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPos[p * 3 + 2] = (Math.random() - 0.5) * 11 - 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0x8b97a6,
        size: 0.018,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    scene.add(dust);

    // ----- Interaction -----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const meshes = rigs.map((r) => r.mesh);
    let hovered: number | null = null;

    const onMove = (e: PointerEvent) => {
      if (!openedRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      let next: number | null = null;
      if (hits.length > 0) next = hits[0].object.userData.index as number;
      if (next !== hovered) {
        hovered = next;
        onHoverRef.current(next);
      }
    };
    const onLeave = () => {
      if (hovered !== null) {
        hovered = null;
        onHoverRef.current(null);
      }
    };
    const onClick = (e: PointerEvent) => {
      if (e.button !== 0 || !openedRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) onPickRef.current(hits[0].object.userData.index as number);
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("pointerdown", onClick);

    // ----- Animation loop -----
    const clock = new THREE.Clock();
    let raf = 0;
    let gap = 0;
    let openProgress = 0;
    const topHalf = ((N - 1) / 2) * TIER_H;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const active = activeRef.current;
      const isOpen = openedRef.current;

      // Whole body rotates around its exact centre at constant speed.
      pyramid.rotation.y += OMEGA * dt;

      // Opening: tiny separation + animated seams.
      const targetGap = isOpen ? GAP_OPEN : 0;
      gap += (targetGap - gap) * Math.min(1, dt * 1.4);
      const targetOpen = isOpen ? 1 : 0;
      openProgress += (targetOpen - openProgress) * Math.min(1, dt * 1.2);

      for (let i = 0; i < N; i++) {
        const rig = rigs[i];
        const y = ((N - 1) / 2 - i) * (TIER_H + gap);

        rig.group.position.y = y;
        rig.label.position.set(labelX, y, 0);
        rig.guide.position.set(labelX, y, 0);

        let target: number;
        if (active === null) target = 0;
        else if (active === i) target = 1;
        else target = -0.5;
        rig.focus += (target - rig.focus) * Math.min(1, dt * 6);

        const glow = Math.max(rig.focus, 0);
        const dim = Math.max(-rig.focus, 0);

        rig.mat.color.copy(rig.baseColor).multiplyScalar(1 + glow * 0.22 - dim * 0.4);
        const ei = glow * 0.5;
        rig.mat.emissive.setRGB(0.45 * ei, 0.5 * ei, 0.62 * ei);
        rig.mat.emissiveIntensity = 1.3;
        rig.mat.envMapIntensity = (0.45 + (N - 1 - i) * 0.02) + glow * 0.6;
        rig.edgeMat.opacity = Math.min(1, 0.12 + glow * 0.7 - dim * 0.1);
        rig.edgeMat.color.setHex(glow > 0.2 ? 0xffffff : 0xdfe8f2);
        rig.haloMat.opacity = glow * 0.3;

        // Labels + guides illuminate with focus (blueprint hover).
        rig.labelMat.opacity = 0.55 + glow * 0.45 - dim * 0.3;
        rig.guideMat.opacity = 0.06 + glow * 0.5 - dim * 0.04;
        rig.guideMat.color.setHex(glow > 0.2 ? 0xf4f8fd : 0xcfdbe8);

        // Hover pauses ONLY this tier (counter-rotation vs the body); the
        // others keep rotating with the body. Release eases back into sync.
        const targetSpeed = active === i ? -OMEGA : 0;
        rig.speed += (targetSpeed - rig.speed) * Math.min(1, dt * (targetSpeed === 0 ? 3 : 6));
        rig.mesh.rotation.y += rig.speed * dt;
      }

      // Position seam rings inside the animated gaps.
      for (let i = 0; i < N - 1; i++) {
        seams[i].position.y = ((N - 1) / 2 - (i + 0.5)) * (TIER_H + gap);
      }

      // Central vertical line lights up on opening.
      axisMat.opacity = 0.05 + openProgress * 0.45;

      // Opening ceremony: white light from the centre + soft fog bloom.
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1);
      const openFlash = isOpen ? Math.min(openProgress * 1.5, 1) : 0;
      centerLight.intensity = openFlash * (2.0 + 0.8 * pulse);
      fog.density = 0.006 + openProgress * 0.012;
      seamMat.opacity = openProgress * 0.28;

      // Orbiting lights reveal true depth as the body turns.
      const la = t * 0.16;
      key.position.set(Math.cos(la) * 8, 4.6, Math.sin(la) * 8);
      key.target.position.set(0, 0, 0);
      key.target.updateMatrixWorld();
      fill.position.set(-Math.cos(la) * 6.5, 1.8, -Math.sin(la) * 6.5);
      rim.position.set(Math.sin(la) * 5.5, 4.4, -Math.cos(la) * 5.5);

      dust.rotation.y = t * 0.008;
      dust.rotation.x = Math.sin(t * 0.05) * 0.02;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("pointerdown", onClick);
      rigs.forEach((r) => {
        r.group.removeFromParent();
        r.geometry.dispose();
        r.mat.dispose();
        r.edgeMat.dispose();
        r.haloMat.dispose();
        r.labelMat.dispose();
        r.guideMat.dispose();
        r.labelTex.dispose();
        (r.guide.geometry as THREE.BufferGeometry).dispose();
        r.label.removeFromParent();
        r.guide.removeFromParent();
      });
      seams.forEach((s) => s.geometry.dispose());
      seamMat.dispose();
      axisLine.geometry.dispose();
      axisMat.dispose();
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      brushTex.dispose();
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pyramid-canvas"
      role="img"
      aria-label="Impact Ladder — an inverted three-dimensional pyramid"
      style={{ position: "relative", width: "100%", height: "100%" }}
    />
  );
}
