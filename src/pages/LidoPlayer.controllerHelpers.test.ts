import { ASSESSMENT_FAIL_KEY, FAIL_STREAK_KEY } from '../common/constants';
import { createLidoPlayerControllerHelpers } from './LidoPlayer.controllerHelpers';

describe('createLidoPlayerControllerHelpers', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('does not carry an earlier assignment abort marker into a reassignment', async () => {
    const studentId = 'student-1';
    const previousAssignmentKey =
      'subject:subject-1:course:math:assignment:assignment-a';
    const reassignedAssessmentKey =
      'subject:subject-1:course:math:assignment:batch-b';
    localStorage.setItem(
      `${ASSESSMENT_FAIL_KEY}_${studentId}`,
      JSON.stringify({ [previousAssignmentKey]: true }),
    );
    localStorage.setItem(
      `${FAIL_STREAK_KEY}_${studentId}`,
      JSON.stringify({
        [previousAssignmentKey]: 4,
        [reassignedAssessmentKey]: 2,
      }),
    );

    const helpers = createLidoPlayerControllerHelpers({
      assessmentBatchId: 'batch-b',
      assignmentId: 'assignment-b',
      api: {
        hasPendingAbortedAssessment: jest.fn().mockResolvedValue(false),
      },
      courseDetail: { id: 'course-1' },
      courseDetailWithPathFields: {
        code: 'math',
        subject_id: 'subject-1',
      },
      isAssessmentLesson: true,
      previousAssessmentSkippedRef: { current: null },
    });

    expect(helpers.getAssessmentProgressKey()).toBe(reassignedAssessmentKey);
    expect(
      await helpers.shouldTerminateAssessmentPathway(
        studentId,
        reassignedAssessmentKey,
      ),
    ).toBe(false);

    localStorage.setItem(
      `${ASSESSMENT_FAIL_KEY}_${studentId}`,
      JSON.stringify({ [reassignedAssessmentKey]: true }),
    );
    expect(
      await helpers.shouldTerminateAssessmentPathway(
        studentId,
        reassignedAssessmentKey,
      ),
    ).toBe(true);
  });
});
