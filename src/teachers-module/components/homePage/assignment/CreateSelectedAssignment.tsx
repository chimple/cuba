import { useEffect, useState } from "react";
import "./CreateSelectedAssignment.css"; // Assuming you will have a separate CSS file for styles
import { IonIcon } from "@ionic/react";
import {
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";
import {
  ALL_SUBJECT,
  ASSIGNMENT_TYPE,
  AssignmentSource,
  BANDS,
  BANDWISECOLOR,
  PAGES,
} from "../../../../common/constants";
import { ClassUtil } from "../../../../utility/classUtil";
import { Util } from "../../../../utility/util";
import { useHistory } from "react-router";
import { t } from "i18next";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { TeacherAssignmentPageType } from "./TeacherAssignment";
import CommonDialogBox from "../../../../common/CommonDialogBox";
import Loading from "../../../../components/Loading";
import CalendarPicker from "../../../../common/CalendarPicker";
import { Toast } from "@capacitor/toast";
import { addMonths, format } from "date-fns";
import { Trans } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
interface LessonDetail {
  subject: string;
  chapter: string;
  lesson: string;
}

interface Chapter {
  name: string;
  lessons: string[];
}

interface SubjectGroup {
  subject: string;
  chapters: Chapter[];
}
const CreateSelectedAssignment = ({
  selectedAssignments,
  manualAssignments,
  recommendedAssignments,
}) => {
  const history = useHistory();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [groupWiseStudents, setGroupWiseStudents] = useState({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [maxEndDate, setMaxEndDate] = useState("");
  const [allSelected, setAllSelected] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shareTextLessonDetails, setShareTextLessonDetails] = useState<
    LessonDetail[]
  >([]);
  const [assignmentBatchId, setAssignmentBatchId] = useState<string | null>(
    null
  );

  useEffect(() => {
    init();
    assignmentsInfo();
  }, []);

  const init = async () => {
    let todayDate = new Date().toISOString().slice(0, 10);
    setStartDate(todayDate);

    let nextMonthDate = new Date(todayDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setEndDate(nextMonthDate.toISOString().slice(0, 10));

    const _classUtil = new ClassUtil();
    const current_class = Util.getCurrentClass();
    if (!current_class || !current_class.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }

     const classCourses = await api.getCoursesForClassStudent(current_class.id);
    const selectedSubject = Util.getCurrentCourse(current_class?.id)
    const subject_ids = classCourses.map((item) => item.id);
    const selectedsubjectIds: string[] =
      selectedSubject?.id === ALL_SUBJECT.id || !selectedSubject?.id
        ? subject_ids
        : [selectedSubject.id];
    
    const _studentProgress = await _classUtil.divideStudents(current_class.id, selectedsubjectIds);
    let _studentList =
      await _classUtil.groupStudentsByCategoryInList(_studentProgress);

    //  Selecting all student Bands
    _studentList.forEach((category) => {
      category.forEach((student: any) => {
        student.selected = true;
      });
    });
    setGroupWiseStudents({
      [BANDS.REDGROUP]: {
        title: t("Need Help"),
        isCollapsed: true,
        color: BANDWISECOLOR.RED,
        students: _studentList?.get(BANDS.REDGROUP) ?? [],
      },
      [BANDS.YELLOWGROUP]: {
        title: t("Still Learning"),
        isCollapsed: true,
        color: BANDWISECOLOR.YELLOW,
        students: _studentList?.get(BANDS.YELLOWGROUP) ?? [],
      },
      [BANDS.GREENGROUP]: {
        title: t("Doing Good"),
        isCollapsed: true,
        color: BANDWISECOLOR.GREEN,
        students: _studentList?.get(BANDS.GREENGROUP) ?? [],
      },
      [BANDS.GREYGROUP]: {
        title: t("Not Tracked"),
        isCollapsed: true,
        color: BANDWISECOLOR.GREY,
        students: _studentList?.get(BANDS.GREYGROUP) ?? [],
      },
    });
    const oneMonthLater = new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    );
    setMaxEndDate(oneMonthLater.toISOString().split("T")[0]);
  };

  const assignmentsInfo = async () => {
    try {
      // Get current class and user
      const current_class = Util.getCurrentClass();
      const currUser = await auth.getCurrentUser();
      // Guard clases for missing data
      if (!currUser || !current_class) {
        console.error("Current user or class not found");
        setIsLoading(false);
        return;
      }

      let tempLessonInfo: LessonDetail[] = [];

      // Iterate through assignment types (manual/recommended)
      for (const type of Object.keys(selectedAssignments)) {
        for (const subjectId of Object.keys(selectedAssignments[type])) {
          const subjectData = selectedAssignments[type][subjectId];

          if (!subjectData || subjectId === "count") continue;

          const tempLessons =
            type === TeacherAssignmentPageType.MANUAL
              ? manualAssignments[subjectId]?.lessons ?? []
              : recommendedAssignments[subjectId]?.lessons ?? [];

          if (!tempLessons.length) {
            console.warn(`No lessons found for subjectId ${subjectId}`);
            continue;
          }
          // Process lessons asynchronously in parallel
          await Promise.all(
            subjectData.count.map(async (lessonId) => {
              const tempLes = tempLessons.find(
                (les: any) => les.id === lessonId
              );
              if (!tempLes) {
                console.warn(`Lesson not found for lessonId: ${lessonId}`);
                return;
              }

              const tempChapterId =
                (await api.getChapterByLesson(tempLes.id, current_class.id)) ??
                "";
              if (!tempChapterId) {
                console.warn(`Chapter not found for lessonId: ${lessonId}`);
                return;
              }

              const lessonSubject = await api.getCourse(subjectId);

              const lessonChapter = await api.getChapterById(
                tempChapterId.toString()
              );
              const lessonObj = await api.getLesson(lessonId);

              tempLessonInfo.push({
                subject: lessonSubject?.name || "",
                chapter: lessonChapter?.name || "",
                lesson: lessonObj?.name || "",
              });
            })
          );
        }
      }
      setShareTextLessonDetails(tempLessonInfo);
    } catch (error) {
      console.error("Error creating assignments:", error);
    }
  };

  const handleDateConfirm = (type: "start" | "end", date: string) => {
    if (type === "start") {
      setStartDate(date);
      setShowStartDatePicker(false);
    } else {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };

  const toggleCollapse = (category) => {
    setGroupWiseStudents((bandStudents) => ({
      ...bandStudents,
      [category]: {
        ...bandStudents[category],
        isCollapsed: !bandStudents[category].isCollapsed,
      },
    }));
  };

  const toggleSelectAll = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    // Update all bands' students' selection state
    setGroupWiseStudents((bandStudents) => {
      const updatedBands = { ...bandStudents };
      Object.keys(updatedBands).forEach((band) => {
        updatedBands[band].students = updatedBands[band].students.map(
          (student) => ({
            ...student,
            selected: newAllSelected,
          })
        );
      });
      return updatedBands;
    });
  };

  const toggleStudentSelection = (category, index) => {
    setGroupWiseStudents((bandStudents) => {
      const updatedBands = { ...bandStudents };
      const students = [...updatedBands[category].students];
      students[index].selected = !students[index].selected;
      updatedBands[category].students = students;

      // Recalculate if "Select All" should be checked
      const allSelectedBands = Object.keys(updatedBands).every((band) =>
        updatedBands[band].students.every((student) => student.selected)
      );

      setAllSelected(allSelectedBands);
      return updatedBands;
    });
  };
  useEffect(() => {
    // Check if all bands are selected initially
    const initialAllSelected = Object.keys(groupWiseStudents).every((band) =>
      groupWiseStudents[band].students.every((student) => student.selected)
    );
    setAllSelected(initialAllSelected);
  }, [groupWiseStudents]);

  const getSelectedStudentList = (studentsMap) => {
    let studentList: string[] = [];
    Object.keys(studentsMap).forEach((group) => {
      studentsMap[group]?.students.forEach((student) => {
        if (student?.selected) {
          studentList.push(student.id);
        }
      });
    });

    return studentList;
  };

  const groupLessonDetails = (
    lessonDetails: LessonDetail[]
  ): SubjectGroup[] => {
    return lessonDetails.reduce((acc: SubjectGroup[], detail) => {
      let subjectGroup = acc.find((group) => group.subject === detail.subject);
      if (!subjectGroup) {
        subjectGroup = { subject: detail.subject, chapters: [] };
        acc.push(subjectGroup);
      }
      let chapter = subjectGroup.chapters.find(
        (ch) => ch.name === detail.chapter
      );
      if (!chapter) {
        chapter = { name: detail.chapter, lessons: [detail.lesson] };
        subjectGroup.chapters.push(chapter);
      } else {
        chapter.lessons.push(detail.lesson);
      }
      return acc;
    }, []);
  };

  const getShareText = async () => {
    const currentClass = await Util.getCurrentClass();
    const groupedDetails = groupLessonDetails(shareTextLessonDetails);

    let text = `🧒🧒🧒🧒 ${t(
      "Dear Students, Your teacher has assigned you the below homework. Please go to Chimple Learning app and complete it.\n\n"
    )}`;
    text += `*${t("Class")}: ${currentClass?.name.trim()}*\n\n`;
    groupedDetails.forEach((subjectDetails) => {
      text += `*${t("Subject")}: ${subjectDetails.subject}*\n`;
      subjectDetails.chapters.forEach((chapter, chapterIndex) => {
        text += `   ${chapterIndex + 1}. _*${t("Chapter")}*_: ${
          chapter.name
        }\n`;
        chapter.lessons.forEach((lesson, lessonIndex) => {
          const lessonNumber = `${chapterIndex + 1}.${lessonIndex + 1}`;
          const formattedLesson = `${lessonNumber} ${lesson}`;
          const space = "                      ";
          if (lessonIndex === 0) {
            text += `       _*${t("Lesson")}*_: ${formattedLesson}\n`;
          } else {
            text += `${space}${formattedLesson}\n`;
          }
        });
        text += `\n`;
      });
      text += `\n`;
    });

    text += `${t(
      "Please click this link to access your Homework"
    )}: https://chimple.cc/assignment?batch_id=${assignmentBatchId}&source=teacher`;

    return text.trim();
  };

  const createAssignmentsForStudents = async () => {
      const studentList = getSelectedStudentList(groupWiseStudents);
      if (studentList.length <= 0) {
        await Toast.show({
          text: t("Please select the Students") || "",
          duration: "long",
        });
        return;
      }

    const batchId = uuidv4();
    setAssignmentBatchId(batchId);

    // Step 1: Update assignment cart immediately to remove assigned lessons from UI
    (async () => {
    try {
      const current_class = await Util.getCurrentClass();
      const currUser = await auth.getCurrentUser();

      // Guard clases for missing data
      if (!currUser || !current_class) {
        console.error("Current user or class not found");
        setIsLoading(false);
        return;
      }
      const previous_sync_lesson = currUser?.id
        ? await api.getUserAssignmentCart(currUser?.id)
        : null;
      const all_sync_lesson: Map<string, string> = new Map(
        previous_sync_lesson?.lessons
          ? Object.entries(JSON.parse(previous_sync_lesson.lessons))
          : []
      );
      const sync_lesson_data = all_sync_lesson.get(current_class?.id ?? "");
      let sync_lesson: Map<string, Record<string, string[]>> = new Map(
        sync_lesson_data ? Object.entries(JSON.parse(sync_lesson_data)) : []
      );

      // Remove lessons from sync_lesson in memory immediately
      for (const type of Object.keys(selectedAssignments)) {
        for (const subjectId of Object.keys(selectedAssignments[type])) {
          const subjectData = selectedAssignments[type][subjectId];
          if (!subjectData || subjectId === "count") continue;

          for (const lessonId of subjectData.count) {
            for (const [chapterId, sourceMap] of sync_lesson.entries()) {
              Object.keys(sourceMap).forEach((key) => {
                if (sourceMap[key]?.includes(lessonId)) {
                  sourceMap[key] = sourceMap[key].filter(
                    (id) => id !== lessonId
                  );
                }
              });
              sync_lesson.set(chapterId, sourceMap);
            }
          }
        }
      }

      // Update assignment cart immediately (async)
      const _selectedLesson = JSON.stringify(Object.fromEntries(sync_lesson));
      all_sync_lesson.set(current_class?.id ?? "", _selectedLesson);
      const _totalSelectedLesson = JSON.stringify(
        Object.fromEntries(all_sync_lesson)
      );
      api.createOrUpdateAssignmentCart(currUser?.id, _totalSelectedLesson);
    } catch (error) {
      console.error("Error updating assignment cart:", error);
    }
    })();

    // Step 2: Show confirmation popup immediately
    setShowConfirm(true);

    // Step 3: Run actual assignment creation in background
    (async () => {
    try {
      const current_class = await Util.getCurrentClass();
      const currUser = await auth.getCurrentUser();
      if (!currUser || !current_class) return;

      const previous_sync_lesson = currUser?.id
        ? await api.getUserAssignmentCart(currUser?.id)
        : null;
      const all_sync_lesson: Map<string, string> = new Map(
        previous_sync_lesson?.lessons
          ? Object.entries(JSON.parse(previous_sync_lesson.lessons))
          : []
      );
      const sync_lesson_data = all_sync_lesson.get(current_class?.id ?? "");
      let sync_lesson: Map<string, Record<string, string[]>> = new Map(
        sync_lesson_data ? Object.entries(JSON.parse(sync_lesson_data)) : []
      );

      // ✅ Build reverse lookup: lessonId → chapterId
      const lessonToChapterMap = new Map<string, string>();
      for (const [chapterId, sourceMap] of sync_lesson.entries()) {
        for (const lessonIds of Object.values(sourceMap)) {
          for (const lessonId of lessonIds) {
            lessonToChapterMap.set(lessonId, chapterId);
          }
        }
      }

      // Iterate through assignment types (manual/recommended)
      for (const type of Object.keys(selectedAssignments)) {
        for (const subjectId of Object.keys(selectedAssignments[type])) {
          const subjectData = selectedAssignments[type][subjectId];

          if (!subjectData || subjectId === "count") continue;

          const tempLessons =
            type === TeacherAssignmentPageType.MANUAL
              ? manualAssignments[subjectId]?.lessons ?? []
              : recommendedAssignments[subjectId]?.lessons ?? [];

          if (!tempLessons.length) {
            console.warn(`No lessons found for subjectId ${subjectId}`);
            continue;
          }
          // Process lessons asynchronously in parallel
          await Promise.all(
            subjectData.count.map(async (lessonId, idx) => {
              const tempLes = tempLessons.find(
                (les: any) => les.id === lessonId
              );
              if (!tempLes) {
                console.warn(`Lesson not found for lessonId: ${lessonId}`);
                return;
              }

              const tempChapterId =
                tempLes?.source === AssignmentSource.RECOMMENDED
                  ? await api.getChapterByLesson(tempLes.id, current_class.id)
                  : lessonToChapterMap.get(lessonId);
              if (!tempChapterId) {
                console.warn(`Chapter not found for lessonId: ${lessonId}`);
                return;
              }
              // ✨ MODIFICATION: Create a staggered timestamp for ordering
              const createdAt = new Date(Date.now() - idx * 100).toISOString();

              // 🌟 Determine Source (manual, qr_code, recommended)
              let source: string | null = null;

              const chapterSourceMap =
                sync_lesson.get(tempChapterId as string) ?? {};

              if (
                chapterSourceMap[AssignmentSource.MANUAL]?.includes(lessonId)
              ) {
                source = AssignmentSource.MANUAL;
              } else if (
                chapterSourceMap[AssignmentSource.QR_CODE]?.includes(lessonId)
              ) {
                source = AssignmentSource.QR_CODE;
              } else if (tempLes?.source === AssignmentSource.RECOMMENDED) {
                source = AssignmentSource.RECOMMENDED;
              }

              await api.createAssignment(
                studentList,
                currUser.id,
                startDate,
                endDate,
                allSelected,
                current_class.id,
                current_class.school_id,
                lessonId,
                tempChapterId.toString(),
                subjectId,
                tempLes.plugin_type === ASSIGNMENT_TYPE.LIVEQUIZ
                  ? ASSIGNMENT_TYPE.LIVEQUIZ
                  : ASSIGNMENT_TYPE.ASSIGNMENT,
                batchId,
                source,
                createdAt
              );

              // ❌ Remove lesson from sync_lesson under correct source
              if (source && chapterSourceMap[source]) {
                chapterSourceMap[source] = chapterSourceMap[source].filter(
                  (id) => id !== lessonId
                );
                sync_lesson.set(tempChapterId as string, chapterSourceMap);
              }
            })
          );
        }
      }
      // Remove any keys other than manual and qr_code from each chapter's source map
      for (const [chapterId, sourceMap] of sync_lesson.entries()) {
        Object.keys(sourceMap).forEach((key) => {
          if (key !== AssignmentSource.MANUAL && key !== AssignmentSource.QR_CODE) {
            delete sourceMap[key];
          }
        });
        sync_lesson.set(chapterId, sourceMap);
      }
      const _selectedLesson = JSON.stringify(Object.fromEntries(sync_lesson));
      all_sync_lesson.set(current_class?.id ?? "", _selectedLesson);
      const _totalSelectedLesson = JSON.stringify(
        Object.fromEntries(all_sync_lesson)
      );

      await api.createOrUpdateAssignmentCart(
        currUser?.id,
        _totalSelectedLesson
      );
    } catch (error) {
      console.error("Error creating assignments in background:", error);
    }
    })();
  };

  return !isLoading ? (
    <div className="assignments-container">
      <div id="assignment-success-dialog">
        <CommonDialogBox
          header={t("Assignments are assigned Successfully.") ?? ""}
          message={t("Would you like to share the assignments?")}
          showConfirmFlag={showConfirm}
          leftButtonText={t("Cancel") ?? ""}
          leftButtonHandler={() => {
            setShowConfirm(false);
            history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
          }}
          onDidDismiss={() => {
            setShowConfirm(false);
            history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
          }}
          rightButtonText={t("Share") ?? ""}
          rightButtonHandler={async () => {
            const text = await getShareText();
            setShowConfirm(false);
            await Util.sendContentToAndroidOrWebShare(
              text,
              "Assignment Assigned"
            );
            history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
          }}
        ></CommonDialogBox>
      </div>
      <div>
        <p id="create-assignment-heading">{t("Assignments")}</p>
        <section className="assignments-dates">
          <span style={{ color: "#4A4949", fontSize: "11px" }}>
            <Trans i18nKey="assignments_date_message" />
          </span>
          <div className="date-created-assignment">
            <div>
              <b>{t("Start Date")}</b>
              <div className="createselectAssignmentDate-input">
                {showStartDatePicker ? (
                  <CalendarPicker
                    value={startDate}
                    onConfirm={(date) => handleDateConfirm("start", date)}
                    onCancel={() => setShowStartDatePicker(false)}
                    mode="start"
                    minDate={new Date().toISOString().split("T")[0]}
                    maxDate={maxEndDate}
                  />
                ) : (
                  <span
                    onClick={() => {
                      setShowStartDatePicker(true);
                    }}
                  >
                    {startDate}
                  </span>
                )}
                <IonIcon icon={calendarOutline} size={"2vw"} />
              </div>
            </div>
            <div className="vertical-line"></div>
            <div>
              <b>{t("End Date")}</b>
              <div className="createselectAssignmentDate-input">
                {showEndDatePicker ? (
                  <CalendarPicker
                    value={endDate}
                    onConfirm={(date) => handleDateConfirm("end", date)}
                    onCancel={() => setShowEndDatePicker(false)}
                    mode="end"
                    minDate={
                      startDate
                        ? format(new Date(startDate), "yyyy-MM-dd")
                        : new Date().toISOString().split("T")[0]
                    }
                    maxDate={format(
                      addMonths(new Date(startDate), 1),
                      "yyyy-MM-dd"
                    )}
                    startDate={startDate}
                  />
                ) : (
                  <span
                    onClick={() => {
                      setShowEndDatePicker(true);
                    }}
                  >
                    {endDate}
                  </span>
                )}
                <IonIcon icon={calendarOutline} />
              </div>
            </div>
          </div>
        </section>
        <section className="assignments-list">
          <div className="select-all">
            <label>{t("Select All")}</label>
            <input
              className="select-all-checkbox"
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
          </div>
          {Object.keys(groupWiseStudents).map((category) => (
            <div
              key={category}
              className={`assignment-category ${category
                .replace(" ", "-")
                .toLowerCase()}`}
            >
              <div
                className="category-header"
                style={{
                  backgroundColor: groupWiseStudents[category].color,
                }}
                onClick={() => toggleCollapse(category)}
              >
                <h4>{groupWiseStudents[category].title}</h4>
                <div className="select-all">
                  <div className="select-all-student-count">
                    {
                      groupWiseStudents[category].students.filter(
                        (student) => student.selected
                      ).length
                    }
                    /{groupWiseStudents[category].students.length}
                  </div>
                  <img
                    src={
                      groupWiseStudents[category].isCollapsed
                        ? "assets/icons/iconDown.png"
                        : "assets/icons/iconUp.png"
                    }
                    alt="toggle-icon"
                    style={{ width: "15px", height: "15px" }}
                  />
                  <input
                    className="select-all-checkbox"
                    type="checkbox"
                    checked={
                      groupWiseStudents[category].students.length > 0
                        ? groupWiseStudents[category].students.every(
                            (student) => student.selected
                          )
                        : true
                    }
                    // checked={true}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      const allSelected = groupWiseStudents[
                        category
                      ].students.every((student) => student.selected);
                      setGroupWiseStudents((bandStudents) => {
                        const updatedStudents = bandStudents[
                          category
                        ].students.map((student) => ({
                          ...student,
                          selected: !allSelected,
                        }));

                        return {
                          ...bandStudents,
                          [category]: {
                            ...bandStudents[category],
                            students: updatedStudents,
                          },
                        };
                      });
                    }}
                  />
                </div>
              </div>
              {!groupWiseStudents[category].isCollapsed && (
                <ul className="students-list">
                  {groupWiseStudents[category].students.map(
                    (student, index) => (
                      <div>
                        <li key={index} className="student-item">
                          <span>{student.name}</span>
                          <input
                            className="student-item-checkbox"
                            type="checkbox"
                            checked={student.selected}
                            onChange={() =>
                              toggleStudentSelection(category, index)
                            }
                          />
                        </li>
                        <hr className="students-list-styled-line" />
                      </div>
                    )
                  )}
                </ul>
              )}
            </div>
          ))}
        </section>

        <button
          className="assign-selected-button"
          disabled={selectedAssignments.length > 0}
          onClick={createAssignmentsForStudents}
        >
          {t("Assign")}
        </button>
      </div>
    </div>
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default CreateSelectedAssignment;
