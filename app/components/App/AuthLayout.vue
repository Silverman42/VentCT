<script setup lang="ts">
import { Icon } from "#components";

const emit = defineEmits(["cancel"]);

const props = withDefaults(
  defineProps<{
    containerMaxWidth?: number;
  }>(),
  {
    containerMaxWidth: 500,
  },
);

const cancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="bg-dashboard-bg font-body">
    <div
      class="max-w-[1475px] mx-auto w-full flex flex-col justify-between items-center gap-5 min-h-screen p-6 py-10 font-body"
    >
      <!-- header -->
      <aside class="flex justify-between items-center w-full">
        <img src="/img/logo.svg" class="w-11" alt="vent-logo" />

        <button
          @click="cancel"
          class="bg-dashboard-bg-darker rounded-2xl w-11 aspect-square flex items-center justify-center text-dashboard-heading"
        >
          <Icon name="vent:close" size="1.2rem"></Icon>
        </button>
      </aside>
      <!-- header end-->

      <!-- body -->
      <section
        class="inline-block w-full h-auto bg-dashboard-bg-dark border border-dashboard-card-border backdrop-blur-md rounded-4xl p-2 relative z-4"
        :style="{
          maxWidth: props.containerMaxWidth + 'px',
        }"
      >
        <div
          class="p-5 md:p-10 py-15! border w-full bg-dashboard-bg border-dashboard-card-border flex flex-col gap-5 rounded-3xl"
        >
          <slot></slot>
        </div>
      </section>
      <!-- body -->

      <div></div>
    </div>
  </div>
</template>
