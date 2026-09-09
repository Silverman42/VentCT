export interface PollingOptions {
  /** The function to execute repeatedly */
  callback: () => void | Promise<void>;
  /** Initial interval in milliseconds */
  interval: number;
  /** Whether to execute immediately on start (default: true) */
  immediate?: boolean;
}

export interface PollingController {
  /** Start the polling */
  start: () => void;
  /** Stop the polling */
  stop: () => void;
  /** Update the polling interval dynamically */
  setInterval: (newInterval: number) => void;
  /** Check if polling is currently active */
  isActive: () => boolean;
}

/**
 * Creates a polling controller that repeatedly triggers a function at a specified interval.
 * The polling automatically pauses when the browser window loses focus and resumes when focused again.
 *
 * @param options - Polling configuration options
 * @returns PollingController - Controller object to manage the polling
 *
 * @example
 * ```ts
 * const poller = createPolling({
 *   callback: async () => {
 *     await fetchLatestData();
 *   },
 *   interval: 5000, // 5 seconds
 *   immediate: true
 * });
 *
 * // Start polling
 * poller.start();
 *
 * // Change interval dynamically
 * poller.setInterval(10000); // 10 seconds
 *
 * // Stop polling when done
 * poller.stop();
 * ```
 */
export function createPolling(options: PollingOptions): PollingController {
  const { callback, immediate = true } = options;

  let currentInterval = options.interval;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;
  let isPaused = false;

  const executeCallback = async () => {
    try {
      await callback();
    } catch (error) {
      console.error("[Polling] Error executing callback:", error);
    }
  };

  const scheduleNext = () => {
    if (!isRunning || isPaused) return;

    timerId = setTimeout(async () => {
      await executeCallback();
      scheduleNext();
    }, currentInterval);
  };

  const clearTimer = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const handleVisibilityChange = () => {
    if (typeof document === "undefined") return;

    if (document.hidden) {
      // Browser tab is not visible - pause polling
      isPaused = true;
      clearTimer();
    } else {
      // Browser tab is visible again - resume polling
      if (isRunning && isPaused) {
        isPaused = false;
        // Execute immediately on resume and schedule next
        executeCallback().then(() => scheduleNext());
      }
    }
  };

  const handleWindowBlur = () => {
    isPaused = true;
    clearTimer();
  };

  const handleWindowFocus = () => {
    if (isRunning && isPaused) {
      isPaused = false;
      // Execute immediately on focus and schedule next
      executeCallback().then(() => scheduleNext());
    }
  };

  const addEventListeners = () => {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("focus", handleWindowFocus);
    }
  };

  const removeEventListeners = () => {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    }
  };

  const start = () => {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;

    addEventListeners();

    if (immediate) {
      executeCallback().then(() => scheduleNext());
    } else {
      scheduleNext();
    }
  };

  const stop = () => {
    isRunning = false;
    isPaused = false;
    clearTimer();
    removeEventListeners();
  };

  const setInterval = (newInterval: number) => {
    currentInterval = newInterval;

    // If currently running and not paused, restart the timer with new interval
    if (isRunning && !isPaused) {
      clearTimer();
      scheduleNext();
    }
  };

  const isActive = () => isRunning && !isPaused;

  return {
    start,
    stop,
    setInterval,
    isActive,
  };
}

/**
 * Composable version for Vue components - automatically cleans up on unmount
 *
 * @param options - Polling configuration options
 * @returns PollingController - Controller object to manage the polling
 *
 * @example
 * ```ts
 * // In a Vue component's setup function
 * const poller = usePolling({
 *   callback: () => store.fetchData(),
 *   interval: 5000
 * });
 *
 * onMounted(() => poller.start());
 * // No need to manually stop - cleanup is automatic
 * ```
 */
export function usePolling(options: PollingOptions): PollingController {
  const controller = createPolling(options);

  // Auto-cleanup on component unmount (if in Vue context)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      controller.stop();
    });
  }

  return controller;
}
import { getCurrentInstance, onUnmounted } from "vue";
