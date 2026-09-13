<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type {
  AttendanceMethod,
  CreateAttendancePayload,
} from "../composables/useAttendanceStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const { campaignOptions, defaultCampaign, createAttendance } = useAttendanceStore();
const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);

const form = reactive<CreateAttendancePayload>({
  campaign: defaultCampaign,
  method: "manual",
  name: "",
  email: "",
  phone: "",
  date: "2026-04-01",
  referralCode: "",
});

/** Defines form feedback for a complete local attendance entry. */
const validations = computed(() => ({
  campaign: {
    required: helpers.withMessage("Select a campaign", required),
  },
  method: {
    required: helpers.withMessage("Select an attendance method", required),
  },
  name: {
    required: helpers.withMessage("Full name is required", required),
  },
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Enter a valid email address", email),
  },
  phone: {
    required: helpers.withMessage("Phone number is required", required),
  },
  date: {
    required: helpers.withMessage("Date is required", required),
  },
  referralCode: {
    required: helpers.withMessage("Referral code is required", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Restores the screenshot-backed local creation defaults. */
const resetForm = (): void => {
  form.campaign = defaultCampaign;
  form.method = "manual";
  form.name = "";
  form.email = "";
  form.phone = "";
  form.date = "2026-04-01";
  form.referralCode = "";
  v$.value.$reset();
};

/** Opens a clean attendance form and focuses its first editable field. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  nameInput.value?.focus();
};

/** Dismisses the dialog without persisting its draft. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects a campaign and dismisses its dropdown list. */
const selectCampaign = (campaign: string): void => {
  form.campaign = campaign;
  v$.value.campaign.$touch();
  campaignDropdown.value?.closeDropdown();
};

/** Selects an attendance method without changing the visible form fields. */
const selectMethod = (method: AttendanceMethod): void => {
  form.method = method;
  v$.value.method.$touch();
};

/** Validates and saves an attended fixture record for the active session. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  createAttendance({ ...form });
  close();
  useToastHandler().triggerToast(
    "The attendee has been added and marked as attended.",
    "success",
    "Attendance created",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="600px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Create Attendance
        </h2>
        <p class="mt-1 text-sm text-dashboard-text">
          Create new attendee for this campaign
        </p>
      </div>

      <div class="space-y-4 py-5">
        <AppInputContainer
          label="Campaign"
          for="create-attendance-campaign"
          :error="v$.campaign.$error ? String(v$.campaign.$errors[0]?.$message ?? '') : ''"
        >
          <AppDropdown
            ref="campaignDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="create-attendance-campaign"
              type="button"
              class="flex min-h-11 w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.campaign.$error"
              aria-haspopup="listbox"
            >
              {{ form.campaign || 'Select a campaign' }}
              <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
            </button>
            <template #dropdown_body>
              <div role="listbox" aria-label="Campaign" class="max-h-64 min-w-60 space-y-1 overflow-y-auto">
                <button
                  v-for="campaign in campaignOptions"
                  :key="campaign"
                  type="button"
                  role="option"
                  :aria-selected="form.campaign === campaign"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.campaign === campaign }"
                  @click="selectCampaign(campaign)"
                >
                  {{ campaign }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <fieldset>
          <legend class="mb-2 text-sm font-medium text-dashboard-heading">Method</legend>
          <div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Attendance method">
            <button
              v-for="method in ([
                { value: 'qr-scan', label: 'QR Scan' },
                { value: 'manual', label: 'Manual' },
              ] as Array<{ value: AttendanceMethod; label: string }>)"
              :key="method.value"
              type="button"
              role="radio"
              :aria-checked="form.method === method.value"
              class="rounded-lg border px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-color-default/30"
              :class="form.method === method.value ? 'border-brand-color-default bg-brand-color-default/10 text-brand-color-default' : 'border-input-border bg-dashboard-bg text-dashboard-text hover:border-brand-color-default'"
              @click="selectMethod(method.value)"
            >
              {{ method.label }}
            </button>
          </div>
          <p v-if="v$.method.$error" class="mt-1 text-xs text-red-500" role="alert">
            {{ String(v$.method.$errors[0]?.$message ?? '') }}
          </p>
        </fieldset>

        <AppInputContainer
          label="Full Name"
          for="create-attendance-name"
          :error="v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="create-attendance-name"
            ref="nameInput"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            placeholder="e.g. Clement Ikhide"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Email Address"
          for="create-attendance-email"
          :error="v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="create-attendance-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Phone"
          for="create-attendance-phone"
          :error="v$.phone.$error ? String(v$.phone.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="create-attendance-phone"
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            placeholder="+234-"
            :aria-invalid="v$.phone.$error"
            @blur="v$.phone.$touch()"
          />
        </AppInputContainer>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInputContainer
            label="Date"
            for="create-attendance-date"
            :error="v$.date.$error ? String(v$.date.$errors[0]?.$message ?? '') : ''"
          >
            <input
              id="create-attendance-date"
              v-model="form.date"
              type="date"
              :aria-invalid="v$.date.$error"
              @blur="v$.date.$touch()"
            />
          </AppInputContainer>

          <AppInputContainer
            label="Referral Code"
            for="create-attendance-referral-code"
            :error="v$.referralCode.$error ? String(v$.referralCode.$errors[0]?.$message ?? '') : ''"
          >
            <input
              id="create-attendance-referral-code"
              v-model.trim="form.referralCode"
              type="text"
              autocomplete="off"
              placeholder="e.g. OMR"
              :aria-invalid="v$.referralCode.$error"
              @blur="v$.referralCode.$touch()"
            />
          </AppInputContainer>
        </div>
      </div>

      <div class="flex pt-5">
        <AppButton size="md" type="submit" :block="false" color="primary">
          Create Attendance
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
