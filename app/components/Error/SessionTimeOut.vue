<script setup lang="ts">
/** Clears the current error and returns to the login page. */
const goToLogin = () => clearError({ redirect: "/" });
</script>

<template>
  <div
    class="max-w-[541px] min-h-[80vh] w-full bg-auth-bg relative z-3 flex flex-col items-center"
  >
    <img
      src="/img/session_timeout.svg"
      class="max-w-[325px] mb-5"
      alt="session_timeout"
    />

    <h1
      class="text-auth-heading tracking-tight font-semibold text-[1.8rem] md:text-[3.8rem] mb-2 text-center"
    >
      Session Timeout
    </h1>

    <p class="text-sm md:text-[1.3rem] text-dashboard-text mb-2 text-center">
      For security reasons, you’ve been logged out due to inactivity. Please
      login again to continue.
    </p>

    <div class="mt-11">
      <AppButton :block="false" type="button" @click="goToLogin">
        Go to Login
      </AppButton>
    </div>
  </div>
</template>
