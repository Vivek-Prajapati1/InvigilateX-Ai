import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Stack, TextField, MenuItem, Grid, Card, CardContent } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetExamResultsQuery, useGetStudentExamResultQuery, useGetStudentStatsQuery, useGetLastStudentSubmissionQuery, useUpdateSubmissionScoreMutation, useApproveCheatingLogsMutation, useApproveFailureReasonMutation } from 'src/slices/examApiSlice';
import { Assignment as AssignmentIcon, TrendingUp as TrendingUpIcon, EmojiEvents as EmojiEventsIcon, Grade as GradeIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResultPage = () => {
  const { examId, studentId: studentIdFromUrl } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const isTeacher = userInfo?.role === 'teacher';
  const currentUserId = userInfo?._id;

  // If no examId is provided: for teachers redirect; for students, show dashboard list here
  useEffect(() => {
    if (!examId && isTeacher) {
      navigate('/my-exams');
    }
  }, [examId, isTeacher, navigate]);

  // Determine the student ID to use for fetching results
  const studentIdToQuery = studentIdFromUrl || currentUserId;

  // Fetch all exam results for teacher, or skip for student
  const { data: allExamResults, isLoading: isAllResultsLoading, isError: isAllResultsError, error: allResultsError } = useGetExamResultsQuery(examId, {
    skip: !isTeacher || !examId,
  });

  // Fetch specific student's exam result
  const { data: studentResult, isLoading: isStudentResultLoading, isError: isStudentResultError, error: studentResultError, refetch: refetchStudent } = useGetStudentExamResultQuery({ examId, studentId: studentIdToQuery }, {
    skip: !studentIdToQuery || !examId,
  });


  // ✅ Include refetch so you can trigger it from a button
  const {
    data: studentStats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
    refetch: refetchStats,
  } = useGetStudentStatsQuery(undefined, {
    skip: isTeacher,
  });


  const [updateScore] = useUpdateSubmissionScoreMutation();
  const [approveCheatingLogs] = useApproveCheatingLogsMutation();
  const [approveFailureReason] = useApproveFailureReasonMutation();

  // Fetch cheating logs for this exam and filter to current student
  const { data: cheatingLogs, isLoading: isLogsLoading } = useGetCheatingLogsQuery(examId, { 
    skip: !examId || (!isTeacher && !studentResult?.cheatingLogsApproved)  // Fetch for teachers or when approved for students
  });
  
  const myCheatingLogs = React.useMemo(() => {
    if (!cheatingLogs) return [];
    if (isTeacher) {
      // For teachers viewing student results, get the specific student's logs
      const targetEmail = studentIdFromUrl ? 
        allExamResults?.find(r => r.studentId?._id === studentIdFromUrl)?.studentId?.email : 
        userInfo?.email;
      return cheatingLogs.filter((log) => !targetEmail || log.email === targetEmail);
    } else {
      // For students, only show their own logs if approved
      return studentResult?.cheatingLogsApproved ? 
        cheatingLogs.filter((log) => log.email === userInfo?.email) : [];
    }
  }, [cheatingLogs, userInfo, isTeacher, studentIdFromUrl, allExamResults, studentResult?.cheatingLogsApproved]);
  
  const aggregatedCheating = React.useMemo(() => {
    const agg = {
      noFaceCount: 0,
      multipleFaceCount: 0,
      cellPhoneCount: 0,
      prohibitedObjectCount: 0,
      screenshots: [],
      reason: null,
    };
    if (isTeacher || studentResult?.cheatingLogsApproved) { // Aggregate for teachers or approved students
      myCheatingLogs.forEach((log) => {
        agg.noFaceCount += Number(log.noFaceCount || 0);
        agg.multipleFaceCount += Number(log.multipleFaceCount || 0);
        agg.cellPhoneCount += Number(log.cellPhoneCount || 0);
        agg.prohibitedObjectCount += Number(log.prohibitedObjectCount || 0);
        if (Array.isArray(log.screenshots)) {
          agg.screenshots = agg.screenshots.concat(log.screenshots);
        }
        if (!agg.reason && log.reason) agg.reason = log.reason;
      });
    }
    return agg;
  }, [myCheatingLogs, isTeacher, studentResult?.cheatingLogsApproved]);
  const [editOpen, setEditOpen] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  // Student stats (for list view when no examId)
  // const { data: studentStats, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useGetStudentStatsQuery(undefined, { skip: isTeacher });
  const { data: lastSubmission } = useGetLastStudentSubmissionQuery(undefined, { skip: isTeacher || !!examId });

  // Calculate filteredList outside of conditional returns
  const { completedExams, avgScore, totalScore, recentSubmissions, allSubmissions } = studentStats || {};
  const submissions = Array.isArray(allSubmissions) && allSubmissions.length > 0 ? allSubmissions : (recentSubmissions || []);

  const filteredList = useMemo(() => {
    if (isTeacher || examId) return [];
    return submissions.filter((s) => {
      const match = s.examName.toLowerCase().includes(query.toLowerCase());
      const pct = Math.round((s.score / (s.totalQuestions * 10)) * 100);
      const pass = pct >= 60;
      const ok = status === 'all' ? true : status === 'passed' ? pass : !pass;
      return match && ok;
    });
  }, [submissions, query, status, isTeacher, examId]);

  // Calculate filtered results for teacher view
  const sortedResults = allExamResults ? [...allExamResults].sort((a, b) => b.score - a.score) : [];
  const filteredResults = useMemo(() => {
    if (!isTeacher || !examId) return [];
    return sortedResults.filter(r => {
      const match = `${r.studentId?.name || ''} ${r.studentId?.email || ''}`.toLowerCase().includes(query.toLowerCase());
      const maxScore = (r.examDetails?.totalQuestions || 0) * 10;
      const pct = maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0;
      const pass = pct >= 60;
      const ok = status === 'all' ? true : status === 'passed' ? pass : !pass;
      return match && ok;
    });
  }, [sortedResults, query, status, isTeacher, examId]);

  // Helper functions
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getScoreColor = (score, totalQuestions) => {
    const percentage = (score / (totalQuestions * 10)) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const handleStudentClick = (sId) => {
    navigate(`/teacher/result/${examId}/${sId}`);
  };

  const handleApproveCheatingLogs = async (approve) => {
    try {
      await approveCheatingLogs({ 
        submissionId: studentResult._id, 
        approve 
      }).unwrap();
      
      // Refetch the student result to get updated approval status
      refetchStudent();
      
      const message = approve ? 
        'Cheating logs have been approved and are now visible to the student' : 
        'Cheating logs approval has been revoked and are now hidden from the student';
      alert(message);
    } catch (error) {
      alert('Failed to update cheating logs approval: ' + (error?.data?.message || error.message));
    }
  };

  const handleApproveFailureReason = async (approve) => {
    try {
      await approveFailureReason({ 
        submissionId: studentResult._id, 
        approve 
      }).unwrap();
      
      // Refetch the student result to get updated approval status
      refetchStudent();
      
      const message = approve ? 
        'Failure reason has been approved and is now visible to the student' : 
        'Failure reason approval has been revoked and is now hidden from the student';
      alert(message);
    } catch (error) {
      alert('Failed to update failure reason approval: ' + (error?.data?.message || error.message));
    }
  };

  // Loading states
  if (isTeacher && isAllResultsLoading) {
    return (
      <PageContainer title="Loading Results" description="Fetching exam results">
        <DashboardCard title="Loading All Results">
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading all exam results...</Typography>
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!isTeacher && isStudentResultLoading && examId) {
    return (
      <PageContainer title="Loading Results" description="Fetching exam results">
        <DashboardCard title="Loading Your Result">
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading your exam result...</Typography>
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (statsLoading && !isTeacher && !examId) {
    return (
      <PageContainer title="Loading Results" description="Fetching your exam results">
        <DashboardCard title="Loading Your Results">
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading your exam results...</Typography>
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  // Error states
  if (isTeacher && isAllResultsError) {
    return (
      <PageContainer title="Error" description="Failed to load exam results">
        <DashboardCard title="Error Loading All Results">
          <Alert severity="error">Error fetching all exam results: {allResultsError?.data?.message || allResultsError?.error}</Alert>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!isTeacher && isStudentResultError && examId) {
    return (
      <PageContainer title="Error" description="Failed to load exam results">
        <DashboardCard title="Error Loading Your Result">
          <Alert severity="error">Error fetching your exam result: {studentResultError?.data?.message || studentResultError?.error}</Alert>
        </DashboardCard>
      </PageContainer>
    );
  }

  // if (statsError && !isTeacher && !examId) {
  //   return (
  //     <PageContainer title="Error" description="Error fetching results">
  //       <Alert severity="error" sx={{ mb: 2 }}>
  //         Error fetching your results: {statsErrorObj?.data?.message || statsErrorObj?.message}
  //       </Alert>
  //     </PageContainer>
  //   );
  // }

  // Student dashboard list when no examId
  if (!isTeacher && !examId) {
    return (
      <PageContainer title="My Results" description="View your exam results and performance">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>My Exam Results</Typography>
          <Typography variant="body1" color="text.secondary">Track your performance and view detailed results for all completed exams.</Typography>
        </Box>

        {/* Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><AssignmentIcon color="primary" sx={{ fontSize: 40 }} /><Box><Typography variant="h4" color="primary">{completedExams || 0}</Typography><Typography variant="body2" color="text.secondary">Completed Exams</Typography></Box></Stack></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><TrendingUpIcon color="success" sx={{ fontSize: 40 }} /><Box><Typography variant="h4" color="success.main">{avgScore || 0}%</Typography><Typography variant="body2" color="text.secondary">Average Score</Typography></Box></Stack></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><GradeIcon color="warning" sx={{ fontSize: 40 }} /><Box><Typography variant="h4" color="warning.main">{totalScore || 0}</Typography><Typography variant="body2" color="text.secondary">Total Points</Typography></Box></Stack></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Stack direction="row" alignItems="center" spacing={2}><EmojiEventsIcon color="error" sx={{ fontSize: 40 }} /><Box><Typography variant="h4" color="error.main">{completedExams > 0 ? Math.round((avgScore || 0) / 10) : 0}</Typography><Typography variant="body2" color="text.secondary">Grade Level</Typography></Box></Stack></CardContent></Card>
          </Grid>
        </Grid>

        {/* Results Table */}
        <DashboardCard title="Exam Results History" action={
          <Stack direction="row" spacing={1}>
            <TextField size="small" placeholder="Search exam" value={query} onChange={(e) => setQuery(e.target.value)} />
            <TextField size="small" select value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="passed">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                refetchStats(); // 🔄 refresh student stats
              }}
            >
              Refresh
            </Button>

            <Button variant="contained" onClick={async () => {
              try {
                const doc = new jsPDF();
                
                // Add logo
                try {
                  const logoImg = new Image();
                  logoImg.crossOrigin = 'Anonymous';
                  logoImg.src = window.location.origin + '/invigilatex-ai-icon.svg';
                  await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                    setTimeout(reject, 1000);
                  });
                  doc.addImage(logoImg, 'PNG', 90, 10, 15, 15);
                } catch (err) {
                  console.log('Logo loading skipped:', err);
                }
                
                // Add centered branding header
                doc.setFontSize(24);
                doc.setTextColor(21, 159, 193); // Primary color
                doc.text('InvigilateX-Ai', doc.internal.pageSize.width / 2, 32, { align: 'center' });
                
                doc.setFontSize(14);
                doc.setTextColor(100, 100, 100);
                doc.text('My Exam Results', doc.internal.pageSize.width / 2, 40, { align: 'center' });
                
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 46, { align: 'center' });
                
                // Add a line separator
                doc.setDrawColor(21, 159, 193);
                doc.setLineWidth(0.5);
                doc.line(14, 50, 196, 50);
                
                const rows = filteredList.map((s) => {
                  const maxScore = (s.totalQuestions || 0) * 10;
                  const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                  return [
                    s.examName || 'N/A', 
                    `${s.score || 0}`, 
                    `${s.totalQuestions || 0}`, 
                    `${pct}%`, 
                    s.codingSubmitted ? (s.codingLanguage || 'Yes') : 'No', 
                    s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'
                  ];
                });
                autoTable(doc, { 
                  head: [['Exam', 'Score', 'Questions', 'Percentage', 'Coding', 'Date']], 
                  body: rows, 
                  startY: 54,
                  headStyles: {
                    fillColor: [21, 159, 193],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                  },
                  alternateRowStyles: {
                    fillColor: [245, 245, 245],
                  },
                  styles: {
                    fontSize: 9,
                    cellPadding: 3,
                  },
                });
                
                // Add footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                  doc.setPage(i);
                  doc.setFontSize(8);
                  doc.setTextColor(150, 150, 150);
                  doc.text(
                    `InvigilateX-Ai - Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                  );
                }
                
                doc.save('my-results.pdf');
              } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Failed to export PDF: ' + error.message);
              }
            }}>Export PDF</Button>




          </Stack>

        }>
          {filteredList.length === 0 ? (
            <Box textAlign="center" py={6}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>No exam results found</Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>You haven't completed any exams yet.</Typography>
              <Button variant="contained" onClick={() => navigate('/exam')} startIcon={<AssignmentIcon />}>Take an Exam</Button>
            </Box>

          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Exam Name</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                    <TableCell align="center"><strong>Questions</strong></TableCell>
                    <TableCell align="center"><strong>Percentage</strong></TableCell>
                    <TableCell align="center"><strong>Coding</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Date</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredList.map((submission) => {
                    const percentage = Math.round((submission.score / (submission.totalQuestions * 10)) * 100);
                    const scoreColor = getScoreColor(submission.score, submission.totalQuestions);
                    return (
                      <TableRow key={`${submission.examId}-${submission._id || submission.submittedAt}`} hover>
                        <TableCell><Typography variant="body2" fontWeight="medium">{submission.examName}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={`${scoreColor}.main`} fontWeight="bold">{submission.score}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{submission.totalQuestions}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={`${scoreColor}.main`} fontWeight="bold">{percentage}%</Typography></TableCell>
                        <TableCell align="center">{submission.codingSubmitted ? (<Chip size="small" color="success" label={submission.codingLanguage ? `Submitted (${submission.codingLanguage})` : 'Submitted'} />) : (<Chip size="small" label="Not submitted" />)}</TableCell>
                        <TableCell align="center">
                          {submission.status === 'auto_failed' ? (
                            <Chip label="Failed (Auto-submitted)" color="error" size="small" />
                          ) : (
                            <Chip label={percentage >= 60 ? 'Passed' : 'Failed'} color={percentage >= 60 ? 'success' : 'error'} size="small" />
                          )}
                        </TableCell>
                        <TableCell align="center"><Typography variant="body2" color="text.secondary">{formatDate(submission.submittedAt)}</Typography></TableCell>
                        <TableCell align="center"><Button size="small" variant="outlined" onClick={() => navigate(`/result/${submission.examId}`)}>View Details</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DashboardCard>
      </PageContainer>
    );
  }

  // Render for Teacher: specific student's detailed view
  if (isTeacher && studentIdFromUrl) {
    if (isStudentResultError || !studentResult) {
      return (
        <PageContainer title="Error" description="Failed to load student result">
          <DashboardCard title="Error Loading Result">
            <Alert severity="error">Error fetching student result: {studentResultError?.data?.message || studentResultError?.error || 'Unknown error'}</Alert>
          </DashboardCard>
        </PageContainer>
      );
    }

    // Show detailed per-question breakdown for this student
    return (
      <PageContainer title="Student Result" description="Detailed student result">
        <DashboardCard title={`Result: ${studentResult.studentId?.name || 'Student'}`}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Score: {studentResult.score}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email: {studentResult.studentId?.email} | Submitted on: {new Date(studentResult.createdAt).toLocaleString()}
            </Typography>
            <Button variant="outlined" sx={{ mt: 1, mb: 2 }} onClick={() => { setNewScore(String(studentResult.score)); setEditOpen(true); }}>
              Edit Score
            </Button>
            {/* Summary: totals */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Total Questions: ${studentResult.answers?.length || 0}`} />
              <Chip color="success" label={`Correct: ${(studentResult.answers || []).filter(a => a.isCorrect).length}`} />
              <Chip color="error" label={`Incorrect: ${(studentResult.answers || []).filter(a => a.isCorrect === false).length}`} />
              <Chip color="info" label={`Percentage: ${(() => { const total = studentResult.answers?.length || 0; const correct = (studentResult.answers || []).filter(a => a.isCorrect).length; return total ? Math.round((correct / total) * 100) : 0; })()}%`} />
            </Box>

            {/* Coding Question(s) Section */}
            {studentResult.examCodingQuestions && studentResult.examCodingQuestions.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Coding Question(s)</Typography>
                {studentResult.examCodingQuestions.map((cq, i) => (
                  <Box key={`cq-${i}-${cq._id || cq.question}`} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{cq.question || `Question ${i + 1}`}</Typography>
                    {cq.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{cq.description}</Typography>
                    )}
                  </Box>
                ))}
                {studentResult.codingAnswer && (
                  <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Submitted Code ({studentResult.codingAnswer.language})</Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#111', color: '#eee', padding: 12, borderRadius: 8 }}>
                      {studentResult.codingAnswer.code}
                    </pre>
                  </Box>
                )}
              </Box>
            )}
            <Typography variant="h6" mt={3}>Answers:</Typography>
            {studentResult.answers?.length > 0 ? (
              studentResult.answers.map((ans, idx) => {
                const question = ans.questionId; // populated
                const selectedOption = question?.options?.find(o => String(o._id) === String(ans.selectedOption));
                const correctOption = question?.options?.find(o => o.isCorrect);
                return (
                  <Box key={`ans-${idx}-${ans._id || question?._id}`} mt={2} p={2} border={1} borderColor="grey.300" borderRadius={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {question?.question || 'Question'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Selected: {selectedOption?.optionText || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      Correct: {correctOption?.optionText || '—'}
                    </Typography>
                    <Typography variant="body2" color={ans.isCorrect ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {question?.options?.map((opt, oi) => {
                        const isSelected = String(opt._id) === String(ans.selectedOption);
                        const isCorrectO = !!opt.isCorrect;
                        return (
                          <Box
                            key={`opt-${oi}-${opt._id}`}
                            sx={{
                              p: 1,
                              border: '1px solid',
                              borderColor: isCorrectO ? 'success.main' : isSelected ? 'primary.main' : 'grey.300',
                              backgroundColor: isCorrectO ? 'success.light' : isSelected ? 'primary.light' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography variant="body2">{opt.optionText}</Typography>
                            <Stack direction="row" spacing={1}>
                              {isCorrectO && <Chip size="small" color="success" label="Correct" />}
                              {isSelected && <Chip size="small" color={isCorrectO ? 'success' : 'primary'} label="Selected" />}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography>No answers recorded.</Typography>
            )}
          </Box>
        </DashboardCard>

        {/* Edit Score Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Score - {studentResult.studentId?.name}</DialogTitle>
          <DialogContent>
            <TextField
              label="Score"
              type="number"
              fullWidth
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              inputProps={{ min: 0 }}
              autoFocus
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={async () => {
                const val = Number(newScore);
                if (Number.isNaN(val) || val < 0) return;
                await updateScore({ submissionId: studentResult._id, score: val }).unwrap();
                setEditOpen(false);
                refetchStudent();
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    );
  }

  // Render for Teacher: list of all student results in an exam
  if (isTeacher) {
    return (
      <PageContainer title="Exam Results" description="Teacher's view of exam results">
        <DashboardCard title="All Student Results" action={
          <Stack direction="row" spacing={1}>
            <TextField size="small" placeholder="Search student" value={query} onChange={(e) => setQuery(e.target.value)} />
            <TextField size="small" select value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="passed">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
            <Button variant="contained" onClick={async () => {
              try {
                const doc = new jsPDF();
                
                // Add logo
                try {
                  const logoImg = new Image();
                  logoImg.crossOrigin = 'Anonymous';
                  logoImg.src = window.location.origin + '/invigilatex-ai-icon.svg';
                  await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                    setTimeout(reject, 1000);
                  });
                  doc.addImage(logoImg, 'PNG', 90, 10, 15, 15);
                } catch (err) {
                  console.log('Logo loading skipped:', err);
                }
                
                // Add centered branding header
                doc.setFontSize(24);
                doc.setTextColor(21, 159, 193); // Primary color
                doc.text('InvigilateX-Ai', doc.internal.pageSize.width / 2, 32, { align: 'center' });
                
                doc.setFontSize(14);
                doc.setTextColor(100, 100, 100);
                doc.text('Exam Results Report', doc.internal.pageSize.width / 2, 40, { align: 'center' });
                
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 46, { align: 'center' });
                
                // Add a line separator
                doc.setDrawColor(21, 159, 193);
                doc.setLineWidth(0.5);
                doc.line(14, 50, 196, 50);
                
                const rows = filteredResults.map((r) => {
                  const maxScore = (r.examDetails?.totalQuestions || 0) * 10;
                  const pct = maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0;
                  return [
                    r.studentId?.name || 'N/A', 
                    r.studentId?.email || 'N/A', 
                    r.score || 0, 
                    `${pct}%`, 
                    r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'
                  ];
                });
                autoTable(doc, { 
                  head: [['Student', 'Email', 'Score', 'Percentage', 'Submitted At']], 
                  body: rows, 
                  startY: 54,
                  headStyles: {
                    fillColor: [21, 159, 193],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                  },
                  alternateRowStyles: {
                    fillColor: [245, 245, 245],
                  },
                  styles: {
                    fontSize: 9,
                    cellPadding: 3,
                  },
                });
                
                // Add footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                  doc.setPage(i);
                  doc.setFontSize(8);
                  doc.setTextColor(150, 150, 150);
                  doc.text(
                    `InvigilateX-Ai - Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                  );
                }
                
                doc.save('exam-results.pdf');
              } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Failed to export PDF: ' + error.message);
              }
            }}>Export PDF</Button>

          </Stack>
        }>
          {filteredResults.length === 0 ? (
            <Typography>No submissions found for this exam yet.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Submitted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow
                      key={`result-${result._id}`}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Button onClick={() => handleStudentClick(result.studentId._id)}>{result.studentId.name}</Button>
                      </TableCell>
                      <TableCell>{result.studentId.email}</TableCell>
                      <TableCell align="right">{result.score}</TableCell>
                      <TableCell align="right">{new Date(result.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DashboardCard>
      </PageContainer>
    );
  }

  // Render for Student
  if (!isTeacher && studentResult) {
    return (
      <PageContainer title="Your Result" description="Your exam result">
        <DashboardCard title="Your Exam Result">
          <Box>
            {/* Auto-failed status warnings - show to teachers or approved students */}
            {(isTeacher || studentResult?.failureReasonApproved) && studentResult.status === 'auto_failed' && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'error.main',
                  color: '#fff',
                  border: '1px solid',
                  borderColor: 'error.dark',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">❌ Failed</Typography>
                  
                  {/* Teacher approval controls for failure reason */}
                  {isTeacher && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {studentResult?.failureReasonApproved ? (
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => handleApproveFailureReason(false)}
                          sx={{ color: 'white', borderColor: 'white' }}
                        >
                          Hide from Student
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApproveFailureReason(true)}
                        >
                          Show to Student
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Student approval indicator */}
                  {!isTeacher && studentResult?.failureReasonApproved && (
                    <Chip 
                      size="small" 
                      color="warning" 
                      label="Shared by Teacher" 
                      sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}
                    />
                  )}
                </Box>
                
                <Typography variant="body2">
                  {studentResult.reason ||
                    aggregatedCheating.reason ||
                    'Exam was auto-submitted due to excessive cheating (10+ violations).'}
                </Typography>
              </Box>
            )}

            {/* If backend returned no status but logs indicate 10+ violations, show failed banner - for teachers or approved students */}
            {(isTeacher || (studentResult?.failureReasonApproved && studentResult?.cheatingLogsApproved)) && !studentResult.status &&
              (aggregatedCheating.noFaceCount +
                aggregatedCheating.multipleFaceCount +
                aggregatedCheating.cellPhoneCount +
                aggregatedCheating.prohibitedObjectCount) >= 10 && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'error.main',
                    color: '#fff',
                    border: '1px solid',
                    borderColor: 'error.dark',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">❌ Failed</Typography>
                    
                    {/* Teacher approval controls for failure reason */}
                    {isTeacher && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {studentResult?.failureReasonApproved ? (
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={() => handleApproveFailureReason(false)}
                            sx={{ color: 'white', borderColor: 'white' }}
                          >
                            Hide from Student
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveFailureReason(true)}
                          >
                            Show to Student
                          </Button>
                        )}
                      </Box>
                    )}

                    {/* Student approval indicator */}
                    {!isTeacher && studentResult?.failureReasonApproved && (
                      <Chip 
                        size="small" 
                        color="warning" 
                        label="Shared by Teacher" 
                        sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2">
                    {aggregatedCheating.reason ||
                      'Exam was auto-submitted due to excessive cheating (10+ violations).'}
                  </Typography>
                </Box>
              )}

            <Typography variant="h5" gutterBottom>Score: {studentResult.score}</Typography>
            <Typography variant="body1" color="text.secondary">Submitted on: {new Date(studentResult.createdAt).toLocaleString()}</Typography>
            {/* Summary: totals */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2, mt: 1 }}>
              <Chip label={`Total Questions: ${studentResult.answers?.length || 0}`} />
              <Chip color="success" label={`Correct: ${(studentResult.answers || []).filter(a => a.isCorrect).length}`} />
              <Chip color="error" label={`Incorrect: ${(studentResult.answers || []).filter(a => a.isCorrect === false).length}`} />
              <Chip color="info" label={`Percentage: ${(() => { const total = studentResult.answers?.length || 0; const correct = (studentResult.answers || []).filter(a => a.isCorrect).length; return total ? Math.round((correct / total) * 100) : 0; })()}%`} />
            </Box>

            {/* Coding Question(s) for student */}
            {studentResult.examCodingQuestions && studentResult.examCodingQuestions.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Coding Question(s)</Typography>
                {studentResult.examCodingQuestions.map((cq, i) => (
                  <Box key={`student-cq-${i}-${cq._id || cq.question}`} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{cq.question || `Question ${i + 1}`}</Typography>
                    {cq.description && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{cq.description}</Typography>
                    )}
                  </Box>
                ))}
                {studentResult.codingAnswer && (
                  <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Submitted Code ({studentResult.codingAnswer.language})</Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#111', color: '#eee', padding: 12, borderRadius: 8 }}>
                      {studentResult.codingAnswer.code}
                    </pre>
                  </Box>
                )}
              </Box>
            )}

            {/* Cheating Logs Section - visible to teachers or approved students */}
            {(isTeacher || studentResult?.cheatingLogsApproved) && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cheating Logs
                    {!isTeacher && studentResult?.cheatingLogsApproved && (
                      <Chip 
                        size="small" 
                        color="success" 
                        label="Approved by Teacher" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  
                  {/* Teacher approval controls */}
                  {isTeacher && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {studentResult?.cheatingLogsApproved ? (
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => handleApproveCheatingLogs(false)}
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApproveCheatingLogs(true)}
                        >
                          Approve for Student
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>

                {isLogsLoading ? (
                  <Typography variant="body2">Loading logs...</Typography>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Chip color="warning" label={`No Face: ${aggregatedCheating.noFaceCount}`} />
                      <Chip color="warning" label={`Multiple Faces: ${aggregatedCheating.multipleFaceCount}`} />
                      <Chip color="warning" label={`Cell Phone: ${aggregatedCheating.cellPhoneCount}`} />
                      <Chip color="warning" label={`Prohibited Objects: ${aggregatedCheating.prohibitedObjectCount}`} />
                    </Box>

                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Screenshots Evidence</Typography>
                    {aggregatedCheating.screenshots.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No screenshots available.</Typography>
                    ) : (
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                        gap: 2,
                      }}>
                        {aggregatedCheating.screenshots.map((shot, idx) => (
                          <Box key={idx} sx={{ border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                            <img src={shot.url} alt={shot.type} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                            <Box sx={{ p: 1 }}>
                              <Typography variant="caption" display="block">Type: {shot.type}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(shot.detectedAt).toLocaleString()}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )}
                
                {/* Show approval info for teachers */}
                {isTeacher && studentResult?.cheatingLogsApproved && (
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.dark">
                      ✓ Cheating logs approved on {new Date(studentResult.cheatingLogsApprovedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                {/* Show failure reason approval info for teachers */}
                {isTeacher && studentResult?.failureReasonApproved && (
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark">
                      ✓ Failure reason approved on {new Date(studentResult.failureReasonApprovedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {/* Detailed per-question breakdown with options */}
            <Typography variant="h6" mt={3}>Your Answers:</Typography>
            {studentResult.answers.length > 0 ? (
              studentResult.answers.map((ans, index) => {
                const question = ans.questionId; // populated document
                const selectedOption = question?.options?.find(o => String(o._id) === String(ans.selectedOption));
                const correctOption = question?.options?.find(o => o.isCorrect);
                return (
                  <Box key={`student-ans-${index}-${ans._id || question?._id}`} mt={2} p={2} border={1} borderColor="grey.300" borderRadius={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {question?.question || 'Question'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Your answer: {selectedOption?.optionText || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      Correct answer: {correctOption?.optionText || '—'}
                    </Typography>
                    <Typography variant="body2" color={ans.isCorrect ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {question?.options?.map((opt, oi) => {
                        const isSelected = String(opt._id) === String(ans.selectedOption);
                        const isCorrectO = !!opt.isCorrect;
                        return (
                          <Box
                            key={`student-opt-${oi}-${opt._id}`}
                            sx={{
                              p: 1,
                              border: '1px solid',
                              borderColor: isCorrectO ? 'success.main' : isSelected ? 'primary.main' : 'grey.300',
                              backgroundColor: isCorrectO ? 'success.light' : isSelected ? 'primary.light' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography variant="body2">{opt.optionText}</Typography>
                            <Stack direction="row" spacing={1}>
                              {isCorrectO && <Chip size="small" color="success" label="Correct" />}
                              {isSelected && <Chip size="small" color={isCorrectO ? 'success' : 'primary'} label="Selected" />}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography>No answers recorded for this submission.</Typography>
            )}
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="No Result" description="No exam result to display">
      <DashboardCard title="No Result">
        <Typography>No result found or you are not authorized to view this result.</Typography>
      </DashboardCard>
    </PageContainer>
  );
};

export default ResultPage;
