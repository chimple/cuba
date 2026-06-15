import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type ReviewCardProps = {
  title: string;
  editStep: number;
  onEditStep: (step: number) => void;
  children: React.ReactNode;
  className?: string;
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  title,
  editStep,
  onEditStep,
  children,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      className={['campaign-review-card', className].filter(Boolean).join(' ')}
    >
      <Box className="campaign-review-card-header">
        <Typography className="campaign-review-card-title">
          {t(title)}
        </Typography>
        <Button
          type="button"
          variant="outlined"
          className="campaign-review-edit-button"
          onClick={() => onEditStep(editStep)}
        >
          {t('Edit')}
        </Button>
      </Box>
      <Box className="campaign-review-card-body">{children}</Box>
    </Box>
  );
};

type ReviewRowProps = {
  label: string;
  value: React.ReactNode;
};

export const ReviewRow: React.FC<ReviewRowProps> = ({ label, value }) => {
  const { t } = useTranslation();

  return (
    <Box className="campaign-review-row">
      <Typography className="campaign-review-row-label">{t(label)}</Typography>
      <Typography className="campaign-review-row-value">{value}</Typography>
    </Box>
  );
};
