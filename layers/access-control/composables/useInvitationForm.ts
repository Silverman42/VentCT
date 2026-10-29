import type { Ref } from "vue";
import { useVuelidate } from "@vuelidate/core";
import {
  email as emailValidator,
  helpers,
  maxLength,
  required,
} from "@vuelidate/validators";
import type { ISendInvitationPayload } from "./useInvitationStore";

/** Email domain every invited team member must belong to (§13.2). */
export const INVITATION_EMAIL_DOMAIN = "@vent.africa";

/** Values collected by the send-invitation form. */
export interface InvitationForm {
  email: string;
  role: string;
  permissions: string[];
}

/** Form fields that can surface Vuelidate feedback. */
export type InvitationFormField = "email" | "role";

/** Builds an empty invitation form. */
export const createEmptyInvitationForm = (): InvitationForm => ({
  email: "",
  role: "",
  permissions: [],
});

/** Maps the invitation form to the request body, omitting empty permissions. */
export const toInvitationPayload = (
  form: InvitationForm,
): ISendInvitationPayload => ({
  email: form.email.trim().toLowerCase(),
  role: form.role,
  permissions: form.permissions.length ? [...new Set(form.permissions)] : undefined,
});

/** Passes when the email is empty (left to `required`) or ends with the Vent domain. */
const isVentEmail = (value: string): boolean =>
  !value || value.trim().toLowerCase().endsWith(INVITATION_EMAIL_DOMAIN);

/**
 * Creates the Vuelidate state for the invitation form using the API's
 * request rules (§13.2), plus a per-field error map.
 */
export const useInvitationFormValidation = (form: Ref<InvitationForm>) => {
  const rules = {
    email: {
      required: helpers.withMessage("Email address is required", required),
      email: helpers.withMessage("Enter a valid email address", emailValidator),
      maxLength: helpers.withMessage(
        "Email must be 255 characters or fewer",
        maxLength(255),
      ),
      ventEmail: helpers.withMessage(
        `The email address must belong to the ${INVITATION_EMAIL_DOMAIN} domain`,
        isVentEmail,
      ),
    },
    role: {
      required: helpers.withMessage("Role is required", required),
    },
  };

  const v$ = useVuelidate(rules, form);

  /** First error message per touched field, for display under each input. */
  const formErrors = computed<Partial<Record<InvitationFormField, string>>>(() => {
    const errors: Partial<Record<InvitationFormField, string>> = {};
    (["email", "role"] as const).forEach((field) => {
      if (v$.value[field].$error) {
        errors[field] = String(v$.value[field].$errors[0]?.$message ?? "");
      }
    });
    return errors;
  });

  /** Marks one field as touched after a form interaction. */
  const touchField = (field: InvitationFormField): void => {
    v$.value[field].$touch();
  };

  return { v$, formErrors, touchField };
};
