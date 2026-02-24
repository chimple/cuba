import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SearchLessons.css";
import Header from "../components/homePage/Header";
import { IonSearchbar } from "@ionic/react";
import { useHistory } from "react-router";
import {
  PAGES,
  TableTypes,
  AssignmentSource,
  SEARCH_LESSON_HISTORY,
  SEARCH_LESSON_CACHE_KEY,
} from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import AssigmentCount from "../components/library/AssignmentCount";
import { Util } from "../../utility/util";
import { t } from "i18next";
import SelectIconImage from "../../components/displaySubjects/SelectIconImage";
import ChapterWiseLessons from "../components/ChapterWiseLessons";

type LessonMeta = {
  chapterId: string | null;
  chapterName: string;
  courseId: string;
  courseName: string;
  gradeName: string;
  course?: TableTypes<"course">;
};

type ChapterGroup = {
  chapterId: string;
  chapterName: string;
  lessons: TableTypes<"lesson">[];
};

type CourseGroup = {
  courseId: string;
  courseName: string;
  gradeName: string;
  courseTitle: string;
  course?: TableTypes<"course">;
  chapters: ChapterGroup[];
};

const SearchLesson: React.FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;

  const currentSchool = Util.getCurrentSchool();
  const current_class = Util.getCurrentClass();

  const inputEl = useRef<HTMLIonSearchbarElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>([]);
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

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasRestoredRef = useRef(false);
  const OTHER_KEY = "other";

  useEffect(() => {
    const init = async () => {
      inputEl.current?.setFocus();

      const stored = JSON.parse(
        localStorage.getItem(SEARCH_LESSON_HISTORY) || "[]",
      );
      setSearchHistory(stored);

      const cached = localStorage.getItem(SEARCH_LESSON_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.searchTerm) {
            setSearchTerm(parsed.searchTerm);
            setLessons(parsed.lessons ?? []);
            setShowHistory(false);
          }
        } catch {}
      } else {
        setShowHistory(true);
      }

      await loadCart();
      hasRestoredRef.current = true;
    };

    init();
  }, []);

  const isLessonSelected = (chapterId: string, lessonId: string) => {
    const manual =
      classSelectedLesson.get(chapterId)?.[AssignmentSource.MANUAL] ?? [];
    const qr =
      classSelectedLesson.get(chapterId)?.[AssignmentSource.QR_CODE] ?? [];
    return manual.includes(lessonId) || qr.includes(lessonId);
  };
  const isChapterFullySelected = (
    chapterId: string,
    lessons: TableTypes<"lesson">[],
  ) => {
    if (!lessons.length) return false;

    return lessons.every((lesson) => isLessonSelected(chapterId, lesson.id));
  };

  const toggleLessonSelection = async (chapterId: string, lessonId: string) => {
    if (!current_class?.id) return;
    if (!hasRestoredRef.current) return;

    const user = await auth.getCurrentUser();
    if (!user?.id) return;

    const classId = current_class.id;

    const next = new Map(classSelectedLesson);
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
    setClassSelectedLesson(next);

    let total = 0;
    next.forEach((sourceMap) => {
      total +=
        (sourceMap[AssignmentSource.MANUAL]?.length || 0) +
        (sourceMap[AssignmentSource.QR_CODE]?.length || 0);
    });
    setAssignmentCount(total);

    const nextSelected = new Map(selectedLesson);

    // update for this class
    nextSelected.set(classId, JSON.stringify(Object.fromEntries(next)));

    const finalPayload = Object.fromEntries(nextSelected);

    setSelectedLesson(nextSelected);

    await api.createOrUpdateAssignmentCart(
      user.id,
      JSON.stringify(finalPayload),
    );
  };

  const toggleChapterSelection = async (
    chapterId: string,
    lessons: TableTypes<"lesson">[],
  ) => {
    if (!current_class?.id) return;
    if (!hasRestoredRef.current) return;

    const user = await auth.getCurrentUser();
    if (!user?.id) return;

    const classId = current_class.id;

    const next = new Map(classSelectedLesson);
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
    setClassSelectedLesson(next);

    // Recalculate count
    let total = 0;
    next.forEach((sourceMap) => {
      total +=
        (sourceMap[AssignmentSource.MANUAL]?.length || 0) +
        (sourceMap[AssignmentSource.QR_CODE]?.length || 0);
    });
    setAssignmentCount(total);

    // Sync backend
    const nextSelected = new Map(selectedLesson);

    // update for this class
    nextSelected.set(classId, JSON.stringify(Object.fromEntries(next)));

    const finalPayload = Object.fromEntries(nextSelected);

    setSelectedLesson(nextSelected);

    await api.createOrUpdateAssignmentCart(
      user.id,
      JSON.stringify(finalPayload),
    );
  };

  const loadCart = async () => {
    const user = await auth.getCurrentUser();
    if (!user?.id || !current_class?.id) return;

    const cart = await api.getUserAssignmentCart(user.id);
    if (!cart?.lessons) {
      setSelectedLesson(new Map());
      return;
    }

    const parsed = JSON.parse(cart.lessons);
    const fullMap = new Map<string, any>(Object.entries(parsed || {}));

    setSelectedLesson(fullMap);
    const classMap = parsed[current_class.id] || {};
    const map = new Map<string, Partial<Record<AssignmentSource, string[]>>>(
      Object.entries(classMap),
    );

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
  }, [lessons]);

  const buildMeta = async (
    lessonList: TableTypes<"lesson">[],
  ): Promise<Record<string, LessonMeta>> => {
    const nextMeta: Record<string, LessonMeta> = {};
    const chapterCache = new Map();
    const courseCache = new Map();
    const gradeCache = new Map();

    await Promise.all(
      lessonList.map(async (lesson) => {
        const rawChapterId = await api.getChapterByLesson(
          lesson.id,
          current_class?.id,
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

        let gradeName = "";
        if (course?.grade_id) {
          let grade = gradeCache.get(course.grade_id);
          if (!grade) {
            grade = await api.getGradeById(course.grade_id);
            gradeCache.set(course.grade_id, grade);
          }
          gradeName = grade?.name ?? "";
        }

        nextMeta[lesson.id] = {
          chapterId,
          chapterName: chapter?.name ?? "",
          courseId: chapter.course_id,
          courseName: course?.name ?? "",
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
      setSearchTerm("");
      setShowHistory(true);
      return;
    }

    try {
      setIsLoading(true);
      const results = await api.searchLessons(trimmed);
      setLessons(results ?? []);
      setSearchTerm(trimmed);
      saveSearchHistory(trimmed);
      setShowHistory(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearchHistory = (term: string) => {
    const updated = [term, ...searchHistory.filter((t) => t !== term)];
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_LESSON_HISTORY, JSON.stringify(updated));
  };

  const groupedLessons = useMemo(() => {
    if (isLoading || !Object.keys(lessonMetaMap).length) {
      return { courseGroups: [], otherLessons: [] };
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
        course?: TableTypes<"course">;
        chapters: Map<string, ChapterGroup>;
      }
    >();

    const otherLessons: TableTypes<"lesson">[] = [];

    filtered.forEach((lesson) => {
      const meta = lessonMetaMap[lesson.id];
      if (!meta || !meta.chapterId) {
        otherLessons.push(lesson);
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

    return { courseGroups, otherLessons };
  }, [lessons, lessonMetaMap, searchTerm, isLoading]);

  return (
    <div id="searchlessons-container" className="searchlessons-container">
      <Header
        isBackButton
        onButtonClick={() => history.replace(PAGES.HOME_PAGE, { tabValue: 1 })}
        showSchool
        showClass
        schoolName={currentSchool?.name}
        className={current_class?.name}
      />
      <main
        id="searchlessons-container-body"
        className="searchlessons-container-body"
      >
    <div
      id="searchlessons-searchbar-wrapper"
      className="searchlessons-searchbar-wrapper"
    >
      <IonSearchbar
      ref={inputEl}
      id="searchlessons-search-bar"
      className="searchlessons-search-bar"
      showClearButton="focus"
      showCancelButton="focus"
      placeholder={t("Search") ?? ""}
      value={searchTerm}

      onIonFocus={() => {
        setIsFocused(true);
        setShowHistory(true);
      }}

      onIonBlur={() => {
        setTimeout(() => {
          setIsFocused(false);
          setShowHistory(false);
        }, 150);
      }}

      onIonInput={(e) => {
        const value = e.detail.value ?? "";
        setSearchTerm(value);
        setShowHistory(true);
      }}

      onKeyDown={(ev) => {
        if (ev.key === "Enter") {
          onSearch(ev.currentTarget.value ?? "");
          //@ts-ignore
          ev.target?.blur();
          setIsFocused(false);
        }
      }}

      onIonClear={() => {
        setSearchTerm("");
        setLessons([]);
        setShowHistory(true);
      }}
    />

    {isFocused && searchHistory.length > 0 && (
        <div
          id="searchlessons-search-history-list"
          className="searchlessons-search-history-list"
        >
          {searchHistory.map((term, index) => (
            <div
              key={index}
              id="searchlessons-search-history-item"
              className="searchlessons-search-history-item"
              onClick={() => {
                setSearchTerm(term);
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
        <div
          id="searchlessons-grid-container"
          className="searchlessons-grid-container"
        >
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              id="searchlessons-grid-item"
              className="searchlessons-grid-item"
            >
              <div
                id="searchlessons-bottom-border"
                className="searchlessons-bottom-border"
              >
                <LessonComponent
                  lesson={lesson}
                  handleLessonCLick={() => {
                    history.replace(PAGES.LESSON_DETAILS, {
                      course: null,
                      lesson: lesson,
                      selectedLesson: selectedLesson,
                    });
                  }}
                  isSelButton={false}
                  handleSelect={() => {}}
                  isSelcted={true}
                />
              </div>
            </div>
          ))}
        </div>
        <AssigmentCount assignments={assignmentCount} onClick={() => {}} />
      </main>
    </div>
  );
};

export default SearchLesson;
