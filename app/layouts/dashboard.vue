<template>
  <div>
    <AppToast />

    <div class="flex w-full font-body">
      <Sidebar />

      <div class="min-h-screen grow bg-dashboard-bg">
        <UtilityBar />

        <main class="p-5 pb-20 md:p-8 md:pb-20">
          <div class="mx-auto min-h-[calc(100vh-160px)] max-w-[1600px]">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
