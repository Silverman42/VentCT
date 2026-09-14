<script setup lang="ts">
import {
  getDeepLinkTypeLabel,
  type DeepLink,
  useDeepLinkStore,
} from "../composables/useDeepLinkStore";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const sideModal = ref<SideModalController | null>(null);
const deepLinkId = ref("");
const { getDeepLinkById } = useDeepLinkStore();

/** Maps the selected deep-link ID to one safe side-panel view model. */
const profile = computed<DeepLink | null>(() =>
  getDeepLinkById(deepLinkId.value) ?? null,
);

/** Opens the requested deep-link details in the shared side-modal primitive. */
const open = (id: string): void => {
  deepLinkId.value = id;
  sideModal.value?.showDialogBox();
};

/** Closes the detail panel and clears the transient selected identifier. */
const close = (): void => {
  sideModal.value?.hideDialogBox();
  deepLinkId.value = "";
};

/** Formats the stored deep-link type as the supplied detail subtitle. */
const typeDescription = (deepLink: DeepLink): string => {
  if (deepLink.type === "route") return "open in an in-app screen";
  if (deepLink.type === "referral") return "sign up with a code";
  return "open URL";
};

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="sideModal" close-button-position="inside">
    <section v-if="profile" class="flex min-h-full flex-col gap-7 pr-1">
      <header class="border-b border-dashboard-card-border pb-6 pr-12">
        <p class="text-sm text-dashboard-text">View deep link details</p>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <h2 class="text-2xl font-medium tracking-tight text-dashboard-heading">
            {{ profile.name }}
          </h2>
          <AppPills :color="profile.status === 'active' ? 'green' : 'gray'">
            {{ profile.status === 'active' ? 'Active' : 'Inactive' }}
          </AppPills>
        </div>
        <p class="mt-2 text-sm text-dashboard-text">
          {{ getDeepLinkTypeLabel(profile.type) }} - {{ typeDescription(profile) }}
        </p>
        <p class="mt-2 text-sm text-dashboard-text">
          Provider - {{ profile.provider }} &nbsp; Created - {{ profile.createdAt }} &nbsp; Clicks - {{ profile.clicks }}
        </p>
      </header>

      <dl class="space-y-6">
        <div>
          <dt class="text-sm text-dashboard-text">Target</dt>
          <dd class="mt-1 break-all text-base font-medium text-dashboard-heading">{{ profile.target }}</dd>
        </div>
        <div>
          <dt class="text-sm text-dashboard-text">Generated link</dt>
          <dd class="mt-1">
            <AppClipBoard
              :text="profile.generatedLink"
              toast-title="Link Copied"
              toast-message="Deep link copied to clipboard successfully"
              class="justify-start break-all text-brand-color-default"
            >
              <span class="break-all text-base font-medium text-brand-color-default">{{ profile.generatedLink }}</span>
            </AppClipBoard>
          </dd>
        </div>
      </dl>

      <section class="border-t border-dashboard-card-border pt-6" aria-labelledby="link-preview-heading">
        <h3 id="link-preview-heading" class="text-lg font-medium tracking-tight text-dashboard-heading">
          Link Preview
        </h3>
        <p class="mt-1 text-sm text-dashboard-text">Shown when the link is posted.</p>
        <dl class="mt-6 space-y-5">
          <div>
            <dt class="text-sm text-dashboard-text">Preview Title</dt>
            <dd class="mt-1 text-base font-medium text-dashboard-heading">{{ profile.preview.title }}</dd>
          </div>
          <div>
            <dt class="text-sm text-dashboard-text">Preview Description</dt>
            <dd class="mt-1 text-base text-dashboard-heading">{{ profile.preview.description }}</dd>
          </div>
          <div>
            <dt class="text-sm text-dashboard-text">Preview Image</dt>
            <dd class="mt-3">
              <img
                :src="profile.preview.imageUrl || '/img/logo_primary.svg'"
                alt="Deep link preview"
                class="h-44 w-full rounded-xl border border-dashboard-card-border bg-dashboard-bg-dark object-contain p-5"
              />
            </dd>
          </div>
        </dl>
      </section>
    </section>

    <DeepLinkViewShimmer v-else />
  </AppSideModal>
</template>
