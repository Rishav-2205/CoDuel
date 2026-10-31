import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: { message: "Too many authentication requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;
