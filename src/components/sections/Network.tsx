"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, ChevronDown, Layers } from "lucide-react";
import { play } from "@/lib/sound";
import {
  NET_NODES, NET_LINKS,
  MOUNTAIN_ZONES, WATER_ZONES, METRO_ZONES, REGION_ZONES, ROAD_ACTIVITY,
  RADAR_HUBS, MOUNTAIN_CONTOURS, LOCATION_MARKERS, HUB_LABELS,
  HOTSPOTS, GRID_METROS, ACTIVE_MEMBERS,
} from "@/lib/gis-overlay";

/* ==================================================================
   Network — georeferenced intelligence overlays rendered INSIDE the
   Leaflet map engine as vector layers (circleMarker / circle /
   polyline / polygon / divIcon). Every element is anchored to
   latitude/longitude, so it pans, zooms and scales exactly with the
   map — like ArcGIS / Cesium. The base tile map is never modified.

   World/regional view  : strategic overlays (water/mountain tints,
                          contours, grids, metro heat, hotspots, radar,
                          markers, hub labels, region zones, road
                          activity, global nodes + links).
   City view (z>=10)    : dense local intelligence field per city
                          (hundreds of nodes, arteries, local links,
                          heat, mesh, small radar).
   LOD: zoomend swaps layer-group visibility dynamically.
   ================================================================== */

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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface City { id: string; name: string; country: string; flag: string; center: [number, number]; zoom: number; bounds: [[number, number], [number, number]] }

const CITIES: City[] = [
  { id: "nyc", name: "New York City", country: "United States", flag: "🇺🇸", center: [40.7589, -73.9851], zoom: 13, bounds: [[40.40, -74.30], [40.95, -73.65]] },
  { id: "la", name: "Los Angeles", country: "United States", flag: "🇺🇸", center: [34.0522, -118.2437], zoom: 12, bounds: [[33.70, -118.70], [34.40, -118.00]] },
  { id: "chi", name: "Chicago", country: "United States", flag: "🇺🇸", center: [41.8781, -87.6298], zoom: 12, bounds: [[41.60, -87.90], [42.10, -87.30]] },
  { id: "sf", name: "San Francisco", country: "United States", flag: "🇺🇸", center: [37.7749, -122.4194], zoom: 13, bounds: [[37.60, -122.60], [37.90, -122.20]] },
  { id: "ist", name: "Istanbul", country: "Türkiye", flag: "🇹🇷", center: [41.0082, 28.9784], zoom: 12, bounds: [[40.80, 28.50], [41.30, 29.50]] },
  { id: "ruh", name: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", center: [24.7136, 46.6753], zoom: 12, bounds: [[24.45, 46.45], [25.05, 46.95]] },
  { id: "dxb", name: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", center: [25.2048, 55.2708], zoom: 12, bounds: [[24.90, 54.95], [25.45, 55.55]] },
  { id: "lon", name: "London", country: "United Kingdom", flag: "🇬🇧", center: [51.5074, -0.1278], zoom: 12, bounds: [[51.30, -0.35], [51.70, 0.15]] },
  { id: "par", name: "Paris", country: "France", flag: "🇫🇷", center: [48.8566, 2.3522], zoom: 12, bounds: [[48.70, 2.15], [49.05, 2.60]] },
  { id: "tyo", name: "Tokyo", country: "Japan", flag: "🇯🇵", center: [35.6762, 139.6503], zoom: 12, bounds: [[35.50, 139.40], [35.90, 139.95]] },
  { id: "sgp", name: "Singapore", country: "Singapore", flag: "🇸🇬", center: [1.3521, 103.8198], zoom: 12, bounds: [[1.20, 103.60], [1.50, 104.05]] },
  { id: "syd", name: "Sydney", country: "Australia", flag: "🇦🇺", center: [-33.8688, 151.2093], zoom: 12, bounds: [[-34.00, 150.90], [-33.60, 151.50]] },
  { id: "sao", name: "São Paulo", country: "Brazil", flag: "🇧🇷", center: [-23.5505, -46.6333], zoom: 12, bounds: [[-23.75, -46.85], [-23.35, -46.40]] },
  { id: "bom", name: "Mumbai", country: "India", flag: "🇮🇳", center: [19.0760, 72.8777], zoom: 12, bounds: [[18.85, 72.65], [19.35, 73.10]] },
  { id: "cai", name: "Cairo", country: "Egypt", flag: "🇪🇬", center: [30.0444, 31.2357], zoom: 12, bounds: [[29.85, 31.05], [30.25, 31.45]] },
];
const COUNTRIES = Array.from(new Set(CITIES.map(c => c.country)));

/* ============================================================
   City-local overlay field — generated per city, deterministic.
   Only used at city zoom (z >= 10). Base map untouched.
   ============================================================ */

interface CityFieldNode { lat: number; lon: number; center: number }
interface CityField {
  nodes: CityFieldNode[];
  links: [number, number][];
  arteries: [number, number][][];
  hotspots: { lat: number; lon: number; radius: number; intensity: number }[];
  mesh: { lat: number; lon: number; size: number; cells: number };
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCityField(city: City): CityField {
  const rnd = seeded(city.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + 7);
  const [[swLat, swLon], [neLat, neLon]] = city.bounds;
  const cLat = (swLat + neLat) / 2, cLon = (swLon + neLon) / 2;
  const latSpan = Math.max(0.06, neLat - swLat);
  const lonSpan = Math.max(0.08, neLon - swLon);

  const nodes: CityFieldNode[] = [];
  const COUNT = 520;
  for (let i = 0; i < COUNT; i++) {
    const ring = Math.pow(rnd(), 0.6);
    const ang = rnd() * Math.PI * 2;
    const lat = cLat + Math.cos(ang) * (latSpan / 2) * ring * (0.6 + rnd() * 0.4);
    const lon = cLon + Math.sin(ang) * (lonSpan / 2) * ring * (0.6 + rnd() * 0.4);
    const d = Math.hypot((lat - cLat) / latSpan, (lon - cLon) / lonSpan);
    nodes.push({ lat, lon, center: 1 - Math.min(1, d * 1.6) });
  }
  nodes.sort((a, b) => b.center - a.center);

  const links: [number, number][] = [];
  const POOL = Math.min(nodes.length, 140);
  for (let i = 0; i < POOL; i++) {
    let best = -1, bestD = 1e9;
    for (let j = i + 1; j < POOL; j++) {
      const d = Math.hypot(nodes[i].lat - nodes[j].lat, nodes[i].lon - nodes[j].lon);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0 && bestD < latSpan * 0.22) links.push([i, best]);
  }

  const arteries: [number, number][][] = [];
  for (let k = 0; k < 4; k++) {
    const pts: [number, number][] = [];
    const along = rnd();
    for (let s = -1; s <= 1.001; s += 0.5) {
      pts.push([
        cLat + (along > 0.5 ? (s * latSpan * 0.42) : 0),
        cLon + (along <= 0.5 ? (s * lonSpan * 0.42) : 0),
      ]);
    }
    arteries.push(pts);
  }

  const hotspots = [
    { lat: cLat + latSpan * 0.16, lon: cLon + lonSpan * 0.14, radius: latSpan * 0.22, intensity: 0.9 },
    { lat: cLat - latSpan * 0.12, lon: cLon - lonSpan * 0.16, radius: latSpan * 0.18, intensity: 0.7 },
    { lat: cLat + latSpan * 0.02, lon: cLon - lonSpan * 0.1, radius: latSpan * 0.2, intensity: 0.8 },
  ];

  return {
    nodes, links, arteries, hotspots,
    mesh: { lat: cLat, lon: cLon, size: latSpan * 0.4, cells: 4 },
  };
}

/* Convert degrees-radius to Leaflet meters (approx) */
function radToM(deg: number) { return deg * 111320; }

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
  const selectorRef = useRef<HTMLDivElement>(null);

  // layer groups (georeferenced vector layers)
  const worldGroup = useRef<any>(null);   // strategic overlays
  const cityGroup = useRef<any>(null);    // dense city overlays
  const radarSweeps = useRef<any[]>([]);
  const particles = useRef<any[]>([]);
  const rafRef = useRef(0);
  const buildCityRef = useRef<((city: City) => void) | null>(null);

  // Init map + build georeferenced overlay layers
  useEffect(() => {
    let map: any = null;
    let worldLayers: any[] = [];
    let cityLayers: any[] = [];
    let sweepPolys: any[] = [];
    let particleMarks: any[] = [];
    let disposed = false;

    (async () => {
      loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      const L = (window as any).L;
      if (!L || !containerRef.current || disposed) return;

      map = L.map(containerRef.current, {
        center: currentCity.center,
        zoom: currentCity.zoom,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20, crossOrigin: true,
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;

      /* ============ WORLD / REGIONAL LAYERS (georeferenced) ============ */
      worldGroup.current = L.layerGroup().addTo(map);
      const W = worldGroup.current;

      // water tint polygons
      for (const poly of WATER_ZONES) {
        L.polygon(poly.map(([lo, la]) => [la, lo]), {
          color: "rgba(7,19,31,0.26)", weight: 0, fillColor: "#07131F", fillOpacity: 0.26,
          interactive: false, pane: "overlayPane",
        }).addTo(W);
      }
      // mountain tint polygons
      for (const poly of MOUNTAIN_ZONES) {
        L.polygon(poly.map(([lo, la]) => [la, lo]), {
          color: "rgba(24,50,34,0.20)", weight: 0, fillColor: "#183222", fillOpacity: 0.2,
          interactive: false, pane: "overlayPane",
        }).addTo(W);
      }
      // contour lines
      for (const ring of MOUNTAIN_CONTOURS) {
        L.polyline(ring.map(([lo, la]) => [la, lo]), {
          color: "rgba(70,110,80,0.3)", weight: 0.6, interactive: false,
        }).addTo(W);
      }
      // faint network grids in major metros
      for (const g of GRID_METROS) {
        const half = g.size * g.cells;
        const seg: [number, number][] = [];
        for (let c = 0; c <= g.cells * 2; c++) {
          const f = c / (g.cells * 2);
          seg.push([g.lat + half, g.lon - half + (half * 2) * f]);
          seg.push([g.lat - half, g.lon - half + (half * 2) * f]);
          seg.push([g.lat + half - (half * 2) * f, g.lon - half]);
          seg.push([g.lat + half - (half * 2) * f, g.lon + half]);
        }
        // draw as individual segments
        for (let c = 0; c <= g.cells * 2; c++) {
          const f = c / (g.cells * 2);
          const lon = g.lon - half + (half * 2) * f;
          L.polyline([[g.lat + half, lon], [g.lat - half, lon]], { color: "rgba(210,220,232,0.12)", weight: 0.4, interactive: false }).addTo(W);
          const lat = g.lat + half - (half * 2) * f;
          L.polyline([[lat, g.lon - half], [lat, g.lon + half]], { color: "rgba(210,220,232,0.12)", weight: 0.4, interactive: false }).addTo(W);
        }
      }
      // red hotspot clusters (concentric circles => soft gradient, scales with zoom)
      for (const hs of HOTSPOTS) {
        const r = radToM(hs.radius);
        L.circle([hs.lat, hs.lon], { radius: r, color: "rgba(122,42,52,0.5)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.34 * hs.intensity, interactive: false }).addTo(W);
        L.circle([hs.lat, hs.lon], { radius: r * 0.6, color: "rgba(122,42,52,0.5)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.5 * hs.intensity, interactive: false }).addTo(W);
        L.circle([hs.lat, hs.lon], { radius: r * 0.3, color: "rgba(122,42,52,0.6)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.7 * hs.intensity, interactive: false }).addTo(W);
      }
      // radar rings around hubs
      for (const hub of RADAR_HUBS) {
        const r = radToM(hub.radius);
        const rings = [
          L.circle([hub.lat, hub.lon], { radius: r, color: "rgba(210,220,232,0.18)", weight: 0.6, fill: false, interactive: false }),
          L.circle([hub.lat, hub.lon], { radius: r * 0.6, color: "rgba(210,220,232,0.14)", weight: 0.5, fill: false, interactive: false }),
          L.circle([hub.lat, hub.lon], { radius: r * 0.3, color: "rgba(210,220,232,0.16)", weight: 0.5, fill: false, interactive: false }),
        ];
        rings.forEach(c => c.addTo(W));
        // rotating sweep polyline
        const sweep = L.polyline([[hub.lat, hub.lon], [hub.lat, hub.lon]], { color: "rgba(230,238,248,0.35)", weight: 0.7, interactive: false }).addTo(W);
        sweepPolys.push({ poly: sweep, lat: hub.lat, lon: hub.lon, radiusM: r, speed: hub.speed });
      }
      // small white location markers
      for (const m of LOCATION_MARKERS) {
        L.circleMarker([m.lat, m.lon], { radius: 3, color: "rgba(235,242,250,0.5)", weight: 0.6, fillColor: "#eaf1f8", fillOpacity: 0.9, interactive: false }).addTo(W);
      }
      // strategic-hub labels (divIcon, georeferenced)
      for (const hl of HUB_LABELS) {
        const icon = L.divIcon({
          className: "hub-label",
          html: `<div style="color:rgba(210,224,240,0.8);font:500 9px var(--font-mono),monospace;letter-spacing:.08em;white-space:nowrap;text-shadow:0 0 4px rgba(0,0,0,.8)">${hl.name}</div>`,
          iconSize: [0, 0],
        });
        L.marker([hl.lat, hl.lon], { icon, interactive: false }).addTo(W);
      }
      // blinking active members
      for (const am of ACTIVE_MEMBERS) {
        L.circleMarker([am.lat, am.lon], { radius: 2.2, color: "#fff", weight: 0.4, fillColor: "#ffffff", fillOpacity: 0.9, className: "member-blink", interactive: false }).addTo(W);
      }
      // regional activity zones
      for (const rz of REGION_ZONES) {
        const r = radToM(rz.radius);
        L.circle([rz.lat, rz.lon], { radius: r, color: "rgba(122,42,52,0.16)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.1 * rz.activity, interactive: false }).addTo(W);
      }
      // road activity glow
      for (const road of ROAD_ACTIVITY) {
        const pts = road.map(([lo, la]) => [la, lo] as [number, number]);
        L.polyline(pts, { color: "rgba(140,52,52,0.4)", weight: 4, opacity: 0.34, interactive: false }).addTo(W);
      }
      // urban density heat
      for (const mz of METRO_ZONES) {
        const r = radToM(mz.radius);
        L.circle([mz.lat, mz.lon], { radius: r, color: "rgba(122,42,52,0.5)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.5 * mz.intensity, interactive: false }).addTo(W);
        L.circle([mz.lat, mz.lon], { radius: r * 0.5, color: "rgba(122,42,52,0.6)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.4 * mz.intensity, interactive: false }).addTo(W);
      }
      // global intelligence nodes (circleMarker)
      for (const n of NET_NODES) {
        L.circleMarker([n.lat, n.lon], {
          radius: n.size, color: "rgba(210,224,240,0.6)", weight: 0.6,
          fillColor: n.isHQ ? "#ffffff" : "#dce7f3", fillOpacity: 0.95, interactive: false,
        }).addTo(W);
      }
      // global connection links + moving particles
      for (const link of NET_LINKS) {
        const a = NET_NODES[link.a], b = NET_NODES[link.b];
        if (!a || !b) continue;
        L.polyline([[a.lat, a.lon], [b.lat, b.lon]], { color: "rgba(170,185,205,0.3)", weight: 0.5, interactive: false }).addTo(W);
        const pm = L.circleMarker([a.lat, a.lon], { radius: 1.4, color: "#fff", weight: 0, fillColor: "#eaf2fa", fillOpacity: 0, interactive: false }).addTo(W);
        particleMarks.push({ pm, a: { lat: a.lat, lon: a.lon }, b: { lat: b.lat, lon: b.lon }, speed: 0.15 + (link.a * 0.012 + link.b * 0.008) });
      }

      /* ============ CITY LAYERS (dense local) ============ */
      cityGroup.current = L.layerGroup();
      const buildCity = (city: City) => {
        cityGroup.current.clearLayers();
        const field = buildCityField(city);
        const G = cityGroup.current;
        const latLon = (n: CityFieldNode) => [n.lat, n.lon] as [number, number];

        // local hotspots / heat
        for (const hz of field.hotspots) {
          const r = radToM(hz.radius);
          L.circle([hz.lat, hz.lon], { radius: r, color: "rgba(122,42,52,0.5)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.5 * hz.intensity, interactive: false }).addTo(G);
          L.circle([hz.lat, hz.lon], { radius: r * 0.5, color: "rgba(122,42,52,0.6)", weight: 0, fillColor: "#7A2A34", fillOpacity: 0.5 * hz.intensity, interactive: false }).addTo(G);
        }
        // red traffic arteries
        for (const art of field.arteries) {
          const pts = art.map(([lo, la]) => [la, lo] as [number, number]);
          L.polyline(pts, { color: "rgba(150,60,60,0.55)", weight: 1.4, opacity: 0.7, interactive: false }).addTo(G);
          L.polyline(pts, { color: "rgba(150,60,60,0.2)", weight: 4, opacity: 0.5, interactive: false }).addTo(G);
        }
        // faint network mesh
        const mesh = field.mesh;
        const half = mesh.size * mesh.cells;
        for (let c = 0; c <= mesh.cells * 2; c++) {
          const f = c / (mesh.cells * 2);
          const lon = mesh.lon - half + (half * 2) * f;
          const lat = mesh.lat + half - (half * 2) * f;
          L.polyline([[mesh.lat + half, lon], [mesh.lat - half, lon]], { color: "rgba(210,220,232,0.12)", weight: 0.4, interactive: false }).addTo(G);
          L.polyline([[lat, mesh.lon - half], [lat, mesh.lon + half]], { color: "rgba(210,220,232,0.12)", weight: 0.4, interactive: false }).addTo(G);
        }
        // dense local nodes (up to 520, georeferenced circleMarkers)
        for (const n of field.nodes) {
          const r = n.center > 0.5 ? 2.2 : 1.5;
          L.circleMarker(latLon(n), { radius: r, color: "rgba(235,242,250,0.5)", weight: 0.4, fillColor: "#eef3f9", fillOpacity: 0.9, interactive: false }).addTo(G);
        }
        // local communication links (thin)
        for (const [ia, ib] of field.links) {
          const a = field.nodes[ia], b = field.nodes[ib];
          if (!a || !b) continue;
          L.polyline([latLon(a), latLon(b)], { color: "rgba(200,214,232,0.22)", weight: 0.4, interactive: false }).addTo(G);
        }
        // small radar circles on hotspots
        for (let k = 0; k < 2; k++) {
          const hz = field.hotspots[k];
          const rr = radToM(hz.radius * 0.5);
          L.circle([hz.lat, hz.lon], { radius: rr, color: "rgba(210,220,232,0.2)", weight: 0.5, fill: false, interactive: false }).addTo(G);
        }
      };
      buildCity(currentCity);
      buildCityRef.current = buildCity;

      /* ============ LOD: swap layer groups by zoom ============ */
      const applyLod = () => {
        if (!map || disposed) return;
        const z = map.getZoom();
        const show = showOverlaysRef.current;
        if (!show) { W.remove(); if (cityGroup.current) cityGroup.current.remove(); return; }
        if (z >= 10) {
          W.remove();
          if (cityGroup.current && !map.hasLayer(cityGroup.current)) cityGroup.current.addTo(map);
        } else {
          if (cityGroup.current) cityGroup.current.remove();
          if (!map.hasLayer(W)) W.addTo(map);
        }
      };
      map.on("zoomend", applyLod);
      applyLod();

      /* ============ animation: radar sweeps + particles ============ */
      const anim = () => {
        if (disposed) return;
        const t = performance.now() / 1000;
        if (showOverlaysRef.current && map.getZoom() < 10) {
          for (const s of sweepPolys) {
            const ang = t * s.speed;
            const dLat = Math.cos(ang) * (s.radiusM / 111320);
            const dLon = Math.sin(ang) * (s.radiusM / (111320 * Math.cos(s.lat * Math.PI / 180)));
            s.poly.setLatLngs([[s.lat, s.lon], [s.lat + dLat, s.lon + dLon]]);
          }
          for (const p of particleMarks) {
            const cyc = (t * p.speed) % 1;
            const lat = p.a.lat + (p.b.lat - p.a.lat) * cyc;
            const lon = p.a.lon + (p.b.lon - p.a.lon) * cyc;
            p.pm.setLatLng([lat, lon]);
            p.pm.setStyle({ fillOpacity: Math.sin(cyc * Math.PI) * 0.9 });
          }
        }
        rafRef.current = requestAnimationFrame(anim);
      };
      rafRef.current = requestAnimationFrame(anim);

      radarSweeps.current = sweepPolys;
      particles.current = particleMarks;
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rebuild city overlays when city changes (georeferenced layers follow map)
  useEffect(() => {
    if (buildCityRef.current) {
      buildCityRef.current(currentCity);
    }
  }, [currentCity]);

  // toggle overlays (add/remove layer groups) without touching the base map
  useEffect(() => {
    const map = mapRef.current;
    const W = worldGroup.current, C = cityGroup.current;
    if (!map) return;
    const z = map.getZoom();
    if (!showOverlays) {
      if (W) W.remove();
      if (C) C.remove();
    } else if (z >= 10) {
      if (W) W.remove();
      if (C && !map.hasLayer(C)) C.addTo(map);
    } else {
      if (C) C.remove();
      if (W && !map.hasLayer(W)) W.addTo(map);
    }
  }, [showOverlays]);

  // Close selector on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const flyToCity = async (city: City) => {
    const map = mapRef.current;
    if (!map || transitioning) return;
    setTransitioning(true);
    setSelectorOpen(false);
    setCurrentCity(city);
    map.setMinZoom(2);
    await sleep(300);
    map.flyTo(city.center, city.zoom, { duration: 1.1, easeLinearity: 0.15 });
    setEffectLevel(0.4);
    await sleep(400);
    setEffectLevel(0);
    await sleep(500);
    setTransitioning(false);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0d]" style={{ height: "calc(100vh - 66px)" }}>
      <style>{`
        .hub-label { border: none; background: none; box-shadow: none; }
        .member-blink { animation: memBlink 2.6s ease-in-out infinite; }
        @keyframes memBlink { 0%,100%{opacity:.3} 50%{opacity:1} }
        .leaflet-overlay-pane svg path, .leaflet-overlay-pane svg circle {
          pointer-events: none;
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0" />

      {/* City Selector */}
      <div ref={selectorRef} className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 text-[0.76rem] font-medium text-[#c3c9d3] hover:text-white hover:border-[#2a2f38] transition-all duration-300 shadow-lg"
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
          <div className="absolute top-full left-0 mt-2 w-[280px] max-h-[500px] overflow-y-auto scroll-thin rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/95 backdrop-blur-xl py-2 shadow-2xl">
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

      {/* Overlay toggle */}
      <button
        onClick={() => { setShowOverlays((v) => !v); play("click"); }}
        className="absolute bottom-5 left-4 z-[1000] flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#1a1d22] bg-[#0a0b0e]/90 px-3 py-2 text-[0.6rem] tracking-[0.12em] text-[#6b7383] backdrop-blur-md transition hover:border-[#2a2f38] hover:text-[#c3c9d3]"
        style={{ fontFamily: "var(--font-mono)" }}
        aria-pressed={showOverlays}
      >
        <Layers size={12} className={showOverlays ? "text-[#c3c9d3]" : "text-[#3a4049]"} />
        {showOverlays ? "OVERLAYS ON" : "OVERLAYS OFF"}
      </button>

      {/* Cinematic effect overlay (transition only, not georeferenced content) */}
      <div
        className="pointer-events-none absolute inset-0 z-[500]"
        style={{
          opacity: effectLevel > 0 ? 1 : 0,
          transition: "opacity 0.35s ease, backdrop-filter 0.45s ease",
          backdropFilter: `blur(${effectLevel * 12}px)`,
          WebkitBackdropFilter: `blur(${effectLevel * 12}px)`,
          background: effectLevel >= 0.95 ? "#050608" : `rgba(5,6,8,${effectLevel * 0.7})`,
        }}
      />
      {transitioning && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 shadow-lg">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-[#2a2f38] border-t-[#565d68] animate-spin" />
          <span className="text-[0.66rem] tracking-[0.12em] text-[#565d68]" style={{ fontFamily: "var(--font-mono)" }}>NAVIGATING</span>
        </div>
      )}
    </div>
  );
}
