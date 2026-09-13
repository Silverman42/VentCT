<script setup lang="ts">
import { useVuelidate } from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import type { AppDropdown } from "#components";
import type { Promoter } from "../composables/usePromoterMockData";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

interface PromoterEditPayload {
  name: string;
  email: string;
  phone: string;
  campaign: string;
}

const props = defineProps<{
  promoter: Promoter;
  campaignOptions: string[];
}>();

const modal = ref<ModalController | null>(null);
const campaignDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const form = reactive<PromoterEditPayload>({
  name: props.promoter.name,
  email: props.promoter.email,
  phone: props.promoter.phone,
  campaign: props.promoter.campaign,
});

/** Defines validation feedback for editable promoter profile fields. */
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
  campaign: {
    required: helpers.withMessage("Select a campaign", required),
  },
}));

const v$ = useVuelidate(validations, form);

/** Restores profile values supplied by the fixture-backed detail page. */
const resetForm = (): void => {
  form.name = props.promoter.name;
  form.email = props.promoter.email;
  form.phone = props.promoter.phone;
  form.campaign = props.promoter.campaign;
  v$.value.$reset();
};

/** Opens the edit form with the latest supplied promoter profile values. */
const open = (): void => {
  resetForm();
  modal.value?.showDialogBox();
};

/** Closes the edit form without changing the fixture. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Assigns a campaign and dismisses the campaign selection menu. */
const selectCampaign = (campaign: string): void => {
  form.campaign = campaign;
  v$.value.campaign.$touch();
  campaignDropdown.value?.closeDropdown();
};

/** Validates edits locally and confirms that fixture data remains unchanged. */
const submit = async (): Promise<void> => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  close();
  useToastHandler().triggerToast(
    "Promoter profile changes were validated locally and were not saved.",
    "success",
    "Profile validated",
    "large",
  );
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="680px">
    <form class="flex pb-1 md:min-h-[760px] flex-col" novalidate @submit.prevent="submit">
      <div class="pb-5">
        <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
          Edit Profile
        </h2>
        <p class="mt-1 text-xs text-dashboard-text">Edit promoter profile</p>
      </div>

      <div class="space-y-4 py-5">
        <PromoterFormField
          label="Full Name"
          for="edit-promoter-name"
          :error="v$.name.$error ? String(v$.name.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="edit-promoter-name"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            :aria-invalid="v$.name.$error"
            @blur="v$.name.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Email Address"
          for="edit-promoter-email"
          :error="v$.email.$error ? String(v$.email.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="edit-promoter-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            :aria-invalid="v$.email.$error"
            @blur="v$.email.$touch()"
          />
        </PromoterFormField>

        <PromoterFormField
          label="Phone"
          for="edit-promoter-phone"
          :error="v$.phone.$error ? String(v$.phone.$errors[0]?.$message ?? '') : ''"
        >
          <input
            id="edit-promoter-phone"
            v-model.trim="form.phone"
            type="tel"
            autocomplete="tel"
            :aria-invalid="v$.phone.$error"
            @blur="v$.phone.$touch()"
          />
        </PromoterFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PromoterFormField label="Date" for="edit-promoter-date">
            <input
              id="edit-promoter-date"
              :value="promoter.joinedDate"
              type="text"
              disabled
              aria-label="Joined date"
              class="cursor-not-allowed opacity-70"
            />
          </PromoterFormField>

          <PromoterFormField label="Referral Code" for="edit-promoter-referral-code">
            <input
              id="edit-promoter-referral-code"
              :value="promoter.referralCode"
              type="text"
              disabled
              aria-label="Referral code"
              class="cursor-not-allowed opacity-70"
            />
          </PromoterFormField>
        </div>

        <PromoterFormField
          label="Campaign"
          for="edit-promoter-campaign"
          :error="v$.campaign.$error ? String(v$.campaign.$errors[0]?.$message ?? '') : ''"
        >
          <AppDropdown
            ref="campaignDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <button
              id="edit-promoter-campaign"
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
              :aria-invalid="v$.campaign.$error"
              aria-haspopup="listbox"
            >
              {{ form.campaign }}
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
      </div>

      <div class="mt-auto flex flex-col-reverse gap-3 pt-8 sm:flex-row sm:justify-start">
        <AppButton size="md" type="button" :block="false" outlined color="primary" @click="close">
          Cancel
        </AppButton>
        <AppButton size="md" type="submit" :block="false" color="primary">
          Save changes
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
