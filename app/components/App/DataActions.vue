<script setup lang="ts">
import type { AppDropdown } from "#components";

const props = withDefaults(
  defineProps<{
    link?: string | null;
    text: string | null;
    copyLabel?: string;
  }>(),
  {
    link: null,
    text: null,
    copyLabel: "Copy",
  },
);

const dropdown = ref<InstanceType<typeof AppDropdown> | null>(null);

const copyToClipboard = (text: string, type: "Link" | "Text") => {
  closeDropdown();
  navigator.clipboard.writeText(text);
  useToastHandler().triggerToast(
    `${type} copied to clipboard successfully`,
    "success",
    `${type} Copied`,
  );
};

const closeDropdown = () => {
  dropdown.value?.closeDropdown();
};

const actionProps = computed(() => {
  return props;
});
</script>
<template>
  <AppDropdown ref="dropdown" position="right">
    <template #default>
      <div class="flex items-center gap-2 group">
        <slot></slot>
        <Icon
          name="vent:more"
          size="1rem"
          class="rotate-90 text-dashboard-text-light group-hover:text-brand-color-default"
        ></Icon>
      </div>
    </template>
    <template #dropdown_body>
      <ul class="flex flex-col gap-2">
        <li v-if="actionProps.text">
          <button
            @click="copyToClipboard(actionProps.text, 'Text')"
            class="w-full flex items-center p-1 text-dashboard-text-light hover:text-brand-color-default justify-between text-xs"
          >
            {{ actionProps.copyLabel }}
          </button>
        </li>

        <template v-if="actionProps.link">
          <li class="border-b border-dashboard-card-border w-full"></li>

          <li>
            <button
              @click="copyToClipboard(actionProps.link, 'Link')"
              class="w-full flex items-center p-1 text-dashboard-text-light hover:text-brand-color-default justify-between text-xs"
            >
              Copy link
            </button>
          </li>
        </template>

        <template v-if="actionProps.link">
          <li class="border-b border-dashboard-card-border w-full"></li>

          <li class="w-full">
            <a
              :href="actionProps.link"
              target="_blank"
              @click="dropdown?.closeDropdown()"
              class="w-full flex items-center p-1 text-dashboard-text-light hover:text-brand-color-default justify-between text-xs"
            >
              Visit link
            </a>
          </li>
        </template>

        <slot name="additional-actions" :close-dropdown="closeDropdown" />
      </ul>
    </template>
  </AppDropdown>
</template>
