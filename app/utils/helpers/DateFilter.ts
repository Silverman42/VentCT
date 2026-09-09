import { format, isValid, parseISO } from "date-fns";
import { DateRangeType } from "~/utils/types/enum/DateSelection";
import { DateSelections } from "~/utils/types/enum/Selections";

export interface DateFilterRequest {
  period: string;
  type: DateRangeType;
}

export interface DateFilterSelection extends DateFilterRequest {
  label: string;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const PERIOD_LABELS: Record<DateSelections, string> = {
  [DateSelections.ALL]: "All",
  [DateSelections.TODAY]: "Today",
  [DateSelections.YESTERDAY]: "Yesterday",
  [DateSelections.THIS_WEEK]: "This Week",
  [DateSelections.LAST_7_DAYS]: "Last 7 Days",
  [DateSelections.LAST_30_DAYS]: "Last 30 Days",
  [DateSelections.THIS_MONTH]: "This Month",
  [DateSelections.LAST_6_MONTHS]: "Last 6 Months",
  [DateSelections.THIS_YEAR]: "This Year",
};

const resolveDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;

  const resolved =
    value instanceof Date
      ? new Date(value)
      : DATE_ONLY_PATTERN.test(value)
        ? parseISO(value)
        : new Date(value);

  return isValid(resolved) ? resolved : null;
};

const formatInputDate = (value: string | Date): string => {
  const date = resolveDate(value);
  return date ? format(date, "yyyy-MM-dd") : "";
};

const formatDisplayDate = (value: string | Date): string => {
  const date = resolveDate(value);
  return date ? format(date, "MMM d, yyyy") : "";
};

export const DateFilterHelper = {
  formatInputDate,
  formatDisplayDate,

  formatPeriodLabel(period: DateSelections): string {
    return PERIOD_LABELS[period] ?? period.replaceAll("_", " ");
  },

  createPeriodSelection(period: DateSelections): DateFilterSelection {
    return {
      period,
      type: DateRangeType.PERIOD,
      label: DateFilterHelper.formatPeriodLabel(period),
    };
  },

  createSingleSelection(date: string | Date): DateFilterSelection {
    const normalizedDate = formatInputDate(date);

    return {
      period: normalizedDate,
      type: DateRangeType.SINGLE,
      label: formatDisplayDate(normalizedDate),
    };
  },

  createRangeSelection(
    startDate: string | Date,
    endDate: string | Date,
  ): DateFilterSelection {
    const normalizedStartDate = formatInputDate(startDate);
    const normalizedEndDate = formatInputDate(endDate);

    return {
      period: `${normalizedStartDate},${normalizedEndDate}`,
      type: DateRangeType.RANGE,
      label: `${formatDisplayDate(normalizedStartDate)} - ${formatDisplayDate(normalizedEndDate)}`,
    };
  },

  toRequest(selection: DateFilterSelection): DateFilterRequest {
    return {
      period: selection.period,
      type: selection.type,
    };
  },
};
