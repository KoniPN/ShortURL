import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Required Auth Middleware
 * ใช้สำหรับ route ที่ต้อง login
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: "กรุณา login ก่อนใช้งาน",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token หมดอายุ กรุณา login ใหม่",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Token ไม่ถูกต้อง",
    });
  }
}

/**
 * Optional Auth Middleware
 * ใช้สำหรับ route ที่ไม่บังคับให้ login (guest/user ใช้ได้ทั้งคู่)
 * ถ้ามี token จะแปลงเป็น user, ถ้าไม่มีก็ skip
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
  } catch (error) {
    // ถ้า token ไม่ valid ก็ไม่เป็นไร ให้ผ่านเป็น guest
  }

  next();
}

/**
 * Generate JWT Token (อายุ 7 วัน)
 */
export function generateToken(
  userId: string,
  email: string,
  isAdmin: boolean = false
): string {
  return jwt.sign(
    { userId, email, isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" } // Token อายุ 7 วัน
  );
}

/**
 * Admin Only Middleware
 * ใช้สำหรับ route ที่ต้องการสิทธิ์ admin เท่านั้น
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: "กรุณา login ก่อนใช้งาน",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!decoded.isAdmin) {
      res.status(403).json({
        success: false,
        error: "ไม่มีสิทธิ์เข้าถึง - Admin เท่านั้น",
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token หมดอายุ กรุณา login ใหม่",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Token ไม่ถูกต้อง",
    });
  }
}
