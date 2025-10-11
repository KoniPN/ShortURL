import { ref } from "vue";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const toast = ref<Toast>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: ToastType = "success",
    duration = 3000
  ) => {
    toast.value = { show: true, message, type };

    setTimeout(() => {
      toast.value.show = false;
    }, duration);
  };

  const hideToast = () => {
    toast.value.show = false;
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
