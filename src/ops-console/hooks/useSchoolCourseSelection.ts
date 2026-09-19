import { useEffect, useState } from 'react';
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
  const [courses, setCourses] = useState<SchoolCourseOption[]>([]);
  const [grades, setGrades] = useState<TableTypes<'grade'>[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [isCoursesLoading, setCoursesLoading] = useState(true);
  const [initialSelectedCourseIds, setInitialSelectedCourseIds] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      try {
        const [allCourses, allGrades] = await Promise.all([
          api.getAllCourses(),
          api.getAllGrades(),
        ]);
        const curriculumIds = Array.from(
          new Set(
            allCourses
              .map((course) => course.curriculum_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );
        const curriculums = await api.getCurriculumsByIds(curriculumIds);
        const curriculumNames = new Map(
          curriculums.map((curriculum) => [
            curriculum.id,
            curriculum.name ?? '',
          ]),
        );
        const gradeNames = new Map(
          allGrades.map((grade) => [grade.id, grade.name ?? '']),
        );
        let selectedIds: string[] = [];

        if (editData?.schoolData?.id) {
          const schoolCourses = await api.getCoursesBySchoolId(
            editData.schoolData.id,
          );
          selectedIds = schoolCourses
            .map((row) => row.course_id)
            .filter((id): id is string => Boolean(id));
        }

        if (!cancelled) {
          setCourses(
            (allCourses ?? []).map((course) => ({
              ...course,
              grade_name: gradeNames.get(course.grade_id ?? '') ?? '',
              curriculum_name:
                curriculumNames.get(course.curriculum_id ?? '') ?? '',
            })),
          );
          setGrades(allGrades ?? []);
          setSelectedCourseIds(selectedIds);
        }
      } catch (error) {
        logger.error('Error loading school courses:', error);
        if (!cancelled) {
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
  }, [api, editData]);

  useEffect(() => {
    if (!editData || isCoursesLoading || initialSelectedCourseIds !== null) {
      return;
    }
    setInitialSelectedCourseIds([...selectedCourseIds].sort());
  }, [editData, initialSelectedCourseIds, isCoursesLoading, selectedCourseIds]);

  return {
    courses,
    grades,
    initialSelectedCourseIds,
    isCoursesLoading,
    selectedCourseIds,
    selectedGradeId,
    setSelectedGradeId,
    toggleCourse: (courseId: string) =>
      setSelectedCourseIds((previous) =>
        previous.includes(courseId)
          ? previous.filter((id) => id !== courseId)
          : [...previous, courseId],
      ),
  };
};
