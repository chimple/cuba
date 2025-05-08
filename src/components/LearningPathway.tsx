import { useEffect, useState } from "react";
import { Util } from "../utility/util";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import "./LearningPathway.css";
import TressureBox from "./learningPathway/TressureBox";
import DropdownMenu from "./Home/DropdownMenu";
import { ServiceConfig } from "../services/ServiceConfig";
import Loading from "./Loading";
import { schoolUtil } from "../utility/schoolUtil";

interface LearningPathwayProps {
  from: number;
  to: number;
}

const LearningPathway: React.FC<LearningPathwayProps> = ({ from, to }) => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLearningPathway();
  }, []);
  const fetchLearningPathway = async () => {
    const currentStudent = await Util.getCurrentStudent();
    const currClass = schoolUtil.getCurrentClass();
    if (!currentStudent || !currClass) {
      console.error("No user/class found");
      setLoading(false);
      return;
    }

    try {
      let learningPath = currentStudent.learning_path
        ? JSON.parse(currentStudent.learning_path)
        : null;

      if (!learningPath || Object.keys(learningPath).length === 0) {
        setLoading(true); // Set loading to true while creating pathway
        const userCourses = await api.getCoursesForClassStudent(currClass!.id);

        const coursesWithDetails = await Promise.all(
          userCourses.map(async (course) => {
            const chapters = await api.getChaptersForCourse(course.id);

            const lessonsWithChapters = await Promise.all(
              chapters.map(async (chapter) => {
                const lessons = await api.getLessonsForChapter(chapter.id);
                return lessons.map((lesson) => ({
                  lesson_id: lesson.id,
                  chapter_id: chapter.id,
                }));
              })
            );
            return {
              course_id: course.id,
              subject_id: course.subject_id,
              path: lessonsWithChapters.flat(),
              startIndex: 0,
              currentIndex: 0,
              pathEndIndex: 4,
            };
          })
        );

        learningPath = {
          courses: {
            courseList: coursesWithDetails,
            currentCourseIndex: 0,
          },
        };

        await api.updateLearningPath(
          currentStudent,
          JSON.stringify(learningPath)
        );
        await Util.setCurrentStudent(
          { ...currentStudent, learning_path: JSON.stringify(learningPath) },
          undefined
        );

        window.dispatchEvent(
          new CustomEvent("PathwayCreated", {
            detail: { userId: currentStudent.id },
          })
        );
      }
    } catch (error) {
      console.error("Error in Learning Pathway", error);
    } finally {
      setLoading(false); // Set loading to false after pathway is ready
    }
  };
  if (loading) {
    return <Loading isLoading={loading} msg="Loading Lessons" />;
  }

  return (
    <div className="learning-pathway-container">
      <div className="pathway_section">
        <DropdownMenu />
        <PathwayStructure />
      </div>

      <div className="chapter-egg-container">
        <ChapterLessonBox
          containerStyle={{
            width: "30vw",
          }}
        />
        <TressureBox startNumber={from ?? 0} endNumber={to ?? 0} />
      </div>
    </div>
  );
};

export default LearningPathway;
