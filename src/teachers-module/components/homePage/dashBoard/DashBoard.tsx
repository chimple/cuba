import React, { useEffect, useState } from "react";
import "./DashBoard.css";
import WeeklySummary from "../WeeklySummary";
import GroupWiseStudents from "../GroupWiseStudents";
import {
  BANDS,
  BANDWISECOLOR,
  HomeWeeklySummary,
  PAGES,
  TableTypes,
} from "../../../../common/constants";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { Tables } from "../../../../services/database";
import { ClassUtil } from "../../../../utility/classUtil";
import Loading from "../../../../components/Loading";
import { useHistory } from "react-router";
import { Util } from "../../../../utility/util";
import CustomDropdown from "../../CustomDropdown";
import { t } from "i18next";
import ImageDropdown from "../../imageDropdown";
import SelectIconImage from '../../../assets/icons/all_subject_icon.png'

const DashBoard: React.FC = ({}) => {
  const [selectedSubject, setSelectedSubject] =
    useState<TableTypes<"course">>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<TableTypes<"user">[]>();
  const [subjects, setSubjects] = useState<TableTypes<"course">[]>([]);;
  const [weeklySummary, setWeeklySummary] = useState<HomeWeeklySummary>();
  const [studentProgress, setStudentProgress] = useState<Map<any, any>>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const current_class = Util.getCurrentClass();
  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
    { icon: string; id: string; name: string; subjectDetail: string }[]
  >([]);
  useEffect(() => {
  if (subjects.length > 0) {
    init();
  }
}, [selectedSubject, subjects]);

  useEffect(() => {
    initSubject();
  }, []);
  
  const initSubject = async () => {
    const current_class = Util.getCurrentClass();
    const _subjects = await api.getCoursesForClassStudent(
      current_class?.id ?? ""
    );
    
    setSubjects(_subjects);    

    const curriculumIds = Array.from(
      new Set(_subjects.map((s) => s.curriculum_id))
    );
    const gradeIds = Array.from(new Set(_subjects.map((s) => s.grade_id)));
    const filteredCurriculumIds = curriculumIds.filter(
      (id): id is string => id !== null
    );
    const filteredGradeIds = gradeIds.filter((id): id is string => id !== null);

    try {
      // Fetch curriculums and grades
      const [curriculums, grades] = await Promise.all([
        api.getCurriculumsByIds(filteredCurriculumIds),
        api.getGradesByIds(filteredGradeIds),
      ]);

      const curriculumMap = new Map(curriculums.map((c) => [c.id, c]));
      const gradeMap = new Map(grades.map((g) => [g.id, g]));
      const _mappedSubjectOptions = _subjects.map((subject) => {
        const curriculum = curriculumMap.get(subject.curriculum_id ?? "");
        const grade = gradeMap.get(subject.grade_id ?? "");
        return {
          id: subject.id,
          subjectDetail: `${subject.name} ${curriculum?.name ?? "Unknown"}-${grade?.name ?? "Unknown"}`,
          // icon: curriculum?.image,
          icon: subject?.image || "/assets/icons/DefaultIcon.png",
          name: subject.name,
        };
      });

      setMappedSubjectOptions(_mappedSubjectOptions);
    } catch (error) {
      console.error("Error fetching curriculums or grades:", error);
      setMappedSubjectOptions([]);
    }
    setSelectedSubject(
      Util.getCurrentCourse(current_class?.id) ?? _subjects[0]
    );
  };
  
const init = async () => {
  setIsLoading(true);
  const _students = await api.getStudentsForClass(current_class?.id ?? "");
  setStudents(_students);

  const _classUtil = new ClassUtil();

  if (selectedSubject?.id === "all") {
    const studentBandMap = new Map<string, { band: string, entry: any }>();
     const bandOrder = [
        BANDS.REDGROUP,
        BANDS.YELLOWGROUP,
        BANDS.GREENGROUP, 
        BANDS.GREYGROUP,
      ];
       const bandPriority = Object.fromEntries(
        bandOrder.map((band, i) => [band, i + 1])
      );

    let totalAssignments = 0;
    let totalCompletedAssignments = 0;
    let totalCompletedStudents = 0;
    let totalTimeSpent = 0;
    let totalAverageScore = 0;
    let subjectsCount = 0;

    for (const subject of subjects) {
      const progress = await _classUtil.divideStudents(current_class?.id ?? "", subject.id);
      const summary = await _classUtil.getWeeklySummary(current_class?.id ?? "", subject.id);

      // Track band for each student
      for (const [band, studentsInBand] of progress.entries()) {
        for (const entry of studentsInBand) {
          const student = entry.get("student") as TableTypes<"user">;
          const current = studentBandMap.get(student.id);
          if (!current || bandPriority[band] < bandPriority[current.band]) {
            studentBandMap.set(student.id, { band, entry });
          }
        }
      }

      // Accumulate summary data
      totalAssignments += summary.assignments.totalAssignments || 0;
      totalCompletedAssignments += summary.assignments.asgnmetCmptd || 0;
      totalCompletedStudents += summary.students.stdCompletd || 0;
      totalTimeSpent += summary.timeSpent || 0;
      totalAverageScore += summary.averageScore || 0;
      subjectsCount += 1;
    }

    // Final band grouping
    const mergedBandWiseStudents = new Map<string, any[]>();
    for (const { band, entry } of studentBandMap.values()) {
      if (!mergedBandWiseStudents.has(band)) {
        mergedBandWiseStudents.set(band, []);
      }
      mergedBandWiseStudents.get(band)!.push(entry);
    }

    // Final average calculations
    const averageTimeSpent = subjectsCount > 0 ? Math.round(totalTimeSpent / subjectsCount) : 0;
    const averageScore = subjectsCount > 0 ? Math.round(totalAverageScore / subjectsCount) : 0;

    const aggregatedSummary: HomeWeeklySummary = {
      assignments: {
        totalAssignments,
        asgnmetCmptd: totalCompletedAssignments,
      },
      students: {
        totalStudents: _students.length,
        stdCompletd: Math.min(totalCompletedStudents, _students.length),
      },
      timeSpent: averageTimeSpent,
      averageScore,
    };

    setWeeklySummary(aggregatedSummary);
    setStudentProgress(mergedBandWiseStudents);
  } else {
    // Single subject mode
    const _studentProgress = await _classUtil.divideStudents(current_class?.id ?? "", selectedSubject?.id ?? "");
    const _weeklySummary = await _classUtil.getWeeklySummary(current_class?.id ?? "", selectedSubject?.id ?? "");

    setWeeklySummary(_weeklySummary);
    setStudentProgress(_studentProgress);
  }

  setIsLoading(false);
};

  const handleSelectSubject = (subject) => {
    if (subject) {
      setSelectedSubject(subject);
      Util.setCurrentCourse(current_class?.id, subject);
    }
  };

  const onRefresh = (event: CustomEvent) => {
    api.syncDB().then(() => {
      init();
      event.detail.complete();
    });
  };

  const allOption = {
  id: "all", // internal use only
  name: "All Subjects",
  icon: SelectIconImage, // Replace with actual icon
  subjectDetail: "All Grades",
};

const subjectOptionsWithAll = [allOption, ...(mappedSubjectOptions ?? [])];

  return !isLoading ? (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      <main className="dashboard-container">
        <div className="dashboard-container-subject-dropdown">
          <ImageDropdown
          options={subjectOptionsWithAll}
          selectedValue={{
            id: selectedSubject?.id ?? "all",
            name: selectedSubject?.name ?? "All Subjects",
            icon:
              (selectedSubject as any)?.icon ??
              subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.icon ??
              "",
            subjectDetail:
              (selectedSubject as any)?.subject ??
              subjectOptionsWithAll.find((option) => option.id === selectedSubject?.id)?.subjectDetail ??
              "",
          }}
          onOptionSelect={handleSelectSubject}
          placeholder={t("Select Language") as string}
        />

        </div>
        <WeeklySummary weeklySummary={weeklySummary} />
        <GroupWiseStudents
          color={BANDWISECOLOR.RED}
          studentsProgress={studentProgress?.get(BANDS.REDGROUP)}
          studentLength={students?.length.toString() ?? ""}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.REDGROUP),
              bandcolor: BANDWISECOLOR.RED,
              studentLength: students?.length.toString() ?? "",
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.YELLOW}
          studentsProgress={studentProgress?.get(BANDS.YELLOWGROUP)}
          studentLength={students?.length.toString() ?? ""}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.YELLOWGROUP),
              bandcolor: BANDWISECOLOR.YELLOW,
              studentLength: students?.length.toString() ?? "",
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.GREEN}
          studentsProgress={studentProgress?.get(BANDS.GREENGROUP)}
          studentLength={students?.length.toString() ?? ""}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.GREENGROUP),
              bandcolor: BANDWISECOLOR.GREEN,
              studentLength: students?.length.toString() ?? "",
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.GREY}
          studentsProgress={studentProgress?.get(BANDS.GREYGROUP)}
          studentLength={students?.length.toString() ?? ""}
          onClickCallBack={() => {}}
        />
      </main>
    </IonContent>
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default DashBoard;
