<template>
  <div
    class="p-6 py-4 bg-[#F2F4F7] gap-2 flex items-center overflow-hidden relative rounded-[16px]"
  >
    <i class="shrink-0 w-5 h-5 text-black flex items-center">
      <icon name="vent:info-circle" size="1.4rem"></icon>
    </i>
    <p class="text-black text-sm md:text-base relative z-1">
      <slot></slot>
    </p>

    <img
      src="/img/warning_message_1.svg"
      class="absolute w-35 md:w-40 -right-30 md:right-0 bottom-0"
      alt=""
    />
  </div>
</template>
