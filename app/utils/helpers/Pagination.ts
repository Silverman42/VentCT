import type { IPaginationMeta } from "~/utils/types/misc/ResponseBody";

/** Derives the last page from list meta, falling back to total / per_page. */
export const resolveLastPage = (meta: IPaginationMeta | undefined): number => {
  if (!meta) return 1;
  if (meta.last_page) return Math.max(1, meta.last_page);
  return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.per_page || 1)));
};
