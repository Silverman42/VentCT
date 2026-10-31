<script setup lang="ts">
import type { IEventDetails } from "../composables/useEventStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  /** Event whose check-in QR code is shown; its detail response carries the QR payload. */
  event: IEventDetails;
}>();

const modal = ref<ModalController | null>(null);

/** Opens the QR code modal. */
const open = (): void => {
  modal.value?.showDialogBox();
};

/** Closes the QR code modal. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="640px">
    <div class="pb-1">
      <div class="pb-6">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Event QR Code
        </h2>
        <p class="mt-1 text-sm text-dashboard-text">
          Share or print this code so attendees can register
        </p>
      </div>

      <EventAttendanceQrCard :event="props.event" />
    </div>
  </AppModal>
</template>
