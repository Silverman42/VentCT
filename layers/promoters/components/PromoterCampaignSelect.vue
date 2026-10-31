<script setup lang="ts">
import type { AppDropdown } from "#components";

const props = defineProps<{
  /** Selected campaign id; empty when nothing is chosen. */
  modelValue: string;
  /** Id of the trigger button, matched by the field label. */
  id: string;
  /** Marks the trigger invalid for assistive technology. */
  invalid?: boolean;
  /** Campaign name shown before options load (e.g. from the promoter record). */
  fallbackLabel?: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [campaignId: string];
  /** Fired after a selection so the parent can touch its validation field. */
  selected: [];
}>();

const { campaignOptions, fetchingCampaignOptions, fetchCampaignOptions } =
  useCampaignStore();
const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

/** Name of the selected campaign, falling back to the supplied label. */
const selectedLabel = computed(
  () =>
    campaignOptions.value.find((campaign) => campaign.id === props.modelValue)
      ?.name ??
    props.fallbackLabel ??
    "Select a campaign",
);

/** Emits the chosen campaign id and closes the menu. */
const selectCampaign = (campaignId: string): void => {
  emit("update:modelValue", campaignId);
  emit("selected");
  dropdown.value?.closeDropdown();
};

onMounted(() => {
  if (!campaignOptions.value.length) {
    void fetchCampaignOptions().catch(() => undefined);
  }
});
</script>

<template>
  <AppDropdown
    ref="dropdown"
    position="left"
    :width-is-finite="false"
    :container-full="true"
  >
    <button
      :id="id"
      type="button"
      class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
      :aria-invalid="invalid"
      aria-haspopup="listbox"
    >
      <span class="truncate">{{ selectedLabel }}</span>
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
            :aria-selected="modelValue === campaign.id"
            class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
            :class="{ 'bg-dashboard-bg-dark': modelValue === campaign.id }"
            @click="selectCampaign(campaign.id)"
          >
            {{ campaign.name }}
          </button>
        </template>
      </div>
    </template>
  </AppDropdown>
</template>
