<script setup lang="ts">
import {
  createEmptyDeepLinkForm,
  toCreateDeepLinkPayload,
  useDeepLinkFormValidation,
  type DeepLinkForm,
} from "../composables/useDeepLinkForm";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const form = ref<DeepLinkForm>(createEmptyDeepLinkForm());
const { createDeepLink, creatingDeepLink } = useDeepLinkStore();
const { v$, formErrors, touchField } = useDeepLinkFormValidation(form);

/** Restores empty form values and clears validation feedback. */
const resetForm = (): void => {
  form.value = createEmptyDeepLinkForm();
  v$.value.$reset();
};

/** Opens the creation modal with a clean form. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Dismisses the creation modal and clears its form state. */
const close = (): void => {
  modal.value?.hideDialogBox();
  resetForm();
};

/** Validates the form and creates the deep link; the store reports API errors. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await createDeepLink(toCreateDeepLinkPayload(form.value));
    close();
  } catch {
    // ApiErrorHandler in the store has already surfaced the failure.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="640px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <header class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">New Deep Link</h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Create a Branch link for a referral, an in-app route, or an external URL
        </p>
      </header>

      <DeepLinkFormFields v-model:form="form" :errors="formErrors" @touch="touchField" />

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton type="submit" size="md" :block="false" color="primary" :loading="creatingDeepLink">
          Create Link
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
