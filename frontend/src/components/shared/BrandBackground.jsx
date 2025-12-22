import React from 'react';
import { Box } from '@mui/material';

const BrandBackground = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      background: (theme) => `radial-gradient(1200px 600px at 10% -10%, ${theme.palette.primary.light}15 0%, transparent 60%),
        radial-gradient(1200px 600px at 110% 110%, ${theme.palette.secondary.light}15 0%, transparent 60%),
        ${theme.palette.background.default}`,
      py: 6,
    }}
  >
    {children}
  </Box>
);

export default BrandBackground;
