import React from 'react';
import { Typography, Box, Divider } from '@mui/material';
import BrandBackground from 'src/components/shared/BrandBackground';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import CheatingTable from './components/CheatingTable';

const ExamLogPage = () => {
  return (
    <PageContainer title="Exam Logs" description="AI-powered invigilation activity logs">
      <BrandBackground>
        <Box
          sx={{
            maxWidth: 1050,
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
            Exam Log
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
            Review all suspicious activities and logs for your exams below.
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <DashboardCard
            title={
              <Typography
                variant="h5"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                Cheating & Activity Logs
              </Typography>
            }
            sx={{
              borderRadius: 3,
              p: { xs: 1, md: 3 },
            }}
          >
            <CheatingTable />
          </DashboardCard>
        </Box>
      </BrandBackground>
    </PageContainer>
  );
};

export default ExamLogPage;
