import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, ".env"),
  debug: process.env.NODE_ENV !== 'production'
});

console.log("MONGO_URL from .env:", process.env.MONGO_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";

// Database Connection
import connectDB from "./config/db.js";
connectDB();

// Routes
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { createQuestion } from "./controllers/quesController.js";
import { protect } from "./middleware/authMiddleware.js";

// App Setup
const app = express();
const port = process.env.PORT || 5001;

// Middleware
// Configure CORS to allow credentials from your frontend origin
// MUST be before other middleware to properly handle credentials
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Code Execution Endpoints
app.post("/run-python", (req, res) => {
  const { code } = req.body;
  fs.writeFileSync("script.py", code);
  
  exec("python script.py", (error, stdout, stderr) => {
    if (error) {
      console.error("Python execution error:", error);
      console.error("Python stderr:", stderr);
      return res.status(400).json({ error: stderr || error.message });
    }
    console.log("Python stdout:", stdout);
    res.json({ output: stdout });
  });
});

app.post("/run-javascript", (req, res) => {
  const { code } = req.body;
  fs.writeFileSync("script.js", code);
  
  exec("node script.js", (error, stdout, stderr) => {
    if (error) {
      console.error("JavaScript execution error:", error);
      console.error("JavaScript stderr:", stderr);
      return res.status(400).json({ error: stderr || error.message });
    }
    console.log("JavaScript stdout:", stdout);
    res.json({ output: stdout });
  });
});

app.post("/run-java", (req, res) => {
  const { code } = req.body;
  fs.writeFileSync("Main.java", code);
  
  exec("javac Main.java && java Main", (error, stdout, stderr) => {
    if (error) {
      console.error("Java compilation/execution error:", error);
      console.error("Java stderr:", stderr);
      return res.status(400).json({ error: stderr || error.message });
    }
    console.log("Java stdout:", stdout);
    res.json({ output: stdout });
  });
});

// API Routes
app.use("/api/users", userRoutes);

// Define specific question creation route directly in server.js to ensure precedence
console.log("Server.js: Attempting to register POST /api/exams/exam/questions route.");
app.post("/api/exams/exam/questions", protect, createQuestion);

app.use("/api/exams", (req, res, next) => {
  console.log(`Incoming request to /api/exams: ${req.method} ${req.url}`);
  next();
});
app.use("/api/exams", examRoutes);
app.use("/api/coding", codingRoutes);

// Static Files (Production)
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("<h1>API Server is Running</h1><p>Environment: " + process.env.NODE_ENV + "</p>");
  });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Server Start
app.listen(port, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});