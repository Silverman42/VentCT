<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { ITableBodyData, ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type { IAdmin } from "../composables/useAdminMockData";

interface ModalController {
  open: () => Promise<void> | void;
}

const ADMINS_PER_PAGE = 10;

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const createAdminModal = ref<ModalController | null>(null);
const searchInput = ref("");
const currentPage = ref(1);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "email", name: "Email" },
  { id: "dateCreated", name: "Date Created" },
  { id: "dateUpdated", name: "Date Updated" },
  { id: "actions", name: "", width: "3rem" },
];

/** Debounces search text updates for smooth filtering. */
const updateSearch = useDebounceFn((value: string) => {
  searchInput.value = value;
  currentPage.value = 1;
}, 300);

/** Filters admin users by search text across name and email fields. */
const filteredAdmins = computed(() => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return adminStore.admins.value;

  return adminStore.admins.value.filter(
    (admin: IAdmin) =>
      admin.name.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      admin.role.toLowerCase().includes(term),
  );
});

/** Calculates total pagination pages. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAdmins.value.length / ADMINS_PER_PAGE)),
);

/** Selects the active page slice of admin records. */
const pagedAdmins = computed(() => {
  const start = (currentPage.value - 1) * ADMINS_PER_PAGE;
  return filteredAdmins.value.slice(start, start + ADMINS_PER_PAGE);
});

/** Navigates to single admin profile page. */
const openAdminDetail = (row: ITableBodyData): void => {
  const admin = row as IAdmin;
  void navigateTo(`/admins/${admin.id}`);
};

/** Opens the new admin side modal creation form. */
const openNewAdminModal = (): void => {
  void createAdminModal.value?.open();
};

watch(
  totalPages,
  (lastPage) => {
    if (currentPage.value > lastPage) currentPage.value = lastPage;
  },
  { immediate: true },
);
</script>

<template>
  <AdminListShimmer v-if="adminStore.fetchingAdmins.value" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading title="Admin" subtitle="Manage users, role and permission." />

    <TableComponent
      :headings="tableHeadings"
      :body="pagedAdmins"
      clickable
      empty-heading="No admins found"
      empty-subtitle="Try changing your search terms or invite a new admin."
      @row-click="openAdminDetail"
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Admin"
          search-placeholder="Search ..."
        >
          <template #actions>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
              aria-label="Invite new admin"
              @click="openNewAdminModal"
            >
              New Admin
            </button>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_actions>
        <div class="flex items-center justify-end">
          <Icon name="vent:arrow-right" size="1rem" class="text-dashboard-text group-hover:text-brand-color-default transition" />
        </div>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="ADMINS_PER_PAGE"
          :total-items="filteredAdmins.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <AdminCreateModal ref="createAdminModal" />
  </div>
</template>
