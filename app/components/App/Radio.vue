<script setup lang="ts">
const value = defineModel<string>("radio", { default: "pdf" });
const props = withDefaults(
  defineProps<{
    id?: string;
    name?: string;
    value?: string;
  }>(),
  {
    id: "",
    name: "",
    value: "",
  }
);
</script>
<template>
  <label
    class="flex justify-center items-center relative group w-[15px] h-[15px]"
  >
    <input
      :id="props.id"
      v-model="value"
      type="radio"
      :name="props.name"
      :value="props.value"
      class="sr-only peer"
     autocomplete="new-password-no-autofill" />
    <span
      class="absolute block w-full h-full top-0 left-0 rounded-full border border-dashboard-card-border group-hover:border-brand-color-default peer-checked:bg-brand-color-default peer-checked:border-brand-color-default"
    ></span>
    <span
      class="block w-2 h-2 rounded-full bg-dashboard-bg relative z-[2]"
    ></span>
  </label>
</template>
