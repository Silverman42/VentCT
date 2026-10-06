<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";

const props = withDefaults(
  defineProps<{
    id?: string;
    placeholder?: string;
    invalid?: boolean;
    minDate?: Date | string;
    maxDate?: Date | string;
    /** Adds a time selector; the model then holds a `yyyy-MM-ddTHH:mm` string. */
    enableTime?: boolean;
  }>(),
  {
    id: undefined,
    placeholder: "Select date",
    invalid: false,
    minDate: undefined,
    maxDate: undefined,
    enableTime: false,
  },
);

/** Selected date as `yyyy-MM-dd` (or `yyyy-MM-ddTHH:mm` with `enableTime`); empty when nothing is picked. */
const date = defineModel<string>({ default: "" });

const emit = defineEmits<{
  (e: "closed"): void;
}>();

const { effectiveTheme } = useThemeHandler();
const isDark = computed(() => effectiveTheme.value === "dark");

/** Model and display format, matching native date / datetime-local input values. */
const modelFormat = computed(() =>
  props.enableTime ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd",
);
const displayFormat = computed(() =>
  props.enableTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd",
);

/** Normalises the picker's cleared value (null) back to an empty string. */
const pickerValue = computed<string | null>({
  get: () => date.value || null,
  set: (value) => {
    date.value = value ?? "";
  },
});
</script>

<template>
  <VueDatePicker
    v-model="pickerValue"
    :model-type="modelFormat"
    :formats="{ input: displayFormat }"
    :dark="isDark"
    :min-date="props.minDate"
    :max-date="props.maxDate"
    :time-config="{ enableTimePicker: props.enableTime, is24: true }"
    teleport="body"
    :auto-apply="!props.enableTime"
    class="w-full"
    @closed="emit('closed')"
  >
    <template #dp-input="{ value }">
      <button
        :id="props.id"
        type="button"
        class="flex w-full items-center justify-between gap-2 text-left text-base outline-none"
        :class="value ? 'text-input-text' : 'text-input-placeholder'"
        :aria-invalid="props.invalid"
        aria-haspopup="dialog"
      >
        <span class="truncate">{{ value || props.placeholder }}</span>
        <Icon
          v-if="!value"
          name="vent:calendar"
          size="1.2rem"
          class="shrink-0 text-dashboard-text"
        />
      </button>
    </template>
  </VueDatePicker>
</template>
