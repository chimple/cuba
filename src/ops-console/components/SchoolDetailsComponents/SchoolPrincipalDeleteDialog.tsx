import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { t } from 'i18next';
import { PrincipalInfo } from '../../../common/constants';

const SchoolPrincipalDeleteDialog = ({
  deleteContactDisplay,
  deleteTargetPrincipal,
  handleConfirmDelete,
  isDeleting,
  isOpen,
  onClose,
}: {
  deleteContactDisplay: string;
  deleteTargetPrincipal: PrincipalInfo | null;
  handleConfirmDelete: () => void;
  isDeleting: boolean;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <Dialog
    open={isOpen}
    onClose={() => {
      if (isDeleting) return;
      onClose();
    }}
    disableEscapeKeyDown={isDeleting}
    maxWidth="sm"
    fullWidth
    PaperProps={{ className: 'school-principals-deleteDialogPaper' }}
  >
    <DialogTitle className="school-principals-deleteDialogTitle">
      <Box className="school-principals-deleteDialogTitleLeft">
        <ErrorOutlineIcon className="school-principals-deleteDialogAlertIcon" />
        {t('Delete Principal?')}
      </Box>

      <IconButton size="small" onClick={onClose} disabled={isDeleting}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>

    <DialogContent className="school-principals-deleteDialogContent">
      <Typography
        variant="body2"
        className="school-principals-deleteDialogText"
      >
        {t(
          "You're about to permanently delete {{name}}'s record. This action cannot be undone.",
          { name: deleteTargetPrincipal?.name ?? '' },
        )}
      </Typography>

      {deleteTargetPrincipal && (
        <Box className="school-principals-deleteDetails">
          <Typography className="school-principals-deleteName">
            {deleteTargetPrincipal.name ?? 'N/A'}
          </Typography>
          <Typography>{deleteContactDisplay}</Typography>
        </Box>
      )}

      <Box className="school-principals-deleteWarning">
        {t('This cannot be reversed. Please be certain.')}
      </Box>
    </DialogContent>

    <DialogActions className="school-principals-deleteDialogActions">
      <Button
        variant="outlined"
        onClick={onClose}
        disabled={isDeleting}
        className="school-principals-deleteCancelButton"
      >
        {t('Cancel')}
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={handleConfirmDelete}
        disabled={isDeleting}
        className="school-principals-deleteConfirmButton"
      >
        {isDeleting ? t('Deleting...') : t('Delete Principal')}
      </Button>
    </DialogActions>
  </Dialog>
);

export default SchoolPrincipalDeleteDialog;
