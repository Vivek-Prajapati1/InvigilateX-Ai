import React from 'react';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}) => {

  return (
    <Card
      sx={{
        p: 0,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        boxShadow: (theme) => theme.shadows[2],
        backgroundColor: (theme) => theme.palette.background.paper,
      }}
      elevation={0}
      variant={undefined}
    >
      {cardheading ? (
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" color="primary.main" fontWeight={700}>{headtitle}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p: 3 }}>
          {title ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems={'center'}
              mb={3}
            >
              <Box>
                {title ? <Typography variant="h6" color="primary.main" fontWeight={700}>{title}</Typography> : ''}

                {subtitle ? (
                  <Typography variant="subtitle2" color="text.secondary">
                    {subtitle}
                  </Typography>
                ) : (
                  ''
                )}
              </Box>
              {action}
            </Stack>
          ) : null}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
