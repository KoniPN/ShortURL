import { ref, computed } from "vue";
import { createShortUrl, getMyUrls, type UrlData } from "../services/api";

export function useUrlManager() {
  const urls = ref<UrlData[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);

  // Computed - sorted URLs by date
  const sortedUrls = computed(() => {
    return [...urls.value].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  // Load URLs for authenticated user
  const loadUrls = async (isAuthenticated: boolean): Promise<void> => {
    if (!isAuthenticated) {
      urls.value = [];
      return;
    }

    const isManualRefresh = urls.value.length > 0;
    if (isManualRefresh) {
      refreshing.value = true;
    }

    try {
      const response = await getMyUrls();
      if (response.success && response.data) {
        urls.value = response.data;
      } else {
        urls.value = [];
      }
    } catch (error) {
      console.error("Error loading URLs:", error);
      urls.value = [];
    } finally {
      refreshing.value = false;
    }
  };

  // Create new short URL
  const createUrl = async (originalUrl: string): Promise<UrlData | null> => {
    loading.value = true;
    try {
      const response = await createShortUrl(originalUrl);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error creating URL:", error);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Clear URLs
  const clearUrls = () => {
    urls.value = [];
  };

  return {
    urls,
    sortedUrls,
    loading,
    refreshing,
    loadUrls,
    createUrl,
    clearUrls,
  };
}
