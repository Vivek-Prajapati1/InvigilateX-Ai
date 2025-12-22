import React, { useEffect } from 'react';
import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BrandBackground from 'src/components/shared/BrandBackground';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCreateExamMutation, useGetExamByIdQuery, useUpdateExamMutation } from '../../slices/examApiSlice.js';
import { useParams } from 'react-router-dom';

const examValidationSchema = yup.object({
  examName: yup.string().required('Exam Name is required'),
  totalQuestions: yup
    .number()
    .typeError('Total Number of Questions must be a number')
    .integer('Total Number of Questions must be an integer')
    .positive('Total Number of Questions must be positive')
    .required('Total Number of Questions is required'),
  duration: yup
    .number()
    .typeError('Exam Duration must be a number')
    .integer('Exam Duration must be an integer')
    .min(1, 'Exam Duration must be at least 1 minute')
    .required('Exam Duration is required'),
  maxAttempts: yup
    .number()
    .typeError('Max Attempts must be a number')
    .integer('Max Attempts must be an integer')
    .min(1, 'Max Attempts must be at least 1')
    .max(10, 'Max Attempts cannot exceed 10')
    .required('Max Attempts is required'),
  liveDate: yup.date().required('Live Date and Time is required'),
  deadDate: yup.date().required('Dead Date and Time is required'),
  codingQuestions: yup.array().of(
    yup.object().shape({
      question: yup.string().required('Coding Question is required'),
      description: yup.string().required('Question Description is required'),
      duration: yup
        .number()
        .typeError('Duration must be a number')
        .integer('Duration must be an integer')
        .min(1, 'Duration must be at least 1 minute')
        .max(180, 'Duration cannot exceed 180 minutes')
        .required('Question Duration is required'),
    })
  ).min(1, 'At least one coding question is required'),
});

const CreateExamPage = () => {
  const { examId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [updateExam, { isLoading: isUpdating }] = useUpdateExamMutation();
  const { data: examData, isLoading: isExamLoading } = useGetExamByIdQuery(examId, { skip: !examId });

  const initialExamValues = {
    examName: '',
    totalQuestions: '',
    duration: '',
    maxAttempts: 1,
    liveDate: '',
    deadDate: '',
    codingQuestions: [
      {
        question: '',
        description: '',
        duration: 30, // Default 30 minutes
      }
    ],
  };

  const formik = useFormik({
    initialValues: initialExamValues,
    validationSchema: examValidationSchema,
    onSubmit: async (values) => {
      console.log('Form submitted with values:', values);
      console.log('Form errors:', formik.errors);
      console.log('Is form valid:', formik.isValid);
      
      try {
        let examResponse;
        if (examId) {
          console.log('Updating exam with ID:', examId);
          examResponse = await updateExam({ examId, ...values }).unwrap();
          toast.success('Exam updated successfully!');
        } else {
          console.log('Creating new exam');
          examResponse = await createExam(values).unwrap();
          toast.success('Exam created successfully!');
        }

        console.log('Exam Response:', examResponse);
        
        // Reset form with initial values that include one question
        formik.resetForm({
          values: {
            examName: '',
            totalQuestions: '',
            duration: '',
            maxAttempts: 1,
            liveDate: '',
            deadDate: '',
            codingQuestions: [
              {
                question: '',
                description: '',
                duration: 30,
              }
            ],
          }
        });

      } catch (err) {
        console.error('Exam Operation Error:', err);
        toast.error(err?.data?.message || err.error || 'Failed to save exam');
      }
    },
  });

  // Ensure codingQuestions always has at least one question
  useEffect(() => {
    if (!formik.values.codingQuestions || formik.values.codingQuestions.length === 0) {
      formik.setFieldValue('codingQuestions', [{ question: '', description: '', duration: 30 }]);
    }
  }, []);

  useEffect(() => {
    if (examId && examData) {
      console.log('Exam Data for Pre-fill:', examData);
      formik.setValues({
        examName: examData.examName,
        totalQuestions: examData.totalQuestions,
        duration: examData.duration,
        liveDate: examData.liveDate ? new Date(examData.liveDate).toISOString().slice(0, 16) : '',
        deadDate: examData.deadDate ? new Date(examData.deadDate).toISOString().slice(0, 16) : '',
        codingQuestions: examData.codingQuestions && examData.codingQuestions.length > 0 
          ? examData.codingQuestions.map(q => ({
              question: q.question || '',
              description: q.description || '',
              duration: q.duration || 30 // Default to 30 if no duration set
            }))
          : examData.codingQuestion 
            ? [{ 
                question: examData.codingQuestion.question || '', 
                description: examData.codingQuestion.description || '',
                duration: examData.codingQuestion.duration || 30
              }]
            : [{ question: '', description: '', duration: 30 }],
      });
    }
  }, [examId, examData]);

  return (
    <PageContainer title={examId ? "Edit Exam" : "Create Exam"} description={examId ? "Edit an existing exam" : "Create a new exam"}>
      <BrandBackground>
        <Box
          sx={{
            maxWidth: 850,
            mx: 'auto',
            boxShadow: (theme) => theme.shadows[6],
            borderRadius: 4,
            background: (theme) => theme.palette.background.paper,
            p: { xs: 2, md: 4 },
            mb: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              mb: 2,
              letterSpacing: 1,
            }}
          >
            {examId ? 'Edit Exam' : 'Create Exam'}
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{
              color: 'text.secondary',
              mb: 2,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {examId
              ? "Update the details of your exam below."
              : "Fill out the form below to create a new exam."}
          </Typography>
          {isExamLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography>Loading Exam Details...</Typography>
            </Box>
          ) : (
            <Card elevation={0} sx={{ p: 4, width: '100%', maxWidth: '800px', mx: 'auto', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 3, boxShadow: (theme) => theme.shadows[2] }}>
              <ExamForm
                formik={formik}
                title={
                  <Typography variant="h6" textAlign="center" color="primary.main" mb={1} fontWeight={700}>
                    {examId ? 'Edit Exam' : 'Create Exam'}
                  </Typography>
                }
                submitButtonText={examId ? "Update Exam" : "Create Exam"}
              />
            </Card>
          )}
        </Box>
      </BrandBackground>
    </PageContainer>
  );
};

export default CreateExamPage;
