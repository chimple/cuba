import { useEffect, useRef, useState } from 'react';
import logger from '../../utility/logger';

type UseClassFormCoursesProps = {
  api: any;
  classData?: any;
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
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode === 'edit' && classData) {
      const classCourseLinks =
        classData.course_links ?? classData.courses ?? classData.Courses ?? [];
      if (classCourseLinks.length > 0) {
        setSelectedCourse(
          classCourseLinks.map(
            (course: { id?: string | null; course_id?: string | null }) =>
              course.course_id ?? course.id,
          ),
        );
        return;
      }

      const loadSelectedCourses = async () => {
        if (!classData.id) return;
        try {
          const links = await api.getCoursesByClassId(classData.id);
          setSelectedCourse(
            (links ?? [])
              .map((link: { course_id?: string | null }) => link.course_id)
              .filter(
                (courseId: unknown): courseId is string =>
                  typeof courseId === 'string' && courseId.length > 0,
              ),
          );
        } catch (error) {
          logger.error('Error fetching class course links:', error);
        }
      };

      void loadSelectedCourses();
    }
  }, [api, classData, mode]);

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
        const courseIds = schoolCourse.map(
          (item: { course_id: string }) => item.course_id,
        );
        const courseDetails = await api.getCourses(courseIds);
        const curriculumIds = [
          ...new Set(
            courseDetails.map(
              (course: { curriculum_id?: string | null }) =>
                course.curriculum_id,
            ),
          ),
        ];
        const gradeIds = [
          ...new Set(
            courseDetails.map(
              (course: { grade_id?: string | null }) => course.grade_id,
            ),
          ),
        ];
        const [curriculums, grades] = await Promise.all([
          api.getCurriculumsByIds(curriculumIds),
          api.getGradesByIds(gradeIds),
        ]);
        const curriculumMap = new Map(
          curriculums.map(
            (curriculum: { id: string; name?: string | null }) => [
              curriculum.id,
              curriculum.name,
            ],
          ),
        );
        const gradeMap = new Map(
          grades.map((grade: { id: string; name?: string | null }) => [
            grade.id,
            grade.name,
          ]),
        );
        setAllCourses(
          courseDetails.map(
            (course: {
              curriculum_id?: string | null;
              grade_id?: string | null;
            }) => ({
              ...course,
              curriculum_name: course.curriculum_id
                ? curriculumMap.get(course.curriculum_id) || ''
                : '',
              grade_name: course.grade_id
                ? gradeMap.get(course.grade_id) || ''
                : '',
            }),
          ),
        );
        setErrorMessage('');
      } catch (error) {
        logger.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [api, classData, mode, schoolId, setErrorMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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
