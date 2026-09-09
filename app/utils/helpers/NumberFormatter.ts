export const NumberFormatter = {
  /**
   * Formats a number or string value into a human-readable string.
   *
   * @param value - The value to format.
   * @param options - Formatting options.
   * @param options.decimals - The number of decimal places (default is 2).
   * @param options.compact - Whether to use compact notation (e.g., 1.5M, 1.54K).
   * @returns The formatted string.
   */
  format(
    value: number | string | null | undefined,
    options: {
      decimals?: number;
      compact?: boolean;
    } = {}
  ): string {
    const { decimals = 2, compact = false } = options;

    if (value === null || value === undefined || value === "") {
      return "0" + (decimals > 0 ? ".".padEnd(decimals + 1, "0") : "");
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return "0" + (decimals > 0 ? ".".padEnd(decimals + 1, "0") : "");
    }

    if (compact) {
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: decimals,
        minimumFractionDigits: 0,
      }).format(numValue);
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  },
};
