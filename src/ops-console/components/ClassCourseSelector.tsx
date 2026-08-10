import React from 'react';
import { t } from 'i18next';

type ClassCourseSelectorProps = {
  allCourses: any[];
  dropdownOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onSelectCourse: (id: string) => void;
  onToggleDropdown: () => void;
  placeholder: string;
  selectedCourse: string[];
};

export const ClassCourseSelector = ({
  allCourses,
  dropdownOpen,
  dropdownRef,
  onSelectCourse,
  onToggleDropdown,
  placeholder,
  selectedCourse,
}: ClassCourseSelectorProps) => (
  <div className="class-form-group class-form-full-width" ref={dropdownRef}>
    <label>
      {t('Courses')}
      <span className="class-form-group-required-star"> *</span>
    </label>

    <div className="multi-select-input" onClick={onToggleDropdown}>
      {placeholder}
      <img
        src="/assets/loginAssets/DropDownArrow.svg"
        className={dropdownOpen ? 'rotate' : ''}
      />
    </div>

    {dropdownOpen && (
      <div className="class-form-multi-dropdown">
        {[...allCourses]
          .sort(
            (a, b) =>
              a.curriculum_name.localeCompare(b.curriculum_name) ||
              a.grade_name.localeCompare(b.grade_name) ||
              a.name.localeCompare(b.name),
          )
          .map((course: any) => (
            <label key={course.id} className="class-form-multi-option">
              <div className="class-option-text">
                <span className="class-form-subject">{course.name}</span>
                <span className="class-form-sub">
                  {course.curriculum_name} - {course.grade_name}
                </span>
              </div>
              <input
                type="checkbox"
                className="class-form-checkbox"
                checked={selectedCourse.includes(course.id)}
                onChange={() => onSelectCourse(course.id)}
              />
            </label>
          ))}
      </div>
    )}
  </div>
);
