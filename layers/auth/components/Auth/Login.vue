<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";

const isLoading = ref(false);

const form = reactive({
  email: "",
  password: "",
});

/** Vuelidate validation rules for login credentials. */
const validations = computed(() => ({
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Please enter a valid email address", email),
  },
  password: {
    required: helpers.withMessage("Password is required", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Validates form input, simulates submission, and redirects to the dashboard page. */
const handleSubmit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isLoading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await navigateTo("/dashboard");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <AppAuthLayoutTwo :containerMaxWidth="550">
    <form class="w-full" novalidate @submit.prevent="handleSubmit">
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
        <AppInputContainer
          label="Email"
          for="login-email"
          :error="
            v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''
          "
        >
          <input
            id="login-email"
            v-model.trim="form.email"
            type="email"
            placeholder="Enter your email address"
            autocomplete="email"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </AppInputContainer>

        <div>
          <AppInputContainer
            label="Password"
            for="login-password"
            :isPassword="true"
            :error="
              v$.password.$error
                ? String(v$.password.$errors[0]?.$message ?? '')
                : ''
            "
          >
            <template #default="{ passwordIsVisible }">
              <input
                id="login-password"
                v-model="form.password"
                :type="passwordIsVisible ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                :aria-invalid="v$.password.$error"
                @blur="v$.password.$touch()"
              />
            </template>
          </AppInputContainer>
          <nuxt-link
            to="/password-reset"
            class="text-brand-color-007 inline-block w-full text-right mt-2 hover:text-brand-color-006 text-xs"
            >Forgot Password ?</nuxt-link
          >
        </div>
      </div>

      <div class="w-full pt-5">
        <AppButton
          block
          size="md"
          color="primary"
          type="submit"
          :loading="isLoading"
        >
          Sign in
        </AppButton>
      </div>
    </form>
  </AppAuthLayoutTwo>
</template>
