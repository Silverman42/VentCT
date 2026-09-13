<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, integer, minValue, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type { CampaignStatus } from "../composables/useCampaignMockData";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface CampaignCreatePayload {
  name: string;
  target: number | null;
  referralCode: string;
  status: CampaignStatus;
}

const modal = ref<ModalController | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const form = reactive<CampaignCreatePayload>({
  name: "",
  target: null,
  referralCode: "",
  status: "pending",
});

/** Defines the validation feedback for the local campaign draft. */
const validations = computed(() => ({
  name: {
    required: helpers.withMessage("Campaign name is required", required),
  },
  target: {
    required: helpers.withMessage("Target is required", required),
    integer: helpers.withMessage("Target must be a whole number", integer),
    minValue: helpers.withMessage(
      "Target must be greater than zero",
      minValue(1),
    ),
  },
  referralCode: {
    required: helpers.withMessage("Referral code is required", required),
  },
  status: {
    required: helpers.withMessage("Status is required", required),
  },
}));

const v$ = useVuelidate(validations, form);

const statusOptions: Array<{ value: CampaignStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "closed", label: "Closed" },
];

/** Restores blank creation fields and clears validation feedback. */
const resetForm = (): void => {
  form.name = "";
  form.target = null;
  form.referralCode = "";
  form.status = "pending";
  v$.value.$reset();
};

/** Opens the new-campaign dialog with a fresh local draft. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  nameInput.value?.focus();
};

/** Closes the new-campaign dialog without persisting its local draft. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Formats a campaign status for the dropdown trigger. */
const getStatusLabel = (status: CampaignStatus): string =>
  statusOptions.find((option) => option.value === status)?.label ?? status;

/** Selects a campaign status, validates it, and closes the status menu. */
const selectStatus = (status: CampaignStatus): void => {
  form.status = status;
  v$.value.status.$touch();
  statusDropdown.value?.closeDropdown();
};

/** Validates the draft and acknowledges the fixture-only creation flow. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  close();
  useToastHandler().triggerToast(
    "Campaign details were validated locally and were not created.",
    "success",
    "Campaign validated",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          New Campaign
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-4 py-5 md:grid-cols-2">
        <div class="md:col-span-2">
          <AppInputContainer
            label="Name"
            for="new-campaign-name"
            :error="
              v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''
            "
          >
            <input
              id="new-campaign-name"
              ref="nameInput"
              v-model.trim="form.name"
              type="text"
              autocomplete="off"
              :aria-invalid="v$.name.$error"
              @blur="v$.name.$touch()"
            />
          </AppInputContainer>
        </div>

        <AppInputContainer
          label="Target"
          for="new-campaign-target"
          :error="
            v$.target.$error ? String(v$.target.$errors[0]?.$message ?? '') : ''
          "
        >
          <input
            id="new-campaign-target"
            v-model.number="form.target"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :aria-invalid="v$.target.$error"
            @blur="v$.target.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Referral Code"
          for="new-campaign-referral-code"
          :error="
            v$.referralCode.$error
              ? String(v$.referralCode.$errors[0]?.$message ?? '')
              : ''
          "
        >
          <input
            id="new-campaign-referral-code"
            v-model.trim="form.referralCode"
            type="text"
            autocomplete="off"
            :aria-invalid="v$.referralCode.$error"
            @blur="v$.referralCode.$touch()"
          />
        </AppInputContainer>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Status"
            for="new-campaign-status"
            :error="
              v$.status.$error
                ? String(v$.status.$errors[0]?.$message ?? '')
                : ''
            "
          >
            <AppDropdown
              ref="statusDropdown"
              position="left"
              :width-is-finite="false"
              :container-full="true"
            >
              <button
                id="new-campaign-status"
                type="button"
                class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
                :aria-invalid="v$.status.$error"
                aria-haspopup="listbox"
              >
                {{ getStatusLabel(form.status) }}
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
        <AppButton size="md" type="submit" :block="false" color="primary">
          Create campaign
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
