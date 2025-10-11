<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import type { UrlData } from "../services/api";
import { formatDate } from "../composables/useDateFormat";
import { isValidUrl, truncateUrl } from "../composables/useUrlValidation";
import { useToast } from "../composables/useToast";
import { useClipboard } from "../composables/useClipboard";
import { useUrlManager } from "../composables/useUrlManager";

const router = useRouter();
const authStore = useAuthStore();

// Composables
const { toast, showToast } = useToast();
const { copied, copyToClipboard } = useClipboard();
const {
  urls,
  sortedUrls,
  loading,
  refreshing,
  loadUrls,
  createUrl,
  clearUrls,
} = useUrlManager();

// Local state
const url = ref("");
const result = ref<UrlData | null>(null);

// Lifecycle
onMounted(async () => {
  // โหลดประวัติถ้า user login แล้ว
  if (authStore.isAuthenticated) {
    setTimeout(async () => {
      await loadUrlList();
    }, 500);
  }
});

// Watch authentication state - โหลดประวัติเมื่อ login/logout
watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth) {
      // Login แล้ว - โหลดประวัติ
      await loadUrlList();
    } else {
      // Logout - clear ประวัติ
      clearUrls();
    }
  }
);

// Submit form
async function handleSubmit() {
  // ตรวจสอบว่ามีค่า
  if (!url.value.trim()) {
    showToast("กรุณาใส่ URL, IP address หรือ DNS name", "error");
    return;
  }

  const trimmedUrl = url.value.trim();

  // ตรวจสอบว่าเป็น URL, IP, หรือ DNS name ที่ถูกต้อง
  if (!isValidUrl(trimmedUrl)) {
    showToast(
      "กรุณาใส่ URL, IP address, หรือ DNS name ที่ถูกต้อง (ต้องมีจุด เช่น example.com, 192.168.1.1)",
      "error"
    );
    return;
  }

  try {
    const data = await createUrl(url.value);

    if (data) {
      result.value = data;
      showToast("สร้าง Short URL สำเร็จ!", "success");
      await loadUrlList();
    } else {
      showToast("เกิดข้อผิดพลาด", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
  }
}

// Copy URL
async function copyUrl() {
  if (!result.value) return;

  const success = await copyToClipboard(result.value.shortUrl);
  if (success) {
    showToast("คัดลอกลิงก์แล้ว!", "success");
  } else {
    showToast("ไม่สามารถคัดลอกได้", "error");
  }
}

// Download QR Code
function downloadQR() {
  if (!result.value || !result.value.qrCode) return;

  const link = document.createElement("a");
  link.download = `qr-${result.value.shortCode}.png`;
  link.href = result.value.qrCode;
  link.click();

  showToast("ดาวน์โหลด QR Code แล้ว!", "success");
}

// Reset form
function resetForm() {
  result.value = null;
  url.value = "";
  copied.value = false;
}

// Load URL list (แยกตามบัญชีของแต่ละ user)
async function loadUrlList() {
  await loadUrls(authStore.isAuthenticated);
}

// Logout
async function handleLogout() {
  await authStore.logout();
  result.value = null;
  clearUrls();
  showToast("ออกจากระบบสำเร็จ", "success");
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-secondary p-5 font-sans text-gray-900"
  >
    <!-- Header -->
    <header class="text-center text-white mb-8 animate-fadeInDown relative">
      <!-- Auth Buttons (Top Right) -->
      <div class="absolute top-0 right-0">
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
          <span class="text-white/90">สวัสดี, {{ authStore.user?.name }}</span>
          <!-- Admin Button -->
          <button
            v-if="authStore.isAdmin"
            @click="router.push('/admin')"
            class="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg font-medium transition backdrop-blur-sm"
          >
            🔐 Admin
          </button>
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition backdrop-blur-sm"
          >
            ออกจากระบบ
          </button>
        </div>
        <div v-else class="flex gap-2">
          <button
            @click="router.push('/login')"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition backdrop-blur-sm"
          >
            เข้าสู่ระบบ
          </button>
          <button
            @click="router.push('/register')"
            class="px-4 py-2 bg-white text-purple-600 hover:bg-white/90 rounded-lg font-medium transition"
          >
            สมัครสมาชิก
          </button>
        </div>
      </div>

      <div
        class="inline-block p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-4"
      >
        <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <h1 class="text-5xl font-bold mb-3">ShortURL</h1>
      <p class="text-xl opacity-90">สร้างลิงก์สั้นพร้อม QR Code ภายในวินาที</p>
      <p v-if="!authStore.isAuthenticated" class="text-sm opacity-75 mt-2">
        💡 เข้าสู่ระบบเพื่อดูประวัติและ QR Code
      </p>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto space-y-6">
      <!-- Form Card -->
      <div
        v-if="!result"
        class="bg-white rounded-2xl p-8 shadow-2xl animate-fadeInUp"
      >
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label
              class="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                />
              </svg>
              ใส่ URL ที่ต้องการย่อ
            </label>
            <input
              v-model="url"
              type="text"
              placeholder="https://example.com/very/long/url/that/needs/to/be/shortened"
              required
              autocomplete="off"
              class="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-gray-300"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-base font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ loading ? "กำลังสร้าง..." : "สร้าง Short URL" }}</span>
          </button>
        </form>
      </div>

      <!-- Result Card -->
      <Transition name="fade">
        <div
          v-if="result"
          class="bg-white rounded-2xl p-8 shadow-2xl border-2 border-green-500"
        >
          <!-- Success Header -->
          <div
            class="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100"
          >
            <div
              class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-green-500">สร้างสำเร็จ!</h2>
          </div>

          <!-- Short URL -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-600 mb-2"
              >🔗 Short URL</label
            >
            <div class="flex gap-2">
              <input
                :value="result.shortUrl"
                readonly
                class="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-semibold text-primary"
              />
              <button
                @click="copyUrl"
                class="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all hover:scale-105 whitespace-nowrap"
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path
                    d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
                  />
                </svg>
                <span>{{ copied ? "คัดลอกแล้ว!" : "คัดลอก" }}</span>
              </button>
            </div>
          </div>

          <!-- Original URL -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-600 mb-2"
              >📄 Original URL</label
            >
            <div
              class="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 break-all"
            >
              {{ result.originalUrl }}
            </div>
          </div>

          <!-- QR Code (เฉพาะ User ที่ Login) -->
          <div v-if="authStore.isAuthenticated && result.qrCode" class="mb-6">
            <label class="block text-sm font-semibold text-gray-600 mb-3"
              >📱 QR Code</label
            >
            <div class="flex flex-col items-center gap-4">
              <img
                :src="result.qrCode"
                alt="QR Code"
                class="w-48 h-48 border-4 border-gray-200 rounded-2xl shadow-lg"
              />
              <button
                @click="downloadQR"
                class="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
                ดาวน์โหลด QR Code
              </button>
            </div>
          </div>

          <!-- Guest Message -->
          <div
            v-if="!authStore.isAuthenticated"
            class="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl"
          >
            <p class="text-yellow-800 text-center">
              🔒 เข้าสู่ระบบเพื่อดู QR Code
            </p>
          </div>

          <!-- Create Another Button -->
          <div class="mt-6 pt-6 border-t-2 border-gray-100">
            <button
              @click="resetForm"
              class="w-full px-7 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-base font-semibold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
            >
              ✨ สร้าง Short URL ใหม่
            </button>
          </div>
        </div>
      </Transition>

      <!-- URL List (เฉพาะ User ที่ Login) -->
      <div
        v-if="authStore.isAuthenticated"
        class="bg-white rounded-2xl p-8 shadow-2xl"
      >
        <div
          class="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-100"
        >
          <h2 class="text-xl font-bold text-gray-800">📊 URL ที่สร้างล่าสุด</h2>
          <button
            @click="loadUrlList"
            title="รีเฟรชข้อมูล"
            class="p-2 text-primary hover:bg-gray-100 rounded-lg transition-colors"
            :class="{ 'animate-spin': refreshing }"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div class="max-h-96 overflow-y-auto space-y-3">
          <p
            v-if="sortedUrls.length === 0"
            class="text-center text-gray-500 py-10 italic"
          >
            ยังไม่มี URL ที่สร้าง
          </p>

          <div
            v-for="urlItem in sortedUrls.slice(0, 10)"
            :key="urlItem.shortCode"
            class="p-4 bg-gray-50 rounded-xl transition-all duration-200 border-2 border-transparent hover:bg-white hover:border-primary hover:shadow-md"
          >
            <div class="flex items-start justify-between mb-2">
              <span class="text-lg font-bold text-primary"
                >/{{ urlItem.shortCode }}</span
              >
              <span
                class="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold"
              >
                👁️ {{ urlItem.clicks }} คลิก
              </span>
            </div>
            <div class="text-gray-600 text-sm mb-2 break-all">
              {{ truncateUrl(urlItem.originalUrl, 60) }}
            </div>
            <div class="text-gray-500 text-xs">
              สร้างเมื่อ {{ formatDate(urlItem.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center text-white mt-10 p-5 opacity-90">
      <p class="mb-1">Made with ❤️ for Cloud Computing Project</p>
      <p class="text-sm opacity-80">Node.js • Express • Vue 3 • AWS Ready</p>
    </footer>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div
        v-if="loading"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      >
        <div
          class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"
        ></div>
      </div>
    </Transition>

    <!-- Toast Notification -->
    <Transition name="slide">
      <div
        v-if="toast.show"
        :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
        class="fixed bottom-8 right-8 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm font-medium"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInDown {
  animation: fadeInDown 0.6s ease-out;
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
