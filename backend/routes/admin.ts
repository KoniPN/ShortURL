import express, { Request, Response } from "express";
import db from "../database.js";
import { requireAdmin } from "../middleware/auth.js";
import type { ApiResponse } from "../types.js";

const router = express.Router();

// ทุก route ใน admin ต้อง login และเป็น admin
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * ดึงรายชื่อ user ทั้งหมด (Admin only)
 */
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await db.getAllUsers();

    // ไม่ส่ง password กลับไป
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        count: sanitizedUsers.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาด",
    } as ApiResponse);
  }
});

/**
 * GET /api/admin/all-urls
 * ดึง URLs ทั้งหมดในระบบ (Admin only)
 */
router.get("/all-urls", async (_req: Request, res: Response) => {
  try {
    const urls = await db.getAllUrls();

    return res.json({
      success: true,
      data: {
        urls: urls,
        count: urls.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get all URLs error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาด",
    } as ApiResponse);
  }
});

/**
 * DELETE /api/admin/urls/:shortCode
 * ลบ URL (Admin only)
 */
router.delete("/urls/:shortCode", async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    // ตรวจสอบว่า URL มีอยู่หรือไม่
    const url = await db.getUrl(shortCode);
    if (!url) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบ URL นี้",
      } as ApiResponse);
    }

    // ลบ URL
    const deleted = await db.deleteUrlByShortCode(shortCode);

    if (deleted) {
      return res.json({
        success: true,
        message: "ลบ URL สำเร็จ",
      } as ApiResponse);
    } else {
      return res.status(500).json({
        success: false,
        error: "ไม่สามารถลบ URL ได้",
      } as ApiResponse);
    }
  } catch (error) {
    console.error("Delete URL error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาด",
    } as ApiResponse);
  }
});

/**
 * DELETE /api/admin/users/:userId
 * ลบ User (Admin only)
 */
router.delete("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(
      "🗑️ [DELETE USER] Request from:",
      req.user?.email,
      "to delete userId:",
      userId
    );

    // ตรวจสอบว่า User มีอยู่หรือไม่
    const user = await db.findUserById(userId);
    if (!user) {
      console.log("❌ [DELETE USER] User not found:", userId);
      return res.status(404).json({
        success: false,
        error: "ไม่พบ User นี้",
      } as ApiResponse);
    }

    // ห้ามลบตัวเอง
    if (req.user?.userId === userId) {
      console.log("⛔ [DELETE USER] Cannot delete self:", userId);
      return res.status(403).json({
        success: false,
        error: "ไม่สามารถลบบัญชีของตัวเองได้",
      } as ApiResponse);
    }

    // ลบ User
    console.log("🔨 [DELETE USER] Attempting to delete user:", user.email);
    const deleted = await db.deleteUser(userId);
    console.log("📊 [DELETE USER] Deletion result:", deleted);

    if (deleted) {
      console.log("✅ [DELETE USER] User deleted successfully:", userId);
      return res.json({
        success: true,
        message: "ลบ User สำเร็จ",
      } as ApiResponse);
    } else {
      console.log("❌ [DELETE USER] Failed to delete user:", userId);
      return res.status(500).json({
        success: false,
        error: "ไม่สามารถลบ User ได้",
      } as ApiResponse);
    }
  } catch (error) {
    console.error("💥 [DELETE USER] Exception:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาด",
    } as ApiResponse);
  }
});

export default router;
