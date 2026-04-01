import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SearchLessons.css';
import Header from '../components/homePage/Header';
import { IonSearchbar } from '@ionic/react';
import { useHistory } from 'react-router';
import {
  PAGES,
  TableTypes,
  AssignmentSource,
  SEARCH_LESSON_HISTORY,
  SEARCH_LESSON_CACHE_KEY,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import AssigmentCount from '../components/library/AssignmentCount';
import { Util } from '../../utility/util';
import { t } from 'i18next';
import ChapterWiseLessons from '../components/ChapterWiseLessons';
import { readAssignmentCartFromStorage } from './AssignmentCartStorage';
import logger from '../../utility/logger';

type LessonMeta = {
  chapterId: string | null;
  chapterName: string;
  courseId: string;
  courseName: string;
  gradeName: string;
  course?: TableTypes<'course'>;
};

type ChapterGroup = {
  chapterId: string;
  chapterName: string;
  lessons: TableTypes<'lesson'>[];
};

type CourseGroup = {
  courseId: string;
  courseName: string;
  gradeName: string;
  courseTitle: string;
  course?: TableTypes<'course'>;
  chapters: ChapterGroup[];
};

const SearchLesson: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;

  const currentSchool = Util.getCurrentSchool();
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'>>();

  const inputEl = useRef<HTMLIonSearchbarElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lessons, setLessons] = useState<TableTypes<'lesson'>[]>([]);
  const [lessonMetaMap, setLessonMetaMap] = useState<
    Record<string, LessonMeta>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const [assignmentCount, setAssignmentCount] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Map<string, string>>(
    new Map(),
  );
  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, Partial<Record<AssignmentSource, string[]>>>
  >(new Map());
  const [assignedLessonIds, setAssignedLessonIds] = useState<Set<string>>(
    new Set(),
  );

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasRestoredRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const selectedLessonRef = useRef(selectedLesson);
  const classSelectedLessonRef = useRef(classSelectedLesson);

  useEffect(() => {
    const init = async () => {
      inputEl.current?.setFocus();
      const resolvedClass = await Util.getCurrentClass();
      setCurrentClass(resolvedClass);

      const stored = JSON.parse(
        localStorage.getItem(SEARCH_LESSON_HISTORY) || '[]',
      );
      setSearchHistory(stored);

      const cached = localStorage.getItem(SEARCH_LESSON_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.searchTerm) {
            setSearchTerm(parsed.searchTerm);
            setInputValue(parsed.searchTerm);
            setLessons(parsed.lessons ?? []);
            setShowHistory(false);
          } else {
            setShowHistory(true);
          }
        } catch {}
      } else {
        setShowHistory(true);
      }

      await loadCart(resolvedClass?.id);
      hasRestoredRef.current = true;
    };

    init();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    selectedLessonRef.current = selectedLesson;
  }, [selectedLesson]);

  useEffect(() => {
    classSelectedLessonRef.current = classSelectedLesson;
  }, [classSelectedLesson]);

  const isLessonSelected = (chapterId: string, lessonId: string) => {
    const manual =
      classSelectedLesson.get(chapterId)?.[AssignmentSource.MANUAL] ?? [];
    const qr =
      classSelectedLesson.get(chapterId)?.[AssignmentSource.QR_CODE] ?? [];
    return manual.includes(lessonId) || qr.includes(lessonId);
  };
  const isChapterFullySelected = (
    chapterId: string,
    lessons: TableTypes<'lesson'>[],
  ) => {
    if (!lessons.length) return false;

    return lessons.every((lesson) => isLessonSelected(chapterId, lesson.id));
  };

  const triggerDebouncedSearch = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);
  };

  const normalizeClassSelection = (
    rawClassMap: unknown,
  ): Map<string, Partial<Record<AssignmentSource, string[]>>> => {
    const normalized = new Map<
      string,
      Partial<Record<AssignmentSource, string[]>>
    >();
    if (!rawClassMap || typeof rawClassMap !== 'object') {
      return normalized;
    }

    Object.entries(rawClassMap as Record<string, unknown>).forEach(
      ([chapterId, value]) => {
        if (Array.isArray(value)) {
          normalized.set(chapterId, {
            [AssignmentSource.MANUAL]: [...value],
            [AssignmentSource.QR_CODE]: [],
          });
          return;
        }

        if (value && typeof value === 'object') {
          const sourceMap = value as Partial<
            Record<AssignmentSource, string[]>
          >;
          normalized.set(chapterId, {
            [AssignmentSource.MANUAL]: sourceMap[AssignmentSource.MANUAL] ?? [],
            [AssignmentSource.QR_CODE]:
              sourceMap[AssignmentSource.QR_CODE] ?? [],
          });
        }
      },
    );

    return normalized;
  };

  const persistAssignmentCart = async (
    userId: string,
    classId: string,
    nextClassSelection: Map<
      string,
      Partial<Record<AssignmentSource, string[]>>
    >,
  ) => {
    const nextSelected = new Map(selectedLessonRef.current);
    nextSelected.set(
      classId,
      JSON.stringify(Object.fromEntries(nextClassSelection)),
    );
    selectedLessonRef.current = nextSelected;
    setSelectedLesson(nextSelected);

    await api.createOrUpdateAssignmentCart(
      userId,
      JSON.stringify(Object.fromEntries(nextSelected)),
    );
  };

  const toggleLessonSelection = async (chapterId: string, lessonId: string) => {
    if (!currentClass?.id) return;
    if (!hasRestoredRef.current) return;

    const user = await auth.getCurrentUser();
    if (!user?.id) return;

    const classId = currentClass.id;

    const next = new Map(classSelectedLessonRef.current);
    const chapterSourceMap = { ...(next.get(chapterId) ?? {}) };

    const manual = new Set(chapterSourceMap[AssignmentSource.MANUAL] ?? []);
    const qr = new Set(chapterSourceMap[AssignmentSource.QR_CODE] ?? []);

    if (manual.has(lessonId)) {
      manual.delete(lessonId);
    } else if (qr.has(lessonId)) {
      qr.delete(lessonId);
    } else {
      manual.add(lessonId);
    }

    chapterSourceMap[AssignmentSource.MANUAL] = Array.from(manual);
    chapterSourceMap[AssignmentSource.QR_CODE] = Array.from(qr);

    next.set(chapterId, chapterSourceMap);
    classSelectedLessonRef.current = next;
    setClassSelectedLesson(next);

    let total = 0;
    next.forEach((sourceMap) => {
      total +=
        (sourceMap[AssignmentSource.MANUAL]?.length || 0) +
        (sourceMap[AssignmentSource.QR_CODE]?.length || 0);
    });
    setAssignmentCount(total);

    await persistAssignmentCart(user.id, classId, next);
  };

  const toggleChapterSelection = async (
    chapterId: string,
    lessons: TableTypes<'lesson'>[],
  ) => {
    if (!currentClass?.id) return;
    if (!hasRestoredRef.current) return;

    const user = await auth.getCurrentUser();
    if (!user?.id) return;

    const classId = currentClass.id;

    const next = new Map(classSelectedLessonRef.current);
    const chapterSourceMap = { ...(next.get(chapterId) ?? {}) };

    const manual = new Set(chapterSourceMap[AssignmentSource.MANUAL] ?? []);
    const qr = new Set(chapterSourceMap[AssignmentSource.QR_CODE] ?? []);

    const allSelected = lessons.every(
      (lesson) => manual.has(lesson.id) || qr.has(lesson.id),
    );

    if (allSelected) {
      // Remove all
      lessons.forEach((lesson) => {
        manual.delete(lesson.id);
        qr.delete(lesson.id);
      });
    } else {
      // Add all to MANUAL
      lessons.forEach((lesson) => {
        if (!manual.has(lesson.id) && !qr.has(lesson.id)) {
          manual.add(lesson.id);
        }
      });
    }

    chapterSourceMap[AssignmentSource.MANUAL] = Array.from(manual);
    chapterSourceMap[AssignmentSource.QR_CODE] = Array.from(qr);

    next.set(chapterId, chapterSourceMap);
    classSelectedLessonRef.current = next;
    setClassSelectedLesson(next);

    // Recalculate count
    let total = 0;
    next.forEach((sourceMap) => {
      total +=
        (sourceMap[AssignmentSource.MANUAL]?.length || 0) +
        (sourceMap[AssignmentSource.QR_CODE]?.length || 0);
    });
    setAssignmentCount(total);

    await persistAssignmentCart(user.id, classId, next);
  };

  const loadCart = async (classIdArg?: string) => {
    const user = await auth.getCurrentUser();
    const classId = classIdArg ?? currentClass?.id;
    if (!user?.id || !classId) return;

    const cart =
      (await api.getUserAssignmentCart(user.id)) ??
      readAssignmentCartFromStorage(user.id);
    if (!cart?.lessons) {
      selectedLessonRef.current = new Map();
      classSelectedLessonRef.current = new Map();
      setSelectedLesson(new Map());
      setClassSelectedLesson(new Map());
      setAssignmentCount(0);
      return;
    }

    const parsed = JSON.parse(cart.lessons || '{}') as Record<string, unknown>;

    const fullMap = new Map<string, string>(
      Object.entries(parsed || {}).map(([classId, value]) => [
        classId,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]),
    );

    selectedLessonRef.current = fullMap;
    setSelectedLesson(fullMap);
    const classMapRaw = parsed[classId];
    const classMap =
      typeof classMapRaw === 'string'
        ? JSON.parse(classMapRaw || '{}')
        : classMapRaw || {};
    const map = normalizeClassSelection(classMap);

    classSelectedLessonRef.current = map;
    setClassSelectedLesson(map);

    let count = 0;
    map.forEach((sourceMap) => {
      count +=
        (sourceMap[AssignmentSource.MANUAL]?.length || 0) +
        (sourceMap[AssignmentSource.QR_CODE]?.length || 0);
    });

    setAssignmentCount(count);
  };

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    localStorage.setItem(
      SEARCH_LESSON_CACHE_KEY,
      JSON.stringify({ searchTerm, lessons }),
    );
  }, [searchTerm, lessons]);

  useEffect(() => {
    if (!lessons.length) {
      setLessonMetaMap({});
      return;
    }

    let active = true;

    const hydrate = async () => {
      setIsLoading(true);
      const meta = await buildMeta(lessons);
      if (!active) return;
      setLessonMetaMap(meta);
      setIsLoading(false);
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [lessons, currentClass?.id]);
  useEffect(() => {
    const loadAssignedLessons = async () => {
      const classId = currentClass?.id;
      if (!classId || lessons.length === 0) {
        setAssignedLessonIds(new Set());
        return;
      }

      const courseChapterMap = new Map<string, Set<string>>();
      lessons.forEach((lesson) => {
        const meta = lessonMetaMap[lesson.id];
        if (!meta?.courseId || !meta?.chapterId) return;

        if (!courseChapterMap.has(meta.courseId)) {
          courseChapterMap.set(meta.courseId, new Set());
        }
        courseChapterMap.get(meta.courseId)!.add(meta.chapterId);
      });

      if (courseChapterMap.size === 0) {
        setAssignedLessonIds(new Set());
        return;
      }

      try {
        const assignmentIdSet = new Set<string>();
        await Promise.all(
          Array.from(courseChapterMap.entries()).map(
            async ([courseId, chapterIdsSet]) => {
              const assignmentIds =
                await api.getUniqueAssignmentIdsByCourseAndChapter(
                  classId,
                  courseId,
                  Array.from(chapterIdsSet),
                );
              assignmentIds.forEach((id) => assignmentIdSet.add(id));
            },
          ),
        );

        if (assignmentIdSet.size === 0) {
          setAssignedLessonIds(new Set());
          return;
        }

        const assignmentDocs = await api.getAssignmentsByIds(
          Array.from(assignmentIdSet),
        );
        const nextAssignedLessonIds = new Set<string>();
        assignmentDocs.forEach((assignment) => {
          if (assignment?.lesson_id) {
            nextAssignedLessonIds.add(String(assignment.lesson_id));
          }
        });
        setAssignedLessonIds(nextAssignedLessonIds);
      } catch (error) {
        logger.error('Failed to load assigned lessons in search:', error);
        setAssignedLessonIds(new Set());
      }
    };

    loadAssignedLessons();
  }, [api, currentClass?.id, lessons, lessonMetaMap]);

  const buildMeta = async (
    lessonList: TableTypes<'lesson'>[],
  ): Promise<Record<string, LessonMeta>> => {
    const nextMeta: Record<string, LessonMeta> = {};
    const chapterCache = new Map();
    const courseCache = new Map();
    const gradeCache = new Map();

    await Promise.all(
      lessonList.map(async (lesson) => {
        const rawChapterId = await api.getChapterByLesson(
          lesson.id,
          currentClass?.id,
        );
        if (!rawChapterId) return;

        const chapterId = String(rawChapterId);

        let chapter = chapterCache.get(chapterId);
        if (!chapter) {
          chapter = await api.getChapterById(chapterId);
          chapterCache.set(chapterId, chapter);
        }

        if (!chapter?.course_id) return;

        let course = courseCache.get(chapter.course_id);
        if (!course) {
          course = await api.getCourse(chapter.course_id);
          courseCache.set(chapter.course_id, course);
        }

        let gradeName = '';
        if (course?.grade_id) {
          let grade = gradeCache.get(course.grade_id);
          if (!grade) {
            grade = await api.getGradeById(course.grade_id);
            gradeCache.set(course.grade_id, grade);
          }
          gradeName = grade?.name ?? '';
        }

        nextMeta[lesson.id] = {
          chapterId,
          chapterName: chapter?.name ?? '',
          courseId: chapter.course_id,
          courseName: course?.name ?? '',
          gradeName,
          course,
        };
      }),
    );

    return nextMeta;
  };

  const onSearch = async (term: string) => {
    const trimmed = term.trim();

    if (!trimmed) {
      setLessons([]);
      setSearchTerm('');
      setShowHistory(true);
      return;
    }
    const currentRequestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      const results = await api.searchLessons(trimmed);
      if (currentRequestId !== requestIdRef.current) return;

      setLessons(results ?? []);
      setSearchTerm(trimmed);
      saveSearchHistory(trimmed);
      setShowHistory(false);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const saveSearchHistory = (term: string) => {
    const updated = [term, ...searchHistory.filter((t) => t !== term)];
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_LESSON_HISTORY, JSON.stringify(updated));
  };

  const groupedLessons = useMemo(() => {
    if (isLoading || !Object.keys(lessonMetaMap).length) {
      return { courseGroups: [] };
    }

    const lowerTerm = searchTerm.trim().toLowerCase();
    const filtered = lowerTerm
      ? lessons.filter(
          (lesson) =>
            lesson.name?.toLowerCase().includes(lowerTerm) ||
            lesson.outcome?.toLowerCase().includes(lowerTerm),
        )
      : lessons;

    const courseMap = new Map<
      string,
      {
        courseId: string;
        courseName: string;
        gradeName: string;
        course?: TableTypes<'course'>;
        chapters: Map<string, ChapterGroup>;
      }
    >();

    filtered.forEach((lesson) => {
      const meta = lessonMetaMap[lesson.id];
      if (!meta || !meta.chapterId) {
        return;
      }

      const key = `${meta.courseId}|${meta.courseName}|${meta.gradeName}`;

      if (!courseMap.has(key)) {
        courseMap.set(key, {
          courseId: meta.courseId,
          courseName: meta.courseName,
          gradeName: meta.gradeName,
          course: meta.course,
          chapters: new Map(),
        });
      }

      const group = courseMap.get(key)!;

      if (!group.chapters.has(meta.chapterId)) {
        group.chapters.set(meta.chapterId, {
          chapterId: meta.chapterId,
          chapterName: meta.chapterName,
          lessons: [],
        });
      }

      group.chapters.get(meta.chapterId)!.lessons.push(lesson);
    });

    const courseGroups: CourseGroup[] = Array.from(courseMap.values()).map(
      (group) => ({
        courseId: group.courseId,
        courseName: group.courseName,
        gradeName: group.gradeName,
        course: group.course,
        courseTitle: `${group.courseName} - ${group.gradeName}`.trim(),
        chapters: Array.from(group.chapters.values()),
      }),
    );

    return { courseGroups };
  }, [lessons, lessonMetaMap, searchTerm, isLoading]);

  return (
    <div id="search-lesson-container" className="search-lesson-container">
      <Header
        isBackButton
        onButtonClick={() => history.replace(PAGES.HOME_PAGE, { tabValue: 1 })}
        customText={t('Search') ?? 'Search'}
        schoolName={currentSchool?.name}
        className={currentClass?.name}
      />

      <main id="search-lesson-body" className="search-lesson-body">
        <div
          id="search-lesson-search-wrap"
          className="search-lesson-search-wrap"
        >
          <IonSearchbar
            ref={inputEl}
            id="search-lesson-bar"
            className="search-lesson-bar"
            placeholder={String(t('Search for a Lesson...'))}
            value={inputValue}
            onIonFocus={() => {
              setIsFocused(true);
              if (!inputValue.trim()) {
                setShowHistory(true);
              }
            }}
            onIonInput={(e) => {
              const value = e.detail.value ?? '';
              setInputValue(value);

              if (!value.trim()) {
                setLessons([]);
                setSearchTerm('');
                setShowHistory(true);
                return;
              }

              setShowHistory(false);
              triggerDebouncedSearch(value);
            }}
            onIonClear={() => {
              setInputValue('');
              setSearchTerm('');
              setLessons([]);
              setShowHistory(true);
            }}
          />
          {isFocused &&
            showHistory &&
            !inputValue.trim() &&
            searchHistory.length > 0 && (
              <div
                id="search-lesson-search-history"
                className="search-lesson-search-history-list"
              >
                {searchHistory.map((term, index) => (
                  <div
                    key={index}
                    id="search-lesson-history-item"
                    className="search-lesson-search-history-item"
                    onClick={() => {
                      setInputValue(term);
                      onSearch(term);
                      setShowHistory(false);
                    }}
                  >
                    {term}
                  </div>
                ))}
              </div>
            )}
        </div>

        {!showHistory && searchTerm.trim() && (
          <div
            id="search-lesson-result-text"
            className="search-lesson-result-text"
          >
            {t('Showing Results for')} "{searchTerm.trim()}"
          </div>
        )}

        {!isLoading && (
          <div id="search-lesson-results" className="search-lesson-results">
            {groupedLessons.courseGroups.length === 0 && searchTerm && (
              <div
                id="search-lessons-no-results"
                className="search-lessons-no-results"
              >
                {t('No results found')}
              </div>
            )}

            <ChapterWiseLessons
              courseGroups={groupedLessons.courseGroups}
              isLessonSelected={isLessonSelected}
              toggleLessonSelection={toggleLessonSelection}
              isChapterFullySelected={isChapterFullySelected}
              toggleChapterSelection={toggleChapterSelection}
              selectedLesson={selectedLesson}
              showAssignedBadge={true}
              assignedLessonIds={assignedLessonIds}
            />
          </div>
        )}

        <AssigmentCount
          assignments={assignmentCount}
          onClick={() => {
            history.push(PAGES.TEACHER_ASSIGNMENT);
          }}
        />
      </main>
    </div>
  );
};

export default SearchLesson;
