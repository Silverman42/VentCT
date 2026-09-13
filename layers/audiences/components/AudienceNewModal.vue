<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import {
  type ICreateAudiencePayload,
  useAudienceStore,
} from "../composables/useAudienceStore";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = withDefaults(
  defineProps<{
    campaignOptions?: string[];
    promoterOptions?: string[];
  }>(),
  {
    campaignOptions: () => [
      "Outdoor Movie Rave 2.0",
      "Campus Ambassador Program (CAP)",
      "Advert",
      "Freshers Connect",
    ],
    promoterOptions: () => [
      "Mercy",
      "Kay Kay",
      "Trans Connect",
      "Boluwatife",
      "Naskid",
    ],
  },
);

const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const promoterDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const fullNameInput = ref<HTMLInputElement | null>(null);

const { createAudience, creatingAudience } = useAudienceStore();

const form = reactive<ICreateAudiencePayload>({
  campaign: "Outdoor Movie Rave 2.0",
  name: "",
  email: "",
  phone: "",
  promoter: "",
});

/** Vuelidate validation rules for creating an audience record. */
const validations = computed(() => ({
  campaign: {
    required: helpers.withMessage("Campaign is required", required),
  },
  name: {
    required: helpers.withMessage("Full name is required", required),
  },
  email: {
    required: helpers.withMessage("Email address is required", required),
    email: helpers.withMessage("Enter a valid email address", email),
  },
  phone: {
    required: helpers.withMessage("Phone number is required", required),
  },
  promoter: {},
}));

const v$ = useVuelidate(validations, form);

/** Restores default form inputs and clears validation state. */
const resetForm = (): void => {
  form.campaign = props.campaignOptions[0] ?? "Outdoor Movie Rave 2.0";
  form.name = "";
  form.email = "";
  form.phone = "";
  form.promoter = "";
  v$.value.$reset();
};

/** Opens the New Audience creation modal and sets focus. */
const open = async (): Promise<void> => {
  resetForm();
  modal.value?.showDialogBox();
  await nextTick();
  fullNameInput.value?.focus();
};

/** Closes the New Audience creation modal. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Selects a campaign and closes the selection menu. */
const selectCampaign = (campaign: string): void => {
  form.campaign = campaign;
  v$.value.campaign.$touch();
  campaignDropdown.value?.closeDropdown();
};

/** Selects a promoter and closes the selection menu. */
const selectPromoter = (promoter: string): void => {
  form.promoter = promoter;
  promoterDropdown.value?.closeDropdown();
};

/** Validates inputs and creates the new audience record. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  try {
    await createAudience({ ...form });
    close();
    useToastHandler().triggerToast(
      "New audience member has been added successfully.",
      "success",
      "Audience added",
      "large",
    );
  } catch {
    // Handled in store via ApiErrorHandler
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
            v$.campaign.$error
              ? String(v$.campaign.$errors[0]?.$message ?? '')
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
              :aria-invalid="v$.campaign.$error"
              aria-haspopup="listbox"
            >
              {{ form.campaign || 'Select campaign' }}
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
                <button
                  v-for="option in props.campaignOptions"
                  :key="option"
                  type="button"
                  role="option"
                  :aria-selected="form.campaign === option"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.campaign === option }"
                  @click="selectCampaign(option)"
                >
                  {{ option }}
                </button>
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
          label="Phone"
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
            @blur="v$.phone.$touch()"
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
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              aria-haspopup="listbox"
            >
              {{ form.promoter || 'Select promoter' }}
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
                <button
                  v-for="option in props.promoterOptions"
                  :key="option"
                  type="button"
                  role="option"
                  :aria-selected="form.promoter === option"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': form.promoter === option }"
                  @click="selectPromoter(option)"
                >
                  {{ option }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>
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
