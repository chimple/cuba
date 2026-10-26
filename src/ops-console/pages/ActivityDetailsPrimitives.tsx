import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export const InfoRow = ({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: React.ReactNode;
}) => (
  <Box
    id={id}
    data-testid={id}
    sx={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      mb: 1,
    }}
  >
    <Typography
      sx={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'text.secondary',
        width: '90px',
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {label}:
    </Typography>
    <Typography
      sx={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'text.primary',
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export const DetailSection = ({
  id,
  label,
  text,
}: {
  id: string;
  label: string;
  text: string;
}) => (
  <Box id={id} data-testid={id} sx={{ mb: 3 }}>
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: '15px',
        mb: 1,
        textAlign: 'left',
      }}
    >
      {label}
    </Typography>
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        bgcolor: '#fafafa',
        fontSize: '14px',
        whiteSpace: 'pre-line',
      }}
    >
      {text || '--'}
    </Paper>
  </Box>
);
