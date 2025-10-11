<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 px-4"
  >
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">เข้าสู่ระบบ</h1>
        <p class="text-gray-600">ยินดีต้อนรับกลับมา! 👋</p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Email -->
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            อีเมล
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">กำลังเข้าสู่ระบบ...</span>
          <span v-else>เข้าสู่ระบบ</span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="mt-6 text-center">
        <p class="text-gray-600">
          ยังไม่มีบัญชี?
          <router-link
            to="/register"
            class="text-purple-600 hover:text-purple-700 font-semibold"
          >
            สมัครสมาชิก
          </router-link>
        </p>
      </div>

      <!-- Guest Link -->
      <div class="mt-4 text-center">
        <router-link to="/" class="text-gray-500 hover:text-gray-700">
          ← กลับหน้าหลัก
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

async function handleLogin() {
  error.value = "";
  isLoading.value = true;

  try {
    await authStore.login(email.value, password.value);
    router.push("/"); // Redirect to home page
  } catch (err: any) {
    error.value = err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
  } finally {
    isLoading.value = false;
  }
}
</script>
