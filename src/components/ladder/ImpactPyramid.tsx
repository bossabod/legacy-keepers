"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ------------------------------------------------------------------ */
/*  ImpactPyramid — a real WebGL/Three.js INVERTED pyramid.            */
/*                                                                     */
/*  Geometry: a wide-top, narrow-bottom pyramid (apex at the base)     */
/*  built from 9 horizontally-stacked 4-sided frustums. When closed    */
/*  the gaps are zero and the seams hidden, so it reads as ONE solid   */
/*  obsidian pyramid. On opening, glowing seam lines appear and the    */
/*  nine layers separate by a hairline while keeping the silhouette.   */
/*                                                                     */
/*  Motion: all layers revolve in the SAME direction at the SAME       */
/*  speed — a single synchronized machine. Hovering pauses only the    */
/*  selected layer; on release it eases back into sync.                */
/* ------------------------------------------------------------------ */

interface Props {
  opened: boolean;
  activeIndex: number | null;
  onHover: (index: number | null) => void;
  onPick: (index: number) => void;
}

const N = 9;
const TIER_H = 0.62;
const GAP_OPEN = 0.075;
const R_TOP = 3.0;
const R_APEX = 0.28;
const SLOPE = (R_TOP - R_APEX) / N;

// One synchronized rotation for every layer (rad/s) — slow & elegant.
const OMEGA = 0.16;

interface TierRig {
  group: THREE.Group;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  halo: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  edgeMat: THREE.LineBasicMaterial;
  haloMat: THREE.MeshBasicMaterial;
  geometry: THREE.CylinderGeometry;
  topR: number;
  botR: number;
  baseColor: THREE.Color;
  speed: number;
  focus: number; // -1 dimmed … 0 neutral … +1 focused
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
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x030405, 0.014);
    scene.fog = fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 80);
    camera.position.set(0, 0.6, 8.6);
    camera.lookAt(0, -0.1, 0);

    // ----- Lights: soft monochrome, orbiting for real depth -----
    const ambient = new THREE.AmbientLight(0x9aa5b3, 0.5);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x8b99ab, 0x07090c, 0.75);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xe9eff6, 1.9);
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

    const fill = new THREE.DirectionalLight(0x5f6e80, 0.55);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xbfd0e2, 0.95);
    scene.add(rim);

    // Center glow used during the opening ceremony.
    const centerLight = new THREE.PointLight(0xffffff, 0, 9);
    scene.add(centerLight);

    // ----- Ground shadow catcher -----
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.8;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- The inverted pyramid (9 layers, wide at top) -----
    const pyramid = new THREE.Group();
    scene.add(pyramid);

    const rigs: TierRig[] = [];
    for (let i = 0; i < N; i++) {
      const topR = R_TOP - i * SLOPE;
      const botR = R_TOP - (i + 1) * SLOPE;
      const geometry = new THREE.CylinderGeometry(topR, botR, TIER_H, 4, 1, false);

      // Obsidian / dark graphite — the higher ranks carry a touch more light.
      const light = 0.05 + (N - 1 - i) * 0.008; // apex (09) slightly refined
      const baseColor = new THREE.Color().setHSL(0.585, 0.1, Math.min(Math.max(light, 0.045), 0.15));

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.82 - (N - 1 - i) * 0.012,
        roughness: 0.46 - (N - 1 - i) * 0.016,
        envMapIntensity: 0.55 + (N - 1 - i) * 0.022,
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
      halo.scale.set(1.04, 1.02, 1.04);

      mesh.add(edges);
      mesh.add(halo);

      const group = new THREE.Group();
      group.add(mesh);
      pyramid.add(group);

      rigs.push({
        group, mesh, edges, halo, mat, edgeMat, haloMat, geometry,
        topR, botR, baseColor,
        speed: OMEGA,
        focus: 0,
      });
    }

    // ----- Seam rings: thin glowing lines between layers (appear on open) -----
    const seams: THREE.Mesh[] = [];
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xeef3fa,
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
      ring.position.y = 0;
      pyramid.add(ring);
      seams.push(ring);
    }

    // ----- Apex point: a small refined crest at the base of the pyramid -----
    const apex = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11),
      new THREE.MeshBasicMaterial({ color: 0xf4f8fd, transparent: true, opacity: 0.85 })
    );
    pyramid.add(apex);

    const apexHalo = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2),
      new THREE.MeshBasicMaterial({
        color: 0xeef3fa,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    pyramid.add(apexHalo);

    // ----- Barely-visible ambient dust -----
    const dustCount = 150;
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
        size: 0.02,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    scene.add(dust);

    // ----- Interaction (only meaningful after the pyramid opens) -----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const meshes = rigs.map((r) => r.mesh);
    let hovered: number | null = null;
    // Pointer for subtle camera parallax.
    const pointer = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      if (!openedRef.current) return;
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
      pointer.x = 0; pointer.y = 0;
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
    let gap = 0;              // current separation between layers
    let openProgress = 0;     // 0 closed … 1 fully open (drives seams & glow)
    const baseApexY = -((N - 1) / 2) * TIER_H - 0.15; // apex rests at the narrow bottom

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const active = activeRef.current;
      const isOpen = openedRef.current;

      // --- Opening ceremony ---
      const targetGap = isOpen ? GAP_OPEN : 0;
      gap += (targetGap - gap) * Math.min(1, dt * 1.6);
      const targetOpen = isOpen ? 1 : 0;
      openProgress += (targetOpen - openProgress) * Math.min(1, dt * 1.4);

      // Lay the layers out top-to-bottom with the animated gap.
      for (let i = 0; i < N; i++) {
        rigs[i].group.position.y = ((N - 1) / 2 - i) * (TIER_H + gap);
      }
      // Position seam rings inside the animated gaps.
      for (let i = 0; i < N - 1; i++) {
        seams[i].position.y = ((N - 1) / 2 - (i + 0.5)) * (TIER_H + gap);
      }
      apex.position.y = -(N - 1) / 2 * (TIER_H + gap) - 0.22;
      apexHalo.position.copy(apex.position);

      // --- Per-layer focus & rotation ---
      for (let i = 0; i < N; i++) {
        const rig = rigs[i];
        let target: number;
        if (active === null) target = 0;
        else if (active === i) target = 1;
        else target = -0.55;

        rig.focus += (target - rig.focus) * Math.min(1, dt * 6);

        const glow = Math.max(rig.focus, 0);
        const dim = Math.max(-rig.focus, 0);

        rig.mat.color.copy(rig.baseColor).multiplyScalar(1 + glow * 0.2 - dim * 0.38);
        const ei = glow * 0.55;
        rig.mat.emissive.setRGB(0.5 * ei, 0.56 * ei, 0.68 * ei);
        rig.mat.emissiveIntensity = 1.3;
        rig.mat.envMapIntensity = (0.55 + (N - 1 - i) * 0.022) + glow * 0.6;
        rig.edgeMat.opacity = Math.min(1, 0.14 + glow * 0.7 - dim * 0.1);
        rig.edgeMat.color.setHex(glow > 0.2 ? 0xffffff : 0xdfe8f2);
        rig.haloMat.opacity = glow * 0.3;

        // All layers rotate at the SAME speed & direction; hover pauses one.
        const targetSpeed = active === i ? 0 : OMEGA;
        rig.speed += (targetSpeed - rig.speed) * Math.min(1, dt * (targetSpeed === 0 ? 6 : 3.2));
        rig.mesh.rotation.y += rig.speed * dt;
      }

      // --- Sync-back easing is implicit: a paused layer, when released,
      //     accelerates (targetSpeed>0 branch) back toward the shared OMEGA.

      // Whole-structure float (extremely subtle — no wobble).
      pyramid.position.y = Math.sin(t * 0.3) * 0.05;
      pyramid.rotation.z = Math.sin(t * 0.13) * 0.002;

      // Opening ceremony: white light from the center + soft fog bloom.
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2);
      const openFlash = isOpen ? Math.min(openProgress * 1.6, 1) : 0;
      centerLight.intensity = openFlash * (2.2 + 0.8 * pulse);
      fog.density = 0.012 + openProgress * 0.012;

      // Seams + apex glow follow open progress.
      seamMat.opacity = openProgress * 0.32;
      apexHalo.material.opacity = 0.12 + openProgress * 0.14 + (0.03 * pulse);
      apex.material.opacity = 0.6 + openProgress * 0.32;
      const apexPulse = 0.85 + pulse * 0.2;
      apexHalo.scale.setScalar(1 + openProgress * 0.35);
      apex.scale.setScalar(apexPulse);

      // Orbiting lights to reveal true depth as it turns.
      const la = t * 0.2;
      key.position.set(Math.cos(la) * 8, 4.8, Math.sin(la) * 8);
      key.target.position.set(0, 0, 0);
      key.target.updateMatrixWorld();
      fill.position.set(-Math.cos(la) * 6.5, 2.0, -Math.sin(la) * 6.5);
      rim.position.set(Math.sin(la) * 5.5, 4.6, -Math.cos(la) * 5.5);

      // Barely-there dust drift.
      dust.rotation.y = t * 0.008;
      dust.rotation.x = Math.sin(t * 0.05) * 0.02;

      // Subtle camera breathing + pointer parallax (very restrained).
      const px = pointer.x * 0.5;
      const py = pointer.y * 0.28;
      camera.position.x = px + Math.sin(t * 0.11) * 0.12;
      camera.position.y = 0.6 + py + Math.sin(t * 0.17) * 0.05;
      camera.position.z = 8.6 + Math.sin(t * 0.05) * 0.15;
      camera.lookAt(0, -0.1, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // ----- Resize -----
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
      });
      seams.forEach((s) => { s.geometry.dispose(); });
      seamMat.dispose();
      apex.geometry.dispose();
      (apex.material as THREE.Material).dispose();
      apexHalo.geometry.dispose();
      (apexHalo.material as THREE.Material).dispose();
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
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
