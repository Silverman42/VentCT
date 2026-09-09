<script setup lang="ts">
const { dashboardType } = useDashboardTypeHandler();

const props = withDefaults(
  defineProps<{
    fullWidth?: boolean;
  }>(),
  {
    fullWidth: false,
  },
);

const handleDashboardSwitch = () => {
  scrollTo({ top: 0, behavior: "smooth" });
};
</script>
<template>
  <ul
    class="flex gap-2 items-center"
    :class="{
      'w-full': props.fullWidth,
    }"
  >
    <li
      :class="{
        'w-full': props.fullWidth,
      }"
      v-permission="['dashboard.basic.view']"
    >
      <label
        class="flex items-center gap-2 relative p-2 text-[0.813rem] cursor-pointer pr-3 group"
        :class="{
          'w-full': props.fullWidth,
          'justify-center': props.fullWidth,
        }"
        tabindex="0"
        @click="handleDashboardSwitch"
      >
        <input
          type="radio"
          v-model="dashboardType"
          name="dashboard_mode"
          :value="DashboardType.SIMPLE"
          class="sr-only peer"
         autocomplete="new-password-no-autofill" />
        <span
          class="border border-dashboard-card-divider absolute top-0 left-0 w-full h-full rounded-[8px] group-hover:border-brand-color-default peer-checked:border-brand-color-default"
        >
        </span>
        <i
          class="flex items-center justify-center w-[22px] h-[18px] border border-dashboard-card-divider rounded-[8px] bg-dashboard-bg-darker text-dashboard-heading group-hover:border-brand-color-default group-hover:bg-brand-color-default group-hover:text-white peer-checked:border-brand-color-default peer-checked:bg-brand-color-default peer-checked:text-white"
        >
          <Icon name="vent:simple-dashboard" size="0.7rem" class="" />
        </i>
        <p class="text-dashboard-heading">Simple</p>
      </label>
    </li>

    <li class="border-l block border-dashboard-card-border h-full"></li>

    <li
      :class="{
        'w-full': props.fullWidth,
      }"
      v-permission="['dashboard.advanced.view']"
    >
      <label
        @click="handleDashboardSwitch"
        class="flex items-center gap-2 relative p-2 text-[0.813rem] cursor-pointer pr-3 group"
        :class="{
          'w-full': props.fullWidth,
          'justify-center': props.fullWidth,
        }"
        tabindex="0"
      >
        <input
          type="radio"
          name="dashboard_mode"
          v-model="dashboardType"
          :value="DashboardType.ADVANCED"
          class="sr-only peer"
         autocomplete="new-password-no-autofill" />
        <span
          class="border border-dashboard-card-divider absolute top-0 left-0 w-full h-full rounded-[8px] group-hover:border-brand-color-default peer-checked:border-brand-color-default"
        >
        </span>
        <i
          class="flex items-center justify-center w-[22px] h-[18px] border border-dashboard-card-divider rounded-[8px] bg-dashboard-bg-darker text-dashboard-heading group-hover:border-brand-color-default group-hover:bg-brand-color-default group-hover:text-white peer-checked:border-brand-color-default peer-checked:bg-brand-color-default peer-checked:text-white"
        >
          <Icon name="vent:advanced-dashboard" size="0.7rem" class="" />
        </i>
        <p class="text-dashboard-heading">Advanced</p>
      </label>
    </li>
  </ul>
</template>
