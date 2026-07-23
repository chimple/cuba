import { FC } from 'react';
import { Capacitor } from '@capacitor/core';
import { HiSpeakerWave } from 'react-icons/hi2';
import LiveQuizNavigationDots from './LiveQuizNavigationDots';
import './LiveQuizQuestion.css';
import {
  LiveQuizQuestionProps,
  useLiveQuizQuestionFlow,
} from '../../hooks/useLiveQuizQuestionFlow';

const LiveQuizQuestion: FC<LiveQuizQuestionProps> = (props) => {
  const { isTimeOut, lessonId, showQuiz } = props;
  const {
    audio,
    canAnswer,
    correctAnswers,
    currentQuestionIndex,
    handleOptionSelect,
    liveQuizConfig,
    playLiveQuizAudio,
    quizPath,
    selectedAnswerIndex,
    selectedAnswers,
    showAnswer,
  } = useLiveQuizQuestionFlow(props);

  return (
    <div>
      <div
        className="live-quiz-navigation-dots"
        style={lessonId ? { paddingTop: '5vh', paddingBottom: '5vh' } : {}}
      >
        {isTimeOut && liveQuizConfig && currentQuestionIndex != null && (
          <LiveQuizNavigationDots
            totalDots={liveQuizConfig.data.length}
            currentDot={currentQuestionIndex}
            correctAnswers={correctAnswers}
            selectedAnswers={selectedAnswers}
          />
        )}
      </div>
      {showQuiz && liveQuizConfig && currentQuestionIndex != null && (
        <div>
          <div className="live-quiz-question">
            <div className="live-quiz-question-box">
              {(liveQuizConfig.data[currentQuestionIndex].question.audio ||
                liveQuizConfig.data[currentQuestionIndex].question.text) && (
                <div className="live-quiz-audio-button-question">
                  <HiSpeakerWave
                    onClick={(e) => {
                      e.stopPropagation();
                      playLiveQuizAudio(
                        liveQuizConfig.data[currentQuestionIndex].question,
                      );
                    }}
                    className={audio ? 'audio-playing' : ''}
                  />
                </div>
              )}
              <p id="question-text">
                {!liveQuizConfig.data[currentQuestionIndex]?.question
                  .isTextTTS &&
                  liveQuizConfig.data[currentQuestionIndex]?.question.text}
              </p>
              {liveQuizConfig.data[currentQuestionIndex]?.question.image && (
                <img
                  className="live-quiz-question-image"
                  src={
                    Capacitor.isNativePlatform()
                      ? quizPath +
                        '/' +
                        liveQuizConfig.data[currentQuestionIndex]?.question
                          .image
                      : liveQuizConfig.data[currentQuestionIndex]?.question
                          .image
                  }
                  alt=""
                />
              )}
            </div>
          </div>
          <div className="live-quiz-options">
            {liveQuizConfig.data[currentQuestionIndex]?.options.map(
              (option, index) => {
                return (
                  <div
                    key={index}
                    aria-disabled={!canAnswer}
                    onClick={async () => {
                      await handleOptionSelect(index);
                    }}
                    className={
                      'live-quiz-option-box ' +
                      (selectedAnswerIndex === index && !showAnswer
                        ? 'selected-option '
                        : '') +
                      (showAnswer
                        ? option.isCorrect
                          ? 'live-quiz-option-box-correct'
                          : selectedAnswerIndex === index
                            ? 'live-quiz-option-box-incorrect'
                            : ''
                        : '')
                    }
                  >
                    {(option.audio || option.text) && (
                      <div
                        className={
                          'live-quiz-audio-button-option ' +
                          (selectedAnswerIndex === index && !showAnswer
                            ? 'selected--option-audio-button'
                            : '')
                        }
                      >
                        <HiSpeakerWave
                          onClick={(e) => {
                            e.stopPropagation();
                            playLiveQuizAudio(option);
                          }}
                          className={audio ? 'audio-playing' : ''}
                        />
                      </div>
                    )}

                    {!option.isTextTTS && !option.image && option.text}
                    {option.image && (
                      <img
                        className="live-quiz-option-image"
                        src={
                          Capacitor.isNativePlatform()
                            ? quizPath + '/' + option.image
                            : option.image
                        }
                        alt=""
                      />
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveQuizQuestion;
