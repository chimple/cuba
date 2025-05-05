// Helper: Construct the final payload structure after validation
const getSchoolKey = (row: any): string =>
  row["SCHOOL ID"]?.toString().trim() || row["SCHOOL NAME"]?.toString().trim();

export const generateFinalPayload = (
  schoolData: any[] = [],
  classData: any[] = [],
  teacherData: any[] = [],
  studentData: any[] = []
) => {
  const map = new Map<string, any>();

  const ensureSchoolEntry = (row: any) => {
    const key = getSchoolKey(row);
    if (!map.has(key)) {
      map.set(key, {
        school: {
          id: row["SCHOOL ID"]?.toString().trim(),
          name: row["SCHOOL NAME"]?.toString().trim(),
          state: row["STATE"]?.toString().trim() || "",
          district: row["DISTRICT"]?.toString().trim() || "",
          block: row["BLOCK"]?.toString().trim() || "",
          cluster: row["CLUSTER"]?.toString().trim() || "",
          instruction_language:
            row["SCHOOL INSTRUCTION LANGUAGE"]?.toString().trim() || "",
          student_login_type:
            row["STUDENT LOGIN TYPE"]?.toString().trim() || "",
          academic_years: row["SCHOOL ACADEMIC YEAR"]
            ? [row["SCHOOL ACADEMIC YEAR"]?.toString().trim()]
            : [],
        },
        principal:
          row["PRINCIPAL NAME"] || row["PRINCIPAL PHONE NUMBER OR EMAIL ID"]
            ? {
                name: row["PRINCIPAL NAME"]?.toString().trim() || "",
                contact:
                  row["PRINCIPAL PHONE NUMBER OR EMAIL ID"]
                    ?.toString()
                    .trim() || "",
                role: "principal",
              }
            : null,
        school_coordinator:
          row["SCHOOL COORDINATOR NAME"] ||
          row["SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"]
            ? {
                name: row["SCHOOL COORDINATOR NAME"]?.toString().trim() || "",
                contact:
                  row["SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"]
                    ?.toString()
                    .trim() || "",
                role: "school_coordinator",
              }
            : null,
        programs: [],
        program_users: [],
        classes: [],
      });
    }
    return key;
  };

  for (const row of schoolData) {
    const key = ensureSchoolEntry(row);

    if (row["PROGRAM NAME"]) {
      const program = {
        name: row["PROGRAM NAME"].toString().trim(),
        model: row["PROGRAM MODEL"]?.toString().trim() || "",
      };

      const pm = {
        contact:
          row["PROGRAM MANAGER EMAIL OR PHONE NUMBER"]?.toString().trim() || "",
        role: "program_manager",
      };
      const fc = {
        contact:
          row["FIELD COORDINATOR EMAIL OR PHONE NUMBER"]?.toString().trim() ||
          "",
        role: "field_coordinator",
      };

      map.get(key).programs.push(program);
      map.get(key).program_users.push(pm, fc);
    }
  }

  for (const row of classData) {
    const key = ensureSchoolEntry(row);
    const cls = {
      grade: row["GRADE"]?.toString().trim() || "",
      section: row["CLASS SECTION"]?.toString().trim() || "",
      student_count: row["STUDENTS COUNT IN CLASS"]?.toString().trim() || "",
      subjects: [
        {
          grade_level: row["SUBJECT GRADE"]?.toString().trim() || "",
          curricul: row["CURRICULUM"]?.toString().trim() || "",
          sub: row["SUBJECT"]?.toString().trim() || "",
        },
      ],
      teachers: [],
      students: [],
    };
    map.get(key).classes.push(cls);
  }

  for (const row of teacherData) {
    const key = ensureSchoolEntry(row);
    const grade = row["GRADE"]?.toString().trim();
    const section = row["CLASS SECTION"]?.toString().trim() || "";
    const teacher = {
      name: row["TEACHER NAME"]?.toString().trim() || "",
      contact: row["TEACHER PHONE NUMBER OR EMAIL"]?.toString().trim() || "",
    };

    const school = map.get(key);
    let cls = school.classes.find(
      (c: any) => c.grade === grade && c.section === section
    );
    if (!cls) {
      cls = {
        grade,
        section,
        student_count: "",
        subjects: [],
        teachers: [],
        students: [],
      };
      school.classes.push(cls);
    }
    cls.teachers.push(teacher);
  }

  for (const row of studentData) {
    const key = ensureSchoolEntry(row);
    const grade = row["GRADE"]?.toString().trim();
    const section = row["CLASS SECTION"]?.toString().trim() || "";
    const student = {
      id: row["STUDENT ID"]?.toString().trim() || "",
      name: row["STUDENT NAME"]?.toString().trim() || "",
      gender: row["GENDER"]?.toString().trim() || "",
      age: row["AGE"]?.toString().trim() || "",
      grade: grade || "",
      parent_contact:
        row["PARENT PHONE NUMBER OR LOGIN ID"]?.toString().trim() || "",
    };

    const school = map.get(key);
    let cls = school.classes.find(
      (c: any) => c.grade === grade && c.section === section
    );
    if (!cls) {
      cls = {
        grade,
        section,
        student_count: "",
        subjects: [],
        teachers: [],
        students: [],
      };
      school.classes.push(cls);
    }
    cls.students.push(student);
  }

  return Array.from(map.values());
};
