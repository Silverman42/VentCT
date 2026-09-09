<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    allowedTypes?: string[];
    maxSizeInMb?: number;
  }>(),
  {
    allowedTypes: () => ["image/png", "image/jpeg", "image/jpg"],
    maxSizeInMb: 1,
  },
);

const modelValue = defineModel<File | null>({ default: null });

const { triggerToast } = useToastHandler();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const filePreviewUrl = ref<string | null>(null);

// --- Computed ---

const acceptString = computed(() =>
  props.allowedTypes
    .map((type) => {
      const ext = type.split("/")[1];
      return ext ? `.${ext}` : type;
    })
    .join(", "),
);

const instructionText = computed(() => {
  const extensions = props.allowedTypes
    .map((type) => {
      const ext = type.split("/")[1];
      return ext ? ext.toUpperCase() : type;
    })
    .join(", ");
  return `Upload a ${extensions} file. Maximum size ${props.maxSizeInMb}mb.`;
});

const isImageFile = computed(() =>
  modelValue.value ? modelValue.value.type.startsWith("image/") : false,
);

const formattedFileSize = computed(() => {
  if (!modelValue.value) return "";
  const bytes = modelValue.value.size;
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
});

// --- Methods ---

const validateFile = (file: File): boolean => {
  if (!props.allowedTypes.includes(file.type)) {
    const extensions = props.allowedTypes
      .map((t) => t.split("/")[1]?.toUpperCase())
      .filter(Boolean)
      .join(", ");
    triggerToast(
      `Only ${extensions} files are allowed.`,
      "error",
      "Invalid file type",
    );
    return false;
  }

  const maxBytes = props.maxSizeInMb * 1024 * 1024;
  if (file.size > maxBytes) {
    triggerToast(
      `File must be smaller than ${props.maxSizeInMb}MB.`,
      "error",
      "File too large",
    );
    return false;
  }

  return true;
};

const setFile = (file: File) => {
  if (!validateFile(file)) return;

  // Revoke previous preview URL if any
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
    filePreviewUrl.value = null;
  }

  modelValue.value = file;

  if (file.type.startsWith("image/")) {
    filePreviewUrl.value = URL.createObjectURL(file);
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) setFile(file);
  // Reset value so the same file can be re-selected
  input.value = "";
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) setFile(file);
};

const removeFile = () => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
    filePreviewUrl.value = null;
  }
  modelValue.value = null;
};

const replaceFile = () => {
  triggerFileInput();
};

onUnmounted(() => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
  }
});
</script>

<template>
  <div class="w-full">
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      class="sr-only"
      :accept="acceptString"
      @change="handleFileChange"
     autocomplete="new-password-no-autofill" />

    <!-- File selection box -->
    <div
      v-if="!modelValue"
      class="border border-dashed h-[320px] w-full rounded-2xl cursor-pointer transition-colors"
      :class="
        isDragging
          ? 'border-brand-color-default bg-brand-primary-001'
          : 'border-dashboard-card-border-light'
      "
      @click="triggerFileInput"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- placeholder -->
      <div
        class="w-full h-full flex flex-col items-center justify-center gap-4"
      >
        <img src="/img/image-upload.svg" class="w-[58px]" alt="" />
        <div class="flex flex-col items-center gap-2">
          <h5 class="text-dashboard-heading text-center text-[13px]">
            Click to add a file or drag and drop
          </h5>
          <!-- instruction text -->
          <p class="text-dashboard-text-light text-center text-[13px]">
            {{ instructionText }}
          </p>
          <!-- instruction text end -->
        </div>
      </div>
      <!-- placeholder end -->
    </div>
    <!-- File selection box end -->

    <!-- selected file section -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <!-- Selected file card -->
      <div
        class="border border-dashboard-card-border-light border-dashed rounded-xl p-3 flex items-center gap-3"
      >
        <!-- selected image snippet -->
        <img
          :src="
            isImageFile && filePreviewUrl
              ? filePreviewUrl
              : '/img/image-upload.svg'
          "
          class="w-[35px] h-[35px] shrink-0 rounded object-cover"
          alt=""
        />
        <!-- selected image snippet end -->
        <div
          class="flex flex-col w-full justify-center items-start gap-1 overflow-hidden"
        >
          <!-- Selected file name -->
          <h5
            class="text-dashboard-heading text-center text-[13px] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {{ modelValue.name }}
          </h5>
          <!-- Selected file name end-->
          <!-- Selected file size -->
          <p class="text-dashboard-text-light text-center text-[11px]">
            {{ formattedFileSize }}
          </p>
          <!-- Selected file size end-->
        </div>

        <!-- Remove button -->
        <button
          class="w-6 h-10 flex items-center text-orange-008 hover:text-orange-default justify-center"
          @click="removeFile"
        >
          <Icon name="vent:trash" size="1rem"></Icon>
        </button>
        <!-- Remove button end -->
      </div>
      <!-- Selected file card end -->
      <div class="p-3 flex items-center justify-end md:justify-start gap-2">
        <!-- Replace button -->
        <button
          class="flex items-center gap-2 text-sm text-brand-color-008 hover:text-brand-color-default"
          @click="replaceFile"
        >
          <Icon name="vent:edit-hollow" size="1rem"></Icon>
          <span>Replace</span>
        </button>
        <!-- Replace button end -->
      </div>
    </div>
    <!-- selected file section end-->
  </div>
</template>
