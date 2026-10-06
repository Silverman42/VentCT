<script setup lang="ts">
import { helpers, required, minLength } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { PassResetSteps } from "../../composables/usePasswordResetStore";

const { changeStep } = usePasswordResetStore();

const payload = reactive({
  password: "",
  confirm_password: "",
});

/** Passes when the value contains at least one digit. */
const requiredNumber = helpers.regex(/\d/);
/** Passes when the value contains at least one uppercase letter. */
const requiredUppercase = helpers.regex(/[A-Z]/);
/** Passes when the value contains at least one lowercase letter. */
const requiredLowercase = helpers.regex(/[a-z]/);
/** Passes when the value contains at least one non-alphanumeric, non-space character. */
const requiredSpecialChar = helpers.regex(/[^A-Za-z0-9\s]/);

const validations = computed(() => {
  return {
    password: {
      required: helpers.withMessage("Password is required", required),
      minLength: helpers.withMessage(
        "Password must be at least 8 characters",
        minLength(8),
      ),
      hasNumber: helpers.withMessage(
        "Password must contain at least one number",
        requiredNumber,
      ),
      hasUppercase: helpers.withMessage(
        "Password must contain at least one uppercase letter",
        requiredUppercase,
      ),
      hasLowercase: helpers.withMessage(
        "Password must contain at least one lowercase letter",
        requiredLowercase,
      ),
      hasSpecialChar: helpers.withMessage(
        "Password must contain at least one special character",
        requiredSpecialChar,
      ),
    },
    confirm_password: {
      isSamePassword: helpers.withMessage(
        "The confirmed password is not the same as the new password.",
        () => payload.confirm_password === payload.password,
      ),
    },
  };
});

const v$ = useVuelidate(validations, payload);

/** Per-rule pass flags that drive the password requirement tiles. */
const passwordIsValid = computed(() => ({
  minLength:
    !v$.value.password.minLength.$invalid && payload.password.length > 0,
  hasNumber:
    !v$.value.password.hasNumber.$invalid && payload.password.length > 0,
  hasUpperLower:
    !v$.value.password.hasUppercase.$invalid &&
    !v$.value.password.hasLowercase.$invalid &&
    payload.password.length > 0,
  hasSpecialChar:
    !v$.value.password.hasSpecialChar.$invalid && payload.password.length > 0,
}));

const updatePassword = () => {
  v$.value?.$touch();
  if (v$.value.$invalid) return;
  changeStep(PassResetSteps.SUCCESS);
};
</script>
<template>
  <form @submit.prevent="updatePassword" class="flex w-full flex-col gap-6">
    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Set New Password
      </h1>
      <p class="text-center text-dashboard-text text-base">
        Set new password for your account
      </p>
    </div>

    <div class="grid grid-cols-1 gap-7">
      <div>
        <AppInputContainer label="New Password" :isPassword="true">
          <template #default="{ passwordIsVisible }">
            <input
              :type="passwordIsVisible ? 'text' : 'password'"
              placeholder="Enter your password"
              v-model="payload.password"
            />
          </template>
        </AppInputContainer>

        <div class="mt-3">
          <h3
            class="text-[9px] uppercase text-dashboard-text mb-1 tracking-wider pl-5"
          >
            Password must have :
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              class="flex flex-col items-center gap-0.5 p-2 rounded-xl"
              :class="{
                'border border-dashboard-card-border':
                  !passwordIsValid.minLength,
                'border border-brand-color-007 ring-4 ring-brand-color-010/30':
                  passwordIsValid.minLength,
              }"
            >
              <p
                class="text-2xl font-black"
                :class="{
                  'text-dashboard-heading': !passwordIsValid.minLength,
                  'text-brand-color-007': passwordIsValid.minLength,
                }"
              >
                8+
              </p>
              <p class="text-[10px] text-dashboard-text">Characters</p>
            </div>
            <div
              class="flex flex-col items-center gap-0.5 p-2 rounded-xl"
              :class="{
                'border border-dashboard-card-border':
                  !passwordIsValid.hasNumber,
                'border border-brand-color-007 ring-4 ring-brand-color-010/30':
                  passwordIsValid.hasNumber,
              }"
            >
              <p
                class="text-2xl font-black"
                :class="{
                  'text-dashboard-heading': !passwordIsValid.hasNumber,
                  'text-brand-color-007': passwordIsValid.hasNumber,
                }"
              >
                1+
              </p>
              <p class="text-[10px] text-dashboard-text">Number</p>
            </div>
            <div
              class="flex flex-col items-center gap-0.5 p-2 rounded-xl"
              :class="{
                'border border-dashboard-card-border':
                  !passwordIsValid.hasUpperLower,
                'border border-brand-color-007 ring-4 ring-brand-color-010/30':
                  passwordIsValid.hasUpperLower,
              }"
            >
              <p
                class="text-2xl font-black"
                :class="{
                  'text-dashboard-heading': !passwordIsValid.hasUpperLower,
                  'text-brand-color-007': passwordIsValid.hasUpperLower,
                }"
              >
                Aa
              </p>
              <p class="text-[10px] text-dashboard-text">
                <span class="md:hidden">Upper and Lower case</span>
                <span class="hidden md:inline">Up. and Low. case</span>
              </p>
            </div>
            <div
              class="flex flex-col items-center gap-0.5 p-2 rounded-xl"
              :class="{
                'border border-dashboard-card-border':
                  !passwordIsValid.hasSpecialChar,
                'border border-brand-color-007 ring-4 ring-brand-color-010/30':
                  passwordIsValid.hasSpecialChar,
              }"
            >
              <p
                class="text-2xl font-black"
                :class="{
                  'text-dashboard-heading': !passwordIsValid.hasSpecialChar,
                  'text-brand-color-007': passwordIsValid.hasSpecialChar,
                }"
              >
                #!
              </p>
              <p class="text-[10px] text-dashboard-text">Special Character</p>
            </div>
          </div>
        </div>
      </div>

      <AppInputContainer
        :error="v$.confirm_password?.$errors[0]?.$message.toString() || ''"
        label="Confirm Password"
        :isPassword="true"
      >
        <template #default="{ passwordIsVisible }">
          <input
            :type="passwordIsVisible ? 'text' : 'password'"
            placeholder="Enter your password"
            v-model="payload.confirm_password"
            @input="v$.confirm_password.$touch()"
          />
        </template>
      </AppInputContainer>
    </div>

    <div class="w-full pt-5">
      <AppButton block size="md" color="primary"> Reset Password</AppButton>
    </div>
  </form>
</template>
