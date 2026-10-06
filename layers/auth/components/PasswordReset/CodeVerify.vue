<script setup lang="ts">
import { PassResetSteps } from "../../composables/usePasswordResetStore";

const { changeStep, email } = usePasswordResetStore();

const payload = reactive({
  code: "",
});

const digits = 6;

const pinLengthIsValid = computed(() => {
  return payload.code.length === digits;
});

const resendCode = () => {
  //   changeStep(PassResetSteps.REQUEST);
};

const submitForm = () => {
  if (!pinLengthIsValid.value) return;
  changeStep(PassResetSteps.CHANGE_PASSWORD);
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
          class="font-medium text-brand-color-007 hover:text-brand-color-005"
          @click="resendCode"
        >
          Resend Code
        </button>
      </div>

      <div class="w-full pt-5">
        <AppButton
          :disabled="!pinLengthIsValid"
          @click="submitForm"
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
