"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { generateCityNodes, type IntelNode } from "@/lib/city-nodes";

/* Leaflet is imported dynamically inside the effect (client-only) so the
   server render never evaluates `window`. Imported locally (npm), so the
   map does NOT depend on any external CDN. */

/* Build a clean radial-gradient divIcon for a white intelligence node.
   Transparency (not blur) via alpha gradients: centre bright, edges fade
   smoothly. The map (roads/buildings/terrain) stays fully sharp beneath.
   Hub nodes are 2–3× larger and occasionally deep red. Georeferenced. */
function nodeIcon(L: any, n: IntelNode) {
  const base = n.isHub ? 18 : 6 + n.weight * 2.5;
  const color = n.hubRed ? "#b32020" : "#ffffff";
  const html = `
    <div class="intel-node" style="
      width:${base * 2}px;height:${base * 2}px;
      background:radial-gradient(circle, ${color}59 0%, ${color}26 42%, ${color}0d 68%, ${color}00 82%);
    "></div>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [base * 2, base * 2],
    iconAnchor: [base, base],
    interactive: false,
  });
}

/* Build a thin 1px white connection line between two nodes. No glow,
   no blur, no animation — a subtle local communication mesh. */
function linkLatLngs(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  return [[a.lat, a.lon], [b.lat, b.lon]] as [number, number][];
}

/** Pair each node with ONE nearby node (small local network), skipping
    pairs already used so lines never cross randomly everywhere. */
function buildLocalLinks(nodes: IntelNode[]): [number, number][] {
  const links: [number, number][] = [];
  const used = new Set<number>();
  for (let i = 0; i < nodes.length; i++) {
    if (used.has(i)) continue;
    let best = -1, bestD = Infinity;
    for (let j = 0; j < nodes.length; j++) {
      if (j === i || used.has(j)) continue;
      const d = Math.hypot(nodes[i].lat - nodes[j].lat, nodes[i].lon - nodes[j].lon);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0) {
      links.push([i, best]);
      used.add(i);
      used.add(best);
    }
  }
  return links;
}

/* ==================================================================
   Network — city-limited intelligence map.

   The base map is restored to its ORIGINAL state exactly: same tiles,
   colors, roads, zoom, camera, navigation and animations. No filters,
   no recolouring, no street overlays, no heatmaps.

   The ONLY modification is a set of small pure-white intelligence
   nodes, generated logically per city (downtown, business districts,
   ports, airports, universities, government, tech parks, financial
   centres, intersections). Nodes are georeferenced Leaflet markers:
   they pan/zoom with the map, scale naturally, and load only for the
   active city. A very subtle CSS pulse is the only animation.
   ================================================================== */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface City {
  id: string; name: string; country: string; flag: string;
  center: [number, number]; zoom: number; bounds: [[number, number], [number, number]];
}

const CITIES: City[] = [
  { id: "nyc", name: "New York City", country: "United States", flag: "🇺🇸", center: [40.7589, -73.9851], zoom: 13, bounds: [[40.40, -74.30], [40.95, -73.65]] },
  { id: "la", name: "Los Angeles", country: "United States", flag: "🇺🇸", center: [34.0522, -118.2437], zoom: 12, bounds: [[33.70, -118.70], [34.40, -118.00]] },
  { id: "chi", name: "Chicago", country: "United States", flag: "🇺🇸", center: [41.8781, -87.6298], zoom: 12, bounds: [[41.60, -87.90], [42.10, -87.30]] },
  { id: "sf", name: "San Francisco", country: "United States", flag: "🇺🇸", center: [37.7749, -122.4194], zoom: 13, bounds: [[37.60, -122.60], [37.90, -122.20]] },
  { id: "sea", name: "Seattle", country: "United States", flag: "🇺🇸", center: [47.6062, -122.3321], zoom: 12, bounds: [[47.45, -122.50], [47.80, -122.10]] },
  { id: "mia", name: "Miami", country: "United States", flag: "🇺🇸", center: [25.7617, -80.1918], zoom: 12, bounds: [[25.55, -80.35], [26.00, -80.00]] },
  { id: "dc", name: "Washington DC", country: "United States", flag: "🇺🇸", center: [38.8977, -77.0365], zoom: 13, bounds: [[38.75, -77.20], [39.05, -76.85]] },
  { id: "ist", name: "Istanbul", country: "Türkiye", flag: "🇹🇷", center: [41.0082, 28.9784], zoom: 12, bounds: [[40.80, 28.50], [41.30, 29.50]] },
  { id: "ruh", name: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", center: [24.7136, 46.6753], zoom: 12, bounds: [[24.45, 46.45], [25.05, 46.95]] },
  { id: "auh", name: "Abu Dhabi", country: "United Arab Emirates", flag: "🇦🇪", center: [24.4539, 54.3773], zoom: 12, bounds: [[24.25, 54.20], [24.65, 54.60]] },
  { id: "dxb", name: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", center: [25.2048, 55.2708], zoom: 12, bounds: [[24.90, 54.95], [25.45, 55.55]] },
  { id: "sto", name: "Stockholm", country: "Sweden", flag: "🇸🇪", center: [59.3293, 18.0686], zoom: 12, bounds: [[59.15, 17.80], [59.50, 18.40]] },
  { id: "gbr", name: "Gothenburg", country: "Sweden", flag: "🇸🇪", center: [57.7089, 11.9746], zoom: 12, bounds: [[57.55, 11.75], [57.80, 12.20]] },
  { id: "osl", name: "Oslo", country: "Norway", flag: "🇳🇴", center: [59.9139, 10.7522], zoom: 12, bounds: [[59.80, 10.50], [60.05, 11.00]] },
  { id: "bgo", name: "Bergen", country: "Norway", flag: "🇳🇴", center: [60.3913, 5.3221], zoom: 12, bounds: [[60.25, 5.10], [60.55, 5.60]] },
  { id: "lon", name: "London", country: "United Kingdom", flag: "🇬🇧", center: [51.5074, -0.1278], zoom: 12, bounds: [[51.30, -0.35], [51.70, 0.15]] },
  { id: "man", name: "Manchester", country: "United Kingdom", flag: "🇬🇧", center: [53.4808, -2.2426], zoom: 12, bounds: [[53.35, -2.40], [53.60, -2.05]] },
  { id: "par", name: "Paris", country: "France", flag: "🇫🇷", center: [48.8566, 2.3522], zoom: 12, bounds: [[48.70, 2.15], [49.05, 2.60]] },
  { id: "ber", name: "Berlin", country: "Germany", flag: "🇩🇪", center: [52.52, 13.405], zoom: 12, bounds: [[52.34, 13.09], [52.68, 13.76]] },
  { id: "tor", name: "Toronto", country: "Canada", flag: "🇨🇦", center: [43.6532, -79.3832], zoom: 12, bounds: [[43.50, -79.55], [43.80, -79.15]] },
  { id: "van", name: "Vancouver", country: "Canada", flag: "🇨🇦", center: [49.2827, -123.1207], zoom: 12, bounds: [[49.10, -123.30], [49.45, -122.90]] },
  { id: "mex", name: "Mexico City", country: "Mexico", flag: "🇲🇽", center: [19.4326, -99.1332], zoom: 12, bounds: [[19.20, -99.35], [19.60, -98.90]] },
  { id: "sao", name: "São Paulo", country: "Brazil", flag: "🇧🇷", center: [-23.5505, -46.6333], zoom: 12, bounds: [[-23.75, -46.85], [-23.35, -46.40]] },
  { id: "syd", name: "Sydney", country: "Australia", flag: "🇦🇺", center: [-33.8688, 151.2093], zoom: 12, bounds: [[-34.00, 150.90], [-33.70, 151.50]] },
  { id: "mel", name: "Melbourne", country: "Australia", flag: "🇦🇺", center: [-37.8136, 144.9631], zoom: 12, bounds: [[-38.00, 144.70], [-37.60, 145.20]] },
  { id: "bne", name: "Brisbane", country: "Australia", flag: "🇦🇺", center: [-27.4698, 153.0251], zoom: 12, bounds: [[-27.60, 152.85], [-27.30, 153.25]] },
  { id: "bkk", name: "Bangkok", country: "Thailand", flag: "🇹🇭", center: [13.7563, 100.5018], zoom: 12, bounds: [[13.55, 100.30], [13.95, 100.80]] },
  { id: "cnx", name: "Chiang Mai", country: "Thailand", flag: "🇹🇭", center: [18.7883, 98.9853], zoom: 12, bounds: [[18.65, 98.85], [18.95, 99.15]] },
  { id: "sgp", name: "Singapore", country: "Singapore", flag: "🇸🇬", center: [1.3521, 103.8198], zoom: 12, bounds: [[1.20, 103.60], [1.50, 104.05]] },
  { id: "tyo", name: "Tokyo", country: "Japan", flag: "🇯🇵", center: [35.6762, 139.6503], zoom: 12, bounds: [[35.50, 139.40], [35.90, 139.95]] },
  { id: "soul", name: "Seoul", country: "South Korea", flag: "🇰🇷", center: [37.5665, 126.978], zoom: 12, bounds: [[37.40, 126.80], [37.75, 127.15]] },
  { id: "bom", name: "Mumbai", country: "India", flag: "🇮🇳", center: [19.076, 72.8777], zoom: 12, bounds: [[18.85, 72.65], [19.35, 73.10]] },
  { id: "del", name: "Delhi", country: "India", flag: "🇮🇳", center: [28.7041, 77.1025], zoom: 12, bounds: [[28.45, 76.85], [28.95, 77.35]] },
  { id: "cai", name: "Cairo", country: "Egypt", flag: "🇪🇬", center: [30.0444, 31.2357], zoom: 12, bounds: [[29.85, 31.05], [30.25, 31.45]] },
  { id: "jnb", name: "Johannesburg", country: "South Africa", flag: "🇿🇦", center: [-26.2041, 28.0473], zoom: 12, bounds: [[-26.40, 27.80], [-26.00, 28.30]] },
];

const COUNTRIES = Array.from(new Set(CITIES.map(c => c.country)));

export default function NetworkSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const nodeLayerRef = useRef<any>(null);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [effectLevel, setEffectLevel] = useState(0);
  const selectorRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  // Initialize map + white intelligence nodes (Leaflet imported locally,
  // client-only — no external CDN, works offline)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let map: any = null;
    let disposed = false;
    (async () => {
      if (typeof window === "undefined") return;
      const Lmod = await import("leaflet");
      const L = Lmod.default;
      leafletRef.current = L;
      map = L.map(el, {
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
      if (disposed) { map.remove(); return; }
      mapRef.current = map;

      const addNodes = (city: City) => {
        if (nodeLayerRef.current) nodeLayerRef.current.remove();
        const layer = L.layerGroup();
        const nodes = generateCityNodes({ id: city.id, center: city.center, bounds: city.bounds });
        for (const [ia, ib] of buildLocalLinks(nodes)) {
          L.polyline(linkLatLngs(nodes[ia], nodes[ib]), {
            color: "#ffffff", weight: 1, opacity: 0.2, interactive: false,
          }).addTo(layer);
        }
        nodes.forEach((n) => {
          L.marker([n.lat, n.lon], { icon: nodeIcon(L, n), interactive: false }).addTo(layer);
        });
        layer.addTo(map);
        nodeLayerRef.current = layer;
      };
      addNodes(currentCity);
    })();

    return () => { disposed = true; if (map) map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild nodes when city changes (via flyToCity)
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    if (nodeLayerRef.current) nodeLayerRef.current.remove();
    const layer = L.layerGroup();
    const nodes = generateCityNodes({ id: currentCity.id, center: currentCity.center, bounds: currentCity.bounds });
    for (const [ia, ib] of buildLocalLinks(nodes)) {
      L.polyline(linkLatLngs(nodes[ia], nodes[ib]), {
        color: "#ffffff", weight: 1, opacity: 0.2, interactive: false,
      }).addTo(layer);
    }
    nodes.forEach((n) => {
      L.marker([n.lat, n.lon], { icon: nodeIcon(L, n), interactive: false }).addTo(layer);
    });
    layer.addTo(map);
    nodeLayerRef.current = layer;
  }, [currentCity]);

  // ===== Cinematic transition (original) =====
  const flyToCity = async (city: City) => {
    const map = mapRef.current;
    if (!map || transitioning) return;

    setTransitioning(true);
    setSelectorOpen(false);

    map.setMaxBounds(undefined);
    map.setMinZoom(1);

    const startZoom = map.getZoom();

    await sleep(900);
    map.flyTo(map.getCenter(), Math.max(startZoom - 2, 10), { duration: 0.6, easeLinearity: 0.15 });
    setEffectLevel(0.3);
    await sleep(620);
    setEffectLevel(0.35);
    await sleep(250);

    map.flyTo(map.getCenter(), Math.max(startZoom - 5, 7), { duration: 0.55, easeLinearity: 0.15 });
    setEffectLevel(0.6);
    await sleep(570);
    setEffectLevel(0.65);
    await sleep(250);

    map.flyTo(map.getCenter(), 4, { duration: 0.5, easeLinearity: 0.15 });
    setEffectLevel(0.9);
    await sleep(520);
    await sleep(200);
    setEffectLevel(1.0);

    const arrivalStartZoom = Math.max(city.zoom - 5, 4);
    map.setView(city.center, arrivalStartZoom, { animate: false });
    await sleep(250);

    map.flyTo(city.center, city.zoom - 2, { duration: 0.6, easeLinearity: 0.15 });
    setEffectLevel(0.85);
    await sleep(620);
    setEffectLevel(0.8);
    await sleep(250);

    map.flyTo(city.center, city.zoom - 0.5, { duration: 0.55, easeLinearity: 0.15 });
    setEffectLevel(0.5);
    await sleep(570);
    setEffectLevel(0.45);
    await sleep(250);

    map.flyTo(city.center, city.zoom, { duration: 0.5, easeLinearity: 0.2 });
    setEffectLevel(0.15);
    await sleep(400);
    setEffectLevel(0);
    await sleep(150);

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
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 60px)", background: "radial-gradient(ellipse 70% 70% at 50% 45%, #0c1017 0%, #07090d 50%, #05060a 100%)" }}>
      <style>{`
        .intel-node {
          border-radius: 50%;
          /* pure transparency, no blur; slight slow breathing only */
          animation: intelBreathe 6s ease-in-out infinite;
        }
        @keyframes intelBreathe {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.22; }
        }
      `}</style>
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
                <div className="px-3.5 py-1.5 text-[0.54rem] font-bold uppercase tracking-[0.14em] text-[#2e333c] flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
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

      {/* Cinematic transition effect (unchanged) */}
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

      {transitioning && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-xl border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 shadow-lg" style={{ marginBottom: effectLevel * 30 }}>
          <div className="h-3.5 w-3.5 rounded-full border-2 border-[#2a2f38] border-t-[#565d68] animate-spin" />
          <span className="text-[0.66rem] tracking-[0.12em] text-[#565d68]" style={{ fontFamily: "var(--font-mono)" }}>NAVIGATING</span>
        </div>
      )}
    </div>
  );
}
