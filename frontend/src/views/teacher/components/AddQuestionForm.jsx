import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, FormControlLabel, Checkbox, Stack, Select, MenuItem, Typography, Paper, Divider } from '@mui/material';
import swal from 'sweetalert';
import { useCreateQuestionMutation, useGetMyExamsQuery, useGetQuestionsQuery, useUpdateQuestionMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

const AddQuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation();
  const { data: examsData } = useGetMyExamsQuery();
  const { data: examQuestionsData, refetch: refetchExamQuestions } = useGetQuestionsQuery(selectedExamId, { skip: !selectedExamId });

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      setSelectedExamId(examsData[0].examId);
      console.log(examsData[0].examId, 'examsData[0].examId');
    }
  }, [examsData]);

  useEffect(() => {
    if (selectedExamId) {
      refetchExamQuestions();
    }
  }, [selectedExamId, refetchExamQuestions]);

  useEffect(() => {
    if (examQuestionsData) {
      setQuestions(examQuestionsData);
    }
  }, [examQuestionsData]);

  const handleAddOrUpdateQuestion = async () => {
    if (newQuestion.trim() === '' || newOptions.some((option) => option.trim() === '')) {
      swal('', 'Please fill out the question and all options.', 'error');
      return;
    }

    const questionData = {
      question: newQuestion,
      options: newOptions.map((option, index) => ({
        optionText: option,
        isCorrect: correctOptions[index],
      })),
      examId: selectedExamId,
    };

    try {
      if (editingQuestionId) {
        const res = await updateQuestion({ questionId: editingQuestionId, ...questionData }).unwrap();
        if (res) {
          toast.success('Question updated successfully!!!');
        }
      } else {
        const res = await createQuestion(questionData).unwrap();
        if (res) {
          toast.success('Question added successfully!!!');
        }
      }
      refetchExamQuestions();
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setCorrectOptions([false, false, false, false]);
      setEditingQuestionId(null);
    } catch (err) {
      swal('', 'Failed to save question. Please try again.', 'error');
    }
  };

  const handleEditQuestion = (questionObj) => {
    setEditingQuestionId(questionObj._id);
    setNewQuestion(questionObj.question);
    setNewOptions(questionObj.options.map((opt) => opt.optionText));
    setCorrectOptions(questionObj.options.map((opt) => opt.isCorrect));
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
  };

  const handleSubmitQuestions = () => {
    setQuestions([]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
    setEditingQuestionId(null);
    toast.success('Questions submitted (form reset) successfully!');
  };

  return (
    <Box
      sx={{
        background: (theme) => theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: (theme) => theme.shadows[2],
        p: { xs: 3, md: 5 },
        mb: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        maxWidth: 900,
        mx: "auto",
        mt: 2,
      }}
    >
      <Typography
        variant="h5"
        align="center"
        sx={{
          fontWeight: 800,
          color: 'primary.main',
          mb: 1,
          letterSpacing: 0.5,
        }}
      >
        Add & Manage Exam Questions
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" mb={1} sx={{ color: 'secondary.main' }}>
        Select Exam:
      </Typography>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
        <Select
          label="Select Exam"
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setEditingQuestionId(null);
            setNewQuestion('');
            setNewOptions(['', '', '', '']);
            setCorrectOptions([false, false, false, false]);
          }}
          size="small"
          sx={{
            minWidth: 220,
            maxWidth: 300,
            background: (theme) => theme.palette.background.default,
            borderRadius: 2,
          }}
        >
          {examsData &&
            examsData.map((exam) => (
              <MenuItem key={exam.examId} value={exam.examId}>
                {exam.examName}
              </MenuItem>
            ))}
        </Select>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <Typography variant="h6" mb={2} sx={{ color: 'secondary.main' }}>
        Existing Questions:
      </Typography>
      {questions.length === 0 ? (
        <Typography mb={2}>No questions for this exam yet.</Typography>
      ) : (
        questions.map((questionObj, idx) => (
          <Box
            key={questionObj._id}
            sx={{
              mb: 1,
              p: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              background: (theme) => theme.palette.background.default,
              boxShadow: (theme) => theme.shadows[0],
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#070707",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  flex: 1,
                  pr: 2,
                }}
              >
                {`${idx + 1}. ${questionObj.question}`}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleEditQuestion(questionObj)}
                disabled={editingQuestionId !== null}
                sx={{ borderColor: "#c52d84", color: "#c52d84", minWidth: 10 }}
              >
                Edit
              </Button>
            </Stack>
            <Stack direction="row" spacing={2} flexWrap="wrap" mt={1}>
              {questionObj.options.map((option, optionIndex) => (
                <Box
                  key={option._id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    background: option.isCorrect ? "#41bcba22" : "#fff",
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    mr: 1,
                    mb: 1,
                    border: option.isCorrect ? "2px solid #41bcba" : "1px solid #e0e0e0",
                  }}
                >
                  <Checkbox
                    checked={option.isCorrect}
                    disabled
                    sx={{
                      color: option.isCorrect ? "#41bcba" : "#bdbdbd",
                      p: 0.5,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: option.isCorrect ? "#41bcba" : "#333",
                      fontWeight: option.isCorrect ? 700 : 400,
                      ml: 1,
                    }}
                  >
                    {option.optionText}
                  </Typography>
                  {option.isCorrect && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#41bcba",
                        fontWeight: 700,
                        ml: 1,
                        letterSpacing: 1,
                      }}
                    >
                      (Correct)
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        ))
      )}

      <Divider sx={{ mb: 1, background: "#f3e8f7", height: 2, borderRadius: 2 }} />


      <Typography variant="h6" mt={2} mb={2} sx={{ color: "#c52d84" }}>
        {editingQuestionId ? 'Edit Question' : 'Add New Question'}
      </Typography>
      <Box
        sx={{
          mb: 3,
          p: 3,
          border: '2px solid #e0e0e0',
          borderRadius: '9px',
          background: "#f8fafd",
          boxShadow: "0 2px 8px #e0e0e022",
        }}
      >
        <TextField
          label="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 1, background: "#fff", borderRadius: 3 }}
        />

        {newOptions.map((option, index) => (
          <Stack
            key={index}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            mb={1}
          >
            <TextField
              label={`Option ${index + 1}`}
              value={newOptions[index]}
              onChange={(e) => {
                const updatedOptions = [...newOptions];
                updatedOptions[index] = e.target.value;
                setNewOptions(updatedOptions);
              }}
              fullWidth
              sx={{ flex: '70%', background: "#fff", borderRadius: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={correctOptions[index]}
                  onChange={() => handleOptionChange(index)}
                  sx={{ color: "#41bcba" }}
                />
              }
              label={`Correct Option ${index + 1}`}
            />
          </Stack>
        ))}

        <Stack mt={2} direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={handleAddOrUpdateQuestion}
            disabled={isCreating || isUpdating}
            sx={{ background: "#c52d84" }}
          >
            {editingQuestionId ? 'Update Question' : 'Add Question'}
          </Button>
          {editingQuestionId && (
            <Button variant="outlined" onClick={handleCancelEdit} sx={{ borderColor: "#c52d84", color: "#c52d84" }}>
              Cancel Edit
            </Button>
          )}
          <Button variant="contained" onClick={handleSubmitQuestions} sx={{ background: "#41bcba" }}>
            Submit Questions
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default AddQuestionForm;
