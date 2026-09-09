<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    outlined?: boolean;
    color?: "primary" | "secondary" | "neutral";
    rounded?: boolean;
    fullRounded?: boolean;
  }>(),
  {
    block: false,
    loading: false,
    disabled: false,
    size: "md",
    outlined: false,
    color: "primary",
    rounded: true,
    fullRounded: true,
  },
);

const isOnline = useOnlineHandler().isOnline;

const getProps = computed(() => props);

const disableButton = computed(() => {
  return getProps.value.disabled || getProps.value.loading;
});
</script>
<template>
  <button
    class="btn"
    :class="{
      'w-full': getProps.block,
      'rounded-lg': getProps.rounded && !getProps.fullRounded,
      'rounded-full': getProps.fullRounded,
      'brightness-75 cursor-not-allowed': getProps.disabled,
      'btn-sm': getProps.size === 'sm',
      'btn-md': getProps.size === 'md',
      'btn-lg': getProps.size === 'lg',
      'btn-primary': !getProps.outlined && getProps.color === 'primary',
      'btn-primary-outlined': getProps.outlined && getProps.color === 'primary',
      'btn-secondary': !getProps.outlined && getProps.color === 'secondary',
      'btn-secondary-outlined':
        getProps.outlined && getProps.color === 'secondary',
      'btn-neutral': !getProps.outlined && getProps.color === 'neutral',
      'btn-neutral-outlined': getProps.outlined && getProps.color === 'neutral',
    }"
    :disabled="disableButton || !isOnline"
  >
    <!-- <span
      v-if="getProps.loading"
      class="absolute block w-[40px] h-[40px] p-2 z-1 border-5 border-brand-color-003 rounded-full left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 loader-animate"
    >
      <span
        class="block w-full h-full rounded-full border-5 border-brand-color-003"
      ></span>
    </span> -->
    <span
      class="absolute z-2 left-1/2 top-1/2 transition-all duration-300 ease-in-out -translate-x-1/2 -translate-y-1/2"
      :class="{
        'invisible opacity-0': !getProps.loading,
      }"
      ><Icon v-if="getProps.loading" name="vent:loading" size="1.3rem"></Icon
    ></span>
    <span
      class="flex items-center gap-2 justify-center transition-all duration-300 ease-in-out w-full h-full relative z-5"
      :class="{
        'invisible opacity-0': getProps.loading,
      }"
    >
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.btn {
  @apply cursor-pointer flex gap-2 items-center justify-center overflow-hidden py-3 px-6 text-center transition-colors duration-500 ease-in-out relative;
}

.btn-sm {
  @apply text-sm;
}

.btn-md {
  @apply text-base;
}

.btn-lg {
  @apply text-lg;
}

.btn-primary {
  @apply bg-brand-color-default hover:bg-brand-color-005 text-white;
}

.btn-primary:disabled {
  @apply bg-brand-color-005 cursor-not-allowed;
}

.btn-secondary {
  @apply bg-orange-008 hover:bg-orange-default text-white;
}

.btn-secondary:disabled {
  @apply bg-orange-004 cursor-not-allowed;
}

.btn-secondary-outlined {
  @apply bg-dashboard-bg border border-orange-default text-orange-default hover:border-orange-008 hover:text-orange-008;
}

.btn-neutral {
  @apply bg-dashboard-bg-dark hover:bg-dashboard-bg-darker text-dashboard-heading;
}

.btn-primary-outlined {
  @apply bg-dashboard-bg border border-brand-color-default text-brand-color-default hover:border-brand-color-005 hover:text-brand-color-005;
}

.btn-neutral-outlined {
  @apply bg-dashboard-bg border border-dashboard-card-border text-dashboard-heading hover:bg-dashboard-bg-dark;
}

.loader-animate {
  animation: loader 1s linear infinite;
}
@keyframes loader {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(20);
    opacity: 0;
  }
}
</style>
