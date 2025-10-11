<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 px-4"
  >
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">สมัครสมาชิก</h1>
        <p class="text-gray-600">สร้างบัญชีของคุณ 🎉</p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="space-y-6">
        <!-- Name -->
        <div>
          <label
            for="name"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            ชื่อ
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="ชื่อของคุณ"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>

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
            minlength="6"
            placeholder="••••••••"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <p class="mt-1 text-xs text-gray-500">
            รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
          </p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
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
          <span v-if="isLoading">กำลังสมัครสมาชิก...</span>
          <span v-else>สมัครสมาชิก</span>
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-gray-600">
          มีบัญชีอยู่แล้ว?
          <router-link
            to="/login"
            class="text-purple-600 hover:text-purple-700 font-semibold"
          >
            เข้าสู่ระบบ
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

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const isLoading = ref(false);

async function handleRegister() {
  error.value = "";

  // Validation
  if (password.value !== confirmPassword.value) {
    error.value = "รหัสผ่านไม่ตรงกัน";
    return;
  }

  if (password.value.length < 6) {
    error.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    return;
  }

  isLoading.value = true;

  try {
    await authStore.register(email.value, password.value, name.value);
    router.push("/"); // Redirect to home page
  } catch (err: any) {
    error.value = err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก";
  } finally {
    isLoading.value = false;
  }
}
</script>
