/** Canvas-ready colors resolved from the active dashboard theme. */
export interface DashboardChartTheme {
  text: string;
  mutedText: string;
  grid: string;
  card: string;
  verified: string;
  traded: string;
  volume: string;
  count: string;
}

const chartTokenDefaults: DashboardChartTheme = {
  text: "#242933",
  mutedText: "#6A6E76",
  grid: "#ECEEF3",
  card: "#FFFFFF",
  verified: "#FFF700",
  traded: "#4DCE7B",
  volume: "#00AAFE",
  count: "#4DCE7B",
};

/**
 * Resolves one CSS custom property for use in a canvas-only chart option.
 */
const readCssToken = (token: string, fallback: string): string => {
  if (!import.meta.client) return fallback;

  return (
    getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
    fallback
  );
};

/**
 * Resolves reactive Chart.js colors from the dashboard's light or dark tokens.
 */
export const useDashboardChartTheme = () => {
  const { effectiveTheme } = useThemeHandler();
  const chartTheme = ref<DashboardChartTheme>({ ...chartTokenDefaults });

  /** Refreshes canvas colors after the document theme changes. */
  const refreshChartTheme = () => {
    chartTheme.value = {
      text: readCssToken("--color-dashboard-heading", chartTokenDefaults.text),
      mutedText: readCssToken(
        "--color-dashboard-text",
        chartTokenDefaults.mutedText,
      ),
      grid: readCssToken(
        "--color-dashboard-chart-grid",
        chartTokenDefaults.grid,
      ),
      card: readCssToken("--color-dashboard-bg", chartTokenDefaults.card),
      verified: readCssToken(
        "--color-dashboard-chart-verified",
        chartTokenDefaults.verified,
      ),
      traded: readCssToken(
        "--color-dashboard-chart-traded",
        chartTokenDefaults.traded,
      ),
      volume: readCssToken(
        "--color-dashboard-chart-volume",
        chartTokenDefaults.volume,
      ),
      count: readCssToken(
        "--color-dashboard-chart-count",
        chartTokenDefaults.count,
      ),
    };
  };

  onMounted(() => {
    refreshChartTheme();

    watch(effectiveTheme, async () => {
      await nextTick();
      refreshChartTheme();
    });
  });

  return {
    chartTheme,
  };
};
