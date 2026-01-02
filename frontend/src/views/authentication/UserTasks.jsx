import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccessTimeFilled,
  Add,
  AssignmentTurnedIn,
  Bolt,
  CheckCircle,
  EventAvailable,
  FilterList,
  Flag,
  PendingActions,
  RocketLaunch,
  Refresh,
  TaskAlt,
  WarningAmber,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';

const seedTasks = [
  {
    id: 't-1',
    title: 'Review flagged proctoring logs',
    description: 'Check cheating alerts raised during the latest coding exams.',
    dueDate: '2026-01-05',
    status: 'in-progress',
    priority: 'high',
    audience: 'teacher',
    progress: 55,
    tags: ['proctoring', 'compliance'],
  },
  {
    id: 't-2',
    title: 'Publish JavaScript MCQ set',
    description: 'Finalize 10 MCQs and attach answer keys for the JavaScript test.',
    dueDate: '2026-01-06',
    status: 'todo',
    priority: 'medium',
    audience: 'teacher',
    progress: 15,
    tags: ['content', 'exam'],
  },
  {
    id: 't-3',
    title: 'Send results summary',
    description: 'Share consolidated scores with the academic coordinator.',
    dueDate: '2026-01-04',
    status: 'todo',
    priority: 'high',
    audience: 'teacher',
    progress: 0,
    tags: ['reporting'],
  },
  {
    id: 't-4',
    title: 'Complete Backend mock test',
    description: 'Finish the practice backend test and review hints.',
    dueDate: '2026-01-07',
    status: 'in-progress',
    priority: 'high',
    audience: 'student',
    progress: 65,
    tags: ['practice', 'backend'],
  },
  {
    id: 't-5',
    title: 'Upload profile photo',
    description: 'Add a clear profile image for your exam badge.',
    dueDate: '2026-01-08',
    status: 'todo',
    priority: 'low',
    audience: 'all',
    progress: 0,
    tags: ['profile'],
  },
  {
    id: 't-6',
    title: 'Verify coding question hints',
    description: 'Ensure each coding question has 2-3 structured hints.',
    dueDate: '2026-01-09',
    status: 'in-progress',
    priority: 'medium',
    audience: 'teacher',
    progress: 40,
    tags: ['content', 'quality'],
  },
  {
    id: 't-7',
    title: 'Plan study schedule',
    description: 'Block 2 hours for math revision before the next exam.',
    dueDate: '2026-01-06',
    status: 'todo',
    priority: 'medium',
    audience: 'student',
    progress: 10,
    tags: ['planning'],
  },
  {
    id: 't-8',
    title: 'Confirm invigilation slots',
    description: 'Pick two exam slots you will oversee this week.',
    dueDate: '2026-01-04',
    status: 'in-progress',
    priority: 'high',
    audience: 'teacher',
    progress: 35,
    tags: ['scheduling'],
  },
  {
    id: 't-9',
    title: 'Review feedback from students',
    description: 'Read notes from the last exam to improve the next one.',
    dueDate: '2026-01-10',
    status: 'todo',
    priority: 'low',
    audience: 'teacher',
    progress: 0,
    tags: ['feedback'],
  },
];

const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const UserTasks = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const userRole = userInfo?.role === 'teacher' ? 'teacher' : 'student';
  const theme = useTheme();
  const [tasks, setTasks] = useState(seedTasks);
  const [filterStatus, setFilterStatus] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  const isOverdue = useCallback((task) => {
    if (!task.dueDate || task.status === 'done') return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return due < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  const daysUntilDue = useCallback((task) => {
    if (!task.dueDate) return null;
    const today = new Date();
    const due = new Date(task.dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, []);

  const filteredByRole = useMemo(
    () => tasks.filter((task) => task.audience === 'all' || task.audience === userRole),
    [tasks, userRole],
  );

  const visibleTasks = useMemo(() => {
    return filteredByRole
      .filter((task) =>
        filterStatus === 'all'
          ? true
          : filterStatus === 'overdue'
            ? isOverdue(task)
            : task.status === filterStatus,
      )
      .filter((task) =>
        priorityFilter === 'all' ? true : task.priority === priorityFilter,
      )
      .filter((task) => {
        if (!search.trim()) return true;
        const haystack = `${task.title} ${task.description}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });
  }, [filteredByRole, filterStatus, priorityFilter, search, isOverdue]);

  const stats = useMemo(() => {
    const total = filteredByRole.length;
    const completed = filteredByRole.filter((t) => t.status === 'done').length;
    const inProgress = filteredByRole.filter((t) => t.status === 'in-progress').length;
    const overdue = filteredByRole.filter((t) => isOverdue(t)).length;
    const dueSoon = filteredByRole.filter((t) => {
      const days = daysUntilDue(t);
      return days !== null && days >= 0 && days <= 3 && t.status !== 'done';
    }).length;

    return { total, completed, inProgress, overdue, dueSoon };
  }, [filteredByRole, isOverdue, daysUntilDue]);

  const statItems = useMemo(
    () => [
      {
        label: 'Total tasks',
        value: stats.total,
        icon: <TaskAlt />,
        color: theme.palette.primary.main,
        tone: alpha(theme.palette.primary.main, 0.1),
      },
      {
        label: 'In progress',
        value: stats.inProgress,
        icon: <RocketLaunch />,
        color: theme.palette.info.main,
        tone: alpha(theme.palette.info.main, 0.12),
      },
      {
        label: 'Completed',
        value: stats.completed,
        icon: <CheckCircle />,
        color: theme.palette.success.main,
        tone: alpha(theme.palette.success.main, 0.12),
      },
      {
        label: 'Due soon',
        value: stats.dueSoon,
        icon: <EventAvailable />,
        color: theme.palette.warning.main,
        tone: alpha(theme.palette.warning.main, 0.14),
      },
    ],
    [stats, theme],
  );

  const resolvePriorityColor = (priority) => {
    if (priority === 'high') return theme.palette.error.main;
    if (priority === 'medium') return theme.palette.warning.main;
    if (priority === 'low') return theme.palette.success.main;
    return theme.palette.text.primary;
  };

  const handleToggleComplete = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'done' ? 'in-progress' : 'done',
              progress: task.status === 'done' ? Math.min(task.progress, 80) : 100,
            }
          : task,
      ),
    );
  };

  const handleAdvanceStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        if (task.status === 'todo') return { ...task, status: 'in-progress', progress: Math.max(task.progress, 30) };
        if (task.status === 'in-progress') return { ...task, status: 'done', progress: 100 };
        return { ...task, status: 'todo', progress: 0 };
      }),
    );
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const taskToAdd = {
      id: `t-${Date.now()}`,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      dueDate: newTask.dueDate || '',
      status: 'todo',
      priority: newTask.priority,
      audience: userRole,
      progress: 0,
      tags: ['manual'],
    };
    setTasks((prev) => [...prev, taskToAdd]);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
  };

  const upcoming = useMemo(() => {
    return [...filteredByRole]
      .filter((task) => task.status !== 'done')
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      })
      .slice(0, 4);
  }, [filteredByRole]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <PageContainer title="My Tasks" description="Track InvigilateX tasks, exams, and study todos">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 45%, #ec4899 100%)',
            color: '#fff',
            boxShadow: '0 16px 50px rgba(0,0,0,0.12)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 32%)',
            }}
          />
          <CardContent sx={{ py: { xs: 3, md: 4 }, position: 'relative' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack spacing={1.5}>
                  <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.82 }}>
                    Personal Workspace
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h4" fontWeight={800} sx={{ textShadow: '0 3px 12px rgba(0,0,0,0.18)' }}>
                      {userInfo?.name ? `${userInfo.name.split(' ')[0]}'s Tasks` : 'My Tasks'}
                    </Typography>
                    <Chip
                      label={userRole === 'teacher' ? 'Teacher view' : 'Student view'}
                      size="small"
                      sx={{
                        bgcolor: alpha('#ffffff', 0.18),
                        color: '#fff',
                        borderColor: alpha('#ffffff', 0.32),
                        borderStyle: 'solid',
                        borderWidth: 1,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                      }}
                    />
                  </Stack>
                  <Typography variant="body1" sx={{ maxWidth: 720, opacity: 0.93 }}>
                    Stay on top of exams, grading, and study routines. Tune filters to spotlight what matters today.
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.16), color: '#fff', width: 52, height: 52, fontWeight: 800 }}>
                    {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mt: 3 }}>
              {statItems.map((item) => (
                <Grid item xs={6} md={3} key={item.label}>
                  <Box
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      backgroundColor: alpha('#ffffff', 0.08),
                      border: `1px solid ${alpha('#ffffff', 0.16)}`,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 40, height: 40, bgcolor: item.tone, color: item.color }}>
                        {item.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1 }}>{item.value}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.primary.main, 0.01) }}>
              <CardContent>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <TextField
                      fullWidth
                      placeholder="Search tasks"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FilterList fontSize="small" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="todo">To Do</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="done">Done</MenuItem>
                        <MenuItem value="overdue">Overdue</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        label="Priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Reset filters">
                      <IconButton
                        onClick={() => {
                          setFilterStatus('all');
                          setPriorityFilter('all');
                          setSearch('');
                        }}
                        color="primary"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Stack spacing={2}>
                  {visibleTasks.length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        color: 'text.secondary',
                      }}
                    >
                      <Typography fontWeight={700}>No tasks match your filters.</Typography>
                      <Typography variant="body2">
                        Try changing the filters or add a new task to get started.
                      </Typography>
                    </Box>
                  )}

                  {visibleTasks.map((task) => {
                    const overdue = isOverdue(task);
                    const dueIn = daysUntilDue(task);
                    const progressValue = task.status === 'done' ? 100 : task.progress;

                    return (
                      <Card
                        key={task.id}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderColor: overdue
                            ? alpha(theme.palette.error.main, 0.4)
                            : theme.palette.divider,
                          backgroundColor: overdue
                            ? alpha(theme.palette.error.main, 0.03)
                            : alpha(theme.palette.primary.main, 0.03),
                          borderLeft: `6px solid ${overdue ? theme.palette.error.main : theme.palette.primary.main}`,
                          boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                              <Checkbox
                                checked={task.status === 'done'}
                                onChange={() => handleToggleComplete(task.id)}
                                color="success"
                              />
                              <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="h6" fontWeight={800}>
                                    {task.title}
                                  </Typography>
                                  {task.tags?.map((tag) => (
                                    <Chip key={tag} size="small" label={tag} variant="outlined" />
                                  ))}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {task.description || 'No description added yet.'}
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                                  <Chip
                                    icon={<Flag fontSize="small" />}
                                    size="small"
                                    label={statusLabels[task.status] || task.status}
                                    sx={{
                                      bgcolor: task.status === 'done'
                                        ? alpha(theme.palette.success.main, 0.12)
                                        : task.status === 'in-progress'
                                          ? alpha(theme.palette.info.main, 0.12)
                                          : alpha(theme.palette.warning.main, 0.12),
                                      color: task.status === 'done'
                                        ? theme.palette.success.main
                                        : task.status === 'in-progress'
                                          ? theme.palette.info.main
                                          : theme.palette.warning.main,
                                    }}
                                  />
                                  <Chip
                                    icon={<Bolt fontSize="small" />}
                                    size="small"
                                    label={`Priority: ${task.priority}`}
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                                      color: resolvePriorityColor(task.priority),
                                      borderColor: alpha(theme.palette.primary.main, 0.2),
                                      borderWidth: 1,
                                      borderStyle: 'solid',
                                    }}
                                  />
                                  <Chip
                                    icon={overdue ? <PendingActions fontSize="small" /> : <AccessTimeFilled fontSize="small" />}
                                    size="small"
                                    label={
                                      overdue
                                        ? 'Overdue'
                                        : dueIn === null
                                          ? 'No due date'
                                          : dueIn === 0
                                            ? 'Due today'
                                            : `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}`
                                    }
                                      color={overdue ? 'error' : 'primary'}
                                      variant={overdue ? 'filled' : 'outlined'}
                                      sx={{
                                        bgcolor: overdue
                                          ? alpha(theme.palette.error.main, 0.12)
                                          : alpha(theme.palette.primary.main, 0.08),
                                      }}
                                  />
                                </Stack>
                              </Box>
                            </Box>

                            <Stack spacing={1} alignItems="flex-end">
                              <Tooltip title="Cycle status">
                                <IconButton onClick={() => handleAdvanceStatus(task.id)} color="primary" size="small">
                                  <AssignmentTurnedIn />
                                </IconButton>
                              </Tooltip>
                              <Typography variant="caption" color="text.secondary">
                                Due {formatDate(task.dueDate)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Box sx={{ mt: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progressValue}
                              sx={{
                                height: 8,
                                borderRadius: 10,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 10,
                                  background: overdue
                                    ? theme.palette.error.main
                                    : task.status === 'done'
                                      ? theme.palette.success.main
                                      : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {progressValue}% complete
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.secondary.main, 0.03) }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="h6" fontWeight={800}>Quick Add</Typography>
                    <Chip label="Local only" size="small" color="secondary" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Jot down personal todos; they stay on this device until you wire an API.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    minRows={2}
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      label="Due date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        label="Priority"
                        value={newTask.priority}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                      >
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Add />}
                    onClick={handleAddTask}
                    fullWidth
                    disabled={!newTask.title.trim()}
                    sx={{
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Add task
                  </Button>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="h6" fontWeight={800}>Upcoming</Typography>
                    <Chip label="Next 4" size="small" variant="outlined" />
                  </Stack>
                  <Stack spacing={1.5}>
                    {upcoming.map((task) => {
                      const overdue = isOverdue(task);
                      const dueIn = daysUntilDue(task);
                      return (
                        <Box
                          key={task.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {task.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(task.dueDate)}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={statusLabels[task.status] || task.status}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`Priority: ${task.priority}`}
                                  color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}
                                  variant="outlined"
                                />
                              </Stack>
                            </Box>
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.secondary.main, 0.18), color: theme.palette.secondary.main }}>
                                <AccessTimeFilled fontSize="small" />
                              </Avatar>
                              <Typography variant="caption" color={overdue ? 'error.main' : 'text.secondary'}>
                                {overdue
                                  ? 'Overdue'
                                  : dueIn === null
                                    ? 'No due'
                                    : dueIn === 0
                                      ? 'Today'
                                      : `${dueIn} day${dueIn === 1 ? '' : 's'}`}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
};

export default UserTasks;
