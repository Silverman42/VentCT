<script setup lang="ts">
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import {
  DEEP_LINK_STATUS_LABELS,
  DEEP_LINK_TYPE_LABELS,
  type IDeepLink,
} from "../composables/useDeepLinkStore";

interface SideModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const emit = defineEmits<{
  edit: [deepLink: IDeepLink];
}>();

const sideModal = ref<SideModalController | null>(null);
const loadFailed = ref(false);
const { selectedDeepLink, fetchingDeepLinkDetails, fetchDeepLinkDetails } =
  useDeepLinkStore();

/** Formats an ISO timestamp as a date, or a dash when missing. */
const formatDate = (value?: string): string =>
  value ? DateFormatter.formatDate(value) : "—";

/** Maps the selected deep link into template-ready values with fallbacks. */
const profile = computed(() => {
  const deepLink = selectedDeepLink.value;
  if (!deepLink) return null;

  return {
    name: deepLink.name || "—",
    typeLabel:
      deepLink.type_label || DEEP_LINK_TYPE_LABELS[deepLink.type] || deepLink.type,
    provider: deepLink.provider
      ? deepLink.provider.charAt(0).toUpperCase() + deepLink.provider.slice(1)
      : "—",
    isActive: deepLink.status === "active",
    statusLabel:
      deepLink.status_label ||
      DEEP_LINK_STATUS_LABELS[deepLink.status] ||
      deepLink.status ||
      "Unknown",
    linkUrl: deepLink.link_url ?? "",
    target: deepLink.target || "—",
    referralCode: deepLink.referral_code ?? "",
    clicks: (deepLink.clicks_count ?? 0).toLocaleString("en-US"),
    createdAt: formatDate(deepLink.created_at),
    updatedAt: formatDate(deepLink.updated_at),
    creatorName: deepLink.creator?.name ?? "",
    creatorEmail: deepLink.creator?.email ?? "",
    previewTitle: deepLink.preview_title || "—",
    previewDescription: deepLink.preview_description || "—",
    previewImageUrl: deepLink.preview_image_url ?? "",
  };
});

/** Loads the latest details for one deep link, recording failures for the error state. */
const loadDetails = async (id: string): Promise<void> => {
  loadFailed.value = false;
  try {
    const result = await fetchDeepLinkDetails(id);
    if (!result) loadFailed.value = true;
  } catch {
    loadFailed.value = true;
  }
};

const currentId = ref("");

/** Opens the side panel for a list row and fetches its latest details. */
const open = (deepLink: IDeepLink): void => {
  currentId.value = deepLink.id;
  selectedDeepLink.value = null;
  sideModal.value?.showDialogBox();
  void loadDetails(deepLink.id);
};

/** Closes the detail panel. */
const close = (): void => {
  sideModal.value?.hideDialogBox();
};

/** Hands the loaded record to the parent's edit flow and closes the panel. */
const editLink = (): void => {
  if (!selectedDeepLink.value) return;
  emit("edit", selectedDeepLink.value);
  close();
};

defineExpose({ open, close });
</script>

<template>
  <AppSideModal ref="sideModal" close-button-position="inside">
    <DeepLinkViewShimmer v-if="fetchingDeepLinkDetails" />

    <section
      v-else-if="loadFailed || !profile"
      class="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center"
    >
      <h2 class="text-lg font-medium text-dashboard-heading">We couldn't load this deep link</h2>
      <p class="mt-2 max-w-sm text-sm text-dashboard-text">
        It may have been deleted, or something went wrong. Please try again.
      </p>
      <AppButton type="button" size="md" class="mt-5" @click="loadDetails(currentId)">
        Retry
      </AppButton>
    </section>

    <section v-else class="flex min-h-full flex-col gap-7 pr-1">
      <header class="border-b border-dashboard-card-border pb-6 pr-12">
        <p class="text-sm text-dashboard-text">View deep link details</p>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <h2 class="break-words text-2xl font-medium tracking-tight text-dashboard-heading">
            {{ profile.name }}
          </h2>
          <AppPills :color="profile.isActive ? 'green' : 'gray'">
            {{ profile.statusLabel }}
          </AppPills>
        </div>
        <p class="mt-2 text-sm text-dashboard-text">
          {{ profile.typeLabel }} &nbsp; Provider - {{ profile.provider }} &nbsp; Clicks - {{ profile.clicks }}
        </p>
        <p class="mt-1 text-sm text-dashboard-text">
          Created - {{ profile.createdAt }} &nbsp; Updated - {{ profile.updatedAt }}
        </p>
      </header>

      <dl class="space-y-6">
        <div>
          <dt class="text-sm text-dashboard-text">Generated link</dt>
          <dd class="mt-1">
            <AppClipBoard
              v-if="profile.linkUrl"
              :text="profile.linkUrl"
              toast-title="Link Copied"
              toast-message="Deep link copied to clipboard successfully"
              class="justify-start"
            >
              <span class="break-all text-base font-medium text-brand-color-default">
                {{ profile.linkUrl }}
              </span>
            </AppClipBoard>
            <span v-else class="text-base text-dashboard-heading">—</span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-dashboard-text">Target</dt>
          <dd class="mt-1 break-all text-base font-medium text-dashboard-heading">
            {{ profile.target }}
          </dd>
        </div>
        <div v-if="profile.referralCode">
          <dt class="text-sm text-dashboard-text">Referral code</dt>
          <dd class="mt-1 text-base font-medium text-dashboard-heading">
            {{ profile.referralCode }}
          </dd>
        </div>
        <div v-if="profile.creatorName">
          <dt class="text-sm text-dashboard-text">Created by</dt>
          <dd class="mt-1 text-base font-medium text-dashboard-heading">
            {{ profile.creatorName }}
          </dd>
          <dd v-if="profile.creatorEmail" class="break-all text-sm text-dashboard-text">
            {{ profile.creatorEmail }}
          </dd>
        </div>
      </dl>

      <section
        class="border-t border-dashboard-card-border pt-6"
        aria-labelledby="deep-link-preview-heading"
      >
        <h3
          id="deep-link-preview-heading"
          class="text-lg font-medium tracking-tight text-dashboard-heading"
        >
          Link Preview
        </h3>
        <p class="mt-1 text-sm text-dashboard-text">Shown when the link is shared.</p>
        <dl class="mt-5 space-y-5">
          <div>
            <dt class="text-sm text-dashboard-text">Preview title</dt>
            <dd class="mt-1 text-base font-medium text-dashboard-heading">
              {{ profile.previewTitle }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-dashboard-text">Preview description</dt>
            <dd class="mt-1 text-base text-dashboard-heading">
              {{ profile.previewDescription }}
            </dd>
          </div>
          <div v-if="profile.previewImageUrl">
            <dt class="text-sm text-dashboard-text">Preview image</dt>
            <dd class="mt-3">
              <img
                :src="profile.previewImageUrl"
                alt="Deep link preview"
                class="h-44 w-full rounded-xl border border-dashboard-card-border bg-dashboard-bg-dark object-contain p-3"
              />
            </dd>
          </div>
        </dl>
      </section>

      <div class="mt-auto border-t border-dashboard-card-border pt-6">
        <AppButton type="button" size="md" :block="false" outlined color="primary" @click="editLink">
          <Icon name="vent:edit" size="1rem" />
          Edit link
        </AppButton>
      </div>
    </section>
  </AppSideModal>
</template>
