<script setup lang="ts">
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  layout: "dashboard",
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <AppHeading title="Dashboard" subtitle="Conversion Funnel" />

    <DashboardStatsGrid />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <TopPromotersByVolumeCard class="xl:col-span-5" />
      <VerificationTradePerformanceCard class="xl:col-span-7" />
    </div>

    <TransactionVolumeAndCountCard />
  </div>
</template>
