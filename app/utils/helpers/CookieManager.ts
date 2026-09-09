export const CookieManager = {
  setCookie(name: string, value: string, days: number | null = null) {
    if (!import.meta.client || typeof document === "undefined") return;

    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax" + secure;
  },

  getCookieValue(name: string) {
    if (!import.meta.client || typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts: string[] = value.split(`; ${name}=`) || [];
    if (parts.length === 2) return parts?.pop()?.split(";")?.shift();
    return null;
  },

  deleteCookie(name: string) {
    if (!import.meta.client || typeof document === "undefined") return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secure}`;
  },
};
