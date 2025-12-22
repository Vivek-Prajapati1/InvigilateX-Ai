import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Avatar,
  Stack,
  Container,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, ChartTooltip, Legend);
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useGetMyExamsQuery, useGetTeacherSubmissionsQuery } from '../../slices/examApiSlice';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TeacherDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [selectedExam, setSelectedExam] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch teacher's exams and submissions
  const { data: myExams = [], isLoading: examsLoading, refetch: refetchExams } = useGetMyExamsQuery();
  const { data: teacherSubmissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = useGetTeacherSubmissionsQuery();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    refetchExams();
    refetchSubmissions();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score, totalQuestions) => {
    const maxScore = totalQuestions * 10; // Assuming 10 points per question
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const liveDate = new Date(exam.liveDate);
    const deadDate = new Date(exam.deadDate);

    if (now < liveDate) return { status: 'Upcoming', color: 'info' };
    if (now >= liveDate && now <= deadDate) return { status: 'Active', color: 'success' };
    return { status: 'Completed', color: 'default' };
  };

  // Calculate statistics
  const submissionStats = teacherSubmissions?.submissions || [];
  const totalSubmissions = submissionStats.length;
  const totalStudents = new Set(submissionStats.map(s => s.studentEmail)).size;
  const averageScore = submissionStats.length > 0 
    ? (submissionStats.reduce((sum, s) => sum + s.score, 0) / submissionStats.length).toFixed(1)
    : 0;
  const activeExams = myExams.filter(exam => {
    const { status } = getExamStatus(exam);
    return status === 'Active';
  }).length;

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  if (examsLoading || submissionsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight="bold">
              Teacher Dashboard
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Welcome back, {userInfo?.name}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/create-exam')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Create Exam
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Exams"
            value={myExams.length}
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Exams"
            value={activeExams}
            icon={<SchoolIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Submissions"
            value={totalSubmissions}
            icon={<PeopleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Score"
            value={`${averageScore}%`}
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 3, boxShadow: (theme) => theme.shadows[2] }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="teacher dashboard tabs" variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Recent Submissions" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="My Exams" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Student Performance" icon={<PeopleIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Recent Submissions Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Recent Student Submissions
          </Typography>
          
          {submissionStats.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No submissions yet. Students will appear here once they complete your exams.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Exam</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                    <TableCell align="center"><strong>Percentage</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Submitted</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissionStats.map((submission, index) => {
                    const maxScore = submission.totalQuestions * 10;
                    const percentage = Math.round((submission.score / maxScore) * 100);
                    const scoreColor = getScoreColor(submission.score, submission.totalQuestions);
                    
                    return (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" fontWeight="medium">
                              {submission.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.studentEmail}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {submission.examName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color={`${scoreColor}.main`} fontWeight="bold">
                            {submission.score}/{maxScore}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color={`${scoreColor}.main`} fontWeight="bold">
                            {percentage}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={percentage >= 60 ? 'Passed' : 'Failed'}
                            color={percentage >= 60 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(submission.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/teacher/result/${submission.examId}/${submission.studentId}`)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* My Exams Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            My Exams
          </Typography>
          
          {myExams.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              You haven't created any exams yet. 
              <Button onClick={() => navigate('/create-exam')} sx={{ ml: 1 }}>
                Create Your First Exam
              </Button>
            </Alert>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {myExams.map((exam) => {
                const { status, color } = getExamStatus(exam);
                const examSubmissions = submissionStats.filter(s => s.examId === exam._id);
                
                return (
                  <Grid item xs={12} md={6} key={exam._id}>
                    <Card
                      sx={{
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" color="primary">
                              {exam.examName}
                            </Typography>
                            <Chip label={status} color={color} size="small" />
                          </Stack>
                          
                          <Stack direction="row" spacing={4}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Questions</Typography>
                              <Typography variant="body2" fontWeight="bold">{exam.totalQuestions}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Duration</Typography>
                              <Typography variant="body2" fontWeight="bold">{exam.duration}min</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Submissions</Typography>
                              <Typography variant="body2" fontWeight="bold">{examSubmissions.length}</Typography>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/result/${exam._id}`)}
                            >
                              View Results
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/my-exams`)}
                            >
                              Edit
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Student Performance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Student Performance Overview
          </Typography>

          {submissionStats.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No student performance data available yet.
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Overall trends */}
              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Unique Students</Typography>
                      <Typography variant="h4" fontWeight="bold">{totalStudents}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Total Submissions</Typography>
                      <Typography variant="h4" fontWeight="bold">{submissionStats.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Average Class Performance</Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h4" fontWeight="bold">{averageScore}%</Typography>
                        <LinearProgress variant="determinate" value={Number(averageScore)} sx={{ flex: 1, height: 10, borderRadius: 5 }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Build aggregates */}
              {(() => {
                const studentMap = new Map();
                const examMap = new Map();
                submissionStats.forEach(s => {
                  const pct = Math.round((s.score / (s.totalQuestions * 10)) * 100);
                  // per student
                  const sid = s.studentEmail;
                  if (!studentMap.has(sid)) {
                    studentMap.set(sid, { name: s.studentName, email: s.studentEmail, count: 0, sum: 0, last: s.submittedAt });
                  }
                  const st = studentMap.get(sid);
                  st.count += 1; st.sum += pct; st.last = st.last && st.last > s.submittedAt ? st.last : s.submittedAt;

                  // per exam
                  const eid = s.examId;
                  if (!examMap.has(eid)) {
                    examMap.set(eid, { name: s.examName, scores: [] });
                  }
                  examMap.get(eid).scores.push(pct);
                });

                const studentsAgg = Array.from(studentMap.values()).map(st => ({
                  name: st.name,
                  email: st.email,
                  attempts: st.count,
                  avg: Math.round(st.sum / st.count),
                  last: st.last,
                })).sort((a,b) => b.avg - a.avg);

                const examsAgg = Array.from(examMap.values()).map(ex => {
                  const avg = Math.round(ex.scores.reduce((a,b)=>a+b,0) / ex.scores.length);
                  const best = Math.max(...ex.scores);
                  const worst = Math.min(...ex.scores);
                  return { name: ex.name, submissions: ex.scores.length, avg, best, worst };
                }).sort((a,b) => b.avg - a.avg);

                // Build datasets for charts
                const studentLabels = studentsAgg.map(s => s.name);
                const studentAvg = studentsAgg.map(s => s.avg);
                const examLabels = examsAgg.map(e => e.name);
                const examAvg = examsAgg.map(e => e.avg);
                const distribution = [
                  submissionStats.filter(s => Math.round((s.score / (s.totalQuestions * 10)) * 100) >= 80).length,
                  submissionStats.filter(s => {
                    const p = Math.round((s.score / (s.totalQuestions * 10)) * 100);
                    return p >= 60 && p < 80;
                  }).length,
                  submissionStats.filter(s => Math.round((s.score / (s.totalQuestions * 10)) * 100) < 60).length,
                ];

                return (
                  <>
                    {/* Individual student progress */}
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Individual Student Progress</Typography>
                    <Grid container spacing={3} alignItems="stretch" sx={{ mb: 2 }}>
                      <Grid item xs={12} md={9}>
                        <Card sx={{ height: 360, display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Average % by Student</Typography>
                            <Box sx={{ flex: 1 }}>
                              <Bar
                              data={{
                                labels: studentLabels,
                                datasets: [{
                                  label: 'Avg %',
                                  data: studentAvg,
                                  backgroundColor: 'rgba(25, 118, 210, 0.5)',
                                  borderColor: 'rgba(25, 118, 210, 1)',
                                  borderWidth: 1,
                                }],
                              }}
                              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100, beginAtZero: true } } }}
                            />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card sx={{ height: 360, display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Score Distribution</Typography>
                            <Box sx={{ flex: 1 }}>
                              <Doughnut
                              data={{
                                labels: ['>= 80%', '60% - 79%', '< 60%'],
                                datasets: [{
                                  data: distribution,
                                  backgroundColor: ['#2e7d32', '#f9a825', '#e53935'],
                                }],
                              }}
                              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                            />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Student</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell align="center"><strong>Attempts</strong></TableCell>
                            <TableCell align="center"><strong>Avg %</strong></TableCell>
                            <TableCell><strong>Progress</strong></TableCell>
                            <TableCell align="center"><strong>Last Submitted</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {studentsAgg.map((st, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{st.name}</TableCell>
                              <TableCell>{st.email}</TableCell>
                              <TableCell align="center">{st.attempts}</TableCell>
                              <TableCell align="center">{st.avg}%</TableCell>
                              <TableCell>
                                <LinearProgress variant="determinate" value={st.avg} sx={{ height: 8, borderRadius: 4, maxWidth: 200 }} />
                              </TableCell>
                              <TableCell align="center">{new Date(st.last).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 3 }} />

                    {/* Exam analytics */}
                    <Typography variant="h6" sx={{ mb: 1 }}>Exam Analytics</Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Exam</strong></TableCell>
                            <TableCell align="center"><strong>Submissions</strong></TableCell>
                            <TableCell align="center"><strong>Avg %</strong></TableCell>
                            <TableCell align="center"><strong>Best %</strong></TableCell>
                            <TableCell align="center"><strong>Worst %</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {examsAgg.map((ex, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{ex.name}</TableCell>
                              <TableCell align="center">{ex.submissions}</TableCell>
                              <TableCell align="center">{ex.avg}%</TableCell>
                              <TableCell align="center">{ex.best}%</TableCell>
                              <TableCell align="center">{ex.worst}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                );
              })()}
            </Box>
          )}
        </TabPanel>
      </Card>
    </Container>
  );
};

export default TeacherDashboard;
