/**
 * Theme mode types for the application.
 */
export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

const THEME_STORAGE_KEY = "vent-theme-mode";
let initialized = false;
let systemThemeQuery: MediaQueryList | null = null;
let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

/**
 * Composable to handle the application theme (light/dark/system).
 *
 * Features:
 * - Persists theme preference in localStorage
 * - Supports system preference detection
 * - Applies appropriate class to document root for CSS variable switching
 *
 * @returns {{ themeMode: Ref<ThemeMode>, effectiveTheme: ComputedRef<'light' | 'dark'>, setTheme: (mode: ThemeMode) => void, toggleTheme: () => void }}
 */
export const useThemeHandler = () => {
  // The user's selected theme preference
  const themeMode = useState<ThemeMode>(
    "useThemeHandler.themeMode",
    () => ThemeMode.SYSTEM
  );

  // Track system preference
  const systemPrefersDark = useState<boolean>(
    "useThemeHandler.systemPrefersDark",
    () => false
  );

  // Computed effective theme based on mode and system preference
  const effectiveTheme = computed<"light" | "dark">(() => {
    if (themeMode.value === ThemeMode.SYSTEM) {
      return systemPrefersDark.value ? "dark" : "light";
    }
    return themeMode.value as "light" | "dark";
  });

  /**
   * Apply the theme class to the document root element
   */
  const applyTheme = (theme: "light" | "dark") => {
    if (import.meta.client) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  };

  /**
   * Initialize theme from localStorage and set up system preference listener
   */
  const initTheme = () => {
    if (!import.meta.client) return;

    if (!initialized) {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme && Object.values(ThemeMode).includes(savedTheme)) {
        themeMode.value = savedTheme;
      }

      systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
      systemPrefersDark.value = systemThemeQuery.matches;
      systemThemeListener = (event) => {
        systemPrefersDark.value = event.matches;
        if (themeMode.value === ThemeMode.SYSTEM) {
          applyTheme(event.matches ? "dark" : "light");
        }
      };
      systemThemeQuery.addEventListener("change", systemThemeListener);
      initialized = true;
    }

    applyTheme(effectiveTheme.value);
  };

  /**
   * Set the theme mode and persist to localStorage
   */
  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      applyTheme(effectiveTheme.value);
    }
  };

  /**
   * Cycle through themes: light -> dark -> system -> light
   */
  const toggleTheme = () => {
    const modes = [ThemeMode.LIGHT, ThemeMode.DARK, ThemeMode.SYSTEM];
    const currentIndex = modes.indexOf(themeMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex] ?? ThemeMode.LIGHT);
  };

  // Watch for theme changes to apply them
  watch(effectiveTheme, (newTheme) => {
    applyTheme(newTheme);
  });

  return {
    themeMode,
    effectiveTheme,
    systemPrefersDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
};
