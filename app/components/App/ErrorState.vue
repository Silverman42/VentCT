<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Short statement of what failed. */
    heading: string;
    /** Guidance on what the user can do next. */
    description: string;
    /** Shows the retry button's loading state while the request repeats. */
    retrying?: boolean;
    /** Tightens vertical padding when the state sits inside a card. */
    compact?: boolean;
  }>(),
  {
    retrying: false,
    compact: false,
  },
);

const emit = defineEmits<{
  /** Fired when the user asks to repeat the failed request. */
  retry: [];
}>();
</script>

<template>
  <section
    class="flex flex-col items-center justify-center rounded-[14px] border border-dashboard-card-border bg-dashboard-bg px-6 text-center"
    :class="props.compact ? 'py-10' : 'py-16'"
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
