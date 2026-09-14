<script setup lang="ts">
import type { DeepLink } from "../composables/useDeepLinkStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Identifies the destructive or regenerative operation awaiting confirmation. */
export type DeepLinkConfirmationAction = "regenerate" | "delete";

const emit = defineEmits<{
  confirm: [action: DeepLinkConfirmationAction, deepLink: DeepLink];
}>();

const modal = ref<ModalController | null>(null);
const action = ref<DeepLinkConfirmationAction>("regenerate");
const selectedDeepLink = ref<DeepLink | null>(null);
const isConfirming = ref(false);

/** Resolves the visible confirmation heading for the selected action. */
const heading = computed(() =>
  action.value === "regenerate" ? "Regenerate Link" : "Delete Link",
);

/** Resolves the explanatory confirmation message for the selected action. */
const subheading = computed(() =>
  action.value === "regenerate"
    ? "Are you sure you want to regenerate this link?"
    : "Are you sure you want to delete this link?",
);

/** Opens the shared confirmation content for one selected deep-link action. */
const open = (
  nextAction: DeepLinkConfirmationAction,
  deepLink: DeepLink,
): void => {
  action.value = nextAction;
  selectedDeepLink.value = deepLink;
  modal.value?.showDialogBox();
};

/** Dismisses the confirmation dialog without changing the selected record. */
const close = (): void => {
  modal.value?.hideDialogBox();
  selectedDeepLink.value = null;
};

/** Emits the selected operation once and waits for the parent state update to finish. */
const confirm = async (): Promise<void> => {
  if (!selectedDeepLink.value || isConfirming.value) return;

  isConfirming.value = true;
  try {
    emit("confirm", action.value, selectedDeepLink.value);
    close();
  } finally {
    isConfirming.value = false;
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="480px">
    <section class="py-3 text-center">
      <div
        class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
        :class="action === 'regenerate' ? 'bg-yellow-013 text-yellow-008' : 'bg-red-100 text-red-400'"
      >
        <Icon :name="action === 'regenerate' ? 'vent:warning' : 'vent:trash'" size="1.35rem" />
      </div>
      <AppConfirmModal
        :heading="heading"
        :subheading="subheading"
        :is-loading="isConfirming"
        @cancel="close"
        @confirm="confirm"
      />
    </section>
  </AppModal>
</template>
