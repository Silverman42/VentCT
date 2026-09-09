import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,
  modules: ["@nuxt/icon"],
  css: ["~/assets/css/main.css", "~/assets/css/transitions.css"],
  icon: {
    customCollections: [
      {
        prefix: "vent",
        dir: "./app/assets/icons",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL ?? process.env.API_BASE_URL,
    public: {
      flagsApiUrl:
        process.env.NUXT_PUBLIC_FLAGS_API_URL ?? process.env.FLAGS_API_URL,
    },
  },
});
