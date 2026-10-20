<script setup lang="ts">
import { useThemeHandler } from "~/composables/useThemeHandler";

const error = useError();
const { getRecentRoute } = useRouteHandler();

/** HTTP status of the current error, used to pick the matching view. */
const errorType = computed(() => error.value?.statusCode);

/** Status codes that have a dedicated error view; anything else falls back to the 500 view. */
const KNOWN_ERROR_CODES = [401, 403, 404, 500, 503];
const isUnmappedError = computed(
  () => !KNOWN_ERROR_CODES.includes(errorType.value ?? 0),
);

/** Picks where to go after dismissing: retry the last page for server/offline errors, otherwise login. */
const redirectPage = (): string => {
  switch (errorType.value) {
    case 500:
    case 503:
      return getRecentRoute();
    default:
      return "/";
  }
};

/** Clears the error and navigates away from the error page. */
const cancelError = () => {
  clearError({ redirect: redirectPage() });
};

// error.vue renders outside app.vue, so apply the saved theme here too.
onMounted(() => useThemeHandler().initTheme());
</script>

<template>
  <AppAuthLayout bare @cancel="cancelError">
    <ErrorFourOhFour v-if="errorType === 404" />
    <ErrorFiveOhOh v-else-if="errorType === 500 || isUnmappedError" />
    <ErrorSessionTimeOut v-else-if="errorType === 403" />
    <ErrorUnathAccess v-else-if="errorType === 401" />
    <ErrorOffline v-else-if="errorType === 503" />
  </AppAuthLayout>
</template>
