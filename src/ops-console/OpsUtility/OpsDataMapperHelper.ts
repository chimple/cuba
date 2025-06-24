export function splitSchoolPayloadByClass(schools: any[]): any[] {
  const classwisePayload: any[] = [];
  for (const school of schools) {
    const { classes = [], ...schoolData } = school;
    for (const singleClass of classes) {
      classwisePayload.push({
        ...schoolData,
        classes: [singleClass],
      });
    }
  }
  return classwisePayload;
}

export function splitLargeClassesIntoChunks(classPayload: any[], maxStudents = 95): any[] {
  const chunkedPayload: any[] = [];
  for (const classEntry of classPayload) {
    const originalClass = classEntry.classes[0];
    const students = originalClass.students || [];

    if (students.length <= maxStudents) {
      chunkedPayload.push(classEntry);
      continue;
    }
    for (let i = 0; i < students.length; i += maxStudents) {
      const studentChunk = students.slice(i, i + maxStudents);
      const splitEntry = {
        ...classEntry,
        classes: [
          {
            ...originalClass,
            students: studentChunk,
          },
        ],
      };
      chunkedPayload.push(splitEntry);
    }
  }
  return chunkedPayload;
}
