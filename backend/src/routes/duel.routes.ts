import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  startDuel,
  answerQuestion,
  skipQuestion,
  getDuelStatus,
  finishDuel,
  submitTypingProgress,
} from "../controllers/duel.controller";

const router = Router();

router.use(requireAuth);

router.post("/start", startDuel);
router.post("/:id/answer", answerQuestion);
router.post("/:id/skip", skipQuestion);
router.post("/:id/typing-progress", submitTypingProgress);
router.get("/:id", getDuelStatus);
router.post("/:id/finish", finishDuel);

export default router;
