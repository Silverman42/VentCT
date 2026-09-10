<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    backgroundImg?: string;
    containerMaxWidth?: number;
  }>(),
  {
    backgroundImg: "/img/auth_bg.png",
    containerMaxWidth: 500,
  },
);
</script>
<template>
  <main
    class="w-full min-h-screen relative overflow-hidden bg-brand-color-004 p-5 font-body flex flex-col items-center justify-between gap-6"
  >
    <img
      :src="props.backgroundImg"
      class="inset-1 w-full h-full absolute z-1 object-center object-cover mix-blend-multiply auth-bg"
      alt="vent-logo"
    />

    <figure class="w-40 pt-10 relative z-4">
      <img src="/img/logo_white.svg" class="w-full" alt="vent-logo" />
    </figure>

    <section
      class="inline-block w-full h-auto border border-slate-500 bg-white/10 backdrop-blur-md rounded-4xl p-2 relative z-4"
      :style="{
        maxWidth: props.containerMaxWidth + 'px',
      }"
    >
      <div
        class="w-full min-h-30 bg-dashboard-bg pb-15! rounded-3xl flex flex-col gap-5 border-2 border-dashboard-card-border p-5 md:p-10"
      >
        <slot />
      </div>
    </section>

    <footer></footer>
  </main>
</template>
<style scoped>
.auth-bg {
  transform: scale(1.8);
  animation: scale 10s ease-in-out 1 forwards;
}

@keyframes scale {
  0% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}
</style>
