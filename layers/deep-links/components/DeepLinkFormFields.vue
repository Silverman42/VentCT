<script setup lang="ts">
import type { AppDropdown } from "#components";
import {
  DEEP_LINK_STATUS_LABELS,
  DEEP_LINK_TYPE_LABELS,
  type DeepLinkStatus,
  type DeepLinkType,
} from "../composables/useDeepLinkStore";
import type {
  DeepLinkForm,
  DeepLinkFormErrors,
  DeepLinkFormField,
} from "../composables/useDeepLinkForm";

const props = withDefaults(
  defineProps<{
    errors?: DeepLinkFormErrors;
    showStatus?: boolean;
  }>(),
  {
    errors: () => ({}),
    showStatus: true,
  },
);

const form = defineModel<DeepLinkForm>("form", { required: true });

const emit = defineEmits<{
  touch: [field: DeepLinkFormField];
}>();

const typeDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const statusDropdown = ref<InstanceType<typeof AppDropdown> | null>(null);
const typeOptions: DeepLinkType[] = ["referral", "route", "link"];
const statusOptions: DeepLinkStatus[] = ["active", "inactive"];

const TARGET_COPY: Record<DeepLinkType, { label: string; placeholder: string }> =
  {
    referral: {
      label: "Target (where the referral lands)",
      placeholder: "https://vent.africa/campus-tour",
    },
    route: {
      label: "Target (in-app route)",
      placeholder: "/initiate-verification",
    },
    link: {
      label: "Target URL",
      placeholder: "https://vent.africa/blog/launch",
    },
  };

/** Label and placeholder for the target input based on the selected type. */
const targetCopy = computed(() => TARGET_COPY[form.value.type]);

/** Selects the link type, revalidates the target, and closes the menu. */
const selectType = (type: DeepLinkType): void => {
  form.value.type = type;
  emit("touch", "type");
  if (form.value.target) emit("touch", "target");
  typeDropdown.value?.closeDropdown();
};

/** Selects the link status and closes the status menu. */
const selectStatus = (status: DeepLinkStatus): void => {
  form.value.status = status;
  emit("touch", "status");
  statusDropdown.value?.closeDropdown();
};
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <AppInputContainer
      label="Name"
      for="deep-link-name"
      :error="props.errors.name"
      class="md:col-span-2"
    >
      <input
        id="deep-link-name"
        v-model="form.name"
        type="text"
        autocomplete="off"
        placeholder="e.g. Campus Tour Promo"
        :aria-invalid="Boolean(props.errors.name)"
        @blur="emit('touch', 'name')"
      />
    </AppInputContainer>

    <AppInputContainer
      label="Type"
      for="deep-link-type"
      :error="props.errors.type"
      :class="{ 'md:col-span-2': !props.showStatus }"
    >
      <AppDropdown
        ref="typeDropdown"
        position="left"
        :width-is-finite="false"
        :container-full="true"
      >
        <template #default>
          <button
            id="deep-link-type"
            type="button"
            class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
            aria-haspopup="listbox"
          >
            {{ DEEP_LINK_TYPE_LABELS[form.type] }}
            <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
          </button>
        </template>
        <template #dropdown_body>
          <div role="listbox" aria-label="Type" class="min-w-56 space-y-1">
            <button
              v-for="option in typeOptions"
              :key="option"
              type="button"
              role="option"
              :aria-selected="form.type === option"
              class="block w-full rounded-md px-3 py-2 text-left text-sm text-dashboard-heading transition hover:bg-dashboard-bg-dark"
              :class="{ 'bg-dashboard-bg-dark': form.type === option }"
              @click="selectType(option)"
            >
              {{ DEEP_LINK_TYPE_LABELS[option] }}
            </button>
          </div>
        </template>
      </AppDropdown>
    </AppInputContainer>

    <AppInputContainer
      v-if="props.showStatus"
      label="Status"
      for="deep-link-status"
      :error="props.errors.status"
    >
      <AppDropdown
        ref="statusDropdown"
        position="left"
        :width-is-finite="false"
        :container-full="true"
      >
        <template #default>
          <button
            id="deep-link-status"
            type="button"
            class="flex w-full items-center justify-between gap-3 text-left text-base font-medium text-input-text outline-none"
            aria-haspopup="listbox"
          >
            {{ DEEP_LINK_STATUS_LABELS[form.status] }}
            <Icon name="vent:arrow-down" size="1rem" class="shrink-0 text-dashboard-text" />
          </button>
        </template>
        <template #dropdown_body>
          <div role="listbox" aria-label="Status" class="min-w-56 space-y-1">
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
              {{ DEEP_LINK_STATUS_LABELS[option] }}
            </button>
          </div>
        </template>
      </AppDropdown>
    </AppInputContainer>

    <AppInputContainer
      v-if="form.type === 'referral'"
      label="Referral code (optional)"
      for="deep-link-referral-code"
      :error="props.errors.referral_code"
      :class="{ 'md:col-span-2': !props.showStatus }"
    >
      <input
        id="deep-link-referral-code"
        v-model="form.referral_code"
        type="text"
        autocomplete="off"
        placeholder="e.g. CAMP26"
        class="uppercase"
        :aria-invalid="Boolean(props.errors.referral_code)"
        @blur="emit('touch', 'referral_code')"
      />
    </AppInputContainer>

    <AppInputContainer
      :label="targetCopy.label"
      for="deep-link-target"
      :error="props.errors.target"
      class="md:col-span-2"
    >
      <input
        id="deep-link-target"
        v-model="form.target"
        :type="form.type === 'route' ? 'text' : 'url'"
        autocomplete="off"
        :placeholder="targetCopy.placeholder"
        :aria-invalid="Boolean(props.errors.target)"
        @blur="emit('touch', 'target')"
      />
    </AppInputContainer>

    <div class="border-t border-dashboard-card-border pt-4 md:col-span-2">
      <h3 class="text-sm font-medium text-dashboard-heading">Link preview (optional)</h3>
      <p class="mt-1 text-xs text-dashboard-text">Shown when the link is shared.</p>
    </div>

    <AppInputContainer
      label="Preview title"
      for="deep-link-preview-title"
      :error="props.errors.preview_title"
      class="md:col-span-2"
    >
      <input
        id="deep-link-preview-title"
        v-model="form.preview_title"
        type="text"
        autocomplete="off"
        placeholder="e.g. Join the Campus Tour"
        :aria-invalid="Boolean(props.errors.preview_title)"
        @blur="emit('touch', 'preview_title')"
      />
    </AppInputContainer>

    <AppInputContainer
      label="Preview description"
      for="deep-link-preview-description"
      :error="props.errors.preview_description"
      class="md:col-span-2"
    >
      <textarea
        id="deep-link-preview-description"
        v-model="form.preview_description"
        rows="3"
        placeholder="e.g. Sign up and start trading."
        class="w-full resize-none bg-transparent outline-none"
        :aria-invalid="Boolean(props.errors.preview_description)"
        @blur="emit('touch', 'preview_description')"
      />
    </AppInputContainer>

    <AppInputContainer
      label="Preview image URL"
      for="deep-link-preview-image"
      :error="props.errors.preview_image_url"
      class="md:col-span-2"
    >
      <input
        id="deep-link-preview-image"
        v-model="form.preview_image_url"
        type="url"
        autocomplete="off"
        placeholder="https://assets.vent.africa/previews/campus.png"
        :aria-invalid="Boolean(props.errors.preview_image_url)"
        @blur="emit('touch', 'preview_image_url')"
      />
    </AppInputContainer>
  </div>
</template>
