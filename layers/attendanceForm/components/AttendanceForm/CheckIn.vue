<script setup lang="ts">
const props = defineProps<{
  eventId: string;
}>();

const { fetchEvent, fetchingEvent, event, eventError } =
  useAttendanceFormStore();

const registerForm = ref<{ resetForm: () => void } | null>(null);
const successModal = ref<{
  open: (name: string) => void;
  close: () => void;
} | null>(null);

/** Shows the success modal for the attendee who just registered. */
const showSuccess = (firstName: string) => {
  successModal.value?.open(firstName);
};

/** Closes the success modal and clears the form for the next attendee. */
const registerAnother = () => {
  successModal.value?.close();
  registerForm.value?.resetForm();
};

/** Loads the event details, leaving the error state to the store flag. */
const loadEvent = () => {
  fetchEvent(props.eventId).catch(() => {});
};

onMounted(loadEvent);
</script>
<template>
  <div
    class="relative flex min-h-dvh w-full flex-col bg-cover bg-top bg-no-repeat font-body"
    style="background-image: url('/img/attendance_bg.png')"
  >
    <AppToast />

    <!-- Dims the light background in dark mode so the header text stays legible -->
    <div
      class="pointer-events-none absolute inset-0 dark:bg-dashboard-bg/70"
    ></div>

    <header class="relative w-full px-6 pt-16 pb-14">
      <div class="mx-auto w-full max-w-[400px]">
        <AttendanceFormEventInfoShimmer v-if="fetchingEvent" />
        <div
          v-else-if="eventError"
          class="flex flex-col items-start gap-2 text-dashboard-heading-blue"
        >
          <p class="text-base font-medium">We couldn't load this event.</p>
          <button
            type="button"
            class="text-sm text-brand-color-default underline"
            @click="loadEvent"
          >
            Try again
          </button>
        </div>
        <AttendanceFormEventInfo v-else :event="event" />
      </div>
    </header>

    <section
      class="relative w-full flex-1 rounded-t-3xl bg-dashboard-bg px-6 pt-12 pb-10"
    >
      <div class="mx-auto w-full max-w-[400px]">
        <AttendanceFormRegisterForm
          ref="registerForm"
          :eventId="eventId"
          :disabled="fetchingEvent || eventError"
          @registered="showSuccess"
        />
      </div>
    </section>

    <AttendanceFormSuccessModal ref="successModal" @again="registerAnother" />
  </div>
</template>
