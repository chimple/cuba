import { useLessonCard } from '../hooks/useLessonCard';
import './LessonCard.css';
const LessonCard = (props: Parameters<typeof useLessonCard>[0]) => {
  const viewProps = useLessonCard(props);
  const {
    CONTINUE,
    COURSES,
    Capacitor,
    DownloadLesson,
    IonCard,
    JSON,
    LIVE_QUIZ,
    LessonCardStarIcons,
    LovedIcon,
    PAGES,
    SOURCE,
    SelectIconImage,
    TYPE,
    Util,
    assignment,
    chapter,
    course,
    currentCourse,
    date,
    downloadButtonLoading,
    getCurrentCourse,
    height,
    history,
    isLoved,
    isMathCourse,
    isPlayed,
    isUnlocked,
    lesson,
    lessonCardColor,
    onDownloadOrDelete,
    online,
    parsePath,
    presentToast,
    score,
    showChapterName,
    showDate,
    showScoreCard,
    showSubjectName,
    showText,
    t,
    width,
  } = viewProps;
  return (
    <>
      <div className="assigned-date-div">
        {!!showDate && assignment ? (
          <div id="lesson-card-date">
            <p>
              {t('Assigned') + ': '}
              <b>
                {!!date &&
                  (() => {
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1)
                      .toString()
                      .padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                  })()}
              </b>
            </p>
          </div>
        ) : null}
      </div>
      <IonCard
        id="lesson-card"
        style={{
          width: width,
          height: 'auto',
        }}
        onClick={async () => {
          if (isUnlocked) {
            const resolvedCourse =
              course ?? currentCourse ?? (await getCurrentCourse());
            const source = assignment
              ? SOURCE.NO_LEARNING_PATHWAY_HOMEWORK
              : SOURCE.SUBJECT_PAGE;
            if (lesson.plugin_type === LIVE_QUIZ) {
              const lessonId = lesson.cocos_lesson_id;
              if (lessonId && Capacitor.isNativePlatform()) {
                const isDownloaded = await Util.downloadZipBundle([lesson]);
                if (!isDownloaded) {
                  if (!online) {
                    presentToast({
                      message: t(`Device is orrline`),
                      color: 'danger',
                      duration: 3000,
                      position: 'bottom',
                      buttons: [
                        {
                          text: 'Dismiss',
                          role: 'cancel',
                        },
                      ],
                    });
                  }
                  return;
                }
              }
              if (assignment) {
                history.push({
                  ...parsePath(
                    PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${assignment?.id}`,
                  ),
                  state: {
                    assignment: JSON.stringify(assignment),
                    source,
                  },
                });
              } else {
                history.push({
                  ...parsePath(
                    PAGES.LIVE_QUIZ_GAME +
                      `?lessonId=${lesson.cocos_lesson_id}`,
                  ),
                  state: {
                    courseId: resolvedCourse?.id,
                    lesson: JSON.stringify(lesson),
                    from: history.location.pathname + `?${CONTINUE}=true`,
                    source,
                  },
                });
              }
            } else {
              const playableLessonId = Util.getLessonBundleId(lesson);
              if (!playableLessonId) {
                return;
              }
              const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
              history.push({
                ...parsePath(PAGES.LIDO_PLAYER + parmas),
                state: {
                  lessonId: playableLessonId,
                  courseDocId: resolvedCourse?.id,
                  course: JSON.stringify(resolvedCourse),
                  lesson: JSON.stringify(lesson),
                  assignment,
                  chapter: JSON.stringify(chapter),
                  from: history.location.pathname + `?${CONTINUE}=true`,
                  source,
                },
              });
            }
          }
        }}
      >
        <div
          style={{
            display: 'grid',
          }}
        >
          <div
            style={{
              background:
                lesson?.color && lesson.color !== 'null'
                  ? lesson.color
                  : lessonCardColor,
              borderRadius: '7vh',
              width,
              height,
              display: 'grid',
              justifyContent: 'center',
              alignItems: 'center',
              gridArea: '1/1',
            }}
            color={lessonCardColor}
          >
            <div id="lesson-card-homework-icon">
              {assignment !== undefined &&
                (!(TYPE in assignment) || assignment.type !== LIVE_QUIZ ? (
                  <div>
                    <img
                      src="assets/icons/homework_icon.svg"
                      className="lesson-card-homework-indicator"
                      alt="Homework Icon"
                    />
                  </div>
                ) : (
                  <div>
                    <img
                      src="/assets/icons/quiz_icon.svg"
                      className="lesson-card-homework-indicator"
                      alt="Quiz Icon"
                    />
                  </div>
                ))}
            </div>
            {showSubjectName && currentCourse?.name ? (
              <div id="lesson-card-subject-name">
                <p className="ignore">
                  {course?.code === COURSES.ENGLISH
                    ? lesson?.name
                    : t(lesson?.name ?? '')}
                </p>
                <p>{currentCourse?.name}</p>
              </div>
            ) : null}
            <div className="pattern">
              <SelectIconImage
                imageWidth={'100%'}
                imageHeight={'auto'}
                localSrc={
                  // this is for lesson card background
                  'courses/' + 'sl_en1_mp' + '/icons/' + 'ChallengePattern.png'
                }
                defaultSrc={
                  'courses/' + 'sl_en1_mp' + '/icons/' + 'ChallengePattern.png'
                }
                webSrc={
                  'https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/lesson_thumbnails%2FlessonCaredPattern%2FChallengePattern.png?alt=media&token=be64aec1-f70f-43c3-95de-fd4b1afe5806'
                }
              />
            </div>
            <div id="lesson-card-image">
              <SelectIconImage
                localSrc={
                  'courses/' +
                  lesson.cocos_subject_code +
                  '/icons/' +
                  lesson.id +
                  '.webp'
                }
                defaultSrc={'assets/icons/DefaultIcon.png'}
                webSrc={lesson.image || 'assets/icons/DefaultIcon.png'}
                imageWidth={'60%'}
                imageHeight={'auto'}
              />
              {!isUnlocked ? (
                <div id="lesson-card-status-icon">
                  <img
                    id="lesson-card-status-icon1"
                    loading="lazy"
                    src="assets/icons/Lock_icon.svg"
                    alt="assets/icons/Lock_icon.svg"
                  />
                </div>
              ) : isPlayed ? (
                showScoreCard ? (
                  <div>
                    <div id="lesson-card-score">
                      <LessonCardStarIcons score={score}></LessonCardStarIcons>
                    </div>
                  </div>
                ) : (
                  <></>
                )
              ) : (
                <div />
              )}
            </div>
          </div>
          <div className="lesson-download-button-container">
            {lesson.cocos_lesson_id && (
              <DownloadLesson
                aria-label="Download-button"
                lesson={lesson}
                downloadButtonLoading={downloadButtonLoading}
                onDownloadOrDelete={onDownloadOrDelete}
              />
            )}
          </div>
          {isLoved && (
            <LovedIcon
              isLoved={isLoved}
              hasChapterTitle={!!chapter?.name && showChapterName}
            />
          )}
        </div>
        <div>
          {showText ? (
            <p id={`lesson-card-name${isLoved ? '-fav-icon' : ''}`}>
              {course?.code === COURSES.ENGLISH || isMathCourse
                ? lesson?.name
                : t(lesson?.name ?? '')}
            </p>
          ) : null}
          {showChapterName && chapter?.name && (
            <div id={`chapter-title${isLoved ? '-fav-icon' : ''}`}>
              {course?.code === COURSES.ENGLISH || isMathCourse
                ? chapter?.name
                : t(chapter?.name)}
            </div>
          )}
        </div>
      </IonCard>
    </>
  );
};
export default LessonCard;
