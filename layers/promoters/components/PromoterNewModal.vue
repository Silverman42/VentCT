<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import {
  email,
  helpers,
  maxLength,
  required,
  url,
} from "@vuelidate/validators";
import type { ICreatePromoterPayload } from "../composables/usePromotersStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Form model for onboarding a promoter. */
interface IPromoterCreateForm {
  campaignId: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  avatarUrl: string;
}

const { createPromoter, creatingPromoter, promotersCampaignId } =
  usePromotersStore();
const modal = ref<ModalController | null>(null);
const form = reactive<IPromoterCreateForm>({
  campaignId: "",
  name: "",
  email: "",
  phone: "",
  referralCode: "",
  avatarUrl: "",
});

/** Validation rules mirroring the onboarding endpoint's request rules. */
const validations = computed(() => ({
  campaignId: {
    required: helpers.withMessage("Select a campaign", required),
  },
  name: {
    required: helpers.withMessage("Full name is required", required),
    maxLength: helpers.withMessage(
      "Name must be 255 characters or fewer",
      maxLength(255),
    ),
  },
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Enter a valid email address", email),
    maxLength: helpers.withMessage(
      "Email must be 255 characters or fewer",
      maxLength(255),
    ),
  },
  phone: {
    maxLength: helpers.withMessage(
      "Phone must be 50 characters or fewer",
      maxLength(50),
    ),
  },
  referralCode: {
    maxLength: helpers.withMessage(
      "Referral code must be 50 characters or fewer",
      maxLength(50),
    ),
  },
  avatarUrl: {
    url: helpers.withMessage("Enter a valid image URL", url),
    maxLength: helpers.withMessage("URL is too long", maxLength(2048)),
  },
}));

const v$ = useVuelidate(validations, form);

/** Returns the first validation message for a field, or an empty string. */
const fieldError = (field: keyof IPromoterCreateForm): string =>
  v$.value[field].$error ? String(v$.value[field].$errors[0]?.$message ?? "") : "";

/** Clears the form, preselecting the list's active campaign filter. */
const resetForm = (): void => {
  form.campaignId = promotersCampaignId.value;
  form.name = "";
  form.email = "";
  form.phone = "";
  form.referralCode = "";
  form.avatarUrl = "";
  v$.value.$reset();
};

/** Opens a fresh promoter form. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the form without creating a promoter. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Validates the form and onboards the promoter, omitting empty optional fields. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const payload: ICreatePromoterPayload = {
    campaignId: form.campaignId,
    name: form.name,
    email: form.email,
    phone: form.phone || undefined,
    referralCode: form.referralCode || undefined,
    avatarUrl: form.avatarUrl || undefined,
  };

  try {
    await createPromoter(payload);
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="680px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          New Promoter
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Add and assign promoters to campaign
        </p>
      </div>

      <div class="space-y-4 py-5">
        <PromoterFormField
          label="Full Name"
          for="new-promoter-name"
          :error="fieldError('name')"
        >
          <input
            id="new-promoter-name"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            placeholder="e.g. Clement Ikhide"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Email Address"
          for="new-promoter-email"
          :error="fieldError('email')"
        >
          <input
            id="new-promoter-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </PromoterFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PromoterFormField
            label="Phone (optional)"
            for="new-promoter-phone"
            :error="fieldError('phone')"
          >
            <input
              id="new-promoter-phone"
              v-model.trim="form.phone"
              type="tel"
              autocomplete="tel"
              placeholder="+234-"
              :aria-invalid="v$.phone.$error"
              @blur="v$.phone.$touch()"
            />
          </PromoterFormField>

          <PromoterFormField
            label="Referral Code (optional)"
            for="new-promoter-referral-code"
            :error="fieldError('referralCode')"
          >
            <input
              id="new-promoter-referral-code"
              v-model.trim="form.referralCode"
              type="text"
              autocomplete="off"
              placeholder="Auto-generated if empty"
              :aria-invalid="v$.referralCode.$error"
              @blur="v$.referralCode.$touch()"
            />
          </PromoterFormField>
        </div>

        <PromoterFormField
          label="Campaign"
          for="new-promoter-campaign"
          :error="fieldError('campaignId')"
        >
          <PromoterCampaignSelect
            id="new-promoter-campaign"
            v-model="form.campaignId"
            :invalid="v$.campaignId.$error"
            @selected="v$.campaignId.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Avatar URL (optional)"
          for="new-promoter-avatar"
          :error="fieldError('avatarUrl')"
        >
          <input
            id="new-promoter-avatar"
            v-model.trim="form.avatarUrl"
            type="url"
            autocomplete="off"
            placeholder="https://"
            :aria-invalid="v$.avatarUrl.$error"
            @blur="v$.avatarUrl.$touch()"
          />
        </PromoterFormField>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-start">
        <AppButton
          size="md"
          type="button"
          :block="false"
          outlined
          color="primary"
          :disabled="creatingPromoter"
          @click="close"
        >
          Cancel
        </AppButton>
        <AppButton
          size="md"
          type="submit"
          :block="false"
          color="primary"
          :loading="creatingPromoter"
        >
          Add Promoter
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
