<script setup lang="ts">
import { PassResetSteps } from "../composables/usePasswordResetStore";

definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
});

const { resetStep, resetActions } = usePasswordResetStore();

const stepsContainer = ref<HTMLElement | null>(null);

/** Leaves the reset flow and returns to the login page. */
const redirectToLogin = () => navigateTo("/");

/** Pins the container to the outgoing step's height so it doesn't collapse when that step is taken out of flow. */
const lockContainerHeight = (el: Element) => {
  if (!stepsContainer.value) return;
  stepsContainer.value.style.height = `${(el as HTMLElement).offsetHeight}px`;
};

/** Animates the container from the outgoing step's height to the incoming step's height. */
const growToIncomingStep = (el: Element) => {
  if (!stepsContainer.value) return;
  const target = (el as HTMLElement).offsetHeight;
  requestAnimationFrame(() => {
    if (stepsContainer.value) stepsContainer.value.style.height = `${target}px`;
  });
};

/** Releases the fixed height once the incoming step has settled. */
const releaseContainerHeight = () => {
  if (stepsContainer.value) stepsContainer.value.style.height = "";
};

onUnmounted(() => {
  resetActions();
});
</script>
<template>
  <AppAuthLayout @cancel="redirectToLogin" :containerMaxWidth="550">
    <div ref="stepsContainer" class="steps-container">
      <Transition
        name="fade-slide"
        appear
        @before-leave="lockContainerHeight"
        @enter="growToIncomingStep"
        @after-enter="releaseContainerHeight"
      >
        <div class="step-wrapper" :key="resetStep">
          <PasswordResetRequest v-if="resetStep === PassResetSteps.REQUEST" />
          <PasswordResetCodeVerify
            v-else-if="resetStep === PassResetSteps.CODE_VERIFICATION"
          />
          <PasswordResetChange
            v-else-if="resetStep === PassResetSteps.CHANGE_PASSWORD"
          />
          <PasswordResetSuccess
            v-else-if="resetStep === PassResetSteps.SUCCESS"
          />
        </div>
      </Transition>
    </div>
  </AppAuthLayout>
</template>
<style scoped>
.steps-container {
  position: relative;
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.step-wrapper {
  width: 100%;
  max-width: 100%;
}

/* Outgoing and incoming steps crossfade at the same time */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* The outgoing step leaves the flow so the incoming one takes its place immediately */
.fade-slide-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
