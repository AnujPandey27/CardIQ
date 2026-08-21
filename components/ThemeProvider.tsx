"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "system" | "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export function useCardIQTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useCardIQTheme must be used inside ThemeProvider"
    );
  }

  return context;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" && prefersDark);

  root.classList.toggle("dark", shouldUseDark);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      "cardiq-theme"
    ) as Theme | null;

    const initialTheme: Theme =
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
        ? savedTheme
        : "system";

    setThemeState(initialTheme);
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      const currentTheme =
        window.localStorage.getItem(
          "cardiq-theme"
        ) as Theme | null;

      if (!currentTheme || currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    window.localStorage.setItem(
      "cardiq-theme",
      newTheme
    );

    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
