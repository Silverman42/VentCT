<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type { Campaign } from "../composables/useCampaignMockData";

type ExportFormat = "pdf" | "xlsx";
type ExportDelivery = "download" | "email";
type ExportReportType = "all" | "promoters" | "audience";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface CampaignExportPayload {
  format: ExportFormat;
  selectedCampaignIds: string[];
  reportType: ExportReportType;
  startDate: string;
  endDate: string;
  delivery: ExportDelivery;
}

const props = defineProps<{
  campaigns: Campaign[];
}>();

const REFERENCE_DATE = "2026-02-15";
const modal = ref<ModalController | null>(null);
const reportTypeDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref("");
const searchField = ref<HTMLInputElement | null>(null);
const form = reactive<CampaignExportPayload>({
  format: "xlsx",
  selectedCampaignIds: [],
  reportType: "all",
  startDate: REFERENCE_DATE,
  endDate: REFERENCE_DATE,
  delivery: "email",
});

const reportTypeOptions: Array<{
  value: ExportReportType;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "promoters", label: "Promoters" },
  { value: "audience", label: "Audience" },
];

/** Defines validation feedback for the fixture-backed export request. */
const validations = computed(() => ({
  format: {
    required: helpers.withMessage("Select an export format", required),
  },
  selectedCampaignIds: {
    required: helpers.withMessage(
      "Select at least one campaign",
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

/** Filters available fixtures by the modal's campaign search input. */
const filteredCampaigns = computed(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();

  if (!searchTerm) return props.campaigns;

  return props.campaigns.filter((campaign) =>
    [campaign.name, campaign.referralCode]
      .join(" ")
      .toLocaleLowerCase()
      .includes(searchTerm),
  );
});

/** Indicates whether every campaign shown by the current search is selected. */
const areFilteredCampaignsSelected = computed(
  () =>
    filteredCampaigns.value.length > 0 &&
    filteredCampaigns.value.every((campaign) =>
      form.selectedCampaignIds.includes(campaign.id),
    ),
);

/** Sums fixture targets for the selected campaigns' mock record total. */
const selectedRecordCount = computed(() =>
  props.campaigns
    .filter((campaign) => form.selectedCampaignIds.includes(campaign.id))
    .reduce((total, campaign) => total + campaign.target, 0),
);

/** Creates the selected-campaign summary shown under the scrollable list. */
const selectedCampaignSummary = computed(
  () =>
    `${form.selectedCampaignIds.length} selected - ${selectedRecordCount.value.toLocaleString()} records`,
);

/** Restores the screenshot's default export state and clears validation feedback. */
const resetForm = (): void => {
  form.format = "xlsx";
  form.selectedCampaignIds = props.campaigns
    .filter((_campaign, index) => index === 0 || index === 4)
    .map((campaign) => campaign.id);
  form.reportType = "all";
  form.startDate = REFERENCE_DATE;
  form.endDate = REFERENCE_DATE;
  form.delivery = "email";
  searchInput.value = "";
  v$.value.$reset();
};

/** Opens the export dialog in its reference-backed default state. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  searchField.value?.focus();
};

/** Closes the export dialog without submitting the local request. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Converts a report type into its display label. */
const getReportTypeLabel = (reportType: ExportReportType): string =>
  reportTypeOptions.find((option) => option.value === reportType)?.label ??
  reportType;

/** Selects one export format and marks its field as visited. */
const selectFormat = (format: ExportFormat): void => {
  form.format = format;
  v$.value.format.$touch();
};

/** Selects one report type and dismisses the report-type menu. */
const selectReportType = (reportType: ExportReportType): void => {
  form.reportType = reportType;
  v$.value.reportType.$touch();
  reportTypeDropdown.value?.closeDropdown();
};

/** Selects a delivery method and marks its field as visited. */
const selectDelivery = (delivery: ExportDelivery): void => {
  form.delivery = delivery;
  v$.value.delivery.$touch();
};

/** Toggles a single campaign while preserving the fixture list order. */
const toggleCampaignSelection = (campaignId: string): void => {
  const nextSelectedIds = new Set(form.selectedCampaignIds);

  if (nextSelectedIds.has(campaignId)) {
    nextSelectedIds.delete(campaignId);
  } else {
    nextSelectedIds.add(campaignId);
  }

  form.selectedCampaignIds = props.campaigns
    .filter((campaign) => nextSelectedIds.has(campaign.id))
    .map((campaign) => campaign.id);
  v$.value.selectedCampaignIds.$touch();
};

/** Toggles all campaigns currently visible in the modal's search result. */
const toggleFilteredCampaignSelection = (): void => {
  const nextSelectedIds = new Set(form.selectedCampaignIds);

  if (areFilteredCampaignsSelected.value) {
    filteredCampaigns.value.forEach((campaign) =>
      nextSelectedIds.delete(campaign.id),
    );
  } else {
    filteredCampaigns.value.forEach((campaign) =>
      nextSelectedIds.add(campaign.id),
    );
  }

  form.selectedCampaignIds = props.campaigns
    .filter((campaign) => nextSelectedIds.has(campaign.id))
    .map((campaign) => campaign.id);
  v$.value.selectedCampaignIds.$touch();
};

/** Validates the mock request and acknowledges its selected local delivery. */
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
  <AppModal ref="modal" desktop-width="580px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Export
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Select campaign data to export
        </p>
      </div>

      <div class="space-y-5 py-5">
        <fieldset>
          <legend class="mb-3 text-sm font-medium text-dashboard-heading">
            Format
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="
                form.format === 'pdf'
                  ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading'
                  : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'
              "
              :aria-pressed="form.format === 'pdf'"
              @click="selectFormat('pdf')"
            >
              <Icon name="vent:pdf" size="1rem" />
              PDF
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="
                form.format === 'xlsx'
                  ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading'
                  : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'
              "
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

        <section aria-labelledby="available-campaigns-heading">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3
              id="available-campaigns-heading"
              class="text-sm font-medium text-dashboard-heading"
            >
              Available Campaign
            </h3>
            <button
              type="button"
              class="text-sm font-medium text-brand-color-default hover:text-brand-color-005"
              @click="toggleFilteredCampaignSelection"
            >
              {{ areFilteredCampaignsSelected ? "Clear all" : "Select all" }}
            </button>
          </div>

          <label class="relative block">
            <span class="sr-only">Search campaigns</span>
            <Icon
              name="vent:search-normal"
              size="1rem"
              class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
            />
            <input
              ref="searchField"
              v-model="searchInput"
              type="search"
              placeholder="Search campaigns..."
              class="w-full rounded-lg border border-dashboard-card-border bg-dashboard-bg py-2.5 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-dashboard-text-light focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
            />
          </label>

          <div
            class="mt-3 max-h-58 overflow-y-auto rounded-lg border border-dashboard-card-border"
            role="group"
            aria-label="Campaigns available for export"
          >
            <div
              v-for="campaign in filteredCampaigns"
              :key="campaign.id"
              class="flex min-h-11 items-center gap-3 border-b border-dashboard-card-border px-3 py-2 last:border-b-0"
              :class="{
                'bg-brand-color-011/20': form.selectedCampaignIds.includes(
                  campaign.id,
                ),
              }"
            >
              <AppCheckbox
                :id="`export-campaign-${campaign.id}`"
                :is-selected="form.selectedCampaignIds.includes(campaign.id)"
                :aria-label="`Select ${campaign.name}`"
                @click.prevent="toggleCampaignSelection(campaign.id)"
              />
              <label
                :for="`export-campaign-${campaign.id}`"
                class="min-w-0 flex-1 cursor-pointer text-sm text-dashboard-heading"
                @click.prevent="toggleCampaignSelection(campaign.id)"
              >
                <span class="block truncate">{{ campaign.name }}</span>
              </label>
              <span class="shrink-0 text-xs text-dashboard-text-light">
                {{ campaign.target.toLocaleString() }} records
              </span>
            </div>
            <p
              v-if="filteredCampaigns.length === 0"
              class="px-4 py-6 text-center text-sm text-dashboard-text"
            >
              No campaigns match your search.
            </p>
          </div>
          <p class="mt-2 text-xs text-dashboard-text-light">
            {{ selectedCampaignSummary }}
          </p>
          <p
            v-if="v$.selectedCampaignIds.$error"
            class="mt-1 text-xs text-red-500"
          >
            {{ v$.selectedCampaignIds.$errors[0]?.$message }}
          </p>
        </section>

        <AppInputContainer
          label="Report Type"
          for="campaign-export-report-type"
          :error="
            v$.reportType.$error
              ? String(v$.reportType.$errors[0]?.$message ?? '')
              : ''
          "
        >
          <AppDropdown
            ref="reportTypeDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="campaign-export-report-type"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.reportType.$error"
              aria-haspopup="listbox"
            >
              {{ getReportTypeLabel(form.reportType) }}
              <Icon
                name="vent:arrow-down"
                size="1rem"
                class="shrink-0 text-dashboard-text"
              />
            </button>

            <template #dropdown_body>
              <div
                role="listbox"
                aria-label="Export report type"
                class="min-w-48 space-y-1"
              >
                <button
                  v-for="option in reportTypeOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="form.reportType === option.value"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{
                    'bg-dashboard-bg-dark': form.reportType === option.value,
                  }"
                  @click="selectReportType(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInputContainer
            label="Start date"
            for="campaign-export-start-date"
            :error="
              v$.startDate.$error
                ? String(v$.startDate.$errors[0]?.$message ?? '')
                : ''
            "
          >
            <input
              id="campaign-export-start-date"
              v-model="form.startDate"
              type="date"
              :aria-invalid="v$.startDate.$error"
              @blur="v$.startDate.$touch()"
            />
          </AppInputContainer>
          <AppInputContainer
            label="End date"
            for="campaign-export-end-date"
            :error="
              v$.endDate.$error
                ? String(v$.endDate.$errors[0]?.$message ?? '')
                : ''
            "
          >
            <input
              id="campaign-export-end-date"
              v-model="form.endDate"
              type="date"
              :min="form.startDate || undefined"
              :aria-invalid="v$.endDate.$error"
              @blur="v$.endDate.$touch()"
            />
          </AppInputContainer>
        </div>

        <fieldset>
          <legend class="sr-only">Export delivery method</legend>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="
                form.delivery === 'download'
                  ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading'
                  : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'
              "
              :aria-pressed="form.delivery === 'download'"
              @click="selectDelivery('download')"
            >
              <Icon name="vent:direct-inbox" size="1rem" />
              Download Now
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="
                form.delivery === 'email'
                  ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading'
                  : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'
              "
              :aria-pressed="form.delivery === 'email'"
              @click="selectDelivery('email')"
            >
              <Icon name="vent:sms" size="1rem" />
              Send to Email
            </button>
          </div>
          <p v-if="v$.delivery.$error" class="mt-1 text-xs text-red-500">
            {{ v$.delivery.$errors[0]?.$message }}
          </p>
        </fieldset>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row">
        <AppButton
          size="md"
          type="button"
          :block="false"
          outlined
          color="primary"
          @click="close"
        >
          Cancel
        </AppButton>
        <AppButton size="md" type="submit" :block="false" color="primary">
          {{ form.delivery === "email" ? "Send" : "Download" }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
@reference "~/assets/css/main.css";
</style>
