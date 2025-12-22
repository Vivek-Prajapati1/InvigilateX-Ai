import React from 'react';
import { Box } from '@mui/material';

const ExamShieldLogo = ({ 
  variant = 'full', // 'full', 'compact', 'icon'
  width,
  height,
  sx = {},
  ...props 
}) => {
  const getLogoSource = () => {
    switch (variant) {
      case 'compact':
        return '/invigilatex-ai-logo-compact.svg';
      case 'icon':
        return '/invigilatex-ai-icon.svg';
      case 'full':
      default:
        return '/invigilatex-ai-logo.svg';
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'compact':
        return { width: width || 160, height: height || 60 };
      case 'icon':
        return { width: width || 64, height: height || 64 };
      case 'full':
      default:
        return { width: width || 300, height: height || 120 };
    }
  };

  const dimensions = getDefaultDimensions();

  return (
    <Box
      component="img"
      src={getLogoSource()}
      alt="InvigilateX-Ai - AI-Powered Exam Security"
      sx={{
        width: dimensions.width,
        height: dimensions.height,
        objectFit: 'contain',
        ...sx
      }}
      {...props}
    />
  );
};

export default ExamShieldLogo;
