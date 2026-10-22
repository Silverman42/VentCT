<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import {
  helpers,
  integer,
  maxLength,
  minValue,
  required,
  url,
} from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignApiStatus,
  type ICampaign,
  type ICreateCampaignPayload,
} from "../composables/useCampaignStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Whether the form creates a new campaign or edits an existing one. */
type CampaignFormMode = "create" | "edit";

/** Editable campaign fields bound to the form inputs. */
interface ICampaignForm {
  name: string;
  description: string;
  target: number | null;
  status: CampaignApiStatus;
  /** `yyyy-MM-dd`, as produced by AppDatePicker. */
  start_date: string;
  /** `yyyy-MM-dd`, as produced by AppDatePicker. */
  end_date: string;
  banner_url: string;
}

const DESCRIPTION_MAX_LENGTH = 1000;

const { createCampaign, creatingCampaign, updateCampaign, updatingCampaign } =
  useCampaignStore();

const modal = ref<ModalController | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const mode = ref<CampaignFormMode>("create");
const editingCampaignId = ref<string | null>(null);
const form = reactive<ICampaignForm>({
  name: "",
  description: "",
  target: null,
  status: "pending",
  start_date: "",
  end_date: "",
  banner_url: "",
});

/** Whether the form is editing an existing campaign. */
const isEditing = computed(() => mode.value === "edit");

/** Loading flag for whichever submit action is active. */
const submitting = computed(() =>
  isEditing.value ? updatingCampaign.value : creatingCampaign.value,
);

/** Passes when the end date is empty or not before the start date. */
const notBeforeStartDate = (value: string): boolean =>
  !value || !form.start_date || value >= form.start_date;

/** Validation rules for the campaign form. */
const validations = computed(() => ({
  name: {
    required: helpers.withMessage("Campaign name is required", required),
  },
  description: {
    maxLength: helpers.withMessage(
      `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`,
      maxLength(DESCRIPTION_MAX_LENGTH),
    ),
  },
  target: {
    required: helpers.withMessage("Target is required", required),
    integer: helpers.withMessage("Target must be a whole number", integer),
    minValue: helpers.withMessage(
      "Target must be greater than zero",
      minValue(1),
    ),
  },
  status: {
    required: helpers.withMessage("Status is required", required),
  },
  start_date: {
    required: helpers.withMessage("Start date is required", required),
  },
  end_date: {
    required: helpers.withMessage("End date is required", required),
    notBeforeStartDate: helpers.withMessage(
      "End date cannot be before the start date",
      notBeforeStartDate,
    ),
  },
  banner_url: {
    url: helpers.withMessage("Enter a valid URL", url),
  },
}));

const v$ = useVuelidate(validations, form);

const statusOptions = (
  Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignApiStatus[]
).map((value) => ({ value, label: CAMPAIGN_STATUS_LABELS[value] }));

/** Returns the first validation message for a field once it has been touched. */
const fieldError = (field: keyof ICampaignForm): string =>
  v$.value[field].$error ? String(v$.value[field].$errors[0]?.$message ?? "") : "";

/** Converts an API date (date or date-time) into the picker's `yyyy-MM-dd` value. */
const toPickerDate = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : "";

/** Fills the form from a campaign, or clears it for a new one. */
const resetForm = (campaign?: ICampaign): void => {
  form.name = campaign?.name ?? "";
  form.description = campaign?.description ?? "";
  form.target = campaign?.target ?? null;
  form.status = campaign?.status ?? "pending";
  form.start_date = toPickerDate(campaign?.start_date);
  form.end_date = toPickerDate(campaign?.end_date);
  form.banner_url = campaign?.banner_url ?? "";
  v$.value.$reset();
};

/**
 * Opens the form. Passing a campaign switches to edit mode and prefills it;
 * otherwise a clean create form is shown.
 */
const open = async (campaign?: ICampaign): Promise<void> => {
  mode.value = campaign ? "edit" : "create";
  editingCampaignId.value = campaign?.id ?? null;
  resetForm(campaign);
  modal.value?.showDialogBox();
  await nextTick();
  nameInput.value?.focus();
};

/** Closes the dialog without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects a campaign status, validates it, and closes the status menu. */
const selectStatus = (status: CampaignApiStatus): void => {
  form.status = status;
  v$.value.status.$touch();
  statusDropdown.value?.closeDropdown();
};

/** Builds the API payload from the form, omitting empty optional fields. */
const buildPayload = (): ICreateCampaignPayload => ({
  name: form.name,
  description: form.description || undefined,
  status: form.status,
  target: Number(form.target),
  start_date: form.start_date,
  end_date: form.end_date,
  banner_url: form.banner_url || undefined,
});

/** Validates the form, then creates or updates the campaign. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    const payload = buildPayload();
    if (isEditing.value && editingCampaignId.value) {
      await updateCampaign(editingCampaignId.value, payload);
    } else {
      await createCampaign(payload);
    }
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          {{ isEditing ? "Edit Campaign" : "New Campaign" }}
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-4 py-5 md:grid-cols-2">
        <div class="md:col-span-2">
          <AppInputContainer
            label="Name"
            for="campaign-form-name"
            :error="fieldError('name')"
          >
            <input
              id="campaign-form-name"
              ref="nameInput"
              v-model.trim="form.name"
              type="text"
              autocomplete="off"
              placeholder="e.g Q4 Campus Tour 2026"
              :aria-invalid="v$.name.$error"
              @blur="v$.name.$touch()"
            />
          </AppInputContainer>
        </div>

        <AppInputContainer
          label="Target"
          for="campaign-form-target"
          :error="fieldError('target')"
        >
          <input
            id="campaign-form-target"
            v-model.number="form.target"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="e.g 5000"
            :aria-invalid="v$.target.$error"
            @blur="v$.target.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Status"
          for="campaign-form-status"
          :error="fieldError('status')"
        >
          <AppDropdown
            ref="statusDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="campaign-form-status"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.status.$error"
              aria-haspopup="listbox"
            >
              {{ CAMPAIGN_STATUS_LABELS[form.status] }}
              <Icon
                name="vent:arrow-down"
                size="1rem"
                class="shrink-0 text-dashboard-text"
              />
            </button>

            <template #dropdown_body>
              <div
                role="listbox"
                aria-label="Campaign status"
                class="min-w-48 space-y-1"
              >
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="form.status === option.value"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{
                    'bg-dashboard-bg-dark': form.status === option.value,
                  }"
                  @click="selectStatus(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <AppInputContainer
          label="Start date"
          for="campaign-form-start-date"
          :error="fieldError('start_date')"
        >
          <AppDatePicker
            id="campaign-form-start-date"
            v-model="form.start_date"
            placeholder="Select start date"
            :invalid="v$.start_date.$error"
            @closed="v$.start_date.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="End date"
          for="campaign-form-end-date"
          :error="fieldError('end_date')"
        >
          <AppDatePicker
            id="campaign-form-end-date"
            v-model="form.end_date"
            placeholder="Select end date"
            :min-date="form.start_date || undefined"
            :invalid="v$.end_date.$error"
            @closed="v$.end_date.$touch()"
          />
        </AppInputContainer>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Banner URL (optional)"
            for="campaign-form-banner-url"
            :error="fieldError('banner_url')"
          >
            <input
              id="campaign-form-banner-url"
              v-model.trim="form.banner_url"
              type="url"
              autocomplete="off"
              placeholder="https://"
              :aria-invalid="v$.banner_url.$error"
              @blur="v$.banner_url.$touch()"
            />
          </AppInputContainer>
        </div>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Description (optional)"
            for="campaign-form-description"
            :error="fieldError('description')"
          >
            <textarea
              id="campaign-form-description"
              v-model.trim="form.description"
              rows="3"
              placeholder="What is this campaign about?"
              class="w-full resize-none bg-transparent outline-none"
              @blur="v$.description.$touch()"
            />
          </AppInputContainer>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-end">
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
          :loading="submitting"
        >
          {{ isEditing ? "Save changes" : "Create campaign" }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
