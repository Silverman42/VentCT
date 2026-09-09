<script lang="ts" setup>
type DropdownExposed = {
  toggleDropdown: () => void;
  closeDropdown: () => void;
  dropDownIsOpen: boolean;
};

type DateTimeRange = {
  key: string;
  label: string;
  start: string;
  end: string;
  custom?: boolean;
};

type DateTimePreset = {
  key: string;
  label: string;
  start?: string;
  end?: string;
  description?: string;
  custom?: boolean;
};

const props = withDefaults(
  defineProps<{
    presets?: DateTimePreset[];
    buttonClass?: string;
    placeholder?: string;
    dropdownWidth?: string;
  }>(),
  {
    buttonClass: "",
    placeholder: "Select date range",
    dropdownWidth: "w-[20rem]",
  }
);

const selectedRange = defineModel<DateTimeRange | null>({
  default: null,
});

const dropdownControl = ref<DropdownExposed | null>(null);

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const addDays = (date: Date, amount: number) => {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + amount);
  return cloned;
};

const startOfMonth = (date: Date) => {
  const cloned = new Date(date);
  cloned.setDate(1);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
};

const endOfMonth = (date: Date) => {
  const cloned = new Date(date);
  cloned.setMonth(cloned.getMonth() + 1, 0);
  cloned.setHours(23, 59, 59, 999);
  return cloned;
};

const addMonths = (date: Date, amount: number) => {
  const cloned = new Date(date);
  cloned.setMonth(cloned.getMonth() + amount);
  return cloned;
};

const toISO = (date: Date) => date.toISOString();

const createPreset = (
  key: string,
  label: string,
  start: Date,
  end: Date
): DateTimePreset => ({
  key,
  label,
  start: toISO(start),
  end: toISO(end),
});

const defaultPresets = computed<DateTimePreset[]>(() => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(addDays(now, -1));
  const yesterdayEnd = endOfDay(addDays(now, -1));
  const lastSevenStart = startOfDay(addDays(now, -6));
  const lastSevenEnd = endOfDay(now);
  const lastThirtyStart = startOfDay(addDays(now, -29));
  const lastThirtyEnd = endOfDay(now);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthRef = addMonths(now, -1);
  const lastMonthStart = startOfMonth(lastMonthRef);
  const lastMonthEnd = endOfMonth(lastMonthRef);

  return [
    createPreset("today", "Today", todayStart, todayEnd),
    createPreset("yesterday", "Yesterday", yesterdayStart, yesterdayEnd),
    createPreset("last7days", "Last 7 days", lastSevenStart, lastSevenEnd),
    createPreset("last30days", "Last 30 days", lastThirtyStart, lastThirtyEnd),
    createPreset("thisMonth", "This month", thisMonthStart, thisMonthEnd),
    createPreset("lastMonth", "Last month", lastMonthStart, lastMonthEnd),
    {
      key: "custom",
      label: "Custom range",
      custom: true,
    },
  ];
});

const presetList = computed<DateTimePreset[]>(() => {
  if (props.presets?.length) {
    const hasCustom = props.presets.some((preset) => preset.custom);
    return hasCustom
      ? [...props.presets]
      : [
          ...props.presets,
          {
            key: "custom",
            label: "Custom range",
            custom: true,
          },
        ];
  }

  return defaultPresets.value;
});

const customPresetKey = computed<string>(() => {
  return presetList.value.find((preset) => preset.custom)?.key ?? "custom";
});

const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatDateForButton = (value: string, recognizeRelative = true) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "";

  if (recognizeRelative) {
    const today = startOfDay(new Date());
    const resolvedTarget = startOfDay(target);
    const diffInMs = resolvedTarget.getTime() - today.getTime();
    const diffInDays = Math.round(diffInMs / 86_400_000);

    if (diffInDays === 0) return "Today";
    if (diffInDays === -1) return "Yesterday";
  }

  const day = target.getDate();
  const suffix = getDaySuffix(day);
  const month = target.toLocaleString("en-US", { month: "short" });
  const includeYear = target.getFullYear() !== new Date().getFullYear();
  return `${day}${suffix} ${month}${
    includeYear ? ` ${target.getFullYear()}` : ""
  }.`;
};

const formatRangeDescription = (start?: string, end?: string) => {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) return formatter.format(startDate);

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

const buttonClasses = computed(() => {
  const base =
    "cursor-pointer flex gap-3 items-center rounded-full py-3 px-4 text-dashboard-heading bg-dashboard-bg-darker border border-dashboard-card-border capitalize text-sm font-bold hover:border-brand-color-default transition-all duration-300 ease-in-out shadow shadow-transparent hover:shadow-brand-color-009/50 focus:outline-none";
  return props.buttonClass ? `${base} ${props.buttonClass}` : base;
});

const buttonLabel = computed(() => {
  if (!selectedRange.value) return props.placeholder;
  const startLabel = formatDateForButton(selectedRange.value.start);
  const endLabel = formatDateForButton(
    selectedRange.value.end,
    selectedRange.value.start !== selectedRange.value.end
  );

  if (!startLabel && !endLabel) return props.placeholder;
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
});

const activePresetKey = ref<string>("");

const customStart = ref<string>("");
const customEnd = ref<string>("");

const toInputValue = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60_000;
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
};

const syncCustomInputs = (range: DateTimeRange | null) => {
  if (!range || !range.custom) return;
  customStart.value = toInputValue(range.start);
  customEnd.value = toInputValue(range.end);
};

watch(
  () => presetList.value,
  () => {
    if (selectedRange.value) return;
    const fallback = presetList.value.find(
      (preset) => !preset.custom && preset.start && preset.end
    );
    if (!fallback || !fallback.start || !fallback.end) return;
    selectedRange.value = {
      key: fallback.key,
      label: fallback.label,
      start: fallback.start,
      end: fallback.end,
    };
  },
  { immediate: true }
);

watch(
  () => selectedRange.value,
  (range) => {
    if (!range) {
      activePresetKey.value = "";
      return;
    }

    activePresetKey.value = range.key;
    syncCustomInputs(range);
  },
  { immediate: true }
);

const isCustomInvalid = computed(() => {
  if (!customStart.value || !customEnd.value) return true;
  const start = new Date(customStart.value);
  const end = new Date(customEnd.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
  return start.getTime() > end.getTime();
});

const applyPreset = (preset: DateTimePreset) => {
  if (preset.custom) {
    activePresetKey.value = preset.key;

    if (!customStart.value || !customEnd.value) {
      const rangeToMirror = selectedRange.value ?? {
        start:
          preset.start ??
          presetList.value[0]?.start ??
          new Date().toISOString(),
        end: preset.end ?? presetList.value[0]?.end ?? new Date().toISOString(),
      };
      customStart.value = toInputValue(rangeToMirror.start);
      customEnd.value = toInputValue(rangeToMirror.end);
    }
    return;
  }

  if (!preset.start || !preset.end) return;
  selectedRange.value = {
    key: preset.key,
    label: preset.label,
    start: preset.start,
    end: preset.end,
  };
  dropdownControl.value?.closeDropdown();
};

const applyCustomRange = () => {
  if (isCustomInvalid.value) return;
  const start = new Date(customStart.value);
  const end = new Date(customEnd.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

  selectedRange.value = {
    key: customPresetKey.value,
    label: "Custom",
    start: start.toISOString(),
    end: end.toISOString(),
    custom: true,
  };
  dropdownControl.value?.closeDropdown();
};
</script>

<template>
  <AppDropdown ref="dropdownControl" position="right" :width-is-finite="false">
    <template #default>
      <button type="button" :class="buttonClasses">
        <ul class="flex items-center gap-1">
          <li class="pt-1 text-dashboard-text">
            <Icon name="vent:calendar" size="1.3rem" />
          </li>
          <li>{{ buttonLabel }}</li>
        </ul>
        <i
          class="w-4 block aspect-square overflow-hidden transition-transform duration-300 ease-in-out"
          :class="{
            'rotate-180': dropdownControl?.dropDownIsOpen,
          }"
        >
          <Icon name="vent:arrow-down" size="1rem" />
        </i>
      </button>
    </template>
    <template #dropdown_body>
      <section
        class="flex flex-col gap-4 text-sm text-dashboard-text"
        :class="dropdownWidth"
      >
        <header class="flex flex-col gap-1">
          <p class="font-semibold text-dashboard-heading text-sm">
            Filter by date
          </p>
          <p class="text-xs text-dashboard-text/70">
            Choose a quick range or specify a custom window.
          </p>
        </header>

        <ul class="flex flex-col gap-1">
          <li v-for="preset in presetList" :key="preset.key" class="group">
            <button
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg border border-transparent transition-all duration-200 text-dashboard-text"
              :class="{
                'bg-brand-color-009/10 border-brand-color-default !text-dashboard-heading font-semibold':
                  preset.key === activePresetKey,
                'hover:bg-brand-color-009/10 hover:border-brand-color-default hover:text-dashboard-heading':
                  preset.key !== activePresetKey,
              }"
              @click="applyPreset(preset)"
            >
              <span class="block capitalize">{{ preset.label }}</span>
              <span
                v-if="
                  preset.key !== customPresetKey &&
                  (preset.description ||
                    formatRangeDescription(preset.start, preset.end))
                "
                class="block text-[0.688rem] text-dashboard-text/70 capitalize"
              >
                {{
                  preset.description ||
                  formatRangeDescription(preset.start, preset.end)
                }}
              </span>
            </button>
          </li>
        </ul>

        <div
          v-if="activePresetKey === customPresetKey"
          class="flex flex-col gap-3 rounded-lg border border-dashboard-card-border bg-dashboard-bg-darker px-3 py-3"
        >
          <div class="grid grid-cols-1 gap-3">
            <label
              class="flex flex-col gap-1 text-xs uppercase tracking-wide text-dashboard-text/70"
            >
              From
              <input
                v-model="customStart"
                type="datetime-local"
                class="rounded-md border border-dashboard-card-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:border-brand-color-default focus:outline-none"
               autocomplete="new-password-no-autofill" />
            </label>
            <label
              class="flex flex-col gap-1 text-xs uppercase tracking-wide text-dashboard-text/70"
            >
              To
              <input
                v-model="customEnd"
                type="datetime-local"
                class="rounded-md border border-dashboard-card-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:border-brand-color-default focus:outline-none"
               autocomplete="new-password-no-autofill" />
            </label>
          </div>
          <p v-if="isCustomInvalid" class="text-xs text-red-500">
            End date must be after the start date.
          </p>
          <button
            type="button"
            class="self-start rounded-full bg-brand-color-default px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-dashboard-text-lighter disabled:text-dashboard-text"
            :disabled="isCustomInvalid"
            @click="applyCustomRange"
          >
            Apply range
          </button>
        </div>
      </section>
    </template>
  </AppDropdown>
</template>
