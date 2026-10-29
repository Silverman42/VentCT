<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { IActivityLog } from "../composables/useActivityLogStore";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Template-ready view model of one activity log entry. */
interface ActivityLogView {
  description: string;
  module: string;
  causerName: string;
  causerEmail: string;
  hasCauser: boolean;
  subjectName: string;
  subjectId: string;
  hasSubjectId: boolean;
  timestamp: string;
  properties: Array<{ key: string; value: string }>;
}

const sideModal = ref<SideModalController | null>(null);
const activityLog = ref<IActivityLog | null>(null);

/** Formats a property value for display; objects are JSON-stringified. */
const formatPropertyValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

/** Formats an ISO timestamp as date and time, with a fallback when missing. */
const formatTimestamp = (value?: string): string =>
  value
    ? `${DateFormatter.formatDate(value)}, ${DateFormatter.formatTime(value)}`
    : "—";

/** Maps the selected log entry to a safe side-panel view model. */
const view = computed<ActivityLogView | null>(() => {
  const log = activityLog.value;
  if (!log) return null;

  return {
    description: log.description || "—",
    module: log.log_name ?? "",
    causerName: log.causer?.name || "System",
    causerEmail: log.causer?.email ?? "",
    hasCauser: Boolean(log.causer),
    subjectName: log.subject_type?.split("\\").pop() || "—",
    subjectId: log.subject_id ?? "",
    hasSubjectId: Boolean(log.subject_id),
    timestamp: formatTimestamp(log.created_at),
    properties: Object.entries(log.properties ?? {}).map(([key, value]) => ({
      key,
      value: formatPropertyValue(value),
    })),
  };
});

/** Opens the side panel for the given activity log entry. */
const open = (log: IActivityLog): void => {
  activityLog.value = log;
  sideModal.value?.showDialogBox();
};

/** Closes the side panel. */
const close = (): void => {
  sideModal.value?.hideDialogBox();
};

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="sideModal" close-button-position="inside">
    <section v-if="view" class="flex min-h-full flex-col gap-7 pr-1">
      <header class="border-b border-dashboard-card-border pb-6 pr-12">
        <p class="text-sm text-dashboard-text">Activity log details</p>
        <div class="mt-3">
          <ActivityLogModulePill :module="view.module" />
        </div>
        <h2
          class="mt-3 break-words text-xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ view.description }}
        </h2>
        <p class="mt-2 text-sm text-dashboard-text">{{ view.timestamp }}</p>
      </header>

      <dl class="space-y-6">
        <div>
          <dt class="text-sm text-dashboard-text">Performed by</dt>
          <dd class="mt-1 text-base font-medium text-dashboard-heading">
            {{ view.causerName }}
          </dd>
          <dd
            v-if="view.hasCauser && view.causerEmail"
            class="break-all text-sm text-dashboard-text"
          >
            {{ view.causerEmail }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-dashboard-text">Subject</dt>
          <dd class="mt-1 text-base font-medium text-dashboard-heading">
            {{ view.subjectName }}
          </dd>
          <dd v-if="view.hasSubjectId" class="mt-1">
            <AppClipBoard
              :text="view.subjectId"
              toast-title="ID Copied"
              toast-message="Subject ID copied to clipboard successfully"
              class="justify-start"
            >
              <span class="break-all text-sm text-dashboard-text">
                {{ view.subjectId }}
              </span>
            </AppClipBoard>
          </dd>
        </div>
      </dl>

      <section
        class="border-t border-dashboard-card-border pt-6"
        aria-labelledby="activity-log-properties-heading"
      >
        <h3
          id="activity-log-properties-heading"
          class="text-lg font-medium tracking-tight text-dashboard-heading"
        >
          Properties
        </h3>
        <dl v-if="view.properties.length" class="mt-4 space-y-4">
          <div
            v-for="property in view.properties"
            :key="property.key"
            class="rounded-lg border border-dashboard-card-border bg-dashboard-bg-dark px-4 py-3"
          >
            <dt class="text-xs uppercase tracking-wide text-dashboard-text">
              {{ property.key.replaceAll("_", " ") }}
            </dt>
            <dd
              class="mt-1 whitespace-pre-wrap break-all font-mono text-sm text-dashboard-heading"
            >
              {{ property.value }}
            </dd>
          </div>
        </dl>
        <p v-else class="mt-2 text-sm text-dashboard-text">
          No additional properties were recorded for this activity.
        </p>
      </section>
    </section>
  </AppSideModal>
</template>
