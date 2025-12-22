import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  createExam,
  DeleteExamById,
  getExams,
  getMyExams,
  getExamById,
  updateExam,
  getExamResults,
  submitExam,
  getStudentExamResult,
  getLastStudentSubmission,
  getStudentStats,
  getTeacherSubmissions,
  getAllSubmissions,
  updateSubmissionScore,
  updateSubmissionStatus,
  approveCheatingLogs,
  approveFailureReason,
  checkExamAttempts,
} from "../controllers/examController.js";
import {
  createQuestion,
  getQuestionsByExamId,
  updateQuestion,
} from "../controllers/quesController.js";
import {
  getCheatingLogsByExamId,
  saveCheatingLog,
} from "../controllers/cheatingLogController.js";

const examRoutes = express.Router();

// Define specific question creation route first
// examRoutes.route("/exam/questions").post(protect, createQuestion);

// Define results routes 
examRoutes.get("/results/student/:examId/:studentId", protect, getStudentExamResult);
examRoutes.get("/results/exam/:examId", protect, getExamResults);

// All other exam-related routes
// protecting Exam route using auth middleware protect /api/users/
examRoutes.route("/exam").get(protect, getExams).post(protect, createExam);
examRoutes.route("/my-exams").get(protect, getMyExams);
examRoutes.route("/exam/:examId").get(protect, getExamById).put(protect, updateExam);
examRoutes.route("/exam/:examId").post(protect, DeleteExamById);
examRoutes.route("/exam/:examId/attempts").get(protect, checkExamAttempts);
examRoutes.route("/exam/:examId/questions").get(protect, getQuestionsByExamId);
examRoutes.route("/question/:questionId").put(protect, updateQuestion);
examRoutes.route("/cheatingLogs/:examId").get(protect, getCheatingLogsByExamId);
examRoutes.route("/cheatingLogs").post(protect, saveCheatingLog);
examRoutes.route("/last-submission").get(protect, getLastStudentSubmission);
examRoutes.route("/student-stats").get(protect, getStudentStats);
examRoutes.route("/teacher-submissions").get(protect, getTeacherSubmissions);
examRoutes.route("/all-submissions").get(protect, getAllSubmissions);
examRoutes.route("/submissions/:id/score").put(protect, updateSubmissionScore);
examRoutes.route("/submissions/:id/status").put(protect, updateSubmissionStatus);
examRoutes.route("/submissions/:id/approve-cheating-logs").put(protect, approveCheatingLogs);
examRoutes.route("/submissions/:id/approve-failure-reason").put(protect, approveFailureReason);
examRoutes.route("/submit").post(protect, submitExam);

export default examRoutes;
