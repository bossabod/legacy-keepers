"use client";
import { theme } from "@/lib/theme";

interface StatusBarProps {
  coordinates?: { lat: number; lon: number };
  zoom?: number;
  altitude?: string;
  fps?: number;
  entities?: number;
  connections?: number;
  dataSource?: string;
}

export function StatusBar({ coordinates, zoom, altitude, fps, entities, connections, dataSource = "ESRI World Imagery" }: StatusBarProps) {
  const items: { label: string; value: string }[] = [];
  if (coordinates) items.push({ label: "LAT", value: `${coordinates.lat.toFixed(3)}°` }, { label: "LON", value: `${coordinates.lon.toFixed(3)}°` });
  if (zoom !== undefined) items.push({ label: "ZOOM", value: `${zoom.toFixed(1)}` });
  if (altitude) items.push({ label: "ALT", value: altitude });
  if (entities !== undefined) items.push({ label: "ENTITIES", value: `${entities}` });
  if (connections !== undefined) items.push({ label: "LINKS", value: `${connections}` });
  if (fps !== undefined) items.push({ label: "FPS", value: `${fps}` });
  items.push({ label: "SOURCE", value: dataSource });

  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-charcoal)] px-4 overflow-x-auto scroll-thin">
      {items.map((item, i) => (
        <div key={i} className="flex shrink-0 items-center gap-1.5">
          <span className="text-[0.46rem] uppercase tracking-[0.14em] text-[var(--color-faint)]" style={{ fontFamily: theme.typography.mono }}>
            {item.label}
          </span>
          <span className="text-[0.52rem] text-[var(--color-dim)]" style={{ fontFamily: theme.typography.mono }}>
            {item.value}
          </span>
          {i < items.length - 1 && <span className="ml-2 text-[var(--color-faint)]">·</span>}
        </div>
      ))}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-online)]" style={{ boxShadow: "0 0 4px var(--color-online)" }} />
        <span className="text-[0.46rem] uppercase tracking-[0.14em] text-[var(--color-faint)]" style={{ fontFamily: theme.typography.mono }}>CONNECTED</span>
      </div>
    </div>
  );
}
