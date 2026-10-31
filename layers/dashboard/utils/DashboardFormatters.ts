import type { AnalyticsTimeframePreset } from "~/utils/helpers/AnalyticsFormatters";
import type { DashboardSeriesPeriod } from "../composables/useDashboardStore";

// Shared analytics formatters live in `app/utils/helpers`; re-exported so
// dashboard components keep importing from this file.
export {
  buildTimeframePresets,
  formatBucketLabel,
  formatCount,
  formatPercent,
  formatUsd,
  getNiceAxisMax,
  toApiDate,
} from "~/utils/helpers/AnalyticsFormatters";

/** Preset shape consumed by `AppDateTimeDropdown`, keyed by API timeframe. */
export type DashboardTimeframePreset = AnalyticsTimeframePreset;

/** Label/value pair rendered by `AppPeriodSelector`. */
export interface DashboardPeriodOption {
  label: string;
  value: DashboardSeriesPeriod;
}

/** Chart period options shown on both dashboard charts. */
export const dashboardPeriodOptions: DashboardPeriodOption[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "2W", value: "2w" },
  { label: "1M", value: "1m" },
];
