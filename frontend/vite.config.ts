import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // โหลด .env จาก root directory (parent folder)
  const env = loadEnv(mode, "../", "VITE_");

  return {
    plugins: [vue(), vueDevTools()],
    envDir: "..", // บอก Vite ให้อ่าน .env จาก parent folder (root)
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
