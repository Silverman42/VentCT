import { ApiErrorHandler } from "~/utils/helpers/ApiErrorHandler";
import type { IResponse } from "~/utils/types/misc/ResponseBody";

export interface IQuoteResponse {
    author: string;
    quote:  string;
}


export const useLoadScreenStore = () => {
    const endpoints={
        FETCH_QUOTES: "quotes/random"
    }

    const states = {
        showLoadScreen: useState<boolean>("useLoadScreenStore.showLoadScreen", () => false),
        quoteOfTheDay: useState<string>("useLoadScreenStore.quoteOfTheDay", () => ""),
        author: useState<string>("useLoadScreenStore.author", () => ""),
        fetchingQuoteOfTheDay: useState<boolean>("useLoadScreenStore.fetchingQuoteOfTheDay", () => false),
    };

    const actions = {
        async fetchQuoteOfTheDay(){
            states.fetchingQuoteOfTheDay.value = true;
            return useApiClientHandler()
                .$apiClient<IResponse<IQuoteResponse>>(endpoints.FETCH_QUOTES, {
                    headers:{
                        "X-Device-OS": "web"
                    }
                })
                .then((res) => {
                    states.quoteOfTheDay.value = res.data.quote;
                    states.author.value = res.data.author;
                })
                .catch((err) => {
                     ApiErrorHandler(err, true, false, "Quote Fetch Failed")
                    throw err;
                })
                .finally(() => {
                    states.fetchingQuoteOfTheDay.value = false
                });
        }
    };

    return {
        ...states,
        ...actions,
    };
}