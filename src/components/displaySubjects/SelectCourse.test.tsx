import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import SelectCourse from './SelectCourse';
import { ServiceConfig } from '../../services/ServiceConfig';
import { PAGES } from '../../common/constants';

const mockHistory = { push: jest.fn() };
const mockSplidePropsSpy = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => mockHistory,
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@splidejs/react-splide', () => ({
  Splide: ({ children, ...props }: any) => {
    mockSplidePropsSpy(props);
    return <div data-testid="splide-root">{children}</div>;
  },
  SplideSlide: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('./SelectIconImage', () => ({
  __esModule: true,
  default: () => <div data-testid="select-icon-image" />,
}));

describe('SelectCourse', () => {
  const grade1 = { id: 'g1', name: 'Grade 1' } as any;
  const grade2 = { id: 'g2', name: 'Grade 2' } as any;
  const curriculum1 = { id: 'cur-1', name: 'NCERT' } as any;

  const course1 = {
    id: 'course-1',
    name: 'Math',
    grade_id: 'g1',
    curriculum_id: 'cur-1',
    code: 'maths',
    sort_index: 2,
  } as any;

  const course2 = {
    id: 'course-2',
    name: 'English',
    grade_id: 'g2',
    curriculum_id: 'cur-1',
    code: 'en',
    sort_index: 1,
  } as any;

  const mockApiHandler = {
    getGradeById: jest.fn(),
    getCurriculumById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApiHandler.getGradeById.mockImplementation(async (gradeId: string) =>
      gradeId === 'g1' ? grade1 : grade2,
    );
    mockApiHandler.getCurriculumById.mockResolvedValue(curriculum1);

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it('wires slider options for subjects carousel', async () => {
    render(
      <SelectCourse
        courses={[course1, course2]}
        modeParent={true}
        onCourseChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockSplidePropsSpy).toHaveBeenCalled();
    });

    const props =
      mockSplidePropsSpy.mock.calls[
        mockSplidePropsSpy.mock.calls.length - 1
      ][0];
    expect(props.options).toEqual({
      arrows: false,
      wheel: true,
      lazyLoad: true,
      direction: 'ltr',
      pagination: false,
    });
    expect(props.hasTrack).toBe(true);
  });

  it('shows Add Subject button for parent mode and navigates to add-subjects', async () => {
    const user = userEvent.setup();
    render(
      <SelectCourse
        courses={[course1, course2]}
        modeParent={true}
        onCourseChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    });

    const addSubjectText = await screen.findByText('Add Subject');
    const addSubject = addSubjectText.closest(
      '.subject-button',
    ) as HTMLElement | null;
    expect(addSubject).toBeTruthy();

    await user.click(addSubject!);
    expect(mockHistory.push).toHaveBeenCalledWith(PAGES.ADD_SUBJECTS);
  });

  it('does not show Add Subject button for non-parent mode', async () => {
    render(
      <SelectCourse
        courses={[course1, course2]}
        modeParent={false}
        onCourseChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByText('Add Subject')).not.toBeInTheDocument();
  });

  it('triggers onCourseChange when a course is clicked', async () => {
    const user = userEvent.setup();
    const onCourseChange = jest.fn();

    render(
      <SelectCourse
        courses={[course1, course2]}
        modeParent={true}
        onCourseChange={onCourseChange}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    });

    let firstCourse: HTMLElement | null = null;
    await waitFor(() => {
      firstCourse = document.querySelector(
        '[data-testid="splide-root"] .subject-button',
      ) as HTMLElement | null;
      expect(firstCourse).toBeTruthy();
    });

    await user.click(firstCourse!);

    expect(onCourseChange).toHaveBeenCalled();
  });

  it('renders slides in sorted order by sort_index', async () => {
    render(
      <SelectCourse
        courses={[course1, course2]}
        modeParent={false}
        onCourseChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    });

    let buttons: HTMLElement[] = [];
    await waitFor(() => {
      buttons = Array.from(
        document.querySelectorAll('.subject-button'),
      ) as HTMLElement[];
      expect(buttons.length).toBe(2);
    });
    expect(buttons[0].textContent).toContain('English');
    expect(buttons[1].textContent).toContain('Math');
  });

  it('keeps subject slide text and data mapping consistent', async () => {
    const curriculum2 = { id: 'cur-2', name: 'CBSE' } as any;
    const course2WithCurriculum = {
      ...course2,
      curriculum_id: 'cur-2',
    } as any;

    mockApiHandler.getCurriculumById.mockImplementation(async (id: string) =>
      id === 'cur-1' ? curriculum1 : curriculum2,
    );

    render(
      <SelectCourse
        courses={[course1, course2WithCurriculum]}
        modeParent={true}
        onCourseChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getGradeById).toHaveBeenCalledTimes(2);
    });

    let buttons: HTMLElement[] = [];
    await waitFor(() => {
      buttons = Array.from(
        document.querySelectorAll(
          '[data-testid="splide-root"] .subject-button',
        ),
      ) as HTMLElement[];
      expect(buttons).toHaveLength(3);
    });

    const mappedSlides = buttons.slice(0, 2).map((button) => ({
      title: button.querySelector('.course-title')?.textContent?.trim(),
      grade: button
        .querySelector('#subject-card-subject-name p')
        ?.textContent?.trim(),
      curriculum: button
        .querySelector('.course-curriculum')
        ?.textContent?.trim(),
    }));

    expect(mappedSlides).toEqual([
      { title: 'English', grade: 'Grade 2', curriculum: 'CBSE' },
      { title: 'Math', grade: 'Grade 1', curriculum: 'NCERT' },
    ]);
  });

  it('renders long course metadata text inside dedicated display containers', async () => {
    const longCourse = {
      ...course1,
      id: 'course-long',
      name: 'Very Long Course Name That Should Be Truncated On Card',
      sort_index: 1,
    } as any;
    const longCurriculum = {
      ...curriculum1,
      name: 'Very Long Curriculum Name For Overflow Safety',
    } as any;
    mockApiHandler.getCurriculumById.mockResolvedValue(longCurriculum);

    render(
      <SelectCourse
        courses={[longCourse]}
        modeParent={false}
        onCourseChange={jest.fn()}
      />,
    );

    expect(
      await screen.findByText(longCourse.name, { selector: '.course-title' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(longCurriculum.name, {
        selector: '.course-curriculum',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText(grade1.name)).toBeInTheDocument();
  });

  it('keeps curriculum text overflow-safe in subject cards', () => {
    const css = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/components/displaySubjects/SelectCourse.css',
      ),
      'utf8',
    );

    expect(css).toMatch(/\.course-curriculum\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(css).toMatch(
      /\.course-curriculum\s*\{[\s\S]*text-overflow:\s*ellipsis;/,
    );
  });

  it('uses same slide width contract for subject cards', () => {
    const css = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/components/displaySubjects/SelectCourse.css',
      ),
      'utf8',
    );

    expect(css).toMatch(/\.slide\s*\{[\s\S]*max-width:\s*fit-content;/);
  });
});
