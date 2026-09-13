<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type { MarkAttendancePayload } from "../composables/useAttendanceStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const emit = defineEmits<{
  marked: [recordIds: string[]];
}>();

const { campaignOptions, defaultCampaign, records, getMarkingCandidates, markAttendance } =
  useAttendanceStore();
const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const searchInput = ref("");

const form = reactive<MarkAttendancePayload>({
  campaign: defaultCampaign,
  recordIds: [],
});

/** Defines validation feedback for the campaign and candidate selection. */
const validations = computed(() => ({
  campaign: {
    required: helpers.withMessage("Select a campaign", required),
  },
  recordIds: {
    required: helpers.withMessage("Select at least one attendee", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Lists pending candidates matching the active campaign and search query. */
const candidates = computed(() => {
  const query = searchInput.value.trim().toLocaleLowerCase();

  return getMarkingCandidates(form.campaign).filter((candidate) =>
    !query || [candidate.name, candidate.email].join(" ").toLocaleLowerCase().includes(query),
  );
});

/** Restores initial campaign selection and clears any pending candidate choices. */
const resetForm = (): void => {
  form.campaign = defaultCampaign;
  form.recordIds = [];
  searchInput.value = "";
  v$.value.$reset();
};

/** Opens the modal with pending table selections or the first available screenshot-backed candidate. */
const open = (preselectedIds: string[] = []): void => {
  resetForm();
  const firstSelectedRecord = records.value.find((record) =>
    preselectedIds.includes(record.id),
  );

  if (firstSelectedRecord) form.campaign = firstSelectedRecord.campaign;

  const availableCandidates = getMarkingCandidates(form.campaign);
  const candidateIds = new Set(availableCandidates.map((record) => record.id));
  const validPreselection = preselectedIds.filter((id) => candidateIds.has(id));
  form.recordIds = validPreselection.length
    ? validPreselection
    : availableCandidates[0]
      ? [availableCandidates[0].id]
      : [];
  modal.value?.showDialogBox();
};

/** Closes the modal without changing selected candidate state in the list. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Changes campaigns, resets candidates, and closes the selection menu. */
const selectCampaign = (campaign: string): void => {
  form.campaign = campaign;
  form.recordIds = [];
  v$.value.campaign.$touch();
  v$.value.recordIds.$reset();
  campaignDropdown.value?.closeDropdown();
};

/** Marks selected local candidates and returns focus to the updated list. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const submittedIds = [...form.recordIds];
  const markedCount = markAttendance({ ...form, recordIds: submittedIds });

  if (markedCount === 0) {
    v$.value.recordIds.$touch();
    return;
  }

  emit("marked", submittedIds);
  close();
  useToastHandler().triggerToast(
    `${markedCount} attendee${markedCount === 1 ? "" : "s"} marked as attended.`,
    "success",
    "Attendance updated",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="580px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Mark Attendance
        </h2>
        <p class="mt-1 text-sm text-dashboard-text">
          Mark attendance for this campaign
        </p>
      </div>

      <div class="space-y-4 py-5">
        <AppInputContainer
          label="Campaign"
          for="mark-attendance-campaign"
          :error="v$.campaign.$error ? String(v$.campaign.$errors[0]?.$message ?? '') : ''"
        >
          <AppDropdown
            ref="campaignDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="mark-attendance-campaign"
              type="button"
              class="flex min-h-11 w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.campaign.$error"
              aria-haspopup="listbox"
            >
              {{ form.campaign || 'Select a campaign' }}
              <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
            </button>
            <template #dropdown_body>
              <div role="listbox" aria-label="Campaign" class="max-h-64 min-w-60 space-y-1 overflow-y-auto">
                <button
                  v-for="campaign in campaignOptions"
                  :key="campaign"
                  type="button"
                  role="option"
                  :aria-selected="form.campaign === campaign"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.campaign === campaign }"
                  @click="selectCampaign(campaign)"
                >
                  {{ campaign }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <label class="relative block">
          <span class="sr-only">Search by name or email</span>
          <Icon
            name="vent:search-normal"
            size="1rem"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dashboard-text"
          />
          <input
            v-model="searchInput"
            type="search"
            placeholder="Search by name or email"
            class="w-full rounded-lg border border-input-border bg-dashboard-bg py-3 pr-3 pl-9 text-sm text-dashboard-heading outline-none transition placeholder:text-input-placeholder focus:border-brand-color-default focus:ring-2 focus:ring-brand-color-default/10"
          />
        </label>

        <section
          class="max-h-64 overflow-y-auto rounded-lg border border-dashboard-card-border p-2"
          aria-label="Pending campaign attendees"
        >
          <div
            v-for="candidate in candidates"
            :key="candidate.id"
            class="flex items-center gap-3 rounded-lg px-2 py-3 transition"
            :class="{ 'bg-brand-color-default/10': form.recordIds.includes(candidate.id) }"
          >
            <AppCheckbox
              :id="`mark-attendance-${candidate.id}`"
              v-model:is-selected="form.recordIds"
              :value="candidate.id"
              name="attendance-candidates"
              @change="v$.recordIds.$touch()"
            />
            <label :for="`mark-attendance-${candidate.id}`" class="min-w-0 cursor-pointer">
              <p class="truncate text-sm font-medium text-dashboard-heading">{{ candidate.name }}</p>
              <p class="truncate text-xs text-dashboard-text">{{ candidate.email }}</p>
            </label>
          </div>

          <p v-if="!candidates.length" class="px-3 py-8 text-center text-sm text-dashboard-text">
            No pending attendees match this campaign and search.
          </p>
        </section>
        <p v-if="v$.recordIds.$error" class="text-xs text-red-500" role="alert">
          {{ String(v$.recordIds.$errors[0]?.$message ?? '') }}
        </p>
      </div>

      <div class="flex pt-5">
        <AppButton size="md" type="submit" :block="false" color="primary">
          Mark Attendance
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
