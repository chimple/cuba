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
      setSelectedCourse(classData.courses.map((course: any) => course.id));
    }
  }, [mode, classData]);

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
        const courseIds = schoolCourse.map((item: any) => item.course_id);
        const courseDetails = await api.getCourses(courseIds);
        const curriculumIds = [
          ...new Set(courseDetails.map((course: any) => course.curriculum_id)),
        ];
        const gradeIds = [
          ...new Set(courseDetails.map((course: any) => course.grade_id)),
        ];
        const [curriculums, grades] = await Promise.all([
          api.getCurriculumsByIds(curriculumIds),
          api.getGradesByIds(gradeIds),
        ]);
        const curriculumMap = new Map(
          curriculums.map((curriculum: any) => [
            curriculum.id,
            curriculum.name,
          ]),
        );
        const gradeMap = new Map(
          grades.map((grade: any) => [grade.id, grade.name]),
        );
        setAllCourses(
          courseDetails.map((course: any) => ({
            ...course,
            curriculum_name: curriculumMap.get(course.curriculum_id) || '',
            grade_name: gradeMap.get(course.grade_id) || '',
          })),
        );
        if (mode === 'edit' && classData?.Courses) {
          setSelectedCourse(
            classData.Courses.map((course: any) => course.course_id),
          );
        }
        setErrorMessage('');
      } catch (error) {
        logger.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [schoolId, mode]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
