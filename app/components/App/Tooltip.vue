<script lang="ts" setup>
defineOptions({
  inheritAttrs: false,
});

type TooltipPlacement = "top" | "bottom" | "left" | "right";

const props = withDefaults(
  defineProps<{
    text?: string;
    placement?: TooltipPlacement;
    disabled?: boolean;
    offset?: number;
  }>(),
  {
    text: "",
    placement: "top",
    disabled: false,
    offset: 8,
  },
);

const attrs = useAttrs();

let tooltipIdCounter = 0;
const tooltipId = `app-tooltip-${++tooltipIdCounter}`;

const tooltipIsVisible = ref(false);
const isPositioned = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const activePlacement = ref<TooltipPlacement>(props.placement);

const tooltipStyle = ref<{ top: string; left: string }>({
  top: "0px",
  left: "0px",
});

const showTooltip = () => {
  if (props.disabled) return;
  tooltipIsVisible.value = true;
  isPositioned.value = false;

  nextTick(() => {
    requestAnimationFrame(() => {
      calculatePosition();
    });
  });
};

const hideTooltip = () => {
  tooltipIsVisible.value = false;
  isPositioned.value = false;
};

const calculatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 8;

  const availableSpace = {
    top: triggerRect.top - props.offset,
    bottom: viewportHeight - triggerRect.bottom - props.offset,
    left: triggerRect.left - props.offset,
    right: viewportWidth - triggerRect.right - props.offset,
  };

  const fits = {
    top: tooltipRect.height <= availableSpace.top,
    bottom: tooltipRect.height <= availableSpace.bottom,
    left: tooltipRect.width <= availableSpace.left,
    right: tooltipRect.width <= availableSpace.right,
  };

  let placement: TooltipPlacement = props.placement;
  if (!fits[placement]) {
    const sorted = (Object.keys(availableSpace) as TooltipPlacement[]).sort(
      (a, b) => availableSpace[b] - availableSpace[a],
    );
    placement = sorted[0] ?? props.placement;
  }

  activePlacement.value = placement;

  let top = 0;
  let left = 0;

  if (placement === "top") {
    top = triggerRect.top - tooltipRect.height - props.offset;
    left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.min(
      Math.max(left, padding),
      viewportWidth - tooltipRect.width - padding,
    );
  }

  if (placement === "bottom") {
    top = triggerRect.bottom + props.offset;
    left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.min(
      Math.max(left, padding),
      viewportWidth - tooltipRect.width - padding,
    );
  }

  if (placement === "left") {
    left = triggerRect.left - tooltipRect.width - props.offset;
    top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    top = Math.min(
      Math.max(top, padding),
      viewportHeight - tooltipRect.height - padding,
    );
  }

  if (placement === "right") {
    left = triggerRect.right + props.offset;
    top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    top = Math.min(
      Math.max(top, padding),
      viewportHeight - tooltipRect.height - padding,
    );
  }

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  };

  isPositioned.value = true;
};

const handleReposition = () => {
  if (tooltipIsVisible.value && isPositioned.value) {
    calculatePosition();
  }
};

const tooltipArrowClass = computed(() => {
  switch (activePlacement.value) {
    case "bottom":
      return "tooltip-arrow-top";
    case "left":
      return "tooltip-arrow-right";
    case "right":
      return "tooltip-arrow-left";
    case "top":
    default:
      return "tooltip-arrow-bottom";
  }
});

onMounted(() => {
  window.addEventListener("scroll", handleReposition, true);
  window.addEventListener("resize", handleReposition);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleReposition, true);
  window.removeEventListener("resize", handleReposition);
});
</script>

<template>
  <span
    ref="triggerRef"
    v-bind="attrs"
    class="inline-flex"
    :aria-describedby="tooltipIsVisible ? tooltipId : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled ? -1 : 0"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <slot></slot>
  </span>

  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="tooltipIsVisible"
        ref="tooltipRef"
        :id="tooltipId"
        class="fixed z-[100000] px-4 py-2 text-[9px] font-medium rounded-lg whitespace-nowrap pointer-events-none"
        :class="{
          invisible: !isPositioned,
          visible: isPositioned,
        }"
        :style="{
          top: tooltipStyle.top,
          left: tooltipStyle.left,
          backgroundColor: '#001119',
          color: '#E5F6FF',
        }"
        role="tooltip"
      >
        <slot name="content">
          {{ text }}
        </slot>
        <span class="tooltip-arrow" :class="tooltipArrowClass"></span>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.tooltip-arrow-bottom {
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #001119;
}

.tooltip-arrow-top {
  left: 50%;
  top: -6px;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #001119;
}

.tooltip-arrow-left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #001119;
}

.tooltip-arrow-right {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #001119;
}
</style>
