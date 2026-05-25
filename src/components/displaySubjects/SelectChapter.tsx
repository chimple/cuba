import { FC, useEffect, useRef, useState } from 'react';
import './SelectChapter.css';
import SelectIconImage from './SelectIconImage';
import DownloadLesson from '../DownloadChapterAndLesson';
import { useTranslation } from 'react-i18next';
import { COURSES, TableTypes } from '../../common/constants';

const SelectChapter: FC<{
  chapters: TableTypes<'chapter'>[];
  onChapterChange: (chapter: TableTypes<'chapter'>) => void;
  grades: TableTypes<'grade'>[];
  course: TableTypes<'course'>;
  currentGrade: TableTypes<'grade'>;
  onGradeChange: (grade: TableTypes<'grade'>) => void;
  currentChapterId: string | undefined;
}> = ({
  chapters,
  onChapterChange,
  grades,
  currentGrade,
  onGradeChange,
  course,
  currentChapterId,
}) => {
  const { t, i18n } = useTranslation();
  let currentChapterRef = useRef<any>(null);
  const [, setLanguageLoadVersion] = useState(0);
  const forcedLanguage =
    course?.code === COURSES.MATHS_HINDI
      ? 'hi'
      : course?.code === COURSES.MATHS_KANNADA
        ? 'kn'
        : undefined;

  useEffect(() => {
    currentChapterRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (forcedLanguage) {
      void i18n.loadLanguages(forcedLanguage).then(() => {
        setLanguageLoadVersion((version) => version + 1);
      });
    }
  }, [forcedLanguage, i18n]);

  return (
    <div>
      <div className="grade-container" />
      <div className="chapter-container-in-select-chapter-page">
        {chapters.map((chapter) => {
          return (
            <div
              ref={
                currentChapterId === chapter.id ? currentChapterRef : undefined
              }
              onClick={() => {
                onChapterChange(chapter);
              }}
              className="chapter-button"
              key={chapter.id}
            >
              <div className="chapter-icon-and-chapter-download-container">
                <div className="chapter-icon">
                  <SelectIconImage
                    localSrc={`courses/${course.code}/icons/${chapter.id}.webp`}
                    defaultSrc={'assets/icons/DefaultIcon.png'}
                    webSrc={chapter.image || 'assets/icons/DefaultIcon.png'}
                    imageWidth={'100%'}
                    imageHeight={'auto'}
                  />
                </div>
                <div className="selectchapter-title">
                  {course?.code === COURSES.ENGLISH ||
                  course?.code === COURSES.MATHS
                    ? chapter?.name
                    : course?.code === COURSES.MATHS_HINDI
                      ? t(chapter?.name ?? '', { lng: 'hi' })
                      : course?.code === COURSES.MATHS_KANNADA
                        ? t(chapter?.name ?? '', { lng: 'kn' })
                        : t(chapter?.name ?? '')}
                </div>
                <div className="chapter-download">
                  <DownloadLesson chapter={chapter} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SelectChapter;
