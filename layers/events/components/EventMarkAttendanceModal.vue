<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import type { IMarkAttendancePayload } from "../composables/useEventStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  eventId: string;
}>();

const { attendanceCandidates, markAttendance, markingAttendance } =
  useEventStore();

const modal = ref<ModalController | null>(null);
const searchInput = ref("");

const form = reactive<IMarkAttendancePayload>({
  candidateIds: [],
});

/** Vuelidate rules requiring at least one selected candidate. */
const validations = computed(() => ({
  candidateIds: {
    required: helpers.withMessage("Select at least one attendee", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Candidates matching the search query by name or email. */
const candidates = computed(() => {
  const query = searchInput.value.trim().toLocaleLowerCase();

  return attendanceCandidates.value.filter(
    (candidate) =>
      !query ||
      [candidate.name, candidate.email]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
  );
});

/** Clears the search, selection and validation state. */
const resetForm = (): void => {
  form.candidateIds = [];
  searchInput.value = "";
  v$.value.$reset();
};

/** Opens the Mark Attendance modal with a clean selection. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the Mark Attendance modal without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Validates the selection and marks the chosen candidates as attendees. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    await markAttendance(props.eventId, {
      candidateIds: [...form.candidateIds],
    });
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="740px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Mark Attendance
        </h2>
        <p class="mt-1 text-sm text-dashboard-text">
          Mark attendance for this event
        </p>
      </div>

      <div class="space-y-4 py-3">
        <label class="relative block">
          <span class="sr-only">Search by name or email</span>
          <Icon
            name="vent:search-normal"
            size="1rem"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
          />
          <input
            v-model="searchInput"
            type="search"
            placeholder="Search by name or email"
            class="w-full rounded-lg border border-input-border bg-dashboard-bg py-3 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-input-placeholder focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
          />
        </label>

        <section
          class="max-h-72 overflow-y-auto rounded-lg border border-dashboard-card-border p-2"
          aria-label="Registered people who have not attended"
        >
          <div
            v-for="candidate in candidates"
            :key="candidate.id"
            class="flex items-center gap-3 rounded-lg px-2 py-3 transition"
            :class="{
              'bg-brand-color-default/10': form.candidateIds.includes(
                candidate.id,
              ),
            }"
          >
            <AppCheckbox
              :id="`event-mark-attendance-${candidate.id}`"
              v-model:is-selected="form.candidateIds"
              :value="candidate.id"
              name="event-attendance-candidates"
              @change="v$.candidateIds.$touch()"
            />
            <label
              :for="`event-mark-attendance-${candidate.id}`"
              class="min-w-0 cursor-pointer"
            >
              <p class="truncate text-sm font-medium text-dashboard-heading">
                {{ candidate.name }}
              </p>
              <p class="truncate text-xs text-dashboard-text">
                {{ candidate.email }}
              </p>
            </label>
          </div>

          <p
            v-if="!candidates.length"
            class="px-3 py-8 text-center text-sm text-dashboard-text"
          >
            {{
              attendanceCandidates.length
                ? "No one matches this search."
                : "Everyone registered for this event has already been marked."
            }}
          </p>
        </section>
        <p v-if="v$.candidateIds.$error" class="text-xs text-red-500" role="alert">
          {{ String(v$.candidateIds.$errors[0]?.$message ?? "") }}
        </p>
      </div>

      <div class="flex pt-5">
        <AppButton
          size="md"
          type="submit"
          color="primary"
          :loading="markingAttendance"
          class="min-w-48"
        >
          Mark Attendance
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
