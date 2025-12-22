import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const examSchema = mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    liveDate: {
      type: Date,
      required: true,
    },
    deadDate: {
      type: Date,
      required: true,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 10,
    },
    codingQuestion: {
      question: {
        type: String,
      },
      description: {
        type: String,
      },
      duration: {
        type: Number,
        default: 30, // Default 30 minutes
      },
    },
    codingQuestions: [{
      question: {
        type: String,
      },
      description: {
        type: String,
      },
      duration: {
        type: Number,
        default: 30, // Default 30 minutes
        min: 1,
        max: 180, // Max 3 hours
      },
    }],
    // Define examId field with UUID generation
    examId: {
      type: String,
      default: uuidv4, // Generate a new UUID for each document
      unique: true, // Ensure uniqueness of UUIDs
    },
    // Track who created the exam
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
