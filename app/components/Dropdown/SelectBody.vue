<script setup lang="ts">
import { computed, ref } from "vue";

interface ListData {
  id: string;
  name: string;
  data?: any;
}
const props = withDefaults(
  defineProps<{
    list: ListData[];
    searchPlaceHolder?: string;
  }>(),
  {
    searchPlaceHolder: "Search for state",
  }
);

const searchValue = ref("");

const emits = defineEmits(["optionSelected"]);

const selectedValue = defineModel<ListData>("selectedValue", {
  default: {
    id: "",
    name: "",
  },
});

const filterList = computed(() => {
  return props.list.filter((listData) =>
    listData.name.toLocaleLowerCase().includes(searchValue.value.toLowerCase())
  );
});

const selectData = (data: ListData) => {
  selectedValue.value = data;
  emits("optionSelected");
};
</script>
<template>
  <div class="grid grid-cols-1 gap-2 bg-dashboard-bg">
    <input
      type="text"
      :placeholder="props.searchPlaceHolder"
      v-model="searchValue"
      class="border placeholder:text-sm w-full placeholder:text-dashboard-text-light text-dashboard-heading font-bold placeholder:font-bold tracking-wide border-dashboard-card-border bg-dashboard-bg-darker rounded-lg py-3 px-4 uppercase outline-none ring-transparent ring-4 transition-all duration-300 ease-in focus:ring-primary/10 focus:border-primary"
     autocomplete="new-password-no-autofill" />

    <ul
      class="grid grid-cols-1 border border-dashboard-card-border rounded-xl max-h-[11rem] overflow-y-auto"
    >
      <li
        v-for="(data, index) in filterList"
        :key="index"
        tabindex="0"
        role="button"
        @click="selectData(data)"
        @keyup.enter="selectData(data)"
        class="block outline-0 py-4 px-3 last:border-b-0 border-b border-[#F4F4FD] uppercase font-semibold tracking-wider text-sm hover:text-primary hover:bg-primary/5 focus:text-primary focus:bg-primary/5 cursor-pointer"
        :class="{
          'text-brand-color-006 bg-brand-color-012':
            selectedValue?.id === data.id,
          'text-dashboard-text': selectedValue?.id !== data.id,
        }"
      >
        <slot name="listData">
          {{ data.name }}
        </slot>
      </li>
    </ul>
  </div>
</template>
