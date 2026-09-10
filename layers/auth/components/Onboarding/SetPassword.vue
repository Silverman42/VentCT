<script setup lang="ts">
import { helpers, required, minLength } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { Console } from "~/utils/helpers/Console";

const payload = reactive({
  password: "",
  confirm_password: "",
});

const requiredNumber = helpers.regex(/\d/);
const requiredUpperLowerCase = helpers.regex(/[a-zA-Z]/);

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
      hasLetter: helpers.withMessage(
        "Password must contain at least one letter",
        requiredUpperLowerCase,
      ),
    },
  };
});

const v$ = useVuelidate(validations, payload);

const passwordIsValid = computed(() => ({
  minLength:
    !v$.value.password.minLength.$invalid && payload.password.length > 0,
  hasNumber:
    !v$.value.password.hasNumber.$invalid && payload.password.length > 0,
  hasLetter:
    !v$.value.password.hasLetter.$invalid && payload.password.length > 0,
}));

watch(
  v$,
  (newVal) => {
    console.log("Min length Validity:", newVal.password.minLength.$invalid);
    console.log("Number Validity:", newVal.password.hasNumber.$invalid);
    console.log("Letter Validity:", newVal.password.hasLetter.$invalid);
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>
<template>
  <AppAuthLayout :containerMaxWidth="550">
    <div class="flex flex-col items-center gap-0.5 pb-5">
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center"
      >
        Set Your Password
      </h1>
      <p class="text-center text-dashboard-text text-base">
        Create a password to activate your account
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
          <div class="grid grid-cols-3 gap-3">
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
                  !passwordIsValid.hasLetter,
                'border border-brand-color-007 ring-4 ring-brand-color-010/30':
                  passwordIsValid.hasLetter,
              }"
            >
              <p
                class="text-2xl font-black"
                :class="{
                  'text-dashboard-heading': !passwordIsValid.hasLetter,
                  'text-brand-color-007': passwordIsValid.hasLetter,
                }"
              >
                Aa
              </p>
              <p class="text-[10px] text-dashboard-text">
                Upper and Lower case
              </p>
            </div>
          </div>
        </div>
      </div>

      <AppInputContainer label="Confirm Password" :isPassword="true">
        <template #default="{ passwordIsVisible }">
          <input
            :type="passwordIsVisible ? 'text' : 'password'"
            placeholder="Enter your password"
            v-model="payload.confirm_password"
          />
        </template>
      </AppInputContainer>
    </div>

    <div class="w-full pt-5">
      <AppButton block size="md" color="primary"> Activate account</AppButton>
    </div>
  </AppAuthLayout>
</template>
