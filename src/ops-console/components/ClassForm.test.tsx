import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClassForm from './ClassForm';

jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('../../utility/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));
const mockApi = {
  getCoursesBySchoolId: jest.fn(),
  getCourses: jest.fn(),
  getCurriculumsByIds: jest.fn(),
  getGradesByIds: jest.fn(),
  getGradeByName: jest.fn(),
  getClassesBySchoolId: jest.fn(),
  createClass: jest.fn(),
  updateClass: jest.fn(),
  updateClassCourses: jest.fn(),
};
jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: () => ({ apiHandler: mockApi }) },
}));

beforeEach(() => {
  mockApi.getCoursesBySchoolId.mockResolvedValue([{ course_id: 'course-1' }]);
  mockApi.getCourses.mockResolvedValue([{ id: 'course-1', name: 'Math' }]);
  mockApi.getCurriculumsByIds.mockResolvedValue([]);
  mockApi.getGradesByIds.mockResolvedValue([]);
  mockApi.getClassesBySchoolId.mockResolvedValue([]);
  mockApi.createClass.mockResolvedValue({ id: 'class-1' });
});

it.each(['create', 'edit'] as const)(
  '%s blocks an empty selection and only shows an error when editing',
  async (mode) => {
    const classData = {
      id: 'class-1',
      name: '1A',
      courses: [
        { id: 'course-1', name: 'Math' },
        { id: 'unavailable-course', name: 'Old course' },
      ],
    } as React.ComponentProps<typeof ClassForm>['classData'];
    render(
      <ClassForm
        mode={mode}
        classData={mode === 'edit' ? classData : undefined}
        schoolId="school-1"
        onClose={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Enter Grade'), {
      target: { value: '2' },
    });
    const save = screen.getByRole('button', {
      name: mode === 'edit' ? 'Save' : 'Create Class',
    });
    await waitFor(() =>
      expect(save).toHaveProperty('disabled', mode === 'create'),
    );
    if (mode === 'create') {
      fireEvent.click(screen.getByText('Select Courses'));
      fireEvent.click(await screen.findByRole('checkbox'));
    } else {
      fireEvent.click(screen.getByText('1 Subjects Selected'));
    }
    expect(save).toBeEnabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByRole('alert')?.textContent ?? null).toBe(
      mode === 'edit' ? 'Please select at least one course.' : null,
    );
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(mockApi.createClass).not.toHaveBeenCalled();
    expect(mockApi.updateClass).not.toHaveBeenCalled();
    expect(mockApi.updateClassCourses).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() =>
      expect(mockApi.updateClassCourses).toHaveBeenCalledWith('class-1', [
        'course-1',
      ]),
    );
  },
);
