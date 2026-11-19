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
  selectedGradeIds: string[];
  onGradeChange: (gradeIds: string[]) => void;
  onToggle: (courseId: string) => void;
};

export const SchoolCourseSelector = ({
  courses,
  grades,
  loading,
  mode,
  removalError,
  selectedCourseIds,
  selectedGradeIds,
  onGradeChange,
  onToggle,
}: SchoolCourseSelectorProps) => {
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [selectedCourseIdsOnOpen, setSelectedCourseIdsOnOpen] = useState<
    string[]
  >([]);
  const coursesRef = useRef<HTMLDivElement | null>(null);
  const orderedGrades = [...grades].sort(
    (a, b) => (a.sort_index ?? Infinity) - (b.sort_index ?? Infinity),
  );
  // Keep rows in place as checkboxes change; refresh priority on the next open.
  const selectedIds = new Set(selectedCourseIdsOnOpen);
  const visibleCourses = orderedGrades
    .flatMap((grade) =>
      selectedGradeIds.includes(grade.id)
        ? courses.filter((course) => course.grade_id === grade.id)
        : [],
    )
    .sort(
      (a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)),
    );

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
          <FormLabel id="school-grades-label">
            {t('Grade')} <span className="add-school-requird">*</span>
          </FormLabel>
          <Select
            multiple
            labelId="school-grades-label"
            size="small"
            fullWidth
            value={selectedGradeIds}
            displayEmpty
            disabled={loading}
            renderValue={(selected) =>
              selected.length
                ? `${selected.length} ${t('Grades selected')}`
                : t('Select Grades')
            }
            onChange={(event) => {
              const value = event.target.value;
              onGradeChange(
                typeof value === 'string' ? value.split(',') : value,
              );
            }}
          >
            {orderedGrades.map((grade) => (
              <MenuItem key={grade.id} value={grade.id}>
                <Checkbox
                  size="small"
                  checked={selectedGradeIds.includes(grade.id)}
                />
                {grade.name}
              </MenuItem>
            ))}
          </Select>
          {mode === 'edit' && !loading && !selectedGradeIds.length && (
            <Typography color="error" variant="body2" role="alert">
              {t('Please select at least one grade.')}
            </Typography>
          )}
        </Box>

        <Box className="add-school-course-field" ref={coursesRef}>
          <FormLabel>
            {t('Courses')} <span className="add-school-requird">*</span>
          </FormLabel>
          <button
            type="button"
            id="add-school-course-select-trigger"
            className="add-school-course-select-trigger"
            disabled={loading || !selectedGradeIds.length}
            onClick={() => {
              if (!coursesOpen)
                setSelectedCourseIdsOnOpen([...selectedCourseIds]);
              setCoursesOpen(!coursesOpen);
            }}
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
                  {t('No courses available for the selected grades')}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
