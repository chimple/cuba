import { useEditStudent } from '../hooks/useEditStudent';
import './EditStudent.css';

const EditStudent = () => {
  const viewProps = useEditStudent();

  const {
    BackButton,
    ChimpleLogo,
    EDIT_STUDENT_STORE,
    GenderAndAge,
    GradeBoardAndLangDropdown,
    IonContent,
    IonPage,
    Loading,
    NextButton,
    PAGES,
    STAGES,
    SelectAvatar,
    StudentNameBox,
    addDataToLocalStorage,
    age,
    avatar,
    board,
    boards,
    gender,
    grade,
    grades,
    handleValueChange,
    history,
    isCreatingProfile,
    isEdit,
    isInputFocus,
    isLoading,
    isNextButtonEnabled,
    language,
    languages,
    localStorage,
    localStoreData,
    onNextButton,
    online,
    presentToast,
    setAge,
    setAvatar,
    setBoard,
    setGender,
    setGrade,
    setLanguage,
    setStage,
    setStudentName,
    stage,
    state,
    studentName,
    t,
  } = viewProps;

  return (
    <>
      {isCreatingProfile ? (
        <IonContent className="ion-padding">
          <Loading isLoading={isCreatingProfile} />
        </IonContent>
      ) : (
        <IonPage id="Edit-student-page">
          <div id="Edit-student-back-button" aria-label={String(t('Back'))}>
            {!isEdit && !state?.showBackButton ? null : (
              <BackButton
                aria-label={t('Back')}
                onClicked={() => {
                  localStorage.removeItem(EDIT_STUDENT_STORE);
                  history.replace(PAGES.DISPLAY_STUDENT);
                }}
              />
            )}
          </div>

          <div id="next-button">
            <NextButton
              disabled={!isNextButtonEnabled()}
              onClicked={() => {
                if (stage === STAGES.GRADE && !online) {
                  presentToast({
                    message: t(`Device is orrline. Cannot complete a profile`),
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
                onNextButton();
              }}
            />
          </div>
          <div
            className={
              'header ' + isInputFocus && stage === STAGES.NAME
                ? 'scroll-header'
                : ''
            }
          >
            {stage == STAGES.NAME && (
              <ChimpleLogo
                header={t('Welcome to Chimple!')}
                msg={t('').toString()}
              />
            )}

            {stage === STAGES.NAME && (
              <StudentNameBox
                studentName={studentName!}
                onValueChange={(val) =>
                  handleValueChange('studentName', val, setStudentName)
                }
                onEnterDown={isNextButtonEnabled() ? onNextButton : () => {}}
              />
            )}
          </div>
          {stage === STAGES.AVATAR && (
            <>
              <>
                <div
                  id="Edit-student-back-button"
                  aria-label={String(t('Back'))}
                >
                  <BackButton
                    aria-label={t('Back')}
                    onClicked={() => {
                      localStoreData.stage = STAGES.GENDER_AND_AGE;
                      addDataToLocalStorage();
                      setStage(STAGES.GENDER_AND_AGE);
                    }}
                  />
                </div>

                <div id="common-div">
                  <ChimpleLogo header={t('')} msg={t('').toString()} />
                </div>
                <div className="avatar-title">
                  {t('Choose an avatar for your child')}
                </div>
              </>
            </>
          )}
          <div className="content">
            {stage === STAGES.GENDER_AND_AGE && (
              <>
                <div
                  id="Edit-student-back-button"
                  aria-label={String(t('Back'))}
                >
                  <span className="back-button-ignore">Back</span>
                  <BackButton
                    aria-label={t('Back')}
                    onClicked={() => {
                      localStoreData.stage = STAGES.NAME;
                      addDataToLocalStorage();
                      setStage(STAGES.NAME);
                    }}
                  />
                </div>
                <>
                  <>
                    <div id="common-div">
                      <ChimpleLogo header={t('')} msg={t('').toString()} />
                    </div>
                  </>
                  <GenderAndAge
                    age={age}
                    gender={gender}
                    onAgeChange={(val) => handleValueChange('age', val, setAge)}
                    onGenderChange={(val) =>
                      handleValueChange('gender', val, setGender)
                    }
                  />
                </>
              </>
            )}
            {stage === STAGES.AVATAR && (
              <SelectAvatar
                avatar={avatar}
                onAvatarChange={(val) =>
                  handleValueChange('avatar', val, setAvatar)
                }
              />
            )}
            {stage === STAGES.GRADE && (
              <>
                <>
                  <div
                    id="Edit-student-back-button"
                    aria-label={String(t('Back'))}
                  >
                    <BackButton
                      aria-label={t('Back')}
                      onClicked={() => {
                        localStoreData.stage = STAGES.AVATAR;
                        addDataToLocalStorage();
                        setStage(STAGES.AVATAR);
                      }}
                    />
                  </div>
                </>
                <>
                  <>
                    <>
                      <div id="common-div">
                        <ChimpleLogo
                          header={t('')}
                          msg={t(
                            'Choose your child�s class details',
                          ).toString()}
                        />
                      </div>
                    </>
                    <GradeBoardAndLangDropdown
                      boards={boards}
                      grades={grades}
                      languages={languages}
                      onBoardChange={(val) =>
                        handleValueChange('board', val, setBoard)
                      }
                      onGradeChange={(val) =>
                        handleValueChange('grade', val, setGrade)
                      }
                      onLangChange={(val) =>
                        handleValueChange('language', val, setLanguage)
                      }
                      currentlySelectedBoard={board}
                      currentlySelectedGrade={grade}
                      currentlySelectedLang={language}
                    />
                  </>
                </>
              </>
            )}
          </div>
          <Loading isLoading={isLoading} />
        </IonPage>
      )}
    </>
  );
};

export default EditStudent;
