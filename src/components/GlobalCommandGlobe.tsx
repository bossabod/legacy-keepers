"use client";
import React, { useEffect, useRef, useState } from "react";
import { OPERATIONAL_CITIES, EARTH_LAND_POINTS } from "@/lib/earth-data";

/* ==================================================================
   GlobalCommandGlobe — command-center globe.
   • Fixed size (no zoom / no pinch / no scroll-zoom)
   • Drag-only rotation (smooth inertia)
   • Stable initial camera: Europe · Africa · Asia in view
   • City nodes + connector labels unchanged
   ================================================================== */

interface NodeState { status: "ACTIVE" | "ALERT" | "STANDBY"; }

const NODE_STATE: Record<string, NodeState> = {
  "NEW YORK": { status: "ACTIVE" },
  "LONDON":   { status: "ACTIVE" },
  "RIYADH":   { status: "ALERT" },
  "OSLO":     { status: "STANDBY" },
  "PERTH":    { status: "STANDBY" },
};

const STATUS_COLOR: Record<NodeState["status"], { main: string; dim: string }> = {
  ACTIVE:  { main: "180,180,180", dim: "120,120,120" },
  ALERT:   { main: "140,140,140", dim: "90,90,90" },
  STANDBY: { main: "100,100,100", dim: "70,70,70" },
};

/* anchor angle (deg, 0=right, -90=top) + distance multiplier */
const CITY_LABELS: Record<string, { angle: number; dist: number }> = {
  "NEW YORK": { angle: 225, dist: 1.58 },
  "LONDON":   { angle: 290, dist: 1.66 },
  "OSLO":     { angle: 340, dist: 1.62 },
  "RIYADH":   { angle: 25,  dist: 1.60 },
  "PERTH":    { angle: 150, dist: 1.62 },
};

/**
 * Fixed initial orientation so Europe / Africa / Asia face the camera
 * every time the page opens. rotAngle is longitude offset in the
 * projection (higher ≈ rotate west features toward center).
 */
const INITIAL_ROT = -20;   // centers Afro-Eurasia
const INITIAL_PITCH = 12;  // slight north tilt, global overview
/** Fixed scale — never modified by user input */
const FIXED_ZOOM = 1.12;

export default function GlobalCommandGlobe({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let width = 0, height = 0, dpr = 1;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const r = canvas.parentElement.getBoundingClientRect();
      width = r.width;
      height = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Always start from the same camera — never randomized
    let rotAngle = INITIAL_ROT;
    let pitchAngle = INITIAL_PITCH;
    const zoom = FIXED_ZOOM; // const — size never changes

    let isDragging = false;
    let lastX = 0, lastY = 0;
    let velLon = 0, velPitch = 0;
    let inactiveFrames = 9999;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velLon = 0;
      velPitch = 0;
      inactiveFrames = 0;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      // Smooth drag rotation only — no size change
      rotAngle += dx * 0.32;
      pitchAngle = Math.max(-55, Math.min(55, pitchAngle - dy * 0.2));
      velLon = dx * 0.32;
      velPitch = -dy * 0.2;
      lastX = e.clientX;
      lastY = e.clientY;
      inactiveFrames = 0;
    };
    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    /** Block all zoom / pinch / ctrl-wheel gestures */
    const blockZoom = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", blockZoom, { passive: false });
    canvas.addEventListener("gesturestart", blockZoom as EventListener, { passive: false } as AddEventListenerOptions);
    canvas.addEventListener("gesturechange", blockZoom as EventListener, { passive: false } as AddEventListenerOptions);
    canvas.addEventListener("gestureend", blockZoom as EventListener, { passive: false } as AddEventListenerOptions);
    canvas.style.cursor = "grab";
    // Prevent browser pinch-zoom on the canvas
    canvas.style.touchAction = "none";

    let time = 0;

    const formatClock = (tz: string) => {
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

    const project = (latDeg: number, lonDeg: number, R: number, cx: number, cy: number, camDist: number) => {
      const latR = (latDeg * Math.PI) / 180;
      const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
      const cosL = Math.cos(latR), sinL = Math.sin(latR);
      const x0 = R * cosL * Math.sin(lonR);
      const y0 = -R * sinL;
      const z0 = R * cosL * Math.cos(lonR);
      const pr = (pitchAngle * Math.PI) / 180;
      const cp = Math.cos(pr), sp = Math.sin(pr);
      const x1 = x0;
      const y1 = y0 * cp - z0 * sp;
      const z1 = y0 * sp + z0 * cp;
      const k = camDist / (camDist - z1);
      return { x: cx + x1 * k, y: cy + y1 * k, z: z1, visible: z1 > -0.05 * R };
    };

    const render = () => {
      time += 0.016;

      if (!isDragging) {
        inactiveFrames++;
        // Soft inertia after drag — rotation only
        if (Math.abs(velLon) > 0.01) {
          rotAngle += velLon;
          velLon *= 0.94;
        }
        if (Math.abs(velPitch) > 0.01) {
          pitchAngle = Math.max(-55, Math.min(55, pitchAngle + velPitch));
          velPitch *= 0.94;
        }
        // Gentle auto-spin when idle (does not change size)
        if (inactiveFrames > 200) {
          const blend = Math.min(1, (inactiveFrames - 200) / 140);
          rotAngle += 0.045 * blend;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Globe centered — scale with the shorter side, leave room for labels
      const cx = width * 0.5;
      const cy = height * 0.50;
      const short = Math.min(width, height);
      // Narrow phones: smaller sphere; wide desktops: up to 0.40
      const scale =
        short < 360 ? 0.30 :
        short < 520 ? 0.34 :
        short < 720 ? 0.37 :
        0.40;
      const baseR = short * scale;
      const R = baseR * zoom; // zoom is constant
      const camDist = 4.2 * R;
      // Label padding scales with viewport so names never clip the frame
      const edgePad = Math.max(10, Math.min(28, short * 0.04));

      // subtle rim light
      const rim = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      rim.addColorStop(0, "rgba(170,170,170,0.0)");
      rim.addColorStop(0.55, "rgba(170,170,170,0.05)");
      rim.addColorStop(0.82, "rgba(170,170,170,0.14)");
      rim.addColorStop(1, "transparent");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // dark sphere body
      const lx = cx + R * 0.4, ly = cy - R * 0.4;
      const sg = ctx.createRadialGradient(lx, ly, 0, cx, cy, R);
      sg.addColorStop(0, "#1a1a1a");
      sg.addColorStop(0.4, "#0a0a0a");
      sg.addColorStop(0.78, "#050505");
      sg.addColorStop(1, "#020202");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.995, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(170,170,170,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // lat/long grid
      const pr = (pitchAngle * Math.PI) / 180;
      const cp = Math.cos(pr), sp = Math.sin(pr);
      ctx.strokeStyle = "rgba(100,100,100,0.05)";
      ctx.lineWidth = 0.7;
      for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
        ctx.beginPath();
        let first = true;
        const latR = (latDeg * Math.PI) / 180, cosL = Math.cos(latR), sinL = Math.sin(latR);
        for (let lonDeg = -180; lonDeg <= 180; lonDeg += 6) {
          const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR), y0 = -R * sinL, z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp;
          if (z1 > -0.05 * R) {
            const k = camDist / (camDist - z1);
            const sx = cx + x0 * k, sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
          } else first = true;
        }
        ctx.stroke();
      }
      for (let lonBase = 0; lonBase < 360; lonBase += 24) {
        ctx.beginPath();
        let first = true;
        for (let latDeg = -90; latDeg <= 90; latDeg += 6) {
          const latR = (latDeg * Math.PI) / 180, cosL = Math.cos(latR), sinL = Math.sin(latR);
          const lonR = ((lonBase + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR), y0 = -R * sinL, z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp;
          if (z1 > -0.05 * R) {
            const k = camDist / (camDist - z1);
            const sx = cx + x0 * k, sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
          } else first = true;
        }
        ctx.stroke();
      }

      // Continents
      const lightDirX = 0.5, lightDirY = -0.45, lightDirZ = 0.72;
      for (let i = 0; i < EARTH_LAND_POINTS.length; i++) {
        const [latDeg, lonDeg] = EARTH_LAND_POINTS[i];
        const latR = (latDeg * Math.PI) / 180;
        const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
        const cosL = Math.cos(latR), sinL = Math.sin(latR);
        const x0 = R * cosL * Math.sin(lonR), y0 = -R * sinL, z0 = R * cosL * Math.cos(lonR);
        const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp;
        if (z1 > -0.1 * R) {
          const k = camDist / (camDist - z1);
          const sx = cx + x0 * k, sy = cy + y1 * k;
          const nx = x0 / R, ny = y1 / R, nz = z1 / R;
          const lAlign = nx * lightDirX + ny * lightDirY + nz * lightDirZ;
          const fadeZ = Math.max(0, z1 / R);
          const a = Math.min(1, Math.max(0.05, fadeZ * 0.6 + Math.max(0, lAlign) * 0.4));
          const r = Math.max(0.5, (0.7 + fadeZ * 0.5) * 0.75);
          if (lAlign > 0.35) ctx.fillStyle = `rgba(170,170,170,${a})`;
          else if (lAlign > -0.1) ctx.fillStyle = `rgba(130,130,130,${a * 0.8})`;
          else ctx.fillStyle = `rgba(40,40,40,${a * 0.5})`;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // City nodes + labels
      const drawn: { x: number; y: number; w: number; h: number }[] = [];

      OPERATIONAL_CITIES.forEach((city, idx) => {
        const st = NODE_STATE[city.name]?.status ?? "STANDBY";
        const col = STATUS_COLOR[st];
        const pt = project(city.lat, city.lon, R, cx, cy, camDist);
        if (!pt.visible || pt.z < -0.1 * R) return;
        const fade = Math.min(1, Math.max(0, (pt.z + 0.1 * R) / (0.35 * R)));
        const isSel = selectedRef.current === city.name;

        const nodeR = (isSel ? 4.2 : 2.8) + (isSel ? 0 : 0.6 * Math.sin(time * 2.5 + idx));
        ctx.fillStyle = `rgba(${col.main},${0.9 * fade})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, nodeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${col.main},${0.7 * fade})`;
        ctx.lineWidth = isSel ? 1.4 : 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, nodeR + 2.5, 0, Math.PI * 2);
        ctx.stroke();

        const def = CITY_LABELS[city.name];
        const aRad = (def.angle * Math.PI) / 180;
        const dist = R * def.dist;
        let tx = cx + dist * Math.cos(aRad);
        let ty = cy + dist * Math.sin(aRad);

        const nameW = city.name.length * 6.4;
        const boxW = isSel ? nameW + 44 : nameW + 30;
        const boxH = isSel ? 44 : 30;
        // Keep labels inside the container bounds
        tx = Math.max(edgePad + boxW / 2, Math.min(width - edgePad - boxW / 2, tx));
        ty = Math.max(edgePad + boxH / 2, Math.min(height - edgePad - boxH / 2, ty));

        const overlaps = drawn.some(
          (d) => tx < d.x + d.w + 6 && tx + boxW + 6 > d.x && ty < d.y + d.h + 6 && ty + boxH + 6 > d.y,
        );
        if (overlaps) ty = Math.max(edgePad + boxH / 2, ty - boxH - 8);
        drawn.push({ x: tx - boxW / 2, y: ty - boxH / 2, w: boxW, h: boxH });

        ctx.strokeStyle = `rgba(${col.dim},${0.45 * fade})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        const bx = tx - boxW / 2, by = ty - boxH / 2;
        ctx.fillStyle = `rgba(8,8,8,${0.8 * fade})`;
        ctx.strokeStyle = `rgba(170,170,170,${0.35 * fade})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(${col.main},${0.95 * fade})`;
        ctx.beginPath();
        ctx.arc(bx + 8, by + boxH / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(228,228,228,${fade})`;
        const fName = short < 400 ? (isSel ? 9 : 8) : (isSel ? 10.5 : 9);
        ctx.font = `600 ${fName}px var(--font-ibm-mono), monospace`;
        ctx.textAlign = "left";
        ctx.fillText(city.name, bx + 14, by + (isSel ? 14 : 12));

        const tzStr = formatClock(city.tz);
        const fSub = short < 400 ? (isSel ? 8 : 7) : (isSel ? 9 : 8);
        ctx.font = `500 ${fSub}px var(--font-ibm-mono), monospace`;
        if (isSel) {
          ctx.fillStyle = `rgba(178,178,178,${0.9 * fade})`;
          ctx.fillText(tzStr, bx + 14, by + 26);
          ctx.fillStyle = `rgba(${col.main},${0.9 * fade})`;
          ctx.fillText(st, bx + 14, by + 37);
        } else {
          ctx.fillStyle = `rgba(178,178,178,${0.85 * fade})`;
          ctx.fillText(tzStr, bx + 14, by + 22);
        }
      });

      rafId = requestAnimationFrame(render);
    };

    render();

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const cx = width * 0.5, cy = height * 0.50;
      const short = Math.min(width, height);
      const scale = short < 360 ? 0.30 : short < 520 ? 0.34 : short < 720 ? 0.37 : 0.40;
      const baseR = short * scale;
      const R = baseR * zoom, camDist = 4.2 * R;
      let best: string | null = null, bestD = 26;
      OPERATIONAL_CITIES.forEach((city) => {
        const pt = project(city.lat, city.lon, R, cx, cy, camDist);
        const d = Math.hypot(mx - pt.x, my - pt.y);
        if (d < bestD) {
          bestD = d;
          best = city.name;
        }
      });
      selectedRef.current = best && selectedRef.current === best ? null : best;
      force((n) => n + 1);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", blockZoom);
      canvas.removeEventListener("gesturestart", blockZoom as EventListener);
      canvas.removeEventListener("gesturechange", blockZoom as EventListener);
      canvas.removeEventListener("gestureend", blockZoom as EventListener);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div
      data-globe
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ touchAction: "none", overscrollBehavior: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ touchAction: "none", display: "block" }}
      />
    </div>
  );
}
