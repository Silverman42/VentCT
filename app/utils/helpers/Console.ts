export const Console = {
  log: (message: any) => {
    if (import.meta.env.DEV) {
      console.log(message);
    }
  },
};
