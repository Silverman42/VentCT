<script setup lang="ts">
import type { IRegisteredAttendee } from "../../composables/useAttendanceFormStore";

const props = defineProps<{
  slug: string;
}>();

const { fetchEvent, fetchingEvent, event, eventError, resetRegistration } =
  useAttendanceFormStore();

/** Background art used when the event has no banner. */
const DEFAULT_BACKGROUND = "/img/attendance_bg.png";

const registerForm = ref<{ resetForm: () => void } | null>(null);
const successModal = ref<{
  open: (attendee: IRegisteredAttendee) => void;
  close: () => void;
} | null>(null);

/** Template-ready header background: the event banner when available, else the default art. */
const header = computed(() => {
  const bannerUrl = event.value?.bannerUrl?.trim() ?? "";
  return {
    hasBanner: !!bannerUrl,
    style: {
      backgroundImage: `url('${(bannerUrl || DEFAULT_BACKGROUND).replace(/'/g, "%27")}')`,
    },
  };
});

/** True while the event is loading, including the server render before the client fetch starts. */
const isLoadingEvent = computed(
  () =>
    fetchingEvent.value ||
    (!!props.slug && !event.value && !eventError.value),
);

/** Shows the success modal for the attendee who just registered. */
const showSuccess = (attendee: IRegisteredAttendee) => {
  successModal.value?.open(attendee);
};

/** Closes the success modal and clears the form for the next attendee. */
const registerAnother = () => {
  successModal.value?.close();
  resetRegistration();
  registerForm.value?.resetForm();
};

/** Loads the event details, leaving the error state to the store flag. */
const loadEvent = () => {
  if (!props.slug) return;
  fetchEvent(props.slug).catch(() => {});
};

onMounted(loadEvent);
</script>
<template>
  <div
    class="relative flex min-h-dvh w-full flex-col bg-cover bg-top bg-no-repeat font-body"
    :style="header.style"
  >
    <!-- Keeps header text legible: always over a banner photo, dark mode only over the default art -->
    <div
      class="pointer-events-none absolute inset-0"
      :class="header.hasBanner ? 'bg-dashboard-bg/70' : 'dark:bg-dashboard-bg/70'"
    ></div>

    <header class="relative w-full px-6 pt-16 pb-14">
      <div class="mx-auto w-full max-w-[400px]">
        <AttendanceFormEventInfoShimmer v-if="isLoadingEvent" />
        <div
          v-else-if="eventError === 'not_found' || !slug"
          class="flex flex-col items-start gap-2 text-dashboard-heading-blue"
        >
          <p class="text-base font-medium">
            This event link is invalid or has expired.
          </p>
          <p class="text-sm">Ask the event organiser for a new QR code.</p>
        </div>
        <div
          v-else-if="eventError === 'failed'"
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
          :slug="slug"
          :disabled="isLoadingEvent || !!eventError || !slug"
          @registered="showSuccess"
        />
      </div>
    </section>

    <AttendanceFormSuccessModal ref="successModal" @again="registerAnother" />
  </div>
</template>
