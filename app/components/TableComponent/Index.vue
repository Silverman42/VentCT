<script setup lang="ts">
import type {
  ITableBodyData,
  ITableHeaderData,
} from "~/utils/types/misc/TableComponent";

type TableRowKey = string | number;

const props = withDefaults(
  defineProps<{
    headings: ITableHeaderData[];
    body: ITableBodyData[];
    rowKey?: string;
    isLoading?: boolean;
    clickable?: boolean;
    emptyHeading?: string;
    emptySubtitle?: string;
  }>(),
  {
    rowKey: "id",
    isLoading: false,
    clickable: false,
    emptyHeading: "Nothing to show here!",
    emptySubtitle: "There are no records matching the current view.",
  },
);

const emit = defineEmits<{
  rowClick: [row: ITableBodyData];
}>();

/** Resolves a stable key for Vue rendering, even when a row is partial. */
const getRowKey = (row: ITableBodyData, index: number): TableRowKey => {
  const value = (row as Record<string, unknown>)[props.rowKey];

  return typeof value === "string" || typeof value === "number"
    ? value
    : index;
};

/** Converts simple data values into safe display text for default table cells. */
const getCellValue = (row: ITableBodyData, key: string): string => {
  const value = (row as Record<string, unknown>)[key];

  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

/** Emits a selected row when the table consumer enables row navigation. */
const triggerRowClick = (row: ITableBodyData) => {
  if (!props.clickable) return;
  emit("rowClick", row);
};

/** Supports keyboard navigation for clickable desktop and mobile rows. */
const handleRowKeydown = (event: KeyboardEvent, row: ITableBodyData) => {
  if (!props.clickable || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }

  event.preventDefault();
  triggerRowClick(row);
};

/** Maps the optional alignment value to the corresponding Tailwind utility. */
const getAlignmentClass = (heading: ITableHeaderData): string => {
  if (heading.justify === "center") return "text-center";
  if (heading.justify === "right") return "text-right";
  return "text-left";
};
</script>

<template>
  <section
    class="w-full overflow-hidden rounded-[14px] border border-dashboard-card-border bg-dashboard-bg"
    aria-live="polite"
  >
    <div v-if="$slots['table-heading']" class="border-b border-dashboard-card-border p-4 md:p-5">
      <slot name="table-heading" />
    </div>

    <TableComponentShimmer v-if="props.isLoading" :headings="props.headings" />

    <template v-else-if="props.body.length">
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-160 border-collapse text-sm">
          <thead class="bg-table-heading-bg text-xs text-dashboard-text">
            <tr>
              <th
                v-for="heading in props.headings"
                :key="heading.id"
                scope="col"
                class="px-5 py-4 font-normal"
                :class="getAlignmentClass(heading)"
                :style="heading.width ? { width: heading.width } : undefined"
              >
                <slot :name="`head_${heading.id}`" :heading="heading">
                  {{ heading.name }}
                </slot>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in props.body"
              :key="getRowKey(row, index)"
              class="border-t border-dashboard-card-border text-dashboard-heading transition-colors"
              :class="{
                'cursor-pointer hover:bg-dashboard-bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-color-default/40':
                  props.clickable,
              }"
              :tabindex="props.clickable ? 0 : undefined"
              @click="triggerRowClick(row)"
              @keydown="handleRowKeydown($event, row)"
            >
              <td
                v-for="heading in props.headings"
                :key="heading.id"
                class="px-5 py-4 align-middle"
                :class="getAlignmentClass(heading)"
              >
                <slot :name="`col_${heading.id}`" :row-data="row" :heading="heading">
                  {{ getCellValue(row, heading.id) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="divide-y divide-dashboard-card-border md:hidden">
        <article
          v-for="(row, index) in props.body"
          :key="getRowKey(row, index)"
          class="grid gap-3 p-4 transition-colors"
          :class="{
            'cursor-pointer hover:bg-dashboard-bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-color-default/40':
              props.clickable,
          }"
          :tabindex="props.clickable ? 0 : undefined"
          @click="triggerRowClick(row)"
          @keydown="handleRowKeydown($event, row)"
        >
          <div
            v-for="heading in props.headings.filter((item) => !item.isHiddenOnMobile)"
            :key="heading.id"
            class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-4"
          >
            <p class="text-xs text-dashboard-text">
              {{ heading.mobileLabel ?? heading.name }}
            </p>
            <div
              class="min-w-0 break-words text-sm text-dashboard-heading"
              :class="getAlignmentClass(heading)"
            >
              <slot :name="`col_${heading.id}`" :row-data="row" :heading="heading">
                {{ getCellValue(row, heading.id) }}
              </slot>
            </div>
          </div>
        </article>
      </div>
    </template>

    <AppEmptyState
      v-else
      :heading="props.emptyHeading"
      :empty-table-subtitle="props.emptySubtitle"
      height="18rem"
      :hide-image="true"
    >
      <slot name="empty-action" />
    </AppEmptyState>

    <div v-if="$slots['table-footer'] && !props.isLoading && props.body.length" class="border-t border-dashboard-card-border px-4 py-3 md:px-5">
      <slot name="table-footer" />
    </div>
  </section>
</template>
