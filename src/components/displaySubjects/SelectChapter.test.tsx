import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import SelectChapter from './SelectChapter';

const scrollIntoViewMock = jest.fn();

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('./SelectIconImage', () => ({
  __esModule: true,
  default: () => <div data-testid="chapter-icon" />,
}));

jest.mock('../DownloadChapterAndLesson', () => ({
  __esModule: true,
  default: ({ chapter }: any) => (
    <button
      type="button"
      data-testid={`download-${chapter.id}`}
      onClick={(event) => event.stopPropagation()}
    >
      download
    </button>
  ),
}));

describe('SelectChapter', () => {
  const chapters = [
    { id: 'chapter-1', name: 'Numbers' },
    { id: 'chapter-2', name: 'Reading' },
  ] as any;

  const course = { id: 'course-1', code: 'maths' } as any;
  const grade = { id: 'g1', name: 'Grade 1' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (HTMLElement.prototype as any).scrollIntoView = scrollIntoViewMock;
  });

  it('scrolls current chapter into view on mount', () => {
    render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={jest.fn()}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId="chapter-2"
      />,
    );

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('does not call scrollIntoView when no current chapter id is provided', () => {
    render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={jest.fn()}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('calls onChapterChange when chapter card is clicked', async () => {
    const user = userEvent.setup();
    const onChapterChange = jest.fn();

    const view = render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={onChapterChange}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    await user.click(view.getByText('Numbers'));

    expect(onChapterChange).toHaveBeenCalledWith(chapters[0]);
  });

  it('renders chapter download button for each chapter', () => {
    const view = render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={jest.fn()}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    expect(view.getByTestId('download-chapter-1')).toBeInTheDocument();
    expect(view.getByTestId('download-chapter-2')).toBeInTheDocument();
  });

  it('download button click does not trigger chapter selection', async () => {
    const user = userEvent.setup();
    const onChapterChange = jest.fn();
    const view = render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={onChapterChange}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    await user.click(view.getByTestId('download-chapter-1'));
    expect(onChapterChange).not.toHaveBeenCalled();
  });

  it('keeps chapter text order and count consistent with incoming data', () => {
    const view = render(
      <SelectChapter
        chapters={chapters}
        onChapterChange={jest.fn()}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    const chapterButtons = Array.from(
      view.container.querySelectorAll('.chapter-button'),
    ) as HTMLElement[];
    expect(chapterButtons).toHaveLength(chapters.length);

    const firstChapter = view.getByText('Numbers');
    const secondChapter = view.getByText('Reading');
    const isInOrder =
      (firstChapter.compareDocumentPosition(secondChapter) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
      0;

    expect(isInOrder).toBe(true);
  });

  it('renders long chapter name text inside chapter label area', () => {
    const longChapterName =
      'Very Long Chapter Name That Should Be Truncated But Accessible';
    const view = render(
      <SelectChapter
        chapters={[{ ...chapters[0], name: longChapterName }]}
        onChapterChange={jest.fn()}
        grades={[grade]}
        course={course}
        currentGrade={grade}
        onGradeChange={jest.fn()}
        currentChapterId={undefined}
      />,
    );

    const chapterLabel = view.getByText(longChapterName);
    expect(chapterLabel).toBeInTheDocument();
    expect(
      chapterLabel.closest('.chapter-icon-and-chapter-download-container'),
    ).toBeTruthy();
  });

  it('keeps chapter layout and text overflow contracts', () => {
    const css = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/components/displaySubjects/SelectChapter.css',
      ),
      'utf8',
    );

    expect(css).toMatch(
      /\.chapter-container-in-select-chapter-page\s*\{[\s\S]*display:\s*grid;/,
    );
    expect(css).toMatch(
      /\.chapter-container-in-select-chapter-page\s*\{[\s\S]*grid-template-columns:\s*repeat\(/,
    );
    expect(css).toMatch(/\.chapter-button\s*\{[\s\S]*white-space:\s*nowrap;/);
    expect(css).toMatch(/\.chapter-button\s*\{[\s\S]*text-align:\s*center;/);
  });
});
