/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BASE_URL: string; // เพิ่ม VITE_BASE_URL
  // เพิ่มตัวแปรอื่นๆ ตามต้องการ
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
