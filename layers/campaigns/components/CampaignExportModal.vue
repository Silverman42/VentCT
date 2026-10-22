<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignExportFormat,
} from "../composables/useCampaignStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Export options bound to the form. */
interface ICampaignExportForm {
  format: CampaignExportFormat;
}

const { exportCampaigns, exportingCampaigns, campaignsSearch, campaignsStatus } =
  useCampaignStore();

const modal = ref<ModalController | null>(null);
const form = reactive<ICampaignExportForm>({ format: "xlsx" });

const formatOptions: Array<{
  value: CampaignExportFormat;
  label: string;
  icon: string;
}> = [
  { value: "xlsx", label: "XLSX", icon: "vent:excel" },
  { value: "csv", label: "CSV", icon: "vent:document" },
];

/** Validation rules for the export request. */
const validations = computed(() => ({
  format: {
    required: helpers.withMessage("Select an export format", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Describes the list filters that the export will apply. */
const activeFilterSummary = computed(() => {
  const filters: string[] = [];
  if (campaignsSearch.value) filters.push(`search "${campaignsSearch.value}"`);
  if (campaignsStatus.value !== "all") {
    filters.push(`status ${CAMPAIGN_STATUS_LABELS[campaignsStatus.value]}`);
  }
  return filters.length
    ? `Exports campaigns matching ${filters.join(" and ")}.`
    : "Exports all campaigns.";
});

/** Restores the default export format and clears validation feedback. */
const resetForm = (): void => {
  form.format = "xlsx";
  v$.value.$reset();
};

/** Opens the export dialog with default options. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the export dialog without downloading. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects one export format and marks its field as visited. */
const selectFormat = (format: CampaignExportFormat): void => {
  form.format = format;
  v$.value.format.$touch();
};

/** Validates the request, then downloads the spreadsheet from the API. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await exportCampaigns(form.format);
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
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
          {{ activeFilterSummary }}
        </p>
      </div>

      <div class="space-y-5 py-5">
        <fieldset>
          <legend class="mb-3 text-sm font-medium text-dashboard-heading">
            Format
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="option in formatOptions"
              :key="option.value"
              type="button"
              class="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              :class="
                form.format === option.value
                  ? 'border-brand-color-default bg-brand-color-011/20 text-dashboard-heading'
                  : 'border-dashboard-card-border text-dashboard-text hover:border-brand-color-default'
              "
              :aria-pressed="form.format === option.value"
              @click="selectFormat(option.value)"
            >
              <Icon :name="option.icon" size="1rem" />
              {{ option.label }}
            </button>
          </div>
          <p v-if="v$.format.$error" class="mt-1 text-xs text-red-500">
            {{ v$.format.$errors[0]?.$message }}
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
        <AppButton
          size="md"
          type="submit"
          :block="false"
          color="primary"
          :loading="exportingCampaigns"
        >
          Download
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
