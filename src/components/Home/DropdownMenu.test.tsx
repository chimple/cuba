import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DropdownMenu from './DropdownMenu';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { COURSE_CHANGED, EVENTS, LIVE_QUIZ } from '../../common/constants';

jest.mock('../displaySubjects/SelectIconImage', () => (props: any) => (
  <img alt="select-icon" src={props.defaultSrc || 'default.png'} />
));

jest.mock('../../utility/util');

const mockApi = {
  getPendingAssignments: jest.fn(),
  getCourse: jest.fn(),
  getGradeById: jest.fn(),
  getCurriculumById: jest.fn(),
  updateLearningPath: jest.fn(),
};

describe('DropdownMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'c1',
              path_id: 'p1',
              path: [{ lesson_id: 'l1', chapter_id: 'ch1', isPlayed: false }],
            },
            {
              course_id: 'c2',
              path_id: 'p2',
              path: [{ lesson_id: 'l2', chapter_id: 'ch2', isPlayed: false }],
            },
          ],
        },
      }),
    });
    (Util.getLatestLearningPathByUpdatedAt as jest.Mock).mockImplementation(
      (student: any) => student?.learning_path,
    );
    (Util.getCurrentClass as jest.Mock).mockReturnValue({ id: 'class-1' });
    (Util.setCurrentStudent as jest.Mock).mockResolvedValue(undefined);
    (Util.logEvent as jest.Mock).mockImplementation(() => {});
    mockApi.getGradeById.mockResolvedValue({ id: 'g1', name: 'Grade 1' });
    mockApi.getCurriculumById.mockResolvedValue({ id: 'cur-1', name: 'CBSE' });
    mockApi.updateLearningPath.mockResolvedValue(undefined);
  });

  const primeHomeworkCourses = () => {
    mockApi.getPendingAssignments.mockResolvedValue([
      { course_id: 'c1', type: 'assignment', lesson_id: 'les-1' },
      { course_id: 'c2', type: 'assignment', lesson_id: 'les-2' },
      { course_id: 'quiz-course', type: LIVE_QUIZ, lesson_id: 'les-3' },
    ]);
    mockApi.getCourse.mockImplementation((id: string) => {
      if (id === 'c1')
        return Promise.resolve({ id, name: 'Grade Math', code: 'MTH' });
      if (id === 'c2')
        return Promise.resolve({ id, name: 'Grade Science', code: 'SCI' });
      return Promise.resolve(null);
    });
  };

  test('loads homework courses and shows selected label', async () => {
    primeHomeworkCourses();
    render(<DropdownMenu syncWithLearningPath={false} />);

    await waitFor(() => {
      expect(screen.getByText('Grade Math')).toBeInTheDocument();
    });
  });

  test('calls onSubjectChange when selecting course in homework mode', async () => {
    primeHomeworkCourses();
    const onSubjectChange = jest.fn();
    const { container } = render(
      <DropdownMenu
        syncWithLearningPath={false}
        onSubjectChange={onSubjectChange}
      />,
    );

    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    expect(dropdown).toBeTruthy();
    if (dropdown) fireEvent.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText('Science')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Science'));
    expect(onSubjectChange).toHaveBeenCalledWith('c2');
  });

  test('supports externally selected subject in homework mode', async () => {
    primeHomeworkCourses();
    render(<DropdownMenu syncWithLearningPath={false} selectedSubject="c2" />);

    await waitFor(() => {
      expect(screen.getByText('Grade Science')).toBeInTheDocument();
    });
  });

  test('course change updates learning path and emits events in learning-path mode', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    mockApi.getCourse.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'c1' ? 'Grade Math' : 'Grade Science',
        code: id,
      }),
    );

    const onSubjectChange = jest.fn();
    const onCourseChange = jest.fn();
    const { container } = render(
      <DropdownMenu
        syncWithLearningPath={true}
        onSubjectChange={onSubjectChange}
        onCourseChange={onCourseChange}
      />,
    );

    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText('Science')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Science'));

    await waitFor(() => {
      expect(Util.setCurrentStudent).toHaveBeenCalled();
      expect(mockApi.updateLearningPath).toHaveBeenCalled();
      expect(onSubjectChange).toHaveBeenCalledWith('c2');
      expect(onCourseChange).toHaveBeenCalled();
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.PATHWAY_COURSE_CHANGED,
        expect.any(Object),
      );
      expect(dispatchSpy).toHaveBeenCalled();
    });

    const call = (Util.setCurrentStudent as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(call.learning_path);
    expect(parsed.courses.currentCourseIndex).toBe(1);
    dispatchSpy.mockRestore();
  });

  test('does not toggle when hideArrow is true', async () => {
    primeHomeworkCourses();
    const { container } = render(
      <DropdownMenu syncWithLearningPath={false} hideArrow={true} />,
    );
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    expect(dropdown?.className).not.toContain('dropdownmenu-expanded');
    if (dropdown) fireEvent.click(dropdown);

    expect(dropdown?.className).not.toContain('dropdownmenu-expanded');
    expect(container.querySelector('.dropdownmenu-dropdown-arrow')).toBeNull();
  });

  test('disabled mode prevents selection callbacks', async () => {
    primeHomeworkCourses();
    const onSubjectChange = jest.fn();
    const { container } = render(
      <DropdownMenu
        syncWithLearningPath={false}
        disabled={true}
        onSubjectChange={onSubjectChange}
      />,
    );
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText('Science')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Science'));
    expect(onSubjectChange).not.toHaveBeenCalled();
  });

  test('returns empty list when student or class is missing in homework mode', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    render(<DropdownMenu syncWithLearningPath={false} />);

    await waitFor(() => {
      expect(mockApi.getPendingAssignments).not.toHaveBeenCalled();
      expect(screen.queryByText('Grade Math')).not.toBeInTheDocument();
    });
  });

  test('handles per-course API failure gracefully in homework mode', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getPendingAssignments.mockResolvedValue([
      { course_id: 'c1', type: 'assignment' },
      { course_id: 'c2', type: 'assignment' },
    ]);
    mockApi.getCourse.mockImplementation((id: string) => {
      if (id === 'c1') return Promise.reject(new Error('course fetch failed'));
      return Promise.resolve({ id: 'c2', name: 'Grade Science', code: 'SCI' });
    });

    render(<DropdownMenu syncWithLearningPath={false} />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText('Grade Science')).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test('handles top-level fetch errors without crashing', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getPendingAssignments.mockRejectedValue(new Error('network fail'));
    render(<DropdownMenu syncWithLearningPath={false} />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.queryByText('Grade Science')).not.toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test('shows disabled CSS class when disabled prop is set', async () => {
    primeHomeworkCourses();
    const { container } = render(
      <DropdownMenu syncWithLearningPath={false} disabled={true} />,
    );
    await screen.findByText('Grade Math');
    const root = container.querySelector('.dropdownmenu-dropdown-main');
    expect(root?.className).toContain('dropdownmenu-dropdown-disabled');
  });

  test('emits COURSE_CHANGED custom event on learning-path course switch', async () => {
    mockApi.getCourse.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'c1' ? 'Grade Math' : 'Grade Science',
        code: id,
      }),
    );
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { container } = render(<DropdownMenu />);

    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    fireEvent.click(await screen.findByText('Science'));

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
    const evtName = (dispatchSpy.mock.calls[0][0] as CustomEvent).type;
    expect(evtName).toBe(COURSE_CHANGED);
    dispatchSpy.mockRestore();
  });

  test('filters out live quiz assignments in homework mode', async () => {
    mockApi.getPendingAssignments.mockResolvedValue([
      { course_id: 'c1', type: LIVE_QUIZ },
      { course_id: 'c2', type: LIVE_QUIZ },
    ]);
    mockApi.getCourse.mockResolvedValue(null);
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);

    await waitFor(() => {
      expect(
        container.querySelector('.dropdownmenu-dropdown-label'),
      ).toBeNull();
      expect(mockApi.getCourse).not.toHaveBeenCalled();
    });
  });

  test('homework mode with no pending assignments renders empty dropdown state', async () => {
    mockApi.getPendingAssignments.mockResolvedValue([]);
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);
    await waitFor(() => {
      expect(
        container.querySelector('.dropdownmenu-dropdown-label'),
      ).toBeNull();
    });
  });

  test('selectedSubject fallback chooses first course if no match', async () => {
    primeHomeworkCourses();
    render(
      <DropdownMenu syncWithLearningPath={false} selectedSubject="unknown" />,
    );
    await waitFor(() => {
      expect(screen.getByText('Grade Math')).toBeInTheDocument();
    });
  });

  test('learning-path mode without learning_path does not crash', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Util.getCurrentStudent as jest.Mock).mockReturnValueOnce({
      id: 'stu-1',
      learning_path: null,
    });
    render(<DropdownMenu syncWithLearningPath={true} />);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    spy.mockRestore();
  });

  test('homework mode selection does not update learning path', async () => {
    primeHomeworkCourses();
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    fireEvent.click(await screen.findByText('Science'));

    expect(mockApi.updateLearningPath).not.toHaveBeenCalled();
    expect(Util.setCurrentStudent).not.toHaveBeenCalled();
  });

  test('calls onCourseChange only in learning-path mode', async () => {
    primeHomeworkCourses();
    const onCourseChange = jest.fn();
    const { container } = render(
      <DropdownMenu
        syncWithLearningPath={false}
        onCourseChange={onCourseChange}
      />,
    );
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    fireEvent.click(await screen.findByText('Science'));
    expect(onCourseChange).not.toHaveBeenCalled();
  });

  test('learning-path mode logs pathway event payload with course ids', async () => {
    mockApi.getCourse.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'c1' ? 'Grade Math' : 'Grade Science',
        code: id,
      }),
    );
    const { container } = render(<DropdownMenu />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    fireEvent.click(await screen.findByText('Science'));

    await waitFor(() => {
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.PATHWAY_COURSE_CHANGED,
        expect.objectContaining({
          prev_course_id: 'c1',
          current_course_id: 'c2',
        }),
      );
    });
  });

  test('gracefully handles handleSelect errors', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getCourse.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'c1' ? 'Grade Math' : 'Grade Science',
        code: id,
      }),
    );
    mockApi.updateLearningPath.mockRejectedValue(new Error('save-fail'));
    const { container } = render(<DropdownMenu />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    fireEvent.click(await screen.findByText('Science'));
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    spy.mockRestore();
  });

  test('dropdown expands when hideArrow is false', async () => {
    primeHomeworkCourses();
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    expect(dropdown?.className).not.toContain('dropdownmenu-expanded');
    if (dropdown) fireEvent.click(dropdown);
    await waitFor(() => {
      expect(dropdown?.className).toContain('dropdownmenu-expanded');
    });
  });

  test('shows truncated second word of course names in expanded list', async () => {
    primeHomeworkCourses();
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
    });
  });

  test('learning-path mode preselects course from currentCourseIndex (post-completion switch)', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      learning_path: JSON.stringify({
        courses: {
          currentCourseIndex: 1,
          courseList: [
            {
              course_id: 'c1',
              path_id: 'p1',
              path: [{ lesson_id: 'l1', isPlayed: true }],
            },
            {
              course_id: 'c2',
              path_id: 'p2',
              path: [{ lesson_id: 'l2', isPlayed: false }],
            },
          ],
        },
      }),
    });
    mockApi.getCourse.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'c1' ? 'Grade Math' : 'Grade Science',
        code: id,
      }),
    );

    render(<DropdownMenu syncWithLearningPath={true} />);
    await waitFor(() => {
      expect(screen.getByText('Grade Science')).toBeInTheDocument();
    });
  });

  test('dropdown options enter open/scrollable state when expanded', async () => {
    primeHomeworkCourses();
    const { container } = render(<DropdownMenu syncWithLearningPath={false} />);
    await screen.findByText('Grade Math');
    const dropdown = container.querySelector(
      '.dropdownmenu-dropdown-container',
    );
    if (dropdown) fireEvent.click(dropdown);

    await waitFor(() => {
      const options = container.querySelector('.dropdownmenu-dropdown-items');
      expect(options?.className).toContain('dropdownmenu-open');
      expect(options?.getAttribute('aria-hidden')).toBe('false');
    });
  });
});
