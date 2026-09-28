import { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { getClassesLosingAllCourses } from '../../utility/schoolCourseRemoval';
import type { TableTypes } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import logger from '../../utility/logger';
import type { SchoolCourseOption } from '../components/addSchool/SchoolCourseSelector';

type SchoolEditData = {
  schoolData?: { id?: string };
};

type UseSchoolCourseSelectionProps = {
  api: ServiceApi;
  editData?: SchoolEditData;
};

export const useSchoolCourseSelection = ({
  api,
  editData,
}: UseSchoolCourseSelectionProps) => {
  const schoolId = editData?.schoolData?.id;
  const [courses, setCourses] = useState<SchoolCourseOption[]>([]);
  const [grades, setGrades] = useState<TableTypes<'grade'>[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [isCoursesLoading, setCoursesLoading] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState(false);
  const [courseRemovalError, setCourseRemovalError] = useState('');
  const [courseRemovalWarning, setCourseRemovalWarning] = useState('');
  const selectedCourseIdsRef = useRef<string[]>([]);
  const removalContext = useRef<{
    classes: TableTypes<'class'>[];
    links: TableTypes<'class_course'>[];
    assignedCourseIds: string[];
  }>({ classes: [], links: [], assignedCourseIds: [] });
  const [initialSelectedCourseIds, setInitialSelectedCourseIds] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      setCourseLoadError(false);
      setInitialSelectedCourseIds(null);
      try {
        const [allCourses, allGrades, schoolCourses, schoolClasses] =
          await Promise.all([
            api.getAllCourses(),
            api.getAllGrades(),
            schoolId ? api.getCoursesBySchoolId(schoolId) : Promise.resolve([]),
            schoolId ? api.getClassesBySchoolId(schoolId) : Promise.resolve([]),
          ]);
        if (cancelled) return;
        const availableCourses = allCourses.filter(
          (course) => !course.is_deleted,
        );
        const availableCourseIds = new Set(
          availableCourses.map((course) => course.id),
        );
        const curriculumIds = Array.from(
          new Set(
            availableCourses
              .map((course) => course.curriculum_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );
        const classes = schoolClasses.filter((row) => !row.is_deleted);
        const [curriculums, linksByClass] = await Promise.all([
          api.getCurriculumsByIds(curriculumIds),
          Promise.all(classes.map((row) => api.getCoursesByClassId(row.id))),
        ]);
        const links = linksByClass.flat();
        const curriculumNames = new Map(
          curriculums.map((curriculum) => [
            curriculum.id,
            curriculum.name ?? '',
          ]),
        );
        const gradeNames = new Map(
          allGrades.map((grade) => [grade.id, grade.name ?? '']),
        );
        const assignedCourseIds = [
          ...new Set(
            schoolCourses
              .filter((row) => !row.is_deleted)
              .map((row) => row.course_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ];
        const selectedIds = assignedCourseIds.filter((id) =>
          availableCourseIds.has(id),
        );

        if (!cancelled) {
          setCourses(
            availableCourses.map((course) => ({
              ...course,
              grade_name: gradeNames.get(course.grade_id ?? '') ?? '',
              curriculum_name:
                curriculumNames.get(course.curriculum_id ?? '') ?? '',
            })),
          );
          setGrades(allGrades ?? []);
          selectedCourseIdsRef.current = selectedIds;
          setInitialSelectedCourseIds(
            schoolId ? [...selectedIds].sort() : null,
          );
          removalContext.current = { classes, links, assignedCourseIds };
          setSelectedCourseIds(selectedCourseIdsRef.current);
          setCourseRemovalWarning('');
          setCourseRemovalError('');
        }
      } catch (error) {
        logger.error('Error loading school courses:', error);
        if (!cancelled) {
          setCourseLoadError(true);
          setCourses([]);
          setGrades([]);
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, [api, schoolId]);

  return {
    courseLoadError,
    courseRemovalError,
    courseRemovalWarning,
    setCourseRemovalError,
    courses,
    grades,
    initialSelectedCourseIds,
    isCoursesLoading,
    selectedCourseIds,
    selectedGradeId,
    setSelectedGradeId,
    toggleCourse: (courseId: string) => {
      if (isCoursesLoading || courseLoadError) return;
      const previous = selectedCourseIdsRef.current;
      const removing = previous.includes(courseId);
      const next = removing
        ? previous.filter((id) => id !== courseId)
        : [...previous, courseId];
      if (removing) {
        const { classes, links, assignedCourseIds } = removalContext.current;
        const selectedIds = new Set(next);
        const blockedClasses = getClassesLosingAllCourses(
          classes,
          links,
          assignedCourseIds.filter((id) => !selectedIds.has(id)),
        );
        if (blockedClasses.length) {
          setCourseRemovalWarning(
            t(
              'Cannot remove this course because it would leave these classes without any courses: {{classes}}.',
              {
                classes: blockedClasses
                  .map((row) => row.name || row.id)
                  .join(', '),
              },
            ) ?? '',
          );
          return;
        }
      }
      setCourseRemovalWarning('');
      setCourseRemovalError('');
      selectedCourseIdsRef.current = next;
      setSelectedCourseIds(next);
    },
  };
};
