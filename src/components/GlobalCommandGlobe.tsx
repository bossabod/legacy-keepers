"use client";
import React, { useEffect, useRef, useState } from "react";
import { OPERATIONAL_CITIES, EARTH_LAND_POINTS } from "@/lib/earth-data";

/* ==================================================================
   GlobalCommandGlobe — a command-center globe.
   • Dark 3D sphere, centered (middle of the page, slightly upper),
     no surrounding card/box, generous whitespace.
   • Continents drawn as small, dense, naturally-spaced dots.
   • Light lat/long grid, subtle rim lighting.
   • City nodes are small dots on the surface; a thin line leads from
     each dot to a small translucent label (name + clock + status).
   • Status colors: ACTIVE = teal/green, ALERT = amber/red, STANDBY = muted blue.
   • Interactive: drag to rotate (free, horizontal + vertical), wheel to
     zoom, smooth motion. Nodes/labels move with the surface.
   • Click a node to select it (highlight + enlarged label).
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
  ACTIVE:  { main: "95,174,131",  dim: "64,122,92" },    // deep emerald
  ALERT:   { main: "216,162,75",  dim: "160,118,48" },   // antique gold (warning)
  STANDBY: { main: "106,100,87",  dim: "78,72,62" }      // muted warm
};

/* anchor angle (deg, 0=right, -90=top) + distance multiplier */
const CITY_LABELS: Record<string, { angle: number; dist: number }> = {
  "NEW YORK": { angle: 225, dist: 1.62 },
  "LONDON":   { angle: 290, dist: 1.72 },
  "OSLO":     { angle: 340, dist: 1.66 },
  "RIYADH":   { angle: 25,  dist: 1.64 },
  "PERTH":    { angle: 150, dist: 1.66 },
};

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
      width = r.width; height = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let rotAngle = 150;
    let pitchAngle = 14;
    let zoom = 1.0;

    let isDragging = false;
    let lastX = 0, lastY = 0;
    let velLon = 0, velPitch = 0;
    let inactiveFrames = 9999;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX; lastY = e.clientY;
      velLon = 0; velPitch = 0;
      inactiveFrames = 0;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      rotAngle += dx * 0.35;
      pitchAngle = Math.max(-65, Math.min(65, pitchAngle - dy * 0.22));
      velLon = dx * 0.35; velPitch = -dy * 0.22;
      lastX = e.clientX; lastY = e.clientY;
      inactiveFrames = 0;
    };
    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(0.7, Math.min(1.7, zoom + (e.deltaY > 0 ? -0.08 : 0.08)));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.style.cursor = "grab";

    let time = 0;

    const formatClock = (tz: string) => {
      try {
        return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
      } catch { return "--:--:--"; }
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
        if (Math.abs(velLon) > 0.01) { rotAngle += velLon; velLon *= 0.95; }
        if (Math.abs(velPitch) > 0.01) { pitchAngle += velPitch; velPitch *= 0.95; }
        if (inactiveFrames > 180) {
          const blend = Math.min(1, (inactiveFrames - 180) / 120);
          rotAngle += 0.06 * blend;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // ===== Globe centered: middle of page, slightly upper =====
      const cx = width * 0.5;
      const cy = height * 0.46;
      const baseR = Math.min(width, height) * 0.34;
      const R = baseR * zoom;
      const camDist = 4.2 * R;

      // ===== subtle rim light (only around the edge) =====
      const rim = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      rim.addColorStop(0, "rgba(216,180,120,0.0)");
      rim.addColorStop(0.55, "rgba(216,180,120,0.05)");
      rim.addColorStop(0.82, "rgba(216,180,120,0.14)");
      rim.addColorStop(1, "transparent");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // ===== dark sphere body =====
      const lx = cx + R * 0.4, ly = cy - R * 0.4;
      const sg = ctx.createRadialGradient(lx, ly, 0, cx, cy, R);
      sg.addColorStop(0, "#1a150d");
      sg.addColorStop(0.4, "#0c0a07");
      sg.addColorStop(0.78, "#050403");
      sg.addColorStop(1, "#020201");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.995, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(216,180,120,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ===== lat/long grid (very light) =====
      const pr = (pitchAngle * Math.PI) / 180;
      const cp = Math.cos(pr), sp = Math.sin(pr);
      ctx.strokeStyle = "rgba(138,112,68,0.05)";
      ctx.lineWidth = 0.7;
      for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
        ctx.beginPath(); let first = true;
        const latR = (latDeg * Math.PI) / 180, cosL = Math.cos(latR), sinL = Math.sin(latR);
        for (let lonDeg = -180; lonDeg <= 180; lonDeg += 6) {
          const lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR), y0 = -R * sinL, z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp;
          if (z1 > -0.05 * R) { const k = camDist / (camDist - z1); const sx = cx + x0 * k, sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy); }
          else first = true;
        }
        ctx.stroke();
      }
      for (let lonBase = 0; lonBase < 360; lonBase += 24) {
        ctx.beginPath(); let first = true;
        for (let latDeg = -90; latDeg <= 90; latDeg += 6) {
          const latR = (latDeg * Math.PI) / 180, cosL = Math.cos(latR), sinL = Math.sin(latR);
          const lonR = ((lonBase + rotAngle) * Math.PI) / 180;
          const x0 = R * cosL * Math.sin(lonR), y0 = -R * sinL, z0 = R * cosL * Math.cos(lonR);
          const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp;
          if (z1 > -0.05 * R) { const k = camDist / (camDist - z1); const sx = cx + x0 * k, sy = cy + y1 * k;
            if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy); }
          else first = true;
        }
        ctx.stroke();
      }

      // ===== Continents: small dense natural dots =====
      const lightDirX = 0.5, lightDirY = -0.45, lightDirZ = 0.72;
      for (let i = 0; i < EARTH_LAND_POINTS.length; i++) {
        const [latDeg, lonDeg] = EARTH_LAND_POINTS[i];
        const latR = (latDeg * Math.PI) / 180, lonR = ((lonDeg + rotAngle) * Math.PI) / 180;
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
          if (lAlign > 0.35) ctx.fillStyle = `rgba(216,180,120,${a})`;
          else if (lAlign > -0.1) ctx.fillStyle = `rgba(160,140,90,${a * 0.8})`;
          else ctx.fillStyle = `rgba(90,80,55,${a * 0.5})`;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ===== City nodes + thin line to small translucent label =====
      const drawn: { x: number; y: number; w: number; h: number }[] = [];

      OPERATIONAL_CITIES.forEach((city, idx) => {
        const st = NODE_STATE[city.name]?.status ?? "STANDBY";
        const col = STATUS_COLOR[st];
        const pt = project(city.lat, city.lon, R, cx, cy, camDist);
        if (!pt.visible || pt.z < -0.1 * R) return;
        const fade = Math.min(1, Math.max(0, (pt.z + 0.1 * R) / (0.35 * R)));
        const isSel = selectedRef.current === city.name;

        // node dot on the surface
        const nodeR = (isSel ? 4.2 : 2.8) + (isSel ? 0 : 0.6 * Math.sin(time * 2.5 + idx));
        ctx.fillStyle = `rgba(${col.main},${0.9 * fade})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, nodeR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${col.main},${0.7 * fade})`;
        ctx.lineWidth = isSel ? 1.4 : 1;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, nodeR + 2.5, 0, Math.PI * 2); ctx.stroke();

        // label anchor
        const def = CITY_LABELS[city.name];
        const aRad = (def.angle * Math.PI) / 180;
        const dist = R * def.dist;
        let tx = cx + dist * Math.cos(aRad);
        let ty = cy + dist * Math.sin(aRad);

        // label size depends on content
        const nameW = city.name.length * 6.4;
        const boxW = isSel ? nameW + 44 : nameW + 30;
        const boxH = isSel ? 44 : 30;
        tx = Math.max(30 + boxW / 2, Math.min(width - 30 - boxW / 2, tx));
        ty = Math.max(30 + boxH / 2, Math.min(height - 30 - boxH / 2, ty));

        // overlap nudge upward
        let overlaps = drawn.some((d) => tx < d.x + d.w + 6 && tx + boxW + 6 > d.x && ty < d.y + d.h + 6 && ty + boxH + 6 > d.y);
        if (overlaps) ty = Math.max(30 + boxH / 2, ty - boxH - 8);
        drawn.push({ x: tx - boxW / 2, y: ty - boxH / 2, w: boxW, h: boxH });

        // thin connector line from dot to label
        ctx.strokeStyle = `rgba(${col.dim},${0.45 * fade})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // small translucent label
        const bx = tx - boxW / 2, by = ty - boxH / 2;
        ctx.fillStyle = `rgba(8,7,5,${0.8 * fade})`;
        ctx.strokeStyle = `rgba(216,180,120,${0.35 * fade})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 5);
        ctx.fill();
        ctx.stroke();

        // status dot inside label
        ctx.fillStyle = `rgba(${col.main},${0.95 * fade})`;
        ctx.beginPath(); ctx.arc(bx + 8, by + boxH / 2, 2, 0, Math.PI * 2); ctx.fill();

        // name
        ctx.fillStyle = `rgba(228,221,204,${fade})`;
        ctx.font = `600 ${isSel ? 10.5 : 9}px var(--font-ibm-mono), monospace`;
        ctx.textAlign = "left";
        ctx.fillText(city.name, bx + 14, by + (isSel ? 14 : 12));

        // clock + status (smaller, below name)
        const tzStr = formatClock(city.tz);
        ctx.font = `500 ${isSel ? 9 : 8}px var(--font-ibm-mono), monospace`;
        if (isSel) {
          ctx.fillStyle = `rgba(178,170,150,${0.9 * fade})`;
          ctx.fillText(tzStr, bx + 14, by + 26);
          ctx.fillStyle = `rgba(${col.main},${0.9 * fade})`;
          ctx.fillText(st, bx + 14, by + 37);
        } else {
          ctx.fillStyle = `rgba(178,170,150,${0.85 * fade})`;
          ctx.fillText(tzStr, bx + 14, by + 22);
        }
      });

      // HUD text — small, not overpowering
      ctx.fillStyle = "rgba(216,180,120,0.34)";
      ctx.font = "500 9px var(--font-ibm-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillText("GLOBAL COMMAND NETWORK · 5 NODES · DRAG · SCROLL ZOOM", width / 2, 22);

      rafId = requestAnimationFrame(render);
    };

    render();

    // click to select nearest node
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const cx = width * 0.5, cy = height * 0.46;
      const baseR = Math.min(width, height) * 0.34;
      const R = baseR * zoom, camDist = 4.2 * R;
      let best: string | null = null, bestD = 26;
      OPERATIONAL_CITIES.forEach((city) => {
        const pt = project(city.lat, city.lon, R, cx, cy, camDist);
        const d = Math.hypot(mx - pt.x, my - pt.y);
        if (d < bestD) { bestD = d; best = city.name; }
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
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none" style={{ touchAction: "none" }} />
    </div>
  );
}
