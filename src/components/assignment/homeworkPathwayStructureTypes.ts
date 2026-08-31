import { TableTypes } from '../../common/constants';

export interface HomeworkPathwayStructureProps {
  selectedSubject?: string | null;
  onHomeworkComplete?: () => void;
  onFinalHomeworkStickerComplete?: () => void;
}

export type HomeworkPathwayLesson = Partial<TableTypes<'lesson'>> & {
  chapter_id?: string | null;
  course_id?: string | null;
};

export interface HomeworkPathLessonItem {
  lesson: HomeworkPathwayLesson;
  course_id: string | null;
  chapter_id: string | null;
  assignment_id?: string | null;
  raw_assignment?: Partial<TableTypes<'assignment'>>;
}

export interface PendingHomeworkRewardTransition {
  completedIndex?: number;
  nextIndex?: number;
  pathSnapshot?: string;
}

export type HomeworkStoredPathItem = HomeworkPathLessonItem & {
  lesson_id?: string;
  subject_id?: string;
  id?: string;
};

export type DailyRewardAudioClipName = 'reward' | 'reward_01' | 'reward_02';
