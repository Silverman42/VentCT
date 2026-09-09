<template>
  <div
    class="px-6 py-4 bg-rose-010 gap-2 flex items-center overflow-hidden relative rounded-[16px]"
  >
    <i class="shrink-0 w-5 h-5">
      <icon name="vent:warning-2" size="1.4rem"></icon>
    </i>
    <p class="text-black text-sm md:text-base relative z-1">
      <slot></slot>
    </p>

    <img
      src="/img/warning_message_2.svg"
      class="absolute w-35 md:w-40 -right-30 md:right-0 bottom-0"
      alt=""
    />
  </div>
</template>
