import { ref } from "vue";

export function useClipboard() {
  const copied = ref(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Try modern clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied.value = true;

        setTimeout(() => {
          copied.value = false;
        }, 2000);

        return true;
      }

      // Fallback for HTTP (works on all browsers)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        copied.value = true;

        setTimeout(() => {
          copied.value = false;
        }, 2000);

        return true;
      }

      throw new Error("Copy command failed");
    } catch (error) {
      console.error("Failed to copy:", error);
      return false;
    }
  };

  return {
    copied,
    copyToClipboard,
  };
}
