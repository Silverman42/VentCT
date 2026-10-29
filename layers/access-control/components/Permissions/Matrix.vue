<script setup lang="ts">
import { formatRoleName } from "~/utils/helpers/Permissions";

/** One role column in the matrix. */
interface MatrixColumn {
  name: string;
  label: string;
}

/** One permission row with a granted flag per role column, in column order. */
interface MatrixRow {
  id: string;
  name: string;
  label: string;
  grants: boolean[];
}

/** One permission group as shown in the matrix. */
interface MatrixGroupView {
  id: string;
  label: string;
  rows: MatrixRow[];
}

const { matrix, fetchingMatrix, fetchMatrix } = useAccessControlStore();

// Show the cached matrix straight away when the tab is re-opened.
const hasLoaded = ref(matrix.value !== null);
const loadFailed = ref(false);
const search = ref("");

/** Role columns in API order, with readable labels. */
const columns = computed<MatrixColumn[]>(() =>
  (matrix.value?.roles ?? []).map((role) => ({
    name: role,
    label: formatRoleName(role),
  })),
);

/** Matrix groups mapped to template-ready rows and filtered by the search term. */
const groups = computed<MatrixGroupView[]>(() => {
  const term = search.value.trim().toLowerCase();

  return (matrix.value?.groups ?? [])
    .map((group) => {
      const groupMatches = !term || group.label?.toLowerCase().includes(term);
      const rows = (group.permissions ?? [])
        .filter(
          (permission) =>
            groupMatches ||
            permission.label?.toLowerCase().includes(term) ||
            permission.name?.toLowerCase().includes(term),
        )
        .map((permission) => ({
          id: permission.id,
          name: permission.name,
          label: permission.label || permission.name,
          grants: columns.value.map((column) => Boolean(permission.roles?.[column.name])),
        }));

      return { id: group.id, label: group.label || group.name, rows };
    })
    .filter((group) => group.rows.length > 0);
});

/** True when the API returned no permission groups at all. */
const isEmpty = computed(() => (matrix.value?.groups ?? []).length === 0);

/** Loads the matrix and records failure for the error state. */
const loadMatrix = async (): Promise<void> => {
  loadFailed.value = false;
  try {
    await fetchMatrix();
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

onMounted(() => {
  void loadMatrix();
});
</script>

<template>
  <PermissionsMatrixShimmer v-if="!hasLoaded || (fetchingMatrix && !matrix)" />

  <section
    v-else-if="loadFailed && !matrix"
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
  >
    <h2 class="text-lg font-medium text-dashboard-heading">We couldn't load permissions</h2>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      Something went wrong while fetching the permission matrix, or you don't have permission to view it.
    </p>
    <AppButton type="button" size="md" class="mt-5" @click="loadMatrix">Retry</AppButton>
  </section>

  <section
    v-else-if="isEmpty"
    class="rounded-[14px] border border-dashboard-card-border bg-dashboard-bg"
  >
    <AppEmptyState
      heading="No permissions found"
      empty-table-subtitle="The permission registry is empty."
      height="40vh"
    />
  </section>

  <div v-else class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-dashboard-text">
        What each role can do. Edit a role to change its permissions.
      </p>
      <label class="relative block sm:w-72">
        <span class="sr-only">Search permissions</span>
        <Icon
          name="vent:search-normal"
          size="1rem"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search permissions..."
          class="w-full rounded-lg border border-dashboard-input-border bg-dashboard-bg py-2.5 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-dashboard-text-light focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
        />
      </label>
    </div>

    <p
      v-if="groups.length === 0"
      class="rounded-xl border border-dashboard-card-border bg-dashboard-bg px-4 py-8 text-center text-sm text-dashboard-text"
    >
      No permissions match your search.
    </p>

    <AppCollapsableCard v-for="group in groups" :key="group.id">
      <template #header-left>
        <div class="min-w-0 pl-2">
          <span class="block truncate text-sm font-medium text-dashboard-heading">
            {{ group.label }}
          </span>
          <span class="block text-xs text-dashboard-text">
            {{ group.rows.length }} {{ group.rows.length === 1 ? "permission" : "permissions" }}
          </span>
        </div>
      </template>

      <template #body>
        <div class="-m-2 overflow-x-auto md:-m-6">
          <table class="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr class="border-b border-dashboard-card-border">
                <th
                  scope="col"
                  class="sticky left-0 bg-dashboard-bg px-3 py-3 text-left text-xs font-medium text-dashboard-text"
                >
                  Permission
                </th>
                <th
                  v-for="column in columns"
                  :key="column.name"
                  scope="col"
                  class="px-3 py-3 text-center text-xs font-medium whitespace-nowrap text-dashboard-text"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in group.rows"
                :key="row.id"
                class="border-b border-dashboard-card-border last:border-b-0"
              >
                <th scope="row" class="sticky left-0 bg-dashboard-bg px-3 py-3 text-left font-normal">
                  <span class="block text-dashboard-heading">{{ row.label }}</span>
                  <span class="block text-xs text-dashboard-text">{{ row.name }}</span>
                </th>
                <td
                  v-for="(granted, index) in row.grants"
                  :key="columns[index]?.name ?? index"
                  class="px-3 py-3 text-center"
                >
                  <Icon
                    v-if="granted"
                    name="vent:double-check"
                    size="1.1rem"
                    class="text-green-005"
                    :aria-label="`${columns[index]?.label} has ${row.label}`"
                  />
                  <span v-else class="text-dashboard-text-light" aria-label="Not granted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </AppCollapsableCard>
  </div>
</template>
