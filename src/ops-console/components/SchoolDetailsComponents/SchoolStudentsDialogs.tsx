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
  StudentInfo,
} from '../../../common/constants';
import FcInteractPopUp from '../fcInteractComponents/FcInteractPopUp';
import OpsGenericPopup from '../../common/OpsGenericPopup';
import FormCard, { FieldConfig, MessageConfig } from './FormCard';
import CardListModal from './CardListModal';
import { getStudentContactValues } from '../../utils/studentContactNumbers';
import type { DisplayStudent } from './SchoolStudents.types';

type PopupState = {
  open: boolean;
  image: string;
  heading: string;
  text: string;
  autoCloseSeconds: number;
};

type SchoolStudentsDialogsProps = {
  addStudentFields: FieldConfig[];
  currentClass: { id: string; name: string } | null;
  deleteTargetStudent: StudentInfo | null;
  editStudentData: StudentInfo | null;
  editStudentFields: FieldConfig[];
  errorMessage?: MessageConfig;
  handleCloseAddStudentModal: () => void;
  handleConfirmDelete: () => void;
  handleEditSubmit: (values: Record<string, string>) => void;
  handleMergeStudents: (student: any) => Promise<void>;
  handleSubmitAddStudentModal: (values: Record<string, string>) => void;
  isAddStudentModalOpen: boolean;
  isDeleting: boolean;
  isDeleteModalOpen: boolean;
  isEditStudentModalOpen: boolean;
  isMergeStudentModalOpen: boolean;
  isMergingStudent: boolean;
  isSubmitting: boolean;
  issTotal: boolean;
  mergeModalClassId: string;
  mergePrimaryStudent: DisplayStudent | null;
  openPopup: boolean;
  popup: PopupState;
  schoolId: string;
  setDeleteTargetStudent: (student: StudentInfo | null) => void;
  setEditStudentData: (student: StudentInfo | null) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
  setIsEditStudentModalOpen: (open: boolean) => void;
  setIsMergeStudentModalOpen: (open: boolean) => void;
  setMergePrimaryStudent: (student: DisplayStudent | null) => void;
  setOpenPopup: (open: boolean) => void;
  setPopup: React.Dispatch<React.SetStateAction<PopupState>>;
  studentData?: StudentInfo;
  studentStatus?: EnumType<'fc_support_level'>;
};

export const SchoolStudentsDialogs = ({
  addStudentFields,
  currentClass,
  deleteTargetStudent,
  editStudentData,
  editStudentFields,
  errorMessage,
  handleCloseAddStudentModal,
  handleConfirmDelete,
  handleEditSubmit,
  handleMergeStudents,
  handleSubmitAddStudentModal,
  isAddStudentModalOpen,
  isDeleting,
  isDeleteModalOpen,
  isEditStudentModalOpen,
  isMergeStudentModalOpen,
  isMergingStudent,
  isSubmitting,
  issTotal,
  mergeModalClassId,
  mergePrimaryStudent,
  openPopup,
  popup,
  schoolId,
  setDeleteTargetStudent,
  setEditStudentData,
  setIsDeleteModalOpen,
  setIsEditStudentModalOpen,
  setIsMergeStudentModalOpen,
  setMergePrimaryStudent,
  setOpenPopup,
  setPopup,
  studentData,
  studentStatus,
}: SchoolStudentsDialogsProps) => (
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
    <FormCard
      open={isAddStudentModalOpen}
      title={
        !issTotal && currentClass
          ? `${t('Add New Student')} - ${currentClass.name}`
          : t('Add New Student')
      }
      submitLabel={isSubmitting ? t('Adding...') : t('Add Student')}
      fields={addStudentFields}
      onClose={handleCloseAddStudentModal}
      onSubmit={handleSubmitAddStudentModal}
      message={errorMessage}
      disabled={isSubmitting}
    />
    <FormCard
      open={isEditStudentModalOpen}
      title={t('Edit Student Details')}
      submitLabel={t('Save Changes')}
      fields={editStudentFields}
      initialValues={{
        studentName: editStudentData?.user?.name ?? '',
        gender: editStudentData?.user?.gender ?? '',
        ageGroup: String(editStudentData?.user?.age ?? ''),
        studentID: editStudentData?.user?.student_id ?? '',
        classAndSection: String(editStudentData?.classWithidname?.id ?? ''),
        phone: getStudentContactValues(editStudentData).join(' / '),
      }}
      onClose={() => {
        setIsEditStudentModalOpen(false);
        setEditStudentData(null);
      }}
      onSubmit={handleEditSubmit}
    />
    <CardListModal
      open={isMergeStudentModalOpen}
      schoolId={schoolId}
      classId={mergeModalClassId}
      primaryStudentId={mergePrimaryStudent?.id}
      onClose={() => {
        setIsMergeStudentModalOpen(false);
        setMergePrimaryStudent(null);
      }}
      onSubmit={handleMergeStudents}
      isSubmitting={isMergingStudent}
    />

    <Dialog
      open={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px', padding: 1 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          fontSize: '18px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorOutlineIcon sx={{ color: '#dc2626', fontSize: 20 }} />
          {t('Delete Student?')}
        </Box>

        <IconButton size="small" onClick={() => setIsDeleteModalOpen(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, textAlign: 'left' }}>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: '#4B5563', textAlign: 'left', width: '100%' }}
        >
          {t(
            "You're about to permanently delete {{name}}'s record. This action cannot be undone.",
            { name: deleteTargetStudent?.user?.name ?? '' },
          )}
        </Typography>
        {deleteTargetStudent && (
          <Box
            sx={{
              background: '#F9FAFB',
              borderRadius: '8px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 1,
              fontSize: 14,
              border: '1px solid #E5E7EB',
            }}
          >
            <Typography>
              {deleteTargetStudent.user.student_id ?? 'N/A'}
            </Typography>
            <Typography>{deleteTargetStudent.user.name}</Typography>
            <Typography>{deleteTargetStudent.user.gender}</Typography>
            <Typography>
              {deleteTargetStudent.parent?.phone ||
                deleteTargetStudent.parent?.email ||
                'N/A'}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            background: '#FEE2E2',
            color: '#B91C1C',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '13px',
            border: '1px solid #FECACA',
          }}
        >
          {t('This cannot be reversed. Please be certain.')}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setIsDeleteModalOpen(false)}
          sx={{
            textTransform: 'none',
            borderRadius: '6px',
            color: 'black',
            borderColor: '#807c7b5b',
          }}
        >
          {t('Cancel')}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 500 }}
        >
          {isDeleting ? t('Deleting...') : t('Delete Student')}
        </Button>
      </DialogActions>
    </Dialog>

    {openPopup && studentData && (
      <FcInteractPopUp
        studentData={studentData}
        schoolId={schoolId}
        status={studentStatus}
        onClose={() => setOpenPopup(false)}
        initialUserType={ContactTarget.STUDENT}
      />
    )}
  </>
);
