"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Currency } from "./types";
import type { Lang } from "./i18n";
import { play, setSoundEnabled } from "./sound";
import type { CameraState } from "./entities/types";

interface AppState {
  // Legacy state
  currency: Currency;
  setCurrency: (c: Currency) => void;
  soundOn: boolean;
  toggleSound: () => void;
  sfx: typeof play;
  lang: Lang;
  setLang: (l: Lang) => void;

  // Camera state (Phase 2 foundation)
  camera: CameraState;
  setCamera: (c: Partial<CameraState>) => void;

  // Status bar data
  fps: number;
  setFps: (n: number) => void;
}

const Ctx = createContext<AppState | null>(null);

const DEFAULT_CAMERA: CameraState = {
  lat: 20,
  lon: 10,
  altitude: 15000000,
  zoom: 2,
  heading: 0,
  pitch: 0,
  roll: 0,
  fov: 45,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("CHF");
  const [soundOn, setSoundOn] = useState(true);
  const [lang, setLangState] = useState<Lang>("en");
  const [camera, setCameraState] = useState<CameraState>(DEFAULT_CAMERA);
  const [fps, setFps] = useState(60);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    play("click");
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) play("select");
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  const setCamera = useCallback((c: Partial<CameraState>) => {
    setCameraState((prev) => ({ ...prev, ...c }));
  }, []);

  return (
    <Ctx.Provider
      value={{
        currency, setCurrency, soundOn, toggleSound, sfx: play, lang, setLang,
        camera, setCamera, fps, setFps,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
