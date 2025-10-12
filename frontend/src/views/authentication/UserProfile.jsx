import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  CardContent,
  Divider,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  useTheme,
  alpha,
  Stack,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import ProfileAvatar from '../../components/shared/ProfileAvatar';
import { useGetExamsQuery, useGetMyExamsQuery, useGetLastStudentSubmissionQuery, useGetStudentStatsQuery } from '../../slices/examApiSlice';

const UserProfile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const theme = useTheme();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
  });

  // Fetch user's exam data based on role
  const isTeacher = userInfo?.role === 'teacher';
  const { data: allExams = [], isLoading: allExamsLoading } = useGetExamsQuery();
  const { data: myExams = [], isLoading: myExamsLoading } = useGetMyExamsQuery(undefined, {
    skip: !isTeacher, // Only fetch for teachers
  });
  const { data: lastSubmission } = useGetLastStudentSubmissionQuery(undefined, {
    skip: isTeacher, // Only fetch for students
  });
  const { data: studentStats, isLoading: studentStatsLoading } = useGetStudentStatsQuery(undefined, {
    skip: isTeacher, // Only fetch for students
  });

  // Choose the appropriate exam data based on role
  const examData = isTeacher ? myExams : allExams;
  const isExamLoading = isTeacher ? myExamsLoading : allExamsLoading;

  // Calculate user statistics based on real data
  const userStats = {
    totalExams: examData.length,
    createdExams: isTeacher ? examData.length : 0, // Only teachers create exams
    completedExams: isTeacher ? 0 : (studentStats?.completedExams || 0), // Real data for students
    avgScore: isTeacher ? 0 : (studentStats?.avgScore || 0), // Real data for students
    lastActivity: new Date().toLocaleDateString(),
  };

  // Generate recent activities based on real data
  const generateRecentActivities = () => {
    const activities = [];
    
    if (isTeacher && examData.length > 0) {
      // Show recent exam creations for teachers
      examData.slice(0, 4).forEach((exam, index) => {
        activities.push({
          icon: <AssignmentIcon />,
          title: 'Exam Created',
          description: exam.examName,
          time: new Date(exam.createdAt).toLocaleDateString(),
          status: 'Active'
        });
      });
    } else if (!isTeacher && studentStats?.recentSubmissions) {
      // Show recent submissions for students
      studentStats.recentSubmissions.forEach((submission) => {
        activities.push({
          icon: <EmojiEventsIcon />,
          title: 'Exam Completed',
          description: `${submission.examName} - Score: ${submission.score}`,
          time: new Date(submission.submittedAt).toLocaleDateString(),
          status: 'Completed'
        });
      });
    }

    // Add fallback activities if none exist
    if (activities.length === 0) {
      activities.push({
        icon: <PersonIcon />,
        title: 'Account Created',
        description: 'Welcome to ExamShield!',
        time: new Date().toLocaleDateString(),
        status: 'Completed'
      });
    }

    return activities;
  };

  const recentActivities = generateRecentActivities();

  const handleEditSubmit = () => {
    // TODO: Implement update user profile
    console.log('Update profile:', editData);
    setEditDialogOpen(false);
  };

  const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
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
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
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
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
        {onClick && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ViewListIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View All
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const InfoCard = ({ title, children }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  const ActivityItem = ({ icon, title, description, time, status }) => (
    <ListItem
      sx={{
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        borderRadius: 2,
        mb: 1,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        },
      }}
    >
      <ListItemIcon>
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          {icon}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2">{title}</Typography>
            {status && (
              <Chip
                label={status}
                size="small"
                color={status === 'Completed' ? 'success' : 'warning'}
              />
            )}
          </Stack>
        }
        secondary={
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {time}
            </Typography>
          </Stack>
        }
      />
    </ListItem>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
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
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box display="flex" justifyContent="center">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Tooltip title="Change Profile Picture">
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ProfileAvatar
                  size={120}
                  showUploadButton={false}
                  sx={{ 
                    border: '4px solid white',
                    boxShadow: theme.shadows[4],
                  }}
                />
              </Badge>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight="bold">
                  {userInfo?.name}
                </Typography>
                <VerifiedIcon sx={{ color: 'success.light' }} />
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {userInfo?.email}
              </Typography>
              <Chip
                label={userInfo?.role?.toUpperCase()}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  width: 'fit-content',
                }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
                sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                  fontWeight: 'bold',
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTeacher ? "My Exams" : "Available Exams"}
            value={userStats.totalExams}
            icon={<AssignmentIcon />}
            color="primary"
            onClick={isTeacher ? () => navigate('/my-exams') : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTeacher ? "Created Exams" : "Completed Exams"}
            value={isTeacher ? userStats.createdExams : userStats.completedExams}
            icon={isTeacher ? <SchoolIcon /> : <EmojiEventsIcon />}
            color="secondary"
            onClick={isTeacher ? () => navigate('/my-exams') : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTeacher ? "Active Exams" : "Average Score"}
            value={isTeacher ? userStats.totalExams : `${userStats.avgScore}%`}
            icon={isTeacher ? <TrendingUpIcon /> : <TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTeacher ? "Total Questions" : "Rank"}
            value={isTeacher ? examData.reduce((acc, exam) => acc + (exam.totalQuestions || 0), 0) : "Top 10%"}
            icon={isTeacher ? <AssignmentIcon /> : <EmojiEventsIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <InfoCard title="Profile Information">
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userInfo?.name}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EmailIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userInfo?.email}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SchoolIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userInfo?.role}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ScheduleIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Activity
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userStats.lastActivity}
                  </Typography>
                </Box>
              </Stack>
              {isTeacher && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AssignmentIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Exams Created
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {userStats.createdExams} exams
                    </Typography>
                  </Box>
                </Stack>
              )}
              {!isTeacher && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <EmojiEventsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Exam Performance
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {userStats.avgScore}% average
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </InfoCard>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <InfoCard title="Recent Activity">
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {(isExamLoading || (!isTeacher && studentStatsLoading)) ? (
                <ListItem>
                  <ListItemText primary="Loading activities..." />
                </ListItem>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    icon={activity.icon}
                    title={activity.title}
                    description={activity.description}
                    time={activity.time}
                    status={activity.status}
                  />
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No recent activity" 
                    secondary="Start creating or taking exams to see your activity here"
                  />
                </ListItem>
              )}
            </List>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon />
            <Typography variant="h6">Edit Profile</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email Address"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              fullWidth
              variant="outlined"
              type="email"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
