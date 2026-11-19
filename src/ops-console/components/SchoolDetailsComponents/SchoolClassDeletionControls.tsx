import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { t } from 'i18next';
import OpsGenericPopup from '../../common/OpsGenericPopup';
import SchoolClassDeleteDialog from './SchoolClassDeleteDialog';
import { useSchoolClassDeletion } from './useSchoolClassDeletion';

type SchoolClassDeletionControlsProps = {
  deletion: ReturnType<typeof useSchoolClassDeletion>;
};

export default function SchoolClassDeletionControls({
  deletion,
}: SchoolClassDeletionControlsProps) {
  const {
    deleteMessage,
    deleteTargetClass,
    handleConfirmDeleteClass,
    isDeletingClass,
    setDeleteMessage,
    setDeleteTargetClass,
  } = deletion;

  return (
    <>
      <SchoolClassDeleteDialog
        open={Boolean(deleteTargetClass)}
        className={deleteTargetClass?.name ?? ''}
        isDeleting={isDeletingClass}
        onClose={() => setDeleteTargetClass(null)}
        onConfirm={handleConfirmDeleteClass}
      />
      <OpsGenericPopup
        isOpen={Boolean(deleteMessage)}
        heading={
          deleteMessage?.severity === 'error'
            ? t('Cannot Delete Class')
            : t('Class Deleted')
        }
        text={deleteMessage?.text ?? ''}
        primaryButtonText="OK"
        icon={
          deleteMessage?.severity === 'error' ? (
            <ErrorOutlineIcon color="error" fontSize="large" />
          ) : undefined
        }
        onClose={() => setDeleteMessage(null)}
      />
    </>
  );
}
