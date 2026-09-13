<script lang="ts" setup>
interface ContainerProps {
  label?: string;
  error?: string;
  for?: string;
  prefix?: string;
  isPassword?: boolean;
  canPaste?: boolean;
}
const containerProps = withDefaults(defineProps<ContainerProps>(), {
  label: "",
  prefix: "",
  isPassword: false,
  passwordIsVisible: false,
  canPaste: false,
});

const requestError = computed(() => containerProps.error);
const passwordIsVisible = ref(false);
const toggglePasswordVisibility = () => {
  passwordIsVisible.value = !passwordIsVisible.value;
};
</script>
<template>
  <div class="input-container" tabindex="0">
    <label
      v-if="containerProps.label.length > 0"
      :for="containerProps.for"
      class="text-xs text-input-label mb-2 relative flex items-end justify-between z-2"
    >
      <p>{{ containerProps.label }}</p>
      <slot name="sidelabel"></slot>
    </label>
    <div class="input-body">
      <span class="prefix" v-if="containerProps.prefix.length > 0">
        {{ containerProps.prefix }}
      </span>
      <slot :passwordIsVisible="passwordIsVisible"> </slot>

      <span
        class="password-hide"
        v-if="isPassword"
        @click="toggglePasswordVisibility"
      >
        {{ passwordIsVisible ? "Hide" : "Show" }}
      </span>

      <span class="password-hide" v-if="canPaste">paste</span>
    </div>
    <span class="error">{{ requestError }}</span>
  </div>
</template>
<style scoped>
@reference "~/assets/css/main.css";

.input-container {
  @apply border rounded-[8px] border-input-border bg-dashboard-bg py-2 px-4 outline-0 hover:border-brand-color-default hover:ring-4 hover:ring-brand-color-011/20 focus:border-brand-color-default focus:ring-4 focus:ring-brand-color-011/20;
}

.input-container .error {
  @apply text-xs text-red-500 block mt-1;
}

.input-body {
  @apply flex gap-2 items-stretch relative;
}

.input-body .prefix {
  @apply border inline-flex items-center w-auto shrink-0 rounded-md p-2 px-3 text-dashboard-text-light;
}

.input-body:deep(input[type="text"]),
.input-body:deep(input[type="email"]),
.input-body:deep(input[type="number"]),
.input-body:deep(textarea),
.input-body:deep(input[type="password"]),
.input-body:deep(input[type="date"]),
.input-body:deep(input[type="tel"]),
.input-body:deep(input[type="time"]) {
  @apply w-full flex-grow placeholder:text-input-placeholder text-base text-input-text outline-none bg-transparent font-medium;
}

.input-body .password-hide {
  @apply text-[0.55rem] inline-block px-2 py-1 bg-auth-pass-hide-btn rounded-md text-auth-pass-hide-btn-text absolute top-[50%] translate-y-[-50%] cursor-pointer right-0 z-2 uppercase tracking-widest;
}

.input-body:deep(input[type="password"]),
.input-body:deep(input[class="canPaste"]) {
  @apply pr-8;
}

.input-container:deep(textarea) {
  @apply h-auto;
}
</style>
