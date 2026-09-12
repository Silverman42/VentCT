# VentCT Nuxt Application Guidance

These instructions apply to all work in this Nuxt application. Follow them for
new code and when materially refactoring existing code.

## Architecture and File Placement

- Each new product feature or API service **MUST** have its own Nuxt layer.
- Create layers at `layers/<feature>/` with this minimum structure:

  ```text
  layers/<feature>/
  ├── components/       # Components used only by this feature
  ├── composables/      # Feature API stores and feature-specific composables
  ├── pages/            # Route shells for this feature
  └── nuxt.config.ts    # `export default defineNuxtConfig({ extends: ["../../"] })`
  ```

- A component used only by one feature belongs in that feature's
  `layers/<feature>/components/` directory.
- Reusable atomic UI belongs in `app/components/App/`. Promote a component
  there before it is reused by another feature; do not create duplicate local
  versions of a shared atom.
- Reusable, pure helper functions belong in `app/utils/helpers/`. Keep helpers
  free of Vue component concerns and feature-specific state. Feature-only
  helpers stay inside the owning layer.
- Pages are thin route shells. A page may declare route metadata, select a
  layout, read route parameters, and compose layer components. It **MUST NOT**
  implement substantive UI markup, perform API calls, or own feature business
  logic.

## API Stores

All API calls for a feature **MUST** live in a single or deliberately split
layer store at `layers/<feature>/composables/use<Feature>Store.ts`. Store names
must start with `use` and end with `Store` (for example, `useAuthStore`). Vue
components and pages must call store actions; they must not call the API client
directly.

### Store Requirements

- Declare and export request payload, response-data, list, and pagination
  interfaces/types in the store file that uses them. API contract types do not
  belong in component files.
- Keep endpoint strings and endpoint factories together in an `endpoints`
  object near the start of the store.
- Store reactive data and each request's loading state in a `state` or `states`
  object using namespaced `useState` keys (for example,
  `"useCustomerStore.fetchingCustomers"`).
- Give every asynchronous action its own boolean loading state. Set it before
  the request and always reset it in `finally`.
- Use `useApiClientHandler().$apiClient<IResponse<T>>()` for calls, assign
  successful response data to store state, return an explicit value, handle
  failures with `ApiErrorHandler`, and rethrow errors when callers need to
  react.
- Keep derived state in an optional `getters` object and mutation/fetch logic
  in an `actions` object. Return a flattened public API with
  `...state`, `...actions`, and `...getters`.
- For paginated/searchable lists, retain page, per-page, last-page, and search
  or filter state in the store. Reset to page 1 after a search or filter change;
  when a next/previous request returns an empty result or fails, roll the page
  state back to the last valid value.

### Canonical Store Shape

Adapt this structure to the endpoint rather than copying unrelated state:

```ts
import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

export interface ICreateFeaturePayload {
  name: string;
}

export interface IFeature {
  id: string;
  name: string;
}

/** Provides feature API state and actions. */
export const useFeatureStore = () => {
  const endpoints = {
    FEATURES: "/admin/features",
    FEATURE: (id: string) => `/admin/features/${id}`,
  };

  const state = {
    fetchingFeatures: useState<boolean>(
      "useFeatureStore.fetchingFeatures",
      () => false,
    ),
    creatingFeature: useState<boolean>(
      "useFeatureStore.creatingFeature",
      () => false,
    ),
    features: useState<IFeature[]>("useFeatureStore.features", () => []),
  };

  const actions = {
    /** Fetches the feature list and stores the response. */
    async fetchFeatures() {
      state.fetchingFeatures.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IFeature[]>>(endpoints.FEATURES, {
          method: "GET",
        })
        .then((response) => {
          state.features.value = response.data;
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Feature fetch failed");
          throw error;
        })
        .finally(() => {
          state.fetchingFeatures.value = false;
        });
    },

    /** Creates a feature and appends it to the stored feature list. */
    async createFeature(payload: ICreateFeaturePayload) {
      state.creatingFeature.value = true;

      return useApiClientHandler()
        .$apiClient<IResponse<IFeature>>(endpoints.FEATURES, {
          method: "POST",
          body: payload,
        })
        .then((response) => {
          state.features.value.push(response.data);
          return response.data;
        })
        .catch((error) => {
          ApiErrorHandler(error, true, false, "Feature creation failed");
          throw error;
        })
        .finally(() => {
          state.creatingFeature.value = false;
        });
    },
  };

  return {
    ...state,
    ...actions,
  };
};
```

Use the existing `useAuthStore`, `useTransactionStore`, and `useFaqStore`
implementations as the reference for this pattern. Preserve their architectural
conventions, not unrelated endpoint details.

## Form Validation

- All form validation **MUST** use Vuelidate. Do not implement ad hoc validation
  with manual boolean flags, standalone conditionals, or a different validation
  library.
- Define the form model as reactive state, declare Vuelidate rules with
  validators from `@vuelidate/validators`, and create the validation state with
  `useVuelidate` from `@vuelidate/core`.
- Use `helpers.withMessage` to provide user-facing validation messages. Display
  field errors through the relevant input component and touch fields on input,
  blur, or another appropriate interaction.
- On submission, call `$touch()` on the validation state and stop submission
  when `$invalid` is true.
- Use `layers/auth/components/Onboarding/SetPassword.vue` and
  `/Users/sylvesternkeze/Documents/Projects/VentV2Frontend/layers/configurations/components/Config/Countries/Update.vue`
  as the canonical references for Vuelidate rule composition, validation state,
  error display, and submit handling.

## Code Documentation

- Every method, standalone function, function-valued variable, composable, and
  class **MUST** have a concise comment that explains its purpose.
- Prefer JSDoc/TSDoc comments (`/** ... */`) immediately above declarations.
  Document parameters, return values, side effects, and thrown errors when they
  are not already obvious from the signature.
- Comments must describe intent or behavior; do not add filler comments that
  merely restate the declaration name.

## API-Backed UI and Shimmers

- Every component or visible section conditionally rendered from an API result
  **MUST** provide a matching `*Shimmer.vue` loading component in the same
  feature component area.
- The shimmer must mirror the loaded structure: card/table row count, major
  blocks, approximate dimensions, borders, spacing, rounded corners, and
  responsive breakpoints. Do not substitute a generic spinner for structured
  API content.
- Use the global `shimmer-bg` class and the existing shimmer theme tokens so it
  remains correct in both themes. Do not duplicate shimmer keyframes or theme
  colors inside feature components.
- Model loaded, loading, empty, and error states separately. A shimmer is for
  loading only; it does not replace an empty state or an error state.
- Before rendering nested API data, map it through a computed view model with
  optional chaining, explicit fallbacks, and template-ready boolean guards.
  Avoid deep API-state access directly in templates.

## Theming and Icons

- Every component, including shimmers, **MUST** work in light and dark modes.
  Use existing semantic Tailwind tokens such as `bg-dashboard-bg`,
  `bg-dashboard-bg-dark`, `text-dashboard-heading`,
  `text-dashboard-text`, and `border-dashboard-card-border`.
- Do not use hard-coded foreground, background, or border colors unless a
  matching light/dark semantic token is introduced as part of the same change.
- Nuxt Icon SVG assets belong in `app/assets/icons/`, which is registered as the
  `vent` custom collection. Add one `.svg` per icon and reference it with
  `<Icon name="vent:<icon-file-name>" />`.
- `app/components/Svgs/` is reserved for Vue illustration components. Do not
  put Nuxt Icon collection assets there.

## Completion Checklist

Before handing off a feature, verify all applicable items:

- [ ] The feature/API service has a dedicated layer with components,
      composables, pages, and `nuxt.config.ts`.
- [ ] API calls live in a correctly named `use<Feature>Store` and its API
      request/response types are declared in that store.
- [ ] Every API-rendered structure has a layout-matched, theme-aware shimmer
      plus distinct loaded, empty, and error states.
- [ ] Pages only compose layer components and contain no direct API calls or
      feature UI implementation.
- [ ] Reusable atoms are in `app/components/App/`; reusable pure helpers are in
      `app/utils/helpers/`.
- [ ] Every form uses Vuelidate, exposes useful validation messages, touches its
      fields appropriately, and blocks invalid submission.
- [ ] Every method, standalone function, function-valued variable, composable,
      and class has a concise, meaningful documentation comment.
- [ ] The feature has been checked in both light and dark modes.
- [ ] Nuxt Icon SVGs are in `app/assets/icons/` and use the `vent:` prefix.
- [ ] `npm run typecheck` passes for code changes governed by this document.
