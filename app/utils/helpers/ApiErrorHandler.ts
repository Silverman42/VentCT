import type { NuxtError } from "#app";
import { ResponseEvents, type IResponse, type ValidationError } from "../types/misc/ResponseBody";

export const ApiErrorHandler = <E = ValidationError>(
  e: any,
  triggerToast: boolean = true,
  authFailRedirect: boolean = true,
  heading: string = "",
  options: {
    triggeredErrorCodes?: number[];
  } = {
    triggeredErrorCodes: [401, 500]
  }
) => {
  const error = e as NuxtError<IResponse<any, E>>;
  if (triggerToast) {
    if (error.statusCode === 422) {
      const errorMessages = Object.values(error.data?.errors || {}).join(",").split(",");
      const firstMessage = errorMessages[0] ?? error.data?.message;
      useToastHandler().triggerToast(
        firstMessage && firstMessage.length > 0 ? firstMessage : error.data?.message,
        "error",
        heading
      );
    } else {
      useToastHandler().triggerToast(error.data?.message, "error", heading);
    }
  }

  HandleEvents(error.data?.event || ResponseEvents.DEFAULT);

  if (error.statusCode) {
    return HandleStatusCode(error.statusCode, authFailRedirect, options);
  }
};

const HandleStatusCode = (code: number, authFailRedirect: boolean = false, options: { triggeredErrorCodes?: number[] } = { triggeredErrorCodes: [401, 500] })=>{
  if (!options.triggeredErrorCodes?.includes(code)) {
    return;
  }
  switch (code) {
    case 401:
      throw showError({
          statusCode: code,
          statusMessage: "Unauthenticated",
        });
      break;
    case 500:
      throw showError({
        statusCode: code,
        statusMessage: "Internal Server Error",
      });
    default:
      break;
  }
}

const HandleEvents = (event: ResponseEvents) => {
  switch (event) {
    case ResponseEvents.PASSWORD_EXPIRED:
      navigateTo("/change-password");
      break;
    default:
      break;
  }
}
