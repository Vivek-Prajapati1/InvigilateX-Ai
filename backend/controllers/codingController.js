import CodingQuestion from "../models/codingQuestionModel.js";
import Exam from "../models/examModel.js";
import Submission from "../models/submissionModel.js";
import asyncHandler from "express-async-handler";

// @desc    Submit a coding answer
// @route   POST /api/coding/submit
// @access  Private (Student)
const submitCodingAnswer = asyncHandler(async (req, res) => {
  const { examId, code, language } = req.body;

  if (!code || !language || !examId) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Find the exam by its examId (UUID)
  const exam = await Exam.findOne({ examId });

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Persist coding answer to the student's latest submission of this exam
  try {
    const studentId = req.user._id;

    // Find the most recent submission for this student and this exam
    const submission = await Submission.findOne({ examId: exam._id, studentId })
      .sort({ createdAt: -1 });

    if (!submission) {
      res.status(404);
      throw new Error("No MCQ submission found to attach coding answer. Please complete MCQ section first.");
    }

    submission.codingAnswer = { code, language };
    await submission.save();

    res.status(200).json({
      success: true,
      data: { code, language },
    });
  } catch (error) {
    console.error("Error saving coding answer to submission:", error);
    res.status(500);
    throw new Error(error.message || "Failed to save coding answer");
  }
});

// @desc    Create a new coding question
// @route   POST /api/coding/question
// @access  Private (Teacher)
const createCodingQuestion = asyncHandler(async (req, res) => {
  const { question, description, examId } = req.body;
  console.log("Received coding question data:", {
    question,
    description,
    examId,
  });

  if (!question || !description || !examId) {
    const missingFields = [];
    if (!question) missingFields.push("question");
    if (!description) missingFields.push("description");
    if (!examId) missingFields.push("examId");

    res.status(400);
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  try {
    // First check if the user has access to this exam
    const exam = await Exam.findOne({ examId: examId.toString() });
    
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }

    // Check if the user is authorized to create coding questions for this exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to create coding questions for this exam");
    }

    // Check if a question already exists for this exam
    console.log("createCodingQuestion - Checking for existing question with examId:", examId.toString());
    const existingQuestion = await CodingQuestion.findOne({
      examId: examId.toString(),
    });
    console.log("createCodingQuestion - Existing question check result:", existingQuestion);

    if (existingQuestion) {
      res.status(400);
      throw new Error(`A coding question already exists for exam: ${examId}`);
    }

    const newQuestion = await CodingQuestion.create({
      question,
      description,
      examId: examId.toString(), // Ensure examId is stored as a string
      teacher: req.user._id,
    });

    console.log("createCodingQuestion - Created new question with examId:", newQuestion.examId);

    res.status(201).json({
      success: true,
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error creating coding question:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.stack,
    });
  }
});

// @desc    Get all coding questions
// @route   GET /api/coding/questions
// @access  Private
const getCodingQuestions = asyncHandler(async (req, res) => {
  // For teachers, only show coding questions for exams they created
  let questions;
  
  if (req.user.role === 'teacher') {
    // Get exams created by this teacher
    const teacherExams = await Exam.find({ createdBy: req.user._id });
    const teacherExamIds = teacherExams.map(exam => exam.examId);
    
    // Get coding questions only for those exams
    questions = await CodingQuestion.find({ examId: { $in: teacherExamIds } })
      .select("-submittedAnswer") // Don't send other submissions
      .populate("teacher", "name email");
  } else {
    // For other roles (like admin), show all questions
    questions = await CodingQuestion.find()
      .select("-submittedAnswer") // Don't send other submissions
      .populate("teacher", "name email");
  }

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions,
  });
});

// @desc    Get a single coding question
// @route   GET /api/coding/questions/:id
// @access  Private
const getCodingQuestion = asyncHandler(async (req, res) => {
  const question = await CodingQuestion.findById(req.params.id).populate(
    "teacher",
    "name email"
  );

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  // For teachers, check if they own the exam this question belongs to
  if (req.user.role === 'teacher') {
    const exam = await Exam.findOne({ examId: question.examId });
    
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to view this coding question");
    }
  }

  res.status(200).json({
    success: true,
    data: question,
  });
});

// @desc    Get coding question for a specific exam
// @route   GET /api/coding/questions/exam/:examId
// @access  Private (Student)
const getExamCodingQuestion = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  console.log("getExamCodingQuestion - Received examId:", examId);
  console.log("getExamCodingQuestion - Type of examId:", typeof examId);

  if (!examId) {
    res.status(400);
    throw new Error("Exam ID is required");
  }

  // Find the exam by its examId (UUID) field
  const exam = await Exam.findOne({ examId });
  console.log("getExamCodingQuestion - Exam query result:", exam);

  if (!exam) {
    res.status(404);
    throw new Error(`No exam found with ID: ${examId}`);
  }

  // Check if the exam has coding questions
  let codingQuestions = [];
  
  // Handle both old format (single codingQuestion) and new format (codingQuestions array)
  if (exam.codingQuestions && exam.codingQuestions.length > 0) {
    codingQuestions = exam.codingQuestions;
  } else if (exam.codingQuestion && exam.codingQuestion.question) {
    // Backward compatibility - convert single question to array
    codingQuestions = [exam.codingQuestion];
  }

  if (codingQuestions.length === 0) {
    res.status(404);
    throw new Error(`No coding question found for exam: ${exam.examName || examId}`);
  }

  // For teachers, check if they own this exam
  if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view coding questions for this exam");
  }

  res.status(200).json({
    success: true,
    data: codingQuestions, // Return all coding questions as an array
  });
});

export {
  submitCodingAnswer,
  createCodingQuestion,
  getCodingQuestions,
  getCodingQuestion,
  getExamCodingQuestion,
};
