"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Search, X } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VCITIES, VCOUNTRIES, vNodesFor, vLinksFor, type VCity, type VNode } from "@/lib/vector-cities";

/* ==================================================================
   Network — georeferenced VECTOR intelligence map (MapLibre GL).

   The base is a real vector street map (OpenFreeMap/OSM data), so every
   road, building and city is actual geographic vector data — not pixels.
   This makes streets individually addressable: you can query by name or
   click a road to highlight exactly ONE street.

   - Dark monochrome base style.
   - White intelligence nodes (transparent gradients) + thin local mesh.
   - Street selection: click any road → it glows; a search field lets you
     type a street name and highlight that single street.
   - City selector with cinematic fly-to.
   ================================================================== */

const STYLE: any = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "vector",
      tiles: ["https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf"],
      maxzoom: 14,
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#07080b" } },
    // water
    { id: "water", type: "fill", source: "osm", "source-layer": "water", paint: { "fill-color": "#0a141f" } },
    { id: "ocean", type: "fill", source: "osm", "source-layer": "ocean", paint: { "fill-color": "#08121c" } },
    // land use / parks / building footprints
    { id: "landcover", type: "fill", source: "osm", "source-layer": "landcover", paint: { "fill-color": "#0d120f", "fill-opacity": 0.5 } },
    // buildings
    { id: "building", type: "fill", source: "osm", "source-layer": "building", paint: { "fill-color": "#111317", "fill-opacity": 0.6 } },
    // roads — monochrome, tiered by class
    { id: "roads-minor", type: "line", source: "osm", "source-layer": "transportation",
      filter: ["in", "class", "minor", "service", "track"],
      paint: { "line-color": "#20242b", "line-width": 0.6 } },
    { id: "roads-major", type: "line", source: "osm", "source-layer": "transportation",
      filter: ["in", "class", "major", "secondary", "trunk"],
      paint: { "line-color": "#2a2f37", "line-width": 1.4 } },
    { id: "roads-highway", type: "line", source: "osm", "source-layer": "transportation",
      filter: ["in", "class", "motorway", "primary"],
      paint: { "line-color": "#343b45", "line-width": 2 } },
    // place labels (cities / towns)
    { id: "place-city", type: "symbol", source: "osm", "source-layer": "place",
      filter: ["in", "class", "city", "town"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-size": 11,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
      },
      paint: { "text-color": "#5d6675", "text-halo-color": "#050608", "text-halo-width": 1.2 } },
  ],
};

/* -------- white node style (transparent radial gradient) -------- */
function nodeHtml(n: VNode) {
  const base = n.isHub ? 18 : 6 + n.weight * 2.5;
  const color = n.hubRed ? "#b32020" : "#ffffff";
  return {
    html: `<div class="mv-node" style="width:${base * 2}px;height:${base * 2}px;background:radial-gradient(circle, ${color}59 0%, ${color}26 42%, ${color}0d 68%, ${color}00 82%)"></div>`,
    width: base * 2, height: base * 2, anchor: base,
  };
}

export default function NetworkSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const nodesSourceRef = useRef<any>(null);
  const linksSourceRef = useRef<any>(null);
  const [currentCity, setCurrentCity] = useState<VCity>(VCITIES[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ---- init map + node/link overlay sources ---- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = new maplibregl.Map({
      container: el,
      style: STYLE,
      center: [currentCity.center[1], currentCity.center[0]],
      zoom: currentCity.zoom,
      minZoom: 10,
      maxZoom: 17,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      // nodes (white circles) — georeferenced GeoJSON
      const nodes: any[] = vNodesFor(currentCity);
      map.addSource("intel-nodes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: nodes.map((n, i) => ({
            type: "Feature",
            properties: { i, isHub: n.isHub ? 1 : 0, hubRed: n.hubRed ? 1 : 0, weight: n.weight },
            geometry: { type: "Point", coordinates: [n.lon, n.lat] },
          })),
        },
      });
      map.addLayer({
        id: "intel-nodes-layer",
        type: "circle",
        source: "intel-nodes",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"],
            10, ["case", ["==", ["get", "isHub"], 1], 7, 3],
            14, ["case", ["==", ["get", "isHub"], 1], 12, 5]],
          "circle-color": ["case", ["==", ["get", "hubRed"], 1], "#b32020", "#ffffff"],
          "circle-opacity": 0.3,
          "circle-blur": 0.9,
        },
      });

      // links (thin local mesh)
      const links = vLinksFor(nodes);
      map.addSource("intel-links", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: links.map(([a, b]) => ({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [[nodes[a].lon, nodes[a].lat], [nodes[b].lon, nodes[b].lat]] },
          })),
        },
      });
      map.addLayer({
        id: "intel-links-layer",
        type: "line",
        source: "intel-links",
        paint: { "line-color": "#ffffff", "line-width": 1, "line-opacity": 0.2 },
      });

      // highlight layer for a selected street (added once, hidden by default)
      map.addSource("selected-street", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "selected-street-layer",
        type: "line",
        source: "selected-street",
        paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 0.9 },
      });

      nodesSourceRef.current = map.getSource("intel-nodes");
      linksSourceRef.current = map.getSource("intel-links");
    });

    // click a road → highlight exactly that street feature
    map.on("click", (e: any) => {
      const layers = ["roads-highway", "roads-major", "roads-minor"];
      const feat = map.queryRenderedFeatures(e.point, { layers });
      if (feat && feat.length) {
        highlightStreet(map, feat[0]);
        const name = feat[0].properties?.["name:en"] || feat[0].properties?.name || "unnamed";
        setStatus(name);
      } else {
        setStatus(null);
      }
    });

    return () => { map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- rebuild overlay sources when city changes ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const rebuild = () => {
      const nodes = vNodesFor(currentCity);
      if (nodesSourceRef.current) {
        nodesSourceRef.current.setData({
          type: "FeatureCollection",
          features: nodes.map((n, i) => ({
            type: "Feature",
            properties: { i, isHub: n.isHub ? 1 : 0, hubRed: n.hubRed ? 1 : 0, weight: n.weight },
            geometry: { type: "Point", coordinates: [n.lon, n.lat] },
          })),
        });
      }
      if (linksSourceRef.current) {
        const links = vLinksFor(nodes);
        linksSourceRef.current.setData({
          type: "FeatureCollection",
          features: links.map(([a, b]) => ({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [[nodes[a].lon, nodes[a].lat], [nodes[b].lon, nodes[b].lat]] },
          })),
        });
      }
    };
    // wait for style load
    if (map.isStyleLoaded()) rebuild();
    else map.once("load", rebuild);
  }, [currentCity]);

  /* ---- search: highlight a single street by name ---- */
  const runSearch = () => {
    const map = mapRef.current;
    if (!map || !query.trim()) return;
    const layers = ["roads-highway", "roads-major", "roads-minor"];
    const bbox = map.getBounds().toArray(); // [[w,s],[e,n]]
    const feats = map.querySourceFeatures("osm", {
      sourceLayer: "transportation",
      filter: ["all",
        ["in", "class", "minor", "service", "track", "major", "secondary", "trunk", "motorway", "primary"],
        ["match", ["get", "name"], [query.trim().toLowerCase()], true, false],
      ],
    });
    const matched = feats.find((f: any) => {
      const n = (f.properties?.["name:en"] || f.properties?.name || "").toLowerCase();
      return n.includes(query.trim().toLowerCase());
    });
    if (matched) {
      highlightStreet(map, matched);
      setStatus(matched.properties?.["name:en"] || matched.properties?.name || query);
      // fly to it
      const coords = (matched as any).geometry as { type: string; coordinates: [number, number][] };
      if (coords?.coordinates?.length) map.flyTo({ center: coords.coordinates[Math.floor(coords.coordinates.length / 2)] as any, zoom: Math.max(map.getZoom(), 15) });
    } else {
      setStatus(null);
    }
    setSearchOpen(false);
    setQuery("");
  };

  /* ---- fly to a city (cinematic) ---- */
  const goTo = (city: VCity) => {
    const map = mapRef.current;
    if (!map) return;
    setSelectorOpen(false);
    setCurrentCity(city);
    map.flyTo({ center: [city.center[1], city.center[0]], zoom: city.zoom, duration: 2600, essential: true });
  };

  // close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#07080b]" style={{ height: "calc(100vh - 66px)" }}>
      <style>{`
        .mv-node { border-radius: 50%; animation: mvBreathe 6s ease-in-out infinite; }
        @keyframes mvBreathe { 0%,100%{opacity:.35} 50%{opacity:.22} }
        .maplibregl-ctrl-group { border-radius: var(--radius-sm)!important; overflow:hidden; }
        .maplibregl-ctrl button { background:#07080b!important; }
      `}</style>

      <div ref={containerRef} className="absolute inset-0" />

      {/* City selector */}
      <div ref={selectorRef} className="absolute top-4 left-4 z-[1000]">
        <button onClick={() => setSelectorOpen(v => !v)}
          className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/90 backdrop-blur-md px-4 py-2.5 text-[0.76rem] font-medium text-[#c3c9d3] hover:text-white hover:border-[#2a2f38] transition-all duration-300 shadow-lg">
          <MapPin size={14} className="text-[#565d68]" />
          <span className="flex items-center gap-1.5"><span className="text-base leading-none">{currentCity.flag}</span>{currentCity.name}</span>
          <ChevronDown size={13} className={`text-[#565d68] transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
        </button>
        {selectorOpen && (
          <div className="absolute top-full left-0 mt-2 w-[280px] max-h-[500px] overflow-y-auto scroll-thin rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/95 backdrop-blur-xl py-2 shadow-2xl">
            {VCOUNTRIES.map(country => (
              <div key={country}>
                <div className="px-3.5 py-1.5 text-[0.54rem] font-bold uppercase tracking-[0.14em] text-[#2e333c] flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="text-sm">{VCITIES.find(c => c.country === country)?.flag}</span>{country}
                </div>
                {VCITIES.filter(c => c.country === country).map(city => (
                  <button key={city.id} onClick={() => goTo(city)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.74rem] transition-colors duration-200 ${city.id === currentCity.id ? "text-white bg-white/[0.06]" : "text-[#6b7383] hover:text-[#c3c9d3] hover:bg-white/[0.03]"}`}>
                    <MapPin size={11} className="shrink-0 text-[#3a4049]" />{city.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Street search */}
      <div ref={searchRef} className="absolute top-4 right-4 z-[1000]">
        {searchOpen ? (
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[#2a2f38] bg-[#0a0b0e]/95 px-2 py-1 backdrop-blur-md shadow-lg">
            <Search size={13} className="text-[#565d68]" />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()}
              className="w-44 bg-transparent text-[0.72rem] text-[#eaeef5] outline-none placeholder:text-[#3a4049]"
              placeholder="Search a street…" />
            <button onClick={runSearch} className="text-[0.56rem] tracking-wider text-[#c3c9d3] hover:text-white" style={{ fontFamily: "var(--font-mono)" }}>GO</button>
            <button onClick={() => { setSearchOpen(false); setQuery(""); }} className="text-[#565d68] hover:text-white"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[#1a1d22] bg-[#0a0b0e]/90 px-3 py-2 text-[0.6rem] tracking-[0.12em] text-[#6b7383] backdrop-blur-md transition hover:border-[#2a2f38] hover:text-[#c3c9d3]" style={{ fontFamily: "var(--font-mono)" }}>
            <Search size={12} />FIND STREET
          </button>
        )}
      </div>

      {/* selected street status */}
      {status && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-[var(--radius-md)] border border-white/10 bg-[#0a0b0e]/85 px-4 py-2 text-[0.6rem] tracking-[0.08em] text-[#eaeef5] backdrop-blur-md shadow-lg" style={{ fontFamily: "var(--font-mono)" }}>
          ◆ {status}
        </div>
      )}
    </div>
  );
}

/* Highlight a single street feature on the map. */
function highlightStreet(map: any, feature: any) {
  const src = map.getSource("selected-street");
  if (!src) return;
  src.setData({
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: feature.properties || {},
      geometry: feature.geometry,
    }],
  });
}
