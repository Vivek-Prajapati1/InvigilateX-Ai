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
const allowedOrigins = [
  'http://localhost:5173',
  'https://invigilate-x-ai.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
console.log("Registering /api/users routes...");
app.use("/api/users", userRoutes);

console.log("Registering /api/exams routes...");
app.use("/api/exams", examRoutes);

console.log("Registering /api/coding routes...");
app.use("/api/coding", codingRoutes);

console.log("All routes registered successfully!");

// Error Handling Middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

// Static Files (Production) - must be AFTER error handlers
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../../frontend/dist");
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // SPA fallback - serve index.html for non-API routes
  // This must be the LAST route
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("<h1>API Server is Running</h1><p>Environment: " + process.env.NODE_ENV + "</p>");
  });
}

// Server Start
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0'; // Important for Render deployment

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
});