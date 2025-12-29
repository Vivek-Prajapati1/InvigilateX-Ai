import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env config
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

// DB
import connectDB from "./config/db.js";
connectDB();

// Routes
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";

// Middleware
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// App
const app = express();
const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

// -------------------- CORS --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://invigilate-x-ai.vercel.app",
  "https://invigilatex-ai.onrender.com", // Render backend URL
  process.env.FRONTEND_URL, // Allow dynamic frontend URL from env
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      // Filter out undefined values
      const validOrigins = allowedOrigins.filter(o => o);
      if (validOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// -------------------- Body Parsers --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- Code Execution APIs --------------------
app.post("/run-python", (req, res) => {
  fs.writeFileSync("script.py", req.body.code);
  exec("python script.py", (error, stdout, stderr) => {
    if (error) return res.status(400).json({ error: stderr || error.message });
    res.json({ output: stdout });
  });
});

app.post("/run-javascript", (req, res) => {
  fs.writeFileSync("script.js", req.body.code);
  exec("node script.js", (error, stdout, stderr) => {
    if (error) return res.status(400).json({ error: stderr || error.message });
    res.json({ output: stdout });
  });
});

app.post("/run-java", (req, res) => {
  fs.writeFileSync("Main.java", req.body.code);
  exec("javac Main.java && java Main", (error, stdout, stderr) => {
    if (error) return res.status(400).json({ error: stderr || error.message });
    res.json({ output: stdout });
  });
});

// -------------------- API Routes --------------------
app.use("/api/users", userRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/coding", codingRoutes);

// -------------------- Production Frontend --------------------
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API Server is Running");
  });
}

// -------------------- Error Handlers --------------------
app.use(notFound);
app.use(errorHandler);

// -------------------- Start Server --------------------
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
});
