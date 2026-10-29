<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    heading: string;
    description: string;
    retrying?: boolean;
  }>(),
  {
    retrying: false,
  },
);

const emit = defineEmits<{
  /** Fired when the user asks to repeat the failed request. */
  retry: [];
}>();
</script>

<template>
  <section
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 py-16 text-center"
  >
    <Icon
      name="vent:warning"
      size="2rem"
      class="text-dashboard-text"
      aria-hidden="true"
    />
    <h3 class="mt-3 text-lg font-medium text-dashboard-heading">
      {{ props.heading }}
    </h3>
    <p class="mt-2 max-w-md text-sm text-dashboard-text">
      {{ props.description }}
    </p>
    <AppButton
      type="button"
      size="sm"
      class="mt-5"
      :loading="props.retrying"
      @click="emit('retry')"
    >
      Retry
    </AppButton>
  </section>
</template>
