<script setup lang="ts">
const isSelected = defineModel<boolean>("isSelected", { default: false });
const props = withDefaults(defineProps<{ id?: string; disabled?: boolean }>(), {
  id: "",
  disabled: false,
});
const emit = defineEmits<{
  (e: "change", value: boolean): void;
}>();
const handleChange = () => {
  emit("change", isSelected.value);
};

const disabled = computed(() => {
  return props.disabled;
});
</script>
<template>
  <label
    role="checkbox"
    class="block w-[33px] p-1.5 rounded-full shrink-0 overflow-hidden cursor-pointer relative"
    :for="props.id"
  >
    <input
      type="checkbox"
      v-model="isSelected"
      @change="handleChange"
      name=""
      :id="props.id"
      :disabled="disabled"
      class="sr-only peer"
      autocomplete="new-password-no-autofill"
    />
    <span
      class="block absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out bg-dashboard-header-border peer-checked:bg-brand-color-default"
    >
    </span>
    <span
      class="rounded-full relative z-1 bg-white w-[14px] aspect-square block transition-all duration-300 ease-in-out peer-checked:translate-x-[50%] translate-x-0"
    >
    </span>
  </label>
</template>
