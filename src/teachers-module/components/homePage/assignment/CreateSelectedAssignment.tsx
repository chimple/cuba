import { useCreateSelectedAssignment } from '../../../hooks/useCreateSelectedAssignment';
import { CreateSelectedAssignmentSuccessDialog } from './CreateSelectedAssignmentSuccessDialog';
import './CreateSelectedAssignment.css';

const CreateSelectedAssignment = (props: Parameters<typeof useCreateSelectedAssignment>[0]) => {
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
    setGroupWiseStudents,
    setShowEndDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    showStartDatePicker,
    startDate,
    t,
    toggleCollapse,
    toggleSelectAll,
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
        <section className="assignments-list">
          <div className="select-all">
            <label>{t('Select All')}</label>
            <input
              className="select-all-checkbox"
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
          </div>
          {Object.keys(groupWiseStudents).map((category) => (
            <div
              key={category}
              className={`assignment-category ${category
                .replace(' ', '-')
                .toLowerCase()}`}
            >
              <div
                className="category-header"
                style={{
                  backgroundColor: groupWiseStudents[category].color,
                }}
                onClick={() => toggleCollapse(category)}
              >
                <h4>{groupWiseStudents[category].title}</h4>
                <div className="select-all">
                  <div className="select-all-student-count">
                    {
                      groupWiseStudents[category].students.filter(
                        (student) => student.selected,
                      ).length
                    }
                    /{groupWiseStudents[category].students.length}
                  </div>
                  <img
                    src={
                      groupWiseStudents[category].isCollapsed
                        ? 'assets/icons/iconDown.png'
                        : 'assets/icons/iconUp.png'
                    }
                    alt="toggle-icon"
                    style={{ width: '15px', height: '15px' }}
                  />
                  <input
                    className="select-all-checkbox"
                    type="checkbox"
                    checked={
                      groupWiseStudents[category].students.length > 0
                        ? groupWiseStudents[category].students.every(
                            (student) => student.selected,
                          )
                        : true
                    }
                    // checked={true}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      if (isInteractionLocked) {
                        return;
                      }

                      const allSelected = groupWiseStudents[
                        category
                      ].students.every(
                        (student) => student.selected,
                      );
                      setGroupWiseStudents(
                        (bandStudents) => {
                          const updatedStudents = bandStudents[
                            category
                          ].students.map((student) => ({
                            ...student,
                            selected: !allSelected,
                          }));

                          return {
                            ...bandStudents,
                            [category]: {
                              ...bandStudents[category],
                              students: updatedStudents,
                            },
                          };
                        },
                      );
                    }}
                  />
                </div>
              </div>
              {!groupWiseStudents[category].isCollapsed && (
                <ul className="students-list">
                  {groupWiseStudents[category].students.map(
                    (student, index) => (
                      <div>
                        <li key={index} className="student-item">
                          <span>{student.name}</span>
                          <input
                            className="student-item-checkbox"
                            type="checkbox"
                            checked={student.selected}
                            onChange={() =>
                              toggleStudentSelection(category, index)
                            }
                          />
                        </li>
                        <hr className="students-list-styled-line" />
                      </div>
                    ),
                  )}
                </ul>
              )}
            </div>
          ))}
        </section>

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
          className="assign-selected-button"
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
