import { useCreateSelectedAssignment } from '../../../hooks/useCreateSelectedAssignment';
import { CreateSelectedAssignmentSuccessDialog } from './CreateSelectedAssignmentSuccessDialog';
import {
  getTrackableProps,
  TRACKABLE_IDS,
} from '../../../../analytics/trackable';
import CreateSelectedAssignmentStudentList from './CreateSelectedAssignmentStudentList';
import './CreateSelectedAssignment.css';

const CreateSelectedAssignment = (
  props: Parameters<typeof useCreateSelectedAssignment>[0],
) => {
  const viewProps = useCreateSelectedAssignment(props);

  const {
    CalendarPicker,
    IonIcon,
    Loading,
    Trans,
    addDays,
    addMonths,
    allSelected,
    assignButtonRef,
    calendarOutline,
    createAssignmentsForStudents,
    endDate,
    format,
    groupWiseStudents,
    handleDateConfirm,
    isInteractionLocked,
    isLoading,
    maxEndDate,
    rewardAnimation,
    rewardIndicatorRef,
    selectedAssignments,
    setShowEndDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    showStartDatePicker,
    startDate,
    t,
    toggleCollapse,
    toggleSelectAll,
    toggleStudentGroupSelection,
    toggleStudentSelection,
  } = viewProps;

  return !isLoading ? (
    <div
      className={`assignments-container ${
        isInteractionLocked ? 'assignment-interaction-lock-active' : ''
      }`.trim()}
    >
      {isInteractionLocked && (
        <div
          className="assignment-interaction-lock-overlay"
          aria-hidden="true"
        />
      )}
      <CreateSelectedAssignmentSuccessDialog {...viewProps} />
      <div>
        <p id="create-assignment-heading">{t('Assignments')}</p>
        <section className="assignments-dates">
          <span style={{ color: '#4A4949', fontSize: '11px' }}>
            <Trans i18nKey="assignments_date_message" />
          </span>
          <div className="date-created-assignment">
            <div>
              <b>{t('Start Date')}</b>
              <div className="createselectAssignmentDate-input">
                {showStartDatePicker ? (
                  <CalendarPicker
                    value={startDate}
                    onConfirm={(date) => handleDateConfirm('start', date)}
                    onCancel={() => setShowStartDatePicker(false)}
                    mode="start"
                    minDate={new Date().toISOString().split('T')[0]}
                    maxDate={maxEndDate}
                  />
                ) : (
                  <span
                    onClick={() => {
                      if (isInteractionLocked) {
                        return;
                      }
                      setShowStartDatePicker(true);
                    }}
                  >
                    {startDate}
                  </span>
                )}
                <IonIcon icon={calendarOutline} size={'2vw'} />
              </div>
            </div>
            <div className="vertical-line"></div>
            <div>
              <b>{t('End Date')}</b>
              <div className="createselectAssignmentDate-input">
                {showEndDatePicker ? (
                  <CalendarPicker
                    value={endDate}
                    onConfirm={(date) => handleDateConfirm('end', date)}
                    onCancel={() => setShowEndDatePicker(false)}
                    mode="end"
                    minDate={
                      startDate
                        ? format(addDays(new Date(startDate), 1), 'yyyy-MM-dd')
                        : format(addDays(new Date(), 1), 'yyyy-MM-dd')
                    }
                    maxDate={format(
                      addMonths(new Date(startDate), 1),
                      'yyyy-MM-dd',
                    )}
                    startDate={startDate}
                  />
                ) : (
                  <span
                    onClick={() => {
                      if (isInteractionLocked) {
                        return;
                      }
                      setShowEndDatePicker(true);
                    }}
                  >
                    {endDate}
                  </span>
                )}
                <IonIcon icon={calendarOutline} />
              </div>
            </div>
          </div>
        </section>
        <CreateSelectedAssignmentStudentList
          allSelected={allSelected}
          groupWiseStudents={groupWiseStudents}
          toggleCollapse={toggleCollapse}
          toggleSelectAll={toggleSelectAll}
          toggleStudentGroupSelection={toggleStudentGroupSelection}
          toggleStudentSelection={toggleStudentSelection}
        />

        {rewardAnimation.visible && (
          <div
            ref={rewardIndicatorRef}
            className={`assign-reward-indicator ${rewardAnimation.isFlying ? 'is-rlying' : ''}`}
            style={{
              left: `${rewardAnimation.x}px`,
              top: `${rewardAnimation.y}px`,
              transform: `translate(${rewardAnimation.deltaX}px, ${rewardAnimation.deltaY}px)`,
            }}
          >
            <span>{rewardAnimation.label}</span>
            <img
              src="assets/icons/coinIcon.png"
              className="assign-reward-coin-icon"
              alt=""
            />
          </div>
        )}

        <button
          ref={assignButtonRef}
          id={TRACKABLE_IDS.TEACHER_ASSIGN_SUBMIT_BUTTON}
          {...getTrackableProps(TRACKABLE_IDS.TEACHER_ASSIGN_SUBMIT_BUTTON)}
          className={`assign-selected-button ${TRACKABLE_IDS.TEACHER_ASSIGN_SUBMIT_BUTTON}`}
          disabled={
            (selectedAssignments.length ?? 0) > 0 || isInteractionLocked
          }
          onClick={createAssignmentsForStudents}
        >
          {t('Assign')}
        </button>
      </div>
    </div>
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default CreateSelectedAssignment;
