import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SchoolCourseSelector } from './SchoolCourseSelector';

jest.mock('i18next', () => ({ t: (key: string) => key }));

it('keeps a selected course visible when another grade is filtered', () => {
  const onToggle = jest.fn();
  const props = {
    courses: [
      {
        id: 'course-1',
        name: 'English',
        grade_id: 'grade-1',
        grade_name: 'Grade 1',
        curriculum_name: 'Chimple',
      },
      {
        id: 'course-2',
        name: 'Math',
        grade_id: 'grade-2',
        grade_name: 'Grade 2',
        curriculum_name: 'Chimple',
      },
    ],
    grades: [{ id: 'grade-1', name: 'Grade 1' }],
    loading: false,
    mode: 'edit',
    selectedCourseIds: ['course-2'],
    selectedGradeId: 'grade-1',
    onGradeChange: jest.fn(),
    onToggle,
  } as React.ComponentProps<typeof SchoolCourseSelector>;
  const { rerender } = render(<SchoolCourseSelector {...props} />);
  rerender(
    <SchoolCourseSelector
      {...props}
      removalError="Class 2B would have no courses."
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Class 2B would have no courses.',
  );
  rerender(<SchoolCourseSelector {...props} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /1 Courses selected/ }));
  const selectedCourse = screen.getByRole('checkbox', { name: /Math/ });
  expect(selectedCourse).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /English/ })).not.toBeChecked();
  fireEvent.click(selectedCourse);
  expect(onToggle).toHaveBeenCalledWith('course-2');

  rerender(<SchoolCourseSelector {...props} selectedCourseIds={[]} />);
  expect(screen.getByRole('button', { name: /Select Courses/ })).toBeEnabled();
  expect(
    screen.queryByRole('checkbox', { name: /Math/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Please select at least one course.',
  );

  rerender(
    <SchoolCourseSelector {...props} mode="create" selectedCourseIds={[]} />,
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
