import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SchoolCourseSelector } from './SchoolCourseSelector';

jest.mock('i18next', () => ({ t: (key: string) => key }));

it('sorts selected courses first only on opening and keeps checkbox rows stable while open', () => {
  const onToggle = jest.fn();
  const courseDefaults = {
    code: null,
    color: null,
    created_at: '',
    curriculum_id: null,
    description: null,
    firebase_id: null,
    framework_id: null,
    image: null,
    is_deleted: false,
    sort_index: null,
    subject_id: null,
    updated_at: null,
  };
  const props: React.ComponentProps<typeof SchoolCourseSelector> = {
    courses: [
      {
        ...courseDefaults,
        id: 'course-1',
        name: 'English',
        grade_id: 'grade-1',
        grade_name: 'Grade 1',
        curriculum_name: 'Chimple',
      },
      {
        ...courseDefaults,
        id: 'course-2',
        name: 'Math',
        grade_id: 'grade-2',
        grade_name: 'Grade 2',
        curriculum_name: 'Chimple',
      },
    ],
    grades: [
      {
        id: 'grade-1',
        name: 'Grade 1',
        description: null,
        firebase_id: null,
        image: null,
        test: null,
        created_at: '',
        updated_at: null,
        is_deleted: false,
        sort_index: null,
      },
    ],
    loading: false,
    mode: 'edit',
    selectedCourseIds: ['course-1'],
    selectedGradeIds: ['grade-1'],
    onGradeChange: jest.fn(),
    onToggle,
  };
  props.grades.push({
    ...props.grades[0],
    id: 'grade-2',
    name: 'Grade 2',
    sort_index: 2,
  });
  props.grades[0].sort_index = 1;
  props.grades.reverse();
  props.courses.reverse();
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
  const selectedCourse = screen.getByRole('checkbox', { name: /English/ });
  expect(selectedCourse).toBeChecked();
  expect(
    screen.queryByRole('checkbox', { name: /Math/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(selectedCourse);
  expect(onToggle).toHaveBeenCalledWith('course-1');

  rerender(
    <SchoolCourseSelector
      {...props}
      selectedGradeIds={['grade-2', 'grade-1']}
    />,
  );
  const courseCheckboxes = screen.getAllByRole('checkbox');
  expect(courseCheckboxes[0]).toHaveAccessibleName('English Chimple - Grade 1');
  expect(courseCheckboxes[1]).toHaveAccessibleName('Math Chimple - Grade 2');
  expect(screen.getByRole('checkbox', { name: /Math/ })).not.toBeChecked();

  rerender(
    <SchoolCourseSelector
      {...props}
      selectedGradeIds={['grade-2', 'grade-1']}
      selectedCourseIds={['course-2']}
    />,
  );
  expect(screen.getAllByRole('checkbox')[0]).toHaveAccessibleName(
    'English Chimple - Grade 1',
  );
  expect(screen.getByRole('checkbox', { name: /English/ })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: /Math/ })).toBeChecked();
  // Closing and reopening applies the latest selections to the row order.
  fireEvent.click(screen.getByRole('button', { name: /1 Courses selected/ }));
  fireEvent.click(screen.getByRole('button', { name: /1 Courses selected/ }));
  expect(screen.getAllByRole('checkbox')[0]).toHaveAccessibleName(
    'Math Chimple - Grade 2',
  );
  expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  expect(screen.getAllByRole('checkbox')[1]).toHaveAccessibleName(
    'English Chimple - Grade 1',
  );

  rerender(
    <SchoolCourseSelector
      {...props}
      selectedGradeIds={['grade-2', 'grade-1']}
      selectedCourseIds={['course-2', 'course-1']}
    />,
  );
  expect(screen.getAllByRole('checkbox')[0]).toHaveAccessibleName(
    'Math Chimple - Grade 2',
  );
  expect(screen.getByRole('checkbox', { name: /English/ })).toBeChecked();
  fireEvent.mouseDown(screen.getByText('Courses available to this school'));
  expect(
    screen.queryByRole('checkbox', { name: /Math/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /2 Courses selected/ }));
  expect(screen.getAllByRole('checkbox')[0]).toHaveAccessibleName(
    'English Chimple - Grade 1',
  );
  expect(screen.getAllByRole('checkbox')[1]).toHaveAccessibleName(
    'Math Chimple - Grade 2',
  );

  fireEvent.mouseDown(screen.getByRole('combobox', { name: /Grade/ }));
  expect(
    screen.getAllByRole('option').map((option) => option.textContent),
  ).toEqual(['Grade 1', 'Grade 2']);
  fireEvent.click(screen.getByRole('option', { name: /Grade 1/ }));
  expect(props.onGradeChange).toHaveBeenCalledWith(['grade-2']);
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

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
  rerender(
    <SchoolCourseSelector
      {...props}
      mode="create"
      selectedGradeIds={[]}
      selectedCourseIds={[]}
    />,
  );
  expect(screen.getByRole('button', { name: /Select Courses/ })).toBeDisabled();
  expect(
    screen.queryByRole('checkbox', { name: /English/ }),
  ).not.toBeInTheDocument();
});
