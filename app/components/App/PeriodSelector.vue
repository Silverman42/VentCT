<script setup lang="ts" generic="T extends string | number">
type PeriodSelectorValue = string | number;

interface PeriodSelectorOption<TValue extends PeriodSelectorValue> {
  label: string;
  value: TValue;
}

const props = withDefaults(
  defineProps<{
    /** Accessible description of the selector group. */
    ariaLabel?: string;
    /** Currently selected period value. */
    modelValue: T;
    /** Period options available to select. */
    options: PeriodSelectorOption<T>[];
  }>(),
  {
    ariaLabel: "Reporting period",
  },
);

const emit = defineEmits<{
  "update:modelValue": [period: T];
}>();

/** Emits the reporting window selected by the user. */
const selectPeriod = (period: T) => {
  emit("update:modelValue", period);
};
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-full bg-dashboard-bg-dark p-0.5"
    :aria-label="props.ariaLabel"
    role="group"
  >
    <button
      v-for="period in props.options"
      :key="period.value"
      class="min-w-9 cursor-pointer rounded-full px-2.5 py-1 text-xs text-dashboard-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-color-default/40"
      :class="{
        'bg-dashboard-bg text-dashboard-heading shadow-sm':
          props.modelValue === period.value,
        'hover:text-dashboard-heading': props.modelValue !== period.value,
      }"
      type="button"
      :aria-pressed="props.modelValue === period.value"
      @click="selectPeriod(period.value)"
    >
      {{ period.label }}
    </button>
  </div>
</template>
