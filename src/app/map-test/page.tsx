"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ==================================================================
   MAP-TEST (صفحة اختبار مؤقتة — لا تمسّ صفحة Network الحالية)
   تعرض مصادر أقمار صناعية مختلفة جنبًا إلى جنب لتقارن بنفسك:
     1) Esri World Imagery  (النسخة الحالية المستخدمة في Network)
     2) Esri World Imagery Clarity  (أحدث وأعلى دقة حتى zoom 22)
     3) USGS National Imagery  (مصدر حكومي أمريكي)
   كل خريطة ثابتة على NYC بنفس الزوم، Zoom محبوس، تحريك فقط.
   ================================================================== */

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 16;

const SOURCES: { id: string; name: string; tiles: string[]; maxz: number }[] = [
  {
    id: "esri-wi",
    name: "Esri World Imagery (حالية)",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxz: 19,
  },
  {
    id: "esri-clarity",
    name: "Esri Clarity (أحدث + أدق)",
    tiles: [
      "https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxz: 22,
  },
  {
    id: "usgs",
    name: "USGS National Imagery",
    tiles: [
      "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
    ],
    maxz: 19,
  },
];

export default function MapTestPage() {
  const [status, setStatus] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    const log = (m: string) => { logs.push(m); setStatus([...logs]); };

    SOURCES.forEach((src) => {
      const el = document.getElementById(`map-${src.id}`);
      if (!el) return;
      const style: any = {
        version: 8,
        sources: { s: { type: "raster", tiles: src.tiles, tileSize: 256, maxzoom: src.maxz } },
        layers: [{ id: "s", type: "raster", source: "s" }],
      };
      try {
        const map = new maplibregl.Map({
          container: el,
          style,
          center: CENTER,
          zoom: ZOOM,
          minZoom: ZOOM,
          maxZoom: ZOOM,
          pitch: 0,
          bearing: 0,
          attributionControl: false,
          scrollZoom: false,
          boxZoom: false,
          doubleClickZoom: false,
          touchZoomRotate: false,
          keyboard: false,
          dragPan: true,
        });
        map.on("zoom", () => { if (map.getZoom() !== ZOOM) map.setZoom(ZOOM); });
        map.on("error", (e) => log(`[${src.id}] error: ${(e as any)?.error?.message || "tile error"}`));
        map.on("load", () => log(`[${src.id}] load ok`));
        log(`[${src.id}] created`);
      } catch (e) {
        log(`[${src.id}] init fail: ${e}`);
      }
    });
  }, []);

  return (
    <div style={{ background: "#07080c", minHeight: "100vh", color: "#d6e4ef", fontFamily: "monospace", padding: 20 }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>MAP SOURCE COMPARISON — NYC</h1>
      <p style={{ fontSize: 12, color: "#8b95a5", marginBottom: 16 }}>
        صفحة اختبار مؤقتة. كل خريطة Zoom محبوس (16) ويمكن تحريكها فقط. حدّد أفضلها، ثم أخبرني لأبدّل صفحة Network.
        <br />* Google Maps يحتاج مفتاح API مدفوع ولا يمكن استخدامه.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {SOURCES.map((src) => (
          <div key={src.id} style={{ border: "1px solid #2a3a48", borderRadius: 12, overflow: "hidden", background: "#0a0d12" }}>
            <div style={{ padding: "8px 12px", fontSize: 12, color: "#eaeef5", borderBottom: "1px solid #2a3a48" }}>
              {src.name}
            </div>
            <div id={`map-${src.id}`} style={{ width: "100%", height: 300 }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: "#9fd0e6" }}>
        {status.length === 0 ? "…" : status.map((s, i) => <div key={i}>{s}</div>)}
      </div>
      <p style={{ marginTop: 12, fontSize: 11, color: "#5c7184" }}>
        Clarity = الأحدث والأعلى دقة (حتى zoom 22). إذا ظهرت أفضل، أستطيع تبديل Network إليها بسهولة.
      </p>
    </div>
  );
}
