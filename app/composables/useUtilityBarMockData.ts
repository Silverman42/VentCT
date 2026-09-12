export interface UtilityBarProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

/**
 * Local-only utility-bar state used until authentication is connected.
 */
export const useUtilityBarMockData = () => {
  const profile = useState<UtilityBarProfile>(
    "useUtilityBarMockData.profile",
    () => ({
      name: "Demo Admin",
      email: "admin@vent.africa",
      role: "Administrator",
      avatar: "/img/avatar.png",
    }),
  );

  const isLoggingOut = useState<boolean>(
    "useUtilityBarMockData.isLoggingOut",
    () => false,
  );

  const logout = async () => {
    if (isLoggingOut.value) return;

    isLoggingOut.value = true;

    try {
      await wait(350);
      useToastHandler().triggerToast(
        "This is a local demo session.",
        "success",
        "Signed out",
        "small",
      );
      await wait(650);
      await navigateTo("/");
    } finally {
      isLoggingOut.value = false;
    }
  };

  return {
    profile,
    isLoggingOut,
    logout,
  };
};
