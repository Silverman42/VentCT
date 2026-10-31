<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, maxLength, required } from "@vuelidate/validators";
import type {
  IPromoter,
  IUpdatePromoterPayload,
} from "../composables/usePromotersStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Editable promoter profile fields. */
interface IPromoterEditForm {
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  campaignId: string;
}

const props = defineProps<{
  promoter: IPromoter;
}>();

const { updatePromoter, updatingPromoter } = usePromotersStore();
const modal = ref<ModalController | null>(null);
const form = reactive<IPromoterEditForm>({
  name: "",
  email: "",
  phone: "",
  referralCode: "",
  campaignId: "",
});

/** Validation rules mirroring the update endpoint's request rules. */
const validations = computed(() => ({
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
    required: helpers.withMessage("Referral code is required", required),
    maxLength: helpers.withMessage(
      "Referral code must be 50 characters or fewer",
      maxLength(50),
    ),
  },
  campaignId: {
    required: helpers.withMessage("Select a campaign", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Returns the first validation message for a field, or an empty string. */
const fieldError = (field: keyof IPromoterEditForm): string =>
  v$.value[field].$error ? String(v$.value[field].$errors[0]?.$message ?? "") : "";

/** Restores the form from the current promoter record. */
const resetForm = (): void => {
  form.name = props.promoter.name ?? "";
  form.email = props.promoter.email ?? "";
  form.phone = props.promoter.phone ?? "";
  form.referralCode = props.promoter.referralCode ?? "";
  form.campaignId = props.promoter.campaignId ?? "";
  v$.value.$reset();
};

/** Opens the edit form with the latest promoter values. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the edit form without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Builds a payload containing only the fields that changed. */
const buildChanges = (): IUpdatePromoterPayload => {
  const changes: IUpdatePromoterPayload = {};
  if (form.name !== props.promoter.name) changes.name = form.name;
  if (form.email !== props.promoter.email) changes.email = form.email;
  if (form.phone !== (props.promoter.phone ?? "")) changes.phone = form.phone;
  if (form.referralCode !== props.promoter.referralCode) {
    changes.referralCode = form.referralCode;
  }
  if (form.campaignId !== props.promoter.campaignId) {
    changes.campaignId = form.campaignId;
  }
  return changes;
};

/** Validates the form and saves any changed fields. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const changes = buildChanges();
  if (!Object.keys(changes).length) {
    close();
    return;
  }

  try {
    await updatePromoter(props.promoter.id, changes);
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="680px">
    <form class="flex flex-col pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Edit Profile
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">Edit promoter profile</p>
      </div>

      <div class="space-y-4 py-5">
        <PromoterFormField
          label="Full Name"
          for="edit-promoter-name"
          :error="fieldError('name')"
        >
          <input
            id="edit-promoter-name"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Email Address"
          for="edit-promoter-email"
          :error="fieldError('email')"
        >
          <input
            id="edit-promoter-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </PromoterFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PromoterFormField
            label="Phone (optional)"
            for="edit-promoter-phone"
            :error="fieldError('phone')"
          >
            <input
              id="edit-promoter-phone"
              v-model.trim="form.phone"
              type="tel"
              autocomplete="tel"
              :aria-invalid="v$.phone.$error"
              @blur="v$.phone.$touch()"
            />
          </PromoterFormField>

          <PromoterFormField
            label="Referral Code"
            for="edit-promoter-referral-code"
            :error="fieldError('referralCode')"
          >
            <input
              id="edit-promoter-referral-code"
              v-model.trim="form.referralCode"
              type="text"
              autocomplete="off"
              :aria-invalid="v$.referralCode.$error"
              @blur="v$.referralCode.$touch()"
            />
          </PromoterFormField>
        </div>
        <p class="-mt-2 text-xs text-dashboard-text">
          Changing the referral code regenerates the app and web referral links.
        </p>

        <PromoterFormField
          label="Campaign"
          for="edit-promoter-campaign"
          :error="fieldError('campaignId')"
        >
          <PromoterCampaignSelect
            id="edit-promoter-campaign"
            v-model="form.campaignId"
            :invalid="v$.campaignId.$error"
            :fallback-label="promoter.campaignName"
            @selected="v$.campaignId.$touch()"
          />
        </PromoterFormField>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-8 sm:flex-row sm:justify-start">
        <AppButton
          size="md"
          type="button"
          :block="false"
          outlined
          color="primary"
          :disabled="updatingPromoter"
          @click="close"
        >
          Cancel
        </AppButton>
        <AppButton
          size="md"
          type="submit"
          :block="false"
          color="primary"
          :loading="updatingPromoter"
        >
          Save changes
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
