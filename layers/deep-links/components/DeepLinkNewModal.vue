<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required, requiredIf, url as urlValidator } from "@vuelidate/validators";
import {
  createEmptyDeepLinkDraft,
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

type CreationStep = 1 | 2 | 3;

const modal = ref<ModalController | null>(null);
const step = ref<CreationStep>(1);
const form = ref<DeepLinkDraft>(createEmptyDeepLinkDraft());
const { createDeepLink, creatingDeepLink } = useDeepLinkStore();

/** Defines the conditional Vuelidate rules used across all wizard steps. */
const validations = computed(() => ({
  type: {
    required: helpers.withMessage("Select a deep link type", required),
  },
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

/** Converts Vuelidate feedback into the error object consumed by shared controls. */
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

/** Restores a new wizard session with no retained draft or validation feedback. */
const resetForm = (): void => {
  step.value = 1;
  form.value = createEmptyDeepLinkDraft();
  v$.value.$reset();
};

/** Opens the creation modal with a fresh three-step draft. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Dismisses the creation modal and clears its current wizard state. */
const close = (): void => {
  modal.value?.hideDialogBox();
  resetForm();
};

/** Marks one field as touched after shared form controls emit an interaction. */
const touchField = (field: DeepLinkFormField): void => {
  getFieldState(field).$touch();
};

/** Stores a temporary session image URL after the shared file selector accepts a file. */
const setUploadedImage = (file: File | null): void => {
  form.value.previewImageUrl = file ? URL.createObjectURL(file) : "";
};

/** Validates exactly the destination fields visible on the wizard's first step. */
const validateDestinationStep = async (): Promise<boolean> => {
  const typeIsValid = await v$.value.type.$validate();
  if (!typeIsValid) return false;

  if (form.value.type === "referral") {
    return v$.value.referralCode.$validate();
  }

  if (form.value.type === "route") return v$.value.route.$validate();

  const [urlIsValid, browserModeIsValid] = await Promise.all([
    v$.value.url.$validate(),
    v$.value.browserMode.$validate(),
  ]);
  return urlIsValid && browserModeIsValid;
};

/** Validates preview metadata and a pasted image URL before opening final preview. */
const validatePreviewStep = async (): Promise<boolean> => {
  const [titleIsValid, descriptionIsValid] = await Promise.all([
    v$.value.previewTitle.$validate(),
    v$.value.previewDescription.$validate(),
  ]);

  if (form.value.previewImageMode === "upload") {
    return titleIsValid && descriptionIsValid;
  }

  const imageUrlIsValid = await v$.value.previewImageUrl.$validate();
  return titleIsValid && descriptionIsValid && imageUrlIsValid;
};

/** Advances the wizard only after the active step's values are valid. */
const next = async (): Promise<void> => {
  if (step.value === 1) {
    if (await validateDestinationStep()) step.value = 2;
    return;
  }

  if (step.value === 2 && (await validatePreviewStep())) step.value = 3;
};

/** Moves the wizard to its preceding step without clearing collected values. */
const previous = (): void => {
  if (step.value > 1) step.value = (step.value - 1) as CreationStep;
};

/** Creates a fixture record from the previewed draft and reports success. */
const create = async (): Promise<void> => {
  try {
    await createDeepLink(form.value);
    close();
    useToastHandler().triggerToast(
      "Your new deep link is ready to share.",
      "success",
      "Deep link created",
      "large",
    );
  } catch {
    useToastHandler().triggerToast(
      "The deep link could not be created. Please try again.",
      "error",
      "Deep link not created",
      "large",
    );
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="900px">
    <section class="pb-1">
      <header class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">New Deep Link</h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Generate shareable links that open users directly to targeted in-app content
        </p>
      </header>

      <form v-if="step < 3" novalidate @submit.prevent="next">
        <DeepLinkFormFields
          v-model:form="form"
          :errors="formErrors"
          :include-destination="step === 1"
          :include-preview="step === 2"
          @touch="touchField"
          @image-file-selected="setUploadedImage"
        />

        <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <AppButton
            v-if="step > 1"
            type="button"
            size="md"
            :block="false"
            outlined
            color="primary"
            @click="previous"
          >
            Back
          </AppButton>
          <span v-else />
          <AppButton type="submit" size="md" :block="false" color="primary">
            Next
          </AppButton>
        </div>
      </form>

      <div v-else>
        <div class="mb-4">
          <h3 class="text-base font-medium text-dashboard-heading">
            Preview <span class="font-normal text-dashboard-text">(How it will look when shared).</span>
          </h3>
        </div>
        <DeepLinkPreviewCard
          :title="form.previewTitle"
          :description="form.previewDescription"
          :image-url="form.previewImageUrl"
        />
        <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <AppButton type="button" size="md" :block="false" outlined color="primary" @click="previous">
            Back
          </AppButton>
          <AppButton
            type="button"
            size="md"
            :block="false"
            color="primary"
            :loading="creatingDeepLink"
            @click="create"
          >
            Create Link
          </AppButton>
        </div>
      </div>
    </section>
  </AppModal>
</template>
