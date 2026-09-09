<script setup lang="ts">
const isSelected = defineModel<boolean | string[]>("isSelected", {
  default: false,
});
const props = withDefaults(
  defineProps<{ id?: string; name?: string; value?: string }>(),
  {
    id: "",
    name: "",
    value: "",
  }
);
</script>
<template>
  <label
    tabindex="0"
    role="checkbox"
    class="flex items-center justify-center w-5.5 h-5.5 relative"
    :for="props.id"
  >
    <input
      type="checkbox"
      v-model="isSelected"
      :name="props.name"
      :value="props.value"
      :id="props.id"
      class="sr-only peer"
     autocomplete="new-password-no-autofill" />

    <div
      class="absolute w-full h-full top-0 left-0 border border-dashboard-card-border rounded-lg peer-checked:border-brand-color-default peer-checked:bg-brand-color-default transition-all duration-300 ease-in-out"
    ></div>

    <Icon
      name="vent:checked"
      size="0.9rem"
      class="text-dashboard-text-lighter peer-checked:text-white relative z-2 transition-all duration-300 ease-in-out"
    ></Icon>
  </label>
</template>
