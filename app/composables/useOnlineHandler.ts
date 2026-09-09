import { useOnline } from "@vueuse/core";

export const useOnlineHandler = () => {
    const isOnline = useState<boolean>("isOnline", () => true);

    const refreshPage = ()=>{
        location.href = useRoute().fullPath
    }

    const watchOnlineStatus = () => {
        const online = useOnline();
        watch(() => online.value, () => {
            isOnline.value = online.value;
            if (online.value) {
                useToastHandler().triggerToast("", "success", 'You are online', 'small');
                setTimeout(()=>{
                    refreshPage()
                }, 3000)
            } else {
                useToastHandler().triggerToast("", "error", 'You are offline', 'small');
            }
        },{
            immediate: false,
            deep: true,
        });
    }

    return {
        watchOnlineStatus,
        isOnline,
    }
}
