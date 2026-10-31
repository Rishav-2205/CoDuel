import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getUserProfile,
  updateUserProfile,
  getUserMatchHistory,
} from "../controllers/user.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", getUserProfile);
router.patch("/me", updateUserProfile);
router.get("/me/history", getUserMatchHistory);

export default router;
