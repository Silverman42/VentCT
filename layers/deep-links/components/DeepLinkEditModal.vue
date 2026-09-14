<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required, requiredIf, url as urlValidator } from "@vuelidate/validators";
import {
  createDeepLinkDraft,
  createEmptyDeepLinkDraft,
  type DeepLink,
  type DeepLinkDraft,
} from "../composables/useDeepLinkStore";
import type {
  DeepLinkFormErrors,
  DeepLinkFormField,
} from "./DeepLinkFormFields.vue";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface VuelidateFieldState {
  $error: boolean;
  $errors: Array<{ $message: unknown }>;
  $touch: () => void;
}

const modal = ref<ModalController | null>(null);
const deepLinkId = ref("");
const form = ref<DeepLinkDraft>(createEmptyDeepLinkDraft());
const { updateDeepLink, updatingDeepLink } = useDeepLinkStore();

/** Defines conditional validation rules for every editable deep-link value. */
const validations = computed(() => ({
  type: { required: helpers.withMessage("Select a deep link type", required) },
  internalName: {},
  referralCode: {
    required: helpers.withMessage(
      "Referral code is required",
      requiredIf(() => form.value.type === "referral"),
    ),
  },
  route: {
    required: helpers.withMessage(
      "Select an in-app route",
      requiredIf(() => form.value.type === "route"),
    ),
  },
  routeParameter: {},
  url: {
    required: helpers.withMessage(
      "A destination URL is required",
      requiredIf(() => form.value.type === "link"),
    ),
    url: helpers.withMessage("Enter a valid URL", urlValidator),
  },
  browserMode: {
    required: helpers.withMessage("Choose a browser destination", required),
  },
  previewTitle: {
    required: helpers.withMessage("Preview title is required", required),
  },
  previewDescription: {
    required: helpers.withMessage("Preview description is required", required),
  },
  previewImageUrl: {
    url: helpers.withMessage("Enter a valid image URL", urlValidator),
  },
}));

const v$ = useVuelidate(validations, form);

/** Retrieves one Vuelidate field state using the shared form-field key union. */
const getFieldState = (field: DeepLinkFormField): VuelidateFieldState =>
  v$.value[field] as unknown as VuelidateFieldState;

/** Converts current validation feedback into field errors for AppInputContainer. */
const formErrors = computed<DeepLinkFormErrors>(() => {
  const fields: DeepLinkFormField[] = [
    "type",
    "internalName",
    "referralCode",
    "route",
    "routeParameter",
    "url",
    "browserMode",
    "previewTitle",
    "previewDescription",
    "previewImageUrl",
  ];

  return fields.reduce<DeepLinkFormErrors>((errors, field) => {
    const state = getFieldState(field);
    if (state.$error) errors[field] = String(state.$errors[0]?.$message ?? "");
    return errors;
  }, {});
});

/** Opens the edit modal with the latest values from the selected fixture record. */
const open = (deepLink: DeepLink): void => {
  deepLinkId.value = deepLink.id;
  form.value = createDeepLinkDraft(deepLink);
  v$.value.$reset();
  modal.value?.showDialogBox();
};

/** Closes the editor and clears transient record state. */
const close = (): void => {
  modal.value?.hideDialogBox();
  deepLinkId.value = "";
};

/** Marks one field as interacted with after shared form controls emit an interaction. */
const touchField = (field: DeepLinkFormField): void => {
  getFieldState(field).$touch();
};

/** Stores a temporary browser-session image URL after a file is selected. */
const setUploadedImage = (file: File | null): void => {
  form.value.previewImageUrl = file ? URL.createObjectURL(file) : "";
};

/** Validates the complete edit form while allowing an optional image source. */
const validateForm = async (): Promise<boolean> => {
  const baseFieldsValid = await Promise.all([
    v$.value.type.$validate(),
    v$.value.previewTitle.$validate(),
    v$.value.previewDescription.$validate(),
  ]);

  const typeIsValid =
    form.value.type === "referral"
      ? await v$.value.referralCode.$validate()
      : form.value.type === "route"
        ? await v$.value.route.$validate()
        : (await v$.value.url.$validate()) && (await v$.value.browserMode.$validate());

  const imageIsValid =
    form.value.previewImageMode === "upload" ||
    (await v$.value.previewImageUrl.$validate());

  return baseFieldsValid.every(Boolean) && typeIsValid && imageIsValid;
};

/** Persists valid fixture edits and reports the resulting session update. */
const submit = async (): Promise<void> => {
  if (!deepLinkId.value || !(await validateForm())) return;

  try {
    await updateDeepLink(deepLinkId.value, form.value);
    close();
    useToastHandler().triggerToast(
      "Deep link changes have been saved for this session.",
      "success",
      "Deep link updated",
      "large",
    );
  } catch {
    useToastHandler().triggerToast(
      "The deep link could not be updated. Please try again.",
      "error",
      "Deep link not updated",
      "large",
    );
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="900px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <header class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">Edit Deep Link</h2>
        <p class="mt-1 text-xs text-dashboard-text">Edit deep link content</p>
      </header>

      <DeepLinkFormFields
        v-model:form="form"
        :errors="formErrors"
        include-preview
        @touch="touchField"
        @image-file-selected="setUploadedImage"
      />

      <section class="mt-7" aria-labelledby="edit-link-preview-heading">
        <h3 id="edit-link-preview-heading" class="mb-4 text-base font-medium text-dashboard-heading">
          Preview <span class="font-normal text-dashboard-text">(How it will look when shared).</span>
        </h3>
        <DeepLinkPreviewCard
          :title="form.previewTitle"
          :description="form.previewDescription"
          :image-url="form.previewImageUrl"
        />
      </section>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton type="submit" size="md" :block="false" color="primary" :loading="updatingDeepLink">
          Save Change
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
