<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    position?: "left" | "center" | "right";
    widthIsFinite?: boolean;
    containerFull?: boolean;
  }>(),
  {
    position: "left",
    widthIsFinite: true,
    containerFull: false,
  },
);

const $emit = defineEmits(["opened", "closed"]);
const dropDownIsOpen = ref<boolean>(false);
const isPositioned = ref<boolean>(false);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

// Dropdown position state
const dropdownStyle = ref<{
  top: string;
  left: string;
  transform: string;
}>({
  top: "0px",
  left: "0px",
  transform: "none",
});

// Track if dropdown should appear above or below trigger
const showAbove = ref(false);
// Track horizontal alignment adjustments
const horizontalAlign = ref<"left" | "center" | "right">(props.position);

const DROPDOWN_GAP = 8; // Gap between trigger and dropdown in pixels

const calculatePosition = () => {
  if (!triggerRef.value || !dropdownRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const dropdownRect = dropdownRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate vertical position
  const spaceBelow = viewportHeight - triggerRect.bottom - DROPDOWN_GAP;
  const spaceAbove = triggerRect.top - DROPDOWN_GAP;

  // Determine if we should show above or below
  if (dropdownRect.height > spaceBelow && spaceAbove > spaceBelow) {
    showAbove.value = true;
  } else {
    showAbove.value = false;
  }

  // Calculate top position (using viewport-relative coordinates for fixed positioning)
  let top: number;
  if (showAbove.value) {
    top = triggerRect.top - dropdownRect.height - DROPDOWN_GAP;
  } else {
    top = triggerRect.bottom + DROPDOWN_GAP;
  }

  // Calculate horizontal position based on preferred alignment
  let left: number;
  let transform = "none";

  const calculateLeftForPosition = (pos: "left" | "center" | "right") => {
    switch (pos) {
      case "left":
        return triggerRect.left;
      case "right":
        return triggerRect.right - dropdownRect.width;
      case "center":
        return triggerRect.left + triggerRect.width / 2;
      default:
        return triggerRect.left;
    }
  };

  left = calculateLeftForPosition(props.position);
  horizontalAlign.value = props.position;

  if (props.position === "center") {
    transform = "translateX(-50%)";
  }

  // Check horizontal overflow and adjust
  const dropdownLeft =
    props.position === "center" ? left - dropdownRect.width / 2 : left;
  const dropdownRight =
    props.position === "center"
      ? left + dropdownRect.width / 2
      : props.position === "left"
        ? left + dropdownRect.width
        : triggerRect.right;

  // Adjust if overflowing right edge
  if (dropdownRight > viewportWidth - 10) {
    if (props.position !== "right") {
      left = calculateLeftForPosition("right");
      horizontalAlign.value = "right";
      transform = "none";
    }
    // If still overflowing, clamp to viewport
    if (left + dropdownRect.width > viewportWidth - 10) {
      left = viewportWidth - dropdownRect.width - 10;
    }
  }

  // Adjust if overflowing left edge
  if (dropdownLeft < 10) {
    if (props.position !== "left") {
      left = calculateLeftForPosition("left");
      horizontalAlign.value = "left";
      transform = "none";
    }
    // If still overflowing, clamp to viewport
    if (left < 10) {
      left = 10;
    }
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    transform,
  };

  // Mark as positioned after calculation
  isPositioned.value = true;
};

const toggleDropdown = () => {
  dropDownIsOpen.value = !dropDownIsOpen.value;
  dropDownIsOpen.value === true ? $emit("opened") : $emit("closed");

  if (dropDownIsOpen.value) {
    // Reset positioned state when opening
    isPositioned.value = false;
    // Wait for DOM to update, then calculate position
    nextTick(() => {
      // Use requestAnimationFrame to ensure the element is painted
      requestAnimationFrame(() => {
        calculatePosition();
      });
    });
  }
};

const closeDropdown = () => {
  dropDownIsOpen.value = false;
  isPositioned.value = false;
  $emit("closed");
};

// Recalculate position on scroll/resize
const handleReposition = () => {
  if (dropDownIsOpen.value && isPositioned.value) {
    calculatePosition();
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleReposition, true);
  window.addEventListener("resize", handleReposition);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleReposition, true);
  window.removeEventListener("resize", handleReposition);
});

defineExpose({
  toggleDropdown,
  closeDropdown,
  dropDownIsOpen,
});
</script>

<template>
  <!-- Backdrop overlay - teleported to body -->
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="dropDownIsOpen"
        class="w-screen h-screen fixed left-0 bottom-0 right-0 top-0 z-[99999]"
        @click="closeDropdown"
      ></div>
    </transition>
  </Teleport>

  <div
    ref="triggerRef"
    class="inline-flex relative"
    :class="{
      'w-auto': containerFull === false,
      'w-full': containerFull === true,
    }"
  >
    <div
      class="inline-block w-full cursor-pointer"
      tabindex="-1"
      @click="toggleDropdown"
    >
      <slot></slot>
    </div>
  </div>

  <!-- Dropdown body - teleported to body -->
  <Teleport to="body">
    <transition name="dropdownSlideUp">
      <div
        v-if="dropDownIsOpen"
        ref="dropdownRef"
        class="fixed overflow-hidden z-[100000] border border-dropdown-border rounded-lg bg-dropdown-outline shadow-lg shadow-dashboard-bg-darker p-0.5"
        :class="{
          'w-auto': widthIsFinite === false,
          'w-[10rem]': widthIsFinite === true,
          invisible: !isPositioned,
          visible: isPositioned,
        }"
        :style="{
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          transform: dropdownStyle.transform,
        }"
      >
        <div
          class="bg-dashboard-bg rounded-md px-2 py-2 border border-dropdown-border"
        >
          <slot name="dropdown_body"> </slot>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
