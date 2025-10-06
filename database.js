/**
 * Database Layer - In-Memory Storage
 *
 * ออกแบบให้เหมือน DynamoDB structure เพื่อง่ายต่อการ migrate
 * DynamoDB Table Schema:
 * - Primary Key: shortCode (String)
 * - Attributes: originalUrl, createdAt, clicks, expiresAt
 */

class InMemoryDB {
  constructor() {
    // จำลอง DynamoDB table
    this.urls = new Map();
    this.analytics = new Map();
  }

  /**
   * สร้าง URL ใหม่ (PutItem in DynamoDB)
   */
  async createUrl(shortCode, originalUrl) {
    const item = {
      shortCode,
      originalUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
      expiresAt: null, // optional: set expiration
    };

    this.urls.set(shortCode, item);
    return item;
  }

  /**
   * ดึง URL จาก shortCode (GetItem in DynamoDB)
   */
  async getUrl(shortCode) {
    return this.urls.get(shortCode) || null;
  }

  /**
   * อัพเดทจำนวน clicks (UpdateItem in DynamoDB)
   */
  async incrementClicks(shortCode) {
    const item = this.urls.get(shortCode);
    if (item) {
      item.clicks += 1;
      item.lastAccessedAt = new Date().toISOString();
      this.urls.set(shortCode, item);

      // บันทึก analytics
      this.recordAnalytics(shortCode);
    }
    return item;
  }

  /**
   * ดึงข้อมูล analytics
   */
  async getAnalytics(shortCode) {
    return {
      url: this.urls.get(shortCode),
      clickHistory: this.analytics.get(shortCode) || [],
    };
  }

  /**
   * บันทึก analytics per click
   */
  recordAnalytics(shortCode) {
    if (!this.analytics.has(shortCode)) {
      this.analytics.set(shortCode, []);
    }

    this.analytics.get(shortCode).push({
      timestamp: new Date().toISOString(),
      // ในอนาคตเพิ่ม: userAgent, ip, referrer
    });
  }

  /**
   * ลบ URL (DeleteItem in DynamoDB)
   */
  async deleteUrl(shortCode) {
    return this.urls.delete(shortCode);
  }

  /**
   * ดึงข้อมูลทั้งหมด (Scan in DynamoDB - ใช้เฉพาะ development)
   */
  async getAllUrls() {
    return Array.from(this.urls.values());
  }

  /**
   * ตรวจสอบว่า shortCode มีอยู่แล้วหรือไม่
   */
  async exists(shortCode) {
    return this.urls.has(shortCode);
  }
}

// Export singleton instance
const db = new InMemoryDB();
module.exports = db;
