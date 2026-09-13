<script setup lang="ts">
import { QrcodeCanvas } from "qrcode.vue";
import type { Campaign } from "../composables/useCampaignMockData";

interface ModalController {
  showDialogBox: () => void;
  hideDialogBox: () => void;
}

const props = defineProps<{
  campaign: Campaign;
}>();

const modal = ref<ModalController | null>(null);
const qrCodeContainer = ref<HTMLElement | null>(null);
const { triggerToast } = useToastHandler();

/** Encodes a fixture-safe registration link that belongs to the selected campaign. */
const registrationUrl = computed(
  () =>
    `https://app.vent.africa/register/${props.campaign.id}?ref=${encodeURIComponent(props.campaign.referralCode)}`,
);

/** Returns the rendered QR canvas when it is available in the open modal. */
const getQrCanvas = (): HTMLCanvasElement | null =>
  qrCodeContainer.value?.querySelector("canvas") ?? null;

/** Escapes campaign fixture strings before rendering them inside the print document. */
const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );

/** Opens the QR dialog for the currently selected campaign. */
const open = (): void => {
  modal.value?.showDialogBox();
};

/** Closes the QR dialog. */
const close = (): void => {
  modal.value?.hideDialogBox();
};

/** Downloads the QR canvas as a PNG image with a campaign-specific file name. */
const downloadQrCode = (): void => {
  const canvas = getQrCanvas();
  if (!canvas) {
    triggerToast(
      "The QR code is still loading. Please try again.",
      "error",
      "QR code unavailable",
      "small",
    );
    return;
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = `campaign-${props.campaign.id}-qr-code.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
};

/** Opens a printer-friendly campaign pass that contains the rendered QR image. */
const printQrCode = (): void => {
  const canvas = getQrCanvas();
  if (!canvas) {
    triggerToast(
      "The QR code is still loading. Please try again.",
      "error",
      "QR code unavailable",
      "small",
    );
    return;
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    triggerToast(
      "Allow pop-ups to print this campaign QR code.",
      "error",
      "Print blocked",
      "small",
    );
    return;
  }

  const qrDataUrl = canvas.toDataURL("image/png");
  const campaignName = escapeHtml(props.campaign.name);
  const eventDate = escapeHtml(props.campaign.eventDate);
  const location = escapeHtml(props.campaign.location);
  const logoUrl = `${window.location.origin}/img/logo_primary.svg`;

  printWindow.document.write(`<!doctype html>
    <html><head><title>${campaignName} QR code</title>
    <style>body{font-family:Arial,sans-serif;color:#13334e;margin:0;padding:32px;text-align:center}img.logo{width:92px;display:block;margin:0 auto 32px}h1{font-size:22px;margin:8px 0}p{color:#4c6172;margin:8px 0}.qr{width:300px;height:300px;margin:28px auto;display:block}.hint{font-size:14px;max-width:300px;margin:0 auto}@media print{body{padding:16px}}</style>
    </head><body><img class="logo" src="${logoUrl}" alt="Vent"><p>You are checking in to</p><h1>${campaignName}</h1><p>${eventDate}</p><p>${location}</p><img class="qr" src="${qrDataUrl}" alt="QR code for ${campaignName}"><p class="hint">Scan the code with your phone camera and follow the process to register.</p></body></html>`);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

defineExpose({ open, close });
</script>

<template>
  <AppModal ref="modal" desktop-width="620px" :hide-pattern="true">
    <section
      class="-mx-6 -mb-6 bg-gradient-to-b from-[#f3fbff] via-[#e7f7ff] to-[#d9f3ff] px-6 pb-7 pt-0 text-center md:-mx-10 md:-mb-10 md:px-10 md:pb-10 dark:from-dashboard-bg dark:via-dashboard-bg dark:to-dashboard-bg-dark"
    >
      <div class="mt-9">
        <p class="text-xs text-dashboard-text">You are checking in to</p>
        <h2
          class="mt-2 text-lg font-bold uppercase tracking-tight text-dashboard-heading sm:text-xl"
        >
          {{ campaign.name }}
        </h2>
        <p
          class="mt-2 flex items-center justify-center gap-1 text-xs text-dashboard-text"
        >
          <Icon name="vent:calendar" size="0.85rem" />
          {{ campaign.eventDate }}
        </p>
        <p
          class="mt-1 flex items-center justify-center gap-1 text-xs text-dashboard-text"
        >
          <Icon name="vent:location" size="0.85rem" />
          {{ campaign.location }}
        </p>
      </div>

      <div
        ref="qrCodeContainer"
        class="mx-auto mt-8 flex w-fit rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(18,83,121,0.14)] sm:p-4"
      >
        <QrcodeCanvas
          :id="`campaign-qr-${campaign.id}`"
          :value="registrationUrl"
          :size="300"
          level="H"
          background="#ffffff"
          foreground="#000000"
          :margin="2"
          class="h-[min(72vw,300px)] w-[min(72vw,300px)]"
        />
      </div>

      <p class="mx-auto mt-5 max-w-xs text-sm leading-6 text-dashboard-text">
        Scan the code with your phone camera and follow the process to register.
      </p>

      <div
        class="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-color-default px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-color-005"
          @click="printQrCode"
        >
          Print
        </button>
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-color-default bg-white px-5 py-3 text-sm font-medium text-brand-color-default transition hover:bg-brand-color-default/10 dark:bg-dashboard-bg"
          @click="downloadQrCode"
        >
          Download
        </button>
      </div>
    </section>
  </AppModal>
</template>
