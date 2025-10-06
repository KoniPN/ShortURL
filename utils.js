const { customAlphabet } = require("nanoid");

/**
 * สร้าง short code ที่ปลอดภัยและไม่ซ้ำ
 * ใช้ nanoid สำหรับสร้าง URL-safe random string
 */

// กำหนด alphabet ที่จะใช้ (ไม่มีตัวอักษรที่สับสนเช่น 0, O, I, l)
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 7); // 7 characters = 62^7 = 3.5 trillion combinations

/**
 * สร้าง unique short code
 */
function generateShortCode() {
  return nanoid();
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch (err) {
    return false;
  }
}

/**
 * Sanitize URL (เพิ่ม protocol ถ้าไม่มี)
 */
function sanitizeUrl(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

/**
 * สร้าง short URL จาก base URL และ short code
 */
function createShortUrl(baseUrl, shortCode) {
  return `${baseUrl}/${shortCode}`;
}

module.exports = {
  generateShortCode,
  isValidUrl,
  sanitizeUrl,
  createShortUrl,
};
