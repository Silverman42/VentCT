<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { AppDropdown } from "#components";
import type { ITableHeaderData } from "~/utils/types/misc/TableComponent";
import type {
  PromoterAudienceFilter,
  PromoterDetailTab,
  PromoterPeriod,
} from "../composables/usePromoterMockData";

interface ModalController {
  open: () => Promise<void> | void;
  close: () => void;
}

const props = defineProps<{
  promoterId: string;
}>();

const { getPromoterDetails, campaignOptions } = usePromoterMockData();
const route = useRoute();
const router = useRouter();
const editPromoterModal = ref<ModalController | null>(null);
const audienceDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref("");
const audienceSearch = ref("");
const audienceFilter = ref<PromoterAudienceFilter>("all");
const audiencePage = ref(1);
const isApplyingRoute = ref(false);

const tableHeadings: ITableHeaderData[] = [
  { id: "name", name: "Name" },
  { id: "campaign", name: "Campaign", width: "25%", isHiddenOnMobile: true },
  { id: "email", name: "Email", width: "20%", isHiddenOnMobile: true },
  { id: "phone", name: "Phone", width: "16%", isHiddenOnMobile: true },
  { id: "transaction", name: "Transaction", width: "12%" },
  { id: "status", name: "Status", width: "14%" },
];

const periodOptions: Array<{ label: string; value: PromoterPeriod }> = [
  { label: "1D", value: "1d" },
  { label: "7D", value: "7d" },
  { label: "2W", value: "2w" },
  { label: "1M", value: "1m" },
];

/** Reads one scalar value from a Nuxt query-string value. */
const getQueryValue = (
  value: string | null | Array<string | null> | undefined,
): string => {
  const scalarValue = Array.isArray(value)
    ? value.find((item): item is string => typeof item === "string")
    : value;

  return typeof scalarValue === "string" ? scalarValue : "";
};

/** Identifies a supported detail dashboard tab from a query-string value. */
const isPromoterDetailTab = (value: string): value is PromoterDetailTab =>
  value === "transactions" || value === "audiences";

/** Identifies a supported reporting period from a query-string value. */
const isPromoterPeriod = (value: string): value is PromoterPeriod =>
  periodOptions.some((period) => period.value === value);

/** Normalizes the visible tab and period controls from the current route. */
const getRouteState = (): {
  tab: PromoterDetailTab;
  period: PromoterPeriod;
} => {
  const requestedTab = getQueryValue(route.query.tab);
  const requestedPeriod = getQueryValue(route.query.period);

  return {
    tab: isPromoterDetailTab(requestedTab) ? requestedTab : "transactions",
    period: isPromoterPeriod(requestedPeriod) ? requestedPeriod : "7d",
  };
};

const initialRouteState = getRouteState();
const activeTab = ref<PromoterDetailTab>(initialRouteState.tab);
const activePeriod = ref<PromoterPeriod>(initialRouteState.period);

/** Resolves profile fixtures and makes a missing promoter explicit to the template. */
const promoterDetails = computed(() => getPromoterDetails(props.promoterId));

/** Supplies a null-safe profile view model for the loaded detail template. */
const profile = computed(() => {
  const details = promoterDetails.value;
  if (!details) return null;

  return {
    ...details.promoter,
    referralCode: details.promoter.referralCode || "—",
    appLink: details.referral.appLink,
    webLink: details.referral.webLink,
  };
});

/** Chooses the screenshot-matched metric set for the active dashboard tab. */
const activeMetrics = computed(() => {
  const details = promoterDetails.value;
  if (!details) return [];

  return activeTab.value === "transactions"
    ? details.transactionMetrics
    : details.audienceMetrics;
});

/** Limits the audience view to five rows and the transactions view to ten. */
const tablePageSize = computed(() =>
  activeTab.value === "audiences" ? 5 : 10,
);

/** Returns filter options appropriate to the active tab's primary metric. */
const audienceFilterOptions = computed<
  Array<{ value: PromoterAudienceFilter; label: string }>
>(() => {
  if (activeTab.value === "transactions") {
    return [
      { value: "all", label: "All" },
      { value: "with-transaction", label: "With transaction" },
      { value: "without-transaction", label: "Without transaction" },
    ];
  }

  return [
    { value: "all", label: "All" },
    { value: "verified", label: "Verified" },
    { value: "not-verified", label: "Not verified" },
  ];
});

/** Debounces table searching until the user pauses typing. */
const updateAudienceSearch = useDebounceFn((value: string) => {
  audienceSearch.value = value;
  audiencePage.value = 1;
}, 300);

/** Filters referred audience records with the active search and tab-specific filter. */
const filteredAudience = computed(() => {
  const details = promoterDetails.value;
  if (!details) return [];

  const searchTerm = audienceSearch.value.trim().toLocaleLowerCase();

  return details.audience.filter((member) => {
    const matchesSearch =
      !searchTerm ||
      [member.name, member.campaign, member.email, member.phone]
        .join(" ")
        .toLocaleLowerCase()
        .includes(searchTerm);
    const matchesFilter =
      audienceFilter.value === "all" ||
      (audienceFilter.value === "verified" && member.isVerified) ||
      (audienceFilter.value === "not-verified" && !member.isVerified) ||
      (audienceFilter.value === "with-transaction" && member.hasTransaction) ||
      (audienceFilter.value === "without-transaction" &&
        !member.hasTransaction);

    return matchesSearch && matchesFilter;
  });
});

/** Calculates the final valid audience table page after a search or filter change. */
const audienceLastPage = computed(() =>
  Math.max(1, Math.ceil(filteredAudience.value.length / tablePageSize.value)),
);

/** Selects the audience rows visible on the current page. */
const pagedAudience = computed(() => {
  const start = (audiencePage.value - 1) * tablePageSize.value;
  return filteredAudience.value.slice(start, start + tablePageSize.value);
});

/** Keeps the current tab and period URL compact while preserving defaults implicitly. */
const syncRouteState = (): void => {
  const nextQuery: Record<string, string> = {};
  if (activeTab.value !== "transactions") nextQuery.tab = activeTab.value;
  if (activePeriod.value !== "7d") nextQuery.period = activePeriod.value;

  const currentQuery = {
    tab: getQueryValue(route.query.tab),
    period: getQueryValue(route.query.period),
  };

  if (
    currentQuery.tab === (nextQuery.tab ?? "") &&
    currentQuery.period === (nextQuery.period ?? "")
  ) {
    return;
  }

  void router.replace({ path: route.path, query: nextQuery });
};

/** Applies browser-navigation query changes to the tab and period controls. */
const applyRouteState = (): void => {
  const nextState = getRouteState();
  isApplyingRoute.value = true;
  activeTab.value = nextState.tab;
  activePeriod.value = nextState.period;
  isApplyingRoute.value = false;
};

/** Selects a dashboard tab, resets table state, and persists the choice to the route. */
const selectTab = (tab: PromoterDetailTab): void => {
  activeTab.value = tab;
  audienceFilter.value = "all";
  audiencePage.value = 1;
};

/** Selects an audience filter and closes the associated dropdown menu. */
const selectAudienceFilter = (filter: PromoterAudienceFilter): void => {
  audienceFilter.value = filter;
  audiencePage.value = 1;
  audienceDropdown.value?.closeDropdown();
};

/** Opens the current fixture profile in the validation-only edit form. */
const openEditPromoterModal = (): void => {
  void editPromoterModal.value?.open();
};

watch(searchInput, (value) => updateAudienceSearch(value));

watch(
  [activeTab, activePeriod],
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
  [tablePageSize, audienceLastPage],
  ([, lastPage]) => {
    if (audiencePage.value > lastPage) audiencePage.value = lastPage;
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="profile && promoterDetails"
    class="flex min-w-0 w-full flex-col gap-6 pt-5"
  >
    <section
      class="flex flex-col gap-4 border-b border-dashboard-card-border pb-6 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex min-w-0 items-center gap-4">
        <img
          :src="profile.avatar"
          :alt="`${profile.profileName} profile photo`"
          class="h-22 w-22 shrink-0 rounded-full border border-dashboard-card-border object-cover"
        />
        <div class="min-w-0">
          <h2
            class="truncate text-xl font-medium tracking-tight text-dashboard-heading"
          >
            {{ profile.profileName }}
          </h2>
          <p class="mt-1 text-sm text-dashboard-text">{{ profile.campaign }}</p>
          <div
            class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-dashboard-text"
          >
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:direct-inbox" size="0.95rem" />
              {{ profile.email }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:call" size="0.95rem" />
              {{ profile.phone }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="vent:calendar" size="0.95rem" />
              Joined {{ profile.joinedDate }}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex h-10 w-auto shrink-0 items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-4 text-dashboard-text transition hover:border-brand-color-default hover:text-brand-color-default"
        aria-label="Edit promoter profile"
        @click="openEditPromoterModal"
      >
        <Icon name="vent:profile-add" size="1.1rem" />
        <span class="text-sm">Edit</span>
      </button>
    </section>

    <section
      class="grid grid-cols-1 gap-5 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.5fr)]"
    >
      <div class="flex items-start flex-col">
        <p class="text-sm text-dashboard-text">Referral Code</p>
        <AppClipBoard :text="profile.referralCode" icon-size="1rem">
          <span class="text-sm font-medium text-dashboard-heading">{{
            profile.referralCode
          }}</span>
        </AppClipBoard>
      </div>
      <div class="min-w-0 flex items-start flex-col">
        <p class="text-sm text-dashboard-text">App Referral Link</p>
        <AppClipBoard :text="profile.appLink" icon-size="1rem">
          <span class="truncate text-sm text-dashboard-heading">{{
            profile.appLink
          }}</span>
        </AppClipBoard>
      </div>
      <div class="min-w-0 flex items-start flex-col">
        <p class="text-sm text-dashboard-text">Web Referral Link</p>
        <AppClipBoard :text="profile.webLink" icon-size="1rem">
          <span class="truncate text-sm text-dashboard-heading">{{
            profile.webLink
          }}</span>
        </AppClipBoard>
      </div>
    </section>

    <section class="border-b border-dashboard-card-border pb-4">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div
          class="inline-flex w-fit items-center rounded-xl bg-dashboard-bg-dark p-1"
          role="tablist"
          aria-label="Promoter dashboard"
        >
          <button
            v-for="tab in [
              { value: 'transactions', label: 'Transactions' },
              { value: 'audiences', label: 'Audiences' },
            ] as const"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.value"
            class="rounded-lg px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-color-default/40"
            :class="
              activeTab === tab.value
                ? 'bg-dashboard-bg font-medium text-dashboard-heading shadow-sm'
                : 'text-dashboard-text hover:text-dashboard-heading'
            "
            @click="selectTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
        <AppPeriodSelector
          v-model="activePeriod"
          aria-label="Promoter reporting period"
          :options="periodOptions"
        />
      </div>
    </section>

    <section
      class="grid grid-cols-1 gap-3"
      :class="
        activeTab === 'transactions'
          ? 'sm:grid-cols-2 xl:grid-cols-6'
          : 'sm:grid-cols-2 xl:grid-cols-4'
      "
      aria-label="Promoter summary metrics"
    >
      <article
        v-for="metric in activeMetrics"
        :key="metric.label"
        class="flex min-h-[124px] flex-col rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5"
      >
        <p class="text-xs text-dashboard-text">{{ metric.label }}</p>
        <p
          class="mt-2 text-2xl font-medium tracking-tight text-dashboard-heading"
        >
          {{ metric.value }}
        </p>
        <p class="mt-auto pt-3 text-[0.6875rem] text-dashboard-text">
          {{ metric.description }}
        </p>
      </article>
    </section>

    <TableComponent
      :headings="tableHeadings"
      :body="pagedAudience"
      empty-heading="No referred audience found"
      empty-subtitle="Try changing the search text or active filter."
    >
      <template #table-heading>
        <TableComponentHeader
          v-model:search="searchInput"
          table-name="Referred Audience"
          search-placeholder="Search..."
        >
          <template #filters>
            <AppDropdown
              ref="audienceDropdown"
              position="right"
              :width-is-finite="false"
            >
              <template #default>
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashboard-card-border px-3 py-2.5 text-sm text-dashboard-heading transition hover:border-brand-color-default sm:w-auto"
                >
                  Filter by:
                  {{
                    audienceFilterOptions.find(
                      (option) => option.value === audienceFilter,
                    )?.label ?? "All"
                  }}
                  <Icon name="vent:arrow-down" size="0.9rem" />
                </button>
              </template>
              <template #dropdown_body>
                <div class="min-w-44 space-y-1">
                  <button
                    v-for="option in audienceFilterOptions"
                    :key="option.value"
                    type="button"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': audienceFilter === option.value,
                    }"
                    @click="selectAudienceFilter(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </template>
        </TableComponentHeader>
      </template>

      <template #col_transaction="{ rowData }">
        <AppPills
          :color="rowData.hasTransaction ? 'green' : 'red'"
          class="text-xs"
        >
          {{ rowData.hasTransaction ? "Yes" : "No" }}
        </AppPills>
      </template>

      <template #col_status="{ rowData }">
        <AppPills :color="rowData.isVerified ? 'green' : 'red'" class="text-xs">
          {{ rowData.isVerified ? "Verified" : "Not verified" }}
        </AppPills>
      </template>

      <template #table-footer>
        <TableComponentPagination
          :page="audiencePage"
          :per-page="tablePageSize"
          :total-items="filteredAudience.length"
          @change-page="audiencePage = $event"
        />
      </template>
    </TableComponent>

    <PromoterEditModal
      ref="editPromoterModal"
      :promoter="promoterDetails.promoter"
      :campaign-options="campaignOptions"
    />
  </div>

  <section
    v-else
    class="flex min-h-[24rem] flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-6 text-center"
  >
    <Icon name="vent:box-search" size="2.5rem" class="text-dashboard-text" />
    <h1 class="mt-4 text-xl font-medium text-dashboard-heading">
      Promoter not found
    </h1>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      This promoter does not exist in the current fixture data.
    </p>
    <NuxtLink
      to="/promoters"
      class="mt-5 rounded-lg bg-brand-color-default px-4 py-2.5 text-sm text-white transition hover:bg-brand-color-005"
    >
      Return to promoters
    </NuxtLink>
  </section>
</template>
