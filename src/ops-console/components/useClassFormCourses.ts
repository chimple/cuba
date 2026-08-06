import { useEffect, useRef, useState } from 'react';
import type { TableTypes } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import logger from '../../utility/logger';

type EditClassData = {
  id?: string;
  courses?: TableTypes<'course'>[];
  Courses?: TableTypes<'class_course'>[];
};

type CourseOption = TableTypes<'course'> & {
  curriculum_name: string;
  grade_name: string;
};

type UseClassFormCoursesProps = {
  api: ServiceApi;
  classData?: EditClassData;
  mode: 'create' | 'edit';
  schoolId?: string;
  setErrorMessage: (message: string) => void;
};

export const useClassFormCourses = ({
  api,
  classData,
  mode,
  schoolId,
  setErrorMessage,
}: UseClassFormCoursesProps) => {
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedCourses = async () => {
      if (mode !== 'edit' || !classData) {
        setSelectedCourse([]);
        return;
      }

      const fromCourses = Array.isArray(classData?.courses)
        ? classData.courses
            .map((course) => course.id)
            .filter((id: unknown): id is string => typeof id === 'string')
        : [];

      const fromCoursesRelation = Array.isArray(classData?.Courses)
        ? classData.Courses.map((course) => course.course_id).filter(
            (id: unknown): id is string => typeof id === 'string',
          )
        : [];

      let courseIds = [...fromCourses, ...fromCoursesRelation];

      if (
        courseIds.length === 0 &&
        classData?.id &&
        typeof api.getCoursesByClassId === 'function'
      ) {
        try {
          const courseLinks =
            (await api.getCoursesByClassId(classData.id)) ?? [];
          courseIds = courseLinks
            .map((link) => link.course_id)
            .filter((id: unknown): id is string => typeof id === 'string');
        } catch (error) {
          logger.error('Error fetching class courses for edit mode:', error);
        }
      }

      if (!cancelled) {
        setSelectedCourse(courseIds);
      }
    };

    void loadSelectedCourses();

    return () => {
      cancelled = true;
    };
  }, [mode, classData, api]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const schoolCourse = await api.getCoursesBySchoolId(schoolId ?? '');
        if (!schoolCourse?.length) {
          setErrorMessage('No Courses available in this school.');
          setAllCourses([]);
          setLoading(false);
          return;
        }
        const courseIds = schoolCourse.map((item) => item.course_id);
        const courseDetails = await api.getCourses(courseIds);
        const curriculumIds = [
          ...new Set(
            courseDetails
              .map((course) => course.curriculum_id)
              .filter((id): id is string => typeof id === 'string'),
          ),
        ];
        const gradeIds = [
          ...new Set(
            courseDetails
              .map((course) => course.grade_id)
              .filter((id): id is string => typeof id === 'string'),
          ),
        ];
        const [curriculums, grades] = await Promise.all([
          api.getCurriculumsByIds(curriculumIds),
          api.getGradesByIds(gradeIds),
        ]);
        const curriculumMap = new Map(
          curriculums.map((curriculum) => [
            curriculum.id,
            curriculum.name ?? '',
          ]),
        );
        const gradeMap = new Map(
          grades.map((grade) => [grade.id, grade.name ?? '']),
        );
        setAllCourses(
          courseDetails.map((course) => ({
            ...course,
            curriculum_name:
              curriculumMap.get(course.curriculum_id ?? '') || '',
            grade_name: gradeMap.get(course.grade_id ?? '') || '',
          })),
        );
        setErrorMessage('');
      } catch (error) {
        logger.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [schoolId, mode, api, setErrorMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        dropdownRef.current &&
        target instanceof Node &&
        !dropdownRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCourse = (id: string) => {
    setSelectedCourse((prev) =>
      prev.includes(id)
        ? prev.filter((course) => course !== id)
        : [...prev, id],
    );
  };

  return {
    allCourses,
    dropdownOpen,
    dropdownRef,
    handleSelectCourse,
    loading,
    selectedCourse,
    setDropdownOpen,
  };
};
