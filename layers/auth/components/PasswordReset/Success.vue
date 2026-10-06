<script setup lang="ts">
const iconIsRevealed = ref<boolean>(false);

const revealIcon = () => {
  iconIsRevealed.value = !iconIsRevealed.value;
};

const redirectToLogin = () => {
  navigateTo("/");
};

onMounted(() => {
  setTimeout(() => {
    revealIcon();
  }, 800);
});
</script>
<template>
  <div class="flex w-full flex-col items-center gap-6">
    <span class="text-brand-color-009 inline-block h-45">
      <Transition name="zoom">
        <svg
          v-if="iconIsRevealed"
          xmlns="http://www.w3.org/2000/svg"
          width="180"
          height="180"
          viewBox="0 0 24 24"
        >
          <!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/main/license.txt -->
          <g
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          >
            <path
              fill="currentColor"
              fill-opacity=".3"
              d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
            />
            <path fill="none" stroke-dasharray="14" d="M8 12l3 3l5 -5">
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                dur="0.2s"
                values="14;0"
              />
            </path>
          </g>
        </svg>
      </Transition>
    </span>

    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-2xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Password Reset
      </h1>
      <p class="text-center text-dashboard-text text-base">
        Your password has been reset. You can now sign in with your new password
      </p>
    </div>

    <div class="w-full">
      <AppButton @click="redirectToLogin" block size="md" color="primary">
        Sign in</AppButton
      >
    </div>
  </div>
</template>
