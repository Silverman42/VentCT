export const FlagFetch = (countryCode: string) => {
  return `${useRuntimeConfig().public.flagsApiUrl}/${countryCode}/flat/64.png`;
};
