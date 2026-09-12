<script setup lang="ts">
import { ThemeMode, useThemeHandler } from "~/composables/useThemeHandler";

const { themeMode, setTheme } = useThemeHandler();
</script>

<template>
  <div class="flex items-center justify-between p-2">
    <span class="text-sm text-dashboard-heading">Theme</span>

    <div class="inline-flex gap-0.5 rounded-[6px] bg-dashboard-bg-dark p-0.5">
      <button
        class="flex h-[25px] w-[25px] items-center justify-center rounded-[4px] hover:text-brand-color-007"
        :class="{
          'bg-dashboard-bg text-brand-color-007': themeMode === ThemeMode.LIGHT,
          'bg-transparent text-dashboard-text': themeMode !== ThemeMode.LIGHT,
        }"
        type="button"
        aria-label="Use light theme"
        @click="setTheme(ThemeMode.LIGHT)"
      >
        <Icon name="vent:light-mode" size="15px" />
      </button>
      <button
        class="flex h-[25px] w-[25px] items-center justify-center rounded-[4px] hover:text-brand-color-007"
        :class="{
          'bg-dashboard-bg text-brand-color-007': themeMode === ThemeMode.DARK,
          'bg-transparent text-dashboard-text': themeMode !== ThemeMode.DARK,
        }"
        type="button"
        aria-label="Use dark theme"
        @click="setTheme(ThemeMode.DARK)"
      >
        <Icon name="vent:dark-mode" size="15px" />
      </button>
      <button
        class="flex h-[25px] w-[25px] items-center justify-center rounded-[4px] hover:text-brand-color-007"
        :class="{
          'bg-dashboard-bg text-brand-color-007': themeMode === ThemeMode.SYSTEM,
          'bg-transparent text-dashboard-text': themeMode !== ThemeMode.SYSTEM,
        }"
        type="button"
        aria-label="Use system theme"
        @click="setTheme(ThemeMode.SYSTEM)"
      >
        <Icon name="vent:default" size="15px" />
      </button>
    </div>
  </div>
</template>
