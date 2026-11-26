import { toast } from "sonner";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: { label: string; onClick: () => void };
  duration?: number;
};

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      const { variant } = options;
      if (variant === "destructive") {
        return toast.error(options.title, {
          description: options.description,
          action: options.action,
          duration: options.duration ?? 5000,
        });
      }
      return toast.success(options.title, {
        description: options.description,
        action: options.action,
        duration: options.duration ?? 5000,
      });
    },
    dismiss: toast.dismiss,
  };
}

export function showErrorToast(message: string, description?: string) {
  return toast.error(message, { description, duration: 5000 });
}

export function showSuccessToast(message: string, description?: string) {
  return toast.success(message, { description, duration: 5000 });
}

export function showInfoToast(message: string, description?: string) {
  return toast.info(message, { description, duration: 5000 });
}
