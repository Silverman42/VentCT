import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import { CookieManager } from "~/utils/helpers/CookieManager";
import { Cookies } from "~/utils/types/enum/Cookies";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

// Types
export interface IAppIcon {
  url: string;
}

export enum SocialMediaHandles{
  FACEBOOK = "facebook",
  TWITTER = "X",
  INSTAGRAM = "instagram",
  YOUTUBE = "youtube",
  TIKTOK = "tiktok",
  LINKEDIN = "linkedin",
  WHATSAPP = "whatsapp",
}

export interface IUpdateAppVersionPayload {
  supportedAndroidVersions: string[];
  supportedIosVersions: string[];
  forceStopUnsupportedVersions: boolean;
}

export interface IToggleMaintainModePayload {
  maintenanceMode: boolean;
}

export interface IToggleMaintainRequestPayload {
  maintenanceMode: boolean;
}

export interface ISocialMediaHandleData {
  platform: SocialMediaHandles;
  url: string;
}

export interface ISocialMediaResponseData {
  socialMediaHandles: SocialMediaList;
}

export type SocialMediaList = Record<SocialMediaHandles, {
  url: string;
}>;



export const useGeneralConfigStore = () => {
  const { triggerToast } = useToastHandler();

  const endpoints = {
    APP_ICON: "/admin/config/application-icon",
    APP_VERSIONS: "/admin/config/app-versions",
    MAINTENANCE_MODE: "/admin/config/maintenance-mode",
    SOCIAL_LINKS: "/admin/config/social-media-handles",
    UPDATE_SECRET_KEY: "admin/config/maintenance-mode/secret-key"
  };

  const states = {
    // App Logo states
    uploadingAppLogo: useState<boolean>("useGeneralConfigStore.uploadingAppLogo", () => false),
    fetchingAppLogo: useState<boolean>("useGeneralConfigStore.fetchingAppLogo", () => false),
    appIcon: useState<IAppIcon>("useGeneralConfigStore.appIcon", () => ({ url: "" })),

    // App Version states
    updatingAppVersion: useState<boolean>("useGeneralConfigStore.updatingAppVersion", () => false),
    fetchingAppVersion: useState<boolean>("useGeneralConfigStore.fetchingAppVersion", () => false),
    appVersion: useState<IUpdateAppVersionPayload>("useGeneralConfigStore.appVersion", () => ({
      supportedAndroidVersions: [],
      supportedIosVersions: [],
      forceStopUnsupportedVersions: false,
    })),

    // Maintenance Mode states
    togglingMaintainMode: useState<boolean>("useGeneralConfigStore.togglingMaintainMode", () => false),
    fetchingMaintainMode: useState<boolean>("useGeneralConfigStore.fetchingMaintainMode", () => false),
    maintainMode: useState<IToggleMaintainModePayload>("useGeneralConfigStore.maintainMode", () => ({
      maintenanceMode: false,
    })),
    updatingSecretKey: useState<boolean>("useGeneralConfigStore.updatingSecretKey", () => false),

    // Social Links states
    updatingSocialLinks: useState<boolean>("useGeneralConfigStore.updatingSocialLinks", () => false),
    fetchingSocialLinks: useState<boolean>("useGeneralConfigStore.fetchingSocialLinks", () => false),
    socialLinks: useState<ISocialMediaHandleData[]>("useGeneralConfigStore.socialLinks", () => []),
  };

  const actions = {
    async uploadAppLogo(icon: File) {
      states.uploadingAppLogo.value = true;
      const formData = new FormData();
      formData.append("icon", icon);

      return useApiClientHandler()
        .$apiClient<IResponse<IAppIcon>>(endpoints.APP_ICON, {
          method: "POST",
          body: formData,
        })
        .then((res) => {
          if (res.status) {
            states.appIcon.value = res.data;
            triggerToast(res.message || "App icon uploaded successfully", "success", "App Icon Updated");
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Failed to upload app icon");
          throw err;
        })
        .finally(() => {
          states.uploadingAppLogo.value = false;
        });
    },

    async fetchAppLogo() {
      states.fetchingAppLogo.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<IAppIcon>>(endpoints.APP_ICON, {
          method: "GET",
        })
        .then((res) => {
          if (res.status) {
            states.appIcon.value = res.data;
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Failed to fetch app icon");
          throw err;
        })
        .finally(() => {
          states.fetchingAppLogo.value = false;
        });
    },

    async updateAppVersion(payload: IUpdateAppVersionPayload) {
      states.updatingAppVersion.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<IUpdateAppVersionPayload>>(endpoints.APP_VERSIONS, {
          method: "POST",
          body: payload,
        })
        .then((res) => {
          if (res.status) {
            states.appVersion.value = res.data;
            triggerToast(res.message || "App version updated successfully", "success", "App Version Updated");
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "App Version Update Failed");
          throw err;
        })
        .finally(() => {
          states.updatingAppVersion.value = false;
        });
    },

    async fetchAppVersion() {
      states.fetchingAppVersion.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<IUpdateAppVersionPayload>>(endpoints.APP_VERSIONS, {
          method: "GET",
        })
        .then((res) => {
          if (res.status) {
            states.appVersion.value = res.data;
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "App Version Update Failed");
          throw err;
        })
        .finally(() => {
          states.fetchingAppVersion.value = false;
        });
    },

    async toggleMaintainMode(payload: IToggleMaintainRequestPayload) {
      states.togglingMaintainMode.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<IToggleMaintainModePayload>>(endpoints.MAINTENANCE_MODE, {
          method: "POST",
          body: payload,
        })
        .then((res) => {
          if (res.status) {
            states.maintainMode.value = res.data;
            triggerToast(res.message || "Maintenance mode updated successfully", "success", "Maintenance Mode Updated");
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Maintenance Mode Update Failed");
          throw err;
        })
        .finally(() => {
          states.togglingMaintainMode.value = false;
        });
    },

    async fetchMaintainMode() {
      states.fetchingMaintainMode.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<IToggleMaintainModePayload>>(endpoints.MAINTENANCE_MODE, {
          method: "GET",
        })
        .then((res) => {
          if (res.status) {
            states.maintainMode.value = res.data;
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Maintenance Mode Update Failed");
          throw err;
        })
        .finally(() => {
          states.fetchingMaintainMode.value = false;
        });
    },

    /**
     * Update Secret key for Maintenance Mode
     * @param payload
     * @returns Promise<IResponse>
     */
    async updateSecretKey(payload: {
      secretKey: string
    }){
      states.updatingSecretKey.value = true
      return useApiClientHandler()
        .$apiClient<IResponse>(endpoints.UPDATE_SECRET_KEY, {
          method: "POST",
          body: payload
        })
        .then((res) => {
          if (res.status) {
            CookieManager.setCookie(Cookies.MAINTENANCE_MODE_SECRET_KEY, payload.secretKey)
            triggerToast(res.message || "Secret Key Updated Successfully", "success", "Secret Key Updated");
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Secret Key Update Failed");
          throw err;
        })
        .finally(() => {
          states.updatingSecretKey.value = false
        });
    },

    async fetchSocialLinks() {
      states.fetchingSocialLinks.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<ISocialMediaResponseData>>(endpoints.SOCIAL_LINKS, {
          method: "GET",
        })
        .then((res) => {
          if (res.status) {
            states.socialLinks.value = actions.convertSocialMediaListToArray(res.data.socialMediaHandles);
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Social Links Update Failed");
          throw err;
        })
        .finally(() => {
          states.fetchingSocialLinks.value = false;
        });
    },

    convertSocialMediaListToArray(data: SocialMediaList): ISocialMediaHandleData[] {
      return Object.entries(data).map(([platform, value]) => ({
        platform: platform as SocialMediaHandles,
        url: value.url,
      }));
    },

    async updateSocialLinks(payload: ISocialMediaHandleData[]) {
      states.updatingSocialLinks.value = true;
      return useApiClientHandler()
        .$apiClient<IResponse<ISocialMediaHandleData[]>>(endpoints.SOCIAL_LINKS, {
          method: "POST",
          body: {
            socialMediaHandles: payload
          },
        })
        .then((res) => {
          if (res.status) {
            states.socialLinks.value = res.data;
            triggerToast(res.message || "Social links updated successfully", "success", "Social Links Updated");
          }
          return res.data;
        })
        .catch((err) => {
          ApiErrorHandler(err, true, false, "Social Links Update Failed");
          throw err;
        })
        .finally(() => {
          states.updatingSocialLinks.value = false;
        });
    },


  };

  return {
    ...states,
    ...actions,
  };
};
