import { useEffect, useState } from "react";
import "../LearningPathway.css";
import "./HomeworkPathway.css";
import { v4 as uuidv4 } from "uuid";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  EVENTS,
  HOMEWORK_PATHWAY_DROPDOWN,
  HOMEWORK_PATHWAY,
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { schoolUtil } from "../../utility/schoolUtil";
import {
  updateLocalAttributes,
  useGbContext,
} from "../../growthbook/Growthbook";
import Loading from "../Loading";
import DropdownMenu from "../Home/DropdownMenu";
import ChapterLessonBox from "../learningPathway/chapterLessonBox";
import HomeworkPathwayStructure from "./HomeworkPathwayStructure";
import PathwayModal from "../learningPathway/PathwayModal";
import { t } from "i18next";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

// Make sure this interface is defined at the top of your component file
interface HomeworkPath {
  path_id: string;
  lessons: any[];
  currentIndex: number;
}


const HomeworkPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);
    const [boxDetails, setBoxDetails] = useState<{ cName: string; lName: string } | null>(null); 

  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();
  const { setGbUpdated } = useGbContext();
  // ✅ New state variables for dropdown logic
  const [isDropdownDisabled, setIsDropdownDisabled] = useState<boolean>(true);
  const [showDisabledDropdownModal, setShowDisabledDropdownModal] = useState<boolean>(false);
    const isDropdownAlwaysEnabled = useFeatureIsOn(HOMEWORK_PATHWAY_DROPDOWN);


  useEffect(() => {
    if (!currentStudent?.id) {
      setLoading(false);
      return;
    }
    updateStarCount(currentStudent);
    fetchHomeworkPathway(currentStudent);
  }, [currentStudent?.id, isDropdownAlwaysEnabled]);

  const updateStarCount = async (currentStudent: TableTypes<"user">) => {
    const storedStarsJson = localStorage.getItem(STARS_COUNT);
    const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
    const localStorageStars = parseInt(
      storedStarsMap[currentStudent.id] || "0",
      10
    );
    const latestStarsJson = localStorage.getItem(LATEST_STARS);
    const latestStarsMap = latestStarsJson ? JSON.parse(latestStarsJson) : {};
    const latestLocalStars = parseInt(
      latestStarsMap[currentStudent.id] || "0",
      10
    );
    const dbStars = currentStudent.stars || 0;
    const studentStars = Math.max(latestLocalStars, dbStars);
    if (localStorageStars < studentStars) {
      storedStarsMap[currentStudent.id] = studentStars;
      localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));
      setFrom(localStorageStars);
      setTo(studentStars);
    } else {
      setFrom(studentStars);
      setTo(studentStars);
    }
    if (latestLocalStars <= dbStars) {
      latestStarsMap[currentStudent.id] = dbStars;
      localStorage.setItem(LATEST_STARS, JSON.stringify(latestStarsMap));
    } else {
      await api.updateStudentStars(currentStudent.id, latestLocalStars);
    }
  };

  const fetchHomeworkPathway = async (student: TableTypes<"user">) => {
    try {
      let pathData: HomeworkPath | null = null; 

      const existingPath = sessionStorage.getItem(HOMEWORK_PATHWAY);
      // ✅ Fetch ALL pending assignments to check the total count
      const currClass = Util.getCurrentClass();
      if (!currClass?.id) {
        setLoading(false);
        return;
      }
      const allPendingAssignments = await api.getPendingAssignments(currClass.id, student.id);
       // ✅ --- MODIFIED LOGIC FOR DISABLING DROPDOWN ---
      // Condition 1: Are there 5 or fewer total assignments? If so, it MUST be disabled.
      const hasFewAssignments = !allPendingAssignments || allPendingAssignments.length <= 5;
      
      // Condition 2: Is the feature flag ON?
      if (isDropdownAlwaysEnabled) {
        // If the flag is ON, the dropdown is ONLY disabled if there are few assignments.
        // The existence of a current path (`existingPath`) no longer matters.
        setIsDropdownDisabled(hasFewAssignments);
      } else {
        // If the flag is OFF (original behavior), the dropdown is disabled if there are
        // few assignments OR if a path is already in progress.
        setIsDropdownDisabled(hasFewAssignments || !!existingPath);
      }
      
      if (!existingPath) {
        pathData = await buildAndSaveInitialHomeworkPath(student, allPendingAssignments); // Ensure this function returns the path object
      } else {
        pathData = JSON.parse(existingPath);
      }

      // LOGIC TO GET NAMES FOR THE BOX
      if (pathData && pathData.lessons && pathData.lessons.length > 0) {
        const currentIndex = pathData.currentIndex || 0;
        const currentObj = pathData.lessons[currentIndex];
        
        // We need the lesson name and chapter name
        // The lesson object is already nested in currentObj based on your previous code
        if (currentObj && currentObj.lesson) {
             // We might need to fetch the Chapter Name if it's not in the saved object
             let cName = "Chapter"; 
             if(currentObj.lesson.chapter_id) {
                 const chapter = await api.getChapterById(currentObj.lesson.chapter_id);
                 cName = chapter?.name || "Chapter";
             }
             
             setBoxDetails({
                 cName: cName,
                 lName: currentObj.lesson.name
             });
        }
      }

    } catch (error) {
      console.error("Error in fetchHomeworkPathway:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildAndSaveInitialHomeworkPath = async (
    student: TableTypes<"user">,
    pendingAssignments: any[]
  ) => {
    if (!pendingAssignments || pendingAssignments.length === 0) {
      const emptyPath = { lessons: [], currentIndex: 0 };
      await saveHomeworkPath(student, emptyPath);
      return null;
    }

    const pendingBySubject: { [key: string]: any[] } = {};
    for (const assignment of pendingAssignments) {
      const lesson = await api.getLesson(assignment.lesson_id);
      if (lesson && lesson.subject_id) {
        // ✅ This is the fix
        pendingBySubject[lesson.subject_id] = (
          pendingBySubject[lesson.subject_id] || []
        ).concat(assignment);
      }
    }

    let maxPending = 0;
    let subjectsWithMaxPending: string[] = [];
    Object.keys(pendingBySubject).forEach((subject) => {
      const length = pendingBySubject[subject].length;
      if (length > maxPending) {
        maxPending = length;
        subjectsWithMaxPending = [subject];
      } else if (length === maxPending) {
        subjectsWithMaxPending.push(subject);
      }
    });
    const bestSubject = subjectsWithMaxPending[0];
    const selectedAssignments = (pendingBySubject[bestSubject] || []).slice(
      0,
      5
    );

    const lessonsWithDetails = await Promise.all(
      selectedAssignments.map(async (assignment) => {
        const lesson = await api.getLesson(assignment.lesson_id);
        return { ...assignment, lesson };
      })
    );

    const newHomeworkPath = {
      path_id: uuidv4(),
      lessons: lessonsWithDetails,
      currentIndex: 0,
    };

    await saveHomeworkPath(student, newHomeworkPath);
    return newHomeworkPath;
  };

  const saveHomeworkPath = async (student: TableTypes<"user">, path: any) => {
    sessionStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(path));

    if (!path.lessons || path.lessons.length < 5) {
      return;
    }

    const eventData = {
      user_id: student.id,
      path_id: path.path_id,
      current_course_id: path.lessons[0].course_id,
      current_lesson_id: path.lessons[0].lesson_id,
      current_chapter_id: path.lessons[0].chapter_id,
      path_lesson_one: path.lessons[0].lesson_id,
      path_lesson_two: path.lessons[1].lesson_id,
      path_lesson_three: path.lessons[2].lesson_id,
      path_lesson_four: path.lessons[3].lesson_id,
      path_lesson_five: path.lessons[4].lesson_id,
    };

    // ✅ Use the new, specific event name and remove the redundant property
    await Util.logEvent(EVENTS.HOMEWORK_PATHWAY_CREATED, eventData);
  };
  // ✅ New handler for clicking the disabled dropdown wrapper
  const handleDropdownWrapperClick = () => {
    if (isDropdownDisabled) {
      setShowDisabledDropdownModal(true);
    }
  }

  if (loading) return <Loading isLoading={loading} msg="Loading Homework" />;

  return (
    <div className="homework-pathway-container">
      <div className="homeworkpathway-pathway_section">
        <div className="homework-dropdown-wrapper" onClick={handleDropdownWrapperClick}>
          <DropdownMenu disabled={isDropdownDisabled} />
        </div>
        <HomeworkPathwayStructure />
      </div>

      <div className="homeworkpathway-chapter-egg-container">
        <ChapterLessonBox
        chapterName={boxDetails?.cName || "Loading"}
          lessonName={boxDetails?.lName || "..."}
          containerStyle={{
            width: "35vw",
          }}
        />
      </div>
      {/* ✅ Render the modal when its state is true */}
      {showDisabledDropdownModal && (
        <PathwayModal
          text={t("keep going finish these lesson to chose subjects")}
          onClose={() => setShowDisabledDropdownModal(false)}
          onConfirm={() => setShowDisabledDropdownModal(false)}
        />
      )}
    </div>
  );
};

export default HomeworkPathway;
