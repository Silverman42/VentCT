<script setup lang="ts">
import { CookieManager } from "~/utils/helpers/CookieManager";
import { Cookies } from "~/utils/types/enum/Cookies";

const pullDown = ref(false);
const visibilityIntervalHours = 24; // Adjust this value as needed.
const { fetchQuoteOfTheDay, quoteOfTheDay, author, fetchingQuoteOfTheDay } =
  useLoadScreenStore();

const visibilityIntervalInDays = computed(() => {
  return visibilityIntervalHours / 24;
});

const showQuoteShimmer = computed(() => {
  return (
    fetchingQuoteOfTheDay.value ||
    (!quoteOfTheDay.value.trim() && !author.value.trim())
  );
});

const setLoadScreenActivity = () => {
  CookieManager.setCookie(
    Cookies.LOAD_SCREEN_ACTIVITY,
    "active",
    visibilityIntervalInDays.value,
  );
};

const canShowLoadScreen = () => {
  return CookieManager.getCookieValue(Cookies.LOAD_SCREEN_ACTIVITY) === null;
};

const hideScreen = () => {
  setLoadScreenActivity();
  pullDown.value = true;
};

const autoHideScreen = () => {
  setTimeout(() => {
    hideScreen();
  }, 10000);
};

onMounted(() => {
  if (!canShowLoadScreen()) {
    pullDown.value = true;
    return;
  }
  fetchQuoteOfTheDay().catch(() => {});
  setLoadScreenActivity();
  autoHideScreen();
});
</script>
<template>
  <div
    class="w-screen h-screen fixed top-0 left-0 z-[100] flex items-center justify-center bg-dashboard-bg transition-transform duration-500 ease-in-out"
    :class="{
      'translate-y-[110vh]': pullDown,
    }"
  >
    <div
      class="w-full h-full absolute top-0 left-0 bg-dashboard-bg bg-[url('/img/loadscreen_bg.jpg')] opacity-7 dark:bg-blend-color-burn bg-blend-hard-light"
      style="background-size: 300px"
      alt=""
    ></div>
    <div
      class="h-full w-full flex flex-col items-center justify-between py-6 px-5 md:px-31 md:py-20 relative z-4"
    >
      <div class="w-full">
        <img src="/img/logo.svg" class="w-[53px]" alt="" />
      </div>

      <div class="w-full max-w-[765px] px-4 md:px-0">
        <div
          class="w-full rounded-[40px] bg-dashboard-bg border border-dashboard-card-border p-4 shadow-2xl shadow-gray-001/15"
        >
          <div class="w-full flex justify-center">
            <img src="/img/pin.svg" class="w-[38px]" alt="" />
          </div>
          <div
            class="rounded-[32px] p-4 bg-dashboard-bg-dark dark:bg-blend-darken bg-blend-screen bg-center"
            style="
              background-size: 600px;
              background-image: url(&quot;/img/loadscreen_content_bg.jpg&quot;);
            "
          >
            <p class="text-center text-xs uppercase tracking-[2px] mb-3">
              Quote of day
            </p>
            <div
              class="rounded-[20px] bg-dashboard-bg p-6 md:p-11 relative overflow-hidden"
            >
              <img src="/img/quote_blue.svg" class="w-[40px]" alt="" />
              <img
                src="/img/quote_gray.svg"
                class="w-[120px] md:w-[190px] absolute bottom-0 right-0 dark:mix-blend-overlay"
                alt=""
              />

              <div class="mt-4 md:mt-6 md:w-[80%] min-h-[132px] md:min-h-[168px]">
                <template v-if="showQuoteShimmer">
                  <div class="space-y-3 md:space-y-4">
                    <div class="space-y-2.5 md:space-y-3">
                      <span
                        class="block h-6 md:h-8 w-full rounded-full shimmer-bg"
                      ></span>
                      <span
                        class="block h-6 md:h-8 w-[94%] rounded-full shimmer-bg"
                      ></span>
                      <span
                        class="block h-6 md:h-8 w-[76%] rounded-full shimmer-bg"
                      ></span>
                    </div>
                    <span
                      class="block h-4 md:h-6 w-32 md:w-44 rounded-full shimmer-bg"
                    ></span>
                  </div>
                </template>
                <template v-else>
                  <blockquote
                    class="text-lg md:text-[25px] text-dashboard-heading leading-snug"
                  >
                    {{ quoteOfTheDay }}
                  </blockquote>
                  <p
                    class="mt-3 md:mt-4 capitalize text-base md:text-[20px] text-dashboard-text"
                  >
                    {{ author }}
                  </p>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div
          class="max-w-[80%] relative mx-auto rounded-b-[24px] py-4 bg-dashboard-bg-darker border border-dashboard-card-border"
        >
          <button
            @click="hideScreen"
            class="py-2 px-5 hover:border-brand-color-default shadow-xl shadow-transparent hover:shadow-brand-color-009/30 cursor-pointer rounded-full bg-dashboard-bg text-dashboard-text text-[13px] absolute left-[50%] translate-[-50%] bottom-0 translate-y-[50%] border border-dashboard-card-border"
          >
            Skip
          </button>
        </div>
      </div>

      <div></div>
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.shimmer-bg {
  background: linear-gradient(
    90deg,
    var(--color-shimmer-base) 25%,
    var(--color-shimmer-highlight) 50%,
    var(--color-shimmer-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
