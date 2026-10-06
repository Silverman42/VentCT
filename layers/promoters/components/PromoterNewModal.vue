<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface PromoterCreatePayload {
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  referralCode: string;
  campaign: string;
  image: File | null;
}

const props = defineProps<{
  campaignOptions: string[];
}>();

const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const form = reactive<PromoterCreatePayload>({
  name: "",
  email: "",
  phone: "",
  joinedDate: "2026-04-01",
  referralCode: "",
  campaign: "Outdoor Movie Rave 2.0 (OAU)",
  image: null,
});

/** Defines validation feedback for a locally validated promoter draft. */
const validations = computed(() => ({
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
  joinedDate: {
    required: helpers.withMessage("Date is required", required),
  },
  referralCode: {
    required: helpers.withMessage("Referral code is required", required),
  },
  campaign: {
    required: helpers.withMessage("Select a campaign", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Restores the screenshot-backed creation defaults and validation state. */
const resetForm = (): void => {
  form.name = "";
  form.email = "";
  form.phone = "";
  form.joinedDate = "2026-04-01";
  form.referralCode = "";
  form.campaign = props.campaignOptions.includes("Outdoor Movie Rave 2.0 (OAU)")
    ? "Outdoor Movie Rave 2.0 (OAU)"
    : (props.campaignOptions[0] ?? "");
  form.image = null;
  v$.value.$reset();
};

/** Opens a fresh local promoter draft without persisting any state. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the form without persisting the local draft. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Updates the assigned campaign and closes the selection menu. */
const selectCampaign = (campaign: string): void => {
  form.campaign = campaign;
  v$.value.campaign.$touch();
  campaignDropdown.value?.closeDropdown();
};

/** Validates the fixture-only request and acknowledges that no record was created. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  close();
  useToastHandler().triggerToast(
    "Promoter details were validated locally and were not created.",
    "success",
    "Promoter validated",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="680px">
    <form class="pb-1" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          New Promoter
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">
          Add and assign promoters to campaign
        </p>
      </div>

      <div class="space-y-4 py-5">
        <PromoterFormField
          label="Full Name"
          for="new-promoter-name"
          :error="v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="new-promoter-name"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            placeholder="e.g. Clement Ikhide"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Email Address"
          for="new-promoter-email"
          :error="v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="new-promoter-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Phone"
          for="new-promoter-phone"
          :error="v$.phone.$error ? String(v$.phone.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="new-promoter-phone"
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            placeholder="+234-"
            :aria-invalid="v$.phone.$error"
            @blur="v$.phone.$touch()"
          />
        </PromoterFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PromoterFormField
            label="Date"
            for="new-promoter-date"
            :error="v$.joinedDate.$error ? String(v$.joinedDate.$errors[0]?.$message ?? '') : ''"
          >
            <AppDatePicker
              id="new-promoter-date"
              v-model="form.joinedDate"
              placeholder="Select date"
              :invalid="v$.joinedDate.$error"
              @closed="v$.joinedDate.$touch()"
            />
          </PromoterFormField>

          <PromoterFormField
            label="Referral Code"
            for="new-promoter-referral-code"
            :error="v$.referralCode.$error ? String(v$.referralCode.$errors[0]?.$message ?? '') : ''"
          >
            <input
              id="new-promoter-referral-code"
              v-model.trim="form.referralCode"
              type="text"
              autocomplete="off"
              placeholder="e.g. clement"
              :aria-invalid="v$.referralCode.$error"
              @blur="v$.referralCode.$touch()"
            />
          </PromoterFormField>
        </div>

        <PromoterFormField
          label="Campaign"
          for="new-promoter-campaign"
          :error="v$.campaign.$error ? String(v$.campaign.$errors[0]?.$message ?? '') : ''"
        >
          <AppDropdown
            ref="campaignDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="new-promoter-campaign"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.campaign.$error"
              aria-haspopup="listbox"
            >
              {{ form.campaign || 'Select a campaign' }}
              <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
            </button>
            <template #dropdown_body>
              <div role="listbox" aria-label="Campaign" class="max-h-64 min-w-56 space-y-1 overflow-y-auto">
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
        </PromoterFormField>

        <section aria-labelledby="new-promoter-image-heading">
          <h3 id="new-promoter-image-heading" class="mb-2 text-xs text-input-label">
            Upload Image <span class="text-dashboard-text">(optional)</span>
          </h3>
          <AppFileSelector
            v-model="form.image"
            variant="compact"
            :allowed-types="['image/png', 'image/jpeg', 'image/jpg', 'image/webp']"
            :max-size-in-mb="5"
          />
        </section>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-start">
        <AppButton size="md" type="button" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton size="md" type="submit" :block="false" color="primary">
          Add Promoter
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
