import './SubjectSelection.css';
import { useSubjectSelection } from '../hooks/useSubjectSelection';

const SubjectSelection = () => {
  const {
    AddButton,
    DisplaySubjects,
    Header,
    IonAlert,
    IonicSafeString,
    School_Creation_Stages,
    SubjectSelectionComponent,
    alertState,
    canModify,
    currentClass,
    currentSchool,
    currentSubject,
    curriculumsWithCourses,
    handleConfirmSelection,
    handleRemoveSubject,
    handleSubjectClick,
    handleSubjectSelection,
    isExternalUser,
    isModalOpen,
    isSelecting,
    navigationState,
    onBackButtonClick,
    paramSchoolId,
    selectedSubjects,
    setAlertState,
    setIsModalOpen,
    setIsSelecting,
    t,
    transformedCurriculumsWithCourses,
  } = useSubjectSelection();

  return (
    <div className="subject-selection-page">
      <Header
        isBackButton={true}
        showSchool={true}
        showClass={true}
        schoolName={currentSchool?.name}
        className={currentClass?.name}
        onBackButtonClick={onBackButtonClick}
        disableBackButton={
          isSelecting ||
          (navigationState?.stage === School_Creation_Stages.SCHOOL_COURSE
            ? true
            : false)
        }
      />
      {!isSelecting ? (
        <DisplaySubjects
          curriculumsWithCourses={curriculumsWithCourses}
          selectedSubjects={selectedSubjects}
          onSubjectClick={handleSubjectClick}
          onRemoveSubject={handleRemoveSubject}
          isModalOpen={isModalOpen}
          currentSubject={currentSubject}
          setIsModalOpen={setIsModalOpen}
          schoolId={currentSchool?.id ?? paramSchoolId ?? undefined}
        />
      ) : (
        <SubjectSelectionComponent
          curriculumsWithCourses={transformedCurriculumsWithCourses}
          selectedSubjects={selectedSubjects}
          onSubjectSelection={handleSubjectSelection}
          onConfirm={handleConfirmSelection}
          schoolId={paramSchoolId}
        />
      )}
      <IonAlert
        isOpen={alertState.isOpen}
        onDidDismiss={() => setAlertState({ ...alertState, isOpen: false })}
        header={alertState.header}
        message={
          new IonicSafeString(`
        <div class="scrollable-alert">
        ${alertState.message}
        </div>
       `)
        }
        buttons={[
          { text: t('OK'), role: 'cancel', cssClass: 'alert-okay-button' },
        ]}
        cssClass="custom-alert-in-subject-selection-page"
      />
      {!isSelecting && canModify && !isExternalUser && (
        <AddButton onClick={() => setIsSelecting(true)} />
      )}
    </div>
  );
};

export default SubjectSelection;