import { generateTeacherAuthenticationChallenge } from './teacherAuthenticationChallenge';

const GENERATED_CHALLENGE_SAMPLE_SIZE = 100;
const MIN_FIRST_NUMBER = 10;
const MIN_SECOND_NUMBER = 10;
const MAX_TARGET_SUM = 99;

describe('generateTeacherAuthenticationChallenge', () => {
  test('generates addition challenges with a two-digit second number and two-digit sum', () => {
    for (let index = 0; index < GENERATED_CHALLENGE_SAMPLE_SIZE; index += 1) {
      const challenge = generateTeacherAuthenticationChallenge();
      const answer = challenge.firstNumber + challenge.secondNumber;

      expect(challenge.firstNumber).toBeGreaterThanOrEqual(MIN_FIRST_NUMBER);
      expect(challenge.secondNumber).toBeGreaterThanOrEqual(MIN_SECOND_NUMBER);
      expect(answer).toBeLessThanOrEqual(MAX_TARGET_SUM);
      expect(challenge.answer).toBe(String(answer));
    }
  });
});
