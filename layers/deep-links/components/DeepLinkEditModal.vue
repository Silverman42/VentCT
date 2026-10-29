<script setup lang="ts">
import type { IDeepLink } from "../composables/useDeepLinkStore";
import {
  createDeepLinkFormFrom,
  createEmptyDeepLinkForm,
  toUpdateDeepLinkPayload,
  useDeepLinkFormValidation,
  type DeepLinkForm,
} from "../composables/useDeepLinkForm";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const deepLinkId = ref("");
const form = ref<DeepLinkForm>(createEmptyDeepLinkForm());
const { updateDeepLink, updatingDeepLink } = useDeepLinkStore();
const { v$, formErrors, touchField } = useDeepLinkFormValidation(form);

/** Opens the edit modal prefilled with the selected deep link. */
const open = (deepLink: IDeepLink): void => {
  deepLinkId.value = deepLink.id;
  form.value = createDeepLinkFormFrom(deepLink);
  v$.value.$reset();
  modal.value?.showDialogBox();
};

/** Closes the editor and clears the selected record. */
const close = (): void => {
  modal.value?.hideDialogBox();
  deepLinkId.value = "";
};

/** Validates and saves the changes; the store reports API errors. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (!deepLinkId.value || v$.value.$invalid) return;

  try {
    await updateDeepLink(deepLinkId.value, toUpdateDeepLinkPayload(form.value));
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
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">Edit Deep Link</h2>
        <p class="mt-1 text-xs text-dashboard-text">Update this link's details and preview</p>
      </header>

      <DeepLinkFormFields
        v-model:form="form"
        :errors="formErrors"
        :show-status="false"
        @touch="touchField"
      />

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton type="submit" size="md" :block="false" color="primary" :loading="updatingDeepLink">
          Save Changes
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
