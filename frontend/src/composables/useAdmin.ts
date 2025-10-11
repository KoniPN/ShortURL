import { ref, computed } from "vue";
import {
  getAdminUsers,
  getAdminAllUrls,
  deleteAdminUrl,
  deleteAdminUser,
} from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UrlItem {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  userId?: string;
  createdAt: string;
}

export function useAdminUsers() {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref("");
  const deleteConfirm = ref<string | null>(null);

  const usersCount = computed(() => users.value.length);
  const adminCount = computed(
    () => users.value.filter((u) => u.isAdmin).length
  );
  const regularUsersCount = computed(
    () => users.value.filter((u) => !u.isAdmin).length
  );

  const loadUsers = async () => {
    loading.value = true;
    error.value = "";

    try {
      const response = await getAdminUsers();
      console.log("👥 Users API Response:", response);

      if (response.success) {
        users.value = response.data?.users || [];
        console.log("✅ Users loaded:", users.value.length);
      } else {
        error.value = response.error || "ไม่สามารถโหลดรายชื่อ User ได้";
        console.error("❌ Users error:", error.value);
      }
    } catch (err) {
      error.value = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      console.error("❌ Users exception:", err);
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      console.log("🗑️ Attempting to delete user:", userId);
      const response = await deleteAdminUser(userId);
      console.log("📥 Delete user response:", response);

      if (response.success) {
        console.log("✅ User deleted successfully");
        users.value = users.value.filter((user) => user.id !== userId);
        deleteConfirm.value = null;
        return true;
      } else {
        console.error("❌ Delete failed:", response.error);
        return false;
      }
    } catch (err) {
      console.error("❌ Delete exception:", err);
      return false;
    }
  };

  const confirmDelete = (userId: string) => {
    deleteConfirm.value = userId;
  };

  const cancelDelete = () => {
    deleteConfirm.value = null;
  };

  return {
    users,
    loading,
    error,
    deleteConfirm,
    usersCount,
    adminCount,
    regularUsersCount,
    loadUsers,
    deleteUser,
    confirmDelete,
    cancelDelete,
  };
}

export function useAdminUrls() {
  const urls = ref<UrlItem[]>([]);
  const loading = ref(false);
  const error = ref("");
  const deleteConfirm = ref<string | null>(null);

  const urlsCount = computed(() => urls.value.length);
  const totalClicks = computed(() =>
    urls.value.reduce((sum, url) => sum + url.clicks, 0)
  );

  const loadUrls = async () => {
    loading.value = true;
    error.value = "";

    try {
      const response = await getAdminAllUrls();
      console.log("🔗 URLs API Response:", response);

      if (response.success) {
        urls.value = response.data?.urls || [];
        console.log("✅ URLs loaded:", urls.value.length);
      } else {
        error.value = response.error || "ไม่สามารถโหลดรายการ URL ได้";
        console.error("❌ URLs error:", error.value);
      }
    } catch (err) {
      error.value = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      console.error("❌ URLs exception:", err);
    } finally {
      loading.value = false;
    }
  };

  const deleteUrl = async (shortCode: string): Promise<boolean> => {
    try {
      const response = await deleteAdminUrl(shortCode);

      if (response.success) {
        urls.value = urls.value.filter((url) => url.shortCode !== shortCode);
        deleteConfirm.value = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete URL error:", error);
      return false;
    }
  };

  const confirmDelete = (shortCode: string) => {
    deleteConfirm.value = shortCode;
  };

  const cancelDelete = () => {
    deleteConfirm.value = null;
  };

  return {
    urls,
    loading,
    error,
    deleteConfirm,
    urlsCount,
    totalClicks,
    loadUrls,
    deleteUrl,
    confirmDelete,
    cancelDelete,
  };
}
