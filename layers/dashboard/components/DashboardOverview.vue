<script setup lang="ts">
/** Dashboard sections that load independently and can fail on their own. */
type DashboardSection =
  | "overview"
  | "topPromoters"
  | "verification"
  | "volume"
  | "funnel"
  | "campaigns"
  | "leaderboard";

interface DigestModalController {
  open: () => void;
}

const { isAuthenticated } = useAuthStore();
const {
  filters,
  verificationPeriod,
  volumePeriod,
  overview,
  topPromoters,
  verificationSeries,
  volumeSeries,
  conversionFunnel,
  campaignPerformance,
  promoterLeaderboard,
  fetchingOverview,
  fetchingTopPromoters,
  fetchingVerificationSeries,
  fetchingVolumeSeries,
  fetchingConversionFunnel,
  fetchingCampaignPerformance,
  fetchingPromoterLeaderboard,
  canViewBasic,
  canViewAdvanced,
  fetchOverview,
  fetchTopPromoters,
  fetchVerificationTradeSeries,
  fetchTransactionVolumeSeries,
  fetchConversionFunnel,
  fetchCampaignPerformance,
  fetchPromoterLeaderboard,
  fetchCountries,
} = useDashboardStore();

const digestModal = ref<DigestModalController | null>(null);

const failed = reactive<Record<DashboardSection, boolean>>({
  overview: false,
  topPromoters: false,
  verification: false,
  volume: false,
  funnel: false,
  campaigns: false,
  leaderboard: false,
});

/** Requests behind each section; filters and periods are read from the store. */
const sectionRequests: Record<DashboardSection, () => Promise<unknown>> = {
  overview: () => fetchOverview(),
  topPromoters: () => fetchTopPromoters(),
  verification: () => fetchVerificationTradeSeries(),
  volume: () => fetchTransactionVolumeSeries(),
  funnel: () => fetchConversionFunnel(),
  campaigns: () => fetchCampaignPerformance(),
  leaderboard: () => fetchPromoterLeaderboard(),
};

/** Runs one section's request and records whether it failed. */
const loadSection = async (section: DashboardSection): Promise<void> => {
  failed[section] = false;
  try {
    await sectionRequests[section]();
  } catch {
    failed[section] = true;
  }
};

/**
 * Reloads the sections that depend on the filters. Overview and funnel ignore
 * the country, so they are skipped when only the country changed.
 */
const loadFilteredSections = (countryOnly = false): void => {
  if (canViewBasic.value) {
    if (!countryOnly) void loadSection("overview");
    void loadSection("topPromoters");
    void loadSection("verification");
    void loadSection("volume");
  }
  if (canViewAdvanced.value && !countryOnly) void loadSection("funnel");
};

/** Serialises the date part of the filters to detect country-only changes. */
const dateWindowKey = computed(
  () =>
    `${filters.value.timeframe}|${filters.value.startDate ?? ""}|${filters.value.endDate ?? ""}`,
);

/** Loads the sections that ignore the filters, plus the country list. */
const loadStaticSections = (): void => {
  if (canViewBasic.value) fetchCountries().catch(() => {});
  if (canViewAdvanced.value) {
    void loadSection("campaigns");
    void loadSection("leaderboard");
  }
};

/** True until the signed-in user (and so their permissions) has loaded. */
const isResolvingUser = computed(() => !isAuthenticated.value);

/** Whether the user can see any dashboard analytics at all. */
const hasAnyAccess = computed(() => canViewBasic.value || canViewAdvanced.value);

/** Shows a section's shimmer on first load, before any data or error exists. */
const isFirstLoad = (loading: boolean, data: unknown, section: DashboardSection) =>
  isResolvingUser.value || (loading && !data && !failed[section]);

/** Opens the weekly digest dialog. */
const openDigestModal = (): void => {
  digestModal.value?.open();
};

watch(
  [dateWindowKey, () => filters.value.countryCode],
  ([windowKey], [previousWindowKey]) =>
    loadFilteredSections(windowKey === previousWindowKey),
);
watch(verificationPeriod, () => void loadSection("verification"));
watch(volumePeriod, () => void loadSection("volume"));

onMounted(() => {
  // The layout fetches the user after this page mounts, so wait for it.
  const stop = watch(
    isAuthenticated,
    (ready) => {
      if (!ready) return;
      queueMicrotask(() => stop());
      loadFilteredSections();
      loadStaticSections();
    },
    { immediate: true },
  );
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <AppHeading title="Dashboard" subtitle="Conversion Funnel" />
      <AppButton
        v-if="canViewAdvanced"
        type="button"
        size="sm"
        color="neutral"
        outlined
        class="!px-4 !py-2"
        @click="openDigestModal"
      >
        <Icon name="vent:send" size="1rem" aria-hidden="true" />
        Send weekly digest
      </AppButton>
    </div>

    <AppEmptyState
      v-if="!isResolvingUser && !hasAnyAccess"
      heading="You don't have access to dashboard analytics"
      empty-table-subtitle="Ask an administrator for the dashboard.basic.view permission."
      height="50vh"
    />

    <template v-else>
      <DashboardFilters v-if="isResolvingUser || canViewBasic" />

      <template v-if="isResolvingUser || canViewBasic">
        <DashboardStatsGridShimmer
          v-if="isFirstLoad(fetchingOverview, overview, 'overview')"
        />
        <AppErrorState
          v-else-if="failed.overview"
          heading="We couldn't load the overview"
          description="Check your connection and try again."
          :retrying="fetchingOverview"
          @retry="loadSection('overview')"
        />
        <DashboardStatsGrid
          v-else-if="overview"
          :overview="overview"
          class="transition-opacity"
          :class="{ 'opacity-60': fetchingOverview }"
        />

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <TopPromotersByVolumeCardShimmer
            v-if="isFirstLoad(fetchingTopPromoters, topPromoters, 'topPromoters')"
            class="xl:col-span-5"
          />
          <TopPromotersByVolumeCard
            v-else
            class="xl:col-span-5"
            :data="topPromoters"
            :loading="fetchingTopPromoters"
            :failed="failed.topPromoters"
            @retry="loadSection('topPromoters')"
          />

          <VerificationTradePerformanceCardShimmer
            v-if="isFirstLoad(fetchingVerificationSeries, verificationSeries, 'verification')"
            class="xl:col-span-7"
          />
          <VerificationTradePerformanceCard
            v-else
            v-model:period="verificationPeriod"
            class="xl:col-span-7"
            :data="verificationSeries"
            :loading="fetchingVerificationSeries"
            :failed="failed.verification"
            @retry="loadSection('verification')"
          />
        </div>

        <TransactionVolumeAndCountCardShimmer
          v-if="isFirstLoad(fetchingVolumeSeries, volumeSeries, 'volume')"
        />
        <TransactionVolumeAndCountCard
          v-else
          v-model:period="volumePeriod"
          :data="volumeSeries"
          :loading="fetchingVolumeSeries"
          :failed="failed.volume"
          @retry="loadSection('volume')"
        />
      </template>

      <template v-if="!isResolvingUser && canViewAdvanced">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <DashboardConversionFunnelShimmer
            v-if="isFirstLoad(fetchingConversionFunnel, conversionFunnel, 'funnel')"
            class="xl:col-span-5"
          />
          <DashboardConversionFunnel
            v-else
            class="xl:col-span-5"
            :data="conversionFunnel"
            :loading="fetchingConversionFunnel"
            :failed="failed.funnel"
            @retry="loadSection('funnel')"
          />

          <DashboardPromoterLeaderboard
            class="xl:col-span-7"
            :entries="promoterLeaderboard"
            :loading="fetchingPromoterLeaderboard"
            :failed="failed.leaderboard"
            @retry="loadSection('leaderboard')"
          />
        </div>

        <DashboardCampaignPerformance
          :campaigns="campaignPerformance"
          :loading="fetchingCampaignPerformance"
          :failed="failed.campaigns"
          @retry="loadSection('campaigns')"
        />

        <DashboardSendDigestModal ref="digestModal" />
      </template>
    </template>
  </div>
</template>
