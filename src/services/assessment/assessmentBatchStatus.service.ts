import { RESULT_STATUS } from '../../common/constants';

export type AssessmentBatchResultStatus = {
  status?: RESULT_STATUS | string | null;
};

export const CLOSED_ASSESSMENT_BATCH_RESULT_COUNT = 2;

export function isAssessmentBatchClosed(
  results: readonly AssessmentBatchResultStatus[],
): boolean {
  if (
    results.some(
      (result) => result.status === RESULT_STATUS.ASSESSMENT_TERMINATED,
    )
  ) {
    return true;
  }

  return (
    results.length >= CLOSED_ASSESSMENT_BATCH_RESULT_COUNT &&
    results
      .slice(0, CLOSED_ASSESSMENT_BATCH_RESULT_COUNT)
      .every((result) => result.status === RESULT_STATUS.SYSTEM_EXIT)
  );
}
