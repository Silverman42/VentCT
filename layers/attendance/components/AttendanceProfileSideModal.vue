<script setup lang="ts">
import type { AttendanceRecord } from "../composables/useAttendanceStore";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const { getAttendanceById } = useAttendanceStore();
const sideModal = ref<SideModalController | null>(null);
const attendanceId = ref("");

/** Resolves the active record into safe display fields for the side panel. */
const profile = computed<AttendanceRecord | null>(() =>
  getAttendanceById(attendanceId.value) ?? null,
);

/** Opens a selected attendance record inside the shared side-modal primitive. */
const open = (id: string): void => {
  attendanceId.value = id;
  sideModal.value?.showDialogBox();
};

/** Dismisses the profile panel and clears its selected record after closing. */
const close = (): void => {
  sideModal.value?.hideDialogBox();
  attendanceId.value = "";
};

/** Maps activity tones to the screenshot's blue and green timeline markers. */
const getActivityTone = (tone: AttendanceRecord["activities"][number]["tone"]): string =>
  tone === "success" ? "bg-green-005" : "bg-brand-color-default";

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="sideModal" close-button-position="inside">
    <section v-if="profile" class="flex min-h-full flex-col gap-7 pr-1">
      <header class="border-b border-dashboard-card-border pb-6 pr-12">
        <p class="text-sm text-dashboard-text">Attendance Profile</p>
        <h2 class="mt-1 text-2xl font-medium tracking-tight text-dashboard-heading">
          {{ profile.name }}
        </h2>
        <p class="mt-1 text-base text-dashboard-text">{{ profile.campaign }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dashboard-text">
          <span class="inline-flex min-w-0 items-center gap-1.5">
            <Icon name="vent:direct-inbox" size="1rem" />
            <span class="truncate">{{ profile.email }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="vent:call" size="1rem" />
            {{ profile.phone }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="vent:calendar" size="1rem" />
            Registered {{ profile.createdAt }}
          </span>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-4">
        <section class="rounded-xl border border-dashboard-card-border bg-dashboard-bg p-5" aria-labelledby="attendance-details-heading">
          <h3 id="attendance-details-heading" class="text-lg font-medium tracking-tight text-dashboard-heading">
            Details
          </h3>
          <dl class="mt-5 space-y-5">
            <div class="flex items-start gap-3">
              <Icon name="vent:hashtag" size="1.1rem" class="mt-0.5 shrink-0 text-dashboard-text" />
              <div>
                <dt class="text-xs text-dashboard-text">Referral code</dt>
                <dd class="mt-0.5 text-base font-medium text-dashboard-heading">{{ profile.referralCode }}</dd>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="vent:profile-2user" size="1.1rem" class="mt-0.5 shrink-0 text-dashboard-text" />
              <div>
                <dt class="text-xs text-dashboard-text">Promoter</dt>
                <dd class="mt-0.5 text-base font-medium text-dashboard-heading">{{ profile.promoter }}</dd>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="vent:volume-high" size="1.1rem" class="mt-0.5 shrink-0 text-dashboard-text" />
              <div>
                <dt class="text-xs text-dashboard-text">Campaign</dt>
                <dd class="mt-0.5 text-base font-medium text-dashboard-heading">{{ profile.campaign }}</dd>
              </div>
            </div>
          </dl>
        </section>

        <section class="rounded-xl border border-dashboard-card-border bg-dashboard-bg p-5" aria-labelledby="attendance-activity-heading">
          <h3 id="attendance-activity-heading" class="text-lg font-medium tracking-tight text-dashboard-heading">
            Activity
          </h3>
          <ol class="mt-5 space-y-5">
            <li v-for="activity in profile.activities" :key="activity.id" class="flex items-start gap-3">
              <span :class="getActivityTone(activity.tone)" class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" aria-hidden="true" />
              <div>
                <p class="text-base font-medium text-dashboard-heading">{{ activity.title }}</p>
                <p class="mt-1 text-sm text-dashboard-text">{{ activity.timestamp }}</p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </section>
  </AppSideModal>
</template>
