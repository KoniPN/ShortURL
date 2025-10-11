import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 6);

export function generateShortCode(): string {
  return nanoid();
}

export function isValidUrl(url: string): boolean {
  // ตรวจสอบว่าเป็น string และไม่ว่างเปล่า
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }

  const trimmedUrl = url.trim();

  // ห้ามมี space, newline, tab
  if (/[\s\n\r\t]/.test(trimmedUrl)) {
    return false;
  }

  // ห้ามมี special characters ที่ผิดปกติ
  if (/[<>{}|\\^`\[\]]/.test(trimmedUrl)) {
    return false;
  }

  // ⚠️ ห้ามรับข้อความธรรมดาที่ไม่มีจุด (ต้องมี . เพื่อระบุว่าเป็น domain, IP, หรือ DNS)
  // ยกเว้น: localhost (กรณีพิเศษ)
  if (!trimmedUrl.includes(".") && trimmedUrl.toLowerCase() !== "localhost") {
    return false;
  }

  try {
    // ถ้าไม่มี protocol ให้เพิ่ม https:// เข้าไป
    let testUrl = trimmedUrl;
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      testUrl = "https://" + trimmedUrl;
    }

    const urlObj = new URL(testUrl);

    // ต้องเป็น http หรือ https เท่านั้น
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return false;
    }

    // ต้องมี hostname (domain, IP, หรือ DNS name)
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }

    const hostname = urlObj.hostname.toLowerCase();

    // ตรวจสอบว่าเป็น IP address หรือไม่
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isIPAddress = ipv4Pattern.test(hostname);

    if (isIPAddress) {
      // ถ้าเป็น IP address ให้ตรวจสอบว่า valid หรือไม่
      const parts = hostname.split(".");
      const isValidIP = parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });

      if (!isValidIP) {
        return false;
      }

      // อนุญาต IP address ทุกประเภท (รวม localhost และ private IPs)
      return true;
    }

    // ถ้าไม่ใช่ IP address ให้ตรวจสอบว่าเป็น DNS name หรือ domain
    // ⚠️ ต้องมี . (dot) เสมอ ยกเว้น localhost
    if (!hostname.includes(".") && hostname !== "localhost") {
      return false;
    }

    if (hostname.includes(".")) {
      // ถ้ามี . ให้ตรวจสอบ TLD
      const domainParts = hostname.split(".");
      const tld = domainParts[domainParts.length - 1];

      // TLD ต้องมีตัวอักษรอย่างน้อย 2 ตัว หรือเป็นชื่อ local domain
      if (tld.length < 2 && !hostname.endsWith(".local")) {
        return false;
      }
    }

    // อนุญาต hostname ที่มีจุด หรือ localhost เท่านั้น
    return true;
  } catch (err) {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  // เอาช่องว่างออกทั้งหมด
  url = url.trim().replace(/\s+/g, "");

  // ตรวจสอบว่าขึ้นต้นด้วย protocol หรือไม่
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
}

export function createShortUrl(shortCode: string, baseUrl?: string): string {
  const base = baseUrl || process.env.BASE_URL || "http://localhost:3000";
  return `${base}/${shortCode}`;
}
