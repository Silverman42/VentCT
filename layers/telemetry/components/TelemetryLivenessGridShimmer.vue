<template>
  <div class="flex flex-col gap-4" aria-hidden="true">
    <AppMetricRowsShimmer :rows="[3]" />

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TelemetryServiceCardShimmer :detail-rows="2" />
      <TelemetryServiceCardShimmer :detail-rows="1" />
      <TelemetryServiceCardShimmer :detail-rows="1" />
    </section>
  </div>
</template>
