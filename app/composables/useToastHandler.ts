type AlertTypes = "success" | "error" | "info" | null;

interface IAlert {
  type: AlertTypes;
  message: string | undefined;
  heading: string;
}

export type ToastType = 'small' | 'large';
export const useToastHandler = () => {
  const toastTimeoutId = useState<ReturnType<typeof setTimeout> | null>(
    "toast.TimeoutId",
    () => null,
  );

  const toastBody = useState<IAlert>("toast.Body", () => ({
    type: null,
    message: "",
    heading: "",
  }));

  const sizeType = useState<ToastType>("toast.SizeType", () => "large");

  const setDefaultState = () => {
    toastBody.value = {
      type: null,
      message: "",
      heading: "",
    };
  };

  return {
    toastBody,

    sizeType,

    triggerToast(
      message: string | undefined,
      type: AlertTypes,
      heading: string = "",
      toastType: ToastType = 'large',
    ) {
      if (toastTimeoutId.value) {
        clearTimeout(toastTimeoutId.value);
      }
      setDefaultState();

      sizeType.value = toastType;

      toastBody.value = {
        type,
        message,
        heading,
      };

      toastTimeoutId.value = setTimeout(() => {
        setDefaultState();
      }, 10000);
    },
    closeToast() {
      setDefaultState();

      if (toastTimeoutId.value) {
        clearTimeout(toastTimeoutId.value);
        toastTimeoutId.value = null;
      }
    },
  };
};
