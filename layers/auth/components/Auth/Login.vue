<script setup lang="ts"></script>
<template>
  <AppAuthLayoutTwo :containerMaxWidth="550">
    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Welcome back
      </h1>
      <p class="text-center text-dashboard-text text-base">
        Please enter your details to continue
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <AppInputContainer label="Email">
        <input type="text" placeholder="Enter your email address" />
      </AppInputContainer>

      <div>
        <AppInputContainer label="Password" :isPassword="true">
          <template #default="{ passwordIsVisible }">
            <input
              :type="passwordIsVisible ? 'text' : 'password'"
              placeholder="Enter your password"
            />
          </template>
        </AppInputContainer>
        <nuxt-link
          to="/"
          class="text-brand-color-007 inline-block w-full text-right mt-2 hover:text-brand-color-006 text-xs"
          >Forgot Password ?</nuxt-link
        >
      </div>
    </div>

    <div class="w-full pt-5">
      <AppButton block size="md" color="primary"> Sign in</AppButton>
    </div>
  </AppAuthLayoutTwo>
</template>
