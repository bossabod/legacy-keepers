"use client";
import React, { useEffect, useRef } from "react";
import { OPERATIONAL_CITIES, EARTH_LAND_POINTS } from "@/lib/earth-data";

interface GlobalCommandGlobeProps {
  className?: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
}

// Pre-assigned label anchor angles and heights for natural asymmetric distribution
// Each city gets a target position around the globe (angle in degrees from right, distance multiplier)
interface CityLabel {
  angle: number;     // angle around globe center (0=right, -90=top, 180=left)
  distMult: number;  // distance from globe center as multiple of R
  offsetX: number;   // fine horizontal adjustment in px
  offsetY: number;   // fine vertical adjustment in px
}

const CITY_LABELS: Record<string, CityLabel> = {
  "NEW YORK": { angle: 210, distMult: 1.55, offsetX: 0, offsetY: -8 },
  "LONDON":   { angle: 268, distMult: 1.78, offsetX: 0, offsetY: -4 },
  "OSLO":     { angle: 325, distMult: 1.62, offsetX: 0, offsetY: -10 },
  "RIYADH":   { angle: 18,  distMult: 1.58, offsetX: 4, offsetY: 6 },
  "PERTH":    { angle: 155, distMult: 1.60, offsetX: -4, offsetY: 14 },
};

export default function GlobalCommandGlobe({ className = "" }: GlobalCommandGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // ===== Responsive resize =====
    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ===== 3D background particles =====
    const particles: Particle3D[] = Array.from({ length: 55 }, () => ({
      x: (Math.random() - 0.5) * 900,
      y: (Math.random() - 0.5) * 700,
      z: (Math.random() - 0.5) * 700,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      vz: (Math.random() - 0.5) * 0.18,
      size: 0.8 + Math.random() * 1.8,
      alpha: 0.1 + Math.random() * 0.28,
    }));

    // ===== Globe state =====
    let rotAngle = 120;       // longitude rotation (degrees)
    let pitchAngle = 14;      // pitch / tilt (degrees)
    let zoom = 1.0;           // zoom level (0.65 to 1.7)

    // ===== Drag interaction state =====
    let isDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;
    let dragVelLon = 0;       // inertia velocity for longitude
    let inactiveFrames = 9999; // frames since last interaction (for auto-resume)

    // ===== Mouse handlers =====
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      dragVelLon = 0;
      inactiveFrames = 0;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastDragX;
      const dy = e.clientY - lastDragY;
      // Free rotation in every direction (longitude + pitch)
      const rotDelta = dx * 0.35;
      const pitchDelta = -dy * 0.22;
      rotAngle += rotDelta;
      pitchAngle = Math.max(-65, Math.min(65, pitchAngle + pitchDelta));
      dragVelLon = rotDelta;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      inactiveFrames = 0;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      inactiveFrames = 0;
      canvas.style.cursor = "grab";
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };

    // Zoom and panning are intentionally disabled — globe position is permanently fixed

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.style.cursor = "grab";

    // ===== Time & radar =====
    let time = 0;
    let radarTimer = 0;
    let radarWaves: { radius: number; alpha: number }[] = [];

    // ===== Format live digital clock =====
    const formatCityClock = (tz: string) => {
      try {
        return new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
      } catch {
        return "--:--:--";
      }
    };

    // ===== 3D projection helper =====
    // Projects a lat/lon point on the sphere to screen coordinates
    const projectPoint = (
      latDeg: number,
      lonDeg: number,
      R: number,
      cx: number,
      cy: number,
      camDist: number
    ): { x: number; y: number; z: number; visible: boolean } => {
      const latR = (latDeg * Math.PI) / 180;
      const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
      const cosL = Math.cos(latR);
      const sinL = Math.sin(latR);

      // Base sphere coordinates
      const x0 = R * cosL * Math.sin(lonR);
      const y0 = -R * sinL;
      const z0 = R * cosL * Math.cos(lonR);

      // Apply pitch rotation (rotation around X-axis)
      const pitchR = (pitchAngle * Math.PI) / 180;
      const cosP = Math.cos(pitchR);
      const sinP = Math.sin(pitchR);

      const x1 = x0;
      const y1 = y0 * cosP - z0 * sinP;
      const z1 = y0 * sinP + z0 * cosP;

      const k = camDist / (camDist - z1);
      const sx = cx + x1 * k;
      const sy = cy + y1 * k;
      const visible = z1 > -0.05 * R;

      return { x: sx, y: sy, z: z1, visible };
    };

    // ===== Main render loop =====
    const render = () => {
      time += 0.016;

      // Auto-rotation + inertia logic (horizontal only)
      if (!isDragging) {
        inactiveFrames++;
        // Apply inertia decay
        if (Math.abs(dragVelLon) > 0.01) {
          rotAngle += dragVelLon;
          dragVelLon *= 0.95;
        }
        // Auto-resume slow rotation after 3 seconds of inactivity (~180 frames)
        if (inactiveFrames > 180) {
          const autoSpeed = 0.08; // ~75 seconds per full rotation
          const blend = Math.min(1, (inactiveFrames - 180) / 120);
          rotAngle += autoSpeed * blend;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // ===== Globe placement: centered, shifted slightly down =====
      const isDesktop = width >= 1024;
      const cx = isDesktop ? width * 0.36 : width * 0.5;
      const cy = isDesktop ? height * 0.58 : height * 0.46;
      const baseR = isDesktop ? Math.min(width, height) * 0.32 : Math.min(width, height) * 0.28;
      const R = baseR * zoom; // Apply zoom
      const camDist = 4 * R;

      // ===== Background fog patches =====
      for (let i = 0; i < 3; i++) {
        const fx = width * (0.2 + i * 0.3 + 0.05 * Math.sin(time * 0.1 + i));
        const fy = height * (0.3 + i * 0.2 + 0.03 * Math.cos(time * 0.08 + i));
        const fRadius = 280 + i * 40;
        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius);
        grad.addColorStop(0, `rgba(20, 24, 32, ${0.10 + i * 0.02})`);
        grad.addColorStop(0.6, `rgba(12, 15, 22, 0.05)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx, fy, fRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== Background particles =====
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.x < -450) p.x = 450; if (p.x > 450) p.x = -450;
        if (p.y < -350) p.y = 350; if (p.y > 350) p.y = -350;
        if (p.z < -350) p.z = 350; if (p.z > 350) p.z = -350;

        const k = camDist / (camDist - p.z);
        const px = cx + p.x * k;
        const py = cy + p.y * k;
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.fillStyle = `rgba(174,182,194,${p.alpha * (0.5 + 0.5 * Math.sin(time + p.x * 0.01))})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * k * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ===== Radar ripple (expanding circles from globe center every ~4s) =====
      radarTimer += 0.016;
      if (radarTimer > 4.0) {
        radarTimer = 0;
        radarWaves.push({ radius: R * 0.98, alpha: 0.35 });
      }
      radarWaves = radarWaves.filter((w) => {
        w.radius += 1.2;
        w.alpha *= 0.98;
        if (w.alpha < 0.01) return false;
        ctx.strokeStyle = `rgba(239,68,68,${w.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, w.radius, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });

      // ===== Atmosphere glow around Earth =====
      const atmGrad = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.22);
      atmGrad.addColorStop(0, "rgba(120,160,220,0.04)");
      atmGrad.addColorStop(0.6, "rgba(140,165,210,0.10)");
      atmGrad.addColorStop(0.85, "rgba(160,180,220,0.14)");
      atmGrad.addColorStop(1, "transparent");
      ctx.fillStyle = atmGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // ===== Dark ocean sphere body with premium metallic lighting =====
      const lx = cx + R * 0.35;
      const ly = cy - R * 0.35;
      const sphereGrad = ctx.createRadialGradient(lx, ly, 0, cx, cy, R);
      sphereGrad.addColorStop(0, "#222a37");
      sphereGrad.addColorStop(0.35, "#0f141d");
      sphereGrad.addColorStop(0.75, "#06080c");
      sphereGrad.addColorStop(1, "#020304");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.992, 0, Math.PI * 2);
      ctx.fill();

      // Subtle metallic border
      ctx.strokeStyle = "rgba(195,201,211,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ===== Wireframe grid (latitudes & longitudes) =====
      const pitchR = (pitchAngle * Math.PI) / 180;
      const cosP = Math.cos(pitchR);
      const sinP = Math.sin(pitchR);

      ctx.strokeStyle = "rgba(174,182,194,0.05)";
      ctx.lineWidth = 0.8;

      // Parallels
      for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
        ctx.beginPath();
        let first = true;
        const latR = (latDeg * Math.PI) / 180;
        const cosL = Math.cos(latR);
        const sinL = Math.sin(latR);
        for (let lonDeg = -180; lonDeg <= 180; lonDeg += 5) {
          const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR);
          const y0 = -R * sinL;
          const z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cosP - z0 * sinP;
          const z1 = y0 * sinP + z0 * cosP;
          if (z1 > -0.05 * R) {
            const k = camDist / (camDist - z1);
            const sx = cx + x0 * k;
            const sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; }
            else ctx.lineTo(sx, sy);
          } else first = true;
        }
        ctx.stroke();
      }

      // Meridians
      for (let lonBase = 0; lonBase < 360; lonBase += 20) {
        ctx.beginPath();
        let first = true;
        for (let latDeg = -90; latDeg <= 90; latDeg += 5) {
          const latR = (latDeg * Math.PI) / 180;
          const cosL = Math.cos(latR);
          const sinL = Math.sin(latR);
          const lonR = ((lonBase + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR);
          const y0 = -R * sinL;
          const z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cosP - z0 * sinP;
          const z1 = y0 * sinP + z0 * cosP;
          if (z1 > -0.05 * R) {
            const k = camDist / (camDist - z1);
            const sx = cx + x0 * k;
            const sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; }
            else ctx.lineTo(sx, sy);
          } else first = true;
        }
        ctx.stroke();
      }

      // ===== Continents: illuminated land points with day/night & night lights =====
      const lightDirX = 0.45;
      const lightDirY = -0.45;
      const lightDirZ = 0.77;

      for (let i = 0; i < EARTH_LAND_POINTS.length; i++) {
        const [latDeg, lonDeg] = EARTH_LAND_POINTS[i];
        const latR = (latDeg * Math.PI) / 180;
        const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
        const cosL = Math.cos(latR);
        const sinL = Math.sin(latR);

        const x0 = R * cosL * Math.sin(lonR);
        const y0 = -R * sinL;
        const z0 = R * cosL * Math.cos(lonR);

        const y1 = y0 * cosP - z0 * sinP;
        const z1 = y0 * sinP + z0 * cosP;

        if (z1 > -0.12 * R) {
          const k = camDist / (camDist - z1);
          const sx = cx + x0 * k;
          const sy = cy + y1 * k;

          // Normal vector for lighting (normalized direction from center)
          const nx = x0 / R;
          const ny = y1 / R;
          const nz = z1 / R;

          // Light alignment (dot product with light direction)
          const lAlign = nx * lightDirX + ny * lightDirY + nz * lightDirZ;
          const fadeZ = Math.max(0, z1 / R);
          const dotAlpha = Math.min(1, Math.max(0.06, fadeZ * 0.7 + Math.max(0, lAlign) * 0.4));
          const dotR = Math.max(0.7, (0.9 + fadeZ * 0.7) * (isDesktop ? 1.0 : 0.85));

          if (lAlign > 0.35) {
            // Day side: bright silver/white
            ctx.fillStyle = `rgba(234,238,245,${dotAlpha})`;
          } else if (lAlign > -0.1) {
            // Twilight: silver
            ctx.fillStyle = `rgba(170,180,195,${dotAlpha * 0.85})`;
          } else {
            // Night side: subtle warm night lights (very dim)
            ctx.fillStyle = `rgba(120,110,90,${dotAlpha * 0.3})`;
          }

          ctx.beginPath();
          ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ===== Inter-city great circle connection arcs (animated routes across continents) =====
      const CITY_PAIRS: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [0, 2], [1, 3], [0, 3], [1, 4], [3, 4],
      ];
      CITY_PAIRS.forEach((pair, pairIdx) => {
        const cA = OPERATIONAL_CITIES[pair[0]];
        const cB = OPERATIONAL_CITIES[pair[1]];
        const pA = projectPoint(cA.lat, cA.lon, R, cx, cy, camDist);
        const pB = projectPoint(cB.lat, cB.lon, R, cx, cy, camDist);
        if (!pA.visible || !pB.visible) return;
        if (pA.z < -0.05 * R || pB.z < -0.05 * R) return;

        const fadeArc = Math.min(pA.z, pB.z) > 0 ? 1 : 0.5;

        // Draw arc with midpoint lifted above surface
        const arcMidX = (pA.x + pB.x) / 2;
        const arcMidY = (pA.y + pB.y) / 2 - R * 0.22;
        ctx.strokeStyle = `rgba(239,68,68,${0.18 * fadeArc})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.quadraticCurveTo(arcMidX, arcMidY, pB.x, pB.y);
        ctx.stroke();

        // Animated data pulse traveling along the arc
        const arcSpeed = 0.15 + pairIdx * 0.03;
        const arcProgress = (time * arcSpeed + pairIdx * 0.15) % 1;
        const u = arcProgress;
        const apx = (1 - u) * (1 - u) * pA.x + 2 * (1 - u) * u * arcMidX + u * u * pB.x;
        const apy = (1 - u) * (1 - u) * pA.y + 2 * (1 - u) * u * arcMidY + u * u * pB.y;
        const aprevU = Math.max(0, arcProgress - 0.06);
        const atx = (1 - aprevU) * (1 - aprevU) * pA.x + 2 * (1 - aprevU) * aprevU * arcMidX + aprevU * aprevU * pB.x;
        const aty = (1 - aprevU) * (1 - aprevU) * pA.y + 2 * (1 - aprevU) * aprevU * arcMidY + aprevU * aprevU * pB.y;
        const arcGrad = ctx.createLinearGradient(atx, aty, apx, apy);
        arcGrad.addColorStop(0, "transparent");
        arcGrad.addColorStop(0.7, `rgba(239,68,68,${0.5 * fadeArc})`);
        arcGrad.addColorStop(1, `rgba(255,200,200,${0.8 * fadeArc})`);
        ctx.strokeStyle = arcGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(atx, aty);
        ctx.lineTo(apx, apy);
        ctx.stroke();
      });

      // ===== Operational Cities: connection lines, pulses, labels & clocks =====
      const drawnLabels: { x: number; y: number; w: number; h: number }[] = [];

      OPERATIONAL_CITIES.forEach((city, cIdx) => {
        const pt = projectPoint(city.lat, city.lon, R, cx, cy, camDist);
        if (!pt.visible || pt.z < -0.1 * R) return;

        const fade = Math.min(1, Math.max(0, (pt.z + 0.1 * R) / (0.35 * R)));

        // === A. Red pulse ring at globe contact point ===
        const pulseR = 5 + 3 * Math.sin(time * 3 + cIdx * 1.3);
        const pulseAlpha = 0.4 + 0.3 * Math.sin(time * 3 + cIdx * 1.3);

        // Enhanced bloom glow (stronger, more visible)
        const bloomGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pulseR * 3);
        bloomGrad.addColorStop(0, `rgba(239,68,68,${0.6 * fade})`);
        bloomGrad.addColorStop(0.4, `rgba(239,68,68,${0.25 * fade})`);
        bloomGrad.addColorStop(1, "transparent");
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseR * 3, 0, Math.PI * 2);
        ctx.fill();

        // Pulse ring (more visible)
        ctx.strokeStyle = `rgba(239,68,68,${pulseAlpha * fade})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing core node (larger, brighter)
        ctx.fillStyle = `rgba(248,113,113,${fade})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // === B. Calculate label target position (natural distribution) ===
        const labelDef = CITY_LABELS[city.name];
        const labelAngleRad = (labelDef.angle * Math.PI) / 180;
        const labelDist = R * labelDef.distMult;
        let tx = cx + labelDist * Math.cos(labelAngleRad) + labelDef.offsetX;
        let ty = cy + labelDist * Math.sin(labelAngleRad) + labelDef.offsetY;

        // Clamp within card bounds with margin (larger labels)
        const margin = isDesktop ? 14 : 10;
        const boxW = isDesktop ? 148 : 128;
        const boxH = isDesktop ? 48 : 40;

        tx = Math.max(margin + boxW / 2, Math.min(width - margin - boxW / 2, tx));
        ty = Math.max(margin + boxH / 2 + 10, Math.min(height - margin - boxH / 2, ty));

        // === C. Draw connection line (from city surface to label) — more visible ===
        const midX = (pt.x + tx) / 2;
        const midY = (pt.y + ty) / 2 - 8;
        ctx.strokeStyle = `rgba(239,68,68,${0.75 * fade})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.quadraticCurveTo(midX, midY, tx, ty);
        ctx.stroke();

        // === D. Data transmission pulses (3 packets, brighter) ===
        const lineLen = Math.hypot(tx - pt.x, ty - pt.y);
        if (lineLen > 10) {
          const numPackets = 3;
          for (let pIdx = 0; pIdx < numPackets; pIdx++) {
            const speed = 0.3 + cIdx * 0.04;
            const progress = (time * speed + pIdx * 0.5 + cIdx * 0.2) % 1;
            // Quadratic bezier interpolation
            const u = progress;
            const px = (1 - u) * (1 - u) * pt.x + 2 * (1 - u) * u * midX + u * u * tx;
            const py = (1 - u) * (1 - u) * pt.y + 2 * (1 - u) * u * midY + u * u * ty;

            // Tail
            const prevU = Math.max(0, progress - 0.08);
            const tailX = (1 - prevU) * (1 - prevU) * pt.x + 2 * (1 - prevU) * prevU * midX + prevU * prevU * tx;
            const tailY = (1 - prevU) * (1 - prevU) * pt.y + 2 * (1 - prevU) * prevU * midY + prevU * prevU * ty;

            const pktGrad = ctx.createLinearGradient(tailX, tailY, px, py);
            pktGrad.addColorStop(0, "transparent");
            pktGrad.addColorStop(0.6, `rgba(239,68,68,${0.7 * fade})`);
            pktGrad.addColorStop(1, `rgba(255,255,255,${fade})`);
            ctx.strokeStyle = pktGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(px, py);
            ctx.stroke();
          }
        }

        // === E. Draw city label & clock box ===
        const bx = tx - boxW / 2;
        const by = ty - boxH / 2;

        // Check overlap with previously drawn labels (simple AABB)
        let overlaps = false;
        for (const dl of drawnLabels) {
          if (
            bx < dl.x + dl.w + 4 &&
            bx + boxW + 4 > dl.x &&
            by < dl.y + dl.h + 4 &&
            by + boxH + 4 > dl.y
          ) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) {
          // Nudge label upward to avoid overlap
          const nudgedBy = by - boxH - 6;
          const nudgedTy = Math.max(margin + boxH / 2 + 10, nudgedBy + boxH / 2);
          const nBx = tx - boxW / 2;
          const nBy = nudgedTy - boxH / 2;
          drawnLabels.push({ x: nBx, y: nBy, w: boxW, h: boxH });
          drawLabelBox(ctx, nBx, nBy, boxW, boxH, city, fade, isDesktop, formatCityClock, time);
          // Redraw line to nudged position
          ctx.strokeStyle = `rgba(239,68,68,${0.5 * fade})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(tx, nBy + boxH / 2);
          ctx.stroke();
        } else {
          drawnLabels.push({ x: bx, y: by, w: boxW, h: boxH });
          drawLabelBox(ctx, bx, by, boxW, boxH, city, fade, isDesktop, formatCityClock, time);
        }
      });

      // ===== HUD text =====
      ctx.fillStyle = "rgba(174,182,194,0.4)";
      ctx.font = "500 9.5px var(--font-ibm-mono), monospace";
      ctx.textAlign = "left";
      ctx.fillText("GLOBAL COMMAND NETWORK · 5 NODES · DRAG TO ROTATE · SCROLL TO ZOOM", 16, 24);

      rafId = requestAnimationFrame(render);
    };

    // ===== Helper: draw a city label box =====
    function drawLabelBox(
      ctx: CanvasRenderingContext2D,
      bx: number,
      by: number,
      boxW: number,
      boxH: number,
      city: { name: string; tzAbbr: string; tz: string },
      fade: number,
      isDesktop: boolean,
      formatClock: (tz: string) => string,
      time: number
    ) {
      // Background
      ctx.fillStyle = `rgba(8,10,14,${0.9 * fade})`;
      ctx.strokeStyle = `rgba(195,201,211,${0.25 * fade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 7);
      ctx.fill();
      ctx.stroke();

      // Left red status bar
      ctx.fillStyle = `rgba(239,68,68,${0.85 * fade})`;
      ctx.beginPath();
      ctx.roundRect(bx, by, 3, boxH, [7, 0, 0, 7]);
      ctx.fill();

      // City name (larger)
      ctx.fillStyle = `rgba(234,238,245,${fade})`;
      ctx.font = `${isDesktop ? "600 12px" : "600 10px"} var(--font-ibm-sans), system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(city.name, bx + 11, by + (isDesktop ? 18 : 15));

      // Live clock (larger)
      const timeStr = formatClock(city.tz);
      ctx.fillStyle = `rgba(195,201,211,${0.9 * fade})`;
      ctx.font = `${isDesktop ? "500 12px" : "500 10px"} var(--font-ibm-mono), monospace`;
      ctx.fillText(timeStr, bx + 11, by + (isDesktop ? 36 : 30));

      // TZ abbreviation (right side)
      const tzAbbr = city.tzAbbr;
      ctx.fillStyle = `rgba(239,68,68,${0.7 * fade})`;
      ctx.font = `${isDesktop ? "600 10px" : "600 8.5px"} var(--font-ibm-mono), monospace`;
      ctx.textAlign = "right";
      ctx.fillText(tzAbbr, bx + boxW - 9, by + (isDesktop ? 18 : 15));
    }

    render();

    // ===== Cleanup =====
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
