<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import {
  DEEP_LINK_STATUS_LABELS,
  DEEP_LINK_TYPE_LABELS,
  type DeepLinkStatusFilter,
  type DeepLinkTypeFilter,
  type IDeepLink,
} from "../composables/useDeepLinkStore";
import type { DeepLinkConfirmationAction } from "./DeepLinkConfirmationModal.vue";

interface NewModalController {
  open: () => void;
}

interface EditModalController {
  open: (deepLink: IDeepLink) => void;
}

interface ViewModalController {
  open: (deepLink: IDeepLink) => void;
}

interface ConfirmationModalController {
  open: (action: DeepLinkConfirmationAction, deepLink: IDeepLink) => void;
}

/** Template-ready table row derived from a deep link. */
interface DeepLinkRow extends IDeepLink {
  typeLabel: string;
  statusLabel: string;
  linkUrl: string;
  clicksLabel: string;
  createdLabel: string;
}

const {
  deepLinks,
  deepLinkStats,
  fetchingDeepLinks,
  deepLinksPage,
  deepLinksPerPage,
  deepLinksTotal,
  deepLinksSearch,
  deepLinksType,
  deepLinksStatus,
  fetchDeepLinks,
  setDeepLinksSearch,
  setDeepLinksType,
  setDeepLinksStatus,
} = useDeepLinkStore();

const newDeepLinkModal = ref<NewModalController | null>(null);
const editDeepLinkModal = ref<EditModalController | null>(null);
const viewDeepLinkModal = ref<ViewModalController | null>(null);
const confirmationModal = ref<ConfirmationModalController | null>(null);
const typeDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref(deepLinksSearch.value);
const hasLoaded = ref(false);
const loadFailed = ref(false);

const typeOptions: DeepLinkTypeFilter[] = ["all", "referral", "route", "link"];
const statusOptions: DeepLinkStatusFilter[] = ["all", "active", "inactive"];

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name", width: "14rem" },
  { id: "type", name: "Type", width: "7rem" },
  { id: "link_url", name: "Link", width: "18rem" },
  { id: "target", name: "Target", width: "18rem", isHiddenOnMobile: true },
  { id: "clicks_count", name: "Clicks", justify: "right", width: "6rem" },
  { id: "status", name: "Status", width: "7rem" },
  { id: "created_at", name: "Created", width: "8rem", isHiddenOnMobile: true },
  { id: "actions", name: "", justify: "right", width: "4rem" },
];

/** Summary cards shown above the deep-links table. */
const statCards = computed(() => [
  { label: "Total Links", value: deepLinkStats.value.total },
  { label: "Active", value: deepLinkStats.value.active },
  { label: "Inactive", value: deepLinkStats.value.inactive },
  { label: "Total Clicks", value: deepLinkStats.value.clicks },
]);

/** Formats a type filter option into its visible label. */
const getTypeFilterLabel = (filter: DeepLinkTypeFilter): string =>
  filter === "all" ? "All types" : DEEP_LINK_TYPE_LABELS[filter];

/** Formats a status filter option into its visible label. */
const getStatusFilterLabel = (filter: DeepLinkStatusFilter): string =>
  filter === "all" ? "All statuses" : DEEP_LINK_STATUS_LABELS[filter];

/** Maps API deep links to rows, preferring the API-provided `*_label` fields. */
const rows = computed<DeepLinkRow[]>(() =>
  deepLinks.value.map((deepLink) => ({
    ...deepLink,
    typeLabel:
      deepLink.type_label ||
      DEEP_LINK_TYPE_LABELS[deepLink.type] ||
      deepLink.type,
    statusLabel:
      deepLink.status_label ||
      DEEP_LINK_STATUS_LABELS[deepLink.status] ||
      deepLink.status,
    linkUrl: deepLink.link_url ?? "",
    clicksLabel: (deepLink.clicks_count ?? 0).toLocaleString("en-US"),
    createdLabel: deepLink.created_at
      ? DateFormatter.formatDate(deepLink.created_at)
      : "—",
  })),
);

/** Runs a list request and records whether it failed for the error state. */
const runListRequest = async (request: () => Promise<unknown>): Promise<void> => {
  loadFailed.value = false;
  try {
    await request();
  } catch {
    loadFailed.value = true;
  } finally {
    hasLoaded.value = true;
  }
};

/** Loads the current page of deep links. */
const loadDeepLinks = (): Promise<void> => runListRequest(() => fetchDeepLinks());

/** Applies a type filter, closes its menu, and reloads page 1. */
const selectType = (filter: DeepLinkTypeFilter): void => {
  typeDropdown.value?.closeDropdown();
  if (filter === deepLinksType.value) return;
  void runListRequest(() => setDeepLinksType(filter));
};

/** Applies a status filter, closes its menu, and reloads page 1. */
const selectStatus = (filter: DeepLinkStatusFilter): void => {
  statusDropdown.value?.closeDropdown();
  if (filter === deepLinksStatus.value) return;
  void runListRequest(() => setDeepLinksStatus(filter));
};

/** Sends the debounced search term to the API. */
const applySearch = useDebounceFn((term: string) => {
  void runListRequest(() => setDeepLinksSearch(term));
}, 300);

/** Loads the requested page of deep links. */
const changePage = (page: number): void => {
  void fetchDeepLinks(page).catch(() => undefined);
};

/** Opens a fresh creation dialog. */
const openNewDeepLinkModal = (): void => {
  newDeepLinkModal.value?.open();
};

/** Opens the selected record in the side-panel detail view. */
const openViewModal = (deepLink: IDeepLink): void => {
  viewDeepLinkModal.value?.open(deepLink);
};

/** Opens the selected record in the editor. */
const openEditModal = (deepLink: IDeepLink): void => {
  editDeepLinkModal.value?.open(deepLink);
};

/** Opens a status-toggle or deletion confirmation for one record. */
const openConfirmation = (
  action: DeepLinkConfirmationAction,
  deepLink: IDeepLink,
): void => {
  confirmationModal.value?.open(action, deepLink);
};

watch(searchInput, (term) => {
  if (term.trim() !== deepLinksSearch.value) void applySearch(term);
});

onMounted(() => {
  void loadDeepLinks();
});
</script>

<template>
  <DeepLinkListShimmer v-if="!hasLoaded" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading
      title="Deep Links"
      subtitle="Create Branch links for referrals, in-app routes and external URLs"
    />

    <section
      v-if="loadFailed"
      class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">We couldn't load deep links</h2>
      <p class="mt-2 max-w-md text-sm text-dashboard-text">
        Something went wrong while fetching the deep links list. Please try again.
      </p>
      <AppButton type="button" size="md" class="mt-5" @click="loadDeepLinks">
        Retry
      </AppButton>
    </section>

    <template v-else>
      <section
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Deep link summary"
      >
        <article
          v-for="card in statCards"
          :key="card.label"
          class="flex min-h-[104px] flex-col justify-between rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
        >
          <p class="text-xs font-normal text-dashboard-text">{{ card.label }}</p>
          <p class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading">
            {{ card.value.toLocaleString("en-US") }}
          </p>
        </article>
      </section>

      <TableComponent
        :headings="tableHeadings"
        :body="rows"
        :is-loading="fetchingDeepLinks"
        empty-heading="No deep links found"
        empty-subtitle="Try changing the search or filters, or create a new deep link."
      >
        <template #table-heading>
          <TableComponentHeader
            v-model:search="searchInput"
            table-name="Deep Links"
            search-placeholder="Search name, code or URL..."
          >
            <template #filters>
              <AppDropdown ref="typeDropdown" position="right" :width-is-finite="false">
                <template #default>
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                  >
                    {{ getTypeFilterLabel(deepLinksType) }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-40 space-y-1">
                    <button
                      v-for="option in typeOptions"
                      :key="option"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{ 'bg-dashboard-bg-dark': deepLinksType === option }"
                      @click="selectType(option)"
                    >
                      {{ getTypeFilterLabel(option) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>

              <AppDropdown ref="statusDropdown" position="right" :width-is-finite="false">
                <template #default>
                  <button
                    type="button"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border bg-dashboard-bg px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                  >
                    {{ getStatusFilterLabel(deepLinksStatus) }}
                    <Icon name="vent:arrow-down" size="0.9rem" />
                  </button>
                </template>
                <template #dropdown_body>
                  <div class="min-w-40 space-y-1">
                    <button
                      v-for="option in statusOptions"
                      :key="option"
                      type="button"
                      class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                      :class="{ 'bg-dashboard-bg-dark': deepLinksStatus === option }"
                      @click="selectStatus(option)"
                    >
                      {{ getStatusFilterLabel(option) }}
                    </button>
                  </div>
                </template>
              </AppDropdown>
            </template>

            <template #actions>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-color-005"
                @click="openNewDeepLinkModal"
              >
                New Deep Link
              </button>
            </template>
          </TableComponentHeader>
        </template>

        <template #col_name="{ rowData }">
          <span class="block truncate font-medium text-dashboard-heading" :title="rowData.name">
            {{ rowData.name }}
          </span>
          <span v-if="rowData.referral_code" class="block text-xs text-dashboard-text">
            {{ rowData.referral_code }}
          </span>
        </template>

        <template #col_type="{ rowData }">
          {{ rowData.typeLabel }}
        </template>

        <template #col_link_url="{ rowData }">
          <AppClipBoard
            v-if="rowData.linkUrl"
            :text="rowData.linkUrl"
            toast-title="Link Copied"
            toast-message="Deep link copied to clipboard successfully"
            class="justify-start text-dashboard-heading"
          >
            <span class="block max-w-64 truncate text-sm" :title="rowData.linkUrl">
              {{ rowData.linkUrl }}
            </span>
          </AppClipBoard>
          <span v-else class="text-dashboard-text">—</span>
        </template>

        <template #col_target="{ rowData }">
          <span class="block max-w-64 truncate text-sm" :title="rowData.target">
            {{ rowData.target || "—" }}
          </span>
        </template>

        <template #col_clicks_count="{ rowData }">
          {{ rowData.clicksLabel }}
        </template>

        <template #col_status="{ rowData }">
          <AppPills :color="rowData.status === 'active' ? 'green' : 'gray'">
            {{ rowData.statusLabel }}
          </AppPills>
        </template>

        <template #col_created_at="{ rowData }">
          {{ rowData.createdLabel }}
        </template>

        <template #col_actions="{ rowData }">
          <DeepLinkRowActions
            :deep-link="rowData as IDeepLink"
            @view="openViewModal"
            @edit="openEditModal"
            @toggle="openConfirmation('toggle', $event)"
            @delete="openConfirmation('delete', $event)"
          />
        </template>

        <template #table-footer>
          <TableComponentPagination
            :page="deepLinksPage"
            :per-page="deepLinksPerPage"
            :total-items="deepLinksTotal"
            @change-page="changePage"
          />
        </template>
      </TableComponent>
    </template>

    <DeepLinkNewModal ref="newDeepLinkModal" />
    <DeepLinkEditModal ref="editDeepLinkModal" />
    <DeepLinkViewSideModal ref="viewDeepLinkModal" @edit="openEditModal" />
    <DeepLinkConfirmationModal ref="confirmationModal" />
  </div>
</template>
