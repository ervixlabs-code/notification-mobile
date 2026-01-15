// src/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "themeMode"; // "dark" | "light"

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  COLORS: any;
  ready: boolean; // tema localden yüklendi mi?
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildColors(isDark: boolean) {
  if (isDark) {
    return {
      BG: "#0B0F1A",
      CARD: "#121826",
      TEXT: "#F2F4F8",
      MUTED: "#9AA4B2",
      BORDER: "rgba(255,255,255,0.08)",
      PRIMARY: "#FF6A3D",
      PRIMARY_SOFT: "rgba(255,106,61,0.18)",
    };
  }

  return {
    BG: "#FFFFFF",
    CARD: "#FFFFFF",
    TEXT: "#0B0F1A",
    MUTED: "#5B6373",
    BORDER: "#E6EAF1",
    PRIMARY: "#FF6A3D",
    PRIMARY_SOFT: "rgba(255,106,61,0.12)",
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // İlk değer: sistem temasına göre (ama hemen sonra localden override edeceğiz)
  const systemIsDark = Appearance.getColorScheme() === "dark";

  const [isDark, _setIsDark] = useState(systemIsDark);
  const [ready, setReady] = useState(false);

  // Açılışta localden yükle
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_KEY);
        if (!mounted) return;

        if (saved === "dark") _setIsDark(true);
        else if (saved === "light") _setIsDark(false);
        else _setIsDark(systemIsDark); // hiç kayıt yoksa sistem teması
      } catch {
        _setIsDark(systemIsDark);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // setIsDark: hem state hem local kaydet
  const setIsDark = async (v: boolean) => {
    _setIsDark(v);
    try {
      await SecureStore.setItemAsync(THEME_KEY, v ? "dark" : "light");
    } catch {
      // sessiz geç
    }
  };

  const COLORS = useMemo(() => buildColors(isDark), [isDark]);

  const value = useMemo(
    () => ({ isDark, setIsDark, COLORS, ready }),
    [isDark, COLORS, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
