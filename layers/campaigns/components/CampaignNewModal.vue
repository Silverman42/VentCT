<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import {
  helpers,
  integer,
  maxLength,
  minValue,
  required,
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
  referralCode: string;
  slug: string;
  target: number | null;
  status: CampaignApiStatus;
  /** `yyyy-MM-dd`, as produced by AppDatePicker. */
  startsAt: string;
  /** `yyyy-MM-dd`, as produced by AppDatePicker. */
  endsAt: string;
}

const REFERRAL_CODE_MAX_LENGTH = 50;
const SLUG_MAX_LENGTH = 255;

const { createCampaign, creatingCampaign, updateCampaign, updatingCampaign } =
  useCampaignStore();

const modal = ref<ModalController | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const mode = ref<CampaignFormMode>("create");
const editingCampaignId = ref<string | null>(null);
const form = reactive<ICampaignForm>({
  name: "",
  referralCode: "",
  slug: "",
  target: null,
  status: "pending",
  startsAt: "",
  endsAt: "",
});

/** Whether the form is editing an existing campaign. */
const isEditing = computed(() => mode.value === "edit");

/** Loading flag for whichever submit action is active. */
const submitting = computed(() =>
  isEditing.value ? updatingCampaign.value : creatingCampaign.value,
);

/** Passes when the end date is empty or not before the start date. */
const notBeforeStartDate = (value: string): boolean =>
  !value || !form.startsAt || value >= form.startsAt;

/** Passes when the slug is empty or only uses letters, numbers, dashes and underscores. */
const isSlugFormat = (value: string): boolean =>
  !value || /^[A-Za-z0-9_-]+$/.test(value);

/** Validation rules for the campaign form. */
const validations = computed(() => ({
  name: {
    required: helpers.withMessage("Campaign name is required", required),
  },
  referralCode: {
    required: helpers.withMessage("Referral code is required", required),
    maxLength: helpers.withMessage(
      `Referral code must be ${REFERRAL_CODE_MAX_LENGTH} characters or fewer`,
      maxLength(REFERRAL_CODE_MAX_LENGTH),
    ),
  },
  slug: {
    maxLength: helpers.withMessage(
      `Slug must be ${SLUG_MAX_LENGTH} characters or fewer`,
      maxLength(SLUG_MAX_LENGTH),
    ),
    isSlugFormat: helpers.withMessage(
      "Use only letters, numbers, dashes and underscores",
      isSlugFormat,
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
  startsAt: {
    required: helpers.withMessage("Start date is required", required),
  },
  endsAt: {
    required: helpers.withMessage("End date is required", required),
    notBeforeStartDate: helpers.withMessage(
      "End date cannot be before the start date",
      notBeforeStartDate,
    ),
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
  form.referralCode = campaign?.referralCode ?? "";
  form.slug = campaign?.slug ?? "";
  form.target = campaign?.target ?? null;
  form.status = campaign?.status ?? "pending";
  form.startsAt = toPickerDate(campaign?.startsAt);
  form.endsAt = toPickerDate(campaign?.endsAt);
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

/**
 * Builds the API payload from the form. An empty slug is omitted on create
 * (the API generates one) and sent as `null` on edit to clear it.
 */
const buildPayload = (): ICreateCampaignPayload => ({
  name: form.name,
  referralCode: form.referralCode,
  slug: form.slug || (isEditing.value ? null : undefined),
  status: form.status,
  target: Number(form.target),
  startsAt: form.startsAt,
  endsAt: form.endsAt,
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
          label="Referral code"
          for="campaign-form-referral-code"
          :error="fieldError('referralCode')"
        >
          <input
            id="campaign-form-referral-code"
            v-model.trim="form.referralCode"
            type="text"
            autocomplete="off"
            placeholder="e.g CAMP26"
            :aria-invalid="v$.referralCode.$error"
            @blur="v$.referralCode.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Slug (optional)"
          for="campaign-form-slug"
          :error="fieldError('slug')"
        >
          <input
            id="campaign-form-slug"
            v-model.trim="form.slug"
            type="text"
            autocomplete="off"
            placeholder="Generated from the name"
            :aria-invalid="v$.slug.$error"
            @blur="v$.slug.$touch()"
          />
        </AppInputContainer>

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
          :error="fieldError('startsAt')"
        >
          <AppDatePicker
            id="campaign-form-start-date"
            v-model="form.startsAt"
            placeholder="Select start date"
            :invalid="v$.startsAt.$error"
            @closed="v$.startsAt.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="End date"
          for="campaign-form-end-date"
          :error="fieldError('endsAt')"
        >
          <AppDatePicker
            id="campaign-form-end-date"
            v-model="form.endsAt"
            placeholder="Select end date"
            :min-date="form.startsAt || undefined"
            :invalid="v$.endsAt.$error"
            @closed="v$.endsAt.$touch()"
          />
        </AppInputContainer>
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
