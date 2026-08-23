"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, MapPin, Building2, Landmark, Globe2, Navigation } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import { parseCoordinate } from "@/hooks/useGeoCoordinates";

interface SearchResult {
  id: string;
  name: string;
  type: "country" | "city" | "landmark" | "organization" | "person" | "coordinate";
  lat: number;
  lon: number;
  country?: string;
  region?: string;
  subtitle?: string;
}

// Built-in location database (Phase 3 foundation — future: external geocoding API)
const LOCATION_DB: SearchResult[] = [
  // Countries
  { id: "c-no", name: "Norway", type: "country", lat: 60.47, lon: 8.47, subtitle: "Kingdom of Norway" },
  { id: "c-sa", name: "Saudi Arabia", type: "country", lat: 23.89, lon: 45.08, subtitle: "Kingdom of Saudi Arabia" },
  { id: "c-ae", name: "United Arab Emirates", type: "country", lat: 23.42, lon: 53.85, subtitle: "UAE" },
  { id: "c-uk", name: "United Kingdom", type: "country", lat: 55.38, lon: -3.44, subtitle: "United Kingdom" },
  { id: "c-us", name: "United States", type: "country", lat: 39.83, lon: -98.58, subtitle: "United States of America" },
  { id: "c-ch", name: "Switzerland", type: "country", lat: 46.82, lon: 8.23, subtitle: "Swiss Confederation" },
  { id: "c-de", name: "Germany", type: "country", lat: 51.17, lon: 10.45, subtitle: "Federal Republic of Germany" },
  { id: "c-fr", name: "France", type: "country", lat: 46.23, lon: 2.21, subtitle: "French Republic" },
  { id: "c-qa", name: "Qatar", type: "country", lat: 25.35, lon: 51.18, subtitle: "State of Qatar" },
  { id: "c-kw", name: "Kuwait", type: "country", lat: 29.31, lon: 47.48, subtitle: "State of Kuwait" },
  { id: "c-tr", name: "Turkey", type: "country", lat: 38.96, lon: 35.24, subtitle: "Republic of Türkiye" },
  { id: "c-sg", name: "Singapore", type: "country", lat: 1.35, lon: 103.82, subtitle: "Republic of Singapore" },
  { id: "c-jp", name: "Japan", type: "country", lat: 36.20, lon: 138.25, subtitle: "Japan" },
  { id: "c-ca", name: "Canada", type: "country", lat: 56.13, lon: -106.35, subtitle: "Canada" },
  // Cities
  { id: "ci-oslo", name: "Oslo", type: "city", lat: 59.91, lon: 10.75, country: "Norway", subtitle: "Capital of Norway" },
  { id: "ci-riyadh", name: "Riyadh", type: "city", lat: 24.71, lon: 46.67, country: "Saudi Arabia", subtitle: "Capital of Saudi Arabia" },
  { id: "ci-dubai", name: "Dubai", type: "city", lat: 25.20, lon: 55.27, country: "UAE", subtitle: "United Arab Emirates" },
  { id: "ci-london", name: "London", type: "city", lat: 51.51, lon: -0.13, country: "United Kingdom", subtitle: "Capital of United Kingdom" },
  { id: "ci-zurich", name: "Zurich", type: "city", lat: 47.37, lon: 8.55, country: "Switzerland", subtitle: "Switzerland" },
  { id: "ci-geneva", name: "Geneva", type: "city", lat: 46.20, lon: 6.14, country: "Switzerland", subtitle: "Switzerland" },
  { id: "ci-nyc", name: "New York", type: "city", lat: 40.71, lon: -74.01, country: "United States", subtitle: "New York, USA" },
  { id: "ci-washington", name: "Washington DC", type: "city", lat: 38.90, lon: -77.04, country: "United States", subtitle: "Capital of United States" },
  { id: "ci-sf", name: "San Francisco", type: "city", lat: 37.77, lon: -122.42, country: "United States", subtitle: "California, USA" },
  { id: "ci-singapore", name: "Singapore", type: "city", lat: 1.35, lon: 103.82, country: "Singapore", subtitle: "Singapore" },
  { id: "ci-tokyo", name: "Tokyo", type: "city", lat: 35.68, lon: 139.69, country: "Japan", subtitle: "Capital of Japan" },
  { id: "ci-doha", name: "Doha", type: "city", lat: 25.29, lon: 51.51, country: "Qatar", subtitle: "Capital of Qatar" },
  { id: "ci-istanbul", name: "Istanbul", type: "city", lat: 41.01, lon: 28.98, country: "Turkey", subtitle: "Turkey" },
  { id: "ci-berlin", name: "Berlin", type: "city", lat: 52.52, lon: 13.40, country: "Germany", subtitle: "Capital of Germany" },
  { id: "ci-paris", name: "Paris", type: "city", lat: 48.86, lon: 2.35, country: "France", subtitle: "Capital of France" },
  { id: "ci-kuwait", name: "Kuwait City", type: "city", lat: 29.38, lon: 47.97, country: "Kuwait", subtitle: "Capital of Kuwait" },
  // Landmarks
  { id: "l-burj", name: "Burj Khalifa", type: "landmark", lat: 25.20, lon: 55.27, country: "UAE", subtitle: "Dubai · Tallest building" },
  { id: "l-eiffel", name: "Eiffel Tower", type: "landmark", lat: 48.86, lon: 2.29, country: "France", subtitle: "Paris · Iconic landmark" },
];

const TYPE_ICONS: Record<string, typeof MapPin> = {
  country: Globe2, city: MapPin, landmark: Landmark,
  organization: Building2, person: MapPin, coordinate: Navigation,
};

interface GlobalSearchProps {
  onSelect?: (result: SearchResult) => void;
  autoFocus?: boolean;
}

export function GlobalSearch({ onSelect, autoFocus }: GlobalSearchProps) {
  const { lang } = useApp();
  const isAr = lang === "ar";
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Check if it's a coordinate
    const coord = parseCoordinate(query);
    if (coord.valid) {
      return [{
        id: "coord",
        name: `${coord.lat.toFixed(4)}°, ${coord.lon.toFixed(4)}°`,
        type: "coordinate" as const,
        lat: coord.lat, lon: coord.lon,
        subtitle: isAr ? "إحداثيات جغرافية" : "Geographic Coordinates",
      }];
    }

    // Search location database with fuzzy matching
    return LOCATION_DB
      .filter((r) => {
        const name = r.name.toLowerCase();
        const country = (r.country || "").toLowerCase();
        return name.includes(q) || country.includes(q) || (r.subtitle || "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Exact match priority
        const aExact = a.name.toLowerCase() === q ? 0 : 1;
        const bExact = b.name.toLowerCase() === q ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        // Starts-with priority
        const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStart - bStart;
      })
      .slice(0, 8);
  }, [query, isAr]);

  const handleSelect = (result: SearchResult) => {
    setHistory((prev) => [result, ...prev.filter((h) => h.id !== result.id)].slice(0, 5));
    onSelect?.(result);
    setQuery("");
    setFocused(false);
    play("select");
  };

  const displayResults = focused ? (query ? results : history.slice(0, 5)) : [];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocused(true); }}
          onFocus={() => setFocused(true)}
          placeholder={isAr ? "ابحث عن مكان، مدينة، أو إحداثيات..." : "Search place, city, or coordinates..."}
          className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-slate)] py-3 pl-10 pr-9 text-[0.82rem] text-[var(--color-ink)] outline-none transition-all duration-200 focus:border-[var(--color-borderActive)] placeholder:text-[var(--color-faint)]"
          style={{ fontFamily: "var(--font-sans)" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-muted)]">
            <X size={15} />
          </button>
        )}
      </div>

      {focused && displayResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-charcoal)]/95 backdrop-blur-xl py-1.5 shadow-2xl max-h-[400px] overflow-y-auto scroll-thin">
          {!query && history.length > 0 && (
            <div className="px-3 py-1 text-[0.48rem] uppercase tracking-[0.14em] text-[var(--color-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
              {isAr ? "بحث أخير" : "Recent"}
            </div>
          )}
          {displayResults.map((r) => {
            const Icon = TYPE_ICONS[r.type] || MapPin;
            return (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => play("hover")}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.03]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-slate)]">
                  <Icon size={13} className="text-[var(--color-dim)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[0.78rem] font-medium text-[var(--color-ink)]">{r.name}</div>
                  <div className="truncate text-[0.58rem] text-[var(--color-faint)]">
                    {r.subtitle || `${r.lat.toFixed(2)}°, ${r.lon.toFixed(2)}°`}
                  </div>
                </div>
                <span className="shrink-0 text-[0.48rem] uppercase tracking-wide text-[var(--color-faint)]">{r.type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
