import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { t } from 'i18next';

type SchoolClassDeleteDialogProps = {
  className: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function SchoolClassDeleteDialog({
  className,
  isDeleting,
  onClose,
  onConfirm,
  open,
}: SchoolClassDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      disableEscapeKeyDown={isDeleting}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{t('Delete Class')}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('Are you sure you want to delete this class?')}
        </Typography>
        {className && <Typography variant="body2">{className}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button
          id="school-class-delete-cancel-button"
          className="school-class-delete-cancel-button"
          onClick={onClose}
          disabled={isDeleting}
        >
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          id="school-class-delete-confirm-button"
          className="school-class-delete-confirm-button"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? t('Deleting...') : t('Delete Class')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
