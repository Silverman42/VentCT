import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";

export const withCanNavigate = (
  headings: ITableHeaderData[],
  canNavigate: boolean,
): ITableHeaderData[] =>
  headings.map((heading) => ({
    ...heading,
    canNavigate,
  }));
