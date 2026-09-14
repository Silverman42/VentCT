<script setup lang="ts">
import type { AppDropdown } from "#components";
import {
  deepLinkRouteOptions,
  type DeepLinkDraft,
  type DeepLinkType,
} from "../composables/useDeepLinkStore";

/** Identifies the form fields that can surface Vuelidate feedback. */
export type DeepLinkFormField =
  | "type"
  | "internalName"
  | "referralCode"
  | "route"
  | "routeParameter"
  | "url"
  | "browserMode"
  | "previewTitle"
  | "previewDescription"
  | "previewImageUrl";

/** Maps editable form fields to their current validation error text. */
export type DeepLinkFormErrors = Partial<Record<DeepLinkFormField, string>>;

const props = withDefaults(
  defineProps<{
    errors?: DeepLinkFormErrors;
    includeDestination?: boolean;
    includePreview?: boolean;
  }>(),
  {
    errors: () => ({}),
    includeDestination: true,
    includePreview: false,
  },
);

const draft = defineModel<DeepLinkDraft>("form", { required: true });

const emit = defineEmits<{
  touch: [field: DeepLinkFormField];
  imageFileSelected: [file: File | null];
}>();

const routeDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

const typeOptions: Array<{
  value: DeepLinkType;
  label: string;
  description: string;
}> = [
  { value: "referral", label: "Referral", description: "Sign up with a code" },
  { value: "route", label: "Route", description: "Open an in-app screen" },
  { value: "link", label: "Link", description: "Open URL" },
];

/** Switches the selected deep-link type and clears type-specific validation feedback. */
const selectType = (type: DeepLinkType): void => {
  draft.value.type = type;
  emit("touch", "type");
};

/** Assigns the permitted application route and dismisses its menu. */
const selectRoute = (route: string): void => {
  draft.value.route = route;
  emit("touch", "route");
  routeDropdown.value?.closeDropdown();
};

/** Changes the preview image source and clears the prior source value. */
const selectImageMode = (mode: DeepLinkDraft["previewImageMode"]): void => {
  draft.value.previewImageMode = mode;
  draft.value.previewImageFile = null;
  draft.value.previewImageUrl = "";
  emit("touch", "previewImageUrl");
};

/** Sends a selected local image to the parent so it can retain the preview URL. */
const selectImageFile = (file: File | null): void => {
  draft.value.previewImageFile = file;
  emit("imageFileSelected", file);
  emit("touch", "previewImageUrl");
};
</script>

<template>
  <div class="space-y-4">
    <template v-if="props.includeDestination">
      <AppInputContainer
      label="Type"
      for="deep-link-type"
      :error="props.errors.type"
      >
        <fieldset id="deep-link-type" class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <legend class="sr-only">Deep link type</legend>
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            class="rounded-lg border p-3 text-left transition"
            :class="
              draft.type === option.value
                ? 'border-brand-color-default bg-brand-primary-001 text-brand-color-default'
                : 'border-dashboard-card-border bg-dashboard-bg text-dashboard-heading hover:border-brand-color-default'
            "
            :aria-pressed="draft.type === option.value"
            @click="selectType(option.value)"
          >
            <span class="block text-base font-medium">{{ option.label }}</span>
            <span class="mt-1 block text-xs text-dashboard-text">{{ option.description }}</span>
          </button>
        </fieldset>
      </AppInputContainer>

    <template v-if="draft.type === 'referral'">
      <AppInputContainer
        label="Internal Name (Optional, not sent to Branch)"
        for="deep-link-internal-name"
        :error="props.errors.internalName"
      >
        <input
          id="deep-link-internal-name"
          v-model.trim="draft.internalName"
          type="text"
          autocomplete="off"
          placeholder="Enter name"
          @blur="emit('touch', 'internalName')"
        />
      </AppInputContainer>

      <AppInputContainer
        label="Referral Code (Pre-filled code shown in the app)"
        for="deep-link-referral-code"
        :error="props.errors.referralCode"
      >
        <input
          id="deep-link-referral-code"
          v-model.trim="draft.referralCode"
          type="text"
          autocomplete="off"
          placeholder="Enter code"
          :aria-invalid="Boolean(props.errors.referralCode)"
          @blur="emit('touch', 'referralCode')"
        />
      </AppInputContainer>
    </template>

    <template v-else-if="draft.type === 'route'">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppInputContainer
          label="In-app Route (Only route on mobile app allow list)"
          for="deep-link-route"
          :error="props.errors.route"
        >
          <AppDropdown
            ref="routeDropdown"
            position="left"
            :width-is-finite="false"
            :container-full="true"
          >
            <template #default>
              <button
                id="deep-link-route"
                type="button"
                class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
                :aria-invalid="Boolean(props.errors.route)"
                aria-haspopup="listbox"
              >
                {{ deepLinkRouteOptions.find((option) => option.value === draft.route)?.label || 'Select option' }}
                <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
              </button>
            </template>
            <template #dropdown_body>
              <div role="listbox" aria-label="In-app Route" class="min-w-56 space-y-1">
                <button
                  v-for="option in deepLinkRouteOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="draft.route === option.value"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
                  :class="{ 'bg-dashboard-bg-dark': draft.route === option.value }"
                  @click="selectRoute(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </template>
          </AppDropdown>
        </AppInputContainer>

        <AppInputContainer
          label="Route Parameter"
          for="deep-link-route-parameter"
          :error="props.errors.routeParameter"
        >
          <input
            id="deep-link-route-parameter"
            v-model.trim="draft.routeParameter"
            type="text"
            autocomplete="off"
            placeholder="Optional parameter"
            @blur="emit('touch', 'routeParameter')"
          />
        </AppInputContainer>
      </div>
    </template>

    <template v-else>
      <AppInputContainer
        label="URL (Open in in-app web view or external browser)"
        for="deep-link-url"
        :error="props.errors.url"
      >
        <input
          id="deep-link-url"
          v-model.trim="draft.url"
          type="url"
          autocomplete="url"
          placeholder="https://example.com"
          :aria-invalid="Boolean(props.errors.url)"
          @blur="emit('touch', 'url')"
        />
      </AppInputContainer>

      <AppInputContainer
        label="Open link in"
        for="deep-link-browser-mode"
        :error="props.errors.browserMode"
      >
        <fieldset id="deep-link-browser-mode" class="flex flex-col gap-3 py-1">
          <legend class="sr-only">Browser destination</legend>
          <label class="flex cursor-pointer items-center gap-3 text-sm text-dashboard-heading">
            <AppRadio v-model:radio="draft.browserMode" name="deep-link-browser-mode" value="in-app" />
            Open in the app web view
          </label>
          <label class="flex cursor-pointer items-center gap-3 text-sm text-dashboard-heading">
            <AppRadio v-model:radio="draft.browserMode" name="deep-link-browser-mode" value="external" />
            Use external browser
          </label>
        </fieldset>
      </AppInputContainer>
    </template>

    </template>

    <template v-if="props.includePreview">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppInputContainer
          label="Preview Title (Shown when link is posted)"
          for="deep-link-preview-title"
          :error="props.errors.previewTitle"
        >
          <input
            id="deep-link-preview-title"
            v-model.trim="draft.previewTitle"
            type="text"
            autocomplete="off"
            placeholder="e.g. Vent"
            :aria-invalid="Boolean(props.errors.previewTitle)"
            @blur="emit('touch', 'previewTitle')"
          />
        </AppInputContainer>

        <AppInputContainer
          label="Preview Description"
          for="deep-link-preview-description"
          :error="props.errors.previewDescription"
        >
          <input
            id="deep-link-preview-description"
            v-model.trim="draft.previewDescription"
            type="text"
            autocomplete="off"
            placeholder="e.g. Join me on Vent"
            :aria-invalid="Boolean(props.errors.previewDescription)"
            @blur="emit('touch', 'previewDescription')"
          />
        </AppInputContainer>
      </div>

      <section aria-labelledby="deep-link-preview-image-heading" class="space-y-3">
        <h3 id="deep-link-preview-image-heading" class="text-sm font-medium text-dashboard-heading">
          Preview Image
          <span class="font-normal text-dashboard-text">(Image shown when link is shared)</span>
        </h3>

        <div class="flex flex-wrap gap-2" role="group" aria-label="Preview image source">
          <AppButton
            type="button"
            size="sm"
            :outlined="true"
            :color="draft.previewImageMode === 'upload' ? 'primary' : 'neutral'"
            class="!px-3 !py-2"
            :aria-pressed="draft.previewImageMode === 'upload'"
            @click="selectImageMode('upload')"
          >
            <Icon name="vent:direct-inbox" size="1rem" />
            Upload Image
          </AppButton>
          <AppButton
            type="button"
            size="sm"
            :outlined="true"
            :color="draft.previewImageMode === 'url' ? 'primary' : 'neutral'"
            class="!px-3 !py-2"
            :aria-pressed="draft.previewImageMode === 'url'"
            @click="selectImageMode('url')"
          >
            <Icon name="vent:link-2" size="1rem" />
            Paste URL
          </AppButton>
        </div>

        <AppFileSelector
          v-if="draft.previewImageMode === 'upload'"
          :model-value="draft.previewImageFile"
          :allowed-types="['image/png', 'image/jpeg', 'image/jpg', 'image/webp']"
          :max-size-in-mb="5"
          variant="compact"
          @update:model-value="selectImageFile($event)"
        />

        <AppInputContainer
          v-else
          for="deep-link-preview-image"
          :error="props.errors.previewImageUrl"
        >
          <input
            id="deep-link-preview-image"
            v-model.trim="draft.previewImageUrl"
            type="url"
            autocomplete="url"
            placeholder="Paste URL"
            :aria-invalid="Boolean(props.errors.previewImageUrl)"
            @blur="emit('touch', 'previewImageUrl')"
          />
        </AppInputContainer>
      </section>
    </template>
  </div>
</template>
