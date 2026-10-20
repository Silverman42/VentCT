<script setup lang="ts">
const route = useRoute();
const { inviteIsAccpeted, resetOnboarding } = useOnboardingStore();

/** Invitation token from the route; arrays are reduced to their first value. */
const token = computed(() => {
  const param = route.params.token;
  return String(Array.isArray(param) ? param[0] : (param ?? ""));
});
const changeKey = computed(() => (inviteIsAccpeted.value ? 1 : 0));

onUnmounted(resetOnboarding);
</script>
<template>
  <main class="onboarding-container">
    <Transition name="fade-slide" mode="out-in" appear>
      <div class="step-wrapper" :key="changeKey">
        <Onboarding v-if="!inviteIsAccpeted" :token="token"></Onboarding>
        <OnboardingSetPassword
          v-else-if="inviteIsAccpeted"
          :token="token"
        ></OnboardingSetPassword>
      </div>
    </Transition>
  </main>
</template>
<style scoped>
.onboarding-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.step-wrapper {
  width: 100%;
  max-width: 100%;
}

/* Improved transition for onboarding steps */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  width: 100%;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Ensure smooth positioning */
.fade-slide-enter-active {
  position: relative;
}

.fade-slide-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
