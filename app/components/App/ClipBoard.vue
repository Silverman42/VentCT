<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: string;
    icon?: string;
    toastTitle?: string;
    toastMessage?: string;
    iconSize?: string;
  }>(),
  {
    text: "",
    icon: "vent:copy",
    toastTitle: "Text Copied",
    toastMessage: "Text copied to clipboard successfully",
    iconSize: "1.2rem",
  }
);

const text = computed(() => {
  return props.text;
});
const copyToClipboard = () => {
  navigator.clipboard.writeText(text.value || "");
  useToastHandler().triggerToast(
    props.toastMessage,
    "success",
    props.toastTitle
  );
};
</script>
<template>
  <div
    @click.stop="copyToClipboard"
    class="flex items-center gap-1 cursor-pointer justify-center group text-sm md:text-base text-dashboard-heading"
  >
    <slot>
      <span class="text-xs md:text-sm"> {{ text }} </span>
    </slot>
    <button
      type="button"
      class="inline-block mt-1 cursor-pointer group-hover:text-brand-color-default text-dashboard-text-light"
    >
      <Icon :name="props.icon" :size="props.iconSize"></Icon>
    </button>
  </div>
</template>
