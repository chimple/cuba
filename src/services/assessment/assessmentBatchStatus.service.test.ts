import { RESULT_STATUS } from '../../common/constants';
import { isAssessmentBatchClosed } from './assessmentBatchStatus.service';

describe('assessment batch status service', () => {
  test('closes a batch when an assessment termination result exists', () => {
    expect(
      isAssessmentBatchClosed([
        { status: RESULT_STATUS.ASSESSMENT_TERMINATED },
        { status: RESULT_STATUS.SYSTEM_EXIT },
      ]),
    ).toBe(true);
  });

  test('closes a batch after two latest system exits', () => {
    expect(
      isAssessmentBatchClosed([
        { status: RESULT_STATUS.SYSTEM_EXIT },
        { status: RESULT_STATUS.SYSTEM_EXIT },
      ]),
    ).toBe(true);
  });

  test('keeps a batch open for a single system exit', () => {
    expect(
      isAssessmentBatchClosed([{ status: RESULT_STATUS.SYSTEM_EXIT }]),
    ).toBe(false);
  });

  test('keeps a batch open after a completed result', () => {
    expect(
      isAssessmentBatchClosed([
        { status: RESULT_STATUS.COMPLETED },
        { status: RESULT_STATUS.SYSTEM_EXIT },
      ]),
    ).toBe(false);
  });
});
