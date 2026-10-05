<script setup lang="ts">
import type { AppDropdown } from "#components";
import {
  EVENT_STATUS_LABELS,
  type IEvent,
} from "../composables/useEventStore";

type ExportFormat = "csv" | "json";

const props = defineProps<{
  /** Events to export — normally the currently filtered list. */
  events: IEvent[];
}>();

const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

const exportOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: "csv", label: "Export as CSV" },
  { value: "json", label: "Export as JSON" },
];

/** Quotes a value for safe inclusion in a CSV cell. */
const toCsvCell = (value: string | number): string =>
  `"${String(value).replace(/"/g, '""')}"`;

/** Serializes the events into the requested file format. */
const serializeEvents = (format: ExportFormat): string => {
  if (format === "json") return JSON.stringify(props.events, null, 2);

  const header = ["Name", "Target", "Location", "Date", "Status"];
  const rows = props.events.map((event) =>
    [
      event.name,
      event.target,
      event.location,
      event.date,
      EVENT_STATUS_LABELS[event.status],
    ]
      .map(toCsvCell)
      .join(","),
  );
  return [header.map(toCsvCell).join(","), ...rows].join("\n");
};

/** Downloads the events as a file in the chosen format and closes the menu. */
const exportEvents = (format: ExportFormat): void => {
  dropdown.value?.closeDropdown();

  if (!props.events.length) {
    useToastHandler().triggerToast(
      "There are no events to export for the current filters.",
      "error",
      "Nothing to export",
      "small",
    );
    return;
  }

  const blob = new Blob([serializeEvents(format)], {
    type: format === "csv" ? "text/csv;charset=utf-8" : "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `events.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <AppDropdown ref="dropdown" position="right" :width-is-finite="false">
    <template #default>
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
        aria-haspopup="menu"
      >
        <Icon name="vent:send" size="1rem" />
        Export
        <Icon name="vent:arrow-down" size="0.9rem" />
      </button>
    </template>
    <template #dropdown_body>
      <div class="min-w-40 space-y-1" role="menu">
        <button
          v-for="option in exportOptions"
          :key="option.value"
          type="button"
          role="menuitem"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="exportEvents(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </template>
  </AppDropdown>
</template>
