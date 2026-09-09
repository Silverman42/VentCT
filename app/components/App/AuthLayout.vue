<script setup lang="ts">
import { AppPinCode, Icon } from "#components";

const emit = defineEmits(["cancel"]);

const cancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="bg-dashboard-bg font-body">
    <div
      class="max-w-[1475px] mx-auto w-full flex flex-col justify-between items-center min-h-screen p-6 py-10 font-body"
    >
      <!-- header -->
      <aside class="flex justify-between items-center w-full">
        <img src="/img/logo.svg" class="w-13" alt="vent-logo" />

        <button
          @click="cancel"
          class="bg-dashboard-bg-darker rounded-2xl w-11 aspect-square flex items-center justify-center text-dashboard-heading"
        >
          <Icon name="vent:close" size="1.2rem"></Icon>
        </button>
      </aside>
      <!-- header end-->

      <!-- body -->
      <slot></slot>
      <!-- body -->
    </div>
  </div>
</template>
