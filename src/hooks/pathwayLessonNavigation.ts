import { parsePath } from 'history';

import { CONTINUE, LIVE_QUIZ, PAGES, SOURCE } from '../common/constants';
import { Util } from '../utility/util';

export function navigateToPathwayLesson({
  assessmentId,
  course,
  history,
  isAssessment,
  lesson,
  skillId,
  source = SOURCE.LEARNING_PATHWAY_HOME_NO_PAL,
}: {
  assessmentId?: string;
  course: any;
  history: any;
  isAssessment?: boolean;
  lesson: any;
  skillId?: string;
  source?: SOURCE;
}) {
  if (!history) return;

  const currentCourse = (window as any).__currentCourseForPathway__;
  const currentChapter = (window as any).__currentChapterForPathway__;

  if (lesson.plugin_type === LIVE_QUIZ) {
    history.replace({
      ...parsePath(PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`),
      state: {
        courseId: course.course_id,
        lesson: JSON.stringify(lesson),
        from: history.location.pathname + `?${CONTINUE}=true`,
        learning_path: true,
        skillId: skillId,
        is_assessment: isAssessment,
        source: source,
      },
    });
    return;
  }

  const playableLessonId = Util.getLessonBundleId(lesson);
  if (!playableLessonId) {
    return;
  }

  const p = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
  history.replace({
    ...parsePath(PAGES.LIDO_PLAYER + p),
    state: {
      lessonId: playableLessonId,
      courseDocId: course.course_id,
      course: JSON.stringify(currentCourse),
      lesson: JSON.stringify(lesson),
      chapter: JSON.stringify(currentChapter),
      from: history.location.pathname + `?${CONTINUE}=true`,
      learning_path: true,
      skillId: skillId,
      is_assessment: isAssessment,
      assessmentId: assessmentId,
      source: source,
    },
  });
}
