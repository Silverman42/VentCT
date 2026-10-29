import type { Ref } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxLength, required } from "@vuelidate/validators";
import type { IRole, IRolePayload } from "./useAccessControlStore";

/** Values collected by the role create and edit form. */
export interface RoleForm {
  name: string;
  permissions: string[];
}

/** Builds an empty role form. */
export const createEmptyRoleForm = (): RoleForm => ({
  name: "",
  permissions: [],
});

/** Prefills the role form from an existing role. */
export const createRoleFormFrom = (role: IRole): RoleForm => ({
  name: role.name ?? "",
  permissions: (role.permissions ?? []).map((permission) => permission.name),
});

/** Maps the role form to the create/update request body. */
export const toRolePayload = (form: RoleForm): IRolePayload => ({
  name: form.name.trim(),
  permissions: [...new Set(form.permissions)],
});

/**
 * Creates the Vuelidate state for the role form using the API's
 * `RoleFormRequest` rules (§12.3), plus the name field's error text.
 */
export const useRoleFormValidation = (form: Ref<RoleForm>) => {
  const rules = {
    name: {
      required: helpers.withMessage("Role name is required", required),
      maxLength: helpers.withMessage(
        "Role name must be 255 characters or fewer",
        maxLength(255),
      ),
    },
  };

  const v$ = useVuelidate(rules, form);

  /** First validation message for the name field once it has been touched. */
  const nameError = computed<string>(() =>
    v$.value.name.$error ? String(v$.value.name.$errors[0]?.$message ?? "") : "",
  );

  return { v$, nameError };
};
