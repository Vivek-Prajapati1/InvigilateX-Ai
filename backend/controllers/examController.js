import asyncHandler from "express-async-handler";
import Exam from "./../models/examModel.js";
import Submission from "./../models/submissionModel.js";
import Question from "./../models/quesModel.js";
import CheatingLog from "./../models/cheatingLogModel.js";
import mongoose from 'mongoose';

// @desc Get all exams
// @route GET /api/exams
// @access Public
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find().populate('createdBy', 'name email');
  res.status(200).json(exams);
});

// @desc Get exams created by the current user (for teachers)
// @route GET /api/exams/my-exams
// @access Private (teacher)
const getMyExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id }).populate('createdBy', 'name email');
  res.status(200).json(exams);
});

// @desc Get a single exam by ID
// @route GET /api/exams/exam/:examId
// @access Private (teacher/admin)
const getExamById = asyncHandler(async (req, res) => {
  const paramExamId = req.params.examId;
  let exam = null;

  // First, try to find by MongoDB _id if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(paramExamId)) {
    exam = await Exam.findById(paramExamId);
  }

  // If not found by _id, or if the param was not a valid ObjectId, try to find by the UUID examId field
  if (!exam) {
    exam = await Exam.findOne({ examId: paramExamId });
  }

  if (exam) {
    // For teachers, check if they own this exam (unless they're an admin)
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to view this exam");
    }
    
    // Ensure backward compatibility - convert old codingQuestion to new codingQuestions array
    if (!exam.codingQuestions && exam.codingQuestion) {
      exam.codingQuestions = [exam.codingQuestion];
    }
    
    // Ensure codingQuestions exists, even if empty, for frontend compatibility
    if (!exam.codingQuestions) {
      exam.codingQuestions = [{ question: '', description: '' }]; // Initialize with one empty question
    }
    
    console.log("getExamById - exam.codingQuestions sent to frontend:", exam.codingQuestions);
    res.status(200).json(exam);
  } else {
    res.status(404);
    throw new Error("Exam not found");
  }
});

// @desc Create a new exam
// @route POST /api/exams
// @access Private (admin)
const createExam = asyncHandler(async (req, res) => {
  console.log('=== CREATE EXAM REQUEST ===');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  
  const { examName, totalQuestions, duration, maxAttempts, liveDate, deadDate, codingQuestions, codingQuestion } = req.body;
  
  console.log('Creating exam with data:', { examName, totalQuestions, duration, maxAttempts, liveDate, deadDate, codingQuestions, codingQuestion });

  // Handle backward compatibility - convert single codingQuestion to array
  let finalCodingQuestions = codingQuestions;
  if (!codingQuestions && codingQuestion) {
    finalCodingQuestions = [codingQuestion];
  }
  
  console.log('Final coding questions to save:', finalCodingQuestions);

  const exam = new Exam({
    examName,
    totalQuestions,
    duration,
    maxAttempts: maxAttempts || 1, // Default to 1 if not provided
    liveDate,
    deadDate,
    codingQuestions: finalCodingQuestions,
    createdBy: req.user._id, // Add the user who created the exam
  });

  const createdExam = await exam.save();
  console.log('Exam created successfully:', createdExam._id);

  if (createdExam) {
    res.status(201).json(createdExam);
  } else {
    res.status(400);
    throw new Error("Invalid Exam Data");
  }
});

// @desc Update an exam
// @route PUT /api/exams/exam/:examId
// @access Private (teacher/admin)
const updateExam = asyncHandler(async (req, res) => {
  console.log('=== UPDATE EXAM REQUEST ===');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  
  const { examName, totalQuestions, duration, maxAttempts, liveDate, deadDate, codingQuestions, codingQuestion } = req.body;
  const paramExamId = req.params.examId;
  let exam = null;

  console.log('Attempting to update exam with ID:', paramExamId);

  // First, try to find by MongoDB _id if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(paramExamId)) {
    console.log('Param is a valid ObjectId, trying findById...');
    exam = await Exam.findById(paramExamId);
    if (exam) console.log('Found exam by _id:', exam._id);
  }

  // If not found by _id, or if the param was not a valid ObjectId, try to find by the UUID examId field
  if (!exam) {
    console.log('Not found by _id, or not a valid ObjectId. Trying findOne by examId (UUID)...');
    exam = await Exam.findOne({ examId: paramExamId });
    if (exam) console.log('Found exam by examId (UUID):', exam.examId);
  }

  if (exam) {
    // Check if the user is authorized to update this exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this exam");
    }
    
    console.log('Updating exam with data:', { examName, totalQuestions, duration, maxAttempts, liveDate, deadDate, codingQuestions, codingQuestion });
    
    exam.examName = examName || exam.examName;
    exam.totalQuestions = totalQuestions || exam.totalQuestions;
    exam.duration = duration || exam.duration;
    exam.maxAttempts = maxAttempts !== undefined ? maxAttempts : exam.maxAttempts;
    exam.liveDate = liveDate || exam.liveDate;
    exam.deadDate = deadDate || exam.deadDate;
    
    // Handle backward compatibility - prefer codingQuestions array over single codingQuestion
    if (codingQuestions) {
      console.log('Updating with codingQuestions array:', codingQuestions);
      exam.codingQuestions = codingQuestions;
    } else if (codingQuestion) {
      console.log('Updating with single codingQuestion:', codingQuestion);
      exam.codingQuestions = [codingQuestion];
    }

    const updatedExam = await exam.save();
    console.log('Exam updated successfully:', updatedExam._id);
    console.log('Saved coding questions:', updatedExam.codingQuestions);
    res.status(200).json(updatedExam);
  } else {
    console.log('Exam not found for update with ID:', paramExamId);
    res.status(404);
    throw new Error("Exam not found");
  }
});

const DeleteExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  // First find the exam to check ownership
  const exam = await Exam.findOne({ examId: examId });
  
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  
  // Check if the user is authorized to delete this exam
  if (exam.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this exam");
  }
  
  // Delete all submissions associated with this exam first
  const examObjectId = exam._id;
  const deletedSubmissions = await Submission.deleteMany({ examId: examObjectId });
  console.log(`Deleted ${deletedSubmissions.deletedCount} submissions for exam ${examId}`);
  
  // Delete all questions associated with this exam
  const deletedQuestions = await Question.deleteMany({ examId: examId });
  console.log(`Deleted ${deletedQuestions.deletedCount} questions for exam ${examId}`);
  
  // Delete all cheating logs associated with this exam
  const deletedCheatingLogs = await CheatingLog.deleteMany({ examId: examId });
  console.log(`Deleted ${deletedCheatingLogs.deletedCount} cheating logs for exam ${examId}`);
  
  // Now delete the exam
  const deletedExam = await Exam.findOneAndDelete({ examId: examId });
  console.log("deleted exam", deletedExam);
  
  res.status(200).json({
    deletedExam,
    deletedSubmissions: deletedSubmissions.deletedCount,
    deletedQuestions: deletedQuestions.deletedCount,
    deletedCheatingLogs: deletedCheatingLogs.deletedCount
  });
});
  
// @desc Get exam results by examId
// @route GET /api/exams/results/:examId
// @access Private (teacher/student)
const getExamResults = asyncHandler(async (req, res) => {
  console.log("getExamResults controller reached.");
  const { examId: paramExamId } = req.params;
  
  console.log('Fetching results for exam ID:', paramExamId);

  try {
    let exam = null;
    // First, try to find the exam by MongoDB _id if paramExamId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(paramExamId)) {
      exam = await Exam.findById(paramExamId);
      console.log('Found exam by ObjectId:', exam ? exam._id : 'Not found');
    }

    // If not found by _id, or if param was not a valid ObjectId, try to find by UUID examId field
    if (!exam) {
      exam = await Exam.findOne({ examId: paramExamId });
      console.log('Found exam by UUID:', exam ? exam.examId : 'Not found');
    }

    if (!exam) {
      console.log('No exam found with ID:', paramExamId);
      res.status(404);
      throw new Error("Exam not found for results");
    }

    // Check if the requesting user is the teacher who created this exam
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
      console.log('Teacher not authorized to view results for this exam');
      res.status(403);
      throw new Error("Not authorized to view results for this exam");
    }

    // Use the found exam's MongoDB _id to query submissions
    const submissions = await Submission.find({ examId: exam._id })
      .populate('studentId', 'name email') // Populate student details
      .sort({ createdAt: -1 }); // Sort by submission date, newest first

    console.log(`Found ${submissions.length} submissions for exam ID: ${exam._id}`);

    if (!submissions || submissions.length === 0) {
      console.log('No submissions found for exam:', exam._id);
      return res.status(200).json([]); // Return empty array if no results found
    }

    // Format the response to include exam details
    const formattedResults = submissions.map(submission => ({
      _id: submission._id,
      studentId: submission.studentId,
      score: submission.score,
      answers: submission.answers,
      createdAt: submission.createdAt,
      examDetails: {
        examName: exam.examName,
        totalQuestions: exam.totalQuestions,
        duration: exam.duration
      }
    }));

    console.log('Returning formatted results:', formattedResults.length);
    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500);
    throw new Error('Failed to fetch exam results');
  }
});

// @desc Submit an exam (save student answers and calculate score)
// @route POST /api/exams/submit
// @access Private (student)
const submitExam = asyncHandler(async (req, res) => {
  try {
    const { examId, answers, status: incomingStatus, reason: incomingReason } = req.body;
    const studentId = req.user._id; // Student ID from protected middleware

    // Find the exam by its examId (UUID) to get its MongoDB _id
    const exam = await Exam.findOne({ examId });

    if (!exam) {
      res.status(404);
      throw new Error("Exam not found for submission");
    }

    // Enforce exam availability window for students at submission time
    const now = new Date();
    const startsAt = new Date(exam.liveDate);
    const endsAt = new Date(exam.deadDate);
    if (Number.isFinite(startsAt.getTime()) && now < startsAt) {
      res.status(403);
      throw new Error("Exam has not started yet");
    }
    if (Number.isFinite(endsAt.getTime()) && now > endsAt) {
      res.status(403);
      throw new Error("Exam has expired");
    }

    // Use the found exam's MongoDB _id for the submission
    const examObjectId = exam._id; // This will be a Mongoose ObjectId type

    console.log('Submitting Exam - received data:');
    console.log('Original Exam ID (UUID):', examId);
    console.log('Resolved Exam ObjectId:', examObjectId);
    console.log('Student ID:', studentId);

    // Check current attempts for this student and exam
    const existingSubmissions = await Submission.find({
      examId: examObjectId,
      studentId: studentId
    }).sort({ attemptNumber: -1 });

    const currentAttemptCount = existingSubmissions.length;
    const maxAttempts = exam.maxAttempts || 1;

    // Check if student has exceeded maximum attempts
    if (currentAttemptCount >= maxAttempts) {
      res.status(403);
      throw new Error(`You have already used all ${maxAttempts} attempt(s) for this exam`);
    }

    const nextAttemptNumber = currentAttemptCount + 1;

    // Fetch all questions for this exam using the UUID examId
    const questions = await Question.find({ examId: examId });
    const questionMap = new Map();
    questions.forEach(q => {
      questionMap.set(q._id.toString(), q);
    });

    let score = 0;
    const processedAnswers = answers.map(answer => {
      const question = questionMap.get(answer.questionId); // Ensure questionId is string for map lookup
      let isCorrect = false;

      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && correctOption._id.toString() === answer.selectedOption) {
          isCorrect = true;
          score += question.ansmarks > 0 ? question.ansmarks : 10; // Add question marks or default 10
        }
      }

      return {
        ...answer,
        isCorrect,
      };
    });
    console.log('Processed Answers:', processedAnswers);

    const submission = new Submission({
      examId: examObjectId,
      studentId,
      attemptNumber: nextAttemptNumber,
      score,
      answers: processedAnswers, // Use processed answers
      status: (incomingStatus && ['submitted','passed','failed','auto_failed'].includes(incomingStatus)) ? incomingStatus : 'submitted',
      reason: incomingReason || undefined,
    });

    const savedSubmission = await submission.save();
    console.log('Submission saved successfully:', savedSubmission);
    res.status(201).json(savedSubmission);
  } catch (error) {
    console.error('Full error in submitExam:', error); // More detailed error logging
    res.status(500); // Change to 500 for unhandled errors
    throw new Error(`Failed to submit exam: ${error.message}`);
  }
});

// @desc Get a single student's exam result for a specific exam
// @route GET /api/exams/results/student/:examId/:studentId
// @access Private (teacher/student)
const getStudentExamResult = asyncHandler(async (req, res) => {
  console.log("***Entering getStudentExamResult controller***");
  console.log("getStudentExamResult controller reached.");
  const { examId: paramExamId, studentId: paramStudentId } = req.params;
  console.log('Received paramExamId:', paramExamId);
  console.log('Received paramStudentId:', paramStudentId);
  console.log('ParamExamId type:', typeof paramExamId);
  console.log('ParamStudentId type:', typeof paramStudentId);

  try {
    // Validate if paramStudentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(paramStudentId)) {
      console.log('Invalid student ID format:', paramStudentId);
      res.status(400);
      throw new Error("Invalid Student ID format");
    }

    // Find the exam by its examId (UUID or _id)
    let exam = null;
    console.log('Checking if paramExamId is valid ObjectId...');
    if (mongoose.Types.ObjectId.isValid(paramExamId)) {
      console.log('paramExamId is valid ObjectId, searching by _id...');
      exam = await Exam.findById(paramExamId);
      console.log('Found exam by _id:', exam ? exam._id : 'Not found');
    }
    if (!exam) {
      console.log('Exam not found by _id, searching by UUID examId field...');
      exam = await Exam.findOne({ examId: paramExamId });
      console.log('Found exam by UUID:', exam ? exam.examId : 'Not found');
    }

    if (!exam) {
      console.log('Exam not found with ID:', paramExamId);
      res.status(404);
      throw new Error("Exam not found for results");
    }
    console.log('Found exam for results (MongoDB _id):', exam._id);
    console.log('Exam UUID:', exam.examId);

    // Find the specific submission for the student and exam
    const submission = await Submission.findOne({ 
      examId: exam._id, // Use the resolved MongoDB ObjectId for examId
      studentId: paramStudentId 
    })
      .populate('studentId', 'name email') // Populate student details
      .populate({
        path: 'answers.questionId',
        select: 'question options',
      }); // Populate question details for rendering text and correct option

    console.log('Submission query parameters:', { examId: exam._id, studentId: paramStudentId });
    console.log('Found submission:', submission ? submission._id : 'No submission found');

    if (!submission) {
      res.status(404);
      throw new Error("Submission not found for this student and exam");
    }

    // Include exam coding questions in the response so the frontend can show them
    const response = submission.toObject();
    // Normalize coding questions: prefer array, fallback to single legacy field
    let codingQs = [];
    if (Array.isArray(exam.codingQuestions) && exam.codingQuestions.length > 0) {
      codingQs = exam.codingQuestions.map(q => ({ question: q.question, description: q.description, duration: q.duration }));
    } else if (exam.codingQuestion && (exam.codingQuestion.question || exam.codingQuestion.description)) {
      codingQs = [{
        question: exam.codingQuestion.question || '',
        description: exam.codingQuestion.description || '',
        duration: exam.codingQuestion.duration || 0,
      }];
    }
    response.examCodingQuestions = codingQs;
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching student exam result:', error);
    res.status(500);
    throw new Error(`Failed to fetch student exam result: ${error.message}`);
  }
});

// @desc Get the last submitted exam for a specific student
// @route GET /api/exams/last-submission
// @access Private (student)
const getLastStudentSubmission = asyncHandler(async (req, res) => {
  console.log("getLastStudentSubmission controller reached.");
  const studentId = req.user._id; // Student ID from protected middleware

  if (!studentId) {
    res.status(401);
    throw new Error("Not Authorized, student ID missing");
  }

  try {
    const lastSubmission = await Submission.findOne({ studentId })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .select('examId') // Only retrieve the examId
      .lean(); // Return plain JavaScript objects

    console.log('getLastStudentSubmission - Found last submission:', lastSubmission);

    if (!lastSubmission) {
      return res.status(200).json({ message: "No submissions found for this student." });
    }

    res.status(200).json({ examId: lastSubmission.examId });
  } catch (error) {
    console.error('Error fetching last student submission:', error);
    res.status(500);
    throw new Error(`Failed to fetch last student submission: ${error.message}`);
  }
});

// @desc Get student's completed exams count and details
// @route GET /api/exams/student-stats
// @access Private (student)
const getStudentStats = asyncHandler(async (req, res) => {
  console.log('getStudentStats controller reached.');
  const studentId = req.user._id; // Student ID from protected middleware

  if (!studentId) {
    res.status(401);
    throw new Error("Not Authorized, student ID missing");
  }

  try {
    // Get all submissions for this student
    const submissions = await Submission.find({ studentId })
      .populate('examId', 'examName totalQuestions')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const completedExams = submissions.length;
    const totalScore = submissions.reduce((sum, submission) => sum + submission.score, 0);
    const avgScore = completedExams > 0 ? (totalScore / completedExams).toFixed(1) : 0;

    // Get recent submissions for activity (skip missing exam refs)
    const recentSubmissions = submissions
      .filter(submission => !!submission.examId)
      .slice(0, 5)
      .map(submission => ({
        examId: submission.examId._id,
        examName: submission.examId.examName,
        score: submission.score,
        totalQuestions: submission.examId.totalQuestions,
        submittedAt: submission.createdAt,
        codingSubmitted: !!(submission.codingAnswer && submission.codingAnswer.code),
        codingLanguage: submission.codingAnswer?.language || null,
        status: submission.status || 'submitted',
        reason: submission.reason || null,
      }));

    res.status(200).json({
      completedExams,
      avgScore: parseFloat(avgScore),
      totalScore,
      recentSubmissions,
      allSubmissions: submissions
        .filter(submission => !!submission.examId)
        .map(submission => ({
          examId: submission.examId._id,
          examName: submission.examId.examName,
          score: submission.score,
          totalQuestions: submission.examId.totalQuestions,
          submittedAt: submission.createdAt,
          codingSubmitted: !!(submission.codingAnswer && submission.codingAnswer.code),
          codingLanguage: submission.codingAnswer?.language || null,
          status: submission.status || 'submitted',
          reason: submission.reason || null,
        })),
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500);
    throw new Error(`Failed to fetch student stats: ${error.message}`);
  }
});

// @desc Get all submissions for teacher's exams
// @route GET /api/exams/teacher-submissions
// @access Private (teacher)
const getTeacherSubmissions = asyncHandler(async (req, res) => {
  console.log('getTeacherSubmissions controller reached.');
  const teacherId = req.user._id; // Teacher ID from protected middleware

  if (!teacherId) {
    res.status(401);
    throw new Error("Not Authorized, teacher ID missing");
  }

  try {
    // Get all exams created by this teacher
    const teacherExams = await Exam.find({ createdBy: teacherId });
    const examIds = teacherExams.map(exam => exam._id);

    // Get all submissions for these exams
    const submissions = await Submission.find({ examId: { $in: examIds } })
      .populate('studentId', 'name email')
      .populate('examId', 'examName totalQuestions')
      .populate({ path: 'answers.questionId', select: 'question options' })
      .sort({ createdAt: -1 });

    // Format the response
    const formattedSubmissions = submissions.map(submission => ({
      submissionId: submission._id,
      answers: submission.answers,
      studentId: submission.studentId._id,
      studentName: submission.studentId.name,
      studentEmail: submission.studentId.email,
      examName: submission.examId.examName,
      score: submission.score,
      totalQuestions: submission.examId.totalQuestions,
      submittedAt: submission.createdAt,
      examId: submission.examId._id,
      hasCodingAnswer: !!(submission.codingAnswer && submission.codingAnswer.code),
      codingLanguage: submission.codingAnswer?.language || null,
      cheatingLogsApproved: submission.cheatingLogsApproved || false,
      cheatingLogsApprovedBy: submission.cheatingLogsApprovedBy,
      cheatingLogsApprovedAt: submission.cheatingLogsApprovedAt,
      failureReasonApproved: submission.failureReasonApproved || false,
      failureReasonApprovedBy: submission.failureReasonApprovedBy,
      failureReasonApprovedAt: submission.failureReasonApprovedAt,
      status: submission.status,
      reason: submission.reason
    }));

    res.status(200).json({
      totalSubmissions: formattedSubmissions.length,
      submissions: formattedSubmissions
    });
  } catch (error) {
    console.error('Error fetching teacher submissions:', error);
    res.status(500);
    throw new Error(`Failed to fetch teacher submissions: ${error.message}`);
  }
});

// @desc Get all submissions across all exams (no teacher filter)
// @route GET /api/exams/all-submissions
// @access Private (teacher/admin)
const getAllSubmissions = asyncHandler(async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate('studentId', 'name email')
      .populate('examId', 'examName totalQuestions')
      .populate({ path: 'answers.questionId', select: 'question options' })
      .sort({ createdAt: -1 });

    const formattedSubmissions = submissions.map(submission => ({
      submissionId: submission._id,
      studentId: submission.studentId?._id,
      studentName: submission.studentId?.name,
      studentEmail: submission.studentId?.email,
      examName: submission.examId?.examName,
      score: submission.score,
      totalQuestions: submission.examId?.totalQuestions,
      submittedAt: submission.createdAt,
      examId: submission.examId?._id,
      answers: submission.answers,
    }));

    res.status(200).json({
      totalSubmissions: formattedSubmissions.length,
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    res.status(500);
    throw new Error(`Failed to fetch all submissions: ${error.message}`);
  }
});

// @desc Update a submission's score (teacher/admin)
// @route PUT /api/exams/submissions/:id/score
// @access Private (teacher/admin)
const updateSubmissionScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  if (typeof score !== 'number' || score < 0) {
    res.status(400);
    throw new Error('Invalid score');
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  submission.score = score;
  await submission.save();
  res.status(200).json({ success: true, submission });
});

// @desc Update a submission's status and reason (teacher/admin or system)
// @route PUT /api/exams/submissions/:id/status
// @access Private
const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const allowed = ['submitted', 'passed', 'failed', 'auto_failed'];
  if (status && !allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  if (status) submission.status = status;
  if (reason !== undefined) submission.reason = reason;

  await submission.save();
  res.status(200).json({ success: true, submission });
});

// @desc Approve cheating logs for a submission (teacher only)
// @route PUT /api/exams/submissions/:id/approve-cheating-logs
// @access Private (teacher/admin)
const approveCheatingLogs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body; // true or false

  // Only teachers can approve cheating logs
  if (req.user.role !== 'teacher') {
    res.status(403);
    throw new Error('Only teachers can approve cheating logs');
  }

  const submission = await Submission.findById(id).populate('studentId', 'name email');
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Update the approval status
  submission.cheatingLogsApproved = approve;
  if (approve) {
    submission.cheatingLogsApprovedBy = req.user._id;
    submission.cheatingLogsApprovedAt = new Date();
  } else {
    submission.cheatingLogsApprovedBy = undefined;
    submission.cheatingLogsApprovedAt = undefined;
  }

  await submission.save();
  
  res.status(200).json({ 
    success: true, 
    message: approve ? 'Cheating logs approved for student' : 'Cheating logs approval revoked',
    submission 
  });
});

// @desc Approve failure reason display for a submission (teacher only)
// @route PUT /api/exams/submissions/:id/approve-failure-reason
// @access Private (teacher/admin)
const approveFailureReason = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body; // true or false

  // Only teachers can approve failure reason display
  if (req.user.role !== 'teacher') {
    res.status(403);
    throw new Error('Only teachers can approve failure reason display');
  }

  const submission = await Submission.findById(id).populate('studentId', 'name email');
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Update the approval status
  submission.failureReasonApproved = approve;
  if (approve) {
    submission.failureReasonApprovedBy = req.user._id;
    submission.failureReasonApprovedAt = new Date();
  } else {
    submission.failureReasonApprovedBy = undefined;
    submission.failureReasonApprovedAt = undefined;
  }

  await submission.save();
  
  res.status(200).json({ 
    success: true, 
    message: approve ? 'Failure reason approved for student' : 'Failure reason approval revoked',
    submission 
  });
});

// Check exam attempts for a student
const checkExamAttempts = asyncHandler(async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    // Find the exam
    const exam = await Exam.findOne({ examId });
    if (!exam) {
      res.status(404);
      throw new Error("Exam not found");
    }

    // Get existing submissions
    const existingSubmissions = await Submission.find({
      examId: exam._id,
      studentId: studentId
    }).sort({ attemptNumber: -1 });

    const currentAttemptCount = existingSubmissions.length;
    const maxAttempts = exam.maxAttempts || 1;
    const remainingAttempts = maxAttempts - currentAttemptCount;
    const canTakeExam = remainingAttempts > 0;

    res.status(200).json({
      canTakeExam,
      currentAttemptCount,
      maxAttempts,
      remainingAttempts,
      lastSubmission: existingSubmissions[0] || null
    });
  } catch (error) {
    console.error('Error checking exam attempts:', error);
    res.status(500);
    throw new Error('Failed to check exam attempts');
  }
});

export { getExams, getMyExams, getExamById, createExam, updateExam, DeleteExamById, getExamResults, submitExam, getStudentExamResult, getLastStudentSubmission, getStudentStats, getTeacherSubmissions, getAllSubmissions, updateSubmissionScore, updateSubmissionStatus, approveCheatingLogs, approveFailureReason, checkExamAttempts };
