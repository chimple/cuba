import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import LessonSlider from './LessonSlider';
import { ServiceConfig } from '../services/ServiceConfig';

const mockGetCurrentStudent = jest.fn();
const mockGo = jest.fn();
const mockLessonSplidePropsSpy = jest.fn();
const mockSlideOnLoadSpy = jest.fn();

type MockSplideSlideProps = {
  children: React.ReactNode;
  onLoad?: () => void;
};

const getLatestSplideProps = () =>
  mockLessonSplidePropsSpy.mock.calls[
    mockLessonSplidePropsSpy.mock.calls.length - 1
  ][0];

const getLatestSlideOnLoad = () =>
  mockSlideOnLoadSpy.mock.calls[mockSlideOnLoadSpy.mock.calls.length - 1][0];

jest.mock('../utility/util', () => ({
  Util: {
    getCurrentStudent: () => mockGetCurrentStudent(),
  },
}));

jest.mock('./LessonCard', () => ({
  __esModule: true,
  default: ({ lesson, isPlayed }: any) => (
    <div
      data-testid={`lesson-card-${lesson.id}`}
      data-played={String(isPlayed)}
    >
      <span data-testid="lesson-card-name">{lesson.name}</span>
    </div>
  ),
}));

jest.mock('@splidejs/react-splide', () => {
  const React = require('react');
  return {
    Splide: React.forwardRef(
      (
        { children, onMoved, options }: any,
        ref: React.Ref<{ go: (index: number) => void }>,
      ) => {
        mockLessonSplidePropsSpy({ onMoved, options });
        React.useImperativeHandle(ref, () => ({ go: mockGo }));
        return <div data-testid="splide-root">{children}</div>;
      },
    ),
    SplideSlide: ({ children, onLoad }: MockSplideSlideProps) => {
      mockSlideOnLoadSpy(onLoad);
      return <div data-testid="splide-slide">{children}</div>;
    },
  };
});

describe('LessonSlider', () => {
  const student = { id: 'student-1' } as any;
  const course = { id: 'course-1', name: 'Math' } as any;
  const lessons = [
    { id: 'lesson-1', name: 'L1' },
    { id: 'lesson-2', name: 'L2' },
    { id: 'lesson-3', name: 'L3' },
  ] as any;

  const mockApiHandler = {
    getFavouriteLessons: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockGetCurrentStudent.mockReturnValue(student);
    mockApiHandler.getFavouriteLessons.mockResolvedValue([{ id: 'lesson-2' }]);

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);
  });

  it('slides to start index when slide loads', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={2}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getFavouriteLessons).toHaveBeenCalledWith(
        student.id,
      );
    });

    await act(async () => {
      getLatestSlideOnLoad()?.();
    });

    expect(mockGo).toHaveBeenCalledWith(2);
  });

  it('does not call go when start index is zero', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await act(async () => {
      getLatestSlideOnLoad()?.();
    });

    expect(mockGo).not.toHaveBeenCalled();
  });

  it('does not reset to the start index after the user moves the slider', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={2}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: 1 });
      getLatestSlideOnLoad()?.();
    });

    expect(mockGo).not.toHaveBeenCalled();
  });

  it('saves the current slide index for the chapter', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        chapterId="chapter-1"
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: 1 });
    });

    expect(
      sessionStorage.getItem('cuba:lesson-slider-position:chapter-1'),
    ).toBe('1');
  });

  it('restores the saved slide index on remount', async () => {
    const first = render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        chapterId="chapter-1"
        showSubjectName={false}
        showChapterName={false}
      />,
    );
    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: 1 });
    });
    first.unmount();

    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={2}
        chapterId="chapter-1"
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await act(async () => {
      getLatestSlideOnLoad()?.();
    });
    expect(mockGo).toHaveBeenCalledWith(1);
  });

  it('keeps slide positions separate for different chapters', async () => {
    const first = render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        chapterId="chapter-1"
        showSubjectName={false}
        showChapterName={false}
      />,
    );
    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: 1 });
    });
    first.unmount();

    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={2}
        chapterId="chapter-2"
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    const props =
      mockLessonSplidePropsSpy.mock.calls[
        mockLessonSplidePropsSpy.mock.calls.length - 1
      ][0];
    expect(
      sessionStorage.getItem('cuba:lesson-slider-position:chapter-1'),
    ).toBe('1');
    expect(
      sessionStorage.getItem('cuba:lesson-slider-position:chapter-2'),
    ).toBeNull();
    expect(props.options.start).toBeUndefined();
  });

  it('calls onEndReached when moved to last slide', async () => {
    const onEndReached = jest.fn();

    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
        onEndReached={onEndReached}
      />,
    );

    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: lessons.length - 1 });
    });

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('does not call onEndReached when moved before last slide', async () => {
    const onEndReached = jest.fn();

    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
        onEndReached={onEndReached}
      />,
    );

    await act(async () => {
      getLatestSplideProps().onMoved?.({ index: 1 });
    });

    expect(onEndReached).not.toHaveBeenCalled();
  });

  it('uses consistent splide behavior in home and non-home modes', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={false}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await waitFor(() => {
      expect(mockLessonSplidePropsSpy).toHaveBeenCalledTimes(2);
    });

    const firstCall = mockLessonSplidePropsSpy.mock.calls[0][0];
    const secondCall = mockLessonSplidePropsSpy.mock.calls[1][0];
    const firstOnMoved = firstCall.onMoved;
    const secondOnMoved = secondCall.onMoved;
    expect(typeof firstOnMoved).toBe('function');
    expect(typeof secondOnMoved).toBe('function');
    expect(firstCall.options).toEqual(secondCall.options);
    expect(firstCall.options).toEqual({
      arrows: false,
      wheel: true,
      lazyLoad: true,
      direction: 'ltr',
      pagination: false,
    });
  });

  it('keeps lesson slide text and data order consistent', async () => {
    render(
      <LessonSlider
        lessonData={lessons}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getFavouriteLessons).toHaveBeenCalledWith(
        student.id,
      );
    });

    const renderedNames = screen
      .getAllByTestId('lesson-card-name')
      .map((node) => node.textContent);

    expect(renderedNames).toEqual(['L1', 'L2', 'L3']);
    expect(screen.getAllByTestId('splide-slide')).toHaveLength(3);
  });

  it('renders long lesson text value fully inside slide card', async () => {
    const longName =
      'Very Long Lesson Name Used To Validate Text And Data Consistency';

    render(
      <LessonSlider
        lessonData={[{ id: 'lesson-long', name: longName }] as any}
        course={course}
        isHome={true}
        lessonsScoreMap={{}}
        startIndex={0}
        showSubjectName={false}
        showChapterName={false}
      />,
    );

    await waitFor(() => {
      expect(mockApiHandler.getFavouriteLessons).toHaveBeenCalledWith(
        student.id,
      );
    });

    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getAllByTestId('splide-slide')).toHaveLength(1);
  });

  it('keeps lesson slider scroll and slide style contracts', () => {
    const sliderCss = fs.readFileSync(
      path.join(process.cwd(), 'src/components/LessonSlider.css'),
      'utf8',
    );
    const cardCss = fs.readFileSync(
      path.join(process.cwd(), 'src/components/LessonCard.css'),
      'utf8',
    );

    expect(sliderCss).toMatch(
      /\.Lesson-slider-content\s*\{[\s\S]*overflow:\s*hidden scroll;/,
    );
    expect(sliderCss).toMatch(
      /\.Lesson-slider-content::-webkit-scrollbar\s*\{[\s\S]*display:\s*none;/,
    );
    expect(sliderCss).toMatch(/\.slide\s*\{[\s\S]*max-width:\s*fit-content;/);

    expect(cardCss).toMatch(/#lesson-card-name\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(cardCss).toMatch(
      /#lesson-card-name\s*\{[\s\S]*text-overflow:\s*ellipsis;/,
    );
    expect(cardCss).toMatch(
      /#lesson-card-name\s*\{[\s\S]*white-space:\s*nowrap;/,
    );

    expect(cardCss).toMatch(/#chapter-title\s*\{[\s\S]*overflow:\s*hidden;/);
    expect(cardCss).toMatch(
      /#chapter-title\s*\{[\s\S]*text-overflow:\s*ellipsis;/,
    );
    expect(cardCss).toMatch(/#chapter-title\s*\{[\s\S]*white-space:\s*nowrap;/);
  });
});
