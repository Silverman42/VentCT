<template>
  <div
    class="max-w-[1246px] min-h-[80vh] w-full bg-auth-bg relative z-3 p-6 md:p-22 overflow-hidden flex flex-col-reverse md:flex-row items-center justify-between"
  >
    <div class="max-w-[409px] w-full flex flex-col items-center md:items-start">
      <img src="/img/500_icon.svg" class="w-[39.3px] mb-5" alt="" />
      <h1
        class="text-auth-heading font-semibold tracking-tight text-[1.8rem] md:text-[3.8rem] mb-2"
      >
        500 Error
      </h1>
      <p
        class="text-[1rem] md:text-[1.5rem] text-dashboard-heading font-semibold mb-2 text-center md:text-left"
      >
        Something went wrong
      </p>
      <p
        class="text-sm md:text-[1.3rem] text-dashboard-text mb-2 text-center md:text-left"
      >
        We are experiencing technical difficulties. Please try again later.
      </p>

      <div class="mt-11">
        <AppButton :block="false" type="button"> Contact Support </AppButton>
      </div>
    </div>

    <div class="max-w-[599px] w-full">
      <img src="/img/500.svg" class="w-full" alt="" />
    </div>
  </div>
</template>
