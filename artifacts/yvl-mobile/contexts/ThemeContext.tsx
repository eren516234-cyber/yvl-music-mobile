import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSettings, saveSettings } from "@/lib/storage";

export const PRESET_COLOURS = [
  { name: "White",  hex: "#ffffff" },
  { name: "Coral",  hex: "#ff6f61" },
  { name: "Yellow", hex: "#ffd23f" },
  { name: "Green",  hex: "#4ade80" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "Pink",   hex: "#ec4899" },
  { name: "Orange", hex: "#f97316" },
  { name: "Cyan",   hex: "#22d3ee" },
  { name: "Red",    hex: "#ef4444" },
] as const;

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sl = s / 100;
  const ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

type ThemeCtxType = {
  accent: string;
  baseAccent: string;
  rainbow: boolean;
  quality: string;
  lyricsMode: string;
  perScreenColour: boolean;
  setAccent: (hex: string) => void;
  setRainbow: (v: boolean) => void;
  setQuality: (q: string) => void;
  setLyricsMode: (m: string) => void;
  setPerScreenColour: (v: boolean) => void;
};

const ThemeCtx = createContext<ThemeCtxType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [baseAccent, setBaseAccent] = useState("#ffffff");
  const [accent, setAccentState] = useState("#ffffff");
  const [rainbow, setRainbow] = useState(false);
  const [quality, setQuality] = useState("320kbps");
  const [lyricsMode, setLyricsMode] = useState("ios");
  const [perScreenColour, setPerScreenColourState] = useState(false);
  const rainbowRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setBaseAccent(s.accentHex);
      setAccentState(s.accentHex);
      setRainbow(s.rainbow);
      setQuality(s.quality);
      setLyricsMode(s.lyricsMode);
      setPerScreenColourState(s.perScreenColour ?? false);
    });
  }, []);

  useEffect(() => {
    if (rainbowRef.current) clearInterval(rainbowRef.current);
    if (rainbow) {
      const start = Date.now();
      rainbowRef.current = setInterval(() => {
        const t = ((Date.now() - start) % 14000) / 14000;
        setAccentState(hslToHex(t * 360, 80, 65));
      }, 33);
    } else {
      setAccentState(baseAccent);
    }
    return () => { if (rainbowRef.current) clearInterval(rainbowRef.current); };
  }, [rainbow, baseAccent]);

  const setAccent = useCallback((hex: string) => {
    setBaseAccent(hex);
    if (!rainbow) setAccentState(hex);
    void saveSettings({ accentHex: hex });
  }, [rainbow]);

  const handleSetRainbow = useCallback((v: boolean) => {
    setRainbow(v);
    void saveSettings({ rainbow: v });
  }, []);

  const handleSetQuality = useCallback((q: string) => {
    setQuality(q);
    void saveSettings({ quality: q as "96kbps" | "160kbps" | "320kbps" });
  }, []);

  const handleSetLyricsMode = useCallback((m: string) => {
    setLyricsMode(m);
    void saveSettings({ lyricsMode: m });
  }, []);

  const handleSetPerScreenColour = useCallback((v: boolean) => {
    setPerScreenColourState(v);
    void saveSettings({ perScreenColour: v });
  }, []);

  return (
    <ThemeCtx.Provider value={{
      accent,
      baseAccent,
      rainbow,
      quality,
      lyricsMode,
      perScreenColour,
      setAccent,
      setRainbow: handleSetRainbow,
      setQuality: handleSetQuality,
      setLyricsMode: handleSetLyricsMode,
      setPerScreenColour: handleSetPerScreenColour,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
