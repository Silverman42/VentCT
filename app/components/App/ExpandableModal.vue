<script setup lang="ts">
const isOpen = ref<boolean>(false);

const dialogBox = ref<HTMLDialogElement | null>(null);

const emit = defineEmits(["viewFullModal", "viewMiniModal"]);

const modalWidthIsFull = ref(false);
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

const toggleModalWidth = () => {
  modalWidthIsFull.value = !modalWidthIsFull.value;
  modalWidthIsFull.value ? emit("viewFullModal") : emit("viewMiniModal");
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
      style="z-index: 9999"
      @click="handleOutsideClick($event)"
      @touchEnd="handleOutsideTouchClick($event)"
    ></div>

    <dialog
      ref="dialogBox"
      @keydown.prevent.esc="hideDialogBox()"
      class="dialog-box"
      :class="{
        open: modalWidthIsFull,
      }"
    >
      <Transition name="slideInLeft">
        <div class="dialog-body" v-if="isOpen">
          <!-- heading -->
          <div
            class="absolute top-0 right-0 w-full flex items-center justify-between p-6 z-[10] bg-dashboard-bg/80 backdrop-blur-2xl"
          >
            <button
              @click="toggleModalWidth"
              class="hover:text-brand-color-default cursor-pointer"
              :class="{
                'text-brand-color-default rotate-180': modalWidthIsFull,
                'text-dashboard-text': !modalWidthIsFull,
              }"
            >
              <icon name="vent:sidebar-right" size="1.5rem"></icon>
            </button>

            <button
              class="text-sm py-2 px-4 bg-[#FFF8F4] cursor-pointer transition duration-150 ease-in-out hover:bg-orange-013 text-orange-default rounded-full"
              @click="hideDialogBox"
            >
              Close
            </button>
          </div>
          <!-- heading end-->

          <div
            class="max-h-[100%] overflow-y-auto h-full px-4 md:px-11 pt-24 pb-32"
          >
            <slot></slot>
          </div>

          <!-- footer -->
          <button
            @click="toggleModalWidth"
            class="bg-dashboard-bg p-2 rounded-full shadow-2xl group cursor-pointer absolute left-1/2 translate-x-[-50%] bottom-8"
          >
            <span
              class="inline-flex items-center gap-2 py-3 px-4 bg-dashboard-bg-dark border border-dashboard-card-border text-dashboard-text rounded-full group-hover:bg-brand-color-013 group-hover:border-brand-color-default group-hover:text-brand-color-default"
            >
              <icon
                name="vent:slider-horizontal"
                size="1rem"
                class="group-hover:text-brand-color-default"
              ></icon>

              {{ modalWidthIsFull ? "Exit Full" : "Full" }} Mode</span
            >
          </button>
          <!-- footer end-->
        </div>
      </Transition>
    </dialog>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.dialog-box {
  @apply w-full md:w-[700px] h-screen right-0 bottom-0 bg-transparent m-0 inset-auto transform-none outline-none overflow-visible;
  @apply transition-all ease-in-out duration-200;
  position: fixed;
  z-index: 10000; /* Higher than backdrop (9999) but lower than toast (400000000) */
}

.dialog-box.open {
  @apply md:w-full;
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
  @apply w-full h-full relative;
  background-color: var(--color-dashboard-bg);
}

.dialog-box .dialog--close-btn {
  @apply md:absolute md:left-0 border border-dashboard-card-border md:border-0 md:top-20 md:translate-[-50%] rounded-full w-[29px] h-[29px] md:w-[48px]  md:h-[48px] ml-auto md:ml-0 flex items-center justify-center cursor-pointer;
  @apply rounded-full bg-dashboard-bg text-dashboard-heading hover:text-brand-color-default;
}
</style>
