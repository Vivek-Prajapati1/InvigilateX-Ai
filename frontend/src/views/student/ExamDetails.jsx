import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Radio,
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Slide,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import { uniqueId } from 'lodash';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetQuestionsQuery } from 'src/slices/examApiSlice';
import {
  Quiz as QuizIcon,
  Timer as TimerIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const DescriptionAndInstructions = () => {
  const [certify, setCertify] = useState(false);
  const [hoveredInstruction, setHoveredInstruction] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { examId } = useParams();
  const { data: questions, isLoading, isError, error } = useGetQuestionsQuery(examId);
  const [examWindowError, setExamWindowError] = useState('');

  useEffect(() => {
    setShowContent(true);
    // Simulate progress for visual effect
    const timer = setInterval(() => {
      setProgressValue((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 100);

    // Handle scroll for back to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isError) {
      const errMsg = error?.data?.message || error?.error || 'Unable to load exam. Please try again later.';
      setExamWindowError(errMsg);
    } else {
      setExamWindowError('');
    }
  }, [isError, error]);

  const testId = uniqueId();
  
  const handleCertifyChange = () => {
    setCertify(!certify);
  };

  const handleTest = () => {
    // If getQuestions was blocked due to window, show message
    if (examWindowError) {
      toast.error(examWindowError);
      return;
    }
    navigate(`/exam/${examId}/${testId}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skillTags = ['Python', 'MCQ', 'Beginner', 'Programming', 'Assessment', 'Coding Skills'];
  
  const examStats = [
    { icon: <QuizIcon />, label: 'Total Questions', value: questions ? questions.length.toString() : '40' },
    { icon: <TimerIcon />, label: 'Duration', value: '30 min' },
    { icon: <SchoolIcon />, label: 'Level', value: 'Beginner' },
    { icon: <SecurityIcon />, label: 'Proctored', value: 'Yes' },
  ];

  const instructions = [
    {
      icon: <QuizIcon color="primary" />,
      text: 'This Practice Test consists of only MCQ questions.',
      highlight: 'MCQ questions'
    },
    {
      icon: <TimerIcon color="warning" />,
      text: `There are a total of ${questions ? questions.length : '40'} questions. Test Duration is 30 minutes.`,
      highlight: `${questions ? questions.length : '40'} questions, 30 minutes`
    },
    {
      icon: <WarningIcon color="error" />,
      text: 'There is Negative Marking for wrong answers.',
      highlight: 'Negative Marking'
    },
    {
      icon: <SecurityIcon color="error" />,
      text: 'Do Not switch tabs while taking the test. Switching Tabs will Block / End the test automatically.',
      highlight: 'Do Not switch tabs'
    },
    {
      icon: <SecurityIcon color="primary" />,
      text: 'The test will only run in full screen mode. Do not switch back to tab mode. Test will end automatically.',
      highlight: 'full screen mode'
    },
    {
      icon: <AssessmentIcon color="info" />,
      text: 'You may need to use blank sheets for rough work. Please arrange for blank sheets before starting.',
      highlight: 'blank sheets'
    },
    {
      icon: <CheckCircleIcon color="success" />,
      text: 'Clicking on Back or Next will save the answer.',
      highlight: 'save the answer'
    },
    {
      icon: <CheckCircleIcon color="info" />,
      text: 'Questions can be reattempted till the time test is running.',
      highlight: 'reattempted'
    },
    {
      icon: <CheckCircleIcon color="primary" />,
      text: 'Click on the finish test once you are done with the test.',
      highlight: 'finish test'
    },
    {
      icon: <CheckCircleIcon color="success" />,
      text: 'You will be able to view the scores once your test is complete.',
      highlight: 'view the scores'
    },
  ];

  return (
    <Box sx={{ p: 3, maxHeight: '100vh', overflowY: 'auto' }}>
      {/* Loading Progress */}
      <Fade in={progressValue < 100} timeout={500}>
        <Box sx={{ mb: 0 }}>
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
                borderRadius: 3,
              }
            }} 
          />
        </Box>
      </Fade>

      <Slide direction="down" in={showContent} timeout={600}>
        <Box>
          {/* Header Section */}
          <Box sx={{ mb: 0, mt: 5 }}>
            <Zoom in={showContent} timeout={1000}>
              <Typography 
                variant="h3" 
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  mb: 2,
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
               Welcome To InvigilateX-Ai
              </Typography>
            </Zoom>
            
            {/* Exam Statistics Cards */}
            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
              {examStats.map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Zoom in={showContent} timeout={1200 + index * 200}>
                    <Card 
                      sx={{ 
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${
                          index % 4 === 0 ? '#667eea 0%, #764ba2 100%' :
                          index % 4 === 1 ? '#f093fb 0%, #f5576c 100%' :
                          index % 4 === 2 ? '#4facfe 0%, #00f2fe 100%' :
                          '#43e97b 0%, #38f9d7 100%'
                        })`,
                        color: 'white',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: isMobile ? 'scale(1.02)' : 'translateY(-8px) scale(1.02)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <CardContent sx={{ py: isMobile ? 1.5 : 2 }}>
                        <Box sx={{ mb: 1, fontSize: isMobile ? '1.5rem' : '2rem' }}>
                          {stat.icon}
                        </Box>
                        <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 'bold' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption">
                          {stat.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Description Section */}
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Description
                </Typography>
              </Box>
              
              {isLoading ? (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading exam details...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, color: 'text.secondary' }}>
                    This practice test will allow you to measure your Python skills at the beginner level by
                    the way of various multiple choice questions. We recommend you to score at least{' '}
                    <Chip label="75%" color="success" size="small" sx={{ mx: 0.5 }} />
                    in this test before moving to the next level questionnaire. It will help you in identifying
                    your strength and development areas. Based on the same you can plan your next steps in
                    learning Python and preparing for job placements.
                  </Typography>

                  {questions && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      This exam contains {questions.length} questions. Good luck!
                    </Alert>
                  )}
                  {!questions && !isLoading && examWindowError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {examWindowError}
                    </Alert>
                  )}
                </>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {skillTags.map((tag, index) => (
                  <Chip 
                    key={index}
                    label={`#${tag}`}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      }
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Instructions Section */}
          <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  Test Instructions
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {instructions.map((instruction, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      mb: 2,
                      backgroundColor: hoveredInstruction === index ? 'action.hover' : 'transparent',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      cursor: 'default',
                      border: '1px solid',
                      borderColor: hoveredInstruction === index ? 'primary.main' : 'divider',
                    }}
                    onMouseEnter={() => setHoveredInstruction(index)}
                    onMouseLeave={() => setHoveredInstruction(null)}
                  >
                    <Box sx={{ mr: 2 }}>
                      {instruction.icon}
                    </Box>
                    <ListItemText>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {index + 1}.
                        </Box>
                        {' '}
                        {instruction.text.replace(instruction.highlight, '')}
                        <Box component="span" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                          {instruction.highlight}
                        </Box>
                        {instruction.text.split(instruction.highlight)[1]}
                      </Typography>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Confirmation Section */}
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  Confirmation
                </Typography>
              </Box>
              
              <Alert 
                severity="warning" 
                sx={{ mb: 1, borderRadius: 2 }}
                icon={<SecurityIcon />}
              >
                <Typography variant="body1">
                  Your actions shall be proctored and any signs of wrongdoing may lead to suspension or
                  cancellation of your test.
                </Typography>
              </Alert>
              
              <Divider sx={{ my: 3 }} />
              
              <Stack direction="column" alignItems="center" spacing={3}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={certify} 
                      onChange={handleCertifyChange} 
                      color="primary"
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: 28,
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      I certify that I have carefully read and agree to all of the instructions mentioned above
                    </Typography>
                  }
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      color: certify ? 'success.main' : 'text.secondary',
                      transition: 'color 0.2s',
                    }
                  }}
                />
                
                <Box sx={{ position: 'relative' }}>
                  <Zoom in={showContent} timeout={2000}>
                    <Button
                      onClick={handleTest}
                      disabled={!certify}
                      variant="contained"
                      size="large"
                      sx={{
                        py: 2,
                        px: 6,
                        borderRadius: 50,
                        background: certify 
                          ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                          : 'grey.300',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover': {
                          transform: certify ? 'translateY(-3px) scale(1.05)' : 'none',
                          boxShadow: certify ? '0 10px 30px rgba(33, 150, 243, 0.4)' : 1,
                          '&:before': {
                            left: '100%',
                          }
                        },
                        '&:disabled': {
                          color: 'grey.500',
                          transform: 'none',
                        }
                      }}
                      startIcon={<PlayArrowIcon />}
                    >
                      Start Test
                    </Button>
                  </Zoom>
                  
                  <Fade in={!certify} timeout={500}>
                    <Typography 
                      variant="caption" 
                      color="error"
                      sx={{ 
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        mt: 1,
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                    >
                      Please accept the terms to continue
                    </Typography>
                  </Fade>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Slide>

      {/* Floating Action Button for Scroll to Top */}
      <Fade in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              transform: 'scale(1.1)',
            }
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Fade>
    </Box>
  );
};

const imgUrl =
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';

export default function ExamDetails() {
  return (
    <Grid>
     
        <DescriptionAndInstructions />
      </Grid>
    
  );
}
