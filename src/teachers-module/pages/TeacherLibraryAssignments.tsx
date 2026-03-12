import React from 'react';
import Header from '../components/homePage/Header';
import AssigmentCount from '../components/library/AssignmentCount';
import SelectIconImage from '../../components/displaySubjects/SelectIconImage';
import Loading from '../../components/Loading';
import { useTeacherLibraryAssignmentsLogic } from './TeacherLibraryAssignmentsLogic';
import './TeacherLibraryAssignments.css';
import { t } from 'i18next';

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
    <div
      id="teacher-library-assignments-page"
      className="teacher-library-assignments-page"
    >
      <Header
        isBackButton={true}
        onBackButtonClick={handleBackButtonClick}
        showSideMenu={false}
        customText="Library Assignments"
        showSearchIcon={false}
      />

      <main
        id="teacher-library-assignments-body"
        className="teacher-library-assignments-body"
      >
        {loading ? (
          <Loading isLoading={loading} />
        ) : (
          <>
            <div
              id="teacher-library-assignments-list"
              className="teacher-library-assignments-list"
            >
              {groups.map((group) => {
                const selectedCount = getSelectedCount(group);
                const subjectTitle = getSubjectTitle(group);
                return (
                  <section
                    key={group.courseId}
                    id="teacher-assignments-group"
                    className="teacher-assignments-group"
                  >
                    <div
                      id="teacher-assignments-group-header"
                      className="teacher-assignments-group-header"
                    >
                      <div
                        id="teacher-assignments-group-name"
                        className="teacher-assignments-group-name"
                      >
                        {subjectTitle}
                      </div>
                      <div
                        id="teacher-assignments-group-count"
                        className="teacher-assignments-group-count"
                      >
                        {selectedCount} / {group.lessons.length}
                      </div>
                    </div>

                    <div
                      id="teacher-assignments-group-items"
                      className="teacher-assignments-group-items"
                    >
                      {group.lessons.map((lesson) => {
                        const lessonTitle = getLessonTitle(group, lesson);
                        const chapterTitle = getChapterTitle(group, lesson);
                        return (
                          <div
                            key={lesson.id}
                            id="teacher-assignments-item"
                            className="teacher-assignments-item"
                          >
                            <div
                              id="teacher-assignments-item-thumb"
                              className="teacher-assignments-item-thumb"
                            >
                              <SelectIconImage
                                defaultSrc={'assets/icons/DefaultIcon.png'}
                                webSrc={lesson.image ?? ''}
                                imageWidth="100%"
                                imageHeight="100%"
                              />
                            </div>
                            <div
                              id="teacher-assignments-item-copy"
                              className="teacher-assignments-item-copy"
                            >
                              <div
                                id="teacher-assignments-item-title"
                                className="teacher-assignments-item-title"
                              >
                                {lessonTitle}
                              </div>
                              <div
                                id="teacher-assignments-item-subtitle"
                                className="teacher-assignments-item-subtitle"
                              >
                                {chapterTitle}
                              </div>
                            </div>
                            {lesson.selected ? (
                              <span
                                id="teacher-assignments-item-toggle-circle is-selected"
                                className="teacher-assignments-item-toggle-circle is-selected"
                                onClick={() =>
                                  toggleLesson(group.courseId, lesson.id)
                                }
                              >
                                <img
                                  src="assets/tick.png"
                                  alt=""
                                  id="teacher-assignments-item-toggle-check"
                                  className="teacher-assignments-item-toggle-check"
                                />
                              </span>
                            ) : (
                              <span
                                id="teacher-assignments-item-toggle-circle is-unselected"
                                className="teacher-assignments-item-toggle-circle is-unselected"
                                onClick={() =>
                                  toggleLesson(group.courseId, lesson.id)
                                }
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
              <div
                id="teacher-library-no-lessons-center"
                className="teacher-library-no-lessons-center"
              >
                {t('No Lessons Selected')}
              </div>
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
