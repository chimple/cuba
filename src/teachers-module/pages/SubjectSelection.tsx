import React, { useState, useEffect } from "react";
import {
  IonAlert,
  IonButton,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonIcon,
  IonicSafeString,
} from "@ionic/react";
import { addOutline } from "ionicons/icons";
import Header from "../components/homePage/Header";
import DisplaySubjects from "../components/DisplaySubjects";
import "./SubjectSelection.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  PAGES,
  TableTypes,
  CLASS,
  SCHOOL,
  School_Creation_Stages,
} from "../../common/constants";
import { useHistory, useLocation } from "react-router";
import { Util } from "../../utility/util";
import { t } from "i18next";
import SubjectSelectionComponent from "../components/SubjectSelectionComponent";
import AddButton from "../../common/AddButton";
import { RoleType } from "../../interface/modelInterfaces";

interface CurriculumWithCourses {
  curriculum: { id: string; name: string; grade?: string };
  courses: TableTypes<"course">[];
}

const SubjectSelection: React.FC = () => {
  const [curriculumsWithCourses, setCurriculumsWithCourses] = useState<
    CurriculumWithCourses[]
  >([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const history = useHistory();
  const location = useLocation();
  const [isSelecting, setIsSelecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const api = ServiceConfig.getI()?.apiHandler;
  const {
    schoolId: paramSchoolId = null,
    classId: paramClassId = null,
    origin: previousOrigin = null,
    isSelect: isSelectSubject = false,
  } = (location.state || {}) as any;

  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [currentSchool, setCurrentSchool] = useState<TableTypes<"school">>();
  const [classCourseData, setClassCourseData] = useState<
    {
      class_id: string;
      course_id: string;
      created_at: string;
      id: string;
      is_deleted: boolean | null;
      updated_at: string | null;
    }[]
  >([]);
  const [schoolCourseData, setSchoolCourseData] = useState<
    {
      school_id: string;
      course_id: string;
      created_at: string;
      id: string;
      is_deleted: boolean | null;
      updated_at: string | null;
    }[]
  >([]);
  const [initialSelectedSubjects, setInitialSelectedSubjects] = useState<
    string[]
  >([]);
  const auth = ServiceConfig.getI().authHandler;
  const [alertState, setAlertState] = useState({
    isOpen: false,
    header: "",
    message: "",
  });
  const navigationState = Util.getNavigationState();

  useEffect(() => {
    if (paramClassId) {
      fetchSchoolAndClassSubjects(paramClassId, CLASS);
      fetchClassDetails();
      if (isSelectSubject) setIsSelecting(true);
    } else if (paramSchoolId) {
      fetchCurriculumsAndCourses(SCHOOL);
      fetchSchoolAndClassSubjects(paramSchoolId, SCHOOL);
      if (isSelectSubject) setIsSelecting(true);
    }
  }, [paramClassId, paramSchoolId]);

  const fetchCurriculumsAndCourses = async (
    context: "school" | "class",
    schoolId?: string
  ) => {
    try {
      // Fetch common data
      const [curriculumDocs, courseDocs, allGrades] = await Promise.all([
        api.getAllCurriculums(),
        api.getAllCourses(),
        api.getAllGrades(),
      ]);
      // Fetch school-specific courses for class context
      const schoolCourses =
        context === CLASS && schoolId
          ? await api.getCoursesBySchoolId(schoolId)
          : [];
      // Extract course IDs for filtering
      const schoolCourseIds = schoolCourses.map(
        (schoolCourse) => schoolCourse.course_id
      );
      // Filter courseDocs based on the context
      const filteredCourseDocs =
        context === CLASS
          ? courseDocs.filter((course) => schoolCourseIds.includes(course.id))
          : courseDocs;

      // Map courses to curriculums and grades
      const curriculumWithCourses = curriculumDocs.reduce<
        Record<string, CurriculumWithCourses>
      >((acc, curriculum) => {
        const coursesForCurriculum = filteredCourseDocs.filter(
          (course) => course.curriculum_id === curriculum.id
        );

        coursesForCurriculum.forEach((course) => {
          const grade = allGrades.find((grade) => grade.id === course.grade_id);
          const gradeName = grade ? grade.name : "N/A";
          const key = `${curriculum.name} - ${t("Grade")} ${gradeName}`;

          if (!acc[key]) {
            acc[key] = {
              curriculum: {
                id: curriculum.id,
                name: curriculum.name,
                grade: gradeName,
              },
              courses: [],
            };
          }

          acc[key].courses.push(course);
        });

        return acc;
      }, {});

      // Sort and set the data
      const sortedCurriculums = Object.values(curriculumWithCourses)
        .map((curriculumWithCourses) => ({
          ...curriculumWithCourses,
          courses: curriculumWithCourses.courses.sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }))
        .sort((a, b) => {
          const nameComparison = a.curriculum.name.localeCompare(
            b.curriculum.name
          );

          if (nameComparison !== 0) {
            return nameComparison;
          }

          const gradeA = extractGradeNumber(a.curriculum.grade);
          const gradeB = extractGradeNumber(b.curriculum.grade);

          return gradeA - gradeB;
        });

      // Helper function to extract numeric grade value
      function extractGradeNumber(grade: string | undefined): number {
        if (!grade) return 0;
        if (grade.toLowerCase().includes("below")) return -1;

        const match = grade.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }

      // Update state based on context
      if (context === SCHOOL) {
        setCurriculumsWithCourses(sortedCurriculums);
      } else {
        setCurriculumsWithCourses(sortedCurriculums);
      }
    } catch (error) {
      console.error(t("Failed to fetch curriculums and courses"), error);
    }
  };
  const handleSubjectSelection = async (courseId: string) => {
    if (selectedSubjects.includes(courseId)) {
      setSelectedSubjects((prevSelected) =>
        prevSelected.filter((id) => id !== courseId)
      );
    } else {
      setSelectedSubjects((prev) => [...prev, courseId]);
    }
  };

  const fetchClassDetails = async () => {
    try {
      const tempClass = await api.getClassById(paramClassId);
      if (tempClass) {
        setCurrentClass(tempClass);
        await fetchSchoolAndClassSubjects(paramClassId, CLASS);
        const tempSchool = await api.getSchoolById(tempClass?.school_id);
        setCurrentSchool(tempSchool);
        fetchCurriculumsAndCourses(CLASS, tempSchool?.id);
      }
    } catch (error) {
      console.error("Failed to load class details", error);
    }
  };

  const fetchSchoolAndClassSubjects = async (
    id: string,
    type: "class" | "school"
  ) => {
    try {
      if (type === CLASS) {
        const selectedSubjectsFromApi = await api.getCoursesByClassId(id);
        setClassCourseData(selectedSubjectsFromApi);
        const courseIds = selectedSubjectsFromApi.map(
          (subject) => subject.course_id
        );
        setSelectedSubjects(courseIds);
        setInitialSelectedSubjects(courseIds);
      } else if (type === SCHOOL) {
        const school = await api.getSchoolById(id);
        setCurrentSchool(school);
        const selectedSubjectsFromApi = await api.getCoursesBySchoolId(id);
        setSchoolCourseData(selectedSubjectsFromApi);
        const courseIds = selectedSubjectsFromApi.map(
          (subject) => subject.course_id
        );
        setSelectedSubjects(courseIds);
        setInitialSelectedSubjects(courseIds);
      }
    } catch (error) {
      console.error(`Failed to fetch courses for ${type} with ID ${id}`, error);
      return [];
    }
  };

  async function getConnectedClassesForCourse(
    classIds: string[],
    courseId: string
  ) {
    const connectedClasses: {
      created_at: string;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string;
      school_id: string;
      updated_at: string | null;
    }[] = []; // Define the array type explicitly
    for (const classId of classIds) {
      const isConnected = await api.checkCourseInClasses([classId], courseId);
      if (isConnected) {
        const classDetails = await api.getClassById(classId);
        if (classDetails) {
          connectedClasses.push(classDetails);
        }
      }
    }
    return connectedClasses;
  }
  const generateCourseHTML = (
    curriculumImage: string,
    courseName: string,
    className: string
  ): string => {
    return `
      <div class="course-item">
        <img src="${curriculumImage}" alt="Curriculum Image" />
        <span>${courseName} — ${className}</span>
      </div>`;
  };

  const handleConfirmSelection = async () => {
    try {
      const deselectedSubjects = initialSelectedSubjects.filter(
        (id) => !selectedSubjects.includes(id)
      );

      if (paramSchoolId) {
        const currUser = await auth.getCurrentUser();
        if (!currUser) {
          console.warn("User not authenticated");
          return;
        }

        const classes = await api.getClassesForSchool(
          paramSchoolId,
          currUser?.id
        );
        const classIds = classes.map((classData) => classData.id);
        const coursesLinkedToClasses = await Promise.all(
          deselectedSubjects.map(async (courseId) => {
            const connectedClass = await getConnectedClassesForCourse(
              classIds,
              courseId
            );
            if (connectedClass && connectedClass.length > 0) {
              return connectedClass.map((cls) => ({
                courseId,
                className: cls.name,
              }));
            }
            return [];
          })
        );

        const flattenedCoursesLinkedToClasses = coursesLinkedToClasses.flat();
        const coursesThatCannotBeRemoved =
          flattenedCoursesLinkedToClasses.filter((entry) => entry !== null);

        if (coursesThatCannotBeRemoved.length > 0) {
          const courseDetails = await Promise.all(
            coursesThatCannotBeRemoved.map((entry) =>
              api.getCourse(entry.courseId)
            )
          );

          const curriculumDetails = await Promise.all(
            coursesThatCannotBeRemoved.map((entry, index) =>
              api.getCurriculumById(courseDetails[index]?.curriculum_id ?? "")
            )
          );

          const courseDisplayNames = coursesThatCannotBeRemoved.map(
            (entry, index) => {
              const courseName = courseDetails[index]?.name || "Unknown Course";
              const curriculumName =
                curriculumDetails[index]?.name || "Unknown Curriculum";
              const curriculumImage = curriculumDetails[index]?.image || "";
              return generateCourseHTML(
                curriculumImage,
                courseName,
                entry.className
              ); // Return the HTML here
            }
          );

          setAlertState({
            isOpen: true,
            header: t(
              "This subject is linked to the below classes in the school and cannot be removed\n"
            ),
            message: courseDisplayNames.join("\n"),
          });
          return;
        }
      }

      // Collect course IDs to remove
      const classCourseIds: string[] = [];
      const schoolCourseIds: string[] = [];
      for (const courseId of deselectedSubjects) {
        if (paramClassId) {
          const matchingCourse = classCourseData.find(
            (entry) =>
              entry.class_id === paramClassId && entry.course_id === courseId
          );
          if (matchingCourse) {
            classCourseIds.push(matchingCourse.id);
          }
        } else if (paramSchoolId) {
          const matchingCourse = schoolCourseData.find(
            (entry) =>
              entry.school_id === paramSchoolId && entry.course_id === courseId
          );
          if (matchingCourse) {
            schoolCourseIds.push(matchingCourse.id);
          }
        }
      }
      // Remove courses in bulk
      if (classCourseIds.length > 0) {
        await api.removeCoursesFromClass(classCourseIds);
      }
      if (schoolCourseIds.length > 0) {
        await api.removeCoursesFromSchool(schoolCourseIds);
      }
      // Update backend with selected subjects
      const selectedCourseIds = curriculumsWithCourses.flatMap(({ courses }) =>
        courses
          .filter((course) => selectedSubjects.includes(course.id))
          .map((course) => course.id)
      );

      if (paramClassId) {
        await api.updateClassCourseSelection(paramClassId, selectedCourseIds);
      } else if (paramSchoolId) {
        await api.updateSchoolCourseSelection(paramSchoolId, selectedCourseIds);
      }

      if (previousOrigin === PAGES.DISPLAY_SCHOOLS) {
        Util.setNavigationState(School_Creation_Stages.CREATE_CLASS);
        history.replace(PAGES.ADD_CLASS, {
          school: currentSchool,
          origin: PAGES.SUBJECTS_PAGE,
        });
      } else if (previousOrigin === PAGES.HOME_PAGE) {
        Util.setCurrentSchool(currentSchool!, RoleType.PRINCIPAL);
        Util.setCurrentClass(currentClass!);
        Util.clearNavigationState();
        history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
      } else {
        if (navigationState?.stage === School_Creation_Stages.CLASS_COURSE) {
          Util.setCurrentSchool(currentSchool!, RoleType.PRINCIPAL);
          Util.setCurrentClass(currentClass!);
          Util.clearNavigationState();
          history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
        }
        setIsSelecting(false);
      }

      // Refresh data
      if (paramClassId) {
        fetchSchoolAndClassSubjects(paramClassId, CLASS);
      } else if (paramSchoolId) {
        fetchSchoolAndClassSubjects(paramSchoolId, SCHOOL);
      }
    } catch (error) {
      console.error("Failed to update course selections", error);
    }
  };

  const handleSubjectClick = (subject: string) => {
    setCurrentSubject(subject);
    setIsModalOpen(true);
  };
  const handleRemoveSubject = async (courseId: string) => {
    try {
      setCurrentSubject(courseId); // Set the currently clicked subject

      if (paramSchoolId) {
        const currUser = await auth.getCurrentUser();
        if (!currUser) {
          console.warn("User not authenticated");
          return;
        }
        const classes = await api.getClassesForSchool(
          paramSchoolId,
          currUser?.id
        );
        const classIds = classes.map((classData) => classData.id);
        // Check if the current subject is connected to any classes
        const connectedClasses = await getConnectedClassesForCourse(
          classIds,
          courseId
        );
        if (connectedClasses.length > 0) {
          const courseDetails = await api.getCourse(courseId);
          const curriculumDetails = await api.getCurriculumById(
            courseDetails?.curriculum_id ?? ""
          );
          const curriculumImage = curriculumDetails?.image || "";
          const courseDisplayName = generateCourseHTML(
            curriculumImage,
            courseDetails?.name || "Unknown Course",
            connectedClasses[0]?.name
          );
          setAlertState({
            isOpen: true,
            header: t(
              "This subject is linked to the following class and cannot be removed:"
            ),
            message: courseDisplayName,
          });
          return;
        }
      }
      // Proceed with removal if no connection
      if (paramClassId) {
        const matchingCourse = classCourseData.find(
          (entry) =>
            entry.class_id === paramClassId && entry.course_id === courseId
        );
        if (matchingCourse) {
          await api.removeCoursesFromClass([matchingCourse.id]);
        }
      } else if (paramSchoolId) {
        const matchingCourse = schoolCourseData.find(
          (entry) =>
            entry.school_id === paramSchoolId && entry.course_id === courseId
        );
        if (matchingCourse) {
          await api.removeCoursesFromSchool([matchingCourse.id]);
        }
      }
      // Update selected subjects
      setSelectedSubjects((prevSelected) =>
        prevSelected.filter((id) => id !== courseId)
      );
    } catch (error) {
      console.error("Error while removing subject:", error);
    }
  };

  const onBackButtonClick = () => {
    // if (navigationState?.stage === School_Creation_Stages.SCHOOL_COURSE) {
    //   Util.setNavigationState(School_Creation_Stages.CREATE_SCHOOL);
    //   console.log("ha ha ha 1",currentSchool,currentClass);
    //   history.replace(PAGES.EDIT_SCHOOL, {
    //     school: currentSchool,
    //     role: RoleType.PRINCIPAL,
    //   });
    // } else
    if (navigationState?.stage === School_Creation_Stages.CLASS_COURSE) {
      Util.setNavigationState(School_Creation_Stages.CREATE_CLASS);
      history.replace(PAGES.EDIT_CLASS, {
        school: currentSchool,
        classDoc: currentClass,
      });
    } else {
      paramSchoolId
        ? history.replace(PAGES.MANAGE_SCHOOL)
        : history.replace(PAGES.MANAGE_CLASS);
    }
  };

  const transformedCurriculumsWithCourses = curriculumsWithCourses.map(
    ({ curriculum, courses }) => ({
      curriculum: {
        id: curriculum.id,
        name: curriculum.name,
        grade: curriculum.grade || "N/A",
      },
      courses: courses.map((course) => ({
        id: course.id,
        name: course.name,
        image: course.image || undefined,
      })),
    })
  );

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
          navigationState?.stage === School_Creation_Stages.SCHOOL_COURSE
            ? true
            : false
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
          { text: t("OK"), role: "cancel", cssClass: "alert-okay-button" },
        ]}
        cssClass="custom-alert-in-subject-selection-page"
      />
      {!isSelecting && <AddButton onClick={() => setIsSelecting(true)} />}
    </div>
  );
};

export default SubjectSelection;
