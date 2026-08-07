"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* ------------------------------------------------------------------ */
/*  ImpactPyramid — a real WebGL/Three.js INVERTED pyramid treated as  */
/*  a heavy ceremonial obsidian artifact.                              */
/*                                                                     */
/*  - Dark smoked-crystal / black-metallic physical material with      */
/*    subtle internal reflections, soft metallic highlights and        */
/*    micro-brushed bump — never transparent-looking or flat.          */
/*  - Rotates as ONE rigid body around its exact centre at a constant  */
/*    slow speed: perfectly clean silhouette from every angle.         */
/*  - No floating numbers — the rank list on the left is the only      */
/*    source of the names/numbers.                                     */
/*  - Dense volumetric fog before opening (only silhouette + edges     */
/*    visible); the fog slowly parts over ~2–3s to reveal the object.  */
/*  - Slow-drifting smoke + faint dust + subtle bloom + vignette.      */
/* ------------------------------------------------------------------ */

interface Props {
  opened: boolean;
  activeIndex: number | null;
  onHover: (index: number | null) => void;
  onPick: (index: number) => void;
}

const N = 9;
const TIER_H = 0.5;
const GAP_OPEN = 0.035; // hairline ceremonial separation
const R_TOP = 3.3;
const R_APEX = 0.04;
const SLOPE = (R_TOP - R_APEX) / N;

// One slow, constant, synchronized rotation for the whole body (rad/s).
const OMEGA = 0.14;

interface TierRig {
  group: THREE.Group;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  halo: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
  edgeMat: THREE.LineBasicMaterial;
  haloMat: THREE.MeshBasicMaterial;
  geometry: THREE.CylinderGeometry;
  baseColor: THREE.Color;
  speed: number; // relative counter-rotation on hover pause
  focus: number; // -1 dimmed … 0 neutral … +1 focused
}

/* Procedural brushed-metal / micro-scratched bump map. */
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
  tex.anisotropy = 8; // crisp texture filtering while rotating
  tex.generateMipmaps = true;
  return tex;
}

/* Soft radial texture for smoke puffs and dust. */
function makeRadialTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
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

    const width = () => mount.clientWidth || 1;
    const height = () => mount.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85; // darker, never blown out
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x010203, 0.16); // heavy, mysterious fog to start
    scene.fog = fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(48, width() / height(), 0.1, 80);
    camera.position.set(0, 0.9, 8.2);
    camera.lookAt(0, 0, 0);

    // ----- Soft cinematic lighting (monochrome, no blue) -----
    const ambient = new THREE.AmbientLight(0x9aa3ad, 0.32);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x77828f, 0x04060a, 0.55);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xe9edf3, 1.05);
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

    const fill = new THREE.DirectionalLight(0x434e5c, 0.42);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xc8d5e4, 0.85);
    scene.add(rim);

    const rimBack = new THREE.DirectionalLight(0xb8c6d6, 0.4);
    rimBack.position.set(0, -1.5, -7);
    scene.add(rimBack);

    // Faint white light from the centre seam (opening).
    const centerLight = new THREE.PointLight(0xffffff, 0, 9);
    scene.add(centerLight);

    // Soft shadow catcher — the only thing beneath the pyramid.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -((N - 1) / 2) * TIER_H - 0.55;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- The inverted pyramid (one heavy body, 9 levels) -----
    const pyramid = new THREE.Group();
    scene.add(pyramid);

    const brushTex = makeBrushedTexture();
    const rigs: TierRig[] = [];

    for (let i = 0; i < N; i++) {
      const topR = R_TOP - i * SLOPE;
      const botR = R_TOP - (i + 1) * SLOPE;
      // Higher height-segment count + smoother normal interpolation for a
      // premium, refined frustum (still a crisp 4-sided inverted pyramid).
      const geometry = new THREE.CylinderGeometry(topR, botR, TIER_H, 4, 3, false);

      // Deep obsidian black / dark graphite — around 30% darker than before.
      // Almost-black body; only thin silver edge reflections reveal the form.
      const light = 0.014 + (N - 1 - i) * 0.0018;
      const baseColor = new THREE.Color().setHSL(0.56, 0.09, Math.min(Math.max(light, 0.011), 0.03));

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.9 - (N - 1 - i) * 0.012,
        roughness: 0.42 - (N - 1 - i) * 0.018,
        envMapIntensity: 0.5 + (N - 1 - i) * 0.018,
        transmission: 0.0, // solid, heavy — not translucent glass
        thickness: 4.2,
        ior: 1.55,
        attenuationColor: new THREE.Color(0x04060a),
        attenuationDistance: 4,
        clearcoat: 0.42,
        clearcoatRoughness: 0.28,
        bumpMap: brushTex,
        bumpScale: 0.014,
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = i;

      const edgeMat = new THREE.LineBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.14 });
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
      halo.scale.set(1.025, 1.012, 1.025);
      mesh.add(edges);
      mesh.add(halo);

      const group = new THREE.Group();
      group.add(mesh);
      pyramid.add(group);

      rigs.push({
        group, mesh, edges, halo, mat, edgeMat, haloMat, geometry,
        baseColor,
        speed: 0,
        focus: 0,
      });
    }

    // ----- Seam rings (thin glowing lines that appear on opening) -----
    const seams: THREE.Mesh[] = [];
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xf0f5fc,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < N - 1; i++) {
      const r = R_TOP - (i + 1) * SLOPE;
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.985, r * 1.015, 4), seamMat);
      ring.rotation.x = -Math.PI / 2;
      pyramid.add(ring);
      seams.push(ring);
    }

    // ----- Central vertical line (lights up on opening) -----
    const topY = ((N - 1) / 2) * TIER_H;
    const axisMat = new THREE.LineBasicMaterial({
      color: 0xf4f8fd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const axisLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, topY, 0),
        new THREE.Vector3(0, -topY, 0),
      ]),
      axisMat
    );
    pyramid.add(axisLine);

    // ----- Slow-drifting smoke puffs (mystery) -----
    const radialTex = makeRadialTexture();
    const smokeGroup = new THREE.Group();
    const smokePuffs: THREE.Sprite[] = [];
    for (let s = 0; s < 5; s++) {
      const mat = new THREE.SpriteMaterial({
        map: radialTex,
        color: 0x6a7480,
        transparent: true,
        opacity: 0.05 + Math.random() * 0.05,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const puff = new THREE.Sprite(mat);
      const scale = 3 + Math.random() * 4;
      puff.scale.set(scale, scale, 1);
      puff.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2
      );
      puff.userData.drift = Math.random() * Math.PI * 2;
      puff.userData.speed = 0.02 + Math.random() * 0.03;
      smokeGroup.add(puff);
      smokePuffs.push(puff);
    }
    scene.add(smokeGroup);

    // ----- Barely-visible ambient dust -----
    const dustCount = 120;
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
        map: radialTex,
        color: 0x8b97a6,
        size: 0.03,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    scene.add(dust);

    // ----- Subtle bloom -----
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Reduced ~70%: subtle edge-only white highlight, never blown out.
    const bloom = new UnrealBloomPass(new THREE.Vector2(width(), height()), 0.08, 0.55, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

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
    let fogReveal = 0; // 0 dense fog … 1 fully revealed
    const FOG_CLOSED = 0.16;
    const FOG_OPEN = 0.008;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const active = activeRef.current;
      const isOpen = openedRef.current;

      // Whole body rotates around its exact centre at constant speed.
      pyramid.rotation.y += OMEGA * dt;

      // Opening: slow ceremonial separation (~2–3s).
      const targetGap = isOpen ? GAP_OPEN : 0;
      gap += (targetGap - gap) * Math.min(1, dt * 0.9);
      const targetOpen = isOpen ? 1 : 0;
      openProgress += (targetOpen - openProgress) * Math.min(1, dt * 0.85);

      // Fog dissolves naturally and a little faster than the reveal (~1–2s),
      // so the artifact emerges gradually from the smoke.
      const targetReveal = isOpen ? 1 : 0;
      fogReveal += (targetReveal - fogReveal) * Math.min(1, dt * 1.5);
      fog.density = FOG_CLOSED + (FOG_OPEN - FOG_CLOSED) * fogReveal;

      for (let i = 0; i < N; i++) {
        const rig = rigs[i];
        rig.group.position.y = ((N - 1) / 2 - i) * (TIER_H + gap);

        let target: number;
        if (active === null) target = 0;
        else if (active === i) target = 1;
        else target = -0.5;
        rig.focus += (target - rig.focus) * Math.min(1, dt * 6);

        const glow = Math.max(rig.focus, 0);
        const dim = Math.max(-rig.focus, 0);

        // revealClarity: 0 while hidden (darker, duller, few reflections) →
        // 1 after reveal (sharp, reflective, crisp edges).
        const clarity = openProgress;
        rig.mat.color.copy(rig.baseColor)
          .multiplyScalar(1 - clarity * 0.08)
          .multiplyScalar(1 + glow * 0.12 - dim * 0.4);
        const ei = glow * 0.35;
        rig.mat.emissive.setRGB(0.3 * ei, 0.34 * ei, 0.42 * ei);
        rig.mat.emissiveIntensity = 1.0;
        rig.mat.envMapIntensity = (0.5 + (N - 1 - i) * 0.018) * (0.5 + 0.5 * clarity) + glow * 0.28;
        rig.edgeMat.opacity = Math.min(1, (0.04 + clarity * 0.08) + glow * 0.45 - dim * 0.12);
        rig.edgeMat.color.setHex(glow > 0.2 ? 0xf4f8fd : 0xdfe8f2);
        rig.haloMat.opacity = glow * 0.18;

        // Hover pauses ONLY this tier; the others keep rotating with the body.
        const targetSpeed = active === i ? -OMEGA : 0;
        rig.speed += (targetSpeed - rig.speed) * Math.min(1, dt * (targetSpeed === 0 ? 3 : 6));
        rig.mesh.rotation.y += rig.speed * dt;
      }

      for (let i = 0; i < N - 1; i++) {
        seams[i].position.y = ((N - 1) / 2 - (i + 0.5)) * (TIER_H + gap);
      }

      // Central vertical line + seams light up on opening.
      axisMat.opacity = openProgress * 0.5;
      seamMat.opacity = openProgress * 0.3;

      // Faint white centre seam light.
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.0);
      const openFlash = isOpen ? Math.min(openProgress * 1.5, 1) : 0;
      centerLight.intensity = openFlash * (1.8 + 0.6 * pulse);

      // Orbiting lights reveal real depth as the body turns.
      const la = t * 0.16;
      key.position.set(Math.cos(la) * 8, 4.6, Math.sin(la) * 8);
      key.target.position.set(0, 0, 0);
      key.target.updateMatrixWorld();
      fill.position.set(-Math.cos(la) * 6.5, 1.8, -Math.sin(la) * 6.5);
      rim.position.set(Math.sin(la) * 5.5, 4.4, -Math.cos(la) * 5.5);

      // Slow smoke drift.
      smokePuffs.forEach((p) => {
        p.userData.drift += dt * p.userData.speed;
        p.position.x += Math.sin(p.userData.drift) * dt * 0.04;
        p.position.y += Math.cos(p.userData.drift) * dt * 0.03;
      });
      dust.rotation.y = t * 0.006;
      dust.rotation.x = Math.sin(t * 0.05) * 0.02;

      composer.render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.setSize(w, h);
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
      });
      seams.forEach((s) => s.geometry.dispose());
      seamMat.dispose();
      axisLine.geometry.dispose();
      axisMat.dispose();
      smokePuffs.forEach((p) => (p.material as THREE.Material).dispose());
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      radialTex.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      brushTex.dispose();
      composer.dispose();
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
      aria-label="Impact Ladder — an inverted ceremonial pyramid"
      style={{ position: "relative", width: "100%", height: "100%" }}
    />
  );
}
