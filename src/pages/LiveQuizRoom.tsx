import { useLiveQuizRoom } from '../hooks/useLiveQuizRoom';
import './LiveQuizRoom.css';

const LiveQuizRoom = () => {
  const viewProps = useLiveQuizRoom();

  const {
    BackButton,
    BarLoader,
    FaHeart,
    IonButton,
    IonPage,
    PAGES,
    SkeltonLoading,
    StudentAvatar,
    Util,
    assignmentResult,
    course,
    currentAssignment,
    history,
    isDownloaded,
    isJoining,
    isLoading,
    joinQuiz,
    lesson,
    notPlayedStudents,
    online,
    presentToast,
    prevPlayedStudents,
    t,
  } = viewProps;

  return (
    <IonPage className="live-quiz-room-page">
      <div className="livequiz-room-header">
        <div className="livequiz-back-button">
          <BackButton
            onClicked={() => {
              Util.setPathToBackButton(PAGES.HOME, history);
            }}
          />
        </div>
        <div className="main-header-text">
          <p id="header-text-1">{t('Live Challenge')}</p>
          <p id="header-text-2">
            {course?.name +
              ' | ' +
              // lesson?.chapterTitle +
              ' | ' +
              lesson?.name}
          </p>
        </div>
        <div></div>
      </div>

      <div className="outcome">
        <p id="outcome-text">{lesson?.outcome}</p>
      </div>

      <div className="students-container">
        <div className="played-students">
          <div className="status-text-container">
            <p className="status-text-1">{t('Already Played')}</p>
          </div>
          <div
            className="student-container-1"
            style={{
              justifyContent:
                prevPlayedStudents.length > 0
                  ? prevPlayedStudents.length > 3
                    ? 'space-between'
                    : 'space-evenly'
                  : 'center',
            }}
          >
            {!!isLoading ? (
              <SkeltonLoading
                isLoading={isLoading}
                header={PAGES.LIVE_QUIZ_JOIN}
              />
            ) : prevPlayedStudents.length > 0 ? (
              prevPlayedStudents
                .sort((a, b) => {
                  const resultA = assignmentResult?.find(
                    (result) => result.student_id === a.id,
                  );
                  const resultB = assignmentResult?.find(
                    (result) => result.student_id === b.id,
                  );
                  const scoreA = resultA?.score || 0;
                  const scoreB = resultB?.score || 0;
                  return scoreB - scoreA;
                })

                .map((student, index) => (
                  <div key={student.id} className="student-avatar-container">
                    {index < 3 && (
                      <div
                        className={`top-perrormer-circle color-${index + 1}`}
                      >
                        {index + 1}
                      </div>
                    )}
                    <div className="student-avatar-container">
                      <StudentAvatar
                        student={student}
                        onClicked={() => {}}
                        width={70}
                        namePosition={'below'}
                      />
                      {assignmentResult?.some(
                        (result) => result.student_id === student.id,
                      ) && (
                        <p className="student-score">
                          {Math.round(
                            assignmentResult.find(
                              (result) => result.student_id === student.id,
                            )?.score || 0,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p id="container-text">{t('No students have played yet.')}</p>
            )}
          </div>
        </div>
        <div className="not-played-students">
          <div className="status-text-container-2">
            <p className="status-text-2">{t('Not Played')}</p>
          </div>
          <div
            className="student-container-2"
            style={{
              justifyContent:
                notPlayedStudents.length > 0
                  ? notPlayedStudents.length > 3
                    ? 'space-between'
                    : 'space-evenly'
                  : 'center',
            }}
          >
            {!!isLoading ? (
              <SkeltonLoading
                isLoading={isLoading}
                header={PAGES.LIVE_QUIZ_JOIN}
              />
            ) : (
              notPlayedStudents.map((student) => (
                <div key={student.id} className="student-avatar-container">
                  {student.id === Util.getCurrentStudent()?.id && (
                    <div className="green-circle">
                      <FaHeart color="white" />
                    </div>
                  )}
                  <StudentAvatar
                    key={student.id}
                    student={student}
                    onClicked={() => {}}
                    width={70}
                    namePosition={'below'}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="join-button-container">
        {!!isDownloaded ? (
          <IonButton
            size="default"
            color="green"
            className="join-button"
            shape="round"
            id="button-inner"
            disabled={!isDownloaded || isJoining}
            onClick={() => {
              if (!online) {
                presentToast({
                  message: t(`Device is orrline. Cannot join live quiz`),
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
                return;
              }
              if (!!currentAssignment?.id) {
                joinQuiz(Util.getCurrentStudent()?.id!, currentAssignment.id);
              }
            }}
          >
            {isJoining ? t('Joining...') : t('Join Now')}
          </IonButton>
        ) : (
          <BarLoader
            color="#8rc93c"
            height={26}
            width={143}
            loading={!isDownloaded}
          />
        )}
      </div>
    </IonPage>
  );
};

export default LiveQuizRoom;
