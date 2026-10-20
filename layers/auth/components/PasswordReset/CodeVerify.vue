<script setup lang="ts">
const {
  email,
  verifyResetCode,
  verifyingCode,
  resendResetCode,
  resendingCode,
} = usePasswordResetStore();

const payload = reactive({
  code: "",
});

const digits = 6;

/** Whether a full-length code has been entered. */
const pinLengthIsValid = computed(() => {
  return payload.code.length === digits;
});

/** Requests a fresh verification code for the stored email. */
const resendCode = async () => {
  if (resendingCode.value) return;
  await resendResetCode().catch(() => {});
};

/** Verifies the entered code; the store advances the step on success. */
const submitForm = async () => {
  if (!pinLengthIsValid.value || verifyingCode.value) return;
  await verifyResetCode(payload.code).catch(() => {});
};
</script>
<template>
  <div class="flex w-full flex-col gap-6">
    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Enter Verification Code
      </h1>
      <p class="text-center text-dashboard-text text-base">
        We sent a 6-digit code to
        <span class="font-medium text-dashboard-heading">{{ email }}</span>
      </p>
    </div>

    <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-7">
      <div>
        <AppPinCode
          :digits="digits"
          v-model="payload.code"
          :autofocus="true"
          :secure="true"
          :inputClass="'w-11 h-11 md:h-16 md:w-16'"
        ></AppPinCode>
      </div>

      <div class="text-center text-sm text-dashboard-text">
        Didn’t receive the code?
        <button
          type="button"
          class="font-medium text-brand-color-007 hover:text-brand-color-005 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="resendingCode"
          @click="resendCode"
        >
          {{ resendingCode ? "Resending..." : "Resend Code" }}
        </button>
      </div>

      <div class="w-full pt-5">
        <AppButton
          :disabled="!pinLengthIsValid"
          :loading="verifyingCode"
          block
          size="md"
          color="primary"
        >
          Verify Code</AppButton
        >
      </div>
    </form>
  </div>
</template>
