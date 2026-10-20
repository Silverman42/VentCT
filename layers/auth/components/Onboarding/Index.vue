<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";

const props = defineProps<{
  /** Invitation token from the onboarding link. */
  token: string;
}>();

const iconIsRevealed = ref<boolean>(false);
const {
  acceptInvitation,
  inspectInvitation,
  invitation,
  invitationError,
  fetchingInvitation,
} = useOnboardingStore();

/** Template-ready view of the inspected invitation. */
const invitationView = computed(() => ({
  email: invitation.value?.email ?? "",
  role: invitation.value?.role ?? "admin",
  expiresAt: invitation.value?.expires_at
    ? DateFormatter.formatDate(invitation.value.expires_at)
    : "",
  hasInvitation: !!invitation.value,
  errorMessage: invitationError.value ?? "",
  hasError: !!invitationError.value,
  isLoading: fetchingInvitation.value || (!invitation.value && !invitationError.value),
}));

/** Toggles the animated success icon. */
const revealIcon = () => {
  iconIsRevealed.value = !iconIsRevealed.value;
};

/** Validates the invitation token, then reveals the success icon. */
const loadInvitation = async () => {
  try {
    await inspectInvitation(props.token);
    setTimeout(revealIcon, 300);
  } catch {
    // The error state is rendered from `invitationError`.
  }
};

onMounted(loadInvitation);
</script>
<template>
  <AppAuthLayoutTwo
    background-img="/img/onboarding_bg.png"
    :containerMaxWidth="550"
  >
    <OnboardingIndexShimmer v-if="invitationView.isLoading" />

    <div
      v-else-if="invitationView.hasError"
      class="flex flex-col items-center gap-0.5"
    >
      <span
        class="flex h-20 w-20 items-center justify-center rounded-full bg-orange-013 text-orange-default"
      >
        <Icon name="vent:warning-3" size="2.5rem" />
      </span>
      <h1
        class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center mt-5"
      >
        Invitation Unavailable
      </h1>
      <p class="text-center text-dashboard-text text-sm mt-2 w-[90%] pb-8">
        {{ invitationView.errorMessage }}
      </p>
      <NuxtLink to="/">
        <AppButton :block="false" size="sm" color="primary" type="button">
          Go to Login
        </AppButton>
      </NuxtLink>
    </div>

    <template v-else-if="invitationView.hasInvitation">
      <div class="flex flex-col items-center gap-0.5 pb-10">
        <span class="text-brand-color-009 inline-block h-45">
          <Transition name="zoom">
            <svg
              v-if="iconIsRevealed"
              xmlns="http://www.w3.org/2000/svg"
              width="180"
              height="180"
              viewBox="0 0 24 24"
            >
              <!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/main/license.txt -->
              <g
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <path
                  fill="currentColor"
                  fill-opacity=".3"
                  d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
                />
                <path fill="none" stroke-dasharray="14" d="M8 12l3 3l5 -5">
                  <animate
                    fill="freeze"
                    attributeName="stroke-dashoffset"
                    dur="0.2s"
                    values="14;0"
                  />
                </path>
              </g>
            </svg>
          </Transition>
        </span>

        <h1
          class="text-3xl font-medium text-dashboard-heading-blue tracking-tighter text-center mt-5"
        >
          You're Invited.
        </h1>
        <p class="text-center text-dashboard-text text-sm mt-2 w-[90%]">
          <span class="font-medium text-dashboard-heading">{{
            invitationView.email
          }}</span>
          has been invited to Vent CT service as
          <span class="font-medium text-dashboard-heading">{{
            invitationView.role
          }}</span
          >. One last step, set a password to activate your account.
        </p>
        <p
          v-if="invitationView.expiresAt"
          class="text-center text-dashboard-text text-xs mt-2"
        >
          This invite expires on {{ invitationView.expiresAt }}.
        </p>
      </div>

      <AppButton
        @click="acceptInvitation"
        :block="false"
        size="sm"
        color="primary"
        type="button"
      >
        Continue To Set Password
      </AppButton>
    </template>
  </AppAuthLayoutTwo>
</template>
