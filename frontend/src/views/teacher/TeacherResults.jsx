import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Stack,
  Container,
  TextField,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetTeacherSubmissionsQuery, useApproveCheatingLogsMutation, useApproveFailureReasonMutation } from '../../slices/examApiSlice';

const TeacherResults = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useGetTeacherSubmissionsQuery();
  const [approveCheatingLogs] = useApproveCheatingLogsMutation();
  const [approveFailureReason] = useApproveFailureReasonMutation();

  // ✅ Hooks must always be at the top (before any return)
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const submissions = data?.submissions || [];

  const handleApproveCheatingLogs = async (submissionId, approve, event) => {
    event.stopPropagation(); // Prevent row click
    try {
      await approveCheatingLogs({ submissionId, approve }).unwrap();
      refetch(); // Refresh the data
    } catch (error) {
      alert('Failed to update cheating logs approval: ' + (error?.data?.message || error.message));
    }
  };

  const handleApproveFailureReason = async (submissionId, approve, event) => {
    event.stopPropagation(); // Prevent row click
    try {
      await approveFailureReason({ submissionId, approve }).unwrap();
      refetch(); // Refresh the data
    } catch (error) {
      alert('Failed to update failure reason approval: ' + (error?.data?.message || error.message));
    }
  };

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const match = `${s.studentName} ${s.studentEmail} ${s.examName}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const maxScore = (s.totalQuestions || 0) * 10;
      const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
      const pass = pct >= 60;
      const isAutoSubmit = s.status === 'auto_failed';
      
      let ok = true;
      if (status === 'passed') {
        ok = pass;
      } else if (status === 'failed') {
        ok = !pass;
      } else if (status === 'autosubmit') {
        ok = isAutoSubmit;
      } else if (status === 'all') {
        ok = true;
      }
      
      return match && ok;
    });
  }, [submissions, query, status]);

  const getScoreColor = (score, totalQuestions) => {
    const maxScore = (totalQuestions || 0) * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // ✅ Conditional rendering happens after hooks
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading teacher results...</Typography>
        </Box>
      </Container>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Results" description="Teacher results">
        <DashboardCard title="Results">
          <Alert severity="error">
            Failed to load results: {error?.data?.message || error?.message || 'Unknown error'}
          </Alert>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Teacher Results" description="All submissions across your exams">
      <DashboardCard
        title="Recent Submissions"
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Search (name, email, exam)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <TextField
              size="small"
              select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="passed">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="autosubmit">Auto Submit</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={() => refetch()}>Refresh</Button>
            <Button
              variant="contained"
              onClick={async () => {
                const { jsPDF } = await import('jspdf');
                await import('jspdf-autotable');
                const doc = new jsPDF();
                doc.text('Teacher Results', 14, 16);
                const rows = filtered.map((s) => {
                  const maxScore = (s.totalQuestions || 0) * 10;
                  const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                  const statusText = s.status === 'auto_failed' ? 'Auto Submit' : 'Completed';
                  return [
                    s.studentName,
                    s.studentEmail,
                    s.examName,
                    `${s.score}/${maxScore}`,
                    `${pct}%`,
                    statusText,
                    s.hasCodingAnswer ? (s.codingLanguage || 'Yes') : 'No',
                    new Date(s.submittedAt).toLocaleString(),
                  ];
                });
                // @ts-ignore
                doc.autoTable({
                  head: [['Student', 'Email', 'Exam', 'Score', 'Percentage', 'Status', 'Coding', 'Submitted']],
                  body: rows,
                  startY: 22,
                });
                doc.save('teacher-results.pdf');
              }}
            >
              Export PDF
            </Button>
          </Stack>
        }
      >
        {/* Summary Statistics */}
        <Box sx={{ mb: 3, p: 3, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              📊 Submission Statistics
            </Typography>
            {status !== 'all' && (
              <Chip 
                label={`Filtered by: ${status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : status === 'autosubmit' ? 'Auto Submit' : 'All'}`}
                color="info"
                size="small"
                onDelete={() => setStatus('all')}
                sx={{ fontWeight: 'medium' }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
            <Chip 
              label={`Total: ${submissions.length}`} 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 'bold', minWidth: '100px', fontSize: '0.875rem' }}
            />
            <Chip 
              label={`Passed: ${submissions.filter(s => {
                const maxScore = (s.totalQuestions || 0) * 10;
                const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                return pct >= 60;
              }).length}`}
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 'bold', minWidth: '100px', fontSize: '0.875rem' }}
            />
            <Chip 
              label={`Failed: ${submissions.filter(s => {
                const maxScore = (s.totalQuestions || 0) * 10;
                const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                return pct < 60 && s.status !== 'auto_failed';
              }).length}`}
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 'bold', minWidth: '90px', fontSize: '0.875rem' }}
            />
            <Chip 
              label={`Auto Submit: ${submissions.filter(s => s.status === 'auto_failed').length}`}
              color="error" 
              variant="outlined"
              sx={{ fontWeight: 'bold', minWidth: '120px', fontSize: '0.875rem' }}
            />
          </Stack>
          {status === 'autosubmit' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Chip 
                label={`📋 Showing: ${filtered.length} auto-submitted exams`}
                color="error" 
                variant="filled"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
          {status === 'passed' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Chip 
                label={`✅ Showing: ${filtered.length} passed students`}
                color="success" 
                variant="filled"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
          {status === 'failed' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Chip 
                label={`❌ Showing: ${filtered.length} failed students`}
                color="error" 
                variant="filled"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
        </Box>

        {filtered.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No submissions yet.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Students will appear here once they complete your exams.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}><strong>Student</strong></TableCell>
                  <TableCell sx={{ minWidth: 180 }}><strong>Email</strong></TableCell>
                  <TableCell sx={{ minWidth: 140 }}><strong>Exam</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}><strong>Score</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 90 }}><strong>Percentage</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}><strong>Status</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}><strong>Coding</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}><strong>Cheating Logs</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 140 }}><strong>Submitted</strong></TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s, idx) => {
                  const maxScore = (s.totalQuestions || 0) * 10;
                  const percentage = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                  const color = getScoreColor(s.score, s.totalQuestions);
                  return (
                    <TableRow key={s.submissionId || idx} hover>
                      <TableCell sx={{ padding: '16px', minWidth: 120 }}>{s.studentName}</TableCell>
                      <TableCell sx={{ padding: '16px', minWidth: 180 }}>{s.studentEmail}</TableCell>
                      <TableCell sx={{ padding: '16px', minWidth: 140 }}>{s.examName}</TableCell>
                      <TableCell align="center" sx={{ padding: '16px', minWidth: 80 }}>
                        <Typography variant="body2" color={`${color}.main`} fontWeight="bold">
                          {s.score}/{maxScore}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '16px', minWidth: 90 }}>
                        <Chip label={`${percentage}%`} color={color} size="small" />
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '12px', minWidth: 100 }}>
                        {s.status === 'auto_failed' ? (
                          <Chip 
                            size="small" 
                            color="error" 
                            label="Auto Submit" 
                            sx={{ fontWeight: 'bold', minWidth: '90px' }}
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            color={percentage >= 60 ? 'success' : 'warning'} 
                            label={percentage >= 60 ? 'Completed' : 'Failed'} 
                            sx={{ minWidth: '85px' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '12px', minWidth: 120 }}>
                        {s.hasCodingAnswer ? (
                          <Chip
                            size="small"
                            color="success"
                            label={s.codingLanguage ? `Submitted (${s.codingLanguage})` : 'Submitted'}
                            sx={{ minWidth: '110px' }}
                          />
                        ) : (
                          <Chip size="small" label="Not submitted" sx={{ minWidth: '100px' }} />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '12px', minWidth: 120 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minHeight: '60px', justifyContent: 'center' }}>
                          {s.cheatingLogsApproved ? (
                            <>
                              <Chip 
                                size="small" 
                                color="success" 
                                label="Approved" 
                                sx={{ 
                                  minWidth: '85px', 
                                  fontWeight: 'medium',
                                  fontSize: '0.75rem'
                                }} 
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={(e) => handleApproveCheatingLogs(s.submissionId, false, e)}
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 8px', 
                                  minWidth: '60px',
                                  minHeight: '24px',
                                  textTransform: 'none'
                                }}
                              >
                                Revoke
                              </Button>
                            </>
                          ) : (
                            <>
                              <Chip 
                                size="small" 
                                color="default" 
                                label="Not Approved" 
                                sx={{ 
                                  minWidth: '100px', 
                                  fontWeight: 'medium',
                                  fontSize: '0.75rem'
                                }} 
                              />
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={(e) => handleApproveCheatingLogs(s.submissionId, true, e)}
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  padding: '2px 8px', 
                                  minWidth: '70px',
                                  minHeight: '24px',
                                  textTransform: 'none'
                                }}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '16px', minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {formatDate(s.submittedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '12px', minWidth: 120 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              navigate(`/teacher/result/${s.examId}/${s.studentId}`)
                            }
                            sx={{ fontSize: '0.75rem', minWidth: '110px' }}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </TableCell>
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
};

export default TeacherResults;
