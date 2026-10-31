<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { helpers, integer, minValue, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import {
  EVENT_STATUS_LABELS,
  type EventStatus,
  type IEvent,
  type IUpdateEventPayload,
} from "../composables/useEventStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

type EventFormMode = "create" | "edit";

interface EventForm {
  campaign_id: string;
  name: string;
  target: number | null;
  venue: string;
  /** `yyyy-MM-ddTHH:mm`, as produced by AppDatePicker with `enableTime`. */
  date: string;
  status: EventStatus;
  description: string;
  auto_check_in_on_scan: boolean;
}

const { createEvent, creatingEvent, updateEvent, updatingEvent } =
  useEventStore();
const { campaignOptions, fetchingCampaignOptions, fetchCampaignOptions } =
  useCampaignStore();

const modal = ref<ModalController | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const mode = ref<EventFormMode>("create");
const editingEventId = ref<string | null>(null);
const campaignsFailed = ref(false);

const statusOptions: EventStatus[] = [
  "pending",
  "running",
  "completed",
  "cancelled",
];

const form = reactive<EventForm>({
  campaign_id: "",
  name: "",
  target: null,
  venue: "",
  date: "",
  status: "pending",
  description: "",
  auto_check_in_on_scan: true,
});

/** Whether the modal is editing an existing event. */
const isEditing = computed(() => mode.value === "edit");

/** Loading flag for whichever submit action is active. */
const submitting = computed(() =>
  isEditing.value ? updatingEvent.value : creatingEvent.value,
);

/** Name of the selected campaign, or a placeholder while none is chosen. */
const selectedCampaignLabel = computed(
  () =>
    campaignOptions.value.find((campaign) => campaign.id === form.campaign_id)
      ?.name ?? "Select campaign",
);

/** Vuelidate rules for the event form; the campaign is only required on create. */
const validations = computed(() => ({
  campaign_id: isEditing.value
    ? {}
    : { required: helpers.withMessage("Select a campaign", required) },
  name: { required: helpers.withMessage("Event name is required", required) },
  target: {
    required: helpers.withMessage("Target is required", required),
    integer: helpers.withMessage("Target must be a whole number", integer),
    minValue: helpers.withMessage("Target must be at least 1", minValue(1)),
  },
  venue: { required: helpers.withMessage("Venue is required", required) },
  date: { required: helpers.withMessage("Date and time are required", required) },
  status: { required: helpers.withMessage("Select a status", required) },
  description: {},
  auto_check_in_on_scan: {},
}));

const v$ = useVuelidate(validations, form);

/** Returns the first validation message for a field, or an empty string. */
const fieldError = (field: keyof EventForm): string =>
  v$.value[field]?.$error
    ? String(v$.value[field]?.$errors[0]?.$message ?? "")
    : "";

/** Converts an API ISO date-time into the date picker's `yyyy-MM-ddTHH:mm` value. */
const toPickerDate = (value?: string): string =>
  value ? DateFormatter.formatWithPattern(value, "yyyy-MM-dd'T'HH:mm") : "";

/** Converts the picker value into the API's `YYYY-MM-DD HH:mm:ss` format. */
const toApiDate = (value: string): string =>
  `${value.replace("T", " ")}${value.length === 16 ? ":00" : ""}`;

/** Fills the form from an event, or restores empty values, and clears validation. */
const resetForm = (event?: IEvent): void => {
  form.campaign_id = event?.campaignId ?? "";
  form.name = event?.name ?? "";
  form.target = event?.target ?? null;
  form.venue = event?.venue ?? "";
  form.date = toPickerDate(event?.eventDate);
  form.status = event?.status ?? "pending";
  form.description = event?.description ?? "";
  form.auto_check_in_on_scan = event?.autoCheckInOnScan ?? true;
  v$.value.$reset();
};

/** Loads campaign options for the selector, recording failures for the retry state. */
const loadCampaigns = async (): Promise<void> => {
  campaignsFailed.value = false;
  try {
    await fetchCampaignOptions();
  } catch {
    campaignsFailed.value = true;
  }
};

/**
 * Opens the form. Passing an event switches to edit mode and prefills it;
 * otherwise a clean create form is shown and campaign options are loaded.
 */
const open = async (event?: IEvent): Promise<void> => {
  mode.value = event ? "edit" : "create";
  editingEventId.value = event?.id ?? null;
  resetForm(event);
  modal.value?.showDialogBox();
  if (!event) void loadCampaigns();
  await nextTick();
  nameInput.value?.focus();
};

/** Closes the modal without saving. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects a campaign and closes the campaign menu. */
const selectCampaign = (campaignId: string): void => {
  form.campaign_id = campaignId;
  v$.value.campaign_id?.$touch();
  campaignDropdown.value?.closeDropdown();
};

/** Selects an event status and closes the status menu. */
const selectStatus = (status: EventStatus): void => {
  form.status = status;
  v$.value.status.$touch();
  statusDropdown.value?.closeDropdown();
};

/** Validates the form, then creates or updates the event. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const payload: IUpdateEventPayload = {
    name: form.name,
    venue: form.venue,
    event_date: toApiDate(form.date),
    description: form.description || undefined,
    status: form.status,
    target: Number(form.target),
    auto_check_in_on_scan: form.auto_check_in_on_scan,
  };

  try {
    if (isEditing.value && editingEventId.value) {
      await updateEvent(editingEventId.value, payload);
    } else {
      await createEvent({
        ...payload,
        campaign_id: form.campaign_id,
      } as Parameters<typeof createEvent>[0]);
    }
    close();
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="600px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <h2
        class="pb-5 text-xl font-medium tracking-tight text-dashboard-heading"
      >
        {{ isEditing ? "Edit Event" : "New Event" }}
      </h2>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div v-if="!isEditing" class="md:col-span-2">
          <AppInputContainer
            label="Campaign"
            for="new-event-campaign"
            :error="fieldError('campaign_id')"
          >
            <span
              v-if="fetchingCampaignOptions"
              class="block h-6 w-full rounded-md shimmer-bg"
              aria-label="Loading campaigns"
            />
            <button
              v-else-if="campaignsFailed"
              id="new-event-campaign"
              type="button"
              class="w-full text-left text-sm text-dashboard-text"
              @click="loadCampaigns"
            >
              Couldn't load campaigns. Tap to retry.
            </button>
            <p
              v-else-if="!campaignOptions.length"
              id="new-event-campaign"
              class="text-sm text-dashboard-text"
            >
              No campaigns available. Create a campaign first.
            </p>
            <AppDropdown
              v-else
              ref="campaignDropdown"
              position="left"
              :width-is-finite="false"
              :container-full="true"
            >
              <button
                id="new-event-campaign"
                type="button"
                class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
                :aria-invalid="v$.campaign_id?.$error"
                aria-haspopup="listbox"
              >
                <span class="truncate">{{ selectedCampaignLabel }}</span>
                <Icon
                  name="vent:arrow-down"
                  size="1rem"
                  class="shrink-0 text-dashboard-text"
                />
              </button>
              <template #dropdown_body>
                <div
                  role="listbox"
                  aria-label="Campaign"
                  class="max-h-64 min-w-56 space-y-1 overflow-y-auto"
                >
                  <button
                    v-for="campaign in campaignOptions"
                    :key="campaign.id"
                    type="button"
                    role="option"
                    :aria-selected="form.campaign_id === campaign.id"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': form.campaign_id === campaign.id,
                    }"
                    @click="selectCampaign(campaign.id)"
                  >
                    {{ campaign.name }}
                  </button>
                </div>
              </template>
            </AppDropdown>
          </AppInputContainer>
        </div>

        <AppInputContainer
          label="Name"
          for="new-event-name"
          :error="fieldError('name')"
        >
          <input
            id="new-event-name"
            ref="nameInput"
            v-model.trim="form.name"
            type="text"
            placeholder="e.g outdoor movie rave"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Target"
          for="new-event-target"
          :error="fieldError('target')"
        >
          <input
            id="new-event-target"
            v-model.number="form.target"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="e.g 100"
            :aria-invalid="v$.target.$error"
            @blur="v$.target.$touch()"
          />
        </AppInputContainer>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Venue"
            for="new-event-venue"
            :error="fieldError('venue')"
          >
            <input
              id="new-event-venue"
              v-model.trim="form.venue"
              type="text"
              placeholder="e.g University of benin, benin city"
              :aria-invalid="v$.venue.$error"
              @blur="v$.venue.$touch()"
            />
          </AppInputContainer>
        </div>

        <AppInputContainer
          label="Date & time"
          for="new-event-date"
          :error="fieldError('date')"
        >
          <AppDatePicker
            id="new-event-date"
            v-model="form.date"
            enable-time
            placeholder="Select event date"
            :invalid="v$.date.$error"
            @closed="v$.date.$touch()"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Status"
          for="new-event-status"
          :error="fieldError('status')"
        >
          <AppDropdown
            ref="statusDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="new-event-status"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.status.$error"
              aria-haspopup="listbox"
            >
              {{ EVENT_STATUS_LABELS[form.status] }}
              <Icon
                name="vent:arrow-down"
                size="1rem"
                class="shrink-0 text-dashboard-text"
              />
            </button>
            <template #dropdown_body>
              <div
                role="listbox"
                aria-label="Status"
                class="min-w-56 space-y-1"
              >
                <button
                  v-for="option in statusOptions"
                  :key="option"
                  type="button"
                  role="option"
                  :aria-selected="form.status === option"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.status === option }"
                  @click="selectStatus(option)"
                >
                  {{ EVENT_STATUS_LABELS[option] }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <div class="md:col-span-2">
          <AppInputContainer
            label="Description (optional)"
            for="new-event-description"
          >
            <textarea
              id="new-event-description"
              v-model.trim="form.description"
              rows="3"
              placeholder="What is this event about?"
              class="w-full resize-none bg-transparent outline-none"
            />
          </AppInputContainer>
        </div>

        <div
          class="flex items-center justify-between gap-4 rounded-lg border border-dashboard-card-border px-4 py-3 md:col-span-2"
        >
          <div>
            <p class="text-sm font-medium text-dashboard-heading">
              Auto check-in on scan
            </p>
            <p class="text-xs text-dashboard-text">
              Mark attendees as attended when they register via the QR code.
            </p>
          </div>
          <AppSwitch
            id="new-event-auto-check-in"
            v-model:is-selected="form.auto_check_in_on_scan"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <AppButton
          size="md"
          type="submit"
          color="primary"
          :loading="submitting"
          class="min-w-28"
        >
          Save
        </AppButton>
        <AppButton
          size="md"
          type="button"
          color="primary"
          outlined
          class="min-w-28"
          @click="close"
        >
          Cancel
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
