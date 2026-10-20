/**
 * Keeps signed-in users out of guest-only pages (login, password reset, onboarding)
 * by sending them back to their most recent dashboard route.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { fetchAuthUser } = useAuthStore();

  try {
    await fetchAuthUser({ silent: true });
  } catch {
    // No valid session: stay on the guest page.
    return;
  }

  return navigateTo(useRouteHandler().getRecentRoute());
});
