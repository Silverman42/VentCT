<script setup lang="ts">
interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = withDefaults(
  defineProps<{
    /** Campaigns to delete; more than one uses the batch delete endpoint. */
    campaignIds: string[];
    /** Navigates back to the campaign list after a successful delete. */
    redirectOnDelete?: boolean;
    /** Always uses the batch endpoint, which refreshes the list and its summary. */
    batch?: boolean;
  }>(),
  { redirectOnDelete: false, batch: false },
);

const emit = defineEmits<{
  deleted: [campaignIds: string[]];
}>();

const {
  deleteCampaign,
  deletingCampaign,
  batchDeleteCampaigns,
  batchDeletingCampaigns,
} = useCampaignStore();
const modal = ref<ModalController | null>(null);

/** Whether the dialog targets several campaigns. */
const isMultiple = computed(() => props.campaignIds.length > 1);

/** Whether the request goes through the batch delete endpoint. */
const usesBatchEndpoint = computed(() => props.batch || isMultiple.value);

/** Loading state for whichever delete request the dialog sends. */
const isDeleting = computed(() =>
  usesBatchEndpoint.value
    ? batchDeletingCampaigns.value
    : deletingCampaign.value,
);

/** Heading that reflects how many campaigns will be removed. */
const heading = computed(() =>
  isMultiple.value
    ? `Delete ${props.campaignIds.length} Campaigns`
    : "Delete Campaign",
);

/** Opens the delete confirmation dialog. */
const open = (): void => {
  modal.value?.showDialogBox();
};

/** Closes the dialog without deleting. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Deletes the targeted campaigns, then notifies the parent or redirects. */
const confirmDelete = async (): Promise<void> => {
  const ids = [...props.campaignIds];
  if (!ids.length) return;

  try {
    if (usesBatchEndpoint.value) {
      await batchDeleteCampaigns(ids);
    } else {
      await deleteCampaign(ids[0]!);
    }
    close();
    emit("deleted", ids);
    if (props.redirectOnDelete) await navigateTo("/campaigns");
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
        {{ heading }}
      </h2>
      <p class="mt-2 text-base text-dashboard-text">
        Are you sure you want to permanently delete
        {{ isMultiple ? "these campaigns" : "this campaign" }}?
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
          This action cannot be undone. The campaign details will be
          permanently removed.
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
          :loading="isDeleting"
          class="!bg-red-600 hover:!bg-red-700"
          @click="confirmDelete"
        >
          {{ heading }}
        </AppButton>
      </div>
    </section>
  </AppModal>
</template>
