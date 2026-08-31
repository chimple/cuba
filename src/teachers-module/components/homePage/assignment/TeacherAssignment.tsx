import { FC } from 'react';
import { t } from 'i18next';
import Loading from '../../../../components/Loading';
import AssignmentNextButton from './AssignmentNextButton';
import TeacherAssignmentSection from './TeacherAssignmentSection';
import {
  TeacherAssignmentPageType,
  useTeacherAssignment,
} from '../../../hooks/useTeacherAssignment';
import './TeacherAssignment.css';

declare global {
  interface Window {
    __qrBackListener?: { remove: () => void } | null;
  }
}

const TeacherAssignment: FC<{
  onLibraryClick: () => void;
  autoStartScan?: boolean;
  onScanHandled?: () => void;
  onUnavailableQr: () => void;
}> = ({ onLibraryClick, autoStartScan, onScanHandled, onUnavailableQr }) => {
  const assignment = useTeacherAssignment({
    autoStartScan,
    onScanHandled,
    onUnavailableQr,
  });
  const assignmentCount =
    assignment.selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
    assignment.selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED]
      .count;

  return (
    <>
      {assignment.loading ? (
        <Loading isLoading={assignment.loading} />
      ) : (
        <div className="teacher-assignments-page">
          <p id="assignment-page-heading">{t('Assignments')}</p>
          <TeacherAssignmentSection
            assignments={assignment.manualAssignments}
            collapsed={assignment.manualCollapsed}
            controls={assignment}
            heading="Manual Assignments"
            id="manual-assignments"
            onLibraryClick={onLibraryClick}
            setAssignments={assignment.setManualAssignments}
            setCollapsed={assignment.setManualCollapsed}
            showEmptyActions
            startScan={assignment.startScan}
            type={TeacherAssignmentPageType.MANUAL}
          />
          <TeacherAssignmentSection
            assignments={assignment.recommendedAssignments}
            collapsed={assignment.recommendedCollapsed}
            controls={assignment}
            heading="Recommended Assignments"
            id="recommended-assignments"
            setAssignments={assignment.setRecommendedAssignments}
            setCollapsed={assignment.setRecommendedCollapsed}
            type={TeacherAssignmentPageType.RECOMMENDED}
          />
          <AssignmentNextButton
            assignmentCount={assignmentCount}
            onClickCallBack={assignment.goToSelectedAssignments}
          />
        </div>
      )}
    </>
  );
};

export default TeacherAssignment;
export { TeacherAssignmentPageType };
