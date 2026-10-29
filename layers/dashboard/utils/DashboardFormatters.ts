import {
  endOfDay,
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { NumberFormatter } from "~/utils/helpers/NumberFormatter";
import type {
  DashboardSeriesPeriod,
  DashboardSeriesUnit,
  DashboardTimeframe,
} from "../composables/useDashboardStore";

/** Preset shape consumed by `AppDateTimeDropdown`, keyed by API timeframe. */
export interface DashboardTimeframePreset {
  key: DashboardTimeframe;
  label: string;
  start?: string;
  end?: string;
  custom?: boolean;
}

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

/** Formats a USD amount as `$1,234.56`, treating missing values as zero. */
export const formatUsd = (value: number | null | undefined): string =>
  `$${NumberFormatter.format(value ?? 0)}`;

/** Formats a count with thousands separators and no decimals. */
export const formatCount = (value: number | null | undefined): string =>
  NumberFormatter.format(value ?? 0, { decimals: 0 });

/** Formats a percentage with at most one decimal place, e.g. `48.8%`. */
export const formatPercent = (value: number | null | undefined): string =>
  `${Number((value ?? 0).toFixed(1))}%`;

const BUCKET_PATTERNS: Record<DashboardSeriesUnit, string> = {
  hour: "yyyy-MM-dd HH:mm",
  day: "yyyy-MM-dd",
  month: "yyyy-MM",
};

const LABEL_PATTERNS: Record<DashboardSeriesUnit, string> = {
  hour: "h a",
  day: "MMM d",
  month: "MMM",
};

/**
 * Turns an API bucket key (`2026-10-22 08:00`, `2026-10-16`, `2026-10`) into a
 * short axis label (`8 AM`, `Oct 16`, `Oct`). Unparseable keys are returned as is.
 */
export const formatBucketLabel = (
  bucket: string,
  unit: DashboardSeriesUnit,
): string => {
  const pattern = BUCKET_PATTERNS[unit] ?? BUCKET_PATTERNS.day;
  const parsed = parse(bucket, pattern, new Date());
  return isValid(parsed)
    ? format(parsed, LABEL_PATTERNS[unit] ?? LABEL_PATTERNS.day)
    : bucket;
};

/**
 * Returns a rounded y-axis ceiling a little above the largest value, so the
 * chart splits into four even steps (e.g. 523 → 600, 0.4 → 0.5, 0 → 4).
 */
export const getNiceAxisMax = (values: number[]): number => {
  const largest = Math.max(0, ...values.filter(Number.isFinite));
  if (largest === 0) return 4;

  const magnitude = 10 ** Math.floor(Math.log10(largest));
  const normalized = largest / magnitude;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
    (candidate) => candidate >= normalized * 1.05,
  ) ?? 10;

  return step * magnitude;
};

/** Formats a date as `yyyy-MM-dd` for the API `startDate` / `endDate` params. */
export const toApiDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? format(date, "yyyy-MM-dd") : "";
};

/**
 * Builds the timeframe presets for the dashboard date filter. Each preset
 * carries real dates (for the custom-range editor); `all_time` uses a fixed
 * early start because the API needs no dates for it.
 */
export const buildTimeframePresets = (
  now = new Date(),
): DashboardTimeframePreset[] => {
  const end = endOfDay(now).toISOString();
  /** Builds one preset ending today. */
  const preset = (
    key: DashboardTimeframe,
    label: string,
    start: Date,
  ): DashboardTimeframePreset => ({
    key,
    label,
    start: startOfDay(start).toISOString(),
    end,
  });

  return [
    preset("all_time", "All time", new Date(2020, 0, 1)),
    preset("today", "Today", now),
    preset("this_week", "This week", startOfWeek(now, { weekStartsOn: 1 })),
    preset("last_7_days", "Last 7 days", subDays(now, 6)),
    preset("this_month", "This month", startOfMonth(now)),
    preset("last_30_days", "Last 30 days", subDays(now, 29)),
    preset("last_90_days", "Last 90 days", subDays(now, 89)),
    preset("this_year", "This year", startOfYear(now)),
    preset("last_12_months", "Last 12 months", subMonths(now, 12)),
    { key: "custom", label: "Custom range", custom: true },
  ];
};
