
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import { useGetMyExamsQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function CheatingTable() {
  const [filter, setFilter] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetMyExamsQuery();
  const {
    data: cheatingLogsData,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useGetCheatingLogsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      const firstExam = examsData[0];
      setSelectedExamId(firstExam.examId);
    }
  }, [examsData]);

  useEffect(() => {
    if (cheatingLogsData) {
      console.log('Received cheating logs data:', cheatingLogsData);
      setCheatingLogs(Array.isArray(cheatingLogsData) ? cheatingLogsData : []);
    }
  }, [cheatingLogsData]);

  const handleRefresh = () => {
    if (selectedExamId) {
      refetchLogs();
    }
  };

  const filteredUsers = cheatingLogs.filter(
    (log) =>
      log.username?.toLowerCase().includes(filter.toLowerCase()) ||
      log.email?.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleViewScreenshots = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const getViolationColor = (count) => {
    if (count > 5) return 'error';
    if (count > 2) return 'warning';
    return 'success';
  };

  const getViolationIcon = (count) => {
    if (count > 5) return <WarningIcon color="error" />;
    if (count > 2) return <WarningIcon color="warning" />;
    return null;
  };

  if (examsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (examsError) {
    return (
      <Box p={2}>
        <Typography color="error">
          Error loading exams: {examsError.data?.message || examsError.error || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  if (!examsData || examsData.length === 0) {
    return (
      <Box p={2}>
        <Typography>No exams available. Please create an exam first.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Select
              label="Select Exam"
              value={selectedExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              fullWidth
            >
              {examsData.map((exam) => (
                <MenuItem key={exam.examId} value={exam.examId}>
                  {exam.examName || 'Unnamed Exam'}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Filter by Name or Email"
              variant="outlined"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={logsLoading}
              fullWidth
            >
              Refresh Logs
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {logsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : logsError ? (
        <Box p={2}>
          <Typography color="error">
            Error loading logs: {logsError.data?.message || logsError.error || 'Unknown error'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sno</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>No Face Count</TableCell>
                <TableCell>Multiple Face Count</TableCell>
                <TableCell>Cell Phone Count</TableCell>
                <TableCell>Prohibited Object Count</TableCell>
                <TableCell>Total Violations</TableCell>
                <TableCell>Screenshots</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No cheating logs found for this exam
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((log, index) => {
                  const totalViolations = (log.noFaceCount || 0) + 
                                        (log.multipleFaceCount || 0) + 
                                        (log.cellPhoneCount || 0) + 
                                        (log.prohibitedObjectCount || 0);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{log.username}</TableCell>
                      <TableCell>{log.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(log.noFaceCount)}
                          label={log.noFaceCount || 0}
                          color={getViolationColor(log.noFaceCount)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(log.multipleFaceCount)}
                          label={log.multipleFaceCount || 0}
                          color={getViolationColor(log.multipleFaceCount)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(log.cellPhoneCount)}
                          label={log.cellPhoneCount || 0}
                          color={getViolationColor(log.cellPhoneCount)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(log.prohibitedObjectCount)}
                          label={log.prohibitedObjectCount || 0}
                          color={getViolationColor(log.prohibitedObjectCount)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getViolationIcon(totalViolations)}
                          label={totalViolations}
                          color={getViolationColor(totalViolations)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Screenshots">
                          <IconButton
                            onClick={() => handleViewScreenshots(log)}
                            disabled={!log.screenshots?.length}
                          >
                            <ImageIcon color={log.screenshots?.length ? 'primary' : 'disabled'} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Screenshots Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '85vh',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Screenshots - {selectedLog?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedLog?.screenshots?.length || 0} screenshot(s) captured
              </Typography>
            </Box>
            <IconButton 
              onClick={handleCloseDialog}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {!selectedLog?.screenshots || selectedLog.screenshots.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column"
              alignItems="center" 
              justifyContent="center" 
              minHeight="200px"
              sx={{ color: 'text.secondary' }}
            >
              <ImageIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6">No screenshots available</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {selectedLog.screenshots.map((screenshot, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: (theme) => theme.shadows[8],
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="220"
                      image={screenshot.url}
                      alt={`Violation - ${screenshot.type}`}
                      sx={{ 
                        objectFit: 'contain',
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(screenshot.url, '_blank')}
                    />
                    <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                      <Chip
                        label={screenshot.type || 'noFace'}
                        color={
                          screenshot.type === 'noFace' ? 'error' :
                          screenshot.type === 'multipleFace' ? 'warning' :
                          screenshot.type === 'cellPhone' ? 'error' :
                          'default'
                        }
                        size="small"
                        sx={{ mb: 1, fontWeight: 600 }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Detected: {new Date(screenshot.detectedAt).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
