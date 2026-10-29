/** Role that bypasses every permission check. */
export const SUPER_ADMIN_ROLE = "super-admin";

/**
 * Returns true when the user holds at least one of the required permissions.
 * Super-admins always pass, and an empty requirement list always passes.
 */
export const hasAnyPermission = (
  userPermissions: string[] | undefined,
  required: string | string[],
  userRoles: string[] = [],
): boolean => {
  if (userRoles.includes(SUPER_ADMIN_ROLE)) return true;

  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.length === 0) return true;

  const granted = new Set(userPermissions ?? []);
  return requiredList.some((permission) => granted.has(permission));
};

/** Turns a slug-style role name such as `regional-manager` into `Regional Manager`. */
export const formatRoleName = (name: string): string =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
