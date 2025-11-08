import React, { useEffect } from "react";
import { Box, Card, Typography, Stack, CircularProgress } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "src/components/container/PageContainer";
import ExamShieldLogo from "src/components/shared/ExamShieldLogo";
import AuthRegister from "./auth/AuthRegister";
import { useFormik } from "formik";
import * as yup from "yup";

import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useRegisterMutation } from "./../../slices/usersApiSlice";
import { setCredentials } from "./../../slices/authSlice";

const userValidationSchema = yup.object({
  name: yup.string().matches(/^[A-Z a-z]+$/).min(2).max(25).required('Please enter your name'),
  email: yup
    .string("Enter your email")
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string("Enter your password")
    .min(6, "Password should be of minimum 6 characters length")
    .required("Password is required"),
  confirm_password: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password"), null], "Password must match"),
  role: yup
    .string()
    .oneOf(["student", "teacher"], "Invalid role")
    .required("Role is required"),
});
const initialUserValues = {
  name: "",
  email: "",
  password: "",
  confirm_password: "",
  role: "student",
};

const Register = () => {
  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userValidationSchema,
    onSubmit: (values, action) => {
      handleSubmit(values);
    },
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [register, { isLoading }] = useRegisterMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate("/");
    }
  }, [navigate, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
  };

  const handleSubmit = async ({
    name,
    email,
    password,
    confirm_password,
    role,
  }) => {
    if (password !== confirm_password) {
      toast.error("Passwords do not match");
    } else {
      try {
        const res = await register({ name, email, password, role }).unwrap();
        dispatch(setCredentials({ ...res }));
        formik.resetForm();

        navigate("/auth/login");
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <PageContainer title="Register" description="Create your InvigilateX-Ai account">
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
            maxWidth: 640, // keep in sync with Login for equal size
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
                Create your InvigilateX-Ai account
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Secure exam delivery with AI proctoring
              </Typography>
            </Stack>

            <AuthRegister
              formik={formik}
              subtext={
                null
              }
              subtitle={
                <Stack direction="row" spacing={1} justifyContent="center" mt={2} alignItems="center">
                  <Typography color="textSecondary" variant="body2">
                    Already have an account?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/login"
                    fontWeight={600}
                    sx={{ textDecoration: 'none', color: 'primary.main' }}
                  >
                    Sign In
                  </Typography>
                  {isLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                </Stack>
              }
            />
          </Stack>
        </Card>
      </Box>
    </PageContainer>
  );
};
export default Register;