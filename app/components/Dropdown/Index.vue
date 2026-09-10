<script lang="ts" setup>
import { ref } from 'vue'

withDefaults(
  defineProps<{
    position: 'left' | 'center' | 'right'
    widthIsFinite?: boolean
    containerFull?: boolean
  }>(),
  {
    position: 'left',
    widthIsFinite: true,
    containerFull: false,
  },
)
const dropDownIsOpen = ref<boolean>(false)
const toggleDropdown = () => (dropDownIsOpen.value = !dropDownIsOpen.value)
const closeDropdown = () => (dropDownIsOpen.value = false)
defineExpose({
  toggleDropdown,
  closeDropdown,
  dropDownIsOpen,
})
</script>
<template>
  <transition name="fade">
    <div
      v-if="dropDownIsOpen"
      class="w-screen h-screen fixed left-0 bottom-0 right-0 top-0 z-[100]"
      @click="closeDropdown"
    ></div>
  </transition>
  <div
    class="inline-flex relative"
    :class="{
      'w-auto': containerFull === false,
      'w-full': containerFull === true,
    }"
  >
    <div
      class="inline-block w-full cursor-pointer"
      tabindex="0"
      @click="toggleDropdown"
      @keyup.enter="toggleDropdown"
    >
      <slot></slot>
    </div>
    <transition name="slideUp">
      <div
        v-if="dropDownIsOpen"
        class="absolute inline-block top-[120%] overflow-hidden z-[140] rounded-lg bg-dropdown-outline shadow-lg shadow-slate-300/40 p-0.5"
        :class="{
          'left-0': position === 'left',
          'right-0': position === 'right',
          'left-[50%] -translate-x-[50%]': position === 'center',
          'w-auto': widthIsFinite === false,
          'w-[100%]': widthIsFinite === true,
        }"
      >
        <div class="bg-white rounded-md px-2 py-2 border outline-none border-[#F4F4FD]">
          <slot name="dropdown_body"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slideUp-enter-active,
.slideUp-leave-active {
  transition: all 0.5s ease;
}

.slideUp-enter-from,
.slideUp-leave-to {
  opacity: 0;
  transform: translateY(80%);
}
</style>
