import { IonAlert, IonIcon } from '@ionic/react';
import { t } from 'i18next';
import { checkmarkCircle } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { TableTypes } from '../../common/constants';
import CachedImage from '../../components/common/CachedImage';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import logger from '../../utility/logger';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';
import './DisplaySubjects.css';

interface CurriculumWithCourses {
  curriculum: { id: string; name: string; grade?: string };
  courses: TableTypes<'course'>[];
}

interface DisplaySubjectsProps {
  curriculumsWithCourses: CurriculumWithCourses[];
  selectedSubjects: string[];
  onSubjectClick: (subject: string) => void;
  onRemoveSubject: (subject: string) => void;
  isModalOpen: boolean;
  currentSubject: string | null;
  setIsModalOpen: (open: boolean) => void;
  schoolId?: string;
}

const DisplaySubjects: React.FC<DisplaySubjectsProps> = ({
  curriculumsWithCourses,
  selectedSubjects,
  onSubjectClick,
  onRemoveSubject,
  isModalOpen,
  currentSubject,
  setIsModalOpen,
  schoolId,
}) => {
  // State to track whether the last subject warning should be shown
  const [isLastSubjectAlertOpen, setIsLastSubjectAlertOpen] = useState(false);
  const [canModify, setCanModify] = useState(true);
  const isTeacherSchoolMode = schoolUtil.isTeacherSchoolMode();
  const roleMap = useAppSelector(
    (state: RootState) =>
      state.growthbook.attributes?.roleMap as
        | Record<string, string>
        | undefined,
  );

  useEffect(() => {
    const selectedSchoolId = Util.getCurrentSchool()?.id;
    const activeSchoolRole = selectedSchoolId
      ? roleMap?.[`${selectedSchoolId}_role`]
      : undefined;
    const normalizedRole = (activeSchoolRole ?? '').toLowerCase();
    const schoolMatches =
      !schoolId || !selectedSchoolId || schoolId === selectedSchoolId;
    setCanModify(
      !isTeacherSchoolMode &&
        schoolMatches &&
        normalizedRole === RoleType.PRINCIPAL,
    );
  }, [isTeacherSchoolMode, roleMap, schoolId]);

  // Trigger subject removal logic
  const triggerRemoveSubject = (subject: string) => {
    if (!canModify) return;
    if (selectedSubjects.length === 1) {
      // If only one subject is left, show the "cannot delete" alert
      setIsLastSubjectAlertOpen(true);
      logger.debug('Cannot delete the last remaining subject.');
    } else {
      // Otherwise, proceed with the removal confirmation
      onSubjectClick(subject); // Set the current subject
      setIsModalOpen(true); // Open the confirmation modal
      logger.debug('Delete confirmation triggered for subject:', subject);
    }
  };

  // Handle subject removal
  const handleRemoveSubject = () => {
    if (currentSubject) {
      onRemoveSubject(currentSubject); // Remove the subject
      logger.debug('Subject removed:', currentSubject);
    }
    setIsModalOpen(false); // Close the modal after removal
  };

  return (
    <div className="display-subject-curriculum-container">
      <div className="display-subject-header">
        <h3 className="main-title-in-display-subject-page">{t('Subjects')}</h3>
        <p className="sub-title-in-display-subject-page">
          {t('Below are the chosen subjects')}
        </p>
      </div>

      {selectedSubjects.length > 0 ? (
        curriculumsWithCourses.map(({ curriculum, courses }) => {
          const selectedCourses = courses.filter((course) =>
            selectedSubjects.includes(course.id),
          );
          if (selectedCourses.length === 0) return null;
          return (
            <div
              key={`${curriculum.id}-${curriculum.grade}`}
              className="display-subject-curriculum-section"
            >
              <div className="display-subject-curriculum-header">
                {curriculum.name} {curriculum.grade}
              </div>
              {selectedCourses.map((course) => (
                <div
                  key={course.id}
                  className={
                    'subject-item-in-display-subject-page selected-subject' +
                    (canModify ? '' : ' disabled-subject')
                  }
                  onClick={() => triggerRemoveSubject(course.id)}
                  style={{ cursor: canModify ? 'pointer' : 'not-allowed' }}
                >
                  <div className="display-subject-name">
                    <CachedImage
                      src={course?.image || 'assets/icons/DefaultIcon.png'}
                      alt={course.name || 'Default Subject Icon'}
                      className="subject-icon-in-display-subject-page"
                    />
                    <span> {t(course.name)}</span>
                  </div>
                  {canModify && (
                    <IonIcon
                      icon={checkmarkCircle}
                      className="display-subIcon"
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })
      ) : (
        <p className="no-subjects-message">{t('No selected subjects')}</p>
      )}

      {/* Confirmation Alert for Multiple Subjects */}
      <IonAlert
        isOpen={isModalOpen}
        onDidDismiss={() => setIsModalOpen(false)}
        header={t('Remove Subject') || ''}
        message={t('Are you sure you want to remove this subject?') || ''}
        cssClass="custom-alert"
        buttons={[
          {
            text: t('Cancel') || '',
            role: 'cancel',
            cssClass: 'alert-cancel-button',
            handler: () => {
              setIsModalOpen(false); // Close the modal on cancel
            },
          },
          {
            text: t('Remove') || '',
            cssClass: 'alert-remove-button',
            handler: () => {
              handleRemoveSubject(); // Call the remove handler
            },
          },
        ]}
      />

      {/* Alert for Last Subject Deletion Restriction */}
      <IonAlert
        isOpen={isLastSubjectAlertOpen}
        onDidDismiss={() => setIsLastSubjectAlertOpen(false)}
        header={t('Action Not Allowed') || ''}
        message={
          t(
            'The Subject you have chosen is the last one left and cannot be deleted',
          ) || ''
        }
        cssClass="custom-alert"
        buttons={[
          {
            text: t('OK') || '',
            cssClass: 'alert-ok-button',
            handler: () => {
              setIsLastSubjectAlertOpen(false); // Close the alert
              logger.debug('Last subject alert closed.');
            },
          },
        ]}
      />
    </div>
  );
};

export default DisplaySubjects;
