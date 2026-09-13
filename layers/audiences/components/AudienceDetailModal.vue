<script setup lang="ts">
import type { IAudienceMember } from "../composables/useAudienceMockData";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const modal = ref<ModalController | null>(null);
const audience = ref<IAudienceMember | null>(null);

/** Opens the View Audience modal and populates its record state. */
const open = (data: IAudienceMember): void => {
  audience.value = data;
  modal.value?.showDialogBox();
};

/** Closes the View Audience modal and resets selection state. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Extracts the first uppercase letter of the audience member's name for avatar rendering. */
const getInitial = computed(() => {
  if (!audience.value?.name) return "A";
  return audience.value.name.charAt(0).toUpperCase();
});

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="520px">
    <div v-if="audience" class="flex flex-col gap-6">
      <!-- Modal Title Header -->
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          View Audience
        </h2>
        <p class="text-xs text-dashboard-text">
          View audience details and status
        </p>
      </div>

      <!-- Profile Header Block -->
      <div class="flex items-start gap-4">
        <!-- Initials Circle Avatar -->
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#032B43] text-lg font-semibold text-white">
          {{ getInitial }}
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-lg font-medium text-dashboard-heading">
            {{ audience.name }}
          </h3>
          <p class="text-xs text-dashboard-text">
            {{ audience.campaign }}
          </p>
          <p class="text-xs text-dashboard-text">
            Promoter - {{ audience.promoter }}
          </p>
          <div class="mt-1">
            <AppPills :color="audience.isVerified ? 'green' : 'orange'">
              {{ audience.isVerified ? 'Verified' : 'Not verified' }}
            </AppPills>
          </div>
        </div>
      </div>

      <!-- Contact Information Section -->
      <div class="flex flex-col gap-3">
        <h4 class="text-sm font-medium text-dashboard-heading">
          Contact Information
        </h4>

        <div class="flex flex-col divide-y divide-dashboard-card-border rounded-2xl border border-dashboard-card-border bg-dashboard-bg p-4 text-xs">
          <!-- Email row -->
          <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dashboard-bg-dark text-dashboard-text">
              <Icon name="vent:sms" size="1.1rem" />
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] text-dashboard-text">Email</span>
              <span class="font-medium text-dashboard-heading">
                {{ audience.email }}
              </span>
            </div>
          </div>

          <!-- Phone row -->
          <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dashboard-bg-dark text-dashboard-text">
              <Icon name="vent:call" size="1.1rem" />
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] text-dashboard-text">Phone</span>
              <span class="font-medium text-dashboard-heading">
                {{ audience.phone }}
              </span>
            </div>
          </div>

          <!-- Joined Date row -->
          <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dashboard-bg-dark text-dashboard-text">
              <Icon name="vent:calendar-2" size="1.1rem" />
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] text-dashboard-text">Joined</span>
              <span class="font-medium text-dashboard-heading">
                {{ audience.joinedDate }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="mt-2 flex justify-start">
        <AppButton
          size="md"
          type="button"
          :block="false"
          outlined
          color="primary"
          class="min-w-36"
          @click="close"
        >
          Close
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>
