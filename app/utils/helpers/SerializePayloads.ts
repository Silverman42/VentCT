export function SerializePayload(payload: Record<string, any>) {
  return Object.keys(payload)
    .filter((key) => payload[key] !== undefined && payload[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
    .join("&");
}

export function SerializeListQuery(params: {
  search: string;
  filter: Record<string, string | boolean | number | null>;
  filterFormat?: "nested" | "flat";
}): string {
  const { search, filter, filterFormat = "nested" } = params;

  const query =
    filterFormat === "flat"
      ? `&search=${encodeURIComponent(search)}`
      : `&filter[search]=${encodeURIComponent(search)}`;

  const filterEntries = Object.entries(filter).filter(
    ([, value]) => value !== null && value !== undefined
  );

  if (filterEntries.length === 0) return query;

  const filterString = filterEntries
    .map(
      ([key, value]) =>
        filterFormat === "flat"
          ? `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
          : `filter[${encodeURIComponent(key)}]=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return `${query}&${filterString}`;
}
