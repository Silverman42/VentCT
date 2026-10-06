<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, integer, minValue, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
} from "../composables/useEventStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface EventForm {
  name: string;
  target: number | null;
  location: string;
  date: string;
  status: EventStatus;
}

const { createEvent, creatingEvent } = useEventStore();

const modal = ref<ModalController | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);

const statusOptions: EventStatus[] = ["running", "pending", "completed"];

const form = reactive<EventForm>({
  name: "",
  target: null,
  location: "",
  date: "",
  status: "running",
});

/** Vuelidate rules for creating an event. */
const validations = computed(() => ({
  name: { required: helpers.withMessage("Event name is required", required) },
  target: {
    required: helpers.withMessage("Target is required", required),
    integer: helpers.withMessage("Target must be a whole number", integer),
    minValue: helpers.withMessage("Target must be at least 1", minValue(1)),
  },
  location: {
    required: helpers.withMessage("Location is required", required),
  },
  date: { required: helpers.withMessage("Date is required", required) },
  status: { required: helpers.withMessage("Select a status", required) },
}));

const v$ = useVuelidate(validations, form);

/** Returns the first validation message for a field, or an empty string. */
const fieldError = (field: keyof EventForm): string =>
  v$.value[field].$error
    ? String(v$.value[field].$errors[0]?.$message ?? "")
    : "";

/** Restores empty form values and clears validation state. */
const resetForm = (): void => {
  form.name = "";
  form.target = null;
  form.location = "";
  form.date = "";
  form.status = "running";
  v$.value.$reset();
};

/** Opens a clean New Event form and focuses the name field. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  nameInput.value?.focus();
};

/** Closes the New Event modal without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects an event status and closes the status menu. */
const selectStatus = (status: EventStatus): void => {
  form.status = status;
  v$.value.status.$touch();
  statusDropdown.value?.closeDropdown();
};

/** Validates the form and creates the event. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await createEvent({
      name: form.name,
      target: Number(form.target),
      location: form.location,
      date: form.date,
      status: form.status,
    });
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="600px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <h2
        class="pb-5 text-xl font-medium tracking-tight text-dashboard-heading"
      >
        New Event
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AppInputContainer
          label="Name"
          for="new-event-name"
          :error="fieldError('name')"
        >
          <input
            id="new-event-name"
            ref="nameInput"
            v-model.trim="form.name"
            type="text"
            placeholder="e.g outdoor movie rave"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Target"
          for="new-event-target"
          :error="fieldError('target')"
        >
          <input
            id="new-event-target"
            v-model.number="form.target"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="e.g 100"
            :aria-invalid="v$.target.$error"
            @blur="v$.target.$touch()"
          />
        </AppInputContainer>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Location"
            for="new-event-location"
            :error="fieldError('location')"
          >
            <input
              id="new-event-location"
              v-model.trim="form.location"
              type="text"
              placeholder="e.g University of benin, benin city"
              :aria-invalid="v$.location.$error"
              @blur="v$.location.$touch()"
            />
          </AppInputContainer>
        </div>

        <AppInputContainer
          label="Date"
          for="new-event-date"
          :error="fieldError('date')"
        >
          <AppDatePicker
            id="new-event-date"
            v-model="form.date"
            placeholder="Select event date"
            :invalid="v$.date.$error"
            @closed="v$.date.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Status"
          for="new-event-status"
          :error="fieldError('status')"
        >
          <AppDropdown
            ref="statusDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="new-event-status"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.status.$error"
              aria-haspopup="listbox"
            >
              {{ EVENT_STATUS_LABELS[form.status] }}
              <Icon
                name="vent:arrow-down"
                size="1rem"
                class="shrink-0 text-dashboard-text"
              />
            </button>
            <template #dropdown_body>
              <div
                role="listbox"
                aria-label="Status"
                class="min-w-56 space-y-1"
              >
                <button
                  v-for="option in statusOptions"
                  :key="option"
                  type="button"
                  role="option"
                  :aria-selected="form.status === option"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.status === option }"
                  @click="selectStatus(option)"
                >
                  {{ EVENT_STATUS_LABELS[option] }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <AppButton
          size="md"
          type="submit"
          color="primary"
          :loading="creatingEvent"
          class="min-w-28"
        >
          Save
        </AppButton>
        <AppButton
          size="md"
          type="button"
          color="primary"
          outlined
          class="min-w-28"
          @click="close"
        >
          Cancel
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
