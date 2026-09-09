export interface Metadata {
  [key: string]: any;
}

export interface IResponse<T = any, E = ValidationError, M = Meta> {
  event: ResponseEvents;
  status: boolean;
  message: string;
  data: T;
  errors: E;
  meta: M;
  links: IResponseLinks;
}

export interface CursorMeta {
  path: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export type ValidationError = Record<string, string[]>;

export interface IErrorStatus {
  status: string[];
}

export interface IListResponseData<T = any> {
  data:  T;
  links: Links;
  meta:  Meta;
}

export interface Links {
  first: string;
  last:  null;
  prev:  null;
  next:  null;
}

export interface Meta {
  current_page:     number;
  current_page_url: string;
  from:             number | null;
  path:             string;
  per_page:         number;
  to:               number | null;
}


export interface IResponseMeta {
  current_page: number;
  from: string | null;
  last_page: number;
  path: string;
  per_page: number;
  to: string | null;
  total: number;
}

export interface IResponseLinks {
  first: string;
  last: string;
  next: string;
  prev: string;
}

export enum ResponseEnum {
  SUCCESS = "success",
  ERROR = "error",
}

export enum ResponseEvents {
  TWO_FACTOR_ENABLED = "two-factor-enabled",
  PASSWORD_EXPIRED = "PASSWORD_EXPIRED",
  DEFAULT = "default",
}
