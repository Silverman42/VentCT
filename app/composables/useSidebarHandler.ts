/**
 * Shared state for the responsive dashboard sidebar.
 */
export const useSidebarHandler = () => {
  const minimizeSideBar = useState<boolean>(
    "useSidebarHandler.minimizeSideBar",
    () => false,
  );
  const sidebarOpened = useState<boolean>(
    "useSidebarHandler.sidebarOpened",
    () => false,
  );

  const toggleSideBar = () => {
    minimizeSideBar.value = !minimizeSideBar.value;
  };

  const openSidebar = () => {
    sidebarOpened.value = true;
  };

  const closeSidebar = () => {
    sidebarOpened.value = false;
  };

  return {
    minimizeSideBar,
    sidebarOpened,
    toggleSideBar,
    openSidebar,
    closeSidebar,
  };
};
