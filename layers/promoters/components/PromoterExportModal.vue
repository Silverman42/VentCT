<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type { Promoter } from "../composables/usePromoterMockData";

type ExportFormat = "pdf" | "xlsx";
type ExportDelivery = "download" | "email";
type ExportReportType = "all" | "transactions" | "audiences";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface PromoterExportPayload {
  format: ExportFormat;
  selectedPromoterIds: string[];
  reportType: ExportReportType;
  startDate: string;
  endDate: string;
  delivery: ExportDelivery;
}

const props = defineProps<{
  promoters: Promoter[];
}>();

const REFERENCE_DATE = "2026-02-15";
const modal = ref<ModalController | null>(null);
const reportTypeDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref("");
const form = reactive<PromoterExportPayload>({
  format: "xlsx",
  selectedPromoterIds: [],
  reportType: "all",
  startDate: REFERENCE_DATE,
  endDate: REFERENCE_DATE,
  delivery: "email",
});

const reportTypeOptions: Array<{ value: ExportReportType; label: string }> = [
  { value: "all", label: "All" },
  { value: "transactions", label: "Transactions" },
  { value: "audiences", label: "Audiences" },
];

/** Defines validation feedback for a fixture-only export request. */
const validations = computed(() => ({
  format: {
    required: helpers.withMessage("Select an export format", required),
  },
  selectedPromoterIds: {
    required: helpers.withMessage(
      "Select at least one promoter",
      (value: string[]) => value.length > 0,
    ),
  },
  reportType: {
    required: helpers.withMessage("Select a report type", required),
  },
  startDate: {
    required: helpers.withMessage("Start date is required", required),
  },
  endDate: {
    required: helpers.withMessage("End date is required", required),
    afterStartDate: helpers.withMessage(
      "End date cannot be before start date",
      (value: string) => !value || !form.startDate || value >= form.startDate,
    ),
  },
  delivery: {
    required: helpers.withMessage("Select a delivery method", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Filters available promoters with the modal's own search field. */
const filteredPromoters = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  if (!searchTerm) return props.promoters;

  return props.promoters.filter((promoter) =>
    [promoter.name, promoter.email, promoter.referralCode]
      .join(" ")
      .toLocaleLowerCase()
      .includes(searchTerm),
  );
});

/** Indicates whether the current promoter search result is entirely selected. */
const areFilteredPromotersSelected = computed(
  () =>
    filteredPromoters.value.length > 0 &&
    filteredPromoters.value.every((promoter) =>
      form.selectedPromoterIds.includes(promoter.id),
    ),
);

/** Counts export records across the selected fixture promoters. */
const selectedRecordCount = computed(() =>
  props.promoters
    .filter((promoter) => form.selectedPromoterIds.includes(promoter.id))
    .reduce((total, promoter) => total + promoter.exportRecordCount, 0),
);

/** Formats the selected promoters and their associated fixture records. */
const selectedPromoterSummary = computed(
  () =>
    `${form.selectedPromoterIds.length} selected - ${selectedRecordCount.value.toLocaleString()} records`,
);

/** Restores the export defaults shown by the reference modal. */
const resetForm = (): void => {
  form.format = "xlsx";
  form.selectedPromoterIds = props.promoters
    .filter((promoter) => promoter.id === "kay-kay" || promoter.id === "boluwatife")
    .map((promoter) => promoter.id);
  form.reportType = "all";
  form.startDate = REFERENCE_DATE;
  form.endDate = REFERENCE_DATE;
  form.delivery = "email";
  searchInput.value = "";
  v$.value.$reset();
};

/** Opens the export controls with the screenshot-backed default selections. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the export dialog without attempting delivery. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Returns the visible label for an export report choice. */
const getReportTypeLabel = (reportType: ExportReportType): string =>
  reportTypeOptions.find((option) => option.value === reportType)?.label ??
  reportType;

/** Selects an export format and marks that choice as visited. */
const selectFormat = (format: ExportFormat): void => {
  form.format = format;
  v$.value.format.$touch();
};

/** Selects a report type and closes its dropdown menu. */
const selectReportType = (reportType: ExportReportType): void => {
  form.reportType = reportType;
  v$.value.reportType.$touch();
  reportTypeDropdown.value?.closeDropdown();
};

/** Selects a delivery action and marks the field as visited. */
const selectDelivery = (delivery: ExportDelivery): void => {
  form.delivery = delivery;
  v$.value.delivery.$touch();
};

/** Toggles one promoter while retaining fixture source order in the payload. */
const togglePromoterSelection = (promoterId: string): void => {
  const nextSelectedIds = new Set(form.selectedPromoterIds);

  if (nextSelectedIds.has(promoterId)) {
    nextSelectedIds.delete(promoterId);
  } else {
    nextSelectedIds.add(promoterId);
  }

  form.selectedPromoterIds = props.promoters
    .filter((promoter) => nextSelectedIds.has(promoter.id))
    .map((promoter) => promoter.id);
  v$.value.selectedPromoterIds.$touch();
};

/** Selects or clears every promoter visible in the current search result. */
const toggleFilteredPromoterSelection = (): void => {
  const nextSelectedIds = new Set(form.selectedPromoterIds);

  if (areFilteredPromotersSelected.value) {
    filteredPromoters.value.forEach((promoter) =>
      nextSelectedIds.delete(promoter.id),
    );
  } else {
    filteredPromoters.value.forEach((promoter) => nextSelectedIds.add(promoter.id));
  }

  form.selectedPromoterIds = props.promoters
    .filter((promoter) => nextSelectedIds.has(promoter.id))
    .map((promoter) => promoter.id);
  v$.value.selectedPromoterIds.$touch();
};

/** Validates the local request and explains that no export side effect occurred. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const isEmailDelivery = form.delivery === "email";
  close();
  useToastHandler().triggerToast(
    isEmailDelivery
      ? "The export request was validated locally and no email was sent."
      : "The export request was validated locally and no file was generated.",
    "success",
    "Export validated",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="600px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">Export</h2>
        <p class="mt-1 text-xs text-dashboard-text">Select promoters data to export</p>
      </div>

      <div class="space-y-5 py-5">
        <fieldset>
          <legend class="mb-3 text-sm font-medium text-dashboard-heading">Format</legend>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="form.format === 'pdf' ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading' : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'"
              :aria-pressed="form.format === 'pdf'"
              @click="selectFormat('pdf')"
            >
              <Icon name="vent:pdf" size="1rem" />
              PDF
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="form.format === 'xlsx' ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading' : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'"
              :aria-pressed="form.format === 'xlsx'"
              @click="selectFormat('xlsx')"
            >
              <Icon name="vent:excel" size="1rem" />
              XLSX
            </button>
          </div>
          <p v-if="v$.format.$error" class="mt-1 text-xs text-red-500">
            {{ v$.format.$errors[0]?.$message }}
          </p>
        </fieldset>

        <section aria-labelledby="available-promoters-heading">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 id="available-promoters-heading" class="text-sm font-medium text-dashboard-heading">
              Available Promoters
            </h3>
            <button
              type="button"
              class="text-sm font-medium text-brand-color-default hover:text-brand-color-005"
              @click="toggleFilteredPromoterSelection"
            >
              {{ areFilteredPromotersSelected ? 'Clear all' : 'Select all' }}
            </button>
          </div>

          <label class="relative block">
            <span class="sr-only">Search promoters</span>
            <Icon name="vent:search-normal" size="1rem" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text" />
            <input
              v-model="searchInput"
              type="search"
              placeholder="Search promoters..."
              class="w-full rounded-lg border border-dashboard-card-border bg-dashboard-bg py-2.5 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-dashboard-text-light focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
            />
          </label>

          <div class="mt-3 max-h-58 overflow-y-auto rounded-lg border border-dashboard-card-border" role="group" aria-label="Promoters available for export">
            <div
              v-for="promoter in filteredPromoters"
              :key="promoter.id"
              class="flex min-h-11 items-center gap-3 border-b border-dashboard-card-border px-3 py-2 last:border-b-0"
              :class="{ 'bg-brand-color-011/20': form.selectedPromoterIds.includes(promoter.id) }"
            >
              <AppCheckbox
                :id="`export-promoter-${promoter.id}`"
                :is-selected="form.selectedPromoterIds.includes(promoter.id)"
                :aria-label="`Select ${promoter.name}`"
                @click.prevent="togglePromoterSelection(promoter.id)"
              />
              <label
                :for="`export-promoter-${promoter.id}`"
                class="min-w-0 flex-1 cursor-pointer text-sm text-dashboard-heading"
                @click.prevent="togglePromoterSelection(promoter.id)"
              >
                <span class="block truncate">{{ promoter.name }}</span>
              </label>
              <span class="shrink-0 text-xs text-dashboard-text-light">
                {{ promoter.exportRecordCount.toLocaleString() }} records
              </span>
            </div>
            <p v-if="filteredPromoters.length === 0" class="px-4 py-6 text-center text-sm text-dashboard-text">
              No promoters match your search.
            </p>
          </div>
          <p class="mt-2 text-xs text-dashboard-text-light">{{ selectedPromoterSummary }}</p>
          <p v-if="v$.selectedPromoterIds.$error" class="mt-1 text-xs text-red-500">
            {{ v$.selectedPromoterIds.$errors[0]?.$message }}
          </p>
        </section>

        <AppInputContainer
          label="Report Type"
          for="promoter-export-report-type"
          :error="v$.reportType.$error ? String(v$.reportType.$errors[0]?.$message ?? '') : ''"
        >
          <AppDropdown ref="reportTypeDropdown" position="left" :width-is-finite="false" :container-full="true">
            <button
              id="promoter-export-report-type"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.reportType.$error"
              aria-haspopup="listbox"
            >
              {{ getReportTypeLabel(form.reportType) }}
              <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
            </button>
            <template #dropdown_body>
              <div role="listbox" aria-label="Export report type" class="min-w-48 space-y-1">
                <button
                  v-for="option in reportTypeOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="form.reportType === option.value"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.reportType === option.value }"
                  @click="selectReportType(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInputContainer label="Start date" for="promoter-export-start-date" :error="v$.startDate.$error ? String(v$.startDate.$errors[0]?.$message ?? '') : ''">
            <input id="promoter-export-start-date" v-model="form.startDate" type="date" :aria-invalid="v$.startDate.$error" @blur="v$.startDate.$touch()" />
          </AppInputContainer>
          <AppInputContainer label="End date" for="promoter-export-end-date" :error="v$.endDate.$error ? String(v$.endDate.$errors[0]?.$message ?? '') : ''">
            <input id="promoter-export-end-date" v-model="form.endDate" type="date" :min="form.startDate || undefined" :aria-invalid="v$.endDate.$error" @blur="v$.endDate.$touch()" />
          </AppInputContainer>
        </div>

        <fieldset>
          <legend class="sr-only">Export delivery method</legend>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="form.delivery === 'download' ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading' : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'"
              :aria-pressed="form.delivery === 'download'"
              @click="selectDelivery('download')"
            >
              <Icon name="vent:direct-inbox" size="1rem" />
              Download Now
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="form.delivery === 'email' ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading' : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'"
              :aria-pressed="form.delivery === 'email'"
              @click="selectDelivery('email')"
            >
              <Icon name="vent:sms" size="1rem" />
              Send to Email
            </button>
          </div>
        </fieldset>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row">
        <AppButton size="md" type="button" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton size="md" type="submit" :block="false" color="primary">
          {{ form.delivery === 'email' ? 'Send' : 'Download' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
