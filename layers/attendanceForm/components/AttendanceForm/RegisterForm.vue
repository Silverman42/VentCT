<script setup lang="ts">
import { helpers, required, email } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { VENT_SIGN_UP_URL } from "../../composables/useAttendanceFormStore";

const props = defineProps<{
  eventId: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  registered: [firstName: string];
}>();

const { checkIn, checkingIn } = useAttendanceFormStore();

const payload = reactive({
  name: "",
  email: "",
});

const validations = computed(() => {
  return {
    name: {
      required: helpers.withMessage("Full name is required", required),
    },
    email: {
      required: helpers.withMessage("Email address is required", required),
      email: helpers.withMessage("Enter a valid email address", email),
    },
  };
});

const v$ = useVuelidate(validations, payload);

/** Validates the form, checks the attendee in and emits their first name on success. */
const register = async () => {
  v$.value.$touch();
  if (v$.value.$invalid || props.disabled) return;

  try {
    const result = await checkIn(props.eventId, { ...payload });
    emit("registered", result.name.split(/\s+/)[0] ?? result.name);
  } catch {
    // The store has already surfaced the failure as an error toast.
  }
};

/** Clears the fields and validation state so another attendee can register. */
const resetForm = () => {
  payload.name = "";
  payload.email = "";
  v$.value.$reset();
};

defineExpose({ resetForm });
</script>
<template>
  <form @submit.prevent="register" class="flex w-full flex-col gap-6" novalidate>
    <p class="text-base text-dashboard-heading">
      Fill in your details below to complete your registration.
    </p>

    <div class="flex flex-col gap-5">
      <AppInputContainer
        for="check-in-name"
        label="Full Name"
        :error="v$.name?.$errors[0]?.$message.toString() || ''"
      >
        <input
          id="check-in-name"
          type="text"
          autocomplete="name"
          placeholder="e.g. Clement Ikhide"
          v-model="payload.name"
          @input="v$.name.$touch()"
          @blur="v$.name.$touch()"
        />
      </AppInputContainer>

      <AppInputContainer
        for="check-in-email"
        label="Email Address"
        :error="v$.email?.$errors[0]?.$message.toString() || ''"
      >
        <input
          id="check-in-email"
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
          v-model="payload.email"
          @input="v$.email.$touch()"
          @blur="v$.email.$touch()"
        />
      </AppInputContainer>
    </div>

    <div class="w-full pt-4">
      <AppButton
        block
        size="md"
        color="primary"
        :loading="checkingIn"
        :disabled="v$.$invalid || disabled"
      >
        Register
      </AppButton>
    </div>

    <p class="text-center text-base text-dashboard-heading">
      Don't have a Vent account?
      <a
        :href="VENT_SIGN_UP_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="text-brand-color-default underline"
        >Sign up</a
      >
      here.
    </p>
  </form>
</template>
