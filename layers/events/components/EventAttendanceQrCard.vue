<script setup lang="ts">
import { QrcodeCanvas } from "qrcode.vue";
import { DateFormatter } from "~/utils/helpers/DateFormatter";
import type { IEvent } from "../composables/useEventStore";

const props = defineProps<{
  event: IEvent;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const LOGO_URL = "/img/logo_primary.svg";
const EXPORT_WIDTH = 720;
const EXPORT_HEIGHT = 960;
const EXPORT_QR_SIZE = 420;

const { saveEventQrCode, savingQrCode } = useEventStore();
const { triggerToast } = useToastHandler();
const qrCodeContainer = ref<HTMLElement | null>(null);
const downloading = ref(false);

/** Self check-in link encoded in the QR code for this event. */
const checkInUrl = computed(
  () =>
    `https://app.vent.africa/events/${encodeURIComponent(props.event.id)}/check-in`,
);

/** Human-readable event date, e.g. "October 26, 2026". */
const formattedDate = computed(() =>
  props.event.date
    ? DateFormatter.formatWithPattern(props.event.date, "MMMM d, yyyy")
    : "Date to be announced",
);

/** Returns the rendered QR canvas, or null while it is still mounting. */
const getQrCanvas = (): HTMLCanvasElement | null =>
  qrCodeContainer.value?.querySelector("canvas") ?? null;

/** Loads an image URL and resolves once it can be drawn onto a canvas. */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

/**
 * Draws a printable check-in card (logo, event info, QR code and hint) onto a
 * new canvas. The logo is skipped if it fails to load.
 */
const buildCheckInCard = async (
  qrCanvas: HTMLCanvasElement,
): Promise<HTMLCanvasElement> => {
  const card = document.createElement("canvas");
  card.width = EXPORT_WIDTH;
  card.height = EXPORT_HEIGHT;
  const context = card.getContext("2d");
  if (!context) return qrCanvas;

  const centerX = EXPORT_WIDTH / 2;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  try {
    const logo = await loadImage(LOGO_URL);
    const logoHeight = 44;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    context.drawImage(logo, 48, 48, logoWidth, logoHeight);
  } catch {
    // The card is still useful without the logo.
  }

  context.textAlign = "center";
  context.fillStyle = "#6A6E76";
  context.font = "20px Arial, sans-serif";
  context.fillText("You are checking in to", centerX, 168);

  context.fillStyle = "#001119";
  context.font = "bold 32px Arial, sans-serif";
  context.fillText(props.event.name, centerX, 214, EXPORT_WIDTH - 96);

  context.fillStyle = "#242933";
  context.font = "20px Arial, sans-serif";
  context.fillText(formattedDate.value, centerX, 254);
  context.fillText(props.event.location, centerX, 286, EXPORT_WIDTH - 96);

  const qrX = (EXPORT_WIDTH - EXPORT_QR_SIZE) / 2;
  context.drawImage(qrCanvas, qrX, 336, EXPORT_QR_SIZE, EXPORT_QR_SIZE);

  context.fillStyle = "#6A6E76";
  context.font = "18px Arial, sans-serif";
  context.fillText(
    "Scan the code with your phone camera and follow",
    centerX,
    812,
  );
  context.fillText("the process to register", centerX, 840);

  return card;
};

/** Downloads the branded check-in card as a PNG named after the event. */
const downloadQrCode = async (): Promise<void> => {
  const qrCanvas = getQrCanvas();
  if (!qrCanvas) {
    triggerToast(
      "The QR code is still loading. Please try again.",
      "error",
      "QR code unavailable",
      "small",
    );
    return;
  }

  downloading.value = true;
  try {
    const card = await buildCheckInCard(qrCanvas);
    const anchor = document.createElement("a");
    anchor.href = card.toDataURL("image/png");
    anchor.download = `event-${props.event.id}-check-in-qr.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    downloading.value = false;
  }
};

/** Saves the QR code for the event and notifies the parent so it can close. */
const saveQrCode = async (): Promise<void> => {
  try {
    await saveEventQrCode(props.event.id);
    emit("saved");
  } catch {
    // Handled in the store via ApiErrorHandler.
  }
};
</script>

<template>
  <div>
    <section
      class="rounded-2xl bg-gradient-to-b from-brand-color-013 via-brand-color-013 to-brand-color-012 px-5 pt-6 pb-8 text-center sm:px-8 dark:from-dashboard-bg-dark dark:via-dashboard-bg-dark dark:to-dashboard-bg"
    >
      <div class="mt-8">
        <p class="text-sm text-dashboard-text">You are checking in to</p>
        <h3
          class="mt-2 text-xl font-semibold tracking-tight text-dashboard-heading-blue sm:text-2xl dark:text-dashboard-heading"
        >
          {{ props.event.name }}
        </h3>
        <p
          class="mt-2 flex items-center justify-center gap-1.5 text-sm text-dashboard-heading"
        >
          <Icon name="vent:calendar" size="0.95rem" />
          {{ formattedDate }}
        </p>
        <p
          class="mt-1 flex items-center justify-center gap-1.5 text-sm text-dashboard-heading"
        >
          <Icon name="vent:location" size="0.95rem" class="shrink-0" />
          {{ props.event.location }}
        </p>
      </div>

      <div
        class="mx-auto mt-8 w-fit rounded-2xl bg-dashboard-bg/70 px-4 pt-4 pb-5"
      >
        <div
          ref="qrCodeContainer"
          class="rounded-3xl bg-black-scale-default p-3"
        >
          <div class="rounded-2xl bg-white p-3">
            <QrcodeCanvas
              :id="`event-qr-${props.event.id}`"
              :value="checkInUrl"
              :size="300"
              level="H"
              background="#ffffff"
              foreground="#000000"
              :margin="1"
              class="h-[min(60vw,300px)] w-[min(60vw,300px)]"
            />
          </div>
        </div>
        <p
          class="mx-auto mt-5 max-w-xs text-sm leading-6 text-dashboard-heading"
        >
          Scan the code with your phone camera and follow the process to
          register
        </p>
      </div>
    </section>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <AppButton
        type="button"
        size="md"
        color="primary"
        :loading="savingQrCode"
        class="sm:min-w-40"
        @click="saveQrCode"
      >
        Save
      </AppButton>
      <AppButton
        type="button"
        size="md"
        color="primary"
        outlined
        :loading="downloading"
        class="sm:min-w-40"
        @click="downloadQrCode"
      >
        Download
      </AppButton>
    </div>
  </div>
</template>
