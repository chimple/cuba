import { FC, MouseEvent, useEffect, useState } from "react";
import { useHistory } from "react-router";
import "./TeacherAssignment.css";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import SelectIconImage from "../../../../components/displaySubjects/SelectIconImage";
import { AssignmentSource, CAMERAPERMISSION, COURSES, PAGES, TableTypes } from "../../../../common/constants";
import { Util } from "../../../../utility/util";
import { t } from "i18next";
import { Toast } from "@capacitor/toast";
import AssignmentNextButton from "./AssignmentNextButton";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { App } from '@capacitor/app';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Loading from "../../../../components/Loading";
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { IonIcon } from "@ionic/react";

declare global {
  interface Window {
    __qrBackListener?: { remove: () => void } | null;
  }
}


export enum TeacherAssignmentPageType {
  MANUAL = "manual",
  RECOMMENDED = "recommended",
}

const TeacherAssignment: FC<{ onLibraryClick: () => void }> = ({
  onLibraryClick,
}) => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const [manualAssignments, setManualAssignments] = useState<any>({});
  const [recommendedAssignments, setRecommendedAssignments] = useState<any>({});
  const [currentUser, setCurrentuser] = useState<TableTypes<"user"> | null>(null);
  const [loading, setLoading] = useState(false);

  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [recommendedCollapsed, setRecommendedCollapsed] = useState(true);
  const [selectedLessonsCount, setSelectedLessonsCount] = useState({
    [TeacherAssignmentPageType.MANUAL]: { count: 0 },
    [TeacherAssignmentPageType.RECOMMENDED]: { count: 0 },
  });
  const auth = ServiceConfig.getI().authHandler;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    let tempLessons: any = {};
    const current_class = await Util.getCurrentClass();
    const currUser = await auth.getCurrentUser();
    setCurrentuser(currUser as TableTypes<"user">);
    if (!current_class || !current_class.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
    const courseList = await api.getCoursesForClassStudent(current_class.id);

   const previous_sync_lesson = currUser?.id
     ? await api.getUserAssignmentCart(currUser?.id)
     : null;

   if (previous_sync_lesson?.lessons) {
     const all_sync_lesson: Map<string, string> = new Map(
       Object.entries(JSON.parse(previous_sync_lesson.lessons))
     );

     const sync_lesson_data = all_sync_lesson.get(current_class.id);
     const parsed_chapter_data = sync_lesson_data
       ? JSON.parse(sync_lesson_data)
       : {};

     const sync_lesson: Map<string, any> = new Map(
       Object.entries(parsed_chapter_data)
     );

     for (const [chapterId, sourceMapOrArray] of sync_lesson.entries()) {
       const allLessonIdsSet = new Set<string>();

       if (Array.isArray(sourceMapOrArray)) {
         // 🟡 Old format — directly lesson ID array
         sourceMapOrArray.forEach((id: string) => allLessonIdsSet.add(id));
       } else if (
         typeof sourceMapOrArray === "object" &&
         sourceMapOrArray !== null
       ) {
         // ✅ New format — source-keyed map (manual/qr_code)
         if (sourceMapOrArray[AssignmentSource.MANUAL]) {
           sourceMapOrArray[AssignmentSource.MANUAL].forEach((id: string) =>
             allLessonIdsSet.add(id)
           );
         }
         if (sourceMapOrArray[AssignmentSource.QR_CODE]) {
           sourceMapOrArray[AssignmentSource.QR_CODE].forEach((id: string) =>
             allLessonIdsSet.add(id)
           );
         }
       }

       for (const lessonId of allLessonIdsSet) {
         const l: {
           lesson: any[];
           course: TableTypes<"course">[];
         } = await api.getLessonFromChapter(chapterId, lessonId);

         const courseId = l.course[0].id;

         if (!tempLessons[courseId]) {
           tempLessons[courseId] = {
             name: l.course[0].name,
             courseCode: l.course[0].code,
             lessons: [],
             isCollapsed: false,
             sort_index: l.course[0].sort_index,
           };
         }

         l.lesson[0].selected = true;
         tempLessons[courseId].lessons.push(l.lesson[0]);
       }
     }

     updateSelectedLesson(TeacherAssignmentPageType.MANUAL, tempLessons);

     if (Object.keys(tempLessons).length === 0) {
       setRecommendedCollapsed(false);
     }

     setManualAssignments(tempLessons);
   }
    const lastAssignmentsCourseWise: TableTypes<"assignment">[] | undefined =
      await api.getLastAssignmentsForRecommendations(current_class.id);
    getRecommendedAssignments(courseList, lastAssignmentsCourseWise, tempLessons);
  };

  const getRecommendedAssignments = async (
    courseList: TableTypes<"course">[],
    lastAssignmentsCourseWise: TableTypes<"assignment">[] | undefined,
    tempLessons: any
  ) => {
    let recommendedAssignments: any = {};
    for (const course of courseList) {
      if (!recommendedAssignments[course.id]) {
        recommendedAssignments[course.id] = {
          name: course.name,
          courseCode:course.code,
          lessons: [],
          sort_index: course.sort_index, // Added sort_index here
        };
      }
      const lastAssignment = lastAssignmentsCourseWise?.find(
        (assignment) => assignment.course_id === course.id
      );

      const courseChapters = await api.getChaptersForCourse(course.id);
      if (!courseChapters || courseChapters.length === 0) {
        console.warn(`No chapters found for course ID: ${course.id}`);
        continue;
      }
      const chapterId = lastAssignment
        ? lastAssignment.chapter_id
        : courseChapters[0]?.id ?? "";
      if (chapterId) {
        const lessonList = await api.getLessonsForChapter(chapterId);
        const lessonIndex = lessonList?.findIndex(
          (lesson) => lesson.id === lastAssignment?.lesson_id
        );
        if (
          lessonList.length > 0 &&
          lessonList.length >= lessonIndex + 1 &&
          lessonList[lessonIndex + 1]
        ) {
          recommendedAssignments[course.id].lessons.push(
            lessonList[lessonIndex + 1]
          );
        } else {
          const allChapters = await api.getChaptersForCourse(course.id);
          const i = allChapters.findIndex((chapter) => chapter.id === chapterId);
          const nextChapter = allChapters[i + 1];

          const lessonList = await api.getLessonsForChapter(nextChapter.id);
          recommendedAssignments[course.id].lessons.push(lessonList[0]);
        }
      }
    }
    const updatedRecommendedAssignments = { ...recommendedAssignments };
    if (Object.keys(tempLessons).length > 0) {
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map((assignment) => ({
            ...assignment,
            selected: false,
            source: AssignmentSource.RECOMMENDED,
          }));
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments
      );
    } else {
      const updatedRecommendedAssignments = { ...recommendedAssignments };
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map((assignment) => ({
            ...assignment,
            selected: true,
            source: AssignmentSource.RECOMMENDED,
          }));
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments
      );
    }
  };

  const toggleAssignmentSelection = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
    subject: string,
    index: number
  ) => {
    const updatedAssignments = { ...category };
    updatedAssignments[subject].lessons[index].selected =
      !updatedAssignments[subject].lessons[index].selected;

    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const updateSelectedLesson = (type: TeacherAssignmentPageType, updatedAssignments: any) => {
    let tempSelectedCount = { ...selectedLessonsCount };
    tempSelectedCount[type].count = 0;
    Object.keys(updatedAssignments).forEach((subjectId) => {
      let lessonCount = 0;

      updatedAssignments[subjectId].lessons.forEach((assignment: any) => {
        if (assignment.selected) {
          lessonCount++;
          if (!tempSelectedCount[type][subjectId]) {
            tempSelectedCount[type][subjectId] = { count: [] };
          }
          if (!tempSelectedCount[type][subjectId].count.includes(assignment.id)) {
            tempSelectedCount[type][subjectId].count.push(assignment.id);
          }
        } else {
          if (!tempSelectedCount[type][subjectId]) {
            tempSelectedCount[type][subjectId] = { count: [] };
          }
          if (tempSelectedCount[type][subjectId].count.includes(assignment.id)) {
            const i = tempSelectedCount[type][subjectId].count.findIndex(
              (id: any) => id === assignment.id
            );
            if (i > -1) {
              tempSelectedCount[type][subjectId].count.splice(i, 1);
            }
          }
        }
      });

      tempSelectedCount[type].count =
        tempSelectedCount[type].count || 0;
      tempSelectedCount[type].count += lessonCount;
    });

    setSelectedLessonsCount(tempSelectedCount);
  };

  const toggleCollapse = (setCollapsed: any, collapsed: boolean) => {
    setCollapsed(!collapsed);
  };

  const toggleSubjectCollapse = (type: TeacherAssignmentPageType, subject: string) => {
    const newCollapsed =
      type === TeacherAssignmentPageType.MANUAL
        ? { ...manualAssignments }
        : { ...recommendedAssignments };

    newCollapsed[subject].isCollapsed = !newCollapsed[subject].isCollapsed;

    if (type === TeacherAssignmentPageType.MANUAL) {
      setManualAssignments(newCollapsed);
    } else {
      setRecommendedAssignments(newCollapsed);
    }
  };

  const selectAllAssignments = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any
  ) => {
    const allSelected = Object.keys(category).every((subjectId) =>
      category[subjectId].lessons.every((assignment: any) => assignment.selected)
    );
    const updatedAssignments = { ...category };
    Object.keys(updatedAssignments).forEach((subjectId) => {
      updatedAssignments[subjectId].lessons = updatedAssignments[subjectId].lessons.map(
        (assignment: any) => ({
          ...assignment,
          selected: !allSelected,
        })
      );
    });
    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const selectAllAssignmentsInSubject = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
    subjectId: string
  ) => {
    const allSelected = category[subjectId].lessons.every(
      (assignment: any) => assignment.selected
    );

    const updatedAssignments = { ...category };
    updatedAssignments[subjectId].lessons = updatedAssignments[subjectId].lessons.map(
      (assignment: any) => ({
        ...assignment,
        selected: !allSelected,
      })
    );

    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const areAllSelected = (category: any) => {
    return Object.keys(category)?.length > 0
      ? Object.keys(category)?.every((subjectId) =>
          category[subjectId]?.lessons?.every(
            (assignment: any) => assignment?.selected
          )
        )
      : false;
  };

  const areAllSelectedInSubject = (category: any, subjectId: string) => {
    return category[subjectId]?.lessons.every(
      (assignment: any) => assignment?.selected
    );
  };
  const renderAssignments = (
    assignments: any,
    category: any,
    setCategory: any,
    type: TeacherAssignmentPageType
  ) => {
    const sortedSubjectKeys = Object.keys(assignments).sort(
      (a, b) =>
        (assignments[a].sort_index ?? Infinity) -
        (assignments[b].sort_index ?? Infinity)
    );
    return sortedSubjectKeys.map((subjectId) => (
      <div key={subjectId} className="render-subject">
        <div
          className="subject-header"
          onClick={() => toggleSubjectCollapse(type, subjectId)}
        >
          <h4>{assignments[subjectId]?.name}</h4>
          {assignments[subjectId].isCollapsed ? (
            <img src="assets/icons/iconDown.png" alt="DropDown_Icon" style={{width: "16px", height: "16px", marginLeft: "auto"}} />
          ) : (
            <img src="assets/icons/iconDown.png" alt="DropDown_Icon" style={{width: "16px", height: "16px", marginLeft: "auto"}} />
          )}
          {/* <h4>
            {selectedLessonsCount?.[type]?.[subjectId]?.count?.length ?? 0}/
            {assignments[subjectId]?.lessons?.length ?? 0}
          </h4> */}
          {/* {!assignments[subjectId].isCollapsed && (
            <div className="select-all-container">
              <input
                className="select-all-container-checkbox"
                type="checkbox"
                checked={areAllSelectedInSubject(assignments, subjectId)}
                onClick={(e) => e.stopPropagation()}
                onChange={() =>
                  selectAllAssignmentsInSubject(
                    type,
                    assignments,
                    setCategory,
                    subjectId
                  )
                }
              />
            </div>
          )} */}
        </div>
        {!assignments[subjectId].isCollapsed && (
        <div>
        {assignments[subjectId].lessons.map(
          (assignment: any, index: number) => {
            const isSelected = assignment?.selected;
            const courseCode = assignments[subjectId]?.courseCode;
            return (
              <div key={index} className="assignment-list-item">
                <SelectIconImage
                  defaultSrc={"assets/icons/DefaultIcon.png"}
                  webSrc={assignment?.image}
                  imageWidth="100px"
                  imageHeight="100px"
                />
                <span className="assignment-list-item-name">
                  {courseCode ===COURSES.ENGLISH
                    ? assignment?.name ?? ""
                    : t(assignment?.name ?? "")}
                </span>

                <IonIcon
                  icon={isSelected ? checkmarkCircle : ellipseOutline}
                  id="checkbox-subject"
                  className={`subject-page-checkbox ${isSelected ? "selected" : ""}`}
                  onClick={() =>
                    toggleAssignmentSelection(
                      type,
                      assignments,
                      setCategory,
                      subjectId,
                      index
                    )
                  }
                />
              </div>
            );
          }
        )}
      </div>
        )}
      </div>
    ));
  };

  const startScan = async () => {
    try {
      setLoading(true);

      // Start scanning (permissions handled automatically)
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL, // QR + all barcodes
      });

      if (result.ScanResult) {
        await processScannedData(result.ScanResult);
      } else {
        Toast.show({ text: "No QR code detected." });
      }

    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setLoading(false);
    }
  };
const processScannedData = async (scannedText: string) => {
  try {
    // Ensure scannedText uses https if it starts with http
    let processedText = scannedText;
    if (processedText.startsWith("http://")) {
      processedText = processedText.replace(/^http:\/\//, "https://");
    }

    const result = await api.getChapterIdbyQrLink(processedText);
    if (!result?.chapter_id) {
      Toast.show({ text: t("Chapter Not Found") });
      return;
    }
    const lessonList = await api.getLessonsForChapter(result?.chapter_id);
    if (!lessonList || lessonList.length < 1) {
      Toast.show({ text: t("No lessons found for this chapter") });
      return;
    }
    // Get course info for this chapter
    const course = await api.getCourse(result.course_id?? "");
    if (!course) {
      Toast.show({ text: t("Course not found for this chapter") });
      return;
    }
    const current_class = await Util.getCurrentClass();
    const classId = current_class?.id ?? "";
    // Step 1: Load existing assignment cart
    const previousCart = currentUser?.id
      ? await api.getUserAssignmentCart(currentUser?.id)
      : null;

    let lessonsMap: Map<string, string>; // classId → JSON string of ChapterLessonMap
    if (previousCart?.lessons) {
      lessonsMap = new Map(Object.entries(JSON.parse(previousCart.lessons)));
    } else {
      lessonsMap = new Map();
    }

    // Step 2: Parse or init the chapterLessonMap for this class
    let chapterLessonMap: Record<
      string,
      Partial<Record<AssignmentSource, string[]>>
    > = {};

    if (lessonsMap.has(classId)) {
      chapterLessonMap = JSON.parse(lessonsMap.get(classId)!);
    }

    const chapterId = result.chapter_id;
    const newLessonIds = lessonList.map((l: any) => l.id);

    // Step 3: Normalize old format (array) to new format (manual source map)
    if (
      Array.isArray(chapterLessonMap[chapterId])
    ) {
      const oldLessonIds = chapterLessonMap[chapterId] as string[];
      chapterLessonMap[chapterId] = {
        [AssignmentSource.MANUAL]: oldLessonIds,
      };
    }

    // Step 4: Merge new QR lessons
    if (!chapterLessonMap[chapterId]) {
      chapterLessonMap[chapterId] = {};
    }

    const existingQR = (chapterLessonMap[chapterId] as any)?.[
      AssignmentSource.QR_CODE
    ] ?? [];

    const mergedQRLessons = Array.from(new Set([...existingQR, ...newLessonIds]));

    (chapterLessonMap[chapterId] as any)[AssignmentSource.QR_CODE] = mergedQRLessons;

    // Step 5: Store updated data
    lessonsMap.set(classId, JSON.stringify(chapterLessonMap));

    const finalLessonsJson = JSON.stringify(Object.fromEntries(lessonsMap));

    await api.createOrUpdateAssignmentCart(currentUser?.id!, finalLessonsJson);

    history.push(PAGES.SCAN_REDIRECT);
    // await init();
  } catch (error) {
    Toast.show({ text: t("Something Went wrong") });
    console.error("Error processing scanned data:", error);
  }
};
  return (
    <>
    {loading ? <Loading isLoading={loading}/>:
    <div className="teacher-assignments-page">
      <p id="assignment-page-heading">{t("Assignments")}</p>
      <div className="manual-assignments">
        <div
          className="manual-assignments-header"
          onClick={() => toggleCollapse(setManualCollapsed, manualCollapsed)}
        >
          <p
            className="recommended-assignments-headings"
            style={{ width: !manualCollapsed ? "60%" : "100%" }}
            id = "manual-assignments-heading"
          >
            {t("Manual Assignments")}
          </p>
          <div>
            {manualCollapsed ? (
              <img src="assets/icons/iconDown.png" alt="DropDown_Icon" style={{width: "16px", height: "16px"}} />
            ) : (
              <div className="select-all-container">
                <label className="recommended-assignments-headings">
                  {t("Select All")}
                </label>
                <input
                  className="select-all-container-checkbox"
                  type="checkbox"
                  checked={areAllSelected(manualAssignments)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    selectAllAssignments(
                      TeacherAssignmentPageType.MANUAL,
                      manualAssignments,
                      setManualAssignments
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
        <hr className="styled-line" />
        {!manualCollapsed &&
          (manualAssignments && Object.keys(manualAssignments).length > 0 ? (
            <>
              {renderAssignments(
                manualAssignments,
                manualAssignments,
                setManualAssignments,
                TeacherAssignmentPageType.MANUAL
              )}
              <div className="TeacherAssignment-Add-moreAssignments">
                <p>
                  {t(
                    "To add more assignments. Please use the buttons below to add assignments."
                  )}
                </p>
                <div className="TeacherAssignment-add-moreAssignments-button">
                  <div
                    className="TeacherAssignment-manual-assignments-icon-btn"
                    onClick={() => onLibraryClick()}
                  >
                    <img
                      src="assets/icons/bookSelected.png"
                      alt="Library"
                      className="TeacherAssignment-addAssignment-icon1"
                    />
                    <span
                      style={{ fontWeight: 500, color: "#444", fontSize: 16 }}
                    >
                      {t("Library")}
                    </span>
                  </div>
                  <div
                    className="TeacherAssignment-manual-assignments-icon-btn"
                    onClick={startScan}
                  >
                    <QrCode2Icon
                      sx={{ color: "#7C5DB0" }}
                      className="TeacherAssignment-addAssignment-icon2"
                    />
                    <span
                      style={{ fontWeight: 500, color: "#444", fontSize: 16 }}
                    >
                      {t("Scan QR")}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="TeacherAssignment-Add-moreAssignments">
              <p>
                {t(
                  "You have not chosen any assignments. Please use the buttons below to add assignments."
                )}
              </p>
              <div className="TeacherAssignment-add-moreAssignments-button">
                <div
                  className="TeacherAssignment-manual-assignments-icon-btn"
                  onClick={() => onLibraryClick()}
                >
                  <img
                    src="assets/icons/bookSelected.png"
                    alt="Library"
                    className="TeacherAssignment-addAssignment-icon1"
                  />
                  <span
                    style={{ fontWeight: 500, color: "#444", fontSize: 16 }}
                  >
                    {t("Library")}
                  </span>
                </div>
                <div
                  className="TeacherAssignment-manual-assignments-icon-btn"
                  onClick={startScan}
                >
                  <QrCode2Icon
                    sx={{ color: "#7C5DB0" }}
                    className="TeacherAssignment-addAssignment-icon2"
                  />
                  <span
                    style={{ fontWeight: 500, color: "#444", fontSize: 16 }}
                  >
                    {t("Scan QR")}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="recommended-assignments">
        <div
          className="recommended-assignments-header"
          onClick={() =>
            toggleCollapse(setRecommendedCollapsed, recommendedCollapsed)
          }
        >
          <p
            className="recommended-assignments-headings"
            style={{ width: !recommendedCollapsed ? "60%" : "100%" }}
            id="recommended-assignments-heading"
          >
            {t("Recommended Assignments")}
          </p>
          <div>
            {recommendedCollapsed ? (
              <img src="assets/icons/iconDown.png" alt="DropDown_Icon" style={{width: "16px", height: "16px"}} />
            ) : (
              <div className="select-all-container">
                {/* <h3 className="recommended-assignments-headings">
                  {selectedLessonsCount?.[TeacherAssignmentPageType.RECOMMENDED]?.count ?? 0}/
                  {Object.keys(recommendedAssignments).reduce((total, subjectId) => {
                    return total + recommendedAssignments[subjectId].lessons.length;
                  }, 0)}
                </h3> */}
                <label className="recommended-assignments-headings">
                  {t("Select All")}
                </label>
                <input
                  className="select-all-container-checkbox"
                  type="checkbox"
                  checked={areAllSelected(recommendedAssignments)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    selectAllAssignments(
                      TeacherAssignmentPageType.RECOMMENDED,
                      recommendedAssignments,
                      setRecommendedAssignments
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
        <hr className="styled-line" />
        {!recommendedCollapsed &&
          renderAssignments(
            recommendedAssignments,
            recommendedAssignments,
            setRecommendedAssignments,
            TeacherAssignmentPageType.RECOMMENDED
          )}
      </div>

      <AssignmentNextButton
        assignmentCount={
          selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
          selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED].count
        }
        onClickCallBack={async () => {
          if (
            selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
              selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED]
                .count >
            0
          ) {
            history.replace(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE, {
              selectedAssignments: selectedLessonsCount,
              manualAssignments: manualAssignments,
              recommendedAssignments: recommendedAssignments,
            });
          } else {
            await Toast.show({
              text: t("Please select the Assignment") || "",
              duration: "long",
            });
          }
        }}
      />
    </div>}
    </>
  );
};

export default TeacherAssignment;
