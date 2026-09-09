export const StringFormatter = {
  truncateString(
    string: string,
    length: number,
    type: "start" | "end" | "center" = "center"
  ) {
    return string.length > length
      ? type === "start"
        ? string.slice(0, length) + "..."
        : type === "end"
        ? "..." + string.slice(-length)
        : string.slice(0, length / 2) + "..." + string.slice(-length / 2)
      : string;
  },

  camelToSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
  },

  snakeToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },
};
