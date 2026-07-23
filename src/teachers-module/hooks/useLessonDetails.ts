import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { ServiceConfig } from '../../services/ServiceConfig';
import Header from '../components/homePage/Header';
import { t } from 'i18next';
import SelectIcon from '../components/SelectIcon';
import SelectIconImage from '../../components/displaySubjects/SelectIconImage';
import {
  AssignmentSource,
  CONTINUE,
  LIVE_QUIZ,
  PAGES,
  SOURCE,
  TableTypes,
} from '../../common/constants';
import { Util } from '../../utility/util';
import AssigmentCount from '../components/library/AssignmentCount';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useOnlineOfflineErrorMessageHandler } from '../../common/onlineOfflineErrorMessageHandler';
import logger from '../../utility/logger';
import { parsePath } from 'history';

interface LessonDetailsProps {}
type LessonDetailsState = {
  course?: TableTypes<'course'>;
  lesson?: TableTypes<'lesson'>;
  fromLido?: boolean;
  fromLiveQuiz?: boolean;
  chapterId?: string;
  selectedLesson?: Map<string, string> | Array<[string, string]>;
  chapterName?: string;
  gradeName?: string;
  from?: string;
};
export const useLessonDetails = ({}: LessonDetailsProps) => {
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const state = (history.location.state ?? {}) as LessonDetailsState;
  const course: TableTypes<'course'> | undefined = state.course;
  const lesson: TableTypes<'lesson'> = state.lesson as TableTypes<'lesson'>;
  const fromLido: boolean = Boolean(state.fromLido);
  const fromLiveQuiz: boolean = Boolean(state.fromLiveQuiz);
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
  const lessonDetailsReturnState: LessonDetailsState = {
    course,
    lesson,
    chapterId,
    selectedLesson: Array.from(selectedLessonMap.entries()),
    chapterName,
    gradeName,
    from: state.from,
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
    if (lesson.plugin_type === LIVE_QUIZ) {
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
      history.push({
        ...parsePath(
          PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
        ),
        state: {
          courseId: course?.id,
          lesson: JSON.stringify(lesson),
          selectedLesson: selectedLessonMap,
          from: history.location.pathname + `?${CONTINUE}=true`,
          returnState: lessonDetailsReturnState,
          source: SOURCE.TEACHER_MODE,
        },
      });
    } else {
      const playableLessonId = Util.getLessonBundleId(lesson);
      if (!playableLessonId) {
        return;
      }
      const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
      history.push({
        ...parsePath(PAGES.LIDO_PLAYER + parmas),
        state: {
          lessonId: playableLessonId,
          courseDocId: course?.id,
          course: JSON.stringify(course!),
          lesson: JSON.stringify(lesson),
          selectedLesson: selectedLessonMap,
          from: history.location.pathname + `?${CONTINUE}=true`,
          returnState: lessonDetailsReturnState,
          source: SOURCE.TEACHER_MODE,
        },
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
    if (Capacitor.isNativePlatform() && (fromLido || fromLiveQuiz)) {
      await ScreenOrientation.lock({ orientation: 'portrait' });
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
  return {
    AssigmentCount,
    AssignmentSource,
    Header,
    LIVE_QUIZ,
    PAGES,
    SelectIcon,
    SelectIconImage,
    assignmentCount,
    chapterId,
    chapterName,
    classSelectedLesson,
    course,
    gradeName,
    handleButtonClick,
    history,
    lesson,
    onPlayClick,
    parsePath,
    state,
    subjectName,
    t,
  };
};
