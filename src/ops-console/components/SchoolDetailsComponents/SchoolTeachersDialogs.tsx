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
import {
  ContactTarget,
  EnumType,
  TeacherInfo,
} from '../../../common/constants';
import FcInteractPopUp from '../fcInteractComponents/FcInteractPopUp';
import OpsGenericPopup from '../../common/OpsGenericPopup';
import FormCard, { FieldConfig, MessageConfig } from './FormCard';

type SchoolTeachersDialogsProps = {
  currentTeachers?: TeacherInfo;
  deleteClassDisplay: string;
  deleteContactDisplay: string;
  deleteTargetTeacher: TeacherInfo | null;
  editTeacherFields: FieldConfig[];
  editTeacherInitialValues?: Record<string, string>;
  editTeacherMessage?: MessageConfig;
  errorMessage?: MessageConfig;
  handleCloseAddTeacherModal: () => void;
  handleCloseEditTeacherModal: () => void;
  handleConfirmDelete: () => void;
  handleEditTeacherSubmit: (values: Record<string, string>) => void;
  handleTeacherSubmit: (values: Record<string, string>) => void;
  isAddTeacherModalOpen: boolean;
  isDeleting: boolean;
  isDeleteModalOpen: boolean;
  isEditTeacherModalOpen: boolean;
  isSubmitting: boolean;
  isUpdatingClassAssignment: boolean;
  openPopup: boolean;
  popup: {
    open: boolean;
    image: string;
    heading: string;
    text: string;
    autoCloseSeconds: number;
  };
  schoolId: string;
  setIsDeleteModalOpen: (open: boolean) => void;
  setOpenPopup: (open: boolean) => void;
  setPopup: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      image: string;
      heading: string;
      text: string;
      autoCloseSeconds: number;
    }>
  >;
  teacherFormFields: FieldConfig[];
  teacherStatus?: EnumType<'fc_support_level'>;
};

export const SchoolTeachersDialogs = ({
  currentTeachers,
  deleteClassDisplay,
  deleteContactDisplay,
  deleteTargetTeacher,
  editTeacherFields,
  editTeacherInitialValues,
  editTeacherMessage,
  errorMessage,
  handleCloseAddTeacherModal,
  handleCloseEditTeacherModal,
  handleConfirmDelete,
  handleEditTeacherSubmit,
  handleTeacherSubmit,
  isAddTeacherModalOpen,
  isDeleting,
  isDeleteModalOpen,
  isEditTeacherModalOpen,
  isSubmitting,
  isUpdatingClassAssignment,
  openPopup,
  popup,
  schoolId,
  setIsDeleteModalOpen,
  setOpenPopup,
  setPopup,
  teacherFormFields,
  teacherStatus,
}: SchoolTeachersDialogsProps) => (
  <>
    <OpsGenericPopup
      isOpen={popup.open}
      imageSrc={popup.image}
      heading={popup.heading}
      text={popup.text}
      autoCloseSeconds={5}
      onClose={() =>
        setPopup((prev) => ({
          ...prev,
          open: false,
        }))
      }
    />
    <Dialog
      open={isDeleteModalOpen}
      onClose={() => {
        if (isDeleting) return;
        setIsDeleteModalOpen(false);
      }}
      disableEscapeKeyDown={isDeleting}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: 'schoolTeachers-deleteDialogPaper' }}
    >
      <DialogTitle className="schoolTeachers-deleteDialogTitle">
        <Box className="schoolTeachers-deleteDialogTitleLeft">
          <ErrorOutlineIcon className="schoolTeachers-deleteDialogAlertIcon" />
          {t('Delete Teacher?')}
        </Box>

        <IconButton
          size="small"
          onClick={() => setIsDeleteModalOpen(false)}
          disabled={isDeleting}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="schoolTeachers-deleteDialogContent">
        <Typography variant="body2" className="schoolTeachers-deleteDialogText">
          {t(
            "You're about to permanently delete {{name}}'s record. This action cannot be undone.",
            { name: deleteTargetTeacher?.user?.name ?? '' },
          )}
        </Typography>

        {deleteTargetTeacher && (
          <Box className="schoolTeachers-deleteDetails">
            <Typography className="schoolTeachers-deleteName">
              {deleteTargetTeacher.user?.name ?? 'N/A'}
            </Typography>
            <Typography>{deleteClassDisplay || 'N/A'}</Typography>
            <Typography>{deleteContactDisplay}</Typography>
          </Box>
        )}

        <Box className="schoolTeachers-deleteWarning">
          {t('This cannot be reversed. Please be certain.')}
        </Box>
      </DialogContent>

      <DialogActions className="schoolTeachers-deleteDialogActions">
        <Button
          variant="outlined"
          onClick={() => setIsDeleteModalOpen(false)}
          disabled={isDeleting}
          className="schoolTeachers-deleteCancelButton"
        >
          {t('Cancel')}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className="schoolTeachers-deleteConfirmButton"
        >
          {isDeleting ? t('Deleting...') : t('Delete Teacher')}
        </Button>
      </DialogActions>
    </Dialog>

    {openPopup && currentTeachers && (
      <FcInteractPopUp
        teacherData={currentTeachers}
        schoolId={schoolId}
        status={teacherStatus}
        onClose={() => setOpenPopup(false)}
        initialUserType={ContactTarget.TEACHER}
      />
    )}

    <FormCard
      open={isAddTeacherModalOpen}
      title={t('Add New Teacher')}
      submitLabel={isSubmitting ? t('Adding...') : t('Add Teacher')}
      fields={teacherFormFields}
      onClose={handleCloseAddTeacherModal}
      onSubmit={handleTeacherSubmit}
      message={errorMessage}
    />
    <FormCard
      open={isEditTeacherModalOpen}
      title={t('Edit Teacher Details')}
      submitLabel={
        isUpdatingClassAssignment ? t('Saving...') : t('Save Changes')
      }
      fields={editTeacherFields}
      initialValues={editTeacherInitialValues}
      onClose={handleCloseEditTeacherModal}
      onSubmit={handleEditTeacherSubmit}
      message={editTeacherMessage}
    />
  </>
);
