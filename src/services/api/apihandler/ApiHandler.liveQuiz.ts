import { ApiHandlerClassroom } from './ApiHandler.classroom';
import { TableTypes } from '../../../common/constants';

export class ApiHandlerLiveQuiz extends ApiHandlerClassroom {
  subscribeToClassTopic() {
    return this.s.subscribeToClassTopic();
  }

  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void> {
    return this.s.updateLiveQuiz(
      roomDocId,
      studentId,
      questionId,
      timeSpent,
      score,
    );
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string,
  ): Promise<string | undefined> {
    return this.s.joinLiveQuiz(assignmentId, studentId);
  }

  liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void,
  ): void {
    return this.s.liveQuizListener(liveQuizRoomDocId, onDataChange);
  }

  async removeLiveQuizChannel() {
    return await this.s.removeLiveQuizChannel();
  }

  async getLiveQuizLessons(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    return this.s.getLiveQuizLessons(classId, studentId);
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<TableTypes<'live_quiz_room'> | undefined> {
    return await this.s.getLiveQuizRoomDoc(liveQuizRoomDocId);
  }

  assignmentUserListner(
    student_id: string,
    onDataChange: (roomDoc: TableTypes<'assignment_user'> | undefined) => void,
  ): void {
    return this.s.assignmentUserListner(student_id, onDataChange);
  }

  assignmentListner(
    class_id: string,
    onDataChange: (roomDoc: TableTypes<'assignment'> | undefined) => void,
  ): void {
    return this.s.assignmentListner(class_id, onDataChange);
  }

  removeAssignmentChannel() {
    return this.s.removeAssignmentChannel();
  }
}
