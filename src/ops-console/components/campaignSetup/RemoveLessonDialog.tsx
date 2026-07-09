import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

type RemoveLessonDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const RemoveLessonDialog: React.FC<RemoveLessonDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Remove lesson</DialogTitle>
    <DialogContent>
      Are you sure you want to remove this lesson from the schedule?
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onConfirm}>
        Remove
      </Button>
    </DialogActions>
  </Dialog>
);
