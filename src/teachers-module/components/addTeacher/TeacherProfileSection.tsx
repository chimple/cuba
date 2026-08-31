import { useTeacherProfileSection } from '../../hooks/useTeacherProfileSection';
import './TeacherProfileSection.css';

const TeacherProfileSection = (props: Parameters<typeof useTeacherProfileSection>[0]) => {
  const viewProps = useTeacherProfileSection(props);

  const {
    CalendarPicker,
    Trans,
    assignments,
    endDate,
    format,
    handleDateConfirm,
    joinedDate,
    loading,
    maxEndDate,
    parseFloat,
    setShowEndDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    showStartDatePicker,
    startDate,
    t,
    teacher,
  } = viewProps;

  return (
    <div className="teacher-profile-section">
      <div className="teacher-profile-header">
        <img
          className={teacher.image ? 'teacher-profile-img' : ''}
          src={teacher.image || 'assets/icons/userIcon.png'}
          onError={(e) =>
            ((e.target as HTMLImageElement).src = 'assets/icons/userIcon.png')
          }
        />
        <div className="teacher-inro">
          <div className="teacher-name">{teacher.name}</div>
          <p className="joined-date" style={{ fontSize: '18px' }}>
            {joinedDate ? (
              <>
                <span style={{ fontSize: '14px' }}>{t('Joined Date')} :</span>{' '}
                <span style={{ fontSize: '18px' }}>{joinedDate}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Date selection section */}
      <div className="date-selection">
        <div>
          <span className="teacherprofile-title">
            <Trans i18nKey="assignments_date_message" />
          </span>
        </div>
        <div className="date-icons">
          <div>
            <div>{t('Start Date')}</div>
            <div>
              {startDate ? format(new Date(startDate), 'dd/MM/yyyy') : ''}
            </div>
          </div>
          {/* <IonIcon
            icon={calendarOutline}
            className="calendar-icon"
            onClick={() => setShowStartDatePicker(true)}
          /> */}
          <img
            src="/assets/icons/calender.svg"
            alt="Calendar_Icon"
            onClick={() => setShowStartDatePicker(true)}
            className="calendar-icon"
          />
          <div className="vertical-line"></div>
          <div>
            <div>{t('End Date')}</div>
            <div>{endDate ? format(new Date(endDate), 'dd/MM/yyyy') : ''}</div>
          </div>
          {/* <IonIcon
            icon={calendarOutline}
            className="calendar-icon"
            onClick={() => setShowEndDatePicker(true)}
          /> */}
          <img
            src="/assets/icons/calender.svg"
            alt="Calendar_Icon"
            onClick={() => setShowEndDatePicker(true)}
            className="calendar-icon"
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="text-label">
          <span className="assignment-text"> {t('Assignments')}</span>
          <span className="date-text">
            {format(new Date(startDate), 'dd/MM')}
          </span>
          {' - '}
          <span className="date-text">
            {format(new Date(endDate), 'dd/MM')}
          </span>
        </div>
      )}

      {loading ? (
        <div className="no-data-text">{t('Loading...')}</div>
      ) : assignments.length > 0 ? (
        <div className="assignments-scroll-container">
          <table className="assignments-table">
            <thead>
              <tr>
                <th>{t('Course Name')}</th>
                <th>{t('Assigned')}</th>
                <th>{t('Completion Score')}</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, index) => {
                const classWisePercentage = parseFloat(
                  assignment.classWiseCompletionScore,
                );
                const individualPercentage = parseFloat(
                  assignment.individualCompletionScore,
                );

                const averagePercentage = Math.round(
                  (classWisePercentage + individualPercentage) / 2,
                );

                return (
                  <tr key={index}>
                    <td>{assignment.courseName}</td>
                    <td>
                      {assignment.classWiseAssigned +
                        assignment.individualAssigned}
                    </td>
                    <td>
                      <p>{`${averagePercentage}%`}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data-text">{t('No Assignments round')}</div>
      )}

      {showStartDatePicker && (
        <CalendarPicker
          value={startDate}
          onConfirm={(date) => handleDateConfirm('start', date)}
          onCancel={() => setShowStartDatePicker(false)}
          mode="start"
          maxDate={new Date().toISOString().split('T')[0]}
        />
      )}
      {showEndDatePicker && (
        <CalendarPicker
          value={endDate}
          onConfirm={(date) => handleDateConfirm('end', date)}
          onCancel={() => setShowEndDatePicker(false)}
          mode="end"
          startDate={startDate}
          minDate={
            startDate ? startDate : new Date().toISOString().split('T')[0]
          }
          maxDate={maxEndDate}
        />
      )}
    </div>
  );
};

export default TeacherProfileSection;
