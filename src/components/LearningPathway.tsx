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
import { STARS_COUNT, TableTypes } from "../common/constants";

const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();

  useEffect(() => {
    fetchLearningPathway();
    if (currentStudent?.id) {
      const storedStarsJson = localStorage.getItem(STARS_COUNT);
      const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};

      const localStorageStars = parseInt(
        storedStarsMap[currentStudent.id] || "0",
        10
      );
      const studentStars = currentStudent.stars || 0;
      if (localStorageStars < studentStars) {
        storedStarsMap[currentStudent.id] = studentStars;
        localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));
        setFrom(localStorageStars);
        setTo(studentStars);
      } else {
        setFrom(studentStars);
        setTo(studentStars);
      }
    }
  }, []);
  const fetchLearningPathway = async () => {
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
        <TressureBox startNumber={from} endNumber={to} />
      </div>
    </div>
  );
};

export default LearningPathway;
