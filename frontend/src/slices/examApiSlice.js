import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const EXAMS_URL = '/api/exams';

// Inject endpoints for the exam slice
export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all exams
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam`,
        method: 'GET',
      }),
    }),
    // Get exams created by current user (for teachers)
    getMyExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/my-exams`,
        method: 'GET',
      }),
    }),
    // Get a single exam by ID
    getExamById: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'GET',
      }),
    }),
    // Create a new exam
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam`,
        method: 'POST',
        body: data,
      }),
    }),
    // Update an existing exam
    updateExam: builder.mutation({
      query: ({ examId, ...data }) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'PUT',
        body: data,
      }),
    }),
    // Get questions for a specific exam
    getQuestions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}/questions`,
        method: 'GET',
      }),
    }),
    // Create a new question for an exam
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions`,
        method: 'POST',
        body: data,
      }),
    }),
    // Update an existing question
    updateQuestion: builder.mutation({
      query: ({ questionId, ...data }) => ({
        url: `${EXAMS_URL}/question/${questionId}`,
        method: 'PUT',
        body: data,
      }),
    }),

    //Delete an exam
    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'POST',
        credentials: 'include',
      }),
    }),
    // Check exam attempts for a student
    checkExamAttempts: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}/attempts`,
        method: 'GET',
      }),
      providesTags: ['ExamAttempts'],
    }),
    // Get exam results by examId
    getExamResults: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/results/exam/${examId}`,
        method: 'GET',
      }),
      providesTags: ['ExamResults'],
    }),
    // Get a single student's exam result for a specific exam
    getStudentExamResult: builder.query({
      query: ({ examId, studentId }) => ({
        url: `${EXAMS_URL}/results/student/${examId}/${studentId}`,
        method: 'GET',
      }),
    }),
    // Get the last submitted exam for the logged-in student
    getLastStudentSubmission: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/last-submission`,
        method: 'GET',
      }),
    }),
    // Get student statistics (completed exams, avg score, etc.)
    getStudentStats: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/student-stats`,
        method: 'GET',
      }),
      providesTags: ['StudentStats'],
    }),
    // Get teacher submissions for all their exams
    getTeacherSubmissions: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/teacher-submissions`,
        method: 'GET',
      }),
      providesTags: ['TeacherSubmissions'],
    }),
    // Get all submissions across all exams (admin/teacher overview)
    getAllSubmissions: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/all-submissions`,
        method: 'GET',
      }),
    }),
    // Submit an exam
    submitExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/submit`,
        method: 'POST',
        body: data,
      }),
      // Invalidate relevant caches when exam is submitted
      invalidatesTags: ['StudentStats', 'TeacherSubmissions', 'ExamResults'],
    }),
    // Update a submission score
    updateSubmissionScore: builder.mutation({
      query: ({ submissionId, score }) => ({
        url: `${EXAMS_URL}/submissions/${submissionId}/score`,
        method: 'PUT',
        body: { score },
      }),
      invalidatesTags: ['TeacherSubmissions', 'ExamResults'],
    }),
    // Approve or revoke cheating logs for a submission
    approveCheatingLogs: builder.mutation({
      query: ({ submissionId, approve }) => ({
        url: `${EXAMS_URL}/submissions/${submissionId}/approve-cheating-logs`,
        method: 'PUT',
        body: { approve },
      }),
      invalidatesTags: ['TeacherSubmissions', 'ExamResults'],
    }),
    // Approve or revoke failure reason display for a submission
    approveFailureReason: builder.mutation({
      query: ({ submissionId, approve }) => ({
        url: `${EXAMS_URL}/submissions/${submissionId}/approve-failure-reason`,
        method: 'PUT',
        body: { approve },
      }),
      invalidatesTags: ['TeacherSubmissions', 'ExamResults'],
    }),
  }),
});

// Export the generated hooks for each endpoint
export const {
  useGetExamsQuery,
  useGetMyExamsQuery,
  useGetExamByIdQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useCheckExamAttemptsQuery,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useDeleteExamMutation,
  useGetExamResultsQuery,
  useSubmitExamMutation,
  useUpdateQuestionMutation,
  useGetStudentExamResultQuery,
  useGetLastStudentSubmissionQuery,
  useGetStudentStatsQuery,
  useGetTeacherSubmissionsQuery,
  useGetAllSubmissionsQuery,
  useUpdateSubmissionScoreMutation,
  useApproveCheatingLogsMutation,
  useApproveFailureReasonMutation,
} = examApiSlice;
