import LiveQuiz, { LIVE_QUIZ_QUESTION_TIME } from '../../models/LiveQuiz';

export const DEFAULT_LIVE_QUIZ_CONFIG = {
  data: [
    {
      options: [
        {
          text: 'Lion',
          isCorrect: true,
        },
        {
          text: 'Tiger',
        },
        {
          text: 'Elephant',
        },
        {
          text: 'Giraffe',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_1',
        text: 'Which animal is known as the king of the jungle?',
      },
      questionType: 'audio',
    },
    {
      options: [
        {
          text: 'Blue',
        },
        {
          text: 'Orange',
        },
        {
          text: 'red',
          isCorrect: true,
        },
        {
          text: 'Pink',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_2',
        text: ' What is the colour of an apple?',
      },
      questionType: 'text',
    },
    {
      options: [
        {
          text: '7',
          isCorrect: true,
        },
        {
          text: '8',
        },
        {
          text: '5',
        },
        {
          text: '6',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_3',
        text: 'How many days are there in a week?',
      },
      questionType: 'text',
    },
    {
      options: [
        {
          text: 'X',
        },
        {
          text: 'T',
        },
        {
          text: 'K',
          isCorrect: true,
        },
        {
          text: 'P',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_4',
        text: 'Fill in the blanks? H, I, J, _,L, M, N',
      },
      questionType: 'text',
    },
    {
      options: [
        {
          text: 'E,K,S,T,P',
        },
        {
          text: 'A,E,I,O,U',
          isCorrect: true,
        },
        {
          text: 'A,O,T,S,Y',
        },
        {
          text: 'O,I,V,Z,E',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_5',
        text: 'Which are vowels?',
      },
      questionType: 'text',
    },
    {
      options: [
        {
          text: 'Kitten',
          isCorrect: true,
        },
        {
          text: 'Puppy',
        },
        {
          text: 'Cub',
        },
        {
          text: 'Joey',
        },
      ],
      optionsType: 'text',
      question: {
        id: 'question_6',
        text: 'A baby cat is called _',
      },
      questionType: 'text',
    },
  ],

  type: 'multiOptions',
} as LiveQuiz;

export function calculateScoreForQuestion(
  correct: boolean,
  totalQuestions: number,
  timeSpent: number,
): number {
  if (!correct) return 0;
  const maxTotalScore = 100;
  const maxScoreForQuestion = maxTotalScore / totalQuestions;
  const baseScoreForQuestion = maxScoreForQuestion / 2;
  const timeScore = Math.max(
    0,
    maxScoreForQuestion / 2 -
      (maxScoreForQuestion / 2) * (timeSpent / LIVE_QUIZ_QUESTION_TIME),
  );
  const totalScoreForQuestion = baseScoreForQuestion + timeScore;
  return totalScoreForQuestion;
}
