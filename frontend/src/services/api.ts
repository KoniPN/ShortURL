// API Service for URL Shortener
const API_BASE = "/api";

export interface UrlData {
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  qrCode?: string; // Optional for guest users
  clicks: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// สร้าง Short URL (รองรับทั้ง guest และ user)
export async function createShortUrl(
  url: string
): Promise<ApiResponse<UrlData>> {
  const response = await fetch(`${API_BASE}/shorten`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include", // ส่ง cookies
    body: JSON.stringify({ url }),
  });

  return response.json();
}

// ดึง URL ทั้งหมด (สำหรับ admin/development)
export async function getAllUrls(): Promise<ApiResponse<UrlData[]>> {
  const response = await fetch(`${API_BASE}/urls`);
  return response.json();
}

// ดึงประวัติ URL ของ user ที่ login (ต้องมี token)
export async function getMyUrls(): Promise<ApiResponse<UrlData[]>> {
  const response = await fetch(`${API_BASE}/my-urls`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return response.json();
}

// ดึง Analytics
export async function getAnalytics(
  shortCode: string
): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/${shortCode}`);
  return response.json();
}

// ลบ URL
export async function deleteUrl(shortCode: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/urls/${shortCode}`, {
    method: "DELETE",
  });
  return response.json();
}

// =============== Admin API ===============

// ดึงรายชื่อ User ทั้งหมด (Admin เท่านั้น)
export async function getAdminUsers(): Promise<ApiResponse<any>> {
  const headers = getAuthHeaders();
  console.log("📡 Calling GET /api/admin/users with headers:", headers);
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers,
    credentials: "include",
  });
  console.log("📥 Response status:", response.status, response.statusText);
  const data = await response.json();
  console.log("📦 Response data:", data);
  return data;
}

// ดึง URL ทั้งหมดจากทุก User (Admin เท่านั้น)
export async function getAdminAllUrls(): Promise<ApiResponse<any>> {
  const headers = getAuthHeaders();
  console.log("📡 Calling GET /api/admin/all-urls with headers:", headers);
  const response = await fetch(`${API_BASE}/admin/all-urls`, {
    headers,
    credentials: "include",
  });
  console.log("📥 Response status:", response.status, response.statusText);
  const data = await response.json();
  console.log("📦 Response data:", data);
  return data;
}

// ลบ URL โดย Admin
export async function deleteAdminUrl(
  shortCode: string
): Promise<ApiResponse<any>> {
  const headers = getAuthHeaders();
  const response = await fetch(`${API_BASE}/admin/urls/${shortCode}`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });
  return response.json();
}

// ลบ User โดย Admin
export async function deleteAdminUser(
  userId: string
): Promise<ApiResponse<any>> {
  const headers = getAuthHeaders();
  console.log(
    "📡 Calling DELETE /api/admin/users/" + userId + " with headers:",
    headers
  );
  const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });
  console.log(
    "📥 Delete user response status:",
    response.status,
    response.statusText
  );
  const data = await response.json();
  console.log("📦 Delete user response data:", data);
  return data;
}
