import type { ITableBodyData } from "~/utils/types/misc/TableComponent";

/** Identifies the destination behavior encoded by a deep link. */
export type DeepLinkType = "referral" | "route" | "link";

/** Identifies whether a deep link is available for use. */
export type DeepLinkStatus = "active" | "inactive";

/** Identifies the browser destination used by external URL links. */
export type DeepLinkBrowserMode = "in-app" | "external";

/** Identifies how a link-preview image was supplied. */
export type DeepLinkPreviewImageMode = "upload" | "url";

/** Describes one permitted mobile route while the backend allow-list is unavailable. */
export interface DeepLinkRouteOption {
  label: string;
  value: string;
}

/** Describes the preview metadata attached to a generated deep link. */
export interface DeepLinkPreview {
  title: string;
  description: string;
  imageUrl: string;
}

/** Represents one persisted fixture-backed deep-link record. */
export interface DeepLink extends ITableBodyData {
  id: string;
  name: string;
  type: DeepLinkType;
  provider: "Branch";
  target: string;
  generatedLink: string;
  clicks: number;
  status: DeepLinkStatus;
  createdAt: string;
  internalName: string;
  referralCode: string;
  route: string;
  routeParameter: string;
  url: string;
  browserMode: DeepLinkBrowserMode;
  preview: DeepLinkPreview;
}

/** Represents the editable values collected by deep-link creation and update forms. */
export interface DeepLinkDraft {
  type: DeepLinkType;
  internalName: string;
  referralCode: string;
  route: string;
  routeParameter: string;
  url: string;
  browserMode: DeepLinkBrowserMode;
  previewTitle: string;
  previewDescription: string;
  previewImageMode: DeepLinkPreviewImageMode;
  previewImageUrl: string;
  previewImageFile: File | null;
}

/** Provides the single screenshot-backed in-app route option. */
export const deepLinkRouteOptions: DeepLinkRouteOption[] = [
  { label: "Initiate verification", value: "/initiate-verification" },
];

/** Builds a clean form draft for a new deep-link wizard session. */
export const createEmptyDeepLinkDraft = (): DeepLinkDraft => ({
  type: "referral",
  internalName: "",
  referralCode: "",
  route: deepLinkRouteOptions[0]?.value ?? "/initiate-verification",
  routeParameter: "",
  url: "",
  browserMode: "external",
  previewTitle: "",
  previewDescription: "",
  previewImageMode: "upload",
  previewImageUrl: "",
  previewImageFile: null,
});

/** Converts one stored record into a form-safe editable draft. */
export const createDeepLinkDraft = (deepLink: DeepLink): DeepLinkDraft => ({
  type: deepLink.type,
  internalName: deepLink.internalName,
  referralCode: deepLink.referralCode,
  route: deepLink.route || deepLinkRouteOptions[0]?.value || "",
  routeParameter: deepLink.routeParameter,
  url: deepLink.url,
  browserMode: deepLink.browserMode,
  previewTitle: deepLink.preview.title,
  previewDescription: deepLink.preview.description,
  previewImageMode: deepLink.preview.imageUrl ? "url" : "upload",
  previewImageUrl: deepLink.preview.imageUrl,
  previewImageFile: null,
});

/** Derives a readable table label from a deep-link type. */
export const getDeepLinkTypeLabel = (type: DeepLinkType): string =>
  type.slice(0, 1).toUpperCase() + type.slice(1);

/** Produces a session-only Branch-style code for generated fixture URLs. */
const createBranchCode = (): string => {
  const entropy = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CH3${entropy}`;
};

/** Produces a Branch-style URL for a new or regenerated fixture record. */
const createGeneratedLink = (): string =>
  `https://vent.africa.app.link/${createBranchCode()}`;

/** Converts a draft into the user-facing destination value rendered in the table. */
const getTargetFromDraft = (draft: DeepLinkDraft): string => {
  if (draft.type === "link") return draft.url;

  if (draft.type === "referral") {
    return draft.referralCode
      ? `/initiate-verification?ref=${encodeURIComponent(draft.referralCode)}`
      : "/initiate-verification";
  }

  if (!draft.routeParameter.trim()) return draft.route;
  return `${draft.route}?parameter=${encodeURIComponent(draft.routeParameter.trim())}`;
};

/** Derives an internal fixture name when a draft does not include one. */
const getNameFromDraft = (draft: DeepLinkDraft): string => {
  if (draft.internalName.trim()) return draft.internalName.trim();
  if (draft.type === "referral") return "Referral link";
  if (draft.type === "link") return "External link";
  return "Verification";
};

/** Creates a stable record from a submitted draft and generated URL. */
const createRecordFromDraft = (draft: DeepLinkDraft): DeepLink => ({
  id: `deep-link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: getNameFromDraft(draft),
  type: draft.type,
  provider: "Branch",
  target: getTargetFromDraft(draft),
  generatedLink: createGeneratedLink(),
  clicks: 0,
  status: "active",
  createdAt: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date()),
  internalName: draft.internalName.trim(),
  referralCode: draft.referralCode.trim(),
  route: draft.route,
  routeParameter: draft.routeParameter.trim(),
  url: draft.url.trim(),
  browserMode: draft.browserMode,
  preview: {
    title: draft.previewTitle.trim(),
    description: draft.previewDescription.trim(),
    imageUrl: draft.previewImageUrl.trim(),
  },
});

/** Supplies the screenshot-aligned records displayed on the first deep-links page. */
const initialDeepLinks: DeepLink[] = [
  {
    id: "deep-link-verification-route",
    name: "Verification",
    type: "route",
    provider: "Branch",
    target: "/initiate-verification",
    generatedLink: "https://vent.africa.app.link/CH3A9QW1",
    clicks: 210,
    status: "active",
    createdAt: "Jun 5, 2026",
    internalName: "Verification",
    referralCode: "",
    route: "/initiate-verification",
    routeParameter: "",
    url: "",
    browserMode: "external",
    preview: {
      title: "Vent",
      description: "Join me on Vent",
      imageUrl: "",
    },
  },
  {
    id: "deep-link-verification-referral",
    name: "Verification",
    type: "referral",
    provider: "Branch",
    target: "/initiate-verification",
    generatedLink: "https://vent.africa.app.link/CH3B7LP4",
    clicks: 160,
    status: "active",
    createdAt: "Jun 5, 2026",
    internalName: "Verification",
    referralCode: "VENT2026",
    route: "/initiate-verification",
    routeParameter: "",
    url: "",
    browserMode: "external",
    preview: {
      title: "Vent",
      description: "Join me on Vent",
      imageUrl: "",
    },
  },
  {
    id: "deep-link-verification-route-secondary",
    name: "Verification",
    type: "route",
    provider: "Branch",
    target: "/initiate-verification",
    generatedLink: "https://vent.africa.app.link/CH3C8DT6",
    clicks: 130,
    status: "active",
    createdAt: "Jun 5, 2026",
    internalName: "Verification",
    referralCode: "",
    route: "/initiate-verification",
    routeParameter: "",
    url: "",
    browserMode: "external",
    preview: {
      title: "Vent",
      description: "Join me on Vent",
      imageUrl: "",
    },
  },
];

/** Provides fixture-backed state and mutations for the Deep Links layer. */
export const useDeepLinkStore = () => {
  const state = {
    deepLinks: useState<DeepLink[]>("useDeepLinkStore.deepLinks", () =>
      initialDeepLinks.map((deepLink) => ({
        ...deepLink,
        preview: { ...deepLink.preview },
      })),
    ),
    fetchingDeepLinks: useState<boolean>(
      "useDeepLinkStore.fetchingDeepLinks",
      () => false,
    ),
    creatingDeepLink: useState<boolean>(
      "useDeepLinkStore.creatingDeepLink",
      () => false,
    ),
    updatingDeepLink: useState<boolean>(
      "useDeepLinkStore.updatingDeepLink",
      () => false,
    ),
    regeneratingDeepLink: useState<boolean>(
      "useDeepLinkStore.regeneratingDeepLink",
      () => false,
    ),
    deletingDeepLink: useState<boolean>(
      "useDeepLinkStore.deletingDeepLink",
      () => false,
    ),
  };

  /** Returns the latest session fixture for one record identifier. */
  const getDeepLinkById = (id: string): DeepLink | undefined =>
    state.deepLinks.value.find((deepLink) => deepLink.id === id);

  /** Resolves the current fixture list while exposing a consistent loading state. */
  const fetchDeepLinks = async (): Promise<DeepLink[]> => {
    state.fetchingDeepLinks.value = true;

    try {
      await nextTick();
      return state.deepLinks.value;
    } finally {
      state.fetchingDeepLinks.value = false;
    }
  };

  /** Adds a newly generated record to the beginning of the local fixture list. */
  const createDeepLink = async (draft: DeepLinkDraft): Promise<DeepLink> => {
    state.creatingDeepLink.value = true;

    try {
      const deepLink = createRecordFromDraft(draft);
      state.deepLinks.value = [deepLink, ...state.deepLinks.value];
      return deepLink;
    } finally {
      state.creatingDeepLink.value = false;
    }
  };

  /** Applies editable draft values to one existing local deep-link record. */
  const updateDeepLink = async (
    id: string,
    draft: DeepLinkDraft,
  ): Promise<DeepLink | undefined> => {
    state.updatingDeepLink.value = true;

    try {
      let updatedRecord: DeepLink | undefined;

      state.deepLinks.value = state.deepLinks.value.map((deepLink) => {
        if (deepLink.id !== id) return deepLink;

        updatedRecord = {
          ...deepLink,
          name: getNameFromDraft(draft),
          type: draft.type,
          target: getTargetFromDraft(draft),
          internalName: draft.internalName.trim(),
          referralCode: draft.referralCode.trim(),
          route: draft.route,
          routeParameter: draft.routeParameter.trim(),
          url: draft.url.trim(),
          browserMode: draft.browserMode,
          preview: {
            title: draft.previewTitle.trim(),
            description: draft.previewDescription.trim(),
            imageUrl: draft.previewImageUrl.trim(),
          },
        };

        return updatedRecord;
      });

      return updatedRecord;
    } finally {
      state.updatingDeepLink.value = false;
    }
  };

  /** Replaces a record's generated Branch-style URL while preserving its metadata. */
  const regenerateDeepLink = async (id: string): Promise<DeepLink | undefined> => {
    state.regeneratingDeepLink.value = true;

    try {
      let updatedRecord: DeepLink | undefined;

      state.deepLinks.value = state.deepLinks.value.map((deepLink) => {
        if (deepLink.id !== id) return deepLink;

        updatedRecord = {
          ...deepLink,
          generatedLink: createGeneratedLink(),
        };
        return updatedRecord;
      });

      return updatedRecord;
    } finally {
      state.regeneratingDeepLink.value = false;
    }
  };

  /** Removes one record from the local fixture list. */
  const deleteDeepLink = async (id: string): Promise<boolean> => {
    state.deletingDeepLink.value = true;

    try {
      const beforeCount = state.deepLinks.value.length;
      state.deepLinks.value = state.deepLinks.value.filter(
        (deepLink) => deepLink.id !== id,
      );
      return state.deepLinks.value.length !== beforeCount;
    } finally {
      state.deletingDeepLink.value = false;
    }
  };

  return {
    ...state,
    getDeepLinkById,
    fetchDeepLinks,
    createDeepLink,
    updateDeepLink,
    regenerateDeepLink,
    deleteDeepLink,
  };
};
