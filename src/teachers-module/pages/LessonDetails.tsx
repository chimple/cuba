import { useLessonDetails } from '../hooks/useLessonDetails';
import './LessonDetails.css';

const LessonDetails = (props: Parameters<typeof useLessonDetails>[0]) => {
  const viewProps = useLessonDetails(props);

  const {
    AssigmentCount,
    AssignmentSource,
    Header,
    LIVE_QUIZ,
    PAGES,
    SelectIcon,
    SelectIconImage,
    assignmentCount,
    chapterId,
    chapterName,
    classSelectedLesson,
    course,
    gradeName,
    handleButtonClick,
    history,
    lesson,
    onPlayClick,
    parsePath,
    state,
    subjectName,
    t,
  } = viewProps;

  return (
    <div id="lesson-details-root" className="lesson-details-root">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          course
            ? history.replace({
                ...parsePath(state.from || PAGES.SEARCH_LESSON),
                state: {
                  course: course,
                  chapterId,
                },
              })
            : history.replace({
                ...parsePath(PAGES.HOME_PAGE),
                state: { tabValue: 1 },
              });
        }}
        showSideMenu={false}
        customText={t('Learning Outcome') ?? 'Learning Outcome'}
      />

      <div id="lesson-details-body" className="lesson-details-body">
        <div id="lesson-details-wrap" className="lesson-details-wrap">
          <div id="lesson-details-top" className="lesson-details-top">
            <div id="lesson-details-left" className="lesson-details-left">
              <div
                id="lesson-details-thumb"
                className="lesson-details-thumb"
                onClick={onPlayClick}
              >
                <div id="lesson-details-play" className="lesson-details-play">
                  <div
                    id="lesson-details-play-text"
                    className="lesson-details-play-text"
                  >
                    {t('Click to play')}
                  </div>
                  <img src="assets/icons/lessonplayEye.svg" alt="View_lesson" />
                </div>

                <SelectIconImage
                  localSrc={
                    lesson?.id
                      ? `teacher/lessons/icons/${lesson.id}.webp`
                      : undefined
                  }
                  defaultSrc={'assets/icons/DefaultIcon.png'}
                  webSrc={lesson.image ?? ''}
                />
              </div>

              <div id="lesson-details-btn" className="lesson-details-btn">
                <SelectIcon
                  isSelected={[
                    ...(classSelectedLesson.get(chapterId)?.[
                      AssignmentSource.MANUAL
                    ] ?? []),
                    ...(classSelectedLesson.get(chapterId)?.[
                      AssignmentSource.QR_CODE
                    ] ?? []),
                  ].includes(lesson.id)}
                  onClick={handleButtonClick}
                />
              </div>
            </div>

            <div id="lesson-details-right" className="lesson-details-right">
              <div id="lesson-details-grade" className="lesson-details-meta">
                <strong>{gradeName ?? ''}</strong>
              </div>

              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-name-id"
              >
                <span className="lesson-details-label">
                  <strong>{t('Lesson')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">{lesson?.name}</span>
              </div>
              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-chapter"
              >
                <span className="lesson-details-label">
                  <strong>{t('Chapter')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">
                  {chapterName ?? ''}
                </span>
              </div>
              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-subject"
              >
                <span className="lesson-details-label">
                  <strong>{t('Subject')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">{subjectName}</span>
              </div>

              <div
                className="lesson-details-meta"
                id="lesson-details-assignment"
              >
                <strong>
                  {lesson.plugin_type === LIVE_QUIZ
                    ? t('Quiz')
                    : t('Assignment')}
                </strong>
                <img
                  src="assets/icons/bulb.svg"
                  alt="bulb_image"
                  className="lesson-details-bulb"
                />
              </div>
            </div>
          </div>

          <div id="lesson-details-outcome" className="lesson-details-outcome">
            <div
              id="lesson-details-outcome-title"
              className="lesson-details-outcome-title"
            >
              {t('Learning Outcome')} :
            </div>

            <div
              id="lesson-details-outcome-desc"
              className="lesson-details-outcome-desc"
            >
              {lesson.outcome}
            </div>
          </div>
        </div>
      </div>

      <AssigmentCount
        assignments={assignmentCount}
        onClick={() => {
          course
            ? history.replace({
                ...parsePath(PAGES.SHOW_CHAPTERS),
                state: {
                  course,
                  chapterId,
                },
              })
            : history.replace({
                ...parsePath(PAGES.HOME_PAGE),
                state: { tabValue: 2 },
              });
        }}
      />
    </div>
  );
};

export default LessonDetails;
