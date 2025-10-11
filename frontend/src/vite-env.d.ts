/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // เพิ่มตัวแปรอื่นๆ ตามต้องการ
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
