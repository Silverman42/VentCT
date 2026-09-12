<script setup lang="ts">
const { profile, isLoggingOut, logout } = useUtilityBarMockData();
</script>

<template>
  <AppDropdown :width-is-finite="false" position="right">
    <ul
      class="inline-flex h-12 w-auto items-center gap-0.5 rounded-full border border-dashboard-card-border p-1 shadow-lg shadow-transparent transition-all duration-300 ease-in-out hover:border-brand-color-default hover:shadow-brand-color-009/50"
    >
      <li
        class="h-10 w-10 overflow-hidden rounded-full border border-dashboard-bg bg-brand-color-007"
      >
        <img
          :src="profile.avatar"
          class="h-full w-full object-cover object-center"
          :alt="`${profile.name} profile image`"
        />
      </li>
      <li
        class="mr-1 aspect-square w-6 overflow-hidden text-dashboard-card-border group-hover:text-brand-color-007"
      >
        <Icon name="vent:arrow-down" size="1.3rem" />
      </li>
    </ul>

    <template #dropdown_body>
      <div class="w-[262px]">
        <div
          class="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-md bg-profile-card-bg p-6"
        >
          <img
            src="/img/utility-box-bg.png"
            class="absolute inset-0 h-full w-full object-cover object-center opacity-50"
            alt=""
          />

          <figure
            class="relative z-[2] h-16 w-16 overflow-hidden rounded-full border border-dashboard-bg bg-brand-color-007"
          >
            <img
              :src="profile.avatar"
              class="h-full w-full object-cover object-center"
              :alt="`${profile.name} profile image`"
            />
          </figure>

          <div class="relative z-[2] flex w-full flex-col items-center gap-0.5">
            <h2
              class="text-center text-sm font-medium capitalize text-profile-card-heading"
            >
              {{ profile.name }}
            </h2>
            <p class="text-center text-sm text-profile-card-subtext">
              {{ profile.email }}
            </p>
            <p
              class="text-center text-[0.625rem] capitalize text-profile-card-subtext-2"
            >
              {{ profile.role }}
            </p>
          </div>
        </div>

        <ul class="mt-2 grid w-full grid-cols-1 gap-2">
          <li class="text-xs uppercase tracking-widest text-dropdown-heading">
            Misc.
          </li>
          <li>
            <NuxtLink
              to="/password-reset"
              class="group flex w-full cursor-pointer items-center gap-1 rounded-xl bg-transparent p-3 py-4 hover:bg-brand-color-007/20"
            >
              <span
                class="flex aspect-square w-5 items-center overflow-hidden text-dashboard-heading group-hover:text-brand-color-007"
              >
                <Icon name="vent:security-user" size="1.2rem" />
              </span>
              <span
                class="text-sm text-dashboard-text group-hover:text-brand-color-007"
              >
                Reset Password
              </span>
              <span
                class="ml-auto flex aspect-square w-5 items-center overflow-hidden text-dashboard-text-lighter group-hover:text-brand-color-007"
              >
                <Icon name="vent:arrow-right" size="1rem" />
              </span>
            </NuxtLink>
          </li>
          <li>
            <button
              class="flex w-full cursor-pointer items-center gap-1 rounded-xl bg-orange-013 p-3 py-4 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              :disabled="isLoggingOut"
              @click="logout"
            >
              <span
                class="flex aspect-square w-5 items-center overflow-hidden text-orange-default"
              >
                <Icon
                  :name="isLoggingOut ? 'vent:loading' : 'vent:logout'"
                  size="1.2rem"
                />
              </span>
              <span class="text-sm text-orange-default">
                {{ isLoggingOut ? "Logging out" : "Logout" }}
              </span>
            </button>
          </li>
          <li>
            <UtilityBarThemeManager />
          </li>
        </ul>
      </div>
    </template>
  </AppDropdown>
</template>
