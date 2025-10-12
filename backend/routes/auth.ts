import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { RegisterRequest, LoginRequest, AuthResponse } from "../types.js";
import db from "../database.js";
import { requireAuth, generateToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * สมัครสมาชิกใหม่
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as RegisterRequest;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "กรุณากรอกข้อมูลให้ครบถ้วน",
      } as AuthResponse);
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
      } as AuthResponse);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "รูปแบบอีเมลไม่ถูกต้อง",
      } as AuthResponse);
    }

    // Check if email already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้ว",
      } as AuthResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.createUser({
      email,
      password: hashedPassword,
    });

    // Generate token (อายุ 7 วัน)
    const token = generateToken(user.id, user.email);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
      sameSite: "lax",
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
    } as AuthResponse);
  }
});

/**
 * POST /api/auth/login
 * เข้าสู่ระบบ
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "กรุณากรอกอีเมลและรหัสผ่าน",
      } as AuthResponse);
    }

    // Find user
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      } as AuthResponse);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      } as AuthResponse);
    }

    // Generate token (อายุ 7 วัน)
    const token = generateToken(user.id, user.email);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
      sameSite: "lax",
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
    } as AuthResponse);
  }
});

/**
 * POST /api/auth/logout
 * ออกจากระบบ
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  return res.json({
    success: true,
    message: "ออกจากระบบสำเร็จ",
  });
});

/**
 * GET /api/auth/me
 * ดึงข้อมูล user ปัจจุบัน (ต้อง login)
 */
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "กรุณา login ก่อนใช้งาน",
      });
    }

    const user = await db.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูล user",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาด",
    });
  }
});

export default router;
