import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Badge,
  Alert,
  Fade,
  Slide,
  Zoom,
  Stack,
  Divider,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Quiz as QuizIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  VideoCall as VideoCallIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import PageContainer from "src/components/container/PageContainer";
import BlankCard from "src/components/shared/BlankCard";
import MultipleChoiceQuestion from "./Components/MultipleChoiceQuestion";
import NumberOfQuestions from "./Components/NumberOfQuestions";
import WebCam from "./Components/WebCam";
import {
  useGetExamsQuery,
  useGetQuestionsQuery,
  useSubmitExamMutation,
  useCheckExamAttemptsQuery,
} from "../../slices/examApiSlice";
import { useSaveCheatingLogMutation } from "src/slices/cheatingLogApiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useCheatingLog } from "src/context/CheatingLogContext";
import swal from "sweetalert";

const TestPage = () => {
  const { examId, testId } = useParams();
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    startTime: new Date(),
    questionsAnswered: 0,
    timeSpent: 0,
  });

  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { data: attemptData, isLoading: isAttemptsLoading } = useCheckExamAttemptsQuery(examId, { skip: !examId });
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [submitExamMutation] = useSubmitExamMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMcqCompleted, setIsMcqCompleted] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        // Convert duration from minutes to seconds
        setExamDurationInSeconds(exam.duration);
        console.log("Exam duration (minutes):", exam.duration);
      }
    }
  }, [userExamdata, examId]);

  // Enhanced animation and progress effect
  useEffect(() => {
    setShowContent(true);
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  // Track session statistics
  useEffect(() => {
    setSessionStats((prev) => ({
      ...prev,
      questionsAnswered: submittedAnswers.length,
    }));
  }, [submittedAnswers]);

  const [questions, setQuestions] = useState([]);
  const { data, isLoading } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      setQuestions(data);
    }
  }, [data]);

  // Auto-submit watcher based on total violations
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
      // Auto-submit MCQ phase and persist cheating log with reason
      (async () => {
        try {
          setAutoSubmitted(true);

          // Submit MCQ answers collected so far
          await submitExamMutation({ 
            examId, 
            answers: submittedAnswers,
            status: 'auto_failed',
            reason: 'Auto-submitted due to 10+ violations of exam rules.'
          }).unwrap();

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
          console.error("Auto-submit failed:", err);
          navigate("/success");
        }
      })();
    }
  }, [cheatingLog, examId, submittedAnswers, saveCheatingLogMutation, submitExamMutation, userInfo, hasShownWarning, hasShownFinalWarning, autoSubmitted, navigate]);

  const handleAnswerSelected = (answer) => {
    setSubmittedAnswers((prev) => [...prev, answer]);
    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
    }));
  };

  const handleMcqCompletion = async (answersOverride) => {
    try {
      const answersToSubmit = Array.isArray(answersOverride) && answersOverride.length > 0
        ? answersOverride
        : submittedAnswers;
      console.log("Answers being submitted:", answersToSubmit);
      // Submit exam answers
      await submitExamMutation({
        examId,
        answers: answersToSubmit,
      }).unwrap();

      setIsMcqCompleted(true);
      // Don't reset cheating log - let it continue from MCQ phase
      // resetCheatingLog(examId);
      navigate(`/exam/${examId}/codedetails`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam. Please try again.");
    }
  };

  const handleTestSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      // Make sure we have the latest user info in the log
      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId: examId,
        noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
        multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
        cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
        prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
      };

      console.log("Submitting cheating log:", updatedLog);

      // Save the cheating log
      const result = await saveCheatingLogMutation(updatedLog).unwrap();
      console.log("Cheating log saved:", result);

      toast.success("Test submitted successfully!");
      navigate(`/result/${examId}`);
    } catch (error) {
      console.error("Error saving cheating log:", error);
      toast.error(
        error?.data?.message ||
        error?.message ||
        "Failed to save test logs. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  // Handle question navigation from sidebar
  const handleQuestionNavigation = (questionIndex) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  if (isExamsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: 8 }}>
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: "primary.main" }}>
              Loading Exam...
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  // Check if attempts are exhausted
  if (attemptData && !attemptData.canTakeExam) {
    return (
      <PageContainer title="Exam Attempts Exhausted" description="Maximum attempts reached">
        <Box
          sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, textAlign: 'center', p: 4 }}>
            <Avatar
              sx={{
                bgcolor: 'error.main',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
              }}
            >
              <LockIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" gutterBottom color="error">
              Maximum Attempts Reached
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              You have used all <strong>{attemptData.maxAttempts}</strong> attempts for this exam.
            </Typography>
            {attemptData.lastSubmission && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Your Last Attempt Results:
                </Typography>
                <Chip
                  label={`Score: ${attemptData.lastSubmission.score || 0} points`}
                  color="primary"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Attempt ${attemptData.lastSubmission.attemptNumber}`}
                  color="secondary"
                  sx={{ mr: 1, mb: 1 }}
                />
              </Box>
            )}
            <Typography variant="body2" sx={{ mt: 2 }} color="text.disabled">
              Contact your teacher if you believe this is an error.
            </Typography>
          </Card>
        </Box>
      </PageContainer>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        pt: 2,
        "& @keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.5 },
          "100%": { opacity: 1 },
        },
      }}
    >
      {/* Enhanced Header Section */}
      <Slide direction="down" in={showContent} timeout={800}>
        <Box sx={{ mb: 2, px: 3, mt: 9 }}>
          <Grid container spacing={8} alignItems="center">
            {/* Main Header */}
            <Grid item xs={12} lg={isMobile ? 12 : 6}>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: 4,
                  boxShadow: 6,
                  position: "relative",
                  overflow: "hidden",
                  height: "205px",
                }}
              >
                <CardContent
                  sx={{
                    textAlign: "center",
                    py: 4,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        width: 70,
                        height: 70,
                        mr: 3,
                        boxShadow: 4,
                      }}
                    >
                      <QuizIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        MCQ Assessment
                      </Typography>
                      <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        {selectedExam?.examTitle || "Multiple Choice Questions"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    flexWrap="wrap"
                  >
                    <Chip
                      icon={<SchoolIcon />}
                      label="Live Exam"
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.25)",
                        color: "white",
                        fontSize: "1rem",
                        py: 2,
                        px: 3,
                        fontWeight: "bold",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                    <Chip
                      icon={<SecurityIcon />}
                      label="Proctored"
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.25)",
                        color: "white",
                        fontSize: "1rem",
                        py: 2,
                        px: 3,
                        fontWeight: "bold",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                    <Chip
                      icon={<TimerIcon />}
                      label={`${examDurationInSeconds} mins`}
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.25)",
                        color: "white",
                        fontSize: "1rem",
                        py: 2,
                        px: 3,
                        fontWeight: "bold",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                    {/* {attemptData && (
                      <Chip
                        icon={<AssignmentIcon />}
                        label={`Attempt ${attemptData.currentAttemptCount + 1}/${attemptData.maxAttempts}`}
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.25)",
                          color: "white",
                          fontSize: "1rem",
                          py: 2,
                          px: 3,
                          fontWeight: "bold",
                          backdropFilter: "blur(10px)",
                        }}
                      />
                    )} */}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Small Webcam Monitor - Top Middle */}

            {!isMobile && (
              <Grid item xs={12} lg={2}>
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    width: "100%",
                    maxWidth: 250,
                    height: 180,
                    overflow: "hidden",
                    margin: "0 auto",
                  }}
                >
                  <WebCam
                    cheatingLog={cheatingLog}
                    updateCheatingLog={updateCheatingLog}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    mt: 1,
                    fontSize: "0.65rem",
                    opacity: 0.8,
                  }}
                >
                  🔒 Secured
                </Typography>
              </Grid>
            )}

            {/* Stats Card */}
            <Grid item xs={12} lg={4}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: 4,
                  background:
                    "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
                  color: "white",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <TrendingUpIcon sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Progress Stats
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2">Answered:</Typography>
                      <Chip
                        label={`${sessionStats.questionsAnswered}/${questions.length}`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: "primary.main",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Completion:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (sessionStats.questionsAnswered / questions.length) *
                          100 || 0
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "rgba(255,255,255,0.3)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#4caf50",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">Status:</Typography>
                      <Chip
                        icon={
                          sessionStats.questionsAnswered ===
                            questions.length ? (
                            <CheckCircleIcon />
                          ) : (
                            <PsychologyIcon />
                          )
                        }
                        label={
                          sessionStats.questionsAnswered === questions.length
                            ? "Complete"
                            : "In Progress"
                        }
                        size="small"
                        sx={{
                          backgroundColor:
                            sessionStats.questionsAnswered === questions.length
                              ? "#4caf50"
                              : "#ff9800",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Timer */}
            <Grid item xs={12} md={2} lg={2}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: 4,
                  background:
                    "linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)",
                  color: "white",
                  height: "fit-content",
                  position: "sticky",
                  top: 20,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderRadius: 3,
                      p: 1,
                      backdropFilter: "blur(10px)",
                      minHeight: "100px", // Fixed height
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={
                        isMcqCompleted
                          ? handleTestSubmission
                          : handleMcqCompletion
                      }
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Slide>

      {/* Main Content */}
      <Box sx={{ mb: 1, px: 3 }}>
        <Grid container spacing={3}>
          {/* Center - Questions Section */}
          <Grid item xs={12} md={7} lg={7}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 6,
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                height: "850px", // Fixed height
                width: "1030px",
              }}
            >
              <CardContent
                sx={{
                  p: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      mr: 2,
                      width: 50,
                      height: 50,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      Question Paper
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Answer all questions carefully
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box
                  sx={{
                    flex: 1, // Take remaining space
                    display: "flex",
                    flexDirection: "column",
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                    border: "2px solid",
                    borderColor: "divider",
                    overflow: "hidden", // Prevent content overflow
                  }}
                >
                  {isLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress size={50} />
                      <Typography
                        variant="h6"
                        sx={{ mt: 2, color: "primary.main" }}
                      >
                        Loading Questions...
                      </Typography>
                    </Box>
                  ) : (
                    <MultipleChoiceQuestion
                      submitTest={
                        isMcqCompleted
                          ? handleTestSubmission
                          : handleMcqCompletion
                      }
                      questions={data}
                      saveUserTestScore={saveUserTestScore}
                      onAnswerSelected={handleAnswerSelected}
                      onQuestionChange={setCurrentQuestionIndex}
                      onAnswersUpdate={setAnsweredQuestions}
                      questionIndex={currentQuestionIndex}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Sidebar - Question Navigator */}
          <Grid item xs={12} md={4} lg={4}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 4,
                background: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
                color: "white",
                height: "fit-content",
                position: "sticky",
                top: 20,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      width: 40,
                      height: 40,
                      mb: 1,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", textAlign: "center" }}
                  >
                    Questions
                  </Typography>
                </Box>

                {/* Question Navigator */}
                <Box
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    p: 2,
                    border: "1px solid rgba(255,255,255,0.2)",
                    minHeight: "400px",
                    maxHeight: "500px",
                    overflow: "auto",
                  }}
                >
                  {/* Legend */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: "#81c784",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "white" }}
                      >
                        Correct
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: "#ff9800",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "white" }}
                      >
                        Incorrect
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: "#e57373",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "white" }}
                      >
                        Not answered
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: "#9e9e9e",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "white" }}
                      >
                        Not visited
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: "#5a9fd4",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "white" }}
                      >
                        Current
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider
                    sx={{ mb: 2, backgroundColor: "rgba(255,255,255,0.3)" }}
                  />

                  {/* Question Grid Layout */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(3, 1fr)", // 3 columns on mobile
                        sm: "repeat(4, 1fr)", // 4 columns on tablet
                        md: "repeat(5, 1fr)", // 5 columns on desktop
                      },
                      gap: 2,
                      width: "100%",
                      justifyItems: "center",
                    }}
                  >
                    {Array.from({ length: questions.length }, (_, index) => {
                      const questionNumber = index + 1;
                      const isAnswered =
                        answeredQuestions.hasOwnProperty(index);
                      const isCurrent = index === currentQuestionIndex;

                      // Determine status and colors to match the image
                      let backgroundColor, status;

                      if (isCurrent) {
                        backgroundColor = "#5a9fd4"; // Blue for current (matching image)
                        status = "Current";
                      } else if (isAnswered) {
                        // For now, treat all answered as correct (green)
                        // You can modify this logic based on actual answer correctness
                        backgroundColor = "#81c784"; // Green for correct (matching image)
                        status = "Answered";
                      } else if (index < currentQuestionIndex) {
                        // Visited but not answered
                        backgroundColor = "#e57373"; // Red for not answered (matching image)
                        status = "Not answered";
                      } else {
                        // Not visited yet
                        backgroundColor = "#9e9e9e"; // Gray for not visited (matching image)
                        status = "Not visited";
                      }

                      return (
                        <Tooltip
                          key={questionNumber}
                          title={`Question ${questionNumber} (${status})`}
                          placement="top"
                        >
                          <Paper
                            sx={{
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              backgroundColor: backgroundColor,
                              color: "white",
                              borderRadius: 2,
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              transition: "all 0.3s ease",
                              position: "relative",
                              border: "none",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              "&:hover": {
                                transform: "scale(1.05)",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                opacity: 0.9,
                              },
                            }}
                            onClick={() => {
                              // Handle question navigation
                              handleQuestionNavigation(index);
                            }}
                          >
                            {questionNumber}
                            {isCurrent && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -3,
                                  right: -3,
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "white",
                                  animation: "pulse 1.5s infinite",
                                  boxShadow: "0 0 0 2px #5a9fd4",
                                }}
                              />
                            )}
                          </Paper>
                        </Tooltip>
                      );
                    })}
                  </Box>

                  {/* Statistics */}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2,
                      borderTop: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          Total:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
                        >
                          {questions.length}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          Answered:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            color: "#0fec17ff",
                          }}
                        >
                          {Object.keys(answeredQuestions).length}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          Remaining:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            color: "#953029ff",
                          }}
                        >
                          {questions.length -
                            Object.keys(answeredQuestions).length}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          Current:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            color: "#4a1ceeff",
                          }}
                        >
                          Q{currentQuestionIndex + 1}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Progress Bar */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", mb: 1, display: "block" }}
                      >
                        Progress:{" "}
                        {Math.round(
                          (Object.keys(answeredQuestions).length /
                            questions.length) *
                          100
                        )}
                        %
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (Object.keys(answeredQuestions).length /
                            questions.length) *
                          100
                        }
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "rgba(255,255,255,0.3)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#4caf50",
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Security Status - Compact */}
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      mb: 1,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Security Status
                  </Typography>

                  <Stack spacing={1}>
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderRadius: 1,
                        p: 1,
                        border: "1px solid rgba(255,255,255,0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 0.5,
                        }}
                      >
                        <Badge color="success" variant="dot" sx={{ mr: 0.5 }}>
                          <VideoCallIcon sx={{ fontSize: 12 }} />
                        </Badge>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.6rem" }}
                        >
                          Camera Active
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderRadius: 1,
                        p: 1,
                        border: "1px solid rgba(255,255,255,0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 0.5,
                        }}
                      >
                        <Badge color="success" variant="dot" sx={{ mr: 0.5 }}>
                          <LockIcon sx={{ fontSize: 12 }} />
                        </Badge>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.6rem" }}
                        >
                          Tab Secured
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TestPage;
