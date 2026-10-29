<script setup lang="ts">
import type { AppDropdown } from "#components";
import type { IInvitation } from "../../composables/useInvitationStore";

const props = defineProps<{
  invitation: IInvitation;
}>();

const emit = defineEmits<{
  revoke: [invitation: IInvitation];
}>();

const { can } = useAuthStore();
const { resendingInvitationId, resendInvitation } = useInvitationStore();
const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** True while this row's invitation email is being resent. */
const isResending = computed(
  () => resendingInvitationId.value === props.invitation.id,
);

/** Closes the menu and re-sends the invitation email. */
const resend = (): void => {
  dropdown.value?.closeDropdown();
  void resendInvitation(props.invitation.id).catch(() => undefined);
};

/** Closes the menu and asks the list to confirm revoking the invitation. */
const revoke = (): void => {
  dropdown.value?.closeDropdown();
  emit("revoke", props.invitation);
};
</script>

<template>
  <Icon
    v-if="isResending"
    name="vent:loading"
    size="1.1rem"
    class="animate-spin text-dashboard-text"
    aria-label="Resending invitation"
  />

  <AppDropdown
    v-else-if="can('users.create')"
    ref="dropdown"
    position="right"
    :width-is-finite="false"
  >
    <template #default>
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-dashboard-text transition hover:bg-dashboard-bg-dark hover:text-brand-color-default"
        :aria-label="`Actions for ${props.invitation.email}`"
      >
        <Icon name="vent:more" size="1.1rem" class="rotate-90" />
      </button>
    </template>

    <template #dropdown_body>
      <div class="min-w-40 space-y-1">
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
          @click="resend"
        >
          Resend Invite
        </button>
        <button
          type="button"
          class="block w-full rounded-md px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-100/40"
          @click="revoke"
        >
          Revoke Invite
        </button>
      </div>
    </template>
  </AppDropdown>
</template>
