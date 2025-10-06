require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
// QRCode library ลบออก - ใช้ API ภายนอกแทน (ดู server.js.backup)
const db = require("./database");
const {
  generateShortCode,
  isValidUrl,
  sanitizeUrl,
  createShortUrl,
} = require("./utils");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// =====================================================
// API Routes
// =====================================================

/**
 * POST /api/shorten
 * สร้าง short URL ใหม่
 */
app.post("/api/shorten", async (req, res) => {
  try {
    let { url } = req.body; // ลบ customCode ออก

    // ========================================
    // VALIDATION - ถ้า error ไม่บันทึก database
    // ========================================

    // 1. Check if URL exists
    if (!url || typeof url !== "string" || url.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "กรุณาใส่ URL",
      });
    }

    // 2. Sanitize and validate URL format
    url = sanitizeUrl(url.trim());
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error:
          "รูปแบบ URL ไม่ถูกต้อง กรุณาใส่ URL ที่ถูกต้อง เช่น https://example.com",
      });
    }

    // 3. Check URL length
    if (url.length > 2048) {
      return res.status(400).json({
        success: false,
        error: "URL ยาวเกินไป (สูงสุด 2048 ตัวอักษร)",
      });
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
      });
    }

    // บันทึกลง database
    const urlData = await db.createUrl(shortCode, url);
    const shortUrl = createShortUrl(BASE_URL, shortCode);

    // สร้าง QR Code URL (ใช้ API ภายนอก - ไม่ต้องติดตั้ง library)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      shortUrl
    )}`;

    // Success response
    res.status(201).json({
      success: true,
      data: {
        originalUrl: url,
        shortUrl,
        shortCode,
        qrCode: qrCodeUrl, // ส่ง URL แทน data URL
        createdAt: urlData.createdAt,
      },
    });
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
    });
  }
});

/**
 * GET /api/urls
 * ดึงข้อมูล URLs ทั้งหมด (สำหรับ development/admin)
 */
app.get("/api/urls", async (req, res) => {
  try {
    const urls = await db.getAllUrls();
    res.json({
      success: true,
      data: urls,
      count: urls.length,
    });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/analytics/:shortCode
 * ดึงข้อมูล analytics ของ short URL
 */
app.get("/api/analytics/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const analytics = await db.getAnalytics(shortCode);

    if (!analytics.url) {
      return res.status(404).json({
        success: false,
        error: "Short URL not found",
      });
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /api/urls/:shortCode
 * ลบ short URL
 */
app.delete("/api/urls/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const deleted = await db.deleteUrl(shortCode);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Short URL not found",
      });
    }

    res.json({
      success: true,
      message: "URL deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// =====================================================
// Redirect Route
// =====================================================

/**
 * GET /:shortCode
 * Redirect จาก short URL ไปยัง original URL
 */
app.get("/:shortCode", async (req, res) => {
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
// Health Check
// =====================================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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

module.exports = app;
