<script setup lang="ts">
import {
  helpers,
  required,
  email,
  minLength,
  maxLength,
} from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import {
  VENT_SIGN_UP_URL,
  type IRegisteredAttendee,
} from "../../composables/useAttendanceFormStore";

const props = defineProps<{
  slug: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  registered: [attendee: IRegisteredAttendee];
}>();

const { registerAttendee, registering } = useAttendanceFormStore();

const payload = reactive({
  name: "",
  email: "",
  phone: "",
});

// Mirrors the backend rules for the public registration endpoint.
const validations = computed(() => {
  return {
    name: {
      required: helpers.withMessage("Please enter your full name.", required),
      minLength: helpers.withMessage(
        "Full name must be at least 2 characters",
        minLength(2),
      ),
      maxLength: helpers.withMessage(
        "Full name must not exceed 255 characters",
        maxLength(255),
      ),
    },
    email: {
      required: helpers.withMessage(
        "Please enter your email address.",
        required,
      ),
      email: helpers.withMessage("Enter a valid email address", email),
      maxLength: helpers.withMessage(
        "Email address must not exceed 255 characters",
        maxLength(255),
      ),
    },
    phone: {
      maxLength: helpers.withMessage(
        "Phone number must not exceed 30 characters",
        maxLength(30),
      ),
    },
  };
});

const v$ = useVuelidate(validations, payload);

/** Validates the form, registers the attendee and emits the result on success. */
const register = async () => {
  v$.value.$touch();
  if (v$.value.$invalid || props.disabled) return;

  try {
    const attendee = await registerAttendee(props.slug, { ...payload });
    emit("registered", attendee);
  } catch {
    // The store has already surfaced the failure as an error toast.
  }
};

/** Clears the fields and validation state so another attendee can register. */
const resetForm = () => {
  payload.name = "";
  payload.email = "";
  payload.phone = "";
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

      <AppInputContainer
        for="check-in-phone"
        label="Phone Number (optional)"
        :error="v$.phone?.$errors[0]?.$message.toString() || ''"
      >
        <input
          id="check-in-phone"
          type="tel"
          autocomplete="tel"
          placeholder="e.g. +2348011223344"
          v-model="payload.phone"
          @input="v$.phone.$touch()"
          @blur="v$.phone.$touch()"
        />
      </AppInputContainer>
    </div>

    <div class="w-full pt-4">
      <AppButton
        block
        size="md"
        color="primary"
        :loading="registering"
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
