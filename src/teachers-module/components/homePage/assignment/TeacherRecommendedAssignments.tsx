import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import "./TeacherRecommendedAssignments.css";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { PAGES } from "../../../../common/constants";
import { Util } from "../../../../utility/util";
import { t } from "i18next";
import RecommendedAssignments, {
  RecommendedAssignmentsState,
} from "./RecommendedAssignments";
import Header from "../Header";
import AssigmentCount from "../../library/AssignmentCount";
import {
  buildRecommendedPayload,
  getRecommendedLessons,
} from "./AssignmentUtil";

export enum TeacherRecommendedAssignmentsType {
  RECOMMENDED = "recommended",
}

const TeacherRecommendedAssignments: FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const [recommendedAssignments, setRecommendedAssignments] =
    useState<RecommendedAssignmentsState>({});

  const [selectedLessonsCount, setSelectedLessonsCount] = useState<{
    [TeacherRecommendedAssignmentsType.RECOMMENDED]: { count: number };
  }>({
    [TeacherRecommendedAssignmentsType.RECOMMENDED]: { count: 0 },
  });

  const current_class = Util.getCurrentClass();

  useEffect(() => {
    init();
  }, []);

  // Initializes the page data
  const init = async () => {
    // If no class is selected, redirect to schools page
    if (!current_class?.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }

    // Fetch all courses for the selected class
    const courseList = await api.getCoursesForClassStudent(current_class.id);

    // Fetch recently assigned lessons (to avoid duplicates)
    const lastAssignments = await api.getLastAssignmentsForRecommendations(
      current_class.id,
    );

    // Generate recommended lessons based on courses and past assignments
    const recommended = await getRecommendedLessons(
      api,
      current_class,
      courseList,
      lastAssignments,
    );

    // Save recommended lessons in state
    setRecommendedAssignments(recommended);

    // Update the selected lessons count
    updateSelectedLesson(recommended);
  };

  // Calculates total number of selected lessons
  const updateSelectedLesson = (
    updatedAssignments: RecommendedAssignmentsState,
  ) => {
    let count = 0;

    // Loop through all subjects
    Object.values(updatedAssignments).forEach((subject) => {
      // Count lessons that are selected
      subject.lessons.forEach((lesson) => {
        if (lesson.selected) count++;
      });
    });

    // Update selected lessons count state
    setSelectedLessonsCount({
      [TeacherRecommendedAssignmentsType.RECOMMENDED]: { count },
    });
  };

  const toggleAssignmentSelection = (subjectId: string, index: number) => {
    const updated: RecommendedAssignmentsState = {
      ...recommendedAssignments,
      [subjectId]: {
        ...recommendedAssignments[subjectId],
        lessons: recommendedAssignments[subjectId].lessons.map((lesson, i) =>
          i === index ? { ...lesson, selected: !lesson.selected } : lesson,
        ),
      },
    };

    setRecommendedAssignments(updated);
    updateSelectedLesson(updated);
  };

  const handleRecommendedBack = () => {
    history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
  };
  return (
    <div
      className="teacher-recommended-assignments-page"
      id="teacher-recommended-assignments-id"
    >
      <Header
        customText={t("Recommended Assignments") ?? ""}
        customTextClassName="header-recommended-text"
        onBackButtonClick={handleRecommendedBack}
        isBackButton
      />

      <RecommendedAssignments
        recommendedAssignments={recommendedAssignments}
        setRecommendedAssignments={setRecommendedAssignments}
        updateSelectedLesson={updateSelectedLesson}
        toggleSubjectCollapse={() => {}}
        toggleAssignmentSelection={(
          _type,
          _category,
          _setCategory,
          subjectId,
          index,
        ) => toggleAssignmentSelection(subjectId, index)}
      />

      <AssigmentCount
        assignments={
          selectedLessonsCount[TeacherRecommendedAssignmentsType.RECOMMENDED]
            .count
        }
        onClick={async () => {
          const { selectedAssignments, formattedRecommended } =
            buildRecommendedPayload(recommendedAssignments);

          if (Object.keys(selectedAssignments).length > 0) {
            history.replace(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE, {
              fromPage: PAGES.TEACHER_RECOMMENDED_ASSIGNMENTS,
              selectedAssignments: {
                recommended: formattedRecommended,
              },
              manualAssignments: {},
              recommendedAssignments,
            });
          }
        }}
      />
    </div>
  );
};

export default TeacherRecommendedAssignments;
