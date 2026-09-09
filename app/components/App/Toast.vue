<script lang="ts" setup>
const toastHandler = useToastHandler();
const closeToast = () => toastHandler.closeToast();
const alertData = computed(() => {
  return toastHandler.toastBody.value;
});
</script>
<template>
  <!-- large toast -->
  <transition name="slideUp">
    <div
      v-if="alertData.type !== null && toastHandler.sizeType.value === 'large'"
      class="w-11/12 rounded-lg md:w-[30rem] fixed translate-x-[-50%] left-[50%] bottom-3 shadow-xl z-[400000000] font-body bg-brand-color-001 flex flex-row justify-between"
    >
      <!-- close button -->

      <!-- close button end -->
      <div class="flex items-center gap-3 px-4 py-2 w-full">
        <div
          v-if="alertData.type === 'success'"
          class="flex items-center flex-shrink-0 text-brand-color-007"
        >
          <Icon name="vent:verify" size="2.5rem"></Icon>
        </div>
        <div
          v-if="alertData.type === 'error'"
          class="flex items-center flex-shrink-0 text-orange-008"
        >
          <Icon name="vent:warning-3" size="2.5rem"></Icon>
        </div>
        <div>
          <h3 class="text-white text-[13px]">{{ alertData.heading }}</h3>
          <p class="text-[10px] text-brand-color-012">
            {{ alertData.message }}
          </p>
        </div>
      </div>

      <div
        class="inline-flex items-center gap-3 px-4 py-2 shrink-0 border-l border-brand-color-003"
      >
        <button
          @click="closeToast()"
          class="text-white text-[10px] bg-brand-color-002 rounded-[6px] px-3 py-1 hover:text-brand-color-007"
        >
          Close
        </button>
      </div>
    </div>
  </transition>
  <!-- large toast -->

  <!-- small toast -->
  <transition name="slideUp">
    <div
      v-if="alertData.type !== null && toastHandler.sizeType.value === 'small'"
      class="max-w-[20rem] w-auto rounded-full fixed translate-x-[-50%] left-[50%] bottom-3 shadow-xl z-[400000000] font-body bg-brand-color-001 flex flex-row justify-between"
    >
      <!-- close button -->

      <!-- close button end -->
      <div class="flex items-center gap-3 p-2 w-full">
        <div
          v-if="alertData.type === 'success'"
          class="flex items-center flex-shrink-0 text-brand-color-007"
        >
          <Icon name="vent:verify" size="1.8rem"></Icon>
        </div>
        <div
          v-if="alertData.type === 'error'"
          class="flex items-center flex-shrink-0 text-orange-008"
        >
          <Icon name="vent:warning-3" size="1.8rem"></Icon>
        </div>
        <div class="px-2">
          <h3 class="text-white text-[13px]">{{ alertData.heading }}</h3>
        </div>
      </div>

      <div
        class="inline-flex items-center gap-3 px-2 shrink-0 border-l border-brand-color-003"
      >
        <button
          @click="closeToast()"
          class="text-white text-[10px] bg-transparent rounded-[6px] py-1 hover:text-brand-color-007"
        >
          <Icon name="vent:close" size="1.2rem"></Icon>
        </button>
      </div>
    </div>
  </transition>
  <!-- small toast -->
</template>
