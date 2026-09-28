import type { TableTypes } from '../common/constants';

export class SchoolCourseRemovalError extends Error {
  constructor(public readonly classNames: string[]) {
    super(
      `Course removal would leave classes without courses: ${classNames.join(', ')}`,
    );
    this.name = 'SchoolCourseRemovalError';
  }
}

type SchoolClass = Pick<TableTypes<'class'>, 'id' | 'name'>;
type ClassCourseLink = Pick<
  TableTypes<'class_course'>,
  'class_id' | 'course_id' | 'is_deleted'
>;

export function getClassesLosingAllCourses(
  classes: SchoolClass[],
  classLinks: ClassCourseLink[],
  removedCourseIds: string[],
): SchoolClass[] {
  if (!removedCourseIds.length) return [];
  const removed = new Set(removedCourseIds);
  const affectedClasses = new Set<string>();
  const classesWithCourses = new Set<string>();
  for (const link of classLinks) {
    if (link.is_deleted || !link.course_id) continue;
    if (removed.has(link.course_id)) {
      affectedClasses.add(link.class_id);
    } else {
      classesWithCourses.add(link.class_id);
    }
  }
  return classes.filter(
    (row) => affectedClasses.has(row.id) && !classesWithCourses.has(row.id),
  );
}

export function validateSchoolCourseRemoval(
  classes: SchoolClass[],
  classLinks: ClassCourseLink[],
  removedCourseIds: string[],
): void {
  const blockedClasses = getClassesLosingAllCourses(
    classes,
    classLinks,
    removedCourseIds,
  );
  if (blockedClasses.length) {
    throw new SchoolCourseRemovalError(
      blockedClasses.map((row) => row.name || row.id),
    );
  }
}
