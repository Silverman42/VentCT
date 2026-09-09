<template>
  <div
    class="p-6 py-4 bg-[#F3FBFF] gap-2 flex items-center overflow-hidden relative rounded-[16px]"
  >
    <i class="shrink-0 w-5 h-5 flex items-center">
      <icon name="vent:information" size="1.4rem"></icon>
    </i>
    <p class="text-brand-color-007 text-sm md:text-base relative z-1">
      <slot></slot>
    </p>

    <img
      src="/img/alert_info.svg"
      class="absolute w-35 h-full object-center md:w-40 top-0 right-0"
      alt=""
    />
  </div>
</template>
