<script setup lang="ts">
const iconIsRevealed = ref<boolean>(false);
const { acceptInvitation } = useOnboardingStore();

const revealIcon = () => {
  iconIsRevealed.value = !iconIsRevealed.value;
};

onMounted(() => {
  setTimeout(() => {
    revealIcon();
  }, 800);
});
</script>
<template>
  <AppAuthLayoutTwo
    background-img="/img/onboarding_bg.png"
    :containerMaxWidth="550"
  >
    <div class="flex flex-col items-center gap-0.5 pb-10">
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

      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center mt-5"
      >
        Invite Accepted.
      </h1>
      <p class="text-center text-dashboard-text text-sm mt-2 w-[90%]">
        You’ve joined Vent CT service as an admin. One last step, set a password
        to activate your account.
      </p>
    </div>

    <AppButton
      @click="acceptInvitation"
      :block="false"
      size="sm"
      color="primary"
    >
      Continue To Set Password
    </AppButton>
  </AppAuthLayoutTwo>
</template>
