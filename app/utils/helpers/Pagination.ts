import type { IPaginationMeta } from "~/utils/types/misc/ResponseBody";

/** Derives the last page from list meta, falling back to total / perPage. */
export const resolveLastPage = (meta: IPaginationMeta | undefined): number => {
  if (!meta) return 1;
  if (meta.lastPage) return Math.max(1, meta.lastPage);
  return Math.max(1, Math.ceil((meta.total ?? 0) / (meta.perPage || 1)));
};
