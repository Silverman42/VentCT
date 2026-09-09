import { CookieManager } from "~/utils/helpers/CookieManager";
import { Cookies } from "~/utils/types/enum/Cookies";

export const useRouteHandler = () => {
    const AUTH_ROUTES = ["/", "/mfa", "/change-password", "/password-reset", "/onboarding","/reset-mfa"];

    const state = {
        expireAfter: useState<number>("routeHandler.expireAfter", () =>  3_600_000), // in milliseconds
        defaultRoute: useState<string>("routeHandler.defaultRoute", () => "/dashboard"),
        previousRoute: useState<string>("routeHandler.previousRoute", () => "/dashboard"),
    }

    const actions = {
        isInvalidRecentRoute(route: string | null) {
            if (!route || !route.startsWith("/")) {
                return true;
            }

            return AUTH_ROUTES.some((authRoute) => {
                return route === authRoute || route.startsWith(`${authRoute}/`);
            });
        },

        getRecentRoute() {
            const route = CookieManager.getCookieValue(Cookies.RECENT_ROUTE) || "/" ;
            return actions.isInvalidRecentRoute(route) ? state.defaultRoute.value : route;
        },

        saveRecentRoute(route:string) {
            if (actions.isInvalidRecentRoute(route)) {
                return;
            }

            // Convert milliseconds to days for cookie expiry
            const expiryInDays = state.expireAfter.value / (1000 * 60 * 60 * 24);
            CookieManager.setCookie(Cookies.RECENT_ROUTE, route, expiryInDays);
        },

        savePreviousRoute(route:string) {
            if (actions.isInvalidRecentRoute(route)) {
                return;
            }

            // Convert milliseconds to days for cookie expiry
            const expiryInDays = state.expireAfter.value / (1000 * 60 * 60 * 24);
            CookieManager.setCookie(Cookies.RECENT_ROUTE, route, expiryInDays);
        },

        clearRecentRoute() {
            CookieManager.deleteCookie(Cookies.RECENT_ROUTE);
        },

        hasRecentRoute() {
            return CookieManager.getCookieValue(Cookies.RECENT_ROUTE) !== null;
        },
    }

    return {
        ...actions
    }
}
