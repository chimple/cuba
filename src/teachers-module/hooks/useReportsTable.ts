import { useEffect, useState } from 'react';
import {
  PAGES,
  TABLEDROPDOWN,
  TABLESORTBY,
  TableTypes,
  ALL_SUBJECT,
} from '../../common/constants';
import { Util } from '../../utility/util';
import { ServiceConfig } from '../../services/ServiceConfig';
import Loading from '../../components/Loading';
import { ClassUtil } from '../../utility/classUtil';
import { subDays, subMonths } from 'date-fns';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { parsePath } from 'history';
import type {
  AssignmentHeader,
  DateRangeValue,
  DropdownOption,
  ReportTableProps,
  SubjectSelection,
} from '../components/reports/ReportsTableTypes';
import { getAssignmentMapObject } from '../components/reports/ReportsTableHelpers';

export const useReportsTable = ({
  handleButtonClick,
  startDateProp,
  endDateProp,
  selectedTypeProp,
  isAssignmentsProp,
  sortTypeProp,
}: ReportTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectSelection>();
  const [selectedChapter, setSelectedChapter] =
    useState<TableTypes<'chapter'>>();
  const [selectedType, setSelectedType] = useState<TABLEDROPDOWN>(
    selectedTypeProp ?? TABLEDROPDOWN.WEEKLY,
  );
  const [sortType, setSortType] = useState<TABLESORTBY>(
    sortTypeProp ?? TABLESORTBY.NAME,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignments, setIsAssignments] = useState<boolean>(
    isAssignmentsProp ?? true,
  );
  const [subjects, setSubjects] = useState<TableTypes<'course'>[]>();
  const [chapters, setChapters] = useState<TableTypes<'chapter'>[]>();
  const history = useHistory();
  const [headerData, setHeaderData] = useState<Map<string, AssignmentHeader>[]>(
    [],
  );
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  const [reportData, setReportData] = useState<
    Map<string, { student: TableTypes<'user'>; results: Record<string, any[]> }>
  >(new Map());

  const [mappedSubjectOptions, setMappedSubjectOptions] = useState<
    {
      icon: string;
      id: string;
      name: string;
      subjectDetail: string;
      code: string;
    }[]
  >([]);

  const subjectOptionsWithAll = [
    { ...ALL_SUBJECT, disabled: selectedType === TABLEDROPDOWN.CHAPTER },
    ...mappedSubjectOptions.map((subject) => ({ ...subject, disabled: false })),
  ];

  const [mappedChaptersOptions, setMappedChaptersOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const selectedTypeOption = Object.entries(TABLEDROPDOWN).find(
    ([, value]) => value === selectedType,
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate:
      startDateProp ??
      (selectedType == TABLEDROPDOWN.MONTHLY
        ? subMonths(new Date(), 6)
        : subDays(new Date(), 6)),
    endDate: endDateProp ?? new Date(),
    isStudentProfilePage: false,
  });

  const api = ServiceConfig.getI().apiHandler;
  useEffect(() => {
    init();
  }, [
    dateRange,
    selectedType,
    selectedSubject,
    selectedChapter,
    sortType,
    isAssignments,
  ]);

  useEffect(() => {
    initData();
  }, []);
  useEffect(() => {
    initChapters();
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedType === TABLEDROPDOWN.CHAPTER) {
      // Set first subject as selected if not already
      if (
        mappedSubjectOptions.length > 0 &&
        selectedSubject?.id === ALL_SUBJECT.id
      ) {
        handleSelectSubject(mappedSubjectOptions[0]);
      }
    }
  }, [selectedType]);

  const initChapters = async () => {
    if (!selectedSubject?.id || selectedSubject.id === ALL_SUBJECT.id) {
      setMappedChaptersOptions([]);
      setChapters([]);
      setSelectedChapter(undefined);
      return;
    }

    const _chapters = await api.getChaptersForCourse(selectedSubject?.id ?? '');
    var _mappedChaptersOptions = _chapters?.map((option) => ({
      id: option.id,
      name: option.name ?? '',
    }));
    setMappedChaptersOptions(_mappedChaptersOptions);
    setChapters(_chapters);
    setSelectedChapter((prev) => {
      if (!prev) {
        return _chapters[0];
      }

      return (
        _chapters.find((chapter) => chapter.id === prev.id) ?? _chapters[0]
      );
    });
  };
  const initData = async () => {
    var current_class = Util.getCurrentClass();
    const _subjects = await api.getCoursesForClassStudent(
      current_class?.id ?? '',
    );
    setSubjects(_subjects);

    const baseSubjectOptions = _subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      icon: subject?.image || '/assets/icons/DefaultIcon.png',
      subjectDetail: subject.name,
      code: subject.code || '',
    }));

    const curriculumIds = Array.from(
      new Set(_subjects.map((s) => s.curriculum_id)),
    );
    const gradeIds = Array.from(new Set(_subjects.map((s) => s.grade_id)));
    const filteredCurriculumIds = curriculumIds.filter(
      (id): id is string => id !== null,
    );
    const filteredGradeIds = gradeIds.filter((id): id is string => id !== null);

    var current_course = Util.getCurrentCourse(current_class?.id);
    setSelectedSubject(current_course ?? _subjects[0]);
    const _chapters = await api.getChaptersForCourse(_subjects[0]?.id);
    const [curriculumsResult, gradesResult] = await Promise.allSettled([
      api.getCurriculumsByIds(filteredCurriculumIds),
      api.getGradesByIds(filteredGradeIds),
    ]);
    setChapters(_chapters);
    setSelectedChapter(_chapters[0]);
    const curriculums =
      curriculumsResult.status === 'fulfilled' ? curriculumsResult.value : [];
    const grades =
      gradesResult.status === 'fulfilled' ? gradesResult.value : [];
    const curriculumMap = new Map(curriculums.map((c) => [c.id, c]));
    const gradeMap = new Map(grades.map((g) => [g.id, g]));
    const _mappedSubjectOptions = baseSubjectOptions.map((subject) => {
      const sourceSubject = _subjects.find((item) => item.id === subject.id);
      const curriculum = curriculumMap.get(sourceSubject?.curriculum_id ?? '');
      const grade = gradeMap.get(sourceSubject?.grade_id ?? '');
      return {
        id: subject.id,
        subjectDetail: `${subject.name} ${curriculum?.name ?? 'Unknown'}-${grade?.name ?? 'Unknown'}`,
        // icon: curriculum?.image,
        icon: subject.icon,
        name: subject.name,
        code: subject.code || '',
      };
    });
    var _mappedChaptersOptions = _chapters?.map((option) => ({
      id: option.id,
      name: option.name ?? '',
    }));
    setMappedChaptersOptions(_mappedChaptersOptions);
    setMappedSubjectOptions(_mappedSubjectOptions);
    setIsLoading(false);
  };

  const init = async () => {
    // setIsLoading(true);
    var current_class = Util.getCurrentClass();
    var _classUtil = new ClassUtil();
    setExpandedRow(null);
    const subject_ids = subjects?.map((item) => item.id);
    const selectedsubjectIds: string[] =
      selectedSubject?.id === ALL_SUBJECT.id || !selectedSubject?.id
        ? (subject_ids ?? [])
        : [selectedSubject.id];
    switch (selectedType) {
      case TABLEDROPDOWN.WEEKLY:
        var _weeklyData = await _classUtil.getWeeklyReport(
          current_class?.id ?? '',
          selectedsubjectIds,
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments,
        );
        setReportData(_weeklyData.ReportData);
        setHeaderData(_weeklyData.HeaderData.slice(0, 7));
        break;
      case TABLEDROPDOWN.MONTHLY:
        var _monthlyData = await _classUtil.getMonthlyReport(
          current_class?.id ?? '',
          selectedsubjectIds,
          dateRange.startDate,
          dateRange.endDate,
          sortType,
          isAssignments,
        );

        setReportData(_monthlyData.ReportData);
        setHeaderData(_monthlyData.HeaderData);

        break;
      case TABLEDROPDOWN.ASSIGNMENTS:
        var _assignmentData =
          await _classUtil.getAssignmentOrLiveQuizReportForReport(
            current_class?.id ?? '',
            selectedsubjectIds,
            dateRange.startDate,
            dateRange.endDate,
            false,
            sortType,
          );
        setReportData(_assignmentData.ReportData);
        setHeaderData(_assignmentData.HeaderData);
        break;
      case TABLEDROPDOWN.CHAPTER:
        var _reportData = await _classUtil.getChapterWiseReport(
          current_class?.id ?? '',
          dateRange.startDate,
          dateRange.endDate,
          selectedSubject?.id ?? '',
          selectedChapter?.id ?? '',
          sortType,
          isAssignments,
        );
        setReportData(_reportData.ReportData);
        setHeaderData(_reportData.HeaderData);
        break;
      case TABLEDROPDOWN.LIVEQUIZ:
        var _liveQuizData =
          await _classUtil.getAssignmentOrLiveQuizReportForReport(
            current_class?.id ?? '',
            selectedsubjectIds,
            dateRange.startDate,
            dateRange.endDate,
            true,
            sortType,
          );
        setReportData(_liveQuizData.ReportData);
        setHeaderData(_liveQuizData.HeaderData);
        break;
      default:
    }
    setIsLoading(false);
  };

  const handleSelectSubject = (subject: DropdownOption) => {
    var current_class = Util.getCurrentClass();
    if (subject) {
      const selectedCourse =
        subjects?.find((item) => item.id === String(subject.id)) ?? undefined;
      setSelectedSubject(
        selectedCourse ?? {
          ...subject,
          id: String(subject.id),
        },
      );
      if (selectedCourse) {
        Util.setCurrentCourse(current_class?.id, selectedCourse);
      }
    }
  };
  const handleSelectChapter = (chapter: {
    id: string | number;
    name: string;
  }) => {
    if (!chapter) return;
    const selected = chapters?.find((item) => item.id === String(chapter.id));
    if (selected) setSelectedChapter(selected);
  };
  const handleViewClickDetails = (student: TableTypes<'user'>) => {
    history.push({
      ...parsePath(PAGES.STUDENT_REPORT),
      state: {
        student: student,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        selectedType: selectedType,
        isAssignments: isAssignments,
        sortType: sortType,
      },
    });
  };

  const handleTypeSelect = (type: { id: string | number; name: string }) => {
    if (type) {
      if (type.name === TABLEDROPDOWN.CHAPTER) {
        const chapterSubject =
          selectedSubject?.id && selectedSubject.id !== ALL_SUBJECT.id
            ? selectedSubject
            : subjects?.[0];

        if (chapterSubject) {
          setSelectedSubject(chapterSubject);
          api.getChaptersForCourse(chapterSubject.id).then((_chapters) => {
            setChapters(_chapters);
            setMappedChaptersOptions(
              _chapters.map((option) => ({
                id: option.id,
                name: option.name ?? '',
              })),
            );
            setSelectedChapter(_chapters[0]);
          });
        }
      }
      setSelectedType(type.name as TABLEDROPDOWN);
    }
  };

  const handleNameSort = (type: { id: string; name: TABLESORTBY }) => {
    if (type) {
      setSortType(type.name);
    }
  };
  const handleIsAssignmets = (_isAssignments: boolean) => {
    setIsAssignments(_isAssignments);
  };
  const handleDateSelect = (dateRange: { startDate: Date; endDate: Date }) => {
    setDateRange((prev) => ({
      ...prev,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }));
  };
  const handleRowClick = (key: string) => {
    if (expandedRow === key) {
      setExpandedRow(null);
    } else {
      setExpandedRow(key);
    }
  };
  const assignmentMapObject = getAssignmentMapObject(headerData);
  return {
    ALL_SUBJECT,
    Loading,
    TABLEDROPDOWN,
    assignmentMapObject,
    dateRange,
    expandedRow,
    handleButtonClick,
    handleDateSelect,
    handleIsAssignmets,
    handleNameSort,
    handleRowClick,
    handleSelectChapter,
    handleSelectSubject,
    handleTypeSelect,
    handleViewClickDetails,
    headerData,
    isAssignments,
    isExternalUser,
    isLoading,
    mappedChaptersOptions,
    reportData,
    selectedChapter,
    selectedSubject,
    selectedType,
    selectedTypeOption,
    sortType,
    subjectOptionsWithAll,
    t,
  };
};
