<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { DashboardTimeframe } from "../composables/useDashboardStore";
import {
  buildTimeframePresets,
  formatCount,
  toApiDate,
} from "../utils/DashboardFormatters";

/** Range shape bound to `AppDateTimeDropdown`. */
interface TimeframeRange {
  key: string;
  label: string;
  start: string;
  end: string;
  custom?: boolean;
}

/** Template-ready country option; an empty code means all countries. */
interface CountryOption {
  code: string;
  label: string;
  hint: string;
}

const { filters, countries, fetchingCountries, setFilters } =
  useDashboardStore();

const presets = buildTimeframePresets();
const countryDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** Rebuilds the dropdown selection from the stored filters. */
const getInitialRange = (): TimeframeRange | null => {
  const { timeframe, startDate, endDate } = filters.value;
  if (timeframe === "custom" && startDate && endDate) {
    return {
      key: "custom",
      label: "Custom",
      start: new Date(`${startDate}T00:00:00`).toISOString(),
      end: new Date(`${endDate}T23:59:59`).toISOString(),
      custom: true,
    };
  }

  const preset = presets.find((item) => item.key === timeframe);
  return preset?.start && preset.end
    ? { key: preset.key, label: preset.label, start: preset.start, end: preset.end }
    : null;
};

const timeframeRange = ref<TimeframeRange | null>(getInitialRange());

/** Country choices, with "All Country" first and audience counts as hints. */
const countryOptions = computed<CountryOption[]>(() => [
  { code: "", label: "All Country", hint: "" },
  ...countries.value.map((country) => ({
    code: country.code,
    label: country.name || country.code,
    hint: formatCount(country.audienceCount),
  })),
]);

/** Label of the selected country for the trigger button. */
const selectedCountryLabel = computed(
  () =>
    countryOptions.value.find(
      (option) => option.code === (filters.value.countryCode ?? ""),
    )?.label ?? "All Country",
);

/** Applies one country choice and closes the menu. */
const selectCountry = (code: string): void => {
  setFilters({ countryCode: code || undefined });
  countryDropdown.value?.closeDropdown();
};

watch(timeframeRange, (range) => {
  if (!range) return;

  if (range.custom) {
    setFilters({
      timeframe: "custom",
      startDate: toApiDate(range.start),
      endDate: toApiDate(range.end),
    });
    return;
  }

  setFilters({ timeframe: range.key as DashboardTimeframe });
});
</script>

<template>
  <section
    class="flex flex-wrap items-center justify-between gap-3"
    aria-label="Dashboard filters"
  >
    <p class="text-xs text-dashboard-text">
      Country applies to promoter volume and the charts.
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <AppDateTimeDropdown
        v-model="timeframeRange"
        :presets="presets"
        show-preset-label
        button-class="!rounded-lg !px-3 !py-2 !font-normal"
      />

      <AppDropdown ref="countryDropdown" position="right" :width-is-finite="false">
        <template #default>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg-darker px-3 py-3 text-sm text-dashboard-heading transition hover:border-brand-color-default"
            :aria-busy="fetchingCountries"
          >
            <Icon name="vent:global" size="1rem" />
            {{ selectedCountryLabel }}
            <Icon name="vent:arrow-down" size="0.9rem" />
          </button>
        </template>
        <template #dropdown_body>
          <div class="max-h-72 min-w-48 space-y-1 overflow-y-auto">
            <button
              v-for="option in countryOptions"
              :key="option.code || 'all'"
              type="button"
              class="flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
              :class="{
                'bg-dashboard-bg-dark': (filters.countryCode ?? '') === option.code,
              }"
              @click="selectCountry(option.code)"
            >
              <span>{{ option.label }}</span>
              <span v-if="option.hint" class="text-xs text-dashboard-text">
                {{ option.hint }}
              </span>
            </button>
            <p
              v-if="!fetchingCountries && countryOptions.length === 1"
              class="px-3 py-2 text-xs text-dashboard-text"
            >
              No countries with audiences yet.
            </p>
          </div>
        </template>
      </AppDropdown>
    </div>
  </section>
</template>
