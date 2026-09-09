<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    heading?: string;
    subheading?: string;
    isLoading?: boolean;
  }>(),
  {
    heading: "Are you sure?",
    subheading: "This action cannot be undone. Please confirm to proceed.",
    isLoading: false,
  },
);

const loading = computed(() => props.isLoading);

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="grid grid-cols-1 gap-10">
    <div>
      <h2
        class="text-modal-heading font-medium tracking-tighter text-3xl md:text-4xl mb-1"
      >
        {{ heading }}
      </h2>
      <p class="text-sm md:text-base text-modal-subheading">
        {{ subheading }}
      </p>
    </div>

    <div>
      <div class="flex justify-end gap-3">
        <AppButton
          :block="false"
          color="neutral"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </AppButton>
        <AppButton :block="false" :loading="loading" @click="handleConfirm">
          Confirm
        </AppButton>
      </div>
    </div>
  </div>
</template>
