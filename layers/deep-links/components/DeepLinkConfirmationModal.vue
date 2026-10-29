<script setup lang="ts">
import type { IDeepLink } from "../composables/useDeepLinkStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Identifies the status change or deletion awaiting confirmation. */
export type DeepLinkConfirmationAction = "toggle" | "delete";

const modal = ref<ModalController | null>(null);
const action = ref<DeepLinkConfirmationAction>("toggle");
const selectedDeepLink = ref<IDeepLink | null>(null);
const {
  toggleDeepLinkStatus,
  deleteDeepLink,
  togglingDeepLinkStatus,
  deletingDeepLink,
} = useDeepLinkStore();

/** True when the pending toggle would deactivate the selected link. */
const isDeactivating = computed(
  () => selectedDeepLink.value?.status === "active",
);

/** Resolves the visible confirmation heading for the selected action. */
const heading = computed(() => {
  if (action.value === "delete") return "Delete Link";
  return isDeactivating.value ? "Deactivate Link" : "Activate Link";
});

/** Resolves the explanatory confirmation message for the selected action. */
const subheading = computed(() => {
  const name = selectedDeepLink.value?.name || "this link";
  if (action.value === "delete") {
    return `Are you sure you want to delete ${name}? This cannot be undone.`;
  }
  return isDeactivating.value
    ? `${name} will stop redirecting visitors until it is activated again.`
    : `${name} will start redirecting visitors again.`;
});

/** True while the confirmed request is in flight. */
const isLoading = computed(() =>
  action.value === "delete"
    ? deletingDeepLink.value
    : togglingDeepLinkStatus.value,
);

/** Opens the confirmation dialog for one deep-link action. */
const open = (
  nextAction: DeepLinkConfirmationAction,
  deepLink: IDeepLink,
): void => {
  action.value = nextAction;
  selectedDeepLink.value = deepLink;
  modal.value?.showDialogBox();
};

/**
 * Dismisses the confirmation dialog. The selected record is kept so the copy
 * doesn't change during the close animation; `open` replaces it next time.
 */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Runs the confirmed store action and closes the dialog when it succeeds. */
const confirm = async (): Promise<void> => {
  const deepLink = selectedDeepLink.value;
  if (!deepLink || isLoading.value) return;

  try {
    if (action.value === "delete") await deleteDeepLink(deepLink.id);
    else await toggleDeepLinkStatus(deepLink.id);
    close();
  } catch {
    // ApiErrorHandler in the store has already surfaced the failure.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="480px">
    <section class="py-3 text-center">
      <div
        class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
        :class="action === 'delete' ? 'bg-red-100 text-red-400' : 'bg-yellow-013 text-yellow-008'"
      >
        <Icon :name="action === 'delete' ? 'vent:trash' : 'vent:warning'" size="1.35rem" />
      </div>
      <AppConfirmModal
        :heading="heading"
        :subheading="subheading"
        :is-loading="isLoading"
        @cancel="close"
        @confirm="confirm"
      />
    </section>
  </AppModal>
</template>
