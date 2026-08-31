import React, { useEffect, useState } from 'react';
import { IonPage, IonRow, IonContent } from '@ionic/react';
import './LiveQuizLeaderBoard.css';
import { ServiceConfig } from '../services/ServiceConfig';
import StudentAvatar from '../components/common/StudentAvatar';
import { PAGES, TableTypes } from '../common/constants';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import NextButton from '../components/common/NextButton';
import { Util } from '../utility/util';
import logger from '../utility/logger';

type ParticipantScore = {
  studentDocId: string;
  totalScore: number;
  totalTimeSpent?: number;
};

type QuizResultEntry = {
  score: number;
  timeSpent: number;
  question_id: string;
};

const LiveQuizLeaderBoard: React.FC = () => {
  const [combinedStudentScores, setCombinedStudentScores] = useState<
    ParticipantScore[]
  >([]);
  const [students, setStudents] = useState(
    new Map<string, TableTypes<'user'>>(),
  );
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramLiveRoomId = urlSearchParams.get('liveRoomId') ?? '';
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  let resultData: TableTypes<'result'>[] | null = [];
  let userData: TableTypes<'user'>[] | null = [];
  useEffect(() => {
    Util.loadBackgroundImage();
    init();
  }, []);

  const init = async () => {
    try {
      const liveQuizRoomDoc = await api.getLiveQuizRoomDoc(paramLiveRoomId);
      const liveQuizRoomResults = liveQuizRoomDoc?.results;
      const studentResults: ParticipantScore[] = [];
      if (!!liveQuizRoomResults) {
        const roomResults = liveQuizRoomResults as Record<
          string,
          QuizResultEntry[]
        >;
        Object.keys(roomResults).forEach((studentDocId) => {
          const studentResult = roomResults[studentDocId];
          const { totalScore, totalTimeSpent } = studentResult.reduce(
            (
              acc: { totalScore: number; totalTimeSpent: number },
              question: QuizResultEntry,
            ) => {
              acc.totalScore += question.score;
              acc.totalTimeSpent += question.timeSpent;
              return acc;
            },
            { totalScore: 0, totalTimeSpent: 0 },
          );

          studentResults.push({
            studentDocId,
            totalScore,
            totalTimeSpent,
          });
        });

        const liveQuizRoomScores: ParticipantScore[] = studentResults;
        const leaderboardScores = await fetchAssignmentResults();

        const combinedScores = combineScores(
          liveQuizRoomScores,
          leaderboardScores ?? [],
        );
        combinedScores.sort((a, b) => b.totalScore - a.totalScore);
        setCombinedStudentScores(combinedScores);
        const tempStudentsMap = new Map<string, TableTypes<'user'>>();
        await Promise.all(
          combinedScores.map(async (participant) => {
            if (!!userData) {
              for (let user of userData) {
                if (participant.studentDocId === user.id) {
                  tempStudentsMap.set(participant.studentDocId, user);
                }
              }
            }
          }),
        );
        setStudents(tempStudentsMap);
      }
    } catch (error) {
      logger.error(
        '🚀 ~ file:LiveQuizLeaderBoard.tsx:80~Error fetching liveQuiz room data:',
        error,
      );
    }
  };
  const fetchAssignmentResults = async () => {
    const res = await api.getLiveQuizRoomDoc(paramLiveRoomId);
    if (res) {
      const assignmentId = res?.assignment_id;
      const assignmentDoc = await api.getAssignmentById(assignmentId);
      let scoresData: ParticipantScore[] = [];

      if (assignmentDoc) {
        const results = await api.getStudentResultsByAssignmentId(
          assignmentDoc?.id,
        );
        userData = results[0].user_data;
        resultData = results[0].result_data;
        const playedStudentIds = [
          ...new Set(resultData.map((result) => result.student_id)),
        ].filter((studentId): studentId is string => Boolean(studentId));

        scoresData = playedStudentIds.map((studentDocId) => {
          const totalScore = resultData
            ?.filter((data) => data.student_id === studentDocId)
            .reduce((sum, data) => sum + (data.score || 0), 0);

          return {
            studentDocId,
            totalScore: totalScore ?? 0,
          };
        });
      }
      return scoresData;
    }
    return [];
  };
  const combineScores = (
    roomResultScores: ParticipantScore[],
    leaderboardScores: ParticipantScore[],
  ): ParticipantScore[] => {
    const uniqueStudentDocIds = Array.from(
      new Set([
        ...roomResultScores.map((res: ParticipantScore) => res.studentDocId),
        ...leaderboardScores.map((res: ParticipantScore) => res.studentDocId),
      ]),
    );

    const combinedScores = uniqueStudentDocIds
      .map((studentDocId) => {
        const roomResultScore = roomResultScores.find(
          (res: ParticipantScore) => res.studentDocId === studentDocId,
        );
        const leaderboardScore = leaderboardScores.find(
          (res: ParticipantScore) => res.studentDocId === studentDocId,
        );
        if (!!roomResultScore && !!leaderboardScore) {
          return {
            studentDocId,
            totalScore: roomResultScore.totalScore,
          };
        } else {
          return roomResultScore || leaderboardScore;
        }
      })
      .filter((score): score is ParticipantScore => Boolean(score));

    return combinedScores;
  };

  return (
    <IonPage>
      <IonContent className="livequiz-leaderboard-page-content">
        <div className="livequiz-leaderboard">
          <div className="leaderboard-header">
            <div className="empty"></div>

            <p className="header-name">{t('Live Quiz Leaderboard')}</p>
            <div id="leaderboard-next-button">
              <NextButton
                onClicked={() => {
                  history.replace(PAGES.HOME);
                }}
                disabled={false}
              />
            </div>
          </div>
          <div className="leaderboard-header-row">
            <div>{t('Rank')}</div>
            <div>{t('Name')}</div>
            <div>{t('Score')}</div>
          </div>
        </div>
        <div className="leaderboard-container">
          {combinedStudentScores
            .filter((scoreData: ParticipantScore) =>
              students.has(scoreData.studentDocId),
            )
            .map((scoreData: ParticipantScore, index: number) => (
              <IonRow
                key={index}
                className={`leaderboard-row ${
                  index % 2 === 0 ? 'even' : 'odd'
                }`}
              >
                <div className="rank-column">{index + 1}</div>
                <div className="name-column">
                  <StudentAvatar
                    student={students.get(scoreData.studentDocId)!}
                    onClicked={() => {}}
                    width={50}
                    namePosition="right"
                  />
                </div>
                <div className="score-column">
                  {Math.round(scoreData.totalScore)}
                </div>
              </IonRow>
            ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LiveQuizLeaderBoard;
