import { format, formatDistanceToNow } from "date-fns";

export const DateFormatter = {
  formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },
  formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },
  getYear(date: string) {
    return new Date(date).getFullYear();
  },

  formatWithPattern(date: string, pattern: string) {
    return format(new Date(date), pattern);
  },

  formatDistanceToNow(date: string) {
    return formatDistanceToNow(date,  {addSuffix: true});
  },
};
