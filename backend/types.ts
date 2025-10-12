// Type definitions for URL Shortener

// User Types
export interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// URL Types
export interface UrlData {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  userId?: string; // Optional: ถ้ามี = user ที่สร้าง, ถ้าไม่มี = guest
}

export interface CreateUrlInput {
  shortCode: string;
  originalUrl: string;
  userId?: string; // Optional: สำหรับ user ที่ login
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ShortenResponse {
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  qrCode: string;
  createdAt: string;
}

export interface AnalyticsData {
  url: UrlData | null;
  clicks: number;
  createdAt?: string;
}

export interface Database {
  // URL operations
  createUrl(urlData: CreateUrlInput): Promise<UrlData>;
  getUrl(shortCode: string): Promise<UrlData | null>;
  getAllUrls(): Promise<UrlData[]>;
  incrementClicks(shortCode: string): Promise<UrlData | null>;
  deleteUrl(shortCode: string): Promise<boolean>;
  exists(shortCode: string): Promise<boolean>;
  getAnalytics(shortCode: string): Promise<AnalyticsData>;
  getUserUrls(userId: string): Promise<UrlData[]>;

  // User operations
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
}
