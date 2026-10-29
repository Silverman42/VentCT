<script setup lang="ts">
import type { IInvitation } from "../../composables/useInvitationStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const selectedInvitation = ref<IInvitation | null>(null);
const { revokeInvitation, revokingInvitation } = useInvitationStore();

/** Confirmation copy naming the invited email. */
const subheading = computed(
  () =>
    `${selectedInvitation.value?.email ?? "This person"} won't be able to use their invitation link. You can send a new invite later.`,
);

/** Opens the confirmation dialog for one invitation. */
const open = (invitation: IInvitation): void => {
  selectedInvitation.value = invitation;
  modal.value?.showDialogBox();
};

/** Dismisses the dialog; the invitation is kept so the copy doesn't change mid-animation. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Revokes the invitation and closes the dialog when it succeeds. */
const confirm = async (): Promise<void> => {
  const invitation = selectedInvitation.value;
  if (!invitation || revokingInvitation.value) return;

  try {
    await revokeInvitation(invitation.id);
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
      <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-400">
        <Icon name="vent:close-circle" size="1.35rem" />
      </div>
      <AppConfirmModal
        heading="Revoke Invitation"
        :subheading="subheading"
        :is-loading="revokingInvitation"
        @cancel="close"
        @confirm="confirm"
      />
    </section>
  </AppModal>
</template>
