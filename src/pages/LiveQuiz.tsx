import React, { useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { HOMEHEADERLIST, PAGES, TableTypes } from "../common/constants";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import { StudentLessonResult } from "../common/courseConstants";
import { t } from "i18next";
import LessonSlider from "../components/LessonSlider";
import "./LiveQuiz.css";
import SkeltonLoading from "../components/SkeltonLoading";
import Papa from "papaparse";

const LiveQuiz: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [liveQuizzes, setLiveQuizzes] = useState<TableTypes<"lesson">[]>([]);
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const requiredKeys = [
    "School Name",
    "Student Name",
    "Student Id",
    "Class Name",
    "Gender",
    "Phone Number",
    "Age",
    "School Id",
    "School defined Student Id",
    "Student_password",
    "Cluster",
    "District",
    "State",
  ];
  const [assignments, setAssignments] = useState<TableTypes<"assignment">[]>(
    []
  );
  const api = ServiceConfig.getI().apiHandler;
  const [data, setData] = useState<Array<any>>([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          var a: Array<any> = result.data;
          setData(result.data);
          console.log('JJJJJJJJJJJJJJJJJJJJJJJJJ')
          if (a.length > 0) {
            const keys = Object.keys(a[0]); // Get the column names (keys)
            console.log("Keys:", keys);
          }
          // console.log("Parsed CSV Data:", result.data);
        },
        header: true, // Set to false if the CSV doesn't have headers
        skipEmptyLines: true,
      });
    }
  };

  useEffect(() => {
    init();
  }, []);
  

  const init = async (fromCache: boolean = true) => {
    setLoading(true);
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResultInMap(student.id);

    if (!!studentResult) {
      console.log("tempResultLessonMap = res;", studentResult);
      setLessonResultMap(studentResult);
    }

    const linked = await api.isStudentLinked(student.id, fromCache);
    if (!linked) {
      setLoading(false);
      return;
    }
    const linkedData = await api.getStudentClassesAndSchools(student.id);

    if (!!linkedData && !!linkedData.classes && linkedData.classes.length > 0) {
      const classId = linkedData.classes[0];
      const allLiveQuizzes: TableTypes<"assignment">[] = [];
      await Promise.all(
        linkedData.classes.map(async (_class) => {
          const res = await api.getLiveQuizLessons(classId.id, student.id);
          allLiveQuizzes.push(...res);
        })
      );
      setAssignments(allLiveQuizzes);
      const _lessons: TableTypes<"lesson">[] = [];
      await Promise.all(
        allLiveQuizzes.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson_id);
          if (!!res) {
            // res.assignment = _assignment;
            _lessons.push(res);
          }
        })
      );
      console.log("all the live quizzes...", _lessons);
      setLiveQuizzes(_lessons);
      setLoading(false);
    } else {
      setLoading(false);
      return;
    }
  };

  return (
    <div>
      {loading ? (
        <SkeltonLoading isLoading={loading} header={HOMEHEADERLIST.LIVEQUIZ} />
      ) : (
        <div>
      <h2>Upload CSV File</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
    </div>
      )}
    </div>
  );
};
export default LiveQuiz;
