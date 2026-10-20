<script setup lang="ts">
definePageMeta({
  pageTransition: { name: "page-zoom", mode: "out-in" },
  middleware: ["guest"],
});
</script>
<template>
  <AuthLogin />
</template>
