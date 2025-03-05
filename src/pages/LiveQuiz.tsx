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
  const [correctCsv,setCorrectCSV] = useState<boolean>(false)
  const [text,setCorrectText] = useState<string>("")
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
  function isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/; // Validates 10-digit Indian phone numbers
    return phoneRegex.test(phone);
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          
          var a: Array<any> = result.data;
          setData(result.data);
          if (a.length > 0) {
          
            const keys = Object.keys(a[0]);
            const missingKeys = requiredKeys.filter(key => !keys.includes(key));
            const invalidPhoneNumbers: any[] = [];

            a.forEach((ele, index) => {
              const phoneNumber = ele["Phone Number"]?.toString().trim();
              if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
                invalidPhoneNumbers.push(`Row ${index + 1}: ${phoneNumber || "Empty"}`);
                // invalidPhoneNumbers.push(phoneNumber)
              }
            });
        
            if (invalidPhoneNumbers.length > 0) {
              const errorMessage = `Invalid phone numbers:\n${invalidPhoneNumbers.join("\n")}`;
              setCorrectText(errorMessage)
              console.error("Invalid phone numbers:", invalidPhoneNumbers);
            } else {
              console.log("All phone numbers are valid.");
            }

            if (missingKeys.length > 0) {
              setCorrectCSV(true)
            }
            else{
              setCorrectCSV(false)
            }
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
      {correctCsv?<h3>Please Upload correct CSV file</h3>:<></>}
      <h4>{text}</h4>
    </div>
      )}
    </div>
  );
};
export default LiveQuiz;
