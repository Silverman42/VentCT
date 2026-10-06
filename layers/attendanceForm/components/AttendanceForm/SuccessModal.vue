<script setup lang="ts">
const emit = defineEmits<{
  again: [];
}>();

const modal = ref<{
  showDialogBox: () => void;
  hideDialogBox: () => void;
} | null>(null);

const firstName = ref<string>("");
const iconIsRevealed = ref<boolean>(false);

/** Opens the modal for the given attendee and animates the check icon in. */
const open = (name: string) => {
  firstName.value = name;
  iconIsRevealed.value = false;
  modal.value?.showDialogBox();
  setTimeout(() => {
    iconIsRevealed.value = true;
  }, 400);
};

/** Closes the modal. */
const close = () => {
  modal.value?.hideDialogBox();
};

defineExpose({ open, close });
</script>
<template>
  <AppModal ref="modal" desktopWidth="400px" hidePattern>
    <div class="flex w-full flex-col items-center gap-6 pb-4">
      <span
        class="inline-flex size-20 items-center justify-center rounded-full bg-green-005/10 text-green-005"
      >
        <Transition name="zoom">
          <svg
            v-if="iconIsRevealed"
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
          >
            <!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/main/license.txt -->
            <g
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path
                fill="currentColor"
                fill-opacity=".3"
                d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
              />
              <path fill="none" stroke-dasharray="14" d="M8 12l3 3l5 -5">
                <animate
                  fill="freeze"
                  attributeName="stroke-dashoffset"
                  dur="0.2s"
                  values="14;0"
                />
              </path>
            </g>
          </svg>
        </Transition>
      </span>

      <div class="flex flex-col items-center gap-1">
        <h2 class="text-center text-2xl font-medium text-dashboard-heading">
          You're all set{{ firstName ? `, ${firstName}` : "" }}!
        </h2>
        <p class="text-center text-base text-dashboard-text">
          Your registration was successful.
        </p>
      </div>

      <AppButton
        type="button"
        size="md"
        color="primary"
        class="w-full max-w-[300px]"
        @click="emit('again')"
      >
        Register Someone Else
      </AppButton>
    </div>
  </AppModal>
</template>
