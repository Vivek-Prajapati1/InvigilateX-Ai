import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Card, Stack, Typography, CircularProgress } from '@mui/material';
import PageContainer from '../../components/container/PageContainer';
import ExamShieldLogo from '../../components/shared/ExamShieldLogo';
import AuthLogin from './auth/AuthLogin';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';

const userValidationSchema = yup.object({
  email: yup
    .string('Enter your email')
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string('Enter your password')
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
});

const initialUserValues = {
  email: '',
  password: '',
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading } ] = useLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [userInfo, navigate]);

  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userValidationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async ({ email, password }) => {
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Login" description="Sign in to InvigilateX-Ai">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
          background: `radial-gradient(1200px 600px at 10% -10%, #41bcba22 0%, transparent 60%),
                       radial-gradient(1200px 600px at 110% 110%, #c52d8422 0%, transparent 60%),
                       linear-gradient(180deg, #0b1220 0%, #0f172a 100%)`,
        }}
      >
        <Card
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 640, // keep in sync with Register for equal size
            borderRadius: 4,
            p: { xs: 3, sm: 4 },
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%)',
            border: '1px solid #e6eef0',
          }}
        >
          <Stack spacing={3} alignItems="center">
            <ExamShieldLogo variant="compact" width={200} height={70} />
            <Stack spacing={0} alignItems="center">
              <Typography variant="h5" fontWeight={800} color="text.primary" textAlign="center">
                Sign in to InvigilateX-Ai
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Secure, AI-proctored exams and coding assessments
              </Typography>
            </Stack>

            <AuthLogin
              formik={formik}
              showExtras={false}
              subtext={
                null
              }
              subtitle={
                <Stack direction="row" spacing={1} justifyContent="center" mt={1}>
                  <Typography color="textSecondary" variant="body2">
                    New to InvigilateX-Ai?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/register"
                    fontWeight={600}
                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                  >
                    Create an account
                  </Typography>
                  {isLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
                </Stack>
              }
            />
          </Stack>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default Login;
