<script setup lang="ts">
import { PassResetSteps } from "../composables/usePasswordResetStore";

definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
});

const { resetStep, resetActions } = usePasswordResetStore();

const redirectToLogin = () => navigateTo("/");

onUnmounted(() => {
  resetActions();
});
</script>
<template>
  <AppAuthLayout @cancel="redirectToLogin" :containerMaxWidth="550">
    <PasswordResetRequest v-if="resetStep === PassResetSteps.REQUEST" />
    <PasswordResetCodeVerify
      v-if="resetStep === PassResetSteps.CODE_VERIFICATION"
    />
    <PasswordResetChange
      v-if="resetStep === PassResetSteps.CHANGE_PASSWORD"
    ></PasswordResetChange>
    <PasswordResetSuccess v-if="resetStep === PassResetSteps.SUCCESS" />
  </AppAuthLayout>
</template>
