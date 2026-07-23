import { useShowChapters } from '../hooks/useShowChapters';
import './ShowChapters.css';

const ShowChapters = () => {
  const viewProps = useShowChapters();

  const {
    AssigmentCount,
    AssignedVisibilityToggle,
    AssignmentSource,
    ChapterContainer,
    Header,
    PAGES,
    assignedLessonIds,
    assignmentCount,
    chapterRefs,
    classSelectedLesson,
    courseCode,
    handleOnLessonClick,
    handleShowAssignedChange,
    history,
    isLoadingAssignedLessons,
    isShowAssigned,
    lessons,
    parsePath,
    resolvedActiveChapterId,
    selectedCourseGrade,
    selectedCourseName,
    updateLessonSelection,
    visibleChapters,
  } = viewProps;

  return (
    <div id="showchapters-container" className="showchapters-container">
      <Header
        isBackButton={true}
        onBackButtonClick={() => {
          history.replace({
            ...parsePath(PAGES.HOME_PAGE),
            state: { tabValue: 1 },
          });
        }}
        customText="Library"
        showSearchIcon={true}
        onSearchIconClick={() => history.replace(PAGES.SEARCH_LESSON)}
      />
      <main
        id="showchapters-container-body"
        className="showchapters-container-body"
      >
        <div id="showchapters-course-row" className="showchapters-course-row">
          <div
            id="showchapters-course-name"
            className="showchapters-course-name"
          >
            {`${selectedCourseName} ${selectedCourseGrade}`}
          </div>
          <AssignedVisibilityToggle
            showAssigned={isShowAssigned}
            onChange={handleShowAssignedChange}
            disabled={isLoadingAssignedLessons}
            className="showchapters-assigned-toggle"
          />
        </div>
        <div id="showchapters-lesson-grid" className="showchapters-lesson-grid">
          {visibleChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              ref={(el) => {
                chapterRefs.current[index] = el;
              }}
            >
              <ChapterContainer
                chapter={chapter}
                isOpened={resolvedActiveChapterId === chapter.id}
                syncSelectedLessons={[
                  ...(classSelectedLesson.get(chapter.id)?.[
                    AssignmentSource.MANUAL
                  ] ?? []),
                  ...(classSelectedLesson.get(chapter.id)?.[
                    AssignmentSource.QR_CODE
                  ] ?? []),
                ]}
                lessons={lessons?.get(chapter.id) ?? []}
                chapterSelectedLessons={updateLessonSelection}
                lessonClickCallBack={(lesson) => {
                  handleOnLessonClick(lesson, chapter);
                }}
                courseCode={courseCode}
                showAssignedBadge={isShowAssigned}
                assignedLessonIds={assignedLessonIds}
              />
            </div>
          ))}
        </div>
        <AssigmentCount
          assignments={assignmentCount}
          onClick={() => {
            history.push(PAGES.TEACHER_ASSIGNMENT);
          }}
        />
      </main>
    </div>
  );
};

export default ShowChapters;
