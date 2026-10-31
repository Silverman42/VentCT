<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, maxLength, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import {
  type ICreateAudiencePayload,
  useAudienceStore,
} from "../composables/useAudienceStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

/** Local form model; optional API fields are kept as empty strings/booleans. */
interface IAudienceForm {
  campaignId: string;
  promoterId: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  hasTransacted: boolean;
}

const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const promoterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const fullNameInput = ref<HTMLInputElement | null>(null);

const { createAudience, creatingAudience } = useAudienceStore();
const { campaignOptions, fetchingCampaignOptions, fetchCampaignOptions } =
  useCampaignStore();
const { promoterOptions, fetchingPromoterOptions, fetchPromoterOptions } =
  usePromotersStore();

/** Returns a blank form model. */
const emptyForm = (): IAudienceForm => ({
  campaignId: "",
  promoterId: "",
  name: "",
  email: "",
  phone: "",
  isVerified: false,
  hasTransacted: false,
});

const form = reactive<IAudienceForm>(emptyForm());

/** Vuelidate validation rules mirroring the API's request rules. */
const validations = computed(() => ({
  campaignId: {
    required: helpers.withMessage("Campaign is required", required),
  },
  name: {
    required: helpers.withMessage("Full name is required", required),
    maxLength: helpers.withMessage(
      "Full name may not exceed 255 characters",
      maxLength(255),
    ),
  },
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Enter a valid email address", email),
    maxLength: helpers.withMessage(
      "Email may not exceed 255 characters",
      maxLength(255),
    ),
  },
  phone: {
    maxLength: helpers.withMessage(
      "Phone may not exceed 50 characters",
      maxLength(50),
    ),
  },
  promoterId: {},
}));

const v$ = useVuelidate(validations, form);

/** Name of the selected campaign for the dropdown trigger. */
const campaignLabel = computed(
  () =>
    campaignOptions.value.find((campaign) => campaign.id === form.campaignId)
      ?.name ?? "Select campaign",
);

/** Name of the selected promoter, or a hint when no campaign is chosen. */
const promoterLabel = computed(() => {
  if (!form.campaignId) return "Select a campaign first";
  return (
    promoterOptions.value.find((promoter) => promoter.id === form.promoterId)
      ?.name ?? "Select promoter (optional)"
  );
});

/** Restores default form inputs and clears validation state. */
const resetForm = (): void => {
  Object.assign(form, emptyForm());
  promoterOptions.value = [];
  v$.value.$reset();
};

/** Opens the modal, loads campaign options if needed and focuses the name field. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  if (!campaignOptions.value.length) {
    void fetchCampaignOptions().catch(() => undefined);
  }
  await nextTick();
  fullNameInput.value?.focus();
};

/** Closes the New Audience creation modal. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/**
 * Selects a campaign, clears the promoter (it must belong to the campaign)
 * and loads that campaign's promoters.
 */
const selectCampaign = (campaignId: string): void => {
  campaignDropdown.value?.closeDropdown();
  v$.value.campaignId.$touch();
  if (form.campaignId === campaignId) return;

  form.campaignId = campaignId;
  form.promoterId = "";
  void fetchPromoterOptions(campaignId).catch(() => undefined);
};

/** Selects a promoter (empty to clear) and closes the selection menu. */
const selectPromoter = (promoterId: string): void => {
  form.promoterId = promoterId;
  promoterDropdown.value?.closeDropdown();
};

/** Validates inputs and records the new audience member. */
const submit = async (): Promise<void> => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const payload: ICreateAudiencePayload = {
    campaignId: form.campaignId,
    name: form.name,
    email: form.email,
    promoterId: form.promoterId || undefined,
    phone: form.phone || undefined,
    isVerified: form.isVerified,
    hasTransacted: form.hasTransacted,
  };

  try {
    await createAudience(payload);
    close();
  } catch {
    // Reported by the store through ApiErrorHandler.
  }
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="580px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <!-- Modal Header -->
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          New Audience
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Add new audience
        </p>
      </div>

      <!-- Form Inputs Container -->
      <div class="space-y-4 py-3">
        <!-- Campaign Selection Dropdown -->
        <AppInputContainer
          label="Campaign"
          for="new-audience-campaign"
          :error="
            v$.campaignId.$error
              ? String(v$.campaignId.$errors[0]?.$message ?? '')
              : ''
          "
        >
          <AppDropdown
            ref="campaignDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="new-audience-campaign"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.campaignId.$error"
              aria-haspopup="listbox"
            >
              <span class="truncate">{{ campaignLabel }}</span>
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
                class="max-h-60 min-w-56 space-y-1 overflow-y-auto"
              >
                <div v-if="fetchingCampaignOptions" class="space-y-1 p-1">
                  <span
                    v-for="row in 4"
                    :key="row"
                    class="block h-8 w-full rounded-md shimmer-bg"
                  />
                </div>
                <p
                  v-else-if="!campaignOptions.length"
                  class="px-3 py-2 text-sm text-dashboard-text"
                >
                  No campaigns available
                </p>
                <template v-else>
                  <button
                    v-for="campaign in campaignOptions"
                    :key="campaign.id"
                    type="button"
                    role="option"
                    :aria-selected="form.campaignId === campaign.id"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': form.campaignId === campaign.id,
                    }"
                    @click="selectCampaign(campaign.id)"
                  >
                    {{ campaign.name }}
                  </button>
                </template>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <!-- Full Name Input -->
        <AppInputContainer
          label="Full Name"
          for="new-audience-name"
          :error="
            v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''
          "
        >
          <input
            id="new-audience-name"
            ref="fullNameInput"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            placeholder="e.g. Clement Ikhide"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </AppInputContainer>

        <!-- Email Address Input -->
        <AppInputContainer
          label="Email Address"
          for="new-audience-email"
          :error="
            v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''
          "
        >
          <input
            id="new-audience-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </AppInputContainer>

        <!-- Phone Input -->
        <AppInputContainer
          label="Phone (optional)"
          for="new-audience-phone"
          :error="
            v$.phone.$error ? String(v$.phone.$errors[0]?.$message ?? '') : ''
          "
        >
          <input
            id="new-audience-phone"
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            placeholder="+234-"
            :aria-invalid="v$.phone.$error"
            @input="v$.phone.$touch()"
          />
        </AppInputContainer>

        <!-- Promoter Dropdown -->
        <AppInputContainer
          label="Promoter"
          for="new-audience-promoter"
        >
          <AppDropdown
            ref="promoterDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="new-audience-promoter"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none disabled:cursor-not-allowed disabled:opacity-60"
              aria-haspopup="listbox"
              :disabled="!form.campaignId"
            >
              <span class="truncate">{{ promoterLabel }}</span>
              <Icon
                name="vent:arrow-down"
                size="1rem"
                class="shrink-0 text-dashboard-text"
              />
            </button>
            <template #dropdown_body>
              <div
                role="listbox"
                aria-label="Promoter"
                class="max-h-60 min-w-56 space-y-1 overflow-y-auto"
              >
                <div v-if="fetchingPromoterOptions" class="space-y-1 p-1">
                  <span
                    v-for="row in 4"
                    :key="row"
                    class="block h-8 w-full rounded-md shimmer-bg"
                  />
                </div>
                <p
                  v-else-if="!promoterOptions.length"
                  class="px-3 py-2 text-sm text-dashboard-text"
                >
                  No promoters in this campaign
                </p>
                <template v-else>
                  <button
                    type="button"
                    role="option"
                    :aria-selected="!form.promoterId"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-text transition hover:bg-dashboard-bg-dark"
                    :class="{ 'bg-dashboard-bg-dark': !form.promoterId }"
                    @click="selectPromoter('')"
                  >
                    No promoter
                  </button>
                  <button
                    v-for="promoter in promoterOptions"
                    :key="promoter.id"
                    type="button"
                    role="option"
                    :aria-selected="form.promoterId === promoter.id"
                    class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                    :class="{
                      'bg-dashboard-bg-dark': form.promoterId === promoter.id,
                    }"
                    @click="selectPromoter(promoter.id)"
                  >
                    {{ promoter.name }}
                  </button>
                </template>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <!-- Status Flags -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          <div class="inline-flex items-center gap-2.5">
            <AppCheckbox
              id="new-audience-verified"
              v-model:is-selected="form.isVerified"
            />
            <label
              for="new-audience-verified"
              class="text-sm text-dashboard-heading"
            >
              KYC verified
            </label>
          </div>
          <div class="inline-flex items-center gap-2.5">
            <AppCheckbox
              id="new-audience-transacted"
              v-model:is-selected="form.hasTransacted"
            />
            <label
              for="new-audience-transacted"
              class="text-sm text-dashboard-heading"
            >
              Has transacted
            </label>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-start">
        <AppButton
          size="md"
          type="submit"
          :block="false"
          color="primary"
          :loading="creatingAudience"
          class="min-w-32"
        >
          Create
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
