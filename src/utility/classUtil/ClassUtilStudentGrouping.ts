import { TableTypes } from '../../common/constants';
import { ClassUtilAssignmentReports } from './ClassUtilAssignmentReports';

export class ClassUtilStudentGrouping extends ClassUtilAssignmentReports {
  public async groupStudentsByCategoryInList(
    studentsMap: Map<string, Map<string, TableTypes<'user'>>>,
  ): Promise<Map<string, TableTypes<'user'>[]>> {
    const groups: Map<string, TableTypes<'user'>[]> = new Map();

    studentsMap.forEach((studentM: Map<string, any>, index: string) => {
      studentM.forEach((element: any) => {
        const studentData = element.get('student');
        if (!studentData) {
          return; // Skip this element if no student data is present
        }

        // Fetch the existing array of students for this category, or initialize a new array
        let existingStudents = groups.get(index) || [];

        // Add the student element to the existing group array
        existingStudents.push(studentData);

        // Update the group with the new list of students
        groups.set(index, existingStudents);
      });
    });
    return groups;
  }
  public sortStudentsByTotalScoreAssignment = (
    studentsMap: Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
    >,
  ): Map<
    string,
    { student: TableTypes<'user'>; results: Record<string, any[]> }
  > => {
    // Convert Map to array of entries
    const studentsArray = Array.from(studentsMap.entries());

    // Calculate total score for each student
    const studentsWithScores = studentsArray.map(([studentId, studentData]) => {
      let totalScore = 0;
      let validResults = 0;

      // Sum scores from all assignments
      Object.values(studentData.results).forEach((assignmentResults) => {
        assignmentResults.forEach((result) => {
          if (result.score !== null && !isNaN(result.score)) {
            totalScore += result.score;
            validResults++;
          }
        });
      });

      // Calculate average score (or 0 if no valid results)
      const averageScore = validResults > 0 ? totalScore / validResults : 0;

      return {
        studentId,
        studentData,
        averageScore,
      };
    });

    // Sort by average score (ascending for LOWSCORE)
    studentsWithScores.sort((a, b) => a.averageScore - b.averageScore);

    // Convert back to Map
    return new Map(
      studentsWithScores.map((item) => [item.studentId, item.studentData]),
    );
  };
}
