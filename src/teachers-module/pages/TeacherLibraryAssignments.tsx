import React from "react";
import Header from "../components/homePage/Header";
import AssigmentCount from "../components/library/AssignmentCount";
import SelectIconImage from "../../components/displaySubjects/SelectIconImage";
import Loading from "../../components/Loading";
import { useTeacherLibraryAssignmentsLogic } from "./TeacherLibraryAssignmentsLogic";
import "./TeacherLibraryAssignments.css";

const TeacherLibraryAssignments: React.FC = () => {
  const {
    loading,
    groups,
    assignmentCount,
    toggleLesson,
    handleNext,
    handleBackButtonClick,
    getSelectedCount,
    getSubjectTitle,
    getLessonTitle,
    getChapterTitle,
  } = useTeacherLibraryAssignmentsLogic();

  return (
    <div className="teacher-library-assignments-page">
      <Header
        isBackButton={true}
        onBackButtonClick={handleBackButtonClick}
        showSideMenu={false}
        customText="Library Assignments"
        showSearchIcon={false}
      />

      <main className="teacher-library-assignments-body">
        {loading ? (
          <Loading isLoading={loading} />
        ) : (
          <>
            <div className="teacher-library-assignments-list">
              {groups.map((group) => {
                const selectedCount = getSelectedCount(group);
                const subjectTitle = getSubjectTitle(group);
                return (
                  <section key={group.courseId} className="teacher-assignments-group">
                    <div className="teacher-assignments-group-header">
                      <div className="teacher-assignments-group-name">{subjectTitle}</div>
                      <div className="teacher-assignments-group-count">
                        {selectedCount} / {group.lessons.length}
                      </div>
                    </div>

                    <div className="teacher-assignments-group-items">
                      {group.lessons.map((lesson) => {
                        const lessonTitle = getLessonTitle(group, lesson);
                        const chapterTitle = getChapterTitle(group, lesson);
                        return (
                          <div key={lesson.id} className="teacher-assignments-item">
                            <div className="teacher-assignments-item-thumb">
                              <SelectIconImage
                                defaultSrc={"assets/icons/DefaultIcon.png"}
                                webSrc={lesson.image ?? ""}
                                imageWidth="100%"
                                imageHeight="100%"
                              />
                            </div>
                            <div className="teacher-assignments-item-copy">
                              <div className="teacher-assignments-item-title">
                                {lessonTitle}
                              </div>
                              <div className="teacher-assignments-item-subtitle">
                                {chapterTitle}
                              </div>
                            </div>
                            {lesson.selected ? (
                              <span
                                className="teacher-assignments-item-toggle-circle is-selected"
                                onClick={() => toggleLesson(group.courseId, lesson.id)}
                              >
                                <img
                                  src="assets/tick.png"
                                  alt=""
                                  className="teacher-assignments-item-toggle-check"
                                />
                              </span>
                            ) : (
                              <span
                                className="teacher-assignments-item-toggle-circle is-unselected"
                                onClick={() => toggleLesson(group.courseId, lesson.id)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            {assignmentCount <= 0 ? (
              <div className="teacher-library-no-lessons-center">No Lessons Selected</div>
            ) : null}
          </>
        )}
      </main>

      {assignmentCount > 0 ? (
        <AssigmentCount assignments={assignmentCount} onClick={handleNext} />
      ) : null}
    </div>
  );
};

export default TeacherLibraryAssignments;
