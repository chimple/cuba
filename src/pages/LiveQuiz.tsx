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
  const [correctCsv, setCorrectCSV] = useState<boolean>(false);
  const [text, setCorrectText] = useState<string>("");
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
  function isValidAge(age: any): boolean {
    const ageNum = parseInt(age, 10);
    return !isNaN(ageNum) && ageNum >= 3 && ageNum <= 8;
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          var a: Array<any> = result.data;
      
          if (a.length === 0) {
            throw new Error("CSV file is empty.");
          }
      
          const sheetKeys = Object.keys(a[0]);
      
          // Check for missing keys
          const missingKeys = requiredKeys.filter(key => !sheetKeys.includes(key));
          if (missingKeys.length > 0) {
            throw new Error(`Missing required columns: ${missingKeys.join(", ")}`);
          }
      
          setData(result.data);
      
          const invalidPhoneNumbers: string[] = [];
          const invalidAges: string[] = [];
          const rowOccurrences = new Map<string, number[]>(); // Stores row content & its occurrences
          const duplicateRows: string[] = [];
      
          a.forEach((ele, index) => {
            // Check for invalid phone numbers
            const phoneNumber = ele["Phone Number"]?.toString().trim();
            if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
              invalidPhoneNumbers.push(`Row ${index + 1}: ${phoneNumber || "Empty"}`);
            }
      
            // Check for invalid age
            const age = ele["Age"]?.toString().trim();
            if (!isValidAge(age)) {
              invalidAges.push(`Row ${index + 1}: ${age || "Empty"}`);
            }
      
            // Check for duplicate rows (store row string and all row occurrences)
            const rowString = JSON.stringify(ele);
            if (rowOccurrences.has(rowString)) {
              rowOccurrences.get(rowString)!.push(index + 1);
            } else {
              rowOccurrences.set(rowString, [index + 1]);
            }
          });
      
          // Find all duplicate row indices
          rowOccurrences.forEach((indices) => {
            if (indices.length > 1) {
              duplicateRows.push(`Rows ${indices.join(", ")}`);
            }
          });
      
          let errorMessage = "";
      
          if (invalidPhoneNumbers.length > 0) {
            errorMessage += `Invalid phone numbers:\n${invalidPhoneNumbers.join("\n")}\n\n`;
          }
      
          if (invalidAges.length > 0) {
            errorMessage += `Invalid ages (must be between 3-8):\n${invalidAges.join("\n")}\n\n`;
          }
      
          if (duplicateRows.length > 0) {
            errorMessage += `Duplicate rows found at:\n${duplicateRows.join("\n")}`;
          }
      
          if (errorMessage) {
            console.error(errorMessage);
            setCorrectText(errorMessage);
          } else {
            setCorrectText("All data is valid.");
          }
        },
        header: true,
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
          {correctCsv ? <h3>Please Upload correct CSV file</h3> : <></>}
          <h4 style={{ whiteSpace: "pre-line" }}>{text}</h4>
        </div>
      )}
    </div>
  );
};
export default LiveQuiz;
