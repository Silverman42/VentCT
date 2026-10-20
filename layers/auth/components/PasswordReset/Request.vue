<script setup lang="ts">
import { email, helpers, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";

const { requestResetCode, requestingCode } = usePasswordResetStore();

const payload = reactive({
  email: "",
});

const validation = computed(() => {
  return {
    email: {
      required: helpers.withMessage("Email is required", required),
      email: helpers.withMessage("The email format is incorrect", email),
    },
  };
});

const v$ = useVuelidate(validation, payload);

/** Validates the email and requests a reset code; the store advances the step on success. */
const submitForm = async () => {
  v$.value?.$touch();
  if (v$.value.$invalid) return;
  await requestResetCode(payload.email).catch(() => {});
};
</script>
<template>
  <div class="flex w-full flex-col gap-6">
    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Forgot Your Password ?
      </h1>
      <p class="text-center text-dashboard-text text-base">
        Enter the email linked to your account and we’ll send you a verification
        code.
      </p>
    </div>

    <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-7">
      <div>
        <AppInputContainer
          :error="v$.email?.$errors[0]?.$message?.toString() || ''"
          label="Email Address"
        >
          <input
            type="email"
            placeholder="Enter your email address"
            v-model.trim="payload.email"
            @blur="v$.email.$touch()"
          />
        </AppInputContainer>
      </div>

      <div class="w-full pt-5">
        <AppButton block size="md" color="primary" :loading="requestingCode">
          Send Verification Code</AppButton
        >
      </div>
    </form>
  </div>
</template>
