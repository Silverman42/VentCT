import {
  type IAudienceMember,
  type IAudienceMetric,
  useAudienceMockData,
} from "./useAudienceMockData";

/** Payload interface for creating a new audience member. */
export interface ICreateAudiencePayload {
  campaign: string;
  name: string;
  email: string;
  phone: string;
  promoter: string;
}

/** Provides feature state and mock data actions for audiences. */
export const useAudienceStore = () => {
  const { audienceList, audienceMetrics } = useAudienceMockData();

  const state = {
    fetchingAudiences: useState<boolean>(
      "useAudienceStore.fetchingAudiences",
      () => false,
    ),
    creatingAudience: useState<boolean>(
      "useAudienceStore.creatingAudience",
      () => false,
    ),
    audiences: useState<IAudienceMember[]>(
      "useAudienceStore.audiences",
      () => audienceList,
    ),
    metrics: useState<IAudienceMetric[]>(
      "useAudienceStore.metrics",
      () => audienceMetrics,
    ),
  };

  const actions = {
    /** Simulates fetching the audience list from mock data. */
    async fetchAudiences() {
      state.fetchingAudiences.value = true;
      try {
        return state.audiences.value;
      } finally {
        state.fetchingAudiences.value = false;
      }
    },

    /** Adds a new audience member directly to mock data state. */
    async createAudience(payload: ICreateAudiencePayload) {
      state.creatingAudience.value = true;
      try {
        const newMember: IAudienceMember = {
          id: `aud-${Date.now()}`,
          name: payload.name,
          campaign: payload.campaign,
          email: payload.email,
          phone: payload.phone,
          promoter: payload.promoter || "Unassigned",
          hasTransaction: false,
          isVerified: false,
          joinedDate: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
        state.audiences.value.unshift(newMember);
        return newMember;
      } finally {
        state.creatingAudience.value = false;
      }
    },
  };

  return {
    ...state,
    ...actions,
  };
};
