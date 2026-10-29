<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, maxLength } from "@vuelidate/validators";
import type { ISendDigestPayload } from "../composables/useDashboardStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const { sendDigest, sendingDigest } = useDashboardStore();

const modal = ref<ModalController | null>(null);
const form = reactive<Required<ISendDigestPayload>>({ email: "" });

/** Email is optional; when given it must be a valid address. */
const validations = computed(() => ({
  email: {
    email: helpers.withMessage("Enter a valid email address", email),
    maxLength: helpers.withMessage(
      "Email must be 255 characters or fewer",
      maxLength(255),
    ),
  },
}));

const v$ = useVuelidate(validations, form);

/** First validation message for the email field once it has been touched. */
const emailError = computed(() =>
  v$.value.email.$error ? String(v$.value.email.$errors[0]?.$message ?? "") : "",
);

/** Clears the form and validation feedback. */
const resetForm = (): void => {
  form.email = "";
  v$.value.$reset();
};

/** Opens the dialog with an empty form. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the dialog without sending. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Validates the form, then asks the API to generate and email the digest. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await sendDigest(form.email ? { email: form.email } : {});
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="540px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Send weekly digest
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Emails the last 7 days of leads, funnel rates, top promoters and active
          campaigns.
        </p>
      </div>

      <div class="py-5">
        <AppInputContainer
          label="Recipient email (optional)"
          for="digest-email"
          :error="emailError"
        >
          <input
            id="digest-email"
            v-model.trim="form.email"
            type="email"
            placeholder="ops@vent.africa"
            autocomplete="email"
            @blur="v$.email.$touch()"
            @input="v$.email.$touch()"
          />
        </AppInputContainer>
        <p class="mt-2 text-xs text-dashboard-text">
          Leave blank to send it to the super-admins.
        </p>
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
          :loading="sendingDigest"
        >
          Send digest
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
