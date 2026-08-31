import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "serverprice-theme";

function readStoredTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/**
 * Dark is the default look; `.light` is applied to <html> to opt out.
 * The blocking script in __root.tsx sets the class before hydration so
 * there's no flash — this hook just mirrors that state into React and
 * persists changes.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("light", next === "light");
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing / storage disabled — theme just won't persist.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export const THEME_STORAGE_KEY = STORAGE_KEY;
