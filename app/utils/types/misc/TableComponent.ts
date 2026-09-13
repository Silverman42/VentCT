/** Defines how a column is rendered by the shared responsive table. */
export interface ITableHeaderData {
  /** The object property and named slot suffix used for the column. */
  id: string;
  /** The visible desktop heading and mobile field label. */
  name: string;
  /** Alignment shared by the heading and cell content. */
  justify?: "center" | "left" | "right";
  /** Hides non-essential information from the mobile card layout. */
  isHiddenOnMobile?: boolean;
  /** Overrides the column heading when it is displayed on mobile. */
  mobileLabel?: string;
  /** Applies a fixed or minimum width to a desktop table column. */
  width?: string;
}

/** Represents one row that can be rendered by the shared responsive table. */
export interface ITableBodyData {
  /** A stable row identifier used by default for rendering and selection. */
  id: string | number;
  /** Supports field lookup and named cell slots for consumer-owned row types. */
  [key: string]: any;
}
