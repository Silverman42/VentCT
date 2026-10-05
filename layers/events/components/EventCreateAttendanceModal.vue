<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { TabsData } from "~/utils/types/misc/Tabs";
import type {
  ICreateAttendancePayload,
  IEvent,
} from "../composables/useEventStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  event: IEvent;
}>();

const { createAttendance, creatingAttendance } = useEventStore();

const modal = ref<ModalController | null>(null);

const methodTabs: TabsData[] = [
  { id: "qr", name: "Generate QR Code", icon: "vent:qr-code" },
  { id: "manual", name: "Manual" },
];

const form = reactive<ICreateAttendancePayload>({
  name: "",
  email: "",
});

/** Vuelidate rules for manually creating an attendee. */
const validations = computed(() => ({
  name: { required: helpers.withMessage("Full name is required", required) },
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Enter a valid email address", email),
  },
}));

const v$ = useVuelidate(validations, form);

/** Returns the first validation message for a field, or an empty string. */
const fieldError = (field: keyof ICreateAttendancePayload): string =>
  v$.value[field].$error ? String(v$.value[field].$errors[0]?.$message ?? "") : "";

/** Clears the manual form and its validation state. */
const resetForm = (): void => {
  form.name = "";
  form.email = "";
  v$.value.$reset();
};

/** Opens the modal on the Manual tab with an empty form. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the modal without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Validates the manual form and creates the attendee. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await createAttendance(props.event.id, { ...form });
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="900px">
    <div class="pb-1">
      <div class="pb-6">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Create Attendance
        </h2>
        <p class="mt-1 text-sm text-dashboard-text">
          Create new attendee for this event
        </p>
      </div>

      <p class="mb-3 text-base font-medium text-dashboard-heading">Method</p>

      <AppTab
        :tab-list="methodTabs"
        default-tab-id="manual"
        tab-btn-style="outlined"
        class="!max-w-full"
      >
        <template #qr>
          <EventAttendanceQrCard :event="props.event" @saved="close" />
        </template>

        <template #manual>
          <form class="pt-2" novalidate @submit.prevent="submit">
            <div class="space-y-4">
              <AppInputContainer
                label="Full Name"
                for="event-attendance-name"
                :error="fieldError('name')"
              >
                <input
                  id="event-attendance-name"
                  v-model.trim="form.name"
                  type="text"
                  autocomplete="name"
                  placeholder="e.g. Clement Ikhide"
                  :aria-invalid="v$.name.$error"
                  @blur="v$.name.$touch()"
                />
              </AppInputContainer>

              <AppInputContainer
                label="Email Address"
                for="event-attendance-email"
                :error="fieldError('email')"
              >
                <input
                  id="event-attendance-email"
                  v-model.trim="form.email"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  :aria-invalid="v$.email.$error"
                  @blur="v$.email.$touch()"
                />
              </AppInputContainer>
            </div>

            <div class="flex pt-8">
              <AppButton
                size="md"
                type="submit"
                color="primary"
                :loading="creatingAttendance"
                class="min-w-48"
              >
                Create Attendance
              </AppButton>
            </div>
          </form>
        </template>
      </AppTab>
    </div>
  </AppModal>
</template>
