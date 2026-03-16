import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { ServiceConfig } from '../../services/ServiceConfig';
import Header from '../components/homePage/Header';
import { t } from 'i18next';
import './LessonDetails.css';
import SelectIcon from '../components/SelectIcon';
import SelectIconImage from '../../components/displaySubjects/SelectIconImage';
import {
  AssignmentSource,
  COCOS,
  CONTINUE,
  CocosCourseIdentifier,
  LIDO,
  LIVE_QUIZ,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { Util } from '../../utility/util';
import AssigmentCount from '../components/library/AssignmentCount';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useOnlineOfflineErrorMessageHandler } from '../../common/onlineOfflineErrorMessageHandler';
import logger from '../../utility/logger';
interface LessonDetailsProps {}
type LessonDetailsState = {
  course?: TableTypes<'course'>;
  lesson?: TableTypes<'lesson'>;
  fromCocos?: boolean;
  chapterId?: string;
  selectedLesson?: Map<string, string> | Array<[string, string]>;
  chapterName?: string;
  gradeName?: string;
  from?: string;
};
const LessonDetails: React.FC<LessonDetailsProps> = ({}) => {
  const currentSchool = Util.getCurrentSchool();
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const state = (history.location.state ?? {}) as LessonDetailsState;
  const course: TableTypes<'course'> | undefined = state.course;
  const lesson: TableTypes<'lesson'> = state.lesson as TableTypes<'lesson'>;
  const fromCocos: boolean = Boolean(state.fromCocos);
  const [chapterId, setChapterId] = useState(state.chapterId ?? '');
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const current_class = Util.getCurrentClass();
  const selectedLesson = state.selectedLesson;
  const chapterName = state.chapterName;
  const gradeName = state.gradeName;
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'> | null>(
    null,
  );
  const [subjectName, setSubjectName] = useState<string>(course?.name ?? '');
  const [selectedLessonMap, setSelectedLessonMap] = useState<
    Map<string, string>
  >(new Map(selectedLesson ?? []));

  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, Partial<Record<AssignmentSource, string[]>>>
  >(new Map());

  const syncSelectedLesson = async (lesson: string): Promise<void> => {
    var current_user = await auth.getCurrentUser();
    if (current_user?.id)
      await api.createOrUpdateAssignmentCart(current_user?.id, lesson);
  };
  const COURSE_VALUES_SET = new Set(
    (Object.values(CocosCourseIdentifier) as string[]).map((v) =>
      v.toLowerCase(),
    ),
  );
  const getCourseIdFromCocosLesson = (
    rawLessonId: string | null,
    subjectCode: string | null,
  ): string | null => {
    if (!rawLessonId) {
      return subjectCode;
    }
    const parts = rawLessonId
      .trim()
      .toLowerCase()
      .split(/[^a-z]+/);
    for (const part of parts) {
      if (COURSE_VALUES_SET.has(part)) {
        return part;
      }
    }
    return subjectCode;
  };
  const onPlayClick = async () => {
    // const baseUrl = "https://chimple.cc/microlink/";
    // const queryParams = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
    // const urlToOpen = `${baseUrl}${queryParams}`;

    // try {
    //   await Browser.open({ url: urlToOpen });
    // } catch (error) {
    //   logger.error("Error opening in-app browser:", error);
    //   window.open(urlToOpen, '_blank');
    // }
    if (lesson.plugin_type === COCOS) {
      const courseId = getCourseIdFromCocosLesson(
        lesson.cocos_lesson_id,
        lesson.cocos_subject_code,
      );
      const parmas = `?courseid=${courseId}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      setTimeout(() => {
        Util.launchCocosGame();
      }, 1000);
      history.push(PAGES.GAME + parmas, {
        url: 'chimple-lib/index.html' + parmas,
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course?.id,
        course: JSON.stringify(course),
        lesson: JSON.stringify(lesson),
        chapterId: chapterId,
        selectedLesson: selectedLessonMap,
        from: history.location.pathname + `?${CONTINUE}=true`,
      });
    } else if (
      // !!assignment?.id &&
      lesson.plugin_type === LIVE_QUIZ
    ) {
      if (!online) {
        presentToast({
          message: t(`Device is offline`),
          color: 'danger',
          duration: 3000,
          position: 'bottom',
          buttons: [
            {
              text: 'Dismiss',
              role: 'cancel',
            },
          ],
        });
        return;
      }
      history.push(
        PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
        {
          courseId: course?.id,
          lesson: JSON.stringify(lesson),
          selectedLesson: selectedLessonMap,
          from: history.location.pathname + `?${CONTINUE}=true`,
        },
      );
    } else if (lesson.plugin_type === LIDO) {
      const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      history.push(PAGES.LIDO_PLAYER + parmas, {
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course?.id,
        course: JSON.stringify(course!),
        lesson: JSON.stringify(lesson),
        selectedLesson: selectedLessonMap,
        from: history.location.pathname + `?${CONTINUE}=true`,
      });
    }
  };
  useEffect(() => {
    const sync_lesson_data = selectedLessonMap.get(current_class?.id ?? '');
    const parsed = sync_lesson_data ? JSON.parse(sync_lesson_data) : {};
    const class_sync_lesson: Map<
      string,
      Partial<Record<AssignmentSource, string[]>>
    > = new Map();
    Object.entries(parsed).forEach(([chapterId, value]) => {
      if (Array.isArray(value)) {
        // Old format: convert to new format
        class_sync_lesson.set(chapterId, {
          [AssignmentSource.MANUAL]: [...value],
        });
      } else if (typeof value === 'object' && value !== null) {
        const sourceValue = value as Record<string, string[]>;
        const normalizedValue: Partial<Record<AssignmentSource, string[]>> = {};
        const manual = sourceValue[AssignmentSource.MANUAL];
        const qr = sourceValue[AssignmentSource.QR_CODE];
        if (Array.isArray(manual)) {
          normalizedValue[AssignmentSource.MANUAL] = manual;
        }
        if (Array.isArray(qr)) {
          normalizedValue[AssignmentSource.QR_CODE] = qr;
        }
        class_sync_lesson.set(chapterId, normalizedValue);
      }
    });
    setClassSelectedLesson(class_sync_lesson);
  }, []);
  useEffect(() => {
    let _assignmentLength = 0;
    for (const value of classSelectedLesson.values()) {
      const manual = value[AssignmentSource.MANUAL] || [];
      const qr = value[AssignmentSource.QR_CODE] || [];
      _assignmentLength += manual.length + qr.length;
    }
    setAssignmentCount(_assignmentLength);
    init();
  }, [classSelectedLesson]);

  const init = async () => {
    if (fromCocos) {
      if (Capacitor.isNativePlatform()) {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      }
      setTimeout(() => {
        Util.killCocosGame();
      }, 1000);
    }

    const current_class = Util.getCurrentClass();
    setCurrentClass(current_class ?? null);
    if (!chapterId && current_class) {
      const fetched = await api.getChapterByLesson(lesson.id, current_class.id);
      if (typeof fetched === 'string') {
        setChapterId(fetched);
      }
    }
    if (!course?.name) {
      try {
        const subjectId = lesson?.subject_id;
        if (subjectId) {
          const subject = await api.getSubject(subjectId);
          if (subject?.name) {
            setSubjectName(subject.name);
          }
        }
      } catch (err) {
        logger.error('Failed to fetch subject', err);
      }
    } else {
      setSubjectName(course.name);
    }
  };

  const handleButtonClick = () => {
    const classId = current_class?.id ?? '';
    const tmpselectedLesson = new Map(selectedLessonMap);

    const prevDataStr = tmpselectedLesson.get(classId) ?? '{}';
    const parsed = JSON.parse(prevDataStr);

    let updatedChapterData: Record<string, any> = parsed[chapterId] ?? {};

    // Handle old format fallback
    if (Array.isArray(updatedChapterData)) {
      updatedChapterData = { manual: [...updatedChapterData] };
    }

    // Get both manual and qr_code arrays
    const manualArr = updatedChapterData[AssignmentSource.MANUAL] ?? [];
    const qrArr = updatedChapterData[AssignmentSource.QR_CODE] ?? [];
    const isSelected =
      manualArr.includes(lesson.id) || qrArr.includes(lesson.id);

    if (isSelected) {
      // Remove from both manual and qr_code
      updatedChapterData[AssignmentSource.MANUAL] = manualArr.filter(
        (id: string) => id !== lesson.id,
      );
      updatedChapterData[AssignmentSource.QR_CODE] = qrArr.filter(
        (id: string) => id !== lesson.id,
      );
    } else {
      // Add to manual
      updatedChapterData[AssignmentSource.MANUAL] = [...manualArr, lesson.id];
    }

    // Update the chapter data in main object
    parsed[chapterId] = updatedChapterData;

    // Convert to map for state update
    const updatedClassSelectedLesson = new Map(classSelectedLesson);
    updatedClassSelectedLesson.set(chapterId, updatedChapterData);
    setClassSelectedLesson(updatedClassSelectedLesson);

    // Serialize and store
    tmpselectedLesson.set(classId, JSON.stringify(parsed));
    setSelectedLessonMap(tmpselectedLesson);

    const totalSelectedLesson = JSON.stringify(
      Object.fromEntries(tmpselectedLesson),
    );
    syncSelectedLesson(totalSelectedLesson);
  };
  return (
    <div id="lesson-details-root" className="lesson-details-root">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          course
            ? history.replace(state.from || PAGES.SEARCH_LESSON, {
                course: course,
                chapterId: chapterId,
              })
            : history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        }}
        showSideMenu={false}
        customText={t('Learning Outcome') ?? 'Learning Outcome'}
      />

      <div id="lesson-details-body" className="lesson-details-body">
        <div id="lesson-details-wrap" className="lesson-details-wrap">
          <div id="lesson-details-top" className="lesson-details-top">
            <div id="lesson-details-left" className="lesson-details-left">
              <div
                id="lesson-details-thumb"
                className="lesson-details-thumb"
                onClick={onPlayClick}
              >
                <div id="lesson-details-play" className="lesson-details-play">
                  <div
                    id="lesson-details-play-text"
                    className="lesson-details-play-text"
                  >
                    {t('Click to play')}
                  </div>
                  <img src="assets/icons/lessonplayEye.svg" alt="View_lesson" />
                </div>

                <SelectIconImage
                  localSrc={''}
                  defaultSrc={'assets/icons/DefaultIcon.png'}
                  webSrc={`${lesson.image}`}
                />
              </div>

              <div id="lesson-details-btn" className="lesson-details-btn">
                <SelectIcon
                  isSelected={[
                    ...(classSelectedLesson.get(chapterId)?.[
                      AssignmentSource.MANUAL
                    ] ?? []),
                    ...(classSelectedLesson.get(chapterId)?.[
                      AssignmentSource.QR_CODE
                    ] ?? []),
                  ].includes(lesson.id)}
                  onClick={handleButtonClick}
                />
              </div>
            </div>

            <div id="lesson-details-right" className="lesson-details-right">
              <div id="lesson-details-grade" className="lesson-details-meta">
                <strong>{gradeName ?? ''}</strong>
              </div>

              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-name-id"
              >
                <span className="lesson-details-label">
                  <strong>{t('Lesson')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">{lesson?.name}</span>
              </div>
              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-chapter"
              >
                <span className="lesson-details-label">
                  <strong>{t('Chapter')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">
                  {chapterName ?? ''}
                </span>
              </div>
              <div
                className="lesson-details-meta lesson-details-row"
                id="lesson-details-subject"
              >
                <span className="lesson-details-label">
                  <strong>{t('Subject')}</strong>
                </span>
                <span className="lesson-details-separator">:</span>
                <span className="lesson-details-value">{subjectName}</span>
              </div>

              <div
                className="lesson-details-meta"
                id="lesson-details-assignment"
              >
                <strong>
                  {lesson.plugin_type === LIVE_QUIZ
                    ? t('Quiz')
                    : t('Assignment')}
                </strong>
                <img
                  src="assets/icons/bulb.svg"
                  alt="bulb_image"
                  className="lesson-details-bulb"
                />
              </div>
            </div>
          </div>

          <div id="lesson-details-outcome" className="lesson-details-outcome">
            <div
              id="lesson-details-outcome-title"
              className="lesson-details-outcome-title"
            >
              {t('Learning Outcome')} :
            </div>

            <div
              id="lesson-details-outcome-desc"
              className="lesson-details-outcome-desc"
            >
              {lesson.outcome}
            </div>
          </div>
        </div>
      </div>

      <AssigmentCount
        assignments={assignmentCount}
        onClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
        }}
      />
    </div>
  );
};

export default LessonDetails;
