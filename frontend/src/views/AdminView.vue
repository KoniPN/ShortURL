<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { useAdminUsers, useAdminUrls } from "../composables/useAdmin";
import { useToast } from "../composables/useToast";

const authStore = useAuthStore();
const router = useRouter();

// Composables
const { showToast } = useToast();
const {
  users,
  loading: usersLoading,
  error: usersError,
  deleteConfirm: deleteUserConfirm,
  usersCount,
  loadUsers,
  deleteUser: deleteUserAction,
  confirmDelete: confirmDeleteUser,
  cancelDelete: cancelDeleteUser,
} = useAdminUsers();

const {
  urls,
  loading: urlsLoading,
  error: urlsError,
  deleteConfirm: deleteUrlConfirm,
  urlsCount,
  loadUrls,
  deleteUrl: deleteUrlAction,
  confirmDelete: confirmDeleteUrl,
  cancelDelete: cancelDeleteUrl,
} = useAdminUrls();

// ตรวจสอบสิทธิ์
onMounted(() => {
  console.log("🔐 Admin Check - isAdmin:", authStore.isAdmin);
  console.log("👤 Current User:", authStore.user);

  if (!authStore.isAdmin) {
    console.log("❌ Not admin, redirecting to home");
    router.push("/");
  } else {
    console.log("✅ Admin verified, loading data...");
    loadUsers();
    loadUrls();
  }
});

// ============= Helper Functions =============
async function handleDeleteUser(userId: string) {
  const success = await deleteUserAction(userId);
  if (success) {
    showToast("ลบ User สำเร็จ! ✓", "success");
  } else {
    showToast("ไม่สามารถลบ User ได้", "error");
  }
}

async function handleDeleteUrl(shortCode: string) {
  const success = await deleteUrlAction(shortCode);
  if (success) {
    showToast("ลบ URL สำเร็จ! ✓", "success");
  } else {
    showToast("ไม่สามารถลบ URL ได้", "error");
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateUrl(url: string, maxLength = 50) {
  return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold text-gray-800 mb-2">
            🔐 Admin Dashboard
          </h1>
          <p class="text-gray-600">จัดการ User และ URL ทั้งหมดในระบบ</p>
        </div>
        <button
          @click="router.push('/')"
          class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← กลับหน้าหลัก
        </button>
      </div>

      <!-- Users Section -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-800">
            👥 รายชื่อ Users ({{ usersCount }})
          </h2>
          <button
            @click="loadUsers"
            :disabled="usersLoading"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {{ usersLoading ? "⏳ Loading..." : "🔄 Refresh" }}
          </button>
        </div>

        <div
          v-if="usersError"
          class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
        >
          {{ usersError }}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="text-left p-3 font-semibold text-gray-700">ID</th>
                <th class="text-left p-3 font-semibold text-gray-700">อีเมล</th>
                <th class="text-left p-3 font-semibold text-gray-700">ชื่อ</th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  สิทธิ์
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  วันที่สร้าง
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="usersLoading">
                <td colspan="6" class="text-center p-8 text-gray-500">
                  <div class="animate-pulse">กำลังโหลดข้อมูล...</div>
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="text-center p-8 text-gray-500">
                  ไม่มีข้อมูล User
                </td>
              </tr>
              <tr
                v-else
                v-for="user in users"
                :key="user.id"
                class="border-b hover:bg-gray-50 transition-colors"
              >
                <td class="p-3 text-gray-600 font-mono text-sm">
                  {{ user.id.substring(0, 8) }}...
                </td>
                <td class="p-3 text-gray-800">{{ user.email }}</td>
                <td class="p-3 text-gray-800">{{ user.name }}</td>
                <td class="p-3">
                  <span
                    v-if="user.isAdmin"
                    class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold"
                  >
                    🛡️ Admin
                  </span>
                  <span
                    v-else
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    👤 User
                  </span>
                </td>
                <td class="p-3 text-gray-600 text-sm">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="p-3">
                  <!-- Delete User Confirmation Dialog -->
                  <div v-if="deleteUserConfirm === user.id" class="flex gap-2">
                    <button
                      @click="handleDeleteUser(user.id)"
                      class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      ✓ ยืนยัน
                    </button>
                    <button
                      @click="cancelDeleteUser"
                      class="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                    >
                      ✗ ยกเลิก
                    </button>
                  </div>
                  <!-- Disable delete for current user and admins -->
                  <button
                    v-else-if="user.id === authStore.user?.id"
                    disabled
                    class="px-4 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm"
                    title="ไม่สามารถลบบัญชีของตัวเองได้"
                  >
                    🔒 ตัวเอง
                  </button>
                  <button
                    v-else
                    @click="confirmDeleteUser(user.id)"
                    class="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ ลบ
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- URLs Section -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-800">
            🔗 รายการ URLs ทั้งหมด ({{ urlsCount }})
          </h2>
          <button
            @click="loadUrls"
            :disabled="urlsLoading"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {{ urlsLoading ? "⏳ Loading..." : "🔄 Refresh" }}
          </button>
        </div>

        <div
          v-if="urlsError"
          class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
        >
          {{ urlsError }}
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b">
                <th class="text-left p-3 font-semibold text-gray-700">
                  Short Code
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  URL ต้นทาง
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">คลิก</th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  User ID
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  วันที่สร้าง
                </th>
                <th class="text-left p-3 font-semibold text-gray-700">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="urlsLoading">
                <td colspan="6" class="text-center p-8 text-gray-500">
                  <div class="animate-pulse">กำลังโหลดข้อมูล...</div>
                </td>
              </tr>
              <tr v-else-if="urls.length === 0">
                <td colspan="6" class="text-center p-8 text-gray-500">
                  ไม่มีข้อมูล URL
                </td>
              </tr>
              <tr
                v-else
                v-for="url in urls"
                :key="url.shortCode"
                class="border-b hover:bg-gray-50 transition-colors"
              >
                <td class="p-3">
                  <code
                    class="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-sm"
                  >
                    {{ url.shortCode }}
                  </code>
                </td>
                <td class="p-3 text-gray-800">
                  <a
                    :href="url.originalUrl"
                    target="_blank"
                    class="hover:text-blue-600 hover:underline"
                  >
                    {{ truncateUrl(url.originalUrl) }}
                  </a>
                </td>
                <td class="p-3 text-gray-600">{{ url.clicks || 0 }}</td>
                <td class="p-3 text-gray-600 font-mono text-xs">
                  {{
                    url.userId ? url.userId.substring(0, 8) + "..." : "Guest"
                  }}
                </td>
                <td class="p-3 text-gray-600 text-sm">
                  {{ formatDate(url.createdAt) }}
                </td>
                <td class="p-3">
                  <!-- Delete Confirmation Dialog -->
                  <div
                    v-if="deleteUrlConfirm === url.shortCode"
                    class="flex gap-2"
                  >
                    <button
                      @click="handleDeleteUrl(url.shortCode)"
                      class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      ✓ ยืนยัน
                    </button>
                    <button
                      @click="cancelDeleteUrl"
                      class="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                    >
                      ✗ ยกเลิก
                    </button>
                  </div>
                  <button
                    v-else
                    @click="confirmDeleteUrl(url.shortCode)"
                    class="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ ลบ
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* เพิ่ม animation สำหรับ loading */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
