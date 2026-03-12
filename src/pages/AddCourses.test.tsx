import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCourses from './AddCourses';
import { EVENTS, HOMEHEADERLIST, PAGES } from '../common/constants';

const mockHistory = { replace: jest.fn() };
const mockGetCurrentStudent = jest.fn();
const mockGetCurrentClass = jest.fn();
const mockGetCurrMode = jest.fn();
const mockPresentToast = jest.fn();
const mockApiHandler = {
  getAdditionalCourses: jest.fn(),
  addCourseForParentsStudent: jest.fn(),
};
let mockOnline = true;
const mockLogEvent = jest.fn();

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('../utility/util', () => ({
  Util: {
    getCurrentStudent: () => mockGetCurrentStudent(),
    logEvent: (...args: any[]) => mockLogEvent(...args),
  },
}));

jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrentClass: () => mockGetCurrentClass(),
    getCurrMode: () => mockGetCurrMode(),
  },
}));

jest.mock('../common/onlineOfflineErrorMessageHandler', () => ({
  useOnlineOfflineErrorMessageHandler: () => ({
    online: mockOnline,
    presentToast: mockPresentToast,
  }),
}));

jest.mock('../components/Loading', () => ({
  __esModule: true,
  default: ({ isLoading }: any) => (
    <div data-testid="loading">{String(isLoading)}</div>
  ),
}));

jest.mock('../components/SkeltonLoading', () => ({
  __esModule: true,
  default: ({ isLoading, header }: any) => (
    <div data-testid="skeleton">
      {String(isLoading)}-{String(header)}
    </div>
  ),
}));

jest.mock('../components/common/BackButton', () => ({
  __esModule: true,
  default: ({ onClicked }: any) => (
    <button type="button" data-testid="back-button" onClick={onClicked}>
      Back
    </button>
  ),
}));

jest.mock('../components/common/NextButton', () => ({
  __esModule: true,
  default: ({ disabled, onClicked }: any) => (
    <button
      type="button"
      data-testid="next-button"
      disabled={disabled}
      onClick={onClicked}
    >
      Next
    </button>
  ),
}));

jest.mock('../components/displaySubjects/AddCourse', () => ({
  __esModule: true,
  default: ({ courses, onSelectedCoursesChange }: any) => (
    <div data-testid="add-course">
      <div data-testid="course-count">{courses.length}</div>
      <button
        type="button"
        data-testid="select-course-button"
        onClick={() => onSelectedCoursesChange([courses[0]])}
      >
        Select Course
      </button>
    </div>
  ),
}));

describe('AddCourses', () => {
  const currentStudent = { id: 'student-1', name: 'Alex' } as any;
  const mockCourses = [{ id: 'course-1', name: 'Maths' }] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnline = true;
    mockGetCurrentStudent.mockReturnValue(currentStudent);
    mockGetCurrentClass.mockReturnValue({ id: 'class-1' });
    mockGetCurrMode.mockResolvedValue('PARENT');
    mockApiHandler.getAdditionalCourses.mockResolvedValue(mockCourses);
    mockApiHandler.addCourseForParentsStudent.mockResolvedValue(undefined);
  });

  it('fetches additional courses and renders AddCourse list', async () => {
    render(<AddCourses />);

    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledWith(
        currentStudent.id,
      );
    });

    expect(await screen.findByTestId('add-course')).toBeInTheDocument();
    expect(screen.getByTestId('course-count')).toHaveTextContent('1');
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      `false-${HOMEHEADERLIST.SUBJECTS}`,
    );
  });

  it('calls course fetch flow twice on mount (init and direct call)', async () => {
    render(<AddCourses />);

    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
  });

  it('queries current class and mode while loading courses', async () => {
    render(<AddCourses />);

    await waitFor(() => {
      expect(mockGetCurrentClass).toHaveBeenCalled();
      expect(mockGetCurrMode).toHaveBeenCalled();
    });
  });

  it('calls current class and mode lookups twice due double course fetch on mount', async () => {
    render(<AddCourses />);

    await waitFor(() => {
      expect(mockGetCurrentClass).toHaveBeenCalledTimes(2);
      expect(mockGetCurrMode).toHaveBeenCalledTimes(2);
    });
  });

  it('redirects to select mode when current student is missing', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);

    render(<AddCourses />);

    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });

    expect(mockApiHandler.getAdditionalCourses).not.toHaveBeenCalled();
  });

  // it("keeps next button disabled until at least one course is selected", async () => {
  //   const user = userEvent.setup();
  //   render(<AddCourses />);

  //   const nextButton = await screen.findByTestId("next-button");
  //   expect(nextButton).toBeDisabled();

  //   await user.click(screen.getByTestId("select-course-button"));
  //   expect(screen.getByTestId("next-button")).toBeEnabled();
  // });

  it('navigates home when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);

    await screen.findByTestId('back-button');
    await user.click(screen.getByTestId('back-button'));

    expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.HOME);
  });

  it('shows offline toast and does not update courses when next is clicked offline', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);

    await screen.findByTestId('select-course-button');
    await user.click(screen.getByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    expect(mockPresentToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Device is offline.',
        color: 'danger',
      }),
    );
    expect(mockApiHandler.addCourseForParentsStudent).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
    expect(mockHistory.replace).not.toHaveBeenCalledWith(PAGES.HOME);
  });

  it('shows full offline toast payload when next is clicked without connectivity', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);

    await screen.findByTestId('select-course-button');
    await user.click(screen.getByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    expect(mockPresentToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Device is offline.',
        color: 'danger',
        duration: 3000,
        position: 'bottom',
        buttons: [expect.objectContaining({ text: 'Dismiss', role: 'cancel' })],
      }),
    );
  });

  it('updates selected courses and navigates home when next is clicked online', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);

    await screen.findByTestId('select-course-button');
    await user.click(screen.getByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledWith(
        [mockCourses[0]],
        currentStudent,
      );
    });

    expect(mockLogEvent).toHaveBeenCalledWith(EVENTS.USER_PROFILE, {});
    expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.HOME);
    expect(mockPresentToast).not.toHaveBeenCalled();
  });

  it('logs profile event once on successful next click', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);

    await screen.findByTestId('select-course-button');
    await user.click(screen.getByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });
  });

  it('renders no subjects message when no additional courses are available', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([]);
    render(<AddCourses />);

    expect(
      await screen.findByText('No more subjects available to add'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('add-course')).not.toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeDisabled();
  });

  it('keeps next disabled and does not submit when no course is selected', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);

    const nextButton = await screen.findByTestId('next-button');
    expect(nextButton).toBeDisabled();
    await user.click(nextButton);

    expect(mockApiHandler.addCourseForParentsStudent).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('renders loading as true before course fetch resolves', async () => {
    let resolveCourses: (value: any) => void = () => {};
    const pendingCourses = new Promise((resolve) => {
      resolveCourses = resolve;
    });
    mockApiHandler.getAdditionalCourses.mockReturnValue(pendingCourses as any);

    render(<AddCourses />);

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    resolveCourses(mockCourses);
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('calls addCourseForParentsStudent once per successful next click', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);

    await screen.findByTestId('select-course-button');
    await user.click(screen.getByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  it('renders ion page container', () => {
    render(<AddCourses />);
    expect(screen.getByTestId('ion-page')).toBeInTheDocument();
  });

  it('renders back and next buttons', () => {
    render(<AddCourses />);
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('shows skeleton loading true while courses are pending', () => {
    mockApiHandler.getAdditionalCourses.mockReturnValue(new Promise(() => {}));
    render(<AddCourses />);
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      `true-${HOMEHEADERLIST.SUBJECTS}`,
    );
  });

  it('calls getAdditionalCourses twice with the same student id by default', async () => {
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
    expect(mockApiHandler.getAdditionalCourses.mock.calls[0][0]).toBe(
      currentStudent.id,
    );
    expect(mockApiHandler.getAdditionalCourses.mock.calls[1][0]).toBe(
      currentStudent.id,
    );
  });

  it('does not render select-course-button when no additional courses are returned', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([]);
    render(<AddCourses />);
    await screen.findByText('No more subjects available to add');
    expect(
      screen.queryByTestId('select-course-button'),
    ).not.toBeInTheDocument();
  });

  it('back click does not submit course updates', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('back-button'));
    expect(mockApiHandler.addCourseForParentsStudent).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('back click does not show offline toast', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('back-button'));
    expect(mockPresentToast).not.toHaveBeenCalled();
  });

  it('double back click navigates home twice', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    const backButton = await screen.findByTestId('back-button');
    await user.click(backButton);
    await user.click(backButton);
    expect(mockHistory.replace).toHaveBeenCalledTimes(2);
    expect(mockHistory.replace).toHaveBeenNthCalledWith(1, PAGES.HOME);
    expect(mockHistory.replace).toHaveBeenNthCalledWith(2, PAGES.HOME);
  });

  it('offline next click calls toast once', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(mockPresentToast).toHaveBeenCalledTimes(1);
  });

  it('two offline next clicks show toast twice', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    await user.click(nextButton);
    expect(mockPresentToast).toHaveBeenCalledTimes(2);
  });

  it('online next click does not show toast', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(mockPresentToast).not.toHaveBeenCalled();
    });
  });

  it('double online next click submits updates twice', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    await user.click(nextButton);
    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it('double online next click logs events twice', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    await user.click(nextButton);
    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledTimes(2);
    });
  });

  it('double online next click navigates home twice', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    await user.click(nextButton);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.HOME);
      expect(mockHistory.replace).toHaveBeenCalledTimes(2);
    });
  });

  it('renders correct course count when two courses are returned', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([
      { id: 'course-1', name: 'Maths' },
      { id: 'course-2', name: 'Science' },
    ]);
    render(<AddCourses />);
    expect(await screen.findByTestId('course-count')).toHaveTextContent('2');
  });

  it('shows no-subjects message when courses response is null', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue(null);
    render(<AddCourses />);
    expect(
      await screen.findByText('No more subjects available to add'),
    ).toBeInTheDocument();
  });

  it('shows no-subjects message when courses response is undefined', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue(undefined);
    render(<AddCourses />);
    expect(
      await screen.findByText('No more subjects available to add'),
    ).toBeInTheDocument();
  });

  it('does not call presentToast when next is disabled and clicked', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    const nextButton = await screen.findByTestId('next-button');
    expect(nextButton).toBeDisabled();
    await user.click(nextButton);
    expect(mockPresentToast).not.toHaveBeenCalled();
  });

  it('uses latest getCurrentStudent values across the two fetch calls', async () => {
    const s1 = { id: 'student-a', name: 'A' };
    const s2 = { id: 'student-b', name: 'B' };
    mockGetCurrentStudent
      .mockReturnValueOnce(currentStudent) // render-time currentStudent
      .mockReturnValueOnce(s1) // first getCourses
      .mockReturnValueOnce(s2); // second getCourses

    render(<AddCourses />);

    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
    expect(mockApiHandler.getAdditionalCourses.mock.calls[0][0]).toBe(
      'student-a',
    );
    expect(mockApiHandler.getAdditionalCourses.mock.calls[1][0]).toBe(
      'student-b',
    );
  });

  it('keeps loading false after successful online submit', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('renders add-course with course-count 3 when API returns three courses', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([
      { id: 'c1', name: 'Maths' },
      { id: 'c2', name: 'Science' },
      { id: 'c3', name: 'English' },
    ]);
    render(<AddCourses />);
    expect(await screen.findByTestId('add-course')).toBeInTheDocument();
    expect(screen.getByTestId('course-count')).toHaveTextContent('3');
  });

  it('does not show no-subjects text when courses exist', async () => {
    render(<AddCourses />);
    await screen.findByTestId('add-course');
    expect(
      screen.queryByText('No more subjects available to add'),
    ).not.toBeInTheDocument();
  });

  it('sets loading false after empty courses response', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([]);
    render(<AddCourses />);
    await screen.findByText('No more subjects available to add');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('does not query class/mode when student is missing', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
    expect(mockGetCurrentClass).not.toHaveBeenCalled();
    expect(mockGetCurrMode).not.toHaveBeenCalled();
  });

  it('online submit passes selected course id in payload', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledWith(
        [expect.objectContaining({ id: 'course-1' })],
        currentStudent,
      );
    });
  });

  it('double online submit uses same payload both times', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const next = screen.getByTestId('next-button');
    await user.click(next);
    await user.click(next);
    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenNthCalledWith(
        1,
        [expect.objectContaining({ id: 'course-1' })],
        currentStudent,
      );
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenNthCalledWith(
        2,
        [expect.objectContaining({ id: 'course-1' })],
        currentStudent,
      );
    });
  });

  it('double online submit logs USER_PROFILE event each time', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const next = screen.getByTestId('next-button');
    await user.click(next);
    await user.click(next);
    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, EVENTS.USER_PROFILE, {});
      expect(mockLogEvent).toHaveBeenNthCalledWith(2, EVENTS.USER_PROFILE, {});
    });
  });

  it('offline repeated submit never calls addCourseForParentsStudent', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const next = screen.getByTestId('next-button');
    await user.click(next);
    await user.click(next);
    expect(mockApiHandler.addCourseForParentsStudent).not.toHaveBeenCalled();
  });

  it('offline repeated submit never logs events', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const next = screen.getByTestId('next-button');
    await user.click(next);
    await user.click(next);
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('offline repeated submit never navigates home', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    const next = screen.getByTestId('next-button');
    await user.click(next);
    await user.click(next);
    expect(mockHistory.replace).not.toHaveBeenCalledWith(PAGES.HOME);
  });

  it('next button is enabled after selecting a course', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    const next = await screen.findByTestId('next-button');
    expect(next).toBeDisabled();
    await user.click(await screen.findByTestId('select-course-button'));
    expect(screen.getByTestId('next-button')).toBeEnabled();
  });

  it('stays disabled when courses are unavailable', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([]);
    render(<AddCourses />);
    await screen.findByText('No more subjects available to add');
    expect(screen.getByTestId('next-button')).toBeDisabled();
  });

  it('shows loading true and hides add-course while request is pending', () => {
    mockApiHandler.getAdditionalCourses.mockReturnValue(new Promise(() => {}));
    render(<AddCourses />);
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.queryByTestId('add-course')).not.toBeInTheDocument();
  });

  it('does not show no-subject message while request is pending', () => {
    mockApiHandler.getAdditionalCourses.mockReturnValue(new Promise(() => {}));
    render(<AddCourses />);
    expect(
      screen.queryByText('No more subjects available to add'),
    ).not.toBeInTheDocument();
  });

  it('submit uses baseline mocked currentStudent from setup', async () => {
    const renderStudent = { id: 'render-student', name: 'R' };
    const fetchStudent1 = { id: 'fetch-1', name: 'F1' };
    const fetchStudent2 = { id: 'fetch-2', name: 'F2' };
    mockGetCurrentStudent
      .mockReturnValueOnce(renderStudent)
      .mockReturnValueOnce(fetchStudent1)
      .mockReturnValueOnce(fetchStudent2);

    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));

    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledWith(
        [expect.objectContaining({ id: 'course-1' })],
        currentStudent,
      );
    });
  });

  it('skeleton header stays SUBJECTS after loaded state', async () => {
    render(<AddCourses />);
    await screen.findByTestId('add-course');
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      `false-${HOMEHEADERLIST.SUBJECTS}`,
    );
  });

  it('redirect path is SELECT_MODE twice when student missing (double fetch path)', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledTimes(2);
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  it('successful submit does not call SELECT_MODE navigation', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(mockHistory.replace).not.toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
  });

  it('back navigation remains HOME even when online flag is false', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('back-button'));
    expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.HOME);
  });

  it('missing student triggers SELECT_MODE for each mount-time fetch invocation', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenNthCalledWith(1, PAGES.SELECT_MODE);
      expect(mockHistory.replace).toHaveBeenNthCalledWith(2, PAGES.SELECT_MODE);
    });
  });

  it('shows loading true immediately on initial render', () => {
    render(<AddCourses />);
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('skeleton always uses SUBJECTS header key', () => {
    render(<AddCourses />);
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      HOMEHEADERLIST.SUBJECTS,
    );
  });

  it('calls Util.getCurrentStudent at least three times on happy mount path', async () => {
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
    expect(mockGetCurrentStudent.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('calls Util.getCurrentStudent three times when student is missing', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
    expect(mockGetCurrentStudent).toHaveBeenCalledTimes(3);
  });

  it('continues fetching courses when current class is undefined', async () => {
    mockGetCurrentClass.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
  });

  it('continues fetching courses when current mode resolves undefined', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockApiHandler.getAdditionalCourses).toHaveBeenCalledTimes(2);
    });
  });

  it('after selecting a course, no-subject text is not rendered', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    expect(
      screen.queryByText('No more subjects available to add'),
    ).not.toBeInTheDocument();
  });

  it('double selecting still keeps next button enabled', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    const selectButton = await screen.findByTestId('select-course-button');
    await user.click(selectButton);
    await user.click(selectButton);
    expect(screen.getByTestId('next-button')).toBeEnabled();
  });

  it('select then back navigates home without submitting', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('back-button'));
    expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.HOME);
    expect(mockApiHandler.addCourseForParentsStudent).not.toHaveBeenCalled();
  });

  it('select then back does not log USER_PROFILE', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('back-button'));
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('select then back does not trigger toast even offline', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('back-button'));
    expect(mockPresentToast).not.toHaveBeenCalled();
  });

  it('with two courses returned, selected payload still uses first course from mock AddCourse', async () => {
    const user = userEvent.setup();
    mockApiHandler.getAdditionalCourses.mockResolvedValue([
      { id: 'course-1', name: 'Maths' },
      { id: 'course-2', name: 'Science' },
    ]);
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledWith(
        [expect.objectContaining({ id: 'course-1' })],
        currentStudent,
      );
    });
  });

  it('double select then submit calls addCourseForParentsStudent once', async () => {
    const user = userEvent.setup();
    render(<AddCourses />);
    const selectButton = await screen.findByTestId('select-course-button');
    await user.click(selectButton);
    await user.click(selectButton);
    await user.click(screen.getByTestId('next-button'));
    await waitFor(() => {
      expect(mockApiHandler.addCourseForParentsStudent).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  it('offline selected submit keeps loading false', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('offline selected submit keeps skeleton in loaded state', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      `false-${HOMEHEADERLIST.SUBJECTS}`,
    );
  });

  it('empty courses response keeps skeleton in loaded state', async () => {
    mockApiHandler.getAdditionalCourses.mockResolvedValue([]);
    render(<AddCourses />);
    await screen.findByText('No more subjects available to add');
    expect(screen.getByTestId('skeleton')).toHaveTextContent(
      `false-${HOMEHEADERLIST.SUBJECTS}`,
    );
  });

  it('missing student keeps loading true because fetch exits early', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('missing student does not render no-subject message while loading true', async () => {
    mockGetCurrentStudent.mockReturnValue(undefined);
    render(<AddCourses />);
    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith(PAGES.SELECT_MODE);
    });
    expect(
      screen.queryByText('No more subjects available to add'),
    ).not.toBeInTheDocument();
  });

  it('offline toast buttons include a single dismiss action', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(mockPresentToast).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: [expect.objectContaining({ text: 'Dismiss', role: 'cancel' })],
      }),
    );
  });

  it('offline selected submit does not navigate to SELECT_MODE', async () => {
    const user = userEvent.setup();
    mockOnline = false;
    render(<AddCourses />);
    await user.click(await screen.findByTestId('select-course-button'));
    await user.click(screen.getByTestId('next-button'));
    expect(mockHistory.replace).not.toHaveBeenCalledWith(PAGES.SELECT_MODE);
  });
});
