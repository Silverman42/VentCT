<script setup lang="ts">
/** Clears the current error and returns to the login page. */
const goToLogin = () => clearError({ redirect: "/" });
</script>

<template>
  <div
    class="max-w-[801px] min-h-[80vh] w-full bg-auth-bg relative z-3 flex flex-col items-center"
  >
    <img
      src="/img/unauth_access.svg"
      class="max-w-[309.3px] mb-5"
      alt="unauth_access"
    />

    <h1
      class="text-auth-heading tracking-tight font-semibold text-[1.8rem] md:text-[3.8rem] mb-2 text-center"
    >
      Unauthorized Access
    </h1>

    <p class="text-sm md:text-[1.3rem] text-dashboard-text mb-2 text-center">
      You don’t have permission to view this page. If you believe this is a
      mistake, please check your credentials or contact your administrator for
      access.
    </p>

    <div class="mt-11">
      <AppButton :block="false" type="button" @click="goToLogin">
        Go to Login
      </AppButton>
    </div>
  </div>
</template>
