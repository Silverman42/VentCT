<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import {
  getDeepLinkTypeLabel,
  type DeepLink,
  useDeepLinkStore,
} from "../composables/useDeepLinkStore";
import type { DeepLinkConfirmationAction } from "./DeepLinkConfirmationModal.vue";

interface NewModalController {
  open: () => void;
}

interface EditModalController {
  open: (deepLink: DeepLink) => void;
}

interface ViewModalController {
  open: (id: string) => void;
}

interface ConfirmationModalController {
  open: (action: DeepLinkConfirmationAction, deepLink: DeepLink) => void;
}

const DEEP_LINKS_PER_PAGE = 10;

const route = useRoute();
const router = useRouter();
const {
  deepLinks,
  fetchingDeepLinks,
  fetchDeepLinks,
  regenerateDeepLink,
  deleteDeepLink,
} = useDeepLinkStore();

const newDeepLinkModal = ref<NewModalController | null>(null);
const editDeepLinkModal = ref<EditModalController | null>(null);
const viewDeepLinkModal = ref<ViewModalController | null>(null);
const confirmationModal = ref<ConfirmationModalController | null>(null);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name", width: "13rem" },
  { id: "type", name: "Type", width: "10rem" },
  { id: "provider", name: "Provider", width: "11rem", isHiddenOnMobile: true },
  { id: "target", name: "Target", width: "16rem" },
  { id: "generatedLink", name: "Link", width: "20rem" },
  { id: "clicks", name: "Clicks", justify: "right", width: "7rem" },
  { id: "status", name: "Status", width: "9rem" },
  { id: "actions", name: "", justify: "right", width: "4rem" },
];

/** Reads the first scalar string from a Nuxt query value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Converts valid deep-link list query values into local view state. */
const getRouteState = (): { search: string; page: number } => {
  const requestedPage = Number.parseInt(getQueryValue(route.query.page), 10);

  return {
    search: getQueryValue(route.query.search),
    page:
      Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
};

const initialRouteState = getRouteState();
const searchInput = ref(initialRouteState.search);
const currentPage = ref(initialRouteState.page);

/** Filters local records against every user-visible identifying field. */
const filteredDeepLinks = computed<DeepLink[]>(() => {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  if (!searchTerm) return deepLinks.value;

  return deepLinks.value.filter((deepLink) =>
    [
      deepLink.name,
      deepLink.type,
      deepLink.provider,
      deepLink.target,
      deepLink.generatedLink,
      deepLink.status,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(searchTerm),
  );
});

/** Derives the available local page count from the currently filtered records. */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredDeepLinks.value.length / DEEP_LINKS_PER_PAGE)),
);

/** Selects the current page slice for the shared responsive table. */
const pagedDeepLinks = computed(() => {
  const start = (currentPage.value - 1) * DEEP_LINKS_PER_PAGE;
  return filteredDeepLinks.value.slice(start, start + DEEP_LINKS_PER_PAGE);
});

/** Computes the summary cards directly from the latest fixture state. */
const summaryMetrics = computed(() => [
  { label: "Total Links", value: deepLinks.value.length },
  {
    label: "Active",
    value: deepLinks.value.filter((deepLink) => deepLink.status === "active").length,
  },
  {
    label: "Total Clicks",
    value: deepLinks.value.reduce((total, deepLink) => total + deepLink.clicks, 0),
  },
]);

/** Synchronizes visible list controls to compact, shareable route query values. */
const syncRouteState = (): void => {
  const nextQuery: Record<string, string> = {};
  if (searchInput.value.trim()) nextQuery.search = searchInput.value.trim();
  if (currentPage.value > 1) nextQuery.page = String(currentPage.value);

  const currentQuery = {
    search: getQueryValue(route.query.search),
    page: getQueryValue(route.query.page),
  };

  if (
    currentQuery.search === (nextQuery.search ?? "") &&
    currentQuery.page === (nextQuery.page ?? "")
  ) {
    return;
  }

  void router.replace({ path: route.path, query: nextQuery });
};

/** Defers route replacement while a user continues typing in search. */
const syncDebouncedSearch = useDebounceFn(syncRouteState, 300);

/** Applies browser navigation changes back into local search and page controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  searchInput.value = nextState.search;
  currentPage.value = nextState.page;
  isApplyingRoute.value = false;
};

/** Opens a fresh multi-step creation dialog. */
const openNewDeepLinkModal = (): void => {
  newDeepLinkModal.value?.open();
};

/** Opens the selected record in its configured side-panel detail view. */
const openViewModal = (deepLink: DeepLink): void => {
  viewDeepLinkModal.value?.open(deepLink.id);
};

/** Opens the selected record in the modal editor. */
const openEditModal = (deepLink: DeepLink): void => {
  editDeepLinkModal.value?.open(deepLink);
};

/** Opens a configured regeneration or deletion confirmation flow. */
const openConfirmation = (
  action: DeepLinkConfirmationAction,
  deepLink: DeepLink,
): void => {
  confirmationModal.value?.open(action, deepLink);
};

/** Performs the confirmed local mutation and reports its result to the user. */
const handleConfirmedAction = async (
  action: DeepLinkConfirmationAction,
  deepLink: DeepLink,
): Promise<void> => {
  if (action === "regenerate") {
    await regenerateDeepLink(deepLink.id);
    useToastHandler().triggerToast(
      "A new generated URL is ready to copy and share.",
      "success",
      "Link regenerated",
      "large",
    );
    return;
  }

  const wasDeleted = await deleteDeepLink(deepLink.id);
  if (wasDeleted) {
    useToastHandler().triggerToast(
      "The deep link was deleted from this session.",
      "success",
      "Deep link deleted",
      "large",
    );
  }
};

/** Returns the reusable pill tone associated with a deep-link type. */
const getTypePillColor = (deepLink: DeepLink): "blue" | "orange" | "gray" => {
  if (deepLink.type === "route") return "blue";
  if (deepLink.type === "referral") return "orange";
  return "gray";
};

/** Shortens a generated URL for the dense table presentation without losing copy access. */
const getCompactLink = (generatedLink: string): string => {
  if (generatedLink.length <= 30) return generatedLink;
  return `${generatedLink.slice(0, 28)}…`;
};

watch(
  searchInput,
  () => {
    if (isApplyingRoute.value) return;
    currentPage.value = 1;
    syncDebouncedSearch();
  },
  { flush: "sync" },
);

watch(
  currentPage,
  () => {
    if (!isApplyingRoute.value) syncRouteState();
  },
  { flush: "sync" },
);

watch(
  () => route.query,
  () => applyRouteState(),
  { deep: true },
);

watch(
  totalPages,
  (lastPage) => {
    if (currentPage.value > lastPage) currentPage.value = lastPage;
  },
  { immediate: true },
);

onMounted(() => {
  void fetchDeepLinks();
});
</script>

<template>
  <DeepLinkListShimmer v-if="fetchingDeepLinks" />

  <div v-else class="flex w-full flex-col gap-6">
    <AppHeading
      title="Deep Link"
      subtitle="Generate shareable links that open users directly to targeted in-app content"
    />

    <section class="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Deep link summary metrics">
      <article
        v-for="metric in summaryMetrics"
        :key="metric.label"
        class="flex min-h-[116px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading">{{ metric.value }}</p>
      </article>
    </section>

    <TableComponent
      :headings="tableHeadings"
      :body="pagedDeepLinks"
      empty-heading="No deep links found"
      empty-subtitle="Try changing the search text or create a new deep link."
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Deep Link"
          search-placeholder="Search ..."
        >
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

      <template #col_type="{ rowData }">
        <AppPills :color="getTypePillColor(rowData as DeepLink)">
          {{ getDeepLinkTypeLabel((rowData as DeepLink).type) }}
        </AppPills>
      </template>

      <template #col_target="{ rowData }">
        <span class="block max-w-56 truncate" :title="(rowData as DeepLink).target">
          {{ (rowData as DeepLink).target }}
        </span>
      </template>

      <template #col_generatedLink="{ rowData }">
        <AppClipBoard
          :text="(rowData as DeepLink).generatedLink"
          toast-title="Link Copied"
          toast-message="Deep link copied to clipboard successfully"
          class="justify-start text-dashboard-heading"
        >
          <span class="truncate text-sm" :title="(rowData as DeepLink).generatedLink">
            {{ getCompactLink((rowData as DeepLink).generatedLink) }}
          </span>
        </AppClipBoard>
      </template>

      <template #col_clicks="{ rowData }">
        {{ (rowData as DeepLink).clicks.toLocaleString() }}
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="(rowData as DeepLink).status === 'active' ? 'green' : 'gray'">
          {{ (rowData as DeepLink).status === 'active' ? 'Active' : 'Inactive' }}
        </AppPills>
      </template>

      <template #col_actions="{ rowData }">
        <DeepLinkRowActions
          :deep-link="rowData as DeepLink"
          @view="openViewModal"
          @edit="openEditModal"
          @regenerate="openConfirmation('regenerate', $event)"
          @delete="openConfirmation('delete', $event)"
        />
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="currentPage"
          :per-page="DEEP_LINKS_PER_PAGE"
          :total-items="filteredDeepLinks.length"
          @change-page="currentPage = $event"
        />
      </template>
    </TableComponent>

    <DeepLinkNewModal ref="newDeepLinkModal" />
    <DeepLinkEditModal ref="editDeepLinkModal" />
    <DeepLinkViewSideModal ref="viewDeepLinkModal" />
    <DeepLinkConfirmationModal ref="confirmationModal" @confirm="handleConfirmedAction" />
  </div>
</template>
