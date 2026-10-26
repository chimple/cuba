import { TableTypes } from '../../../common/constants';

export interface ServiceApiLiveQuiz {
  subscribeToClassTopic(): Promise<void>;

  updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void>;

  joinLiveQuiz(
    assignmentId: string,
    studentId: string,
  ): Promise<string | undefined>;

  liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void,
  ): void;

  removeLiveQuizChannel(): Promise<void>;

  getLiveQuizLessons(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]>;

  getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<TableTypes<'live_quiz_room'> | undefined>;

  assignmentUserListner(
    studentId: string,
    onDataChange: (roomDoc: TableTypes<'assignment_user'> | undefined) => void,
  ): void;

  assignmentListner(
    classId: string,
    onDataChange: (roomDoc: TableTypes<'assignment'> | undefined) => void,
  ): void;

  removeAssignmentChannel(): Promise<void>;
}
