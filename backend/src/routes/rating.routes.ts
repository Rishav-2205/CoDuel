import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getMyRatings, getMyRatingHistory } from "../controllers/rating.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyRatings);
router.get("/me/history", getMyRatingHistory);

export default router;
