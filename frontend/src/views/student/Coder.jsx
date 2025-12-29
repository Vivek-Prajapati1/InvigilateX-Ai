import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import WebCam from "../student/Components/WebCam";
import {
  Button,
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Avatar,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Container,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  Code as CodeIcon,
  VideoCall as VideoCallIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Assignment as AssignmentIcon,
  Terminal as TerminalIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Timer as TimerIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  DragIndicator as DragIndicatorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSaveCheatingLogMutation } from "src/slices/cheatingLogApiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { useCheatingLog } from "src/context/CheatingLogContext";
import swal from "sweetalert";
import NumberOfQuestions from "./Components/NumberOfQuestions";

export default function Coder() {
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]); // Array to store all questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question
  const [questionId, setQuestionId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedCodes, setSavedCodes] = useState({}); // Store code for each question
  const [codeStats, setCodeStats] = useState({
    lines: 0,
    characters: 0,
    runs: 0,
    lastRunTime: null,
  });
  const [sessionStats, setSessionStats] = useState({
    startTime: new Date(),
    keystrokes: 0,
    focusTime: 0,
  });
  const [progressValue, setProgressValue] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null); // Time remaining for current question in seconds
  const [questionStartTime, setQuestionStartTime] = useState(null); // When current question was started
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [questionTimers, setQuestionTimers] = useState({}); // Store remaining time for each question
  const [questionStates, setQuestionStates] = useState({}); // Track if question is completed
  
  // Webcam state variables
  const [isWebcamVisible, setIsWebcamVisible] = useState(true);
  const [webcamPosition, setWebcamPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { examId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    setShowContent(true);
    // Simulate progress for visual effect
    const timer = setInterval(() => {
      setProgressValue((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 20;
      });
    }, 200);

    // Update code statistics
    const updateCodeStats = () => {
      setCodeStats((prev) => ({
        ...prev,
        lines: code.split("\n").length,
        characters: code.length,
      }));
    };

    updateCodeStats();

    return () => clearInterval(timer);
  }, [code]);

  // Auto-submit watcher based on total violations for coding page
  useEffect(() => {
    const totalViolations =
      (cheatingLog.noFaceCount || 0) +
      (cheatingLog.multipleFaceCount || 0) +
      (cheatingLog.cellPhoneCount || 0) +
      (cheatingLog.prohibitedObjectCount || 0);

    if (autoSubmitted) return;

    if (totalViolations > 0 && totalViolations <= 5 && !hasShownWarning) {
      setHasShownWarning(true);
      swal("Please focus on your exam.", { icon: "warning" });
    } else if (totalViolations > 5 && totalViolations < 10 && !hasShownFinalWarning) {
      setHasShownFinalWarning(true);
      swal("Final warning: If you cross 10 violations, your exam will be auto-submitted.", { icon: "warning" });
    } else if (totalViolations >= 10) {
      (async () => {
        try {
          setAutoSubmitted(true);

          // Persist coding answer if available (optional)
          if (code && language && examId) {
            await axios.post(
              "/api/coding/submit",
              { code, language, examId },
              { withCredentials: true }
            );
          }

          // Save cheating log with reason
          const updatedLog = {
            ...cheatingLog,
            username: userInfo.name,
            email: userInfo.email,
            examId: examId,
            noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
            multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
            cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
            prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
            screenshots: cheatingLog.screenshots || [],
            reason: "Auto-submitted due to 10+ violations of exam rules.",
          };

          await saveCheatingLogMutation(updatedLog).unwrap();

          swal("Exam auto-submitted due to excessive cheating.", { icon: "error" });
          navigate("/success");
        } catch (err) {
          console.error("Auto-submit (coding) failed:", err);
          navigate("/success");
        }
      })();
    }
  }, [cheatingLog, examId, code, language, saveCheatingLogMutation, userInfo, hasShownWarning, hasShownFinalWarning, autoSubmitted, navigate]);

  // Enhanced code change handler
  const handleCodeChange = (value) => {
    setCode(value);
    setSessionStats((prev) => ({
      ...prev,
      keystrokes: prev.keystrokes + 1,
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case "javascript":
        return "🚀";
      case "python":
        return "🐍";
      case "java":
        return "☕";
      default:
        return "💻";
    }
  };

  const getDifficultyColor = () => {
    if (!question) return "primary";
    return "warning"; // You can add difficulty logic here
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString();
  };

  // Webcam control functions
  const toggleWebcamVisibility = () => {
    setIsWebcamVisible(!isWebcamVisible);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to window bounds
      const maxX = window.innerWidth - 200; // webcam width
      const maxY = window.innerHeight - 150; // webcam height
      
      setWebcamPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (userInfo) {
      updateCheatingLog((prevLog) => ({
        ...prevLog,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  // Fetch coding question when component mounts
  useEffect(() => {
    const fetchCodingQuestion = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/coding/question/exam/${examId}`, {
          withCredentials: true,
        });
        if (
          response.data.success &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          // Store all questions
          setQuestions(response.data.data);

          // Set the first question as current
          const firstQuestion = response.data.data[0];
          setQuestionId(firstQuestion._id || examId);
          setQuestion(firstQuestion);

          // Initialize saved codes for all questions
          const initialCodes = {};
          response.data.data.forEach((q, index) => {
            initialCodes[index] = q.description
              ? `// ${q.description}\n\n// Write your code here...`
              : "// Write your code here...";
          });
          setSavedCodes(initialCodes);

          // Set initial code for first question
          setCode(initialCodes[0]);
        } else {
          toast.error(
            "No coding question found for this exam. Please contact your teacher."
          );
        }
      } catch (error) {
        console.error("Error fetching coding question:", error);
        toast.error(
          error?.response?.data?.message || "Failed to load coding question"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) {
      fetchCodingQuestion();
    }
  }, [examId]);

  // Navigation functions for multiple questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current code and timer state before switching
      setSavedCodes((prev) => ({
        ...prev,
        [currentQuestionIndex]: code,
      }));

      // Pause current timer
      pauseTimer(currentQuestionIndex);

      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setQuestion(questions[nextIndex]);
      setCode(savedCodes[nextIndex] || "// Write your code here...");
      setOutput(""); // Clear output when switching questions

      // Start timer for next question (will use saved time if available)
      if (questions[nextIndex] && questions[nextIndex].duration) {
        startTimer(questions[nextIndex].duration, nextIndex);
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current code and timer state before switching
      setSavedCodes((prev) => ({
        ...prev,
        [currentQuestionIndex]: code,
      }));

      // Pause current timer
      pauseTimer(currentQuestionIndex);

      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setQuestion(questions[prevIndex]);
      setCode(savedCodes[prevIndex] || "// Write your code here...");
      setOutput(""); // Clear output when switching questions

      // Start timer for previous question (will use saved time if available)
      if (questions[prevIndex] && questions[prevIndex].duration) {
        startTimer(questions[prevIndex].duration, prevIndex);
      }
    }
  };

  // Update saved code when user types
  useEffect(() => {
    setSavedCodes((prev) => ({
      ...prev,
      [currentQuestionIndex]: code,
    }));
  }, [code, currentQuestionIndex]);

  // Timer functionality
  const startTimer = (
    durationInMinutes,
    questionIndex = currentQuestionIndex
  ) => {
    // Check if we have a saved timer state for this question
    const savedTime = questionTimers[questionIndex];
    const durationInSeconds =
      savedTime !== undefined ? savedTime : durationInMinutes * 60;

    setTimeRemaining(durationInSeconds);
    setQuestionStartTime(new Date());
    setIsTimerActive(true);
  };

  const pauseTimer = (questionIndex = currentQuestionIndex) => {
    setIsTimerActive(false);
    // Save the current remaining time for this question
    setQuestionTimers((prev) => ({
      ...prev,
      [questionIndex]: timeRemaining,
    }));
  };

  const completeQuestion = (questionIndex = currentQuestionIndex) => {
    // Mark question as completed and stop its timer
    setQuestionStates((prev) => ({
      ...prev,
      [questionIndex]: "completed",
    }));
    pauseTimer(questionIndex);
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds === null) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (
      isTimerActive &&
      timeRemaining > 0 &&
      questionStates[currentQuestionIndex] !== "completed"
    ) {
      interval = setInterval(() => {
        setTimeRemaining((timeRemaining) => {
          if (timeRemaining <= 1) {
            setIsTimerActive(false);
            toast.warning(
              `Time's up for Question ${currentQuestionIndex + 1}!`
            );
            // Save the timer state as expired
            setQuestionTimers((prev) => ({
              ...prev,
              [currentQuestionIndex]: 0,
            }));
            return 0;
          }
          const newTime = timeRemaining - 1;
          // Continuously save the current time
          setQuestionTimers((prev) => ({
            ...prev,
            [currentQuestionIndex]: newTime,
          }));
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining, currentQuestionIndex, questionStates]);

  // Start timer when question changes or component mounts
  useEffect(() => {
    if (
      question &&
      question.duration &&
      questionStates[currentQuestionIndex] !== "completed"
    ) {
      // Check if we have a saved timer for this question
      const savedTime = questionTimers[currentQuestionIndex];
      if (savedTime !== undefined && savedTime > 0) {
        // Resume from saved time
        setTimeRemaining(savedTime);
        setIsTimerActive(true);
      } else if (savedTime === undefined) {
        // First time visiting this question, start fresh timer
        startTimer(question.duration, currentQuestionIndex);
      } else {
        // Timer has expired
        setTimeRemaining(0);
        setIsTimerActive(false);
      }
    } else if (questionStates[currentQuestionIndex] === "completed") {
      // Question is completed, don't run timer
      setTimeRemaining(questionTimers[currentQuestionIndex] || 0);
      setIsTimerActive(false);
    }
  }, [question, currentQuestionIndex]);

  const runCode = async () => {
    setIsRunning(true);
    setCurrentStep(2); // Test Solution step
    setCodeStats((prev) => ({
      ...prev,
      runs: prev.runs + 1,
      lastRunTime: new Date(),
    }));
    setOutput("⚡ Running code...");

    let apiUrl;
    switch (language) {
      case "python":
        apiUrl = "http://localhost:5001/run-python";
        break;
      case "java":
        apiUrl = "http://localhost:5001/run-java";
        break;
      case "javascript":
        apiUrl = "http://localhost:5001/run-javascript";
        break;
      default:
        setIsRunning(false);
        return;
    }

    try {
      const response = await axios.post(apiUrl, { code });
      console.log("API Response:", response.data);
      setOutput(`✅ Execution completed:\n\n${response.data.output}`);
      toast.success("Code executed successfully!");

      // Mark question as completed when code runs successfully
      completeQuestion(currentQuestionIndex);
    } catch (error) {
      console.error("Error running code:", error);
      setOutput(
        `❌ Error running code:\n\n${
          error.response?.data?.error || error.message
        }`
      );
      toast.error("Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log("Starting coding submission for examId:", examId);

    if (!examId) {
      toast.error("Exam ID not loaded properly. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const codeSubmissionData = {
        code,
        language,
        examId,
      };

      console.log("Submitting coding code with data:", codeSubmissionData);

      const response = await axios.post(
        "/api/coding/submit",
        codeSubmissionData,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        try {
          const updatedLog = {
            ...cheatingLog,
            username: userInfo.name,
            email: userInfo.email,
            examId: examId,
            noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
            multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
            cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
            prohibitedObjectCount:
              parseInt(cheatingLog.prohibitedObjectCount) || 0,
            screenshots: cheatingLog.screenshots || [],
          };

          const logResult = await saveCheatingLogMutation(updatedLog).unwrap();
          toast.success("Test submitted successfully!");
          navigate("/success");
        } catch (cheatingLogError) {
          console.error("Error saving cheating log:", cheatingLogError);
          toast.error("Test submitted but failed to save monitoring logs");
          navigate("/success");
        }
      } else {
        console.error("Submission failed:", response.data);
        toast.error("Failed to submit code");
      }
    } catch (error) {
      console.error("Error during submission:", error.response?.data || error);
      toast.error(
        error?.response?.data?.message ||
          error?.data?.message ||
          "Failed to submit test"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        overflow: "hidden",
        pt: { xs: "56px", lg: "70px" }, // Add padding to account for fixed header
      }}
    >
      {/* LeetCode-style Header */}
      <Box
        sx={{
          height: "60px",
          backgroundColor: "#2d2d2d",
          borderBottom: "1px solid #3a3a3a",
          display: "flex",
          alignItems: "center",
          px: 3,
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          {/* Logo/Title */}
          <Box sx={{ display: "flex", alignItems: "center", mr: 4 }}>
            <CodeIcon sx={{ color: "#ffa116", fontSize: 28, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ffffff" }}>
              InvigilateX-Ai
            </Typography>
          </Box>

          {/* Question Navigation */}
          {questions.length > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                sx={{
                  color: currentQuestionIndex === 0 ? "#666" : "#ffa116",
                  "&:hover": { backgroundColor: "rgba(255, 161, 22, 0.1)" },
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography sx={{ color: "#ffffff", fontWeight: "medium" }}>
                {currentQuestionIndex + 1} / {questions.length}
              </Typography>
              
              <IconButton
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                sx={{
                  color: currentQuestionIndex === questions.length - 1 ? "#666" : "#ffa116",
                  "&:hover": { backgroundColor: "rgba(255, 161, 22, 0.1)" },
                }}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Webcam Toggle and Timer Display */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Webcam Toggle Button */}
          {/* {!isMobile && (
            <Tooltip title={isWebcamVisible ? "Hide Camera" : "Show Camera"}>
              <IconButton
                onClick={toggleWebcamVisibility}
                sx={{
                  color: isWebcamVisible ? "#ffa116" : "#666",
                  "&:hover": { 
                    backgroundColor: "rgba(255, 161, 22, 0.1)",
                    color: "#ffa116"
                  },
                }}
              >
                {isWebcamVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
          )} */}
          
          {/* Timer Display */}
          {question && question.duration && (
            <>
              <TimerIcon 
                sx={{ 
                  color: questionStates[currentQuestionIndex] === 'completed'
                    ? '#00c851'
                    : timeRemaining <= 300 
                    ? '#ff4444' 
                    : '#ffa116',
                  fontSize: 20
                }} 
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: questionStates[currentQuestionIndex] === 'completed'
                    ? '#00c851'
                    : timeRemaining <= 300 
                    ? '#ff4444' 
                    : '#ffffff',
                }}
              >
                {questionStates[currentQuestionIndex] === 'completed'
                  ? '✓ Completed'
                  : formatTimeRemaining(timeRemaining)}
              </Typography>
            </>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 ,mt: 5}}>
          <Button
            variant="outlined"
            onClick={runCode}
            disabled={isRunning}
            startIcon={isRunning ? <LinearProgress size={16} /> : <PlayArrowIcon />}
            sx={{
              borderColor: "#00c851",
              color: "#00c851",
              "&:hover": {
                borderColor: "#00a844",
                backgroundColor: "rgba(0, 200, 81, 0.1)",
              },
              "&:disabled": {
                borderColor: "#666",
                color: "#666",
              },
            }}
          >
            {isRunning ? "Running..." : "Run"}
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <LinearProgress size={16} /> : <SendIcon />}
            sx={{
              backgroundColor: "#ffa116",
              color: "#000",
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#e6900e",
              },
              "&:disabled": {
                backgroundColor: "#666",
                color: "#999",
              },
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "#1a1a1a"
        }}>
          <Box sx={{ textAlign: "center" }}>
            <CodeIcon sx={{ fontSize: 80, color: "#ffa116", mb: 2 }} />
            <Typography variant="h5" sx={{ color: "#ffffff", mb: 2 }}>
              Loading Question...
            </Typography>
            <LinearProgress 
              sx={{ 
                width: 300,
                backgroundColor: "#3a3a3a",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#ffa116",
                },
              }} 
            />
          </Box>
        </Box>
      ) : !question ? (
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "#1a1a1a"
        }}>
          <Alert 
            severity="warning" 
            sx={{ 
              backgroundColor: "#2d2d2d",
              color: "#ffffff",
              border: "1px solid #ffa116",
            }}
          >
            <Typography variant="h6" sx={{ color: "#ffffff" }}>
              No coding question found for this exam.
            </Typography>
            <Typography sx={{ color: "#cccccc" }}>
              Please contact your teacher for assistance.
            </Typography>
          </Alert>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Panel - Problem Description */}
          <Box
            sx={{
              width: "45%",
              backgroundColor: "#1a1a1a",
              borderRight: "1px solid #3a3a3a",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Problem Header */}
            <Box sx={{ p: 3, borderBottom: "1px solid #3a3a3a" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#ffffff" }}>
                  {currentQuestionIndex + 1}. {question.question}
                </Typography>
                {questionStates[currentQuestionIndex] === 'completed' && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Solved"
                    sx={{
                      backgroundColor: "rgba(0, 200, 81, 0.2)",
                      color: "#00c851",
                      border: "1px solid #00c851",
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Chip
                  label="Medium"
                  sx={{
                    backgroundColor: "rgba(255, 161, 22, 0.2)",
                    color: "#ffa116",
                    border: "1px solid #ffa116",
                  }}
                />
                <Chip
                  label={`${language.charAt(0).toUpperCase() + language.slice(1)}`}
                  sx={{
                    backgroundColor: "rgba(33, 150, 243, 0.2)",
                    color: "#2196f3",
                    border: "1px solid #2196f3",
                  }}
                />
              </Box>
            </Box>

            {/* Problem Description */}
            <Box sx={{ p: 3, flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ 
                  color: "#ffffff", 
                  lineHeight: 1.7,
                  mb: 2
                }}>
                  {question.description}
                </Typography>
              </Box>

              {/* Example Section */}
              <Box sx={{ 
                backgroundColor: "#2d2d2d", 
                borderRadius: 2, 
                p: 2, 
                mb: 3,
                border: "1px solid #3a3a3a"
              }}>
                <Typography variant="subtitle1" sx={{ 
                  color: "#ffffff", 
                  fontWeight: "bold", 
                  mb: 1 
                }}>
                  Example:
                </Typography>
                <Box sx={{ 
                  backgroundColor: "#1a1a1a", 
                  borderRadius: 1, 
                  p: 2,
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  color: "#cccccc"
                }}>
                  <Typography component="pre" sx={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {`Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`}
                  </Typography>
                </Box>
              </Box>

              {/* Constraints */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ 
                  color: "#ffffff", 
                  fontWeight: "bold", 
                  mb: 1 
                }}>
                  Constraints:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ color: "#cccccc", mb: 0.5 }}>
                    • 2 ≤ nums.length ≤ 10⁴
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cccccc", mb: 0.5 }}>
                    • -10⁹ ≤ nums[i] ≤ 10⁹
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cccccc" }}>
                    • -10⁹ ≤ target ≤ 10⁹
                  </Typography>
                </Box>
              </Box>

              {/* Question Grid */}
              {questions.length > 1 && (
                <Box sx={{ 
                  backgroundColor: "#2d2d2d", 
                  borderRadius: 2, 
                  p: 2,
                  border: "1px solid #3a3a3a"
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    color: "#ffffff", 
                    fontWeight: "bold", 
                    mb: 2 
                  }}>
                    Questions ({questions.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {questions.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => {
                          setSavedCodes(prev => ({
                            ...prev,
                            [currentQuestionIndex]: code
                          }));
                          pauseTimer(currentQuestionIndex);
                          
                          setCurrentQuestionIndex(index);
                          setQuestion(questions[index]);
                          setCode(savedCodes[index] || "// Write your code here...");
                          setOutput("");
                          
                          if (questions[index] && questions[index].duration && questionStates[index] !== 'completed') {
                            const savedTime = questionTimers[index];
                            if (savedTime !== undefined && savedTime > 0) {
                              setTimeRemaining(savedTime);
                              setIsTimerActive(true);
                            } else if (savedTime === undefined) {
                              startTimer(questions[index].duration, index);
                            }
                          }
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          backgroundColor: index === currentQuestionIndex
                            ? "#ffa116"
                            : questionStates[index] === 'completed'
                            ? "#00c851"
                            : questionTimers[index] !== undefined
                            ? "#2196f3"
                            : "#3a3a3a",
                          color: index === currentQuestionIndex || questionStates[index] === 'completed'
                            ? "#000000"
                            : "#ffffff",
                          border: index === currentQuestionIndex ? "2px solid #e6900e" : "none",
                          "&:hover": {
                            transform: "scale(1.05)",
                            backgroundColor: index === currentQuestionIndex
                              ? "#e6900e"
                              : questionStates[index] === 'completed'
                              ? "#00a844"
                              : questionTimers[index] !== undefined
                              ? "#1976d2"
                              : "#4a4a4a",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        {questionStates[index] === 'completed' ? '✓' : index + 1}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, display: "flex", gap: 3, fontSize: "0.8rem" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, backgroundColor: "#ffa116", borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: "#cccccc" }}>Current</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, backgroundColor: "#00c851", borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: "#cccccc" }}>Solved</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, backgroundColor: "#2196f3", borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: "#cccccc" }}>Attempted</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 12, height: 12, backgroundColor: "#3a3a3a", borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: "#cccccc" }}>Todo</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Panel - Code Editor and Output */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Editor Header */}
            <Box
              sx={{
                height: "50px",
                backgroundColor: "#2d2d2d",
                borderBottom: "1px solid #3a3a3a",
                display: "flex",
                alignItems: "center",
                px: 2,
                gap: 2,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  sx={{
                    color: "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3a3a3a",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ffa116",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ffa116",
                    },
                    "& .MuiSelect-icon": {
                      color: "#ffffff",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: "#2d2d2d",
                        "& .MuiMenuItem-root": {
                          color: "#ffffff",
                          "&:hover": {
                            backgroundColor: "#3a3a3a",
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ flex: 1 }} />

              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  color: "#ffffff",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Box>

            {/* Code Editor */}
            <Box 
              sx={{ 
                flex: 1, 
                position: "relative",
                ...(isFullscreen && {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                }),
              }}
            >
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  folding: true,
                  bracketMatching: "always",
                  suggestOnTriggerCharacters: true,
                  parameterHints: { enabled: true },
                  autoIndent: "full",
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  insertSpaces: true,
                }}
              />
            </Box>

            {/* Output Panel */}
            <Box
              sx={{
                height: "200px",
                backgroundColor: "#1a1a1a",
                borderTop: "1px solid #3a3a3a",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Output Header */}
              <Box
                sx={{
                  height: "40px",
                  backgroundColor: "#2d2d2d",
                  borderBottom: "1px solid #3a3a3a",
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                }}
              >
                <TerminalIcon sx={{ color: "#00c851", mr: 1, fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ color: "#ffffff", fontWeight: "bold" }}>
                  Console
                </Typography>
                {codeStats.lastRunTime && (
                  <Typography variant="caption" sx={{ color: "#666", ml: 2 }}>
                    Last run: {formatTime(codeStats.lastRunTime)}
                  </Typography>
                )}
              </Box>

              {/* Output Content */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  overflow: "auto",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: "13px",
                  backgroundColor: "#1a1a1a",
                  color: "#ffffff",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                  {output || `Welcome to ${language.toUpperCase()} Console!\n\n> Ready to execute your code...\n> Click "Run" to test your solution.\n> Output will appear here.`}
                </pre>

                {isRunning && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      backgroundColor: "#2d2d2d",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <LinearProgress
                      sx={{
                        flex: 1,
                        height: 4,
                        backgroundColor: "#3a3a3a",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#00c851",
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#00c851" }}>
                      Running...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Draggable Webcam with Hide/Show functionality */}
      {!isMobile && isWebcamVisible && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: "fixed",
            left: webcamPosition.x,
            top: webcamPosition.y,
            width: 200,
            height: 150,
            border: "2px solid #ffa116",
            borderRadius: 2,
            overflow: "hidden",
            zIndex: 1000,
            backgroundColor: "#2d2d2d",
            cursor: isDragging ? "grabbing" : "grab",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            transition: isDragging ? "none" : "all 0.2s ease",
            "&:hover": {
              border: "2px solid #e6900e",
              boxShadow: "0 6px 25px rgba(255, 161, 22, 0.4)",
            },
          }}
        >
          {/* Drag Handle */}
          <Box
            sx={{
              position: "absolute",
              top: 4,
              left: 4,
              right: 4,
              height: 20,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              zIndex: 1001,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <DragIndicatorIcon sx={{ color: "#ffa116", fontSize: 14 }} />
              <Typography
                variant="caption"
                sx={{
                  color: "#ffffff",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                }}
              >
                Camera
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleWebcamVisibility();
              }}
              sx={{
                color: "#ffffff",
                padding: "2px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {/* <CloseIcon sx={{ fontSize: 12 }} /> */}
            </IconButton>
          </Box>

          <WebCam
            cheatingLog={cheatingLog}
            updateCheatingLog={updateCheatingLog}
          />
          
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 4,
              left: 8,
              color: "#ffffff",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              px: 1,
              borderRadius: 1,
              fontSize: "0.7rem",
            }}
          >
            🔒 Proctored
          </Typography>

          {/* Recording indicator */}
          <Box
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ff4444",
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 },
              },
            }}
          />
        </Box>
      )}

      {/* Floating webcam preview when hidden */}
      {!isMobile && !isWebcamVisible && (
        <Fab
          size="small"
          onClick={toggleWebcamVisibility}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 1000,
            backgroundColor: "#ffa116",
            color: "#000000",
            "&:hover": {
              backgroundColor: "#e6900e",
              transform: "scale(1.1)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <VideoCallIcon />
        </Fab>
      )}
    </Box>
  );
}
