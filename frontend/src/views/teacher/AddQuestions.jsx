import React from 'react';
import { Typography, Box, Divider } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import AddQuestionForm from './components/AddQuestionForm';
import BrandBackground from 'src/components/shared/BrandBackground';

const AddQuestions = () => {
  return (
    <PageContainer title="Add Questions" description="Create and manage exam questions">
      <BrandBackground>
        <Box
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            boxShadow: (theme) => theme.shadows[6],
            borderRadius: 4,
            background: (theme) => theme.palette.background.paper,
            p: { xs: 2, md: 6 },
            mb: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              mb: 2,
              letterSpacing: 1,
            }}
          >
            Add Questions
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
            Fill out the form below to add a new question to your exam.
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <DashboardCard
            // title={
            //   <Typography
            //     variant="h6"
            //     sx={{
            //       color: 'primary.main',
            //       fontWeight: 700,
            //       letterSpacing: 0.5,
            //     }}
            //   >
            //     Question Form
            //   </Typography>
            // }
            sx={{ p: { xs: 1, md: 3 } }}
          >
            <AddQuestionForm />
          </DashboardCard>
        </Box>
      </BrandBackground>
    </PageContainer>
  );
};

export default AddQuestions;
