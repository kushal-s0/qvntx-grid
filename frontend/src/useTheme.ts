import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "qvntx-grid-theme";

function preferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Theme switching still works when browser storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0e1425" : "#ede8f5");
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setTheme(preferredTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    media.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Session-only fallback. */
    }
    setTheme(next);
  };
  return { theme, toggleTheme };
}
