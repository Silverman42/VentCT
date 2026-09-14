<script setup lang="ts">
import type { TabsData } from "~/utils/types/misc/Tabs";
import type { IAdminDetails } from "../composables/useAdminMockData";

interface ModalController {
  open: () => Promise<void> | void;
}

const props = defineProps<{
  adminId: string;
}>();

const adminStore = useAdminStore();
const editAdminModal = ref<ModalController | null>(null);
const adminDetails = ref<IAdminDetails | null>(null);

const tabList: TabsData[] = [
  { id: "permissions", name: "Admin permission" },
  { id: "activity", name: "Recent Activity" },
];

/** Loads single admin profile details on mount or ID change. */
const loadAdmin = async (): Promise<void> => {
  const details = await adminStore.fetchAdminDetails(props.adminId);
  adminDetails.value = details;
};

/** Opens the edit modal form prefilled with current admin details. */
const openEditModal = (): void => {
  void editAdminModal.value?.open();
};

/** Handles deleting the current admin and returning to admins list. */
const handleDeleteAdmin = async (): Promise<void> => {
  if (!adminDetails.value) return;
  const confirmed = confirm(
    `Are you sure you want to remove ${adminDetails.value.admin.name}?`,
  );
  if (confirmed) {
    await adminStore.deleteAdmin(adminDetails.value.admin.id);
    void navigateTo("/admins");
  }
};

watch(
  () => props.adminId,
  () => {
    void loadAdmin();
  },
  { immediate: true },
);
</script>

<template>
  <AdminDetailShimmer v-if="adminStore.fetchingAdminDetails.value" />

  <div v-else-if="adminDetails" class="flex w-full flex-col gap-6">
    <section
      class="flex flex-col gap-4 border-b border-dashboard-card-border pb-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-4">
        <img
          :src="
            adminDetails.admin.avatar ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          "
          :alt="`${adminDetails.admin.name} profile photo`"
          class="h-16 w-16 md:h-20 md:w-20 rounded-full border border-dashboard-card-border object-cover shrink-0"
        />
        <div class="space-y-1">
          <h2 class="text-xl md:text-2xl font-medium tracking-tight text-dashboard-heading">
            {{ adminDetails.admin.name }}
          </h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dashboard-text">
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:direct-inbox" size="0.95rem" />
              {{ adminDetails.admin.email }}
            </span>
            <span v-if="adminDetails.admin.joinedDate" class="inline-flex items-center gap-1.5">
              <Icon name="vent:calendar" size="0.95rem" />
              Joined {{ adminDetails.admin.joinedDate }}
            </span>
            <span v-if="adminDetails.admin.lastLogin" class="inline-flex items-center gap-1.5">
              <Icon name="vent:timer-2" size="0.95rem" />
              Last login {{ adminDetails.admin.lastLogin }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashboard-card-border text-dashboard-text transition hover:border-brand-color-default hover:text-brand-color-default"
          aria-label="Edit admin profile"
          @click="openEditModal"
        >
          <Icon name="vent:edit" size="1rem" />
        </button>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashboard-card-border text-red-400 transition hover:border-red-400"
          aria-label="Delete admin profile"
          @click="handleDeleteAdmin"
        >
          <Icon name="vent:trash" size="1rem" />
        </button>
      </div>
    </section>

    <!-- Tabs Container -->
    <AppTab :tab-list="tabList" default-tab-id="permissions">
      <!-- Tab 1: Permissions -->
      <template #permissions>
        <div class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg">
          <div class="px-5 py-4 border-b border-dashboard-card-border font-medium text-base text-dashboard-heading">
            Admin permission
          </div>

          <div class="divide-y divide-dashboard-card-border">
            <div class="grid grid-cols-12 px-5 py-3 text-xs font-medium text-dashboard-text bg-dashboard-bg-dark">
              <div class="col-span-6">Module</div>
              <div class="col-span-3 text-center">View</div>
              <div class="col-span-3 text-center">Edit</div>
            </div>

            <div
              v-for="perm in adminDetails.permissions"
              :key="perm.id"
              class="grid grid-cols-12 items-center px-5 py-3.5 text-xs md:text-sm hover:bg-dashboard-bg-dark/20 transition"
            >
              <div class="col-span-6 font-medium text-dashboard-heading">
                {{ perm.module }}
              </div>

              <div class="col-span-3 flex justify-center">
                <Icon
                  v-if="perm.view"
                  name="vent:checked"
                  size="1.25rem"
                  class="text-emerald-500"
                />
                <Icon
                  v-else
                  name="vent:close"
                  size="1.1rem"
                  class="text-red-500"
                />
              </div>

              <div class="col-span-3 flex justify-center">
                <Icon
                  v-if="perm.edit"
                  name="vent:checked"
                  size="1.25rem"
                  class="text-emerald-500"
                />
                <Icon
                  v-else
                  name="vent:close"
                  size="1.1rem"
                  class="text-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab 2: Recent Activity -->
      <template #activity>
        <div class="overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6">
          <h3 class="font-medium text-base text-dashboard-heading mb-4">
            Recent Activity
          </h3>

          <div class="space-y-4">
            <div
              v-for="activity in adminDetails.recentActivities"
              :key="activity.id"
              class="border-b border-dashboard-card-border pb-3 last:border-b-0 last:pb-0"
            >
              <p class="text-sm font-medium text-dashboard-heading">
                {{ activity.title }}
              </p>
              <p class="text-xs text-dashboard-text mt-1">
                {{ activity.timestamp }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </AppTab>

    <AdminEditModal
      ref="editAdminModal"
      :admin="adminDetails.admin"
      :permissions="adminDetails.permissions"
    />
  </div>

  <section
    v-else
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
    <h1 class="mt-4 text-xl font-medium text-dashboard-heading">
      Admin user not found
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      This admin user does not exist in the current fixture data.
    </p>
    <NuxtLink
      to="/admins"
      class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
    >
      Return to admins list
    </NuxtLink>
  </section>
</template>
