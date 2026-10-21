/** Summary metric card rendered by `AppMetricRows`. */
export interface IAppMetric {
  label: string;
  value: string;
  description: string;
  /** Stable identifier emitted with `select` when the card is actionable. */
  key?: string;
  /** Renders the card as a button with a chevron that emits `select`. */
  actionable?: boolean;
}
