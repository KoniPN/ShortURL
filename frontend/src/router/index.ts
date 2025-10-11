import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import AdminView from "../views/AdminView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresGuest: true }, // ถ้า login แล้วจะ redirect ไป home
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { requiresGuest: true }, // ถ้า login แล้วจะ redirect ไป home
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { requiresAdmin: true }, // ต้องเป็น Admin เท่านั้น
    },
  ],
});

// Navigation Guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // ถ้ายังไม่ได้ initialize auth store ให้ทำก่อน
  if (!authStore.user && authStore.token) {
    await authStore.initialize();
  }

  // ตรวจสอบว่าหน้านี้ต้องการ Admin หรือไม่
  if (to.meta.requiresAdmin) {
    if (!authStore.isAuthenticated) {
      // ยังไม่ได้ login ให้ไป login ก่อน
      next("/login");
      return;
    }
    if (!authStore.isAdmin) {
      // login แล้วแต่ไม่ใช่ Admin ให้กลับ home
      next("/");
      return;
    }
  }

  // ถ้าหน้าต้องการให้เป็น guest (เช่น login, register)
  // แต่ user login อยู่แล้ว ให้ redirect ไป home
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next("/");
    return;
  }

  next();
});

export default router;
