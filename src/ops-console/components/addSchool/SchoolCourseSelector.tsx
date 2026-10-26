import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Checkbox,
  FormLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import type { TableTypes } from '../../../common/constants';

export type SchoolCourseOption = TableTypes<'course'> & {
  grade_name: string;
  curriculum_name: string;
};

type SchoolCourseSelectorProps = {
  courses: SchoolCourseOption[];
  grades: TableTypes<'grade'>[];
  loading: boolean;
  mode: 'create' | 'edit';
  removalError?: string;
  selectedCourseIds: string[];
  selectedGradeId: string;
  onGradeChange: (gradeId: string) => void;
  onToggle: (courseId: string) => void;
};

export const SchoolCourseSelector = ({
  courses,
  grades,
  loading,
  mode,
  removalError,
  selectedCourseIds,
  selectedGradeId,
  onGradeChange,
  onToggle,
}: SchoolCourseSelectorProps) => {
  const [coursesOpen, setCoursesOpen] = useState(false);
  const coursesRef = useRef<HTMLDivElement | null>(null);
  const visibleCourses = selectedGradeId
    ? courses.filter(
        (course) =>
          course.grade_id === selectedGradeId ||
          selectedCourseIds.includes(course.id),
      )
    : courses;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        coursesRef.current &&
        event.target instanceof Node &&
        !coursesRef.current.contains(event.target)
      ) {
        setCoursesOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <Box className="add-school-section-box">
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ marginBottom: '12px', fontSize: '1rem', color: '#111827' }}
      >
        {t('Courses available to this school')}
      </Typography>

      <Box className="add-school-course-filters">
        <Box className="add-school-course-field">
          <FormLabel>{t('Grade')}</FormLabel>
          <Select
            size="small"
            fullWidth
            value={selectedGradeId}
            displayEmpty
            disabled={loading}
            onChange={(event) => onGradeChange(event.target.value)}
          >
            <MenuItem value="">{t('All Grades')}</MenuItem>
            {grades.map((grade) => (
              <MenuItem key={grade.id} value={grade.id}>
                {grade.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box className="add-school-course-field" ref={coursesRef}>
          <FormLabel>
            {t('Courses')} <span className="add-school-requird">*</span>
          </FormLabel>
          <button
            type="button"
            className="add-school-course-select-trigger"
            disabled={loading}
            onClick={() => setCoursesOpen((open) => !open)}
          >
            {selectedCourseIds.length
              ? `${selectedCourseIds.length} ${t('Courses selected')}`
              : t('Select Courses')}
            <span>{coursesOpen ? '⌃' : '⌄'}</span>
          </button>
          {mode === 'edit' &&
            !loading &&
            (removalError || selectedCourseIds.length === 0) && (
              <Typography color="error" variant="body2" role="alert">
                {removalError || t('Please select at least one course.')}
              </Typography>
            )}
          {coursesOpen && (
            <Box className="add-school-course-menu">
              {visibleCourses.map((course) => (
                <label key={course.id} className="add-school-course-menu-item">
                  <Box className="add-school-course-copy">
                    <strong>{course.name}</strong>
                    <span>
                      {course.curriculum_name} - {course.grade_name}
                    </span>
                  </Box>
                  <Checkbox
                    size="small"
                    checked={selectedCourseIds.includes(course.id)}
                    onChange={() => onToggle(course.id)}
                  />
                </label>
              ))}
              {!visibleCourses.length && (
                <Typography className="add-school-course-empty">
                  {t('No courses available for this grade')}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
