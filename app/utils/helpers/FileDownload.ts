export interface IResponseFileDownloadOptions {
  responseData: unknown;
  contentType?: string | null;
  contentDisposition?: string | null;
  fallbackFileName: string;
  fallbackExtension?: string | null;
  mimeTypeExtensionMap?: Record<string, string>;
  extensionAliasMap?: Record<string, string>;
  target?: IPreparedFileDownloadTarget | null;
}

export interface IResponseFileDownloadResult {
  file: Blob;
  fileName: string;
  contentType: string;
}

export interface IPreparedFileDownloadTarget {
  popup: Window | null;
}

const DEFAULT_MIME_TYPE_EXTENSION_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.ms-excel": "xls",
  "application/xls": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
};

const DEFAULT_EXTENSION_ALIAS_MAP: Record<string, string> = {
  pdf: "pdf",
  xls: "xls",
  xlsx: "xlsx",
  excel: "xls",
  csv: "csv",
};

const getFileNameFromContentDisposition = (
  contentDisposition?: string | null
) => {
  if (!contentDisposition) return "";

  const utf8FileNameMatch = contentDisposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i
  );

  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1]).replace(/["']/g, "").trim();
  }

  const asciiFileNameMatch = contentDisposition.match(
    /filename\s*=\s*("?)([^";]+)\1/i
  );

  return asciiFileNameMatch?.[2]?.trim() ?? "";
};

const getFileExtension = (
  mimeType?: string | null,
  fallbackExtension?: string | null,
  mimeTypeExtensionMap: Record<string, string> = DEFAULT_MIME_TYPE_EXTENSION_MAP,
  extensionAliasMap: Record<string, string> = DEFAULT_EXTENSION_ALIAS_MAP
) => {
  const normalizedMimeType = mimeType?.split(";")[0]?.trim().toLowerCase();

  if (normalizedMimeType && mimeTypeExtensionMap[normalizedMimeType]) {
    return mimeTypeExtensionMap[normalizedMimeType];
  }

  const normalizedExtension = fallbackExtension?.trim().toLowerCase();
  return normalizedExtension ? extensionAliasMap[normalizedExtension] || "" : "";
};

const ensureFileNameExtension = (fileName: string, extension?: string) => {
  if (!fileName) return "";
  if (!extension || /\.[a-z0-9]+$/i.test(fileName)) return fileName;
  return `${fileName}.${extension}`;
};

const createDownloadBlob = (
  responseData: unknown,
  contentType?: string | null
) => {
  const blobType = contentType && contentType !== "" ? contentType : undefined;

  if (responseData instanceof Blob) {
    return responseData;
  }

  if (responseData instanceof ArrayBuffer) {
    return new Blob([responseData], { type: blobType });
  }

  if (ArrayBuffer.isView(responseData)) {
    const bytes = new Uint8Array(responseData.byteLength);
    bytes.set(
      new Uint8Array(
        responseData.buffer,
        responseData.byteOffset,
        responseData.byteLength
      )
    );
    return new Blob([bytes.buffer], { type: blobType });
  }

  if (typeof responseData === "string") {
    return new Blob([responseData], { type: blobType });
  }

  return new Blob([], { type: blobType });
};

const triggerDownloadFromPreparedTarget = (
  target: IPreparedFileDownloadTarget,
  file: Blob,
  fileName: string
) => {
  if (!target.popup || target.popup.closed) {
    return false;
  }

  const popup = target.popup;
  const url = URL.createObjectURL(file);
  const link = popup.document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = fileName;

  popup.document.body.innerHTML = "";
  popup.document.body.appendChild(link);
  popup.focus();
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    if (!popup.closed) {
      popup.close();
    }
  }, 1000);

  return true;
};

const triggerDownloadFromDocument = (file: Blob, fileName: string) => {
  if (
    typeof document === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
};

export const prepareFileDownloadTarget = (
  loadingText: string = "Preparing download..."
): IPreparedFileDownloadTarget | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const popup = window.open("", "_blank");

  if (!popup) {
    return null;
  }

  popup.document.title = loadingText;
  popup.document.body.innerHTML = `<p>${loadingText}</p>`;

  return { popup };
};

export const cancelPreparedFileDownloadTarget = (
  target?: IPreparedFileDownloadTarget | null
) => {
  if (!target?.popup || target.popup.closed) {
    return;
  }

  target.popup.close();
};

export const downloadResponseFile = (
  options: IResponseFileDownloadOptions
): IResponseFileDownloadResult => {
  const {
    responseData,
    contentType,
    contentDisposition,
    fallbackFileName,
    fallbackExtension,
    mimeTypeExtensionMap = DEFAULT_MIME_TYPE_EXTENSION_MAP,
    extensionAliasMap = DEFAULT_EXTENSION_ALIAS_MAP,
    target,
  } = options;

  const blob = createDownloadBlob(responseData, contentType);
  const resolvedContentType = contentType ?? blob.type;
  const fileName =
    getFileNameFromContentDisposition(contentDisposition) || fallbackFileName;
  const downloadFileName = ensureFileNameExtension(
    fileName,
    getFileExtension(
      resolvedContentType,
      fallbackExtension,
      mimeTypeExtensionMap,
      extensionAliasMap
    )
  );

  let file = blob;
  if (resolvedContentType !== "" && blob.type !== resolvedContentType) {
    file = new Blob([blob], { type: resolvedContentType });
  }

  const didUsePreparedTarget =
    target ? triggerDownloadFromPreparedTarget(target, file, downloadFileName) : false;

  if (!didUsePreparedTarget) {
    triggerDownloadFromDocument(file, downloadFileName);
  }

  return {
    file,
    fileName: downloadFileName,
    contentType: resolvedContentType,
  };
};
