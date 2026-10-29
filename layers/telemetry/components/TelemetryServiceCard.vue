<script setup lang="ts">
/** Label/value pair rendered in a service card's detail list. */
export interface ITelemetryServiceDetail {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    title: string;
    /** Nuxt Icon name, e.g. `vent:radar`. */
    icon: string;
    /** Raw service status; the pill is hidden when omitted. */
    status?: string;
    details?: ITelemetryServiceDetail[];
  }>(),
  {
    status: "",
    details: () => [],
  },
);
</script>

<template>
  <article
    class="flex flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
  >
    <header class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-lg bg-dashboard-bg-dark text-dashboard-heading"
        >
          <Icon :name="props.icon" size="1.1rem" aria-hidden="true" />
        </span>
        <h3 class="truncate text-sm font-medium text-dashboard-heading">
          {{ props.title }}
        </h3>
      </div>
      <TelemetryStatusPill v-if="props.status" :status="props.status" />
    </header>

    <dl
      v-if="props.details.length"
      class="mt-4 divide-y divide-dashboard-card-border"
    >
      <div
        v-for="detail in props.details"
        :key="detail.label"
        class="flex items-center justify-between gap-4 py-2.5 text-sm"
      >
        <dt class="text-dashboard-text">{{ detail.label }}</dt>
        <dd class="truncate text-right font-medium text-dashboard-heading">
          {{ detail.value }}
        </dd>
      </div>
    </dl>

    <slot></slot>
  </article>
</template>
