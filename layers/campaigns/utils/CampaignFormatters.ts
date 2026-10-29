import { DateFormatter } from "~/utils/helpers/DateFormatter";

/** Formats an API date as `Mon D, YYYY`, or returns the fallback when missing or invalid. */
export const formatCampaignDate = (
  date: string | null | undefined,
  fallback = "—",
): string => {
  if (!date || Number.isNaN(new Date(date).getTime())) return fallback;
  return DateFormatter.formatDate(date);
};

/** Formats a campaign's start and end dates as a single readable range. */
export const formatCampaignDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  fallback = "Dates not set",
): string => {
  const start = formatCampaignDate(startDate, "");
  const end = formatCampaignDate(endDate, "");
  if (start && end) return `${start} – ${end}`;
  return start || end || fallback;
};
