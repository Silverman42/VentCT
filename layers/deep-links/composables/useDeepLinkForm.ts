import type { Ref } from "vue";
import { useVuelidate } from "@vuelidate/core";
import {
  helpers,
  maxLength,
  required,
  url as urlValidator,
} from "@vuelidate/validators";
import type {
  DeepLinkStatus,
  DeepLinkType,
  ICreateDeepLinkPayload,
  IDeepLink,
  IUpdateDeepLinkPayload,
} from "./useDeepLinkStore";

/** Values collected by the deep-link create and edit forms. */
export interface DeepLinkForm {
  name: string;
  type: DeepLinkType;
  target: string;
  referral_code: string;
  preview_title: string;
  preview_description: string;
  preview_image_url: string;
  status: DeepLinkStatus;
}

/** Identifies the form fields that can surface Vuelidate feedback. */
export type DeepLinkFormField = keyof DeepLinkForm;

/** Maps form fields to their current validation error text. */
export type DeepLinkFormErrors = Partial<Record<DeepLinkFormField, string>>;

const FORM_FIELDS: DeepLinkFormField[] = [
  "name",
  "type",
  "target",
  "referral_code",
  "preview_title",
  "preview_description",
  "preview_image_url",
  "status",
];

/** Builds an empty create form with the API defaults. */
export const createEmptyDeepLinkForm = (): DeepLinkForm => ({
  name: "",
  type: "referral",
  target: "",
  referral_code: "",
  preview_title: "",
  preview_description: "",
  preview_image_url: "",
  status: "active",
});

/** Prefills the form from an existing deep link, replacing nulls with "". */
export const createDeepLinkFormFrom = (deepLink: IDeepLink): DeepLinkForm => ({
  name: deepLink.name ?? "",
  type: deepLink.type ?? "referral",
  target: deepLink.target ?? "",
  referral_code: deepLink.referral_code ?? "",
  preview_title: deepLink.preview_title ?? "",
  preview_description: deepLink.preview_description ?? "",
  preview_image_url: deepLink.preview_image_url ?? "",
  status: deepLink.status ?? "active",
});

/** Trims a value and returns undefined when it is empty. */
const optional = (value: string): string | undefined =>
  value.trim() || undefined;

/**
 * Maps the form to a create payload. Empty optional fields are omitted and the
 * referral code is only sent for referral links.
 */
export const toCreateDeepLinkPayload = (
  form: DeepLinkForm,
): ICreateDeepLinkPayload => ({
  name: form.name.trim(),
  type: form.type,
  target: form.target.trim(),
  referral_code:
    form.type === "referral" ? optional(form.referral_code) : undefined,
  preview_title: optional(form.preview_title),
  preview_description: optional(form.preview_description),
  preview_image_url: optional(form.preview_image_url),
  status: form.status,
});

/**
 * Maps the form to an update payload. Cleared optional fields are sent as
 * null so the API removes them.
 */
export const toUpdateDeepLinkPayload = (
  form: DeepLinkForm,
): IUpdateDeepLinkPayload => {
  const payload = toCreateDeepLinkPayload(form);
  return {
    ...payload,
    referral_code: payload.referral_code ?? null,
    preview_title: payload.preview_title ?? null,
    preview_description: payload.preview_description ?? null,
    preview_image_url: payload.preview_image_url ?? null,
  };
};

/**
 * Creates the Vuelidate state for a deep-link form using the API's request
 * rules (§10.2), plus a derived error map for the form fields component.
 */
export const useDeepLinkFormValidation = (form: Ref<DeepLinkForm>) => {
  /** Rules recomputed when the type changes, since only `link` targets must be URLs. */
  const rules = computed(() => ({
    name: {
      required: helpers.withMessage("Name is required", required),
      maxLength: helpers.withMessage(
        "Name must be 255 characters or fewer",
        maxLength(255),
      ),
    },
    type: {
      required: helpers.withMessage("Select a link type", required),
    },
    target: {
      required: helpers.withMessage("Target is required", required),
      maxLength: helpers.withMessage(
        "Target must be 500 characters or fewer",
        maxLength(500),
      ),
      ...(form.value.type === "link"
        ? { url: helpers.withMessage("Enter a valid URL", urlValidator) }
        : {}),
    },
    referral_code: {
      maxLength: helpers.withMessage(
        "Referral code must be 50 characters or fewer",
        maxLength(50),
      ),
    },
    preview_title: {
      maxLength: helpers.withMessage(
        "Preview title must be 255 characters or fewer",
        maxLength(255),
      ),
    },
    preview_description: {
      maxLength: helpers.withMessage(
        "Preview description must be 1000 characters or fewer",
        maxLength(1000),
      ),
    },
    preview_image_url: {
      url: helpers.withMessage("Enter a valid image URL", urlValidator),
      maxLength: helpers.withMessage(
        "Image URL must be 2048 characters or fewer",
        maxLength(2048),
      ),
    },
    status: {
      required: helpers.withMessage("Select a status", required),
    },
  }));

  const v$ = useVuelidate(rules, form);

  /** First error message per touched field, for display under each input. */
  const formErrors = computed<DeepLinkFormErrors>(() =>
    FORM_FIELDS.reduce<DeepLinkFormErrors>((errors, field) => {
      const fieldState = v$.value[field];
      if (fieldState?.$error) {
        errors[field] = String(fieldState.$errors[0]?.$message ?? "");
      }
      return errors;
    }, {}),
  );

  /** Marks one field as touched after a form interaction. */
  const touchField = (field: DeepLinkFormField): void => {
    v$.value[field]?.$touch();
  };

  return { v$, formErrors, touchField };
};
