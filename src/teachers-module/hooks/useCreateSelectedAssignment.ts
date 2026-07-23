import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import {
  ALL_SUBJECT,
  ASSIGNMENT_TYPE,
  AssignmentSource,
  BANDS,
  BANDWISECOLOR,
  getBandTitleByColor,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { ClassUtil } from '../../utility/classUtil';
import { Util } from '../../utility/util';
import { useHistory } from 'react-router';
import i18n, { t } from 'i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import { TeacherAssignmentPageType } from '../components/homePage/assignment/TeacherAssignment';
import CommonDialogBox from '../../common/CommonDialogBox';
import Loading from '../../components/Loading';
import CalendarPicker from '../../common/CalendarPicker';
import { Toast } from '@capacitor/toast';
import { addDays, addMonths, format } from 'date-fns';
import { Trans } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utility/logger';
import {
  getStreakTargetRect,
  triggerStreakRewardPulse,
} from '../../common/streakRewardBridge';
import { parsePath } from 'history';
import { buildHashAppUrl } from '../../utility/routerLocation';
import { createAssignmentsForStudentsWithDependencies } from '../components/homePage/assignment/createSelectedAssignmentWorkflow';

interface LessonDetail {
  subject: string;
  chapter: string;
  lesson: string;
}

interface Chapter {
  name: string;
  lessons: string[];
}

interface SubjectGroup {
  subject: string;
  chapters: Chapter[];
}

export type SelectableStudent = TableTypes<'user'> & { selected?: boolean };

export interface BandStudentGroup {
  title: string;
  isCollapsed: boolean;
  color: string;
  students: SelectableStudent[];
}

export type GroupWiseStudents = Record<string, BandStudentGroup>;

interface SubjectAssignmentSelection {
  count: string[];
}

type AssignmentCountOnly = {
  count: number;
};

export type SelectedAssignments = Record<
  string,
  Record<string, SubjectAssignmentSelection | AssignmentCountOnly>
> & {
  length?: number;
};

export interface AssignmentBucket {
  lessons: (TableTypes<'lesson'> & { source?: string | null })[];
}

export type AssignmentLookup = Record<string, AssignmentBucket>;

interface CreateSelectedAssignmentProps {
  selectedAssignments: SelectedAssignments;
  manualAssignments: AssignmentLookup;
  recommendedAssignments: AssignmentLookup;
  onInteractionLockChange?: (isLocked: boolean) => void;
}

export type RewardAnimationState = {
  visible: boolean;
  label: string;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  isFlying: boolean;
};

export const useCreateSelectedAssignment = ({
  selectedAssignments,
  manualAssignments,
  recommendedAssignments,
  onInteractionLockChange,
}: CreateSelectedAssignmentProps) => {
  const FIRST_ASSIGNMENT_REWARD = 50;
  const SUBSEQUENT_ASSIGNMENT_REWARD = 25;
  const REWARD_INDICATOR_DELAY_MS = 700;
  const REWARD_FLIGHT_DURATION_MS = 1600;
  const FLAME_PULSE_DURATION_MS = 1000;
  const STREAK_LANDING_LEFT_OFFSET_PX = 30;
  const REWARD_INDICATOR_EDGE_PADDING_PX = 2;

  const history = useHistory();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [groupWiseStudents, setGroupWiseStudents] = useState<GroupWiseStudents>(
    {},
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [maxEndDate, setMaxEndDate] = useState('');
  const [allSelected, setAllSelected] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shareTextLessonDetails, setShareTextLessonDetails] = useState<
    LessonDetail[]
  >([]);
  const [assignmentBatchId, setAssignmentBatchId] = useState<string | null>(
    null,
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [rewardAnimation, setRewardAnimation] = useState<RewardAnimationState>({
    visible: false,
    label: '',
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    isFlying: false,
  });
  const assignButtonRef = useRef<HTMLButtonElement | null>(null);
  const rewardIndicatorRef = useRef<HTMLDivElement | null>(null);
  const isInteractionLocked = isAssigning || rewardAnimation.visible;

  useEffect(() => {
    init();
    assignmentsInfo();
  }, []);

  useEffect(() => {
    onInteractionLockChange?.(isInteractionLocked);
  }, [isInteractionLocked, onInteractionLockChange]);

  const init = async () => {
    let todayDate = new Date().toISOString().slice(0, 10);
    setStartDate(todayDate);

    let nextMonthDate = new Date(todayDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setEndDate(nextMonthDate.toISOString().slice(0, 10));

    const _classUtil = new ClassUtil();
    const current_class = Util.getCurrentClass();
    if (!current_class || !current_class.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }

    const classCourses = await api.getCoursesForClassStudent(current_class.id);
    const selectedSubject = Util.getCurrentCourse(current_class?.id);
    const subject_ids = classCourses.map((item) => item.id);
    const selectedsubjectIds: string[] =
      selectedSubject?.id === ALL_SUBJECT.id || !selectedSubject?.id
        ? subject_ids
        : [selectedSubject.id];

    const _studentProgress = await _classUtil.divideStudents(
      current_class.id,
      selectedsubjectIds,
    );
    let _studentList =
      await _classUtil.groupStudentsByCategoryInList(_studentProgress);

    //  Selecting all student Bands
    _studentList.forEach((category) => {
      category.forEach((student: SelectableStudent) => {
        student.selected = true;
      });
    });
    setGroupWiseStudents({
      [BANDS.GREENGROUP]: {
        title: getBandTitleByColor(
          BANDWISECOLOR.GREEN,
          t as (key: string) => string,
        ),
        isCollapsed: true,
        color: BANDWISECOLOR.GREEN,
        students: _studentList?.get(BANDS.GREENGROUP) ?? [],
      },
      [BANDS.YELLOWGROUP]: {
        title: getBandTitleByColor(
          BANDWISECOLOR.YELLOW,
          t as (key: string) => string,
        ),
        isCollapsed: true,
        color: BANDWISECOLOR.YELLOW,
        students: _studentList?.get(BANDS.YELLOWGROUP) ?? [],
      },
      [BANDS.REDGROUP]: {
        title: getBandTitleByColor(
          BANDWISECOLOR.RED,
          t as (key: string) => string,
        ),
        isCollapsed: true,
        color: BANDWISECOLOR.RED,
        students: _studentList?.get(BANDS.REDGROUP) ?? [],
      },
      [BANDS.GREYGROUP]: {
        title: getBandTitleByColor(
          BANDWISECOLOR.GREY,
          t as (key: string) => string,
        ),
        isCollapsed: true,
        color: BANDWISECOLOR.GREY,
        students: _studentList?.get(BANDS.GREYGROUP) ?? [],
      },
    });
    const oneMonthLater = new Date(
      new Date().setMonth(new Date().getMonth() + 1),
    );
    setMaxEndDate(oneMonthLater.toISOString().split('T')[0]);
  };

  const assignmentsInfo = async () => {
    try {
      // Get current class and user
      const current_class = Util.getCurrentClass();
      const currUser = await auth.getCurrentUser();
      // Guard clases for missing data
      if (!currUser || !current_class) {
        logger.error('Current user or class not found');
        setIsLoading(false);
        return;
      }

      let tempLessonInfo: LessonDetail[] = [];

      // Iterate through assignment types (manual/recommended)
      for (const type of Object.keys(selectedAssignments)) {
        for (const subjectId of Object.keys(selectedAssignments[type])) {
          const subjectData = selectedAssignments[type][subjectId];

          if (
            !subjectData ||
            subjectId === 'count' ||
            !Array.isArray(subjectData.count)
          ) {
            continue;
          }

          const tempLessons =
            type === TeacherAssignmentPageType.MANUAL
              ? (manualAssignments[subjectId]?.lessons ?? [])
              : (recommendedAssignments[subjectId]?.lessons ?? []);

          if (!tempLessons.length) {
            logger.warn(`No lessons found for subjectId ${subjectId}`);
            continue;
          }
          // Process lessons asynchronously in parallel
          await Promise.all(
            subjectData.count.map(async (lessonId: string) => {
              const tempLes = tempLessons.find(
                (les: TableTypes<'lesson'> & { source?: string | null }) =>
                  les.id === lessonId,
              );
              if (!tempLes) {
                logger.warn(`Lesson not found for lessonId: ${lessonId}`);
                return;
              }

              const tempChapterId =
                (await api.getChapterByLesson(tempLes.id, current_class.id)) ??
                '';
              if (!tempChapterId) {
                logger.warn(`Chapter not found for lessonId: ${lessonId}`);
                return;
              }

              const lessonSubject = await api.getCourse(subjectId);

              const lessonChapter = await api.getChapterById(
                tempChapterId.toString(),
              );
              const lessonObj = await api.getLesson(lessonId);

              tempLessonInfo.push({
                subject: lessonSubject?.name || '',
                chapter: lessonChapter?.name || '',
                lesson: lessonObj?.name || '',
              });
            }),
          );
        }
      }
      setShareTextLessonDetails(tempLessonInfo);
    } catch (error) {
      logger.error('Error creating assignments:', error);
    }
  };

  const handleDateConfirm = (type: 'start' | 'end', date: string) => {
    if (type === 'start') {
      setStartDate(date);
      // Always move end date to start date + 1 day
      const nextDay = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
      setEndDate(nextDay);
      setShowStartDatePicker(false);
    } else {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };

  const toggleCollapse = (category: string) => {
    if (isInteractionLocked) {
      return;
    }

    setGroupWiseStudents((bandStudents: GroupWiseStudents) => ({
      ...bandStudents,
      [category]: {
        ...bandStudents[category],
        isCollapsed: !bandStudents[category].isCollapsed,
      },
    }));
  };

  const toggleSelectAll = () => {
    if (isInteractionLocked) {
      return;
    }

    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    // Update all bands' students' selection state
    setGroupWiseStudents((bandStudents: GroupWiseStudents) => {
      const updatedBands = { ...bandStudents };
      Object.keys(updatedBands).forEach((band) => {
        updatedBands[band].students = updatedBands[band].students.map(
          (student: SelectableStudent) => ({
            ...student,
            selected: newAllSelected,
          }),
        );
      });
      return updatedBands;
    });
  };

  const toggleStudentSelection = (category: string, index: number) => {
    if (isInteractionLocked) {
      return;
    }

    setGroupWiseStudents((bandStudents: GroupWiseStudents) => {
      const updatedBands = { ...bandStudents };
      const students = [...updatedBands[category].students];
      students[index].selected = !students[index].selected;
      updatedBands[category].students = students;

      // Recalculate if "Select All" should be checked
      const allSelectedBands = Object.keys(updatedBands).every((band) =>
        updatedBands[band].students.every(
          (student: SelectableStudent) => student.selected,
        ),
      );

      setAllSelected(allSelectedBands);
      return updatedBands;
    });
  };
  useEffect(() => {
    // Check if all bands are selected initially
    const initialAllSelected = Object.keys(groupWiseStudents).every((band) =>
      groupWiseStudents[band].students.every(
        (student: SelectableStudent) => student.selected,
      ),
    );
    setAllSelected(initialAllSelected);
  }, [groupWiseStudents]);

  const getSelectedStudentList = (studentsMap: GroupWiseStudents) => {
    let studentList: string[] = [];
    Object.keys(studentsMap).forEach((group) => {
      studentsMap[group]?.students.forEach((student: SelectableStudent) => {
        if (student?.selected) {
          studentList.push(student.id);
        }
      });
    });

    return studentList;
  };

  const groupLessonDetails = (
    lessonDetails: LessonDetail[],
  ): SubjectGroup[] => {
    return lessonDetails.reduce((acc: SubjectGroup[], detail) => {
      let subjectGroup = acc.find((group) => group.subject === detail.subject);
      if (!subjectGroup) {
        subjectGroup = { subject: detail.subject, chapters: [] };
        acc.push(subjectGroup);
      }
      let chapter = subjectGroup.chapters.find(
        (ch) => ch.name === detail.chapter,
      );
      if (!chapter) {
        chapter = { name: detail.chapter, lessons: [detail.lesson] };
        subjectGroup.chapters.push(chapter);
      } else {
        chapter.lessons.push(detail.lesson);
      }
      return acc;
    }, []);
  };

  const getShareText = async () => {
    const currentClass = await Util.getCurrentClass();
    const groupedDetails = groupLessonDetails(shareTextLessonDetails);
    let schoolLanguageCode: string | undefined;

    try {
      if (currentClass?.school_id) {
        const school = await api.getSchoolById(currentClass.school_id);
        const schoolLanguageIdOrCode = school?.language ?? undefined;
        if (schoolLanguageIdOrCode) {
          const languageDoc = await api.getLanguageWithId(
            schoolLanguageIdOrCode,
          );
          schoolLanguageCode = languageDoc?.code ?? schoolLanguageIdOrCode;
        }
      }
    } catch (error) {
      logger.error('Failed to resolve school language for share text:', error);
    }

    if (schoolLanguageCode) {
      await i18n.loadLanguages([schoolLanguageCode]);
    }
    const fixedT = schoolLanguageCode ? i18n.getFixedT(schoolLanguageCode) : t;
    const translate = (key: string): string => fixedT(key);

    let text = `🧒🧒🧒🧒 ${translate(
      'Dear Students, Your teacher has assigned you the below homework. Please go to Chimple Learning app and complete it.\n\n',
    )}`;
    text += `*${translate('Class')}: ${currentClass?.name.trim()}*\n\n`;
    groupedDetails.forEach((subjectDetails) => {
      text += `*${translate('Subject')}: ${subjectDetails.subject}*\n`;
      subjectDetails.chapters.forEach((chapter, chapterIndex) => {
        text += `   ${chapterIndex + 1}. _*${translate('Chapter')}*_: ${
          chapter.name
        }\n`;
        chapter.lessons.forEach((lesson, lessonIndex) => {
          const lessonNumber = `${chapterIndex + 1}.${lessonIndex + 1}`;
          const formattedLesson = `${lessonNumber} ${lesson}`;
          const space = '                      ';
          if (lessonIndex === 0) {
            text += `       _*${translate('Lesson')}*_: ${formattedLesson}\n`;
          } else {
            text += `${space}${formattedLesson}\n`;
          }
        });
        text += `\n`;
      });
      text += `\n`;
    });

    const assignmentUrl = buildHashAppUrl(
      {
        pathname: PAGES.ASSIGNMENT,
        search: `?batch_id=${encodeURIComponent(assignmentBatchId ?? '')}&source=teacher`,
      },
      'https://chimple.cc',
    ).toString();

    text += `${translate(
      'Please click this link to access your Homework',
    )}: ${assignmentUrl}`;

    return text.trim();
  };
  const createAssignmentsForStudents = async () =>
    createAssignmentsForStudentsWithDependencies({
      FIRST_ASSIGNMENT_REWARD,
      SUBSEQUENT_ASSIGNMENT_REWARD,
      REWARD_INDICATOR_DELAY_MS,
      REWARD_FLIGHT_DURATION_MS,
      FLAME_PULSE_DURATION_MS,
      STREAK_LANDING_LEFT_OFFSET_PX,
      REWARD_INDICATOR_EDGE_PADDING_PX,
      allSelected,
      api,
      assignButtonRef,
      auth,
      endDate,
      getSelectedStudentList,
      groupWiseStudents,
      isAssigning,
      manualAssignments,
      recommendedAssignments,
      rewardIndicatorRef,
      selectedAssignments,
      setAssignmentBatchId,
      setIsAssigning,
      setIsLoading,
      setRewardAnimation,
      setShowConfirm,
      startDate,
      t,
    });
  return {
    CalendarPicker,
    CommonDialogBox,
    IonIcon,
    Loading,
    PAGES,
    Trans,
    Util,
    addDays,
    addMonths,
    allSelected,
    assignButtonRef,
    calendarOutline,
    createAssignmentsForStudents,
    endDate,
    format,
    getShareText,
    groupWiseStudents,
    handleDateConfirm,
    history,
    isInteractionLocked,
    isLoading,
    maxEndDate,
    parsePath,
    rewardAnimation,
    rewardIndicatorRef,
    selectedAssignments,
    setGroupWiseStudents,
    setShowConfirm,
    setShowEndDatePicker,
    setShowStartDatePicker,
    showConfirm,
    showEndDatePicker,
    showStartDatePicker,
    startDate,
    t,
    toggleCollapse,
    toggleSelectAll,
    toggleStudentSelection,
  };
};
