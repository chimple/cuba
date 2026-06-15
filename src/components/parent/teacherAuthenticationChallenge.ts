export interface TeacherAuthenticationChallenge {
  firstNumber: number;
  secondNumber: number;
  answer: string;
}

const MIN_FIRST_NUMBER = 10;
const MIN_SECOND_NUMBER = 10;
const MIN_TARGET_SUM = MIN_FIRST_NUMBER + MIN_SECOND_NUMBER;
const MAX_TARGET_SUM = 99;

const getRandomInteger = (minValue: number, maxValue: number): number => {
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
};

export const generateTeacherAuthenticationChallenge =
  (): TeacherAuthenticationChallenge => {
    const targetSum = getRandomInteger(MIN_TARGET_SUM, MAX_TARGET_SUM);
    const firstNumber = getRandomInteger(
      MIN_FIRST_NUMBER,
      targetSum - MIN_SECOND_NUMBER,
    );
    const secondNumber = targetSum - firstNumber;

    return {
      firstNumber,
      secondNumber,
      answer: String(targetSum),
    };
  };
