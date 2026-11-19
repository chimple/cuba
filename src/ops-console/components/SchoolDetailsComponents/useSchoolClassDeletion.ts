import { useState } from 'react';
import { t } from 'i18next';
import type { ClassRow } from './SchoolClass.types';

const CLASS_HAS_CONNECTED_USERS_MESSAGE =
  'Cannot delete this class because students or teachers are still connected to it. Please remove or migrate them to a different class before deleting the class.';

type DeleteMessage = {
  severity: 'error' | 'success';
  text: string;
};

type ClassDeletionApi = {
  deleteClass: (classId: string) => Promise<void>;
  getStudentsForClass: (classId: string) => Promise<unknown[]>;
  getTeachersForClass: (classId: string) => Promise<unknown[] | undefined>;
};

type UseSchoolClassDeletionProps = {
  api: ClassDeletionApi;
  refreshClasses?: () => void;
};

export function useSchoolClassDeletion({
  api,
  refreshClasses,
}: UseSchoolClassDeletionProps) {
  const [deleteTargetClass, setDeleteTargetClass] = useState<ClassRow | null>(
    null,
  );
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [deletedClassIds, setDeletedClassIds] = useState<Set<string>>(
    new Set(),
  );
  const [deleteMessage, setDeleteMessage] = useState<DeleteMessage | null>(
    null,
  );

  const handleDeleteClass = async (classRow: ClassRow) => {
    try {
      const [students, teachers] = await Promise.all([
        api.getStudentsForClass(classRow.id),
        api.getTeachersForClass(classRow.id),
      ]);
      if (students.length > 0 || (teachers?.length ?? 0) > 0) {
        setDeleteMessage({
          severity: 'error',
          text: t(CLASS_HAS_CONNECTED_USERS_MESSAGE),
        });
        return;
      }

      setDeleteTargetClass(classRow);
    } catch {
      setDeleteMessage({
        severity: 'error',
        text: t(
          'Unable to check students or teachers for this class. Please try again.',
        ),
      });
    }
  };

  const handleConfirmDeleteClass = async () => {
    if (!deleteTargetClass) return;

    setIsDeletingClass(true);
    try {
      await api.deleteClass(deleteTargetClass.id);
      setDeletedClassIds((previous) =>
        new Set(previous).add(deleteTargetClass.id),
      );
      setDeleteTargetClass(null);
      setDeleteMessage({
        severity: 'success',
        text: t('Class deleted successfully.'),
      });
      refreshClasses?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      setDeleteMessage({
        severity: 'error',
        text: errorMessage.includes('CLASS_HAS_ACTIVE_STUDENTS_OR_TEACHERS')
          ? t(CLASS_HAS_CONNECTED_USERS_MESSAGE)
          : t('Unable to delete this class. Please try again.'),
      });
      setDeleteTargetClass(null);
    } finally {
      setIsDeletingClass(false);
    }
  };

  return {
    deleteMessage,
    deleteTargetClass,
    deletedClassIds,
    handleConfirmDeleteClass,
    handleDeleteClass,
    isDeletingClass,
    setDeleteMessage,
    setDeleteTargetClass,
  };
}
