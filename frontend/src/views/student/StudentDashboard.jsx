import React from "react";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // if you store student info in redux
import { useGetExamsQuery } from "src/slices/examApiSlice";
// If a results slice exists, uncomment the next line; otherwise, keep a safe fallback.
// import { useGetResultsQuery } from "src/slices/resultApiSlice";
import BrandBackground from "src/components/shared/BrandBackground";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth); // assuming you have auth slice

  // Fetch exams + results (optional, depending on your APIs)
  const { data: exams = [] } = useGetExamsQuery();
  // Safe fallback for results if hook not available
  let results = [];
  try {
    // @ts-ignore
    const { data } = useGetResultsQuery ? useGetResultsQuery() : { data: [] };
    results = data || [];
  } catch {
    results = [];
  }

  const upcomingExams = exams.slice(0, 3);
  const recentResults = results.slice(0, 3);

  return (
  <BrandBackground>
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Welcome Section */}
      <Typography variant="h4" fontWeight={800} gutterBottom color="primary.main">
        Welcome, {userInfo?.name || "Student"}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Your InvigilateX-Ai overview
      </Typography>

      <Grid container spacing={3} mt={2}>
        {/* Upcoming Exams */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.shadows[2], border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Upcoming Exams
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <Box
                    key={exam._id}
                    display="flex"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Typography>{exam.title}</Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/student/exam/${exam._id}`)}
                    >
                      Start
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No upcoming exams</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Results */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.shadows[2], border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentResults.length > 0 ? (
                recentResults.map((res) => (
                  <Box
                    key={res._id}
                    display="flex"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Typography>{res.examTitle}</Typography>
                    <Typography>{res.score}%</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No results yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: (theme) => theme.shadows[2], border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => navigate("/student/exams")}
                >
                  View All Exams
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/student/results")}
                >
                  View Results
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/student/profile")}
                >
                  Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  </BrandBackground>
  );
};

export default StudentDashboard;
