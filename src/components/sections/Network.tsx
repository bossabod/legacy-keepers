"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, ChevronDown, Layers } from "lucide-react";
import { play } from "@/lib/sound";
import {
  NET_NODES, NET_LINKS,
  MOUNTAIN_ZONES, WATER_ZONES, METRO_ZONES, REGION_ZONES, ROAD_ACTIVITY,
} from "@/lib/gis-overlay";

// ===== CDN Loaders =====
function loadCSS(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) { resolve(); return; }
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Leaflet CDN failed"));
    document.head.appendChild(s);
  });
}

// ===== City Database =====
interface City { id: string; name: string; country: string; flag: string; center: [number, number]; zoom: number; bounds: [[number, number], [number, number]] }

const CITIES: City[] = [
  // USA
  { id: "nyc", name: "New York City", country: "United States", flag: "🇺🇸", center: [40.7589, -73.9851], zoom: 13, bounds: [[40.40, -74.30], [40.95, -73.65]] },
  { id: "la", name: "Los Angeles", country: "United States", flag: "🇺🇸", center: [34.0522, -118.2437], zoom: 12, bounds: [[33.70, -118.70], [34.40, -118.00]] },
  { id: "chi", name: "Chicago", country: "United States", flag: "🇺🇸", center: [41.8781, -87.6298], zoom: 12, bounds: [[41.60, -87.90], [42.10, -87.30]] },
  { id: "sf", name: "San Francisco", country: "United States", flag: "🇺🇸", center: [37.7749, -122.4194], zoom: 13, bounds: [[37.60, -122.60], [37.90, -122.20]] },
  { id: "sea", name: "Seattle", country: "United States", flag: "🇺🇸", center: [47.6062, -122.3321], zoom: 12, bounds: [[47.45, -122.50], [47.80, -122.10]] },
  { id: "mia", name: "Miami", country: "United States", flag: "🇺🇸", center: [25.7617, -80.1918], zoom: 12, bounds: [[25.55, -80.35], [26.00, -80.00]] },
  { id: "dc", name: "Washington DC", country: "United States", flag: "🇺🇸", center: [38.8977, -77.0365], zoom: 13, bounds: [[38.75, -77.20], [39.05, -76.85]] },
  // Türkiye
  { id: "ist", name: "Istanbul", country: "Türkiye", flag: "🇹🇷", center: [41.0082, 28.9784], zoom: 12, bounds: [[40.80, 28.50], [41.30, 29.50]] },
  // Saudi Arabia
  { id: "ruh", name: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", center: [24.7136, 46.6753], zoom: 12, bounds: [[24.45, 46.45], [25.05, 46.95]] },
  // UAE
  { id: "auh", name: "Abu Dhabi", country: "United Arab Emirates", flag: "🇦🇪", center: [24.4539, 54.3773], zoom: 12, bounds: [[24.25, 54.20], [24.65, 54.60]] },
  // Sweden
  { id: "sto", name: "Stockholm", country: "Sweden", flag: "🇸🇪", center: [59.3293, 18.0686], zoom: 12, bounds: [[59.15, 17.80], [59.50, 18.40]] },
  { id: "gbr", name: "Gothenburg", country: "Sweden", flag: "🇸🇪", center: [57.7089, 11.9746], zoom: 12, bounds: [[57.55, 11.75], [57.80, 12.20]] },
  // Norway
  { id: "osl", name: "Oslo", country: "Norway", flag: "🇳🇴", center: [59.9139, 10.7522], zoom: 12, bounds: [[59.80, 10.50], [60.05, 11.00]] },
  { id: "bgo", name: "Bergen", country: "Norway", flag: "🇳🇴", center: [60.3913, 5.3221], zoom: 12, bounds: [[60.25, 5.10], [60.55, 5.60]] },
  // UK
  { id: "lon", name: "London", country: "United Kingdom", flag: "🇬🇧", center: [51.5074, -0.1278], zoom: 12, bounds: [[51.30, -0.35], [51.70, 0.15]] },
  { id: "man", name: "Manchester", country: "United Kingdom", flag: "🇬🇧", center: [53.4808, -2.2426], zoom: 12, bounds: [[53.35, -2.40], [53.60, -2.05]] },
  // Canada
  { id: "tor", name: "Toronto", country: "Canada", flag: "🇨🇦", center: [43.6532, -79.3832], zoom: 12, bounds: [[43.50, -79.55], [43.80, -79.15]] },
  { id: "van", name: "Vancouver", country: "Canada", flag: "🇨🇦", center: [49.2827, -123.1207], zoom: 12, bounds: [[49.10, -123.30], [49.45, -122.90]] },
  // Australia
  { id: "syd", name: "Sydney", country: "Australia", flag: "🇦🇺", center: [-33.8688, 151.2093], zoom: 12, bounds: [[-34.00, 150.90], [-33.70, 151.50]] },
  { id: "mel", name: "Melbourne", country: "Australia", flag: "🇦🇺", center: [-37.8136, 144.9631], zoom: 12, bounds: [[-38.00, 144.70], [-37.60, 145.20]] },
  { id: "bne", name: "Brisbane", country: "Australia", flag: "🇦🇺", center: [-27.4698, 153.0251], zoom: 12, bounds: [[-27.60, 152.85], [-27.30, 153.25]] },
  // Thailand
  { id: "bkk", name: "Bangkok", country: "Thailand", flag: "🇹🇭", center: [13.7563, 100.5018], zoom: 12, bounds: [[13.55, 100.30], [13.95, 100.80]] },
  { id: "cnx", name: "Chiang Mai", country: "Thailand", flag: "🇹🇭", center: [18.7883, 98.9853], zoom: 12, bounds: [[18.65, 98.85], [18.95, 99.15]] },
  { id: "hkt", name: "Phuket", country: "Thailand", flag: "🇹🇭", center: [7.8804, 98.3923], zoom: 12, bounds: [[7.70, 98.20], [8.10, 98.55]] },
];

// Group cities by country
const COUNTRIES = Array.from(new Set(CITIES.map(c => c.country)));

// ===== Sleep helper =====
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Draw a filled lat/lon polygon on the overlay canvas (GIS tint layer). */
function drawPoly(
  ctx: CanvasRenderingContext2D,
  poly: [number, number][],
  proj: (ll: [number, number]) => { x: number; y: number },
  fill: string
) {
  ctx.beginPath();
  let started = false;
  for (const ll of poly) {
    const p = proj(ll);
    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export default function NetworkSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [effectLevel, setEffectLevel] = useState(0);
  const [showOverlays, setShowOverlays] = useState(true);
  const showOverlaysRef = useRef(true);
  useEffect(() => { showOverlaysRef.current = showOverlays; }, [showOverlays]);
  const netCanvasRef = useRef<HTMLCanvasElement>(null);
  const netRAFRef = useRef<number>(0);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    let map: any = null;
    (async () => {
      loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: currentCity.center,
        zoom: currentCity.zoom,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: currentCity.bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20, crossOrigin: true,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;

      // ===== Network Canvas Overlay — direct render loop, pixel-perfect =====
      const netCanvas = netCanvasRef.current;
      if (netCanvas) {
        const nctx = netCanvas.getContext("2d");
        if (nctx) {
          let time = 0;
          let lastT = performance.now();

          const renderNet = () => {
            const now = performance.now();
            const dt = Math.min(50, now - lastT);
            lastT = now;
            time += dt * 0.001;

            const w = netCanvas.width;
            const h = netCanvas.height;
            const z = map.getZoom();

            nctx.clearRect(0, 0, w, h);

            // Only draw network when zoomed out (world/regional view)
            const opacity = z > 9.5 ? 0 : z > 8 ? 1 - (z - 8) / 1.5 : 1;

            if (opacity > 0.01 && showOverlaysRef.current) {
              nctx.globalAlpha = opacity;
              const proj = (ll: [number, number]) => {
                const p = map.latLngToContainerPoint(ll);
                return { x: p.x, y: p.y };
              };

              // ---- Water tint (very dark navy) ----
              for (const poly of WATER_ZONES) {
                drawPoly(nctx, poly, proj, "rgba(7,19,31,0.22)");
              }

              // ---- Mountain tint (very dark forest green) ----
              for (const poly of MOUNTAIN_ZONES) {
                drawPoly(nctx, poly, proj, "rgba(24,50,34,0.16)");
              }

              // ---- Regional activity zones (faint blurred dark-red circles) ----
              for (const rz of REGION_ZONES) {
                const p = proj([rz.lat, rz.lon]);
                const r = rz.radius * 6.4;
                const g = nctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
                g.addColorStop(0, `rgba(122,42,52,${0.10 * rz.activity})`);
                g.addColorStop(1, "transparent");
                nctx.fillStyle = g;
                nctx.beginPath(); nctx.arc(p.x, p.y, r, 0, Math.PI * 2); nctx.fill();
              }

              // ---- Road activity glow along metro corridors ----
              for (const road of ROAD_ACTIVITY) {
                const A = proj(road[0]), B = proj(road[1]);
                const grad = nctx.createLinearGradient(A.x, A.y, B.x, B.y);
                grad.addColorStop(0, "rgba(122,42,52,0.22)");
                grad.addColorStop(1, "rgba(122,42,52,0.22)");
                nctx.strokeStyle = grad;
                nctx.lineWidth = 5;
                nctx.lineCap = "round";
                nctx.beginPath(); nctx.moveTo(A.x, A.y); nctx.lineTo(B.x, B.y); nctx.stroke();
              }

              // ---- Urban density heat (city centre → suburbs) ----
              for (const mz of METRO_ZONES) {
                const p = proj([mz.lat, mz.lon]);
                const r = mz.radius * 4.6;
                const g = nctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
                g.addColorStop(0, `rgba(122,42,52,${0.34 * mz.intensity})`);
                g.addColorStop(0.4, `rgba(122,42,52,${0.18 * mz.intensity})`);
                g.addColorStop(1, "transparent");
                nctx.fillStyle = g;
                nctx.beginPath(); nctx.arc(p.x, p.y, r, 0, Math.PI * 2); nctx.fill();
              }

              // Project all nodes to screen coordinates
              const screenNodes = NET_NODES.map(n => {
                const p = map.latLngToContainerPoint([n.lat, n.lon]);
                return { x: p.x, y: p.y, size: n.size, label: n.label, isHQ: !!n.isHQ };
              });

              // Draw connection lines
              for (const link of NET_LINKS) {
                const a = link.a, b = link.b;
                const na = screenNodes[a], nb = screenNodes[b];
                if (!na || !nb) continue;
                // Cull off-screen lines
                const minX = Math.min(na.x, nb.x), maxX = Math.max(na.x, nb.x);
                const minY = Math.min(na.y, nb.y), maxY = Math.max(na.y, nb.y);
                if (maxX < 0 || minX > w || maxY < 0 || minY > h) continue;

                nctx.strokeStyle = "rgba(160,175,200,0.18)";
                nctx.lineWidth = 0.5;
                nctx.beginPath();
                nctx.moveTo(na.x, na.y);
                nctx.lineTo(nb.x, nb.y);
                nctx.stroke();

                // Data pulse traveling along the line
                const speed = 0.15 + (a * 0.012 + b * 0.008);
                const cycle = ((time * speed) % 1);
                const px = na.x + (nb.x - na.x) * cycle;
                const py = na.y + (nb.y - na.y) * cycle;
                const pulseAlpha = Math.sin(cycle * Math.PI) * 0.6;
                nctx.fillStyle = `rgba(200,215,240,${pulseAlpha})`;
                nctx.beginPath();
                nctx.arc(px, py, 1.2, 0, Math.PI * 2);
                nctx.fill();
              }

              // Draw nodes
              for (let i = 0; i < screenNodes.length; i++) {
                const n = screenNodes[i];
                if (n.x < -20 || n.x > w + 20 || n.y < -20 || n.y > h + 20) continue;

                const phaseOffset = i * 0.7; // Different pulse timing per node
                const pulseT = (time + phaseOffset) % 3.0; // 3-second cycle

                // Ring 1 — outer expanding ring
                if (pulseT < 1.5) {
                  const ringProgress = pulseT / 1.5;
                  const ringR = n.size + ringProgress * n.size * 3;
                  const ringAlpha = (1 - ringProgress) * 0.3;
                  nctx.strokeStyle = `rgba(200,215,240,${ringAlpha})`;
                  nctx.lineWidth = 0.8;
                  nctx.beginPath();
                  nctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
                  nctx.stroke();
                }

                // Ring 2 — second expanding ring (offset timing)
                const pulseT2 = (time + phaseOffset + 1.5) % 3.0;
                if (pulseT2 < 1.5) {
                  const ringProgress = pulseT2 / 1.5;
                  const ringR = n.size + ringProgress * n.size * 2.5;
                  const ringAlpha = (1 - ringProgress) * 0.2;
                  nctx.strokeStyle = `rgba(200,215,240,${ringAlpha})`;
                  nctx.lineWidth = 0.6;
                  nctx.beginPath();
                  nctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
                  nctx.stroke();
                }

                // Outer glow
                const glowGrad = nctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 2);
                glowGrad.addColorStop(0, n.isHQ ? "rgba(255,255,255,0.2)" : "rgba(200,215,240,0.12)");
                glowGrad.addColorStop(1, "transparent");
                nctx.fillStyle = glowGrad;
                nctx.beginPath();
                nctx.arc(n.x, n.y, n.size * 2, 0, Math.PI * 2);
                nctx.fill();

                // Core
                nctx.fillStyle = n.isHQ ? "#ffffff" : "rgba(220,230,245,0.9)";
                nctx.beginPath();
                nctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
                nctx.fill();

                // HQ label
                if (n.isHQ) {
                  nctx.fillStyle = "rgba(180,195,215,0.6)";
                  nctx.font = "500 7px var(--font-mono), monospace";
                  nctx.textAlign = "center";
                  nctx.fillText("OSLO", n.x, n.y - n.size - 4);
                }
              }

              nctx.globalAlpha = 1;
            }

            netRAFRef.current = requestAnimationFrame(renderNet);
          };
          renderNet();

          // Resize canvas to match container
          const resizeCanvas = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect && netCanvas) {
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              netCanvas.width = rect.width * dpr;
              netCanvas.height = rect.height * dpr;
              netCanvas.style.width = rect.width + "px";
              netCanvas.style.height = rect.height + "px";
              nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
          };
          resizeCanvas();
          window.addEventListener("resize", resizeCanvas);
        }
      }
    })();

    return () => {
      if (netRAFRef.current) cancelAnimationFrame(netRAFRef.current);
      if (map) map.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Cinematic 3-stage transition =====
  const flyToCity = async (city: City) => {
    const map = mapRef.current;
    if (!map || transitioning) return;

    setTransitioning(true);
    setSelectorOpen(false);

    map.setMaxBounds(undefined);
    map.setMinZoom(1);

    const startZoom = map.getZoom();

    // ── 0. Freeze — dramatic hold before departure (0.9s)
    await sleep(900);

    // ── ZOOM OUT STAGE 1: Slow pull back, medium blur, slight darken
    map.flyTo(map.getCenter(), Math.max(startZoom - 2, 10), { duration: 0.6, easeLinearity: 0.15 });
    setEffectLevel(0.3);
    await sleep(620);
    // Camera lock impact — brief hold
    setEffectLevel(0.35);
    await sleep(250);

    // ── ZOOM OUT STAGE 2: Further out, stronger blur, darker
    map.flyTo(map.getCenter(), Math.max(startZoom - 5, 7), { duration: 0.55, easeLinearity: 0.15 });
    setEffectLevel(0.6);
    await sleep(570);
    // Camera lock impact
    setEffectLevel(0.65);
    await sleep(250);

    // ── ZOOM OUT STAGE 3: Furthest, heavy blur, almost black
    map.flyTo(map.getCenter(), 4, { duration: 0.5, easeLinearity: 0.15 });
    setEffectLevel(0.9);
    await sleep(520);
    // Brief hold at near-black
    await sleep(200);
    setEffectLevel(1.0); // Full black

    // ── SWITCH: Screen is fully black — instantly teleport to destination at HIGH altitude
    // Start far above the city so the arrival feels like descending from the sky
    const arrivalStartZoom = Math.max(city.zoom - 5, 4); // Very far away
    map.setView(city.center, arrivalStartZoom, { animate: false });
    // Let tiles begin loading at the destination
    await sleep(250);

    // ── ZOOM IN STAGE 1: Descending from very high altitude — heavy blur, still dark
    // Travel a large distance (from arrivalStartZoom toward city.zoom - 2)
    map.flyTo(city.center, city.zoom - 2, { duration: 0.6, easeLinearity: 0.15 });
    setEffectLevel(0.85); // Still heavy blur, mostly dark
    await sleep(620);
    // Camera lock impact — first beat of arrival
    setEffectLevel(0.8);
    await sleep(250);

    // ── ZOOM IN STAGE 2: Closer descent — blur decreasing, brightness returning
    map.flyTo(city.center, city.zoom - 0.5, { duration: 0.55, easeLinearity: 0.15 });
    setEffectLevel(0.5); // Noticeably clearer
    await sleep(570);
    // Camera lock impact
    setEffectLevel(0.45);
    await sleep(250);

    // ── ZOOM IN STAGE 3: Final descent into the city — full sharpness
    map.flyTo(city.center, city.zoom, { duration: 0.5, easeLinearity: 0.2 });
    setEffectLevel(0.15);
    await sleep(400);
    setEffectLevel(0); // Perfectly clear — camera settled
    await sleep(150);

    // Lock to new city
    map.setMaxBounds(city.bounds);
    map.setMinZoom(11);
    setCurrentCity(city);
    setTransitioning(false);
  };

  // Close selector on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0d]" style={{ height: "calc(100vh - 60px)" }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* City Selector */}
      <div ref={selectorRef} className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="flex items-center gap-2.5 rounded-xl border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 text-[0.76rem] font-medium text-[#c3c9d3] hover:text-white hover:border-[#2a2f38] transition-all duration-300 shadow-lg"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <MapPin size={14} className="text-[#565d68]" />
          <span className="flex items-center gap-1.5">
            <span className="text-base leading-none">{currentCity.flag}</span>
            {currentCity.name}
          </span>
          <ChevronDown size={13} className={`text-[#565d68] transition-transform duration-300 ${selectorOpen ? "rotate-180" : ""}`} />
        </button>

        {selectorOpen && (
          <div className="absolute top-full left-0 mt-2 w-[280px] max-h-[500px] overflow-y-auto scroll-thin rounded-xl border border-[#1a1d22] bg-[#0a0b0e]/95 backdrop-blur-xl py-2 shadow-2xl">
            {COUNTRIES.map(country => (
              <div key={country}>
                <div className="px-3.5 py-1.5 text-[0.54rem] font-bold uppercase tracking-[0.14em] text-[#2e333c] flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="text-sm">{CITIES.find(c => c.country === country)?.flag}</span>
                  {country}
                </div>
                {CITIES.filter(c => c.country === country).map(city => (
                  <button
                    key={city.id}
                    onClick={() => flyToCity(city)}
                    disabled={transitioning || city.id === currentCity.id}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.74rem] transition-colors duration-200
                      ${city.id === currentCity.id ? "text-white bg-white/[0.06]" : "text-[#6b7383] hover:text-[#c3c9d3] hover:bg-white/[0.03]"}
                      disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <MapPin size={11} className="shrink-0 text-[#3a4049]" />
                    {city.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Global Network Canvas Overlay (independent layer above the
             base map; hidden entirely when toggled off, revealing the
             original map exactly as-is) ===== */}
      <canvas
        ref={netCanvasRef}
        className="pointer-events-none absolute inset-0 z-[400]"
        style={{ opacity: showOverlays ? 1 : 0, transition: "opacity 0.4s ease" }}
      />

      {/* Overlay toggle — GIS layers on/off */}
      <button
        onClick={() => { setShowOverlays((v) => !v); play("click"); }}
        className="absolute bottom-5 left-4 z-[1000] flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#1a1d22] bg-[#0a0b0e]/90 px-3 py-2 text-[0.6rem] tracking-[0.12em] text-[#6b7383] backdrop-blur-md transition hover:border-[#2a2f38] hover:text-[#c3c9d3]"
        style={{ fontFamily: "var(--font-mono)" }}
        aria-pressed={showOverlays}
      >
        <Layers size={12} className={showOverlays ? "text-[#c3c9d3]" : "text-[#3a4049]"} />
        {showOverlays ? "OVERLAYS ON" : "OVERLAYS OFF"}
      </button>

      {/* ===== Cinematic visual effects ===== */}
      {/* Blur + gradual darkening overlay — smooth continuous transition */}
      <div
        className="pointer-events-none absolute inset-0 z-[500]"
        style={{
          opacity: effectLevel > 0 ? 1 : 0,
          transition: "opacity 0.35s ease, backdrop-filter 0.45s ease, background 0.5s ease",
          backdropFilter: `blur(${effectLevel * 10}px)`,
          WebkitBackdropFilter: `blur(${effectLevel * 10}px)`,
          background: effectLevel >= 0.98
            ? "#050608"
            : `radial-gradient(ellipse at center, transparent ${Math.max(5, 25 - effectLevel * 25)}%, rgba(5,6,8,${effectLevel * 0.8}) 100%)`,
        }}
      />

      {/* Transition status indicator */}
      {transitioning && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-xl border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 shadow-lg"
          style={{ marginBottom: effectLevel * 30 }}>
          <div className="h-3.5 w-3.5 rounded-full border-2 border-[#2a2f38] border-t-[#565d68] animate-spin" />
          <span className="text-[0.66rem] tracking-[0.12em] text-[#565d68]" style={{ fontFamily: "var(--font-mono)" }}>
            NAVIGATING
          </span>
        </div>
      )}
    </div>
  );
}
