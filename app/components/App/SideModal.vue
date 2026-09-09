<script setup lang="ts">
const isOpen = ref<boolean>(false);

const props = withDefaults(
  defineProps<{
    zIndex?: number;
    closeButtonPosition?: "outside" | "inside";
  }>(),
  {
    zIndex: 1,
    closeButtonPosition: "inside",
  },
);

const dialogBox = ref<HTMLDialogElement | null>(null);
const showDialogBox = () => {
  document.querySelector("body")?.classList.add("overflow-hidden");
  isOpen.value = true;
  // Use show() instead of showModal() to avoid top layer
  dialogBox.value?.show();
};

const hideDialogBox = () => {
  document.querySelector("body")?.classList.remove("overflow-hidden");
  isOpen.value = false;
  setTimeout(() => {
    dialogBox.value?.close();
  }, 400);
};

// Helper function to check if click/touch is outside dialog
const isOutsideDialog = (clientX: number, clientY: number): boolean => {
  if (!dialogBox.value) return false;

  const dialogDimensions = dialogBox.value.getBoundingClientRect();
  return (
    clientX < dialogDimensions.left ||
    clientX > dialogDimensions.right ||
    clientY < dialogDimensions.top ||
    clientY > dialogDimensions.bottom
  );
};

const handleOutsideClick = (e: MouseEvent) => {
  if (isOutsideDialog(e.clientX, e.clientY)) {
    hideDialogBox();
  }
};

const handleOutsideTouchClick = (e: TouchEvent) => {
  if (e.changedTouches.length > 0) {
    const touch = e.changedTouches[0];
    if (!touch) return;
    if (isOutsideDialog(touch.clientX, touch.clientY)) {
      hideDialogBox();
    }
  }
};

onUnmounted(() => {
  document.querySelector("body")?.classList.remove("overflow-hidden");
});

defineExpose({
  showDialogBox,
  hideDialogBox,
});
</script>
<template>
  <div class="font-body">
    <!-- Custom backdrop to replace native dialog backdrop -->
    <div
      v-if="isOpen"
      class="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-md"
      :style="{ 'z-index': props.zIndex * 9999 }"
      @click="handleOutsideClick($event)"
      @touchEnd="handleOutsideTouchClick($event)"
    ></div>

    <dialog
      ref="dialogBox"
      @keydown.prevent.esc="hideDialogBox()"
      class="dialog-box"
      :style="{ 'z-index': props.zIndex * 10000 }"
    >
      <Transition name="slideInLeft">
        <div class="dialog-body" v-if="isOpen">
          <button
            type="button"
            aria-label="Close side panel"
            @click="hideDialogBox"
            class="dialog--close-btn"
            :class="{
              'dialog--close-btn--inside':
                props.closeButtonPosition === 'inside',
            }"
          >
            <icon name="vent:close" size="1.5rem"></icon>
          </button>
          <div class="max-h-[100%] overflow-y-auto h-full pr-4">
            <slot></slot>
          </div>
        </div>
      </Transition>
    </dialog>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.dialog-box {
  @apply w-full md:w-[700px] h-screen p-4 right-0 bottom-0 bg-transparent m-0 inset-auto transform-none outline-none overflow-visible;
  position: fixed;
  /* Higher than backdrop (9999) but lower than toast (400000000) */
}

.dialog-box:-internal-dialog-in-top-layer {
  max-height: 100vh !important;
  max-width: 100vw !important;
}

/* Disable native backdrop since we're using custom backdrop */
.dialog-box::backdrop {
  display: none;
}

/* Style for custom backdrop */
.modal-backdrop {
  z-index: 9999;
}

.dialog-box .dialog-body {
  @apply w-full h-full bg-dashboard-bg rounded-3xl pb-16 p-4 md:p-11 relative;
}

.dialog-box .dialog--close-btn {
  @apply md:absolute md:left-0 border border-dashboard-card-border md:border-0 md:top-20 md:translate-[-50%] rounded-full w-[29px] h-[29px] md:w-[48px]  md:h-[48px] ml-auto md:ml-0 flex items-center justify-center cursor-pointer;
  @apply rounded-full bg-dashboard-bg text-dashboard-heading hover:text-brand-color-default;
}

.dialog-box .dialog--close-btn--inside {
  @apply md:left-auto md:right-4 md:top-4 md:translate-0 md:border md:w-[40px] md:h-[40px] md:z-10;
}
</style>
