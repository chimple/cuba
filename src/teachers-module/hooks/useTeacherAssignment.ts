import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Toast } from '@capacitor/toast';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { parsePath } from 'history';
import {
  AssignmentSource,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import { t } from 'i18next';

export enum TeacherAssignmentPageType {
  MANUAL = 'manual',
  RECOMMENDED = 'recommended',
}

export type AssignmentLesson = TableTypes<'lesson'> & {
  selected?: boolean;
  source?: string;
};

type SelectedSubjectCount = {
  count: string[];
};

type SelectedLessonsByType = {
  count: number;
} & Record<string, SelectedSubjectCount | number>;

export type SelectedLessonsCountState = Record<
  TeacherAssignmentPageType,
  SelectedLessonsByType
>;

type UseTeacherAssignmentParams = {
  autoStartScan?: boolean;
  onScanHandled?: () => void;
  onUnavailableQr: () => void;
};

export function useTeacherAssignment({
  autoStartScan,
  onScanHandled,
  onUnavailableQr,
}: UseTeacherAssignmentParams) {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;

  const [manualAssignments, setManualAssignments] = useState<any>({});
  const [recommendedAssignments, setRecommendedAssignments] = useState<any>({});
  const [currentUser, setCurrentuser] = useState<TableTypes<'user'> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [recommendedCollapsed, setRecommendedCollapsed] = useState(true);
  const [selectedLessonsCount, setSelectedLessonsCount] =
    useState<SelectedLessonsCountState>({
      [TeacherAssignmentPageType.MANUAL]: { count: 0 },
      [TeacherAssignmentPageType.RECOMMENDED]: { count: 0 },
    });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (autoStartScan) {
      startScan();
      onScanHandled?.();
    }
  }, [autoStartScan]);

  const init = async () => {
    let tempLessons: any = {};
    const current_class = await Util.getCurrentClass();
    const currUser = await auth.getCurrentUser();
    setCurrentuser(currUser as TableTypes<'user'>);
    if (!current_class || !current_class.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
    const courseList = await api.getCoursesForClassStudent(current_class.id);

    const previous_sync_lesson = currUser?.id
      ? await api.getUserAssignmentCart(currUser?.id)
      : null;

    if (previous_sync_lesson?.lessons) {
      const all_sync_lesson: Map<string, string> = new Map(
        Object.entries(JSON.parse(previous_sync_lesson.lessons)),
      );

      const sync_lesson_data = all_sync_lesson.get(current_class.id);
      const parsed_chapter_data = sync_lesson_data
        ? JSON.parse(sync_lesson_data)
        : {};

      const sync_lesson: Map<string, any> = new Map(
        Object.entries(parsed_chapter_data),
      );

      for (const [chapterId, sourceMapOrArray] of sync_lesson.entries()) {
        const allLessonIdsSet = new Set<string>();

        if (Array.isArray(sourceMapOrArray)) {
          sourceMapOrArray.forEach((id: string) => allLessonIdsSet.add(id));
        } else if (
          typeof sourceMapOrArray === 'object' &&
          sourceMapOrArray !== null
        ) {
          if (sourceMapOrArray[AssignmentSource.MANUAL]) {
            sourceMapOrArray[AssignmentSource.MANUAL].forEach((id: string) =>
              allLessonIdsSet.add(id),
            );
          }
          if (sourceMapOrArray[AssignmentSource.QR_CODE]) {
            sourceMapOrArray[AssignmentSource.QR_CODE].forEach((id: string) =>
              allLessonIdsSet.add(id),
            );
          }
        }

        for (const lessonId of allLessonIdsSet) {
          const l: {
            lesson: any[];
            course: TableTypes<'course'>[];
          } = await api.getLessonFromChapter(chapterId, lessonId);

          const courseId = l.course[0].id;

          if (!tempLessons[courseId]) {
            tempLessons[courseId] = {
              name: l.course[0].name,
              courseCode: l.course[0].code,
              lessons: [],
              isCollapsed: false,
              sort_index: l.course[0].sort_index,
            };
          }

          l.lesson[0].selected = true;
          tempLessons[courseId].lessons.push(l.lesson[0]);
        }
      }

      updateSelectedLesson(TeacherAssignmentPageType.MANUAL, tempLessons);

      if (Object.keys(tempLessons).length === 0) {
        setRecommendedCollapsed(false);
      }

      setManualAssignments(tempLessons);
    }
    const lastAssignmentsCourseWise: TableTypes<'assignment'>[] | undefined =
      await api.getLastAssignmentsForRecommendations(current_class.id);
    getRecommendedAssignments(
      courseList,
      lastAssignmentsCourseWise,
      tempLessons,
    );
  };

  const getRecommendedAssignments = async (
    courseList: TableTypes<'course'>[],
    lastAssignmentsCourseWise: TableTypes<'assignment'>[] | undefined,
    tempLessons: any,
  ) => {
    let recommendedAssignments: any = {};
    for (const course of courseList) {
      if (!recommendedAssignments[course.id]) {
        recommendedAssignments[course.id] = {
          name: course.name,
          courseCode: course.code,
          lessons: [],
          sort_index: course.sort_index,
          isCollapsed: false,
        };
      }
      const lastAssignment = lastAssignmentsCourseWise?.find(
        (assignment) => assignment.course_id === course.id,
      );

      const courseChapters = await api.getChaptersForCourse(course.id);
      if (!courseChapters || courseChapters.length === 0) {
        logger.warn(`No chapters found for course ID: ${course.id}`);
        continue;
      }
      const chapterId = lastAssignment
        ? lastAssignment.chapter_id
        : (courseChapters[0]?.id ?? '');
      if (chapterId) {
        const lessonList = await api.getLessonsForChapter(chapterId);

        if (lessonList && lessonList.length > 0) {
          const lessonIndex = lessonList.findIndex(
            (lesson) => lesson.id === lastAssignment?.lesson_id,
          );

          if (lessonIndex >= 0 && lessonList[lessonIndex + 1]) {
            recommendedAssignments[course.id].lessons.push(
              lessonList[lessonIndex + 1],
            );
          } else {
            recommendedAssignments[course.id].lessons.push(lessonList[0]);
          }
        } else {
          const allChapters = await api.getChaptersForCourse(course.id);
          const i = allChapters.findIndex((c) => c.id === chapterId);
          const nextChapter = allChapters[i + 1];

          if (!nextChapter) {
            logger.warn('No next chapter found for course', course.id);
            continue;
          }

          const nextLessonList = await api.getLessonsForChapter(nextChapter.id);
          if (nextLessonList.length > 0) {
            recommendedAssignments[course.id].lessons.push(nextLessonList[0]);
          }
        }
      }
    }
    const updatedRecommendedAssignments = { ...recommendedAssignments };
    if (Object.keys(tempLessons).length > 0) {
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map(
            (assignment: AssignmentLesson) => ({
              ...assignment,
              selected: false,
              source: AssignmentSource.RECOMMENDED,
            }),
          );
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments,
      );
    } else {
      const updatedRecommendedAssignments = { ...recommendedAssignments };
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map(
            (assignment: AssignmentLesson) => ({
              ...assignment,
              selected: true,
              source: AssignmentSource.RECOMMENDED,
            }),
          );
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments,
      );
    }
    if (
      Object.values(recommendedAssignments).some(
        (s: any) => s.lessons.length > 0,
      )
    ) {
      setRecommendedCollapsed(false);
    }
  };

  const toggleAssignmentSelection = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
    subject: string,
    index: number,
  ) => {
    const updatedAssignments = { ...category };
    updatedAssignments[subject].lessons[index].selected =
      !updatedAssignments[subject].lessons[index].selected;

    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const updateSelectedLesson = (
    type: TeacherAssignmentPageType,
    updatedAssignments: any,
  ) => {
    let tempSelectedCount: SelectedLessonsCountState = {
      ...selectedLessonsCount,
    };
    tempSelectedCount[type].count = 0;

    const ensureSubjectCount = (
      data: SelectedLessonsByType,
      subjectId: string,
    ): SelectedSubjectCount => {
      const currentValue = data[subjectId];
      if (!currentValue || typeof currentValue === 'number') {
        data[subjectId] = { count: [] };
        return data[subjectId] as SelectedSubjectCount;
      }
      return currentValue;
    };

    Object.keys(updatedAssignments).forEach((subjectId) => {
      let lessonCount = 0;

      updatedAssignments[subjectId].lessons.forEach((assignment: any) => {
        const subjectSelection = ensureSubjectCount(
          tempSelectedCount[type],
          subjectId,
        );
        if (assignment.selected) {
          lessonCount++;
          if (!subjectSelection.count.includes(assignment.id)) {
            subjectSelection.count.push(assignment.id);
          }
        } else if (subjectSelection.count.includes(assignment.id)) {
          const i = subjectSelection.count.findIndex(
            (id: string) => id === assignment.id,
          );
          if (i > -1) {
            subjectSelection.count.splice(i, 1);
          }
        }
      });

      tempSelectedCount[type].count = tempSelectedCount[type].count || 0;
      tempSelectedCount[type].count += lessonCount;
    });

    setSelectedLessonsCount(tempSelectedCount);
  };

  const toggleCollapse = (setCollapsed: any, collapsed: boolean) => {
    setCollapsed(!collapsed);
  };

  const toggleSubjectCollapse = (
    type: TeacherAssignmentPageType,
    subject: string,
  ) => {
    const newCollapsed =
      type === TeacherAssignmentPageType.MANUAL
        ? { ...manualAssignments }
        : { ...recommendedAssignments };

    newCollapsed[subject].isCollapsed = !newCollapsed[subject].isCollapsed;

    if (type === TeacherAssignmentPageType.MANUAL) {
      setManualAssignments(newCollapsed);
    } else {
      setRecommendedAssignments(newCollapsed);
    }
  };

  const selectAllAssignments = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
  ) => {
    const allSelected = Object.keys(category).every((subjectId) =>
      category[subjectId].lessons.every(
        (assignment: any) => assignment.selected,
      ),
    );
    const updatedAssignments = { ...category };
    Object.keys(updatedAssignments).forEach((subjectId) => {
      updatedAssignments[subjectId].lessons = updatedAssignments[
        subjectId
      ].lessons.map((assignment: any) => ({
        ...assignment,
        selected: !allSelected,
      }));
    });
    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const areAllSelected = (category: any) => {
    return Object.keys(category)?.length > 0
      ? Object.keys(category)?.every((subjectId) =>
          category[subjectId]?.lessons?.every(
            (assignment: any) => assignment?.selected,
          ),
        )
      : false;
  };

  const startScan = async () => {
    try {
      setLoading(true);

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
      });

      if (result.ScanResult) {
        await processScannedData(result.ScanResult);
      } else {
        Toast.show({ text: 'No QR code detected.' });
      }
    } catch (err) {
      logger.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const processScannedData = async (scannedText: string) => {
    try {
      let processedText = scannedText;
      if (processedText.startsWith('http://')) {
        processedText = processedText.replace(/^http:\/\//, 'https://');
      }

      const result = await api
        .getChapterIdbyQrLink(processedText)
        .catch((error) => {
          logger.error('QR lookup failed:', error);
          return undefined;
        });
      if (!result?.chapter_id) {
        onUnavailableQr();
        return;
      }
      const lessonList = await api.getLessonsForChapter(result?.chapter_id);
      if (!lessonList || lessonList.length < 1) {
        Toast.show({ text: t('No lessons found for this chapter') });
        return;
      }
      const course = await api.getCourse(result.course_id ?? '');
      if (!course) {
        Toast.show({ text: t('Course not found for this chapter') });
        return;
      }
      const current_class = await Util.getCurrentClass();
      const classId = current_class?.id ?? '';
      const previousCart = currentUser?.id
        ? await api.getUserAssignmentCart(currentUser?.id)
        : null;

      let lessonsMap: Map<string, string>;
      if (previousCart?.lessons) {
        lessonsMap = new Map(Object.entries(JSON.parse(previousCart.lessons)));
      } else {
        lessonsMap = new Map();
      }

      let chapterLessonMap: Record<
        string,
        Partial<Record<AssignmentSource, string[]>>
      > = {};

      if (lessonsMap.has(classId)) {
        chapterLessonMap = JSON.parse(lessonsMap.get(classId)!);
      }

      const chapterId = result.chapter_id;
      const newLessonIds = lessonList.map((l: any) => l.id);

      if (Array.isArray(chapterLessonMap[chapterId])) {
        const oldLessonIds = chapterLessonMap[chapterId] as string[];
        chapterLessonMap[chapterId] = {
          [AssignmentSource.MANUAL]: oldLessonIds,
        };
      }

      if (!chapterLessonMap[chapterId]) {
        chapterLessonMap[chapterId] = {};
      }

      const existingQR =
        (chapterLessonMap[chapterId] as any)?.[AssignmentSource.QR_CODE] ?? [];

      const mergedQRLessons = Array.from(
        new Set([...existingQR, ...newLessonIds]),
      );

      (chapterLessonMap[chapterId] as any)[AssignmentSource.QR_CODE] =
        mergedQRLessons;

      lessonsMap.set(classId, JSON.stringify(chapterLessonMap));

      const finalLessonsJson = JSON.stringify(Object.fromEntries(lessonsMap));

      await api.createOrUpdateAssignmentCart(
        currentUser?.id!,
        finalLessonsJson,
      );

      history.push({
        ...parsePath(PAGES.QR_ASSIGNMENTS),
        state: {
          chapterId: result.chapter_id,
          courseId: result.course_id,
        },
      });
    } catch (error) {
      Toast.show({ text: t('Something Went wrong') });
      logger.error('Error processing scanned data:', error);
    }
  };

  const goToSelectedAssignments = async () => {
    if (
      selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
        selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED].count >
      0
    ) {
      history.replace({
        ...parsePath(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE),
        state: {
          selectedAssignments: selectedLessonsCount,
          manualAssignments: manualAssignments,
          recommendedAssignments: recommendedAssignments,
        },
      });
    } else {
      await Toast.show({
        text: t('Please select the Assignment') || '',
        duration: 'long',
      });
    }
  };

  return {
    areAllSelected,
    goToSelectedAssignments,
    loading,
    manualAssignments,
    manualCollapsed,
    recommendedAssignments,
    recommendedCollapsed,
    selectedLessonsCount,
    selectAllAssignments,
    setManualAssignments,
    setManualCollapsed,
    setRecommendedAssignments,
    setRecommendedCollapsed,
    startScan,
    toggleAssignmentSelection,
    toggleCollapse,
    toggleSubjectCollapse,
  };
}
