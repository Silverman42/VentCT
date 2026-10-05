<script setup lang="ts">
interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  eventId: string;
}>();

const { deleteEvent, deletingEvent } = useEventStore();
const modal = ref<ModalController | null>(null);

/** Opens the delete confirmation dialog. */
const open = (): void => {
  modal.value?.showDialogBox();
};

/** Closes the dialog without deleting. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Deletes the event and returns to the events list. */
const confirmDelete = async (): Promise<void> => {
  try {
    await deleteEvent(props.eventId);
    close();
    await navigateTo("/events");
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="740px">
    <section class="flex flex-col items-center pb-4 text-center">
      <div
        class="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
      >
        <Icon name="vent:trash" size="2.75rem" />
      </div>

      <h2 class="mt-4 text-2xl font-medium tracking-tight text-dashboard-heading">
        Delete Event
      </h2>
      <p class="mt-2 text-base text-dashboard-text">
        Are you sure you want to permanently delete?
      </p>

      <div
        class="mt-5 flex max-w-md items-start gap-2.5 rounded-lg bg-red-100/60 px-4 py-3 text-left text-sm text-dashboard-heading dark:bg-red-500/10"
        role="alert"
      >
        <Icon
          name="vent:warning"
          size="1.4rem"
          class="shrink-0 text-red-600 dark:text-red-400"
        />
        <p>
          This action cannot be undone. The event details will be permanently
          removed.
        </p>
      </div>

      <div class="mt-10 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <AppButton
          type="button"
          size="lg"
          color="neutral"
          outlined
          block
          @click="close"
        >
          Cancel
        </AppButton>
        <AppButton
          type="button"
          size="lg"
          block
          :loading="deletingEvent"
          class="!bg-red-600 hover:!bg-red-700"
          @click="confirmDelete"
        >
          Delete Event
        </AppButton>
      </div>
    </section>
  </AppModal>
</template>
