<template>
  <div class="flex flex-col gap-4" aria-hidden="true">
    <AppMetricRowsShimmer :rows="[4]" />

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <TelemetryServiceCardShimmer :detail-rows="2" />
      <TelemetryServiceCardShimmer :detail-rows="5" />
      <TelemetryServiceCardShimmer :detail-rows="2" />
      <TelemetryServiceCardShimmer :detail-rows="2" />
      <TelemetryServiceCardShimmer :detail-rows="1" />
      <TelemetryServiceCardShimmer :detail-rows="1" />
      <TelemetryServiceCardShimmer :detail-rows="3" show-progress />
      <TelemetryServiceCardShimmer :detail-rows="2" />
    </section>
  </div>
</template>
