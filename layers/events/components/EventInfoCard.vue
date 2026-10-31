<script setup lang="ts">
/** Shows an event's description, linked campaign, check-in setting and registration link. */
const props = defineProps<{
  description: string;
  hasDescription: boolean;
  campaignName: string;
  campaignId: string;
  hasCampaign: boolean;
  autoCheckIn: boolean;
  registrationUrl: string;
  hasRegistrationUrl: boolean;
}>();

/** Route to the linked campaign's detail page. */
const campaignRoute = computed(() => `/campaigns/${props.campaignId}`);
</script>

<template>
  <section
    class="grid grid-cols-1 gap-5 rounded-[14px] border border-dashboard-card-border bg-dashboard-bg p-5 sm:grid-cols-2 lg:grid-cols-4"
    aria-label="Event information"
  >
    <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
      <p class="text-xs text-dashboard-text">Description</p>
      <p
        v-if="props.hasDescription"
        class="whitespace-pre-line text-sm leading-6 text-dashboard-heading"
      >
        {{ props.description }}
      </p>
      <p v-else class="text-sm text-dashboard-text">No description</p>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5">
      <p class="text-xs text-dashboard-text">Campaign</p>
      <NuxtLink
        v-if="props.hasCampaign"
        :to="campaignRoute"
        class="truncate text-sm font-medium text-brand-color-005 hover:underline dark:text-brand-color-default"
      >
        {{ props.campaignName }}
      </NuxtLink>
      <p v-else class="text-sm text-dashboard-text">—</p>
    </div>

    <div class="flex flex-col items-start gap-1.5">
      <p class="text-xs text-dashboard-text">Auto check-in on scan</p>
      <AppPills :color="props.autoCheckIn ? 'green' : 'gray'" class="text-xs">
        {{ props.autoCheckIn ? "On" : "Off" }}
      </AppPills>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
      <p class="text-xs text-dashboard-text">Registration link</p>
      <AppClipBoard
        v-if="props.hasRegistrationUrl"
        :text="props.registrationUrl"
        toast-title="Link copied"
        toast-message="The registration link has been copied to your clipboard."
        icon-size="1rem"
        class="min-w-0 !justify-start"
      >
        <span class="truncate text-sm text-dashboard-heading">
          {{ props.registrationUrl }}
        </span>
      </AppClipBoard>
      <p v-else class="text-sm text-dashboard-text">—</p>
    </div>
  </section>
</template>
