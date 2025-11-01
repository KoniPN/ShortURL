import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath, resolve } from "url";
import db from "./database.js";
import {
  generateShortCode,
  isValidUrl,
  sanitizeUrl,
  createShortUrl,
} from "./utils.js";
import type { ApiResponse, ShortenResponse } from "./types.js";
import authRoutes from "./routes/auth.js";
import { optionalAuth, requireAuth } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
console.log(BASE_URL);

// Allowed origins for CORS
const allowedOrigins = [
  "http://shortsun.online",
  "http://shortsun.online.s3-website-us-east-1.amazonaws.com",
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // เพิ่ม cookie parser
app.use(express.static("public"));

// Auth Routes
app.use("/api/auth", authRoutes);

// =====================================================
// API Routes
// =====================================================

/**
 * POST /api/shorten
 * สร้าง short URL ใหม่ (รองรับทั้ง guest และ user)
 */
app.post(
  "/api/shorten",
  optionalAuth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      let { url } = req.body as { url?: string };

      // ========================================
      // VALIDATION - ถ้า error ไม่บันทึก database
      // ========================================

      // 1. Check if URL exists and is a string
      if (!url || typeof url !== "string" || url.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "กรุณาใส่ URL",
        } as ApiResponse);
      }

      // 2. Trim URL
      const trimmedUrl = url.trim();

      // 4. Sanitize URL (เพิ่ม https:// ถ้าไม่มี)
      url = sanitizeUrl(trimmedUrl);

      // 5. Validate URL format อย่างเข้มงวด
      if (!isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          error:
            "รูปแบบ URL ไม่ถูกต้อง กรุณาใส่ URL ที่สมบูรณ์ เช่น https://example.com",
        } as ApiResponse);
      }

      // 6. Check URL length
      if (url.length > 2048) {
        return res.status(400).json({
          success: false,
          error: "URL ยาวเกินไป (สูงสุด 2048 ตัวอักษร)",
        } as ApiResponse);
      }

      // 7. Final URL validation (อนุญาต IP addresses และ DNS names)
      try {
        new URL(url); // Just validate it can be parsed as URL
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: "URL ไม่ถูกต้อง",
        } as ApiResponse);
      }

      // ========================================
      // ผ่านการตรวจสอบแล้ว - บันทึกลง database
      // ========================================

      // สร้าง short code (Auto only)
      let shortCode = generateShortCode();

      // Double check - ถ้า random code ซ้ำ (แทบไม่มีทาง แต่เผื่อไว้)
      let attempts = 0;
      while ((await db.exists(shortCode)) && attempts < 10) {
        shortCode = generateShortCode();
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({
          success: false,
          error: "ไม่สามารถสร้างรหัสที่ไม่ซ้ำได้ กรุณาลองใหม่อีกครั้ง",
        } as ApiResponse);
      }

      // บันทึกลง database (พร้อม userId ถ้ามี)
      const urlData = await db.createUrl({
        shortCode,
        originalUrl: url,
        userId: req.user?.userId, // เก็บ userId ถ้า user login
      });
      const shortUrl = createShortUrl(shortCode, BASE_URL);

      // สร้าง QR Code URL (ใช้ API ภายนอก - ไม่ต้องติดตั้ง library)
      // ⚠️ Guest จะไม่เห็น QR code
      const qrCodeUrl = req.user
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            shortUrl
          )}`
        : undefined;

      // Success response
      res.status(201).json({
        success: true,
        data: {
          originalUrl: url,
          shortUrl,
          shortCode,
          qrCode: qrCodeUrl, // Guest จะได้ undefined
          createdAt: urlData.createdAt,
        } as ShortenResponse,
      } as ApiResponse<ShortenResponse>);
    } catch (error) {
      console.error("Error shortening URL:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
      } as ApiResponse);
    }
  }
);

/**
 * GET /api/urls
 * ดึงข้อมูล URLs ทั้งหมด (สำหรับ development/admin)
 */
app.get("/api/urls", async (_req: Request, res: Response): Promise<void> => {
  try {
    const urls = await db.getAllUrls();
    res.json({
      success: true,
      data: urls,
      count: urls.length,
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse);
  }
});

/**
 * GET /api/my-urls
 * ดึงประวัติ URLs ของ user ที่ login (ต้อง login)
 */
app.get(
  "/api/my-urls",
  requireAuth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "กรุณา login ก่อนใช้งาน",
        } as ApiResponse);
      }

      const urls = await db.getUserUrls(req.user.userId);
      res.json({
        success: true,
        data: urls,
        count: urls.length,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching user URLs:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }
);

/**
 * GET /api/analytics/:shortCode
 * ดึงข้อมูล analytics ของ short URL
 */
app.get(
  "/api/analytics/:shortCode",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { shortCode } = req.params;
      const analytics = await db.getAnalytics(shortCode);

      if (!analytics.url) {
        return res.status(404).json({
          success: false,
          error: "Short URL not found",
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: analytics,
      } as ApiResponse);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }
);

/**
 * DELETE /api/urls/:shortCode
 * ลบ short URL
 */
app.delete(
  "/api/urls/:shortCode",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { shortCode } = req.params;
      const deleted = await db.deleteUrl(shortCode);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Short URL not found",
        } as ApiResponse);
      }

      res.json({
        success: true,
        message: "URL deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Error deleting URL:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      } as ApiResponse);
    }
  }
);

// =====================================================
// Health Check
// =====================================================

app.get("/health", (_req: Request, res: Response): void => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// =====================================================
// Redirect Route
// =====================================================

/**
 * GET /:shortCode
 * Redirect จาก short URL ไปยัง original URL
 */
app.get("/:shortCode", async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    // ดึงข้อมูล URL
    const urlData = await db.getUrl(shortCode);

    if (!urlData) {
      return res
        .status(404)
        .sendFile(path.join(__dirname, "public", "404.html"));
    }

    // เพิ่มจำนวน clicks
    await db.incrementClicks(shortCode);

    // Redirect ไปยัง original URL
    res.redirect(urlData.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Internal server error");
  }
});

// =====================================================
// Start Server
// =====================================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 URL Shortener Server is running!            ║
  ║                                                   ║
  ║   📍 Local:    http://localhost:${PORT}            ║
  ║   🌐 Network:  ${BASE_URL}                        ║
  ║                                                   ║
  ║   📚 API Endpoints:                               ║
  ║      POST   /api/shorten                          ║
  ║      GET    /api/urls                             ║
  ║      GET    /api/analytics/:shortCode             ║
  ║      DELETE /api/urls/:shortCode                  ║
  ║      GET    /:shortCode (redirect)                ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
