<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    imageUrl?: string;
  }>(),
  {
    title: "Vent",
    description: "Join me on Vent",
    imageUrl: "",
  },
);

/** Resolves the supplied preview image or the existing Vent mark fallback. */
const imageSource = computed(() => props.imageUrl || "/img/logo_primary.svg");
</script>

<template>
  <article
    class="overflow-hidden rounded-xl border border-dashboard-card-border bg-dashboard-bg"
    aria-label="Link preview"
  >
    <div class="flex aspect-[1.9/1] items-center justify-center bg-dashboard-bg-dark p-5">
      <img
        :src="imageSource"
        alt=""
        class="h-full w-full object-contain"
      />
    </div>
    <div class="space-y-2 p-5">
      <p class="text-sm text-dashboard-text-light">Ventafrica.app.link</p>
      <h3 class="text-base font-medium text-dashboard-heading">
        {{ props.title || "Vent" }}
      </h3>
      <p class="text-sm text-dashboard-text">
        {{ props.description || "Join me on Vent" }}
      </p>
    </div>
  </article>
</template>
