import express from "express";
import {
  submitCodingAnswer,
  createCodingQuestion,
  getCodingQuestions,
  getCodingQuestion,
  getExamCodingQuestion,
} from "../controllers/codingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Student routes
router.post("/submit", submitCodingAnswer);
router.get("/question/exam/:examId", getExamCodingQuestion);

// Teacher routes
router.post("/question", createCodingQuestion);
router.get("/questions/all", getCodingQuestions);
router.get("/questions/:id", getCodingQuestion);

export default router;
