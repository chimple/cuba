import { IonCol } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './SkeltonLoading.css';
import {
  HOMEHEADERLIST,
  IS_CONECTED,
  LEADERBOARDHEADERLIST,
  PAGES,
} from '../common/constants';
import { Util } from '../utility/util';

interface SkeltonLoadingProps {
  isLoading: boolean;
  header?: string;
  isChapter?: boolean;
}
export const PATHWAY_STRUCTURE_SKELETON_HEADER = 'PATHWAY_STRUCTURE';

const SkeltonLoading: React.FC<SkeltonLoadingProps> = ({
  isLoading,
  header,
  isChapter,
}) => {
  const [isLinked, setIsLinked] = useState(Boolean);
  var width = '56.66vh';
  var textWidth = '30vh';
  var subjectTextWidth = '18vh';
  var height = '40vh';
  const skeletonStyle = {
    borderRadius: '7vh',
    justifyContent: 'center',
    alignItems: 'center',
  };
  useEffect(() => {
    if (header == HOMEHEADERLIST.ASSIGNMENT) {
      const student = Util.getCurrentStudent();
      const conectedData = localStorage.getItem(IS_CONECTED);
      const parsedConectedData = conectedData ? JSON.parse(conectedData) : {};
      if (student) setIsLinked(parsedConectedData[student.id]);
    }
    getCanShowAvatar();
  }, [header]);

  const getCanShowAvatar = async () => {
    const canShowAvatarValue = await Util.getCanShowAvatar();
    setCanShowAvatar(canShowAvatarValue);
  };
  const [canShowAvatar, setCanShowAvatar] = useState<boolean>();

  switch (header) {
    case HOMEHEADERLIST.SEARCH:
      return isLoading ? (
        <div>
          <Skeleton className="skelton-search-bar" />
        </div>
      ) : null;
      break;
    case HOMEHEADERLIST.HOME:
      return isLoading
        ? !!canShowAvatar
          ? skeltonHome()
          : skeltonSubjectCards()
        : null;
      break;
    case PAGES.DISPLAY_CHAPTERS:
      return isLoading ? skeltonDisplayChapters() : null;
      break;
    case PAGES.DISPLAY_STUDENT:
      return isLoading ? skeltonDisplayStudents() : null;
      break;
    case LEADERBOARDHEADERLIST.LEADERBOARD:
      return isLoading ? skeltonLeaderBoard() : null;
      break;
    case PAGES.LIVE_QUIZ_JOIN:
      return isLoading ? skeletonLiveQuizRoom() : null;
    case PAGES.STUDENT_PROGRESS:
      return isLoading ? skeletonStudentProgress() : null;
    case PAGES.SCHOOL_LIST:
      return isLoading ? skeletonSchoolList() : null;
    case PATHWAY_STRUCTURE_SKELETON_HEADER:
      return isLoading ? skeletonPathwayStructure() : null;
    default:
      return isLoading ? skeltonSubjectCards() : null;
  }
  return <></>;
  function skeltonSubjectCards() {
    return header == HOMEHEADERLIST.ASSIGNMENT && !isLinked ? (
      <div className="skelton-join-class-div">
        <Skeleton className="skelton-join-class" />
        <Skeleton className="skelton-join-class-button" />
      </div>
    ) : (
      <div className="skelton-body">
        <div className="skelton-body-cards">{skeltonLessonCards()}</div>
        {header == HOMEHEADERLIST.SUGGESTIONS ? (
          <div className="skelton-home-page-app-ba-div"></div>
        ) : null}
      </div>
    );
  }
  function skeltonLessonCards() {
    return (
      <>
        {[...Array(8)].map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={
              header === HOMEHEADERLIST.SUBJECTS
                ? 'skelton-subject-card-size'
                : 'skelton-card-size'
            }
          >
            <div className="skelton-card-display">
              <Skeleton
                key={`skeleton-main-${index}`}
                style={skeletonStyle}
                className={
                  header === HOMEHEADERLIST.SUBJECTS
                    ? 'skelton-subject-card'
                    : 'skelton-size-card'
                }
              />
              <Skeleton
                key={`skeleton-text-${index}`}
                style={skeletonStyle}
                width={
                  header === HOMEHEADERLIST.SUBJECTS
                    ? subjectTextWidth
                    : textWidth
                }
              />
              {header === HOMEHEADERLIST.SUBJECTS ||
              header === PAGES.DISPLAY_CHAPTERS ? null : (
                <Skeleton
                  key={`skeleton-extra-${index}`}
                  style={skeletonStyle}
                  width={textWidth}
                />
              )}
            </div>
          </div>
        ))}
      </>
    );
  }

  function skeltonLeaderBoard() {
    return (
      <div>
        <SkeletonTheme>
          <div className="skelton-leaderboard-header">
            <Skeleton className="skelton-back-button" />
            <Skeleton className="skelton-leaderboard-title" />
            <Skeleton className="skelton-leaderboard-title" />
            <Skeleton className="skelton-switch-user" />
          </div>
          <div className="skelton-leaderboard-body">
            <div className="skelton-leaderboard-left">
              <Skeleton className="skelton-leaderboard-dropdown" />
              <Skeleton circle className="skelton-leaderboard-avatar" />
              <Skeleton className="skelton-leaderboard-avatar-name" />
              <Skeleton
                className="skelton-leaderboard-avatar-details"
                count={4}
              />
            </div>
            <Skeleton className="skelton-leaderboard-right" />
          </div>
        </SkeletonTheme>
      </div>
    );
  }

  function skeltonHome() {
    return <div className="skelton-home-screen"></div>;
  }
  function skeltonDisplayStudents() {
    return (
      <div className="skelton-display-students">
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name" />
        </div>
      </div>
    );
  }
  function skeltonDisplayChapters() {
    return (
      <div>
        <div className="skelton-leaderboard-header">
          <Skeleton className="skelton-back-button" />
          <Skeleton className="skelton-subject-name" />
          {isChapter ? (
            <Skeleton className="skelton-grade-name" />
          ) : (
            <div></div>
          )}
        </div>
        {isChapter ? (
          <div className="skelton-display-chapters">
            {[...Array(30)].map((_, index) => (
              <div key={index}>
                <Skeleton className="skelton-chapter-icon" />
                <Skeleton className="skelton-chapter-name" />
              </div>
            ))}
          </div>
        ) : (
          <div className="skelton-body-cards">{skeltonLessonCards()}</div>
        )}
      </div>
    );
  }
  function skeletonLiveQuizRoom() {
    return (
      <div className="skelton-display-students">
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name" />
        </div>
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name" />
        </div>
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name" />
        </div>
      </div>
    );
  }
  function skeletonStudentProgress() {
    return (
      <div className="skeleton-progress-report">
        <IonCol>
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
        </IonCol>

        <IonCol>
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
          <Skeleton className="skeleton-student-lessonname" />
        </IonCol>

        <IonCol>
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
        </IonCol>

        <IonCol>
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
          <Skeleton className="skeleton-student-score" />
        </IonCol>
      </div>
    );
  }
  function skeletonSchoolList() {
    return (
      <div className="skeleton-school-list-wrapper">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="skeleton-rectangle"></Skeleton>
        ))}
      </div>
    );
  }
  function skeletonPathwayStructure() {
    const gradientId = 'pathwayFlowerSkeletonGradient';
    const petalAngles = [0, 60, 120, 180, 240, 300];
    // First flower transform is kept exactly as requested.
    // Coordinates adjusted slightly to keep flowers centered when scale is reduced.
    const flowerNodes = [
      { x: 16.5, y: 41.35, scale: 0.85 },
      { x: 166.1, y: 25.2, scale: 0.82 },
      { x: 277.7, y: 45.9, scale: 0.82 },
      { x: 390.8, y: 25.9, scale: 0.82 },
      { x: 510.9, y: 45.5, scale: 0.82 },
    ];

    const pathData = [
      'M70.8044 69.6535C101.195 69.6535 186.388 55.8228 200.836 54.9297',
      'M200.833 54.9282C215.281 54.0351 289.514 86.6065 312.431 86.6065',
      'M312.432 86.6051C335.35 86.6051 398.912 57.6055 420.543 57.6055',
      'M420.542 57.6055C440.969 57.6055 510.718 85.2651 535.628 85.2651',
      'M535.627 85.2676C560.537 85.2676 622.813 52.2534 640.25 55.3763',
    ];

    return (
      <div className="skeleton-pathway-wrapper">
        <svg
          className="skeleton-pathway-svg"
          width="95vw"
          viewBox="0 0 770 250"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="250"
              y2="0"
            >
              <stop offset="0%" stopColor="#cfd6db" />
              <stop offset="50%" stopColor="#eceff2" />
              <stop offset="100%" stopColor="#cfd6db" />
              <animate
                attributeName="x1"
                values="-250;770"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0;1020"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <mask id="pathwayMask">
              {/* Curved connection lines */}
              {pathData.map((d, i) => (
                <path
                  key={`path-mask-${i}`}
                  d={d}
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}

              {flowerNodes.map((node, index) => (
                <g
                  key={`flower-mask-group-${index}`}
                  transform={`translate(${node.x} ${node.y}) scale(${node.scale})`}
                >
                  {petalAngles.map((angle) => (
                    <ellipse
                      key={`petal-mask-${index}-${angle}`}
                      cx="38"
                      cy="12"
                      rx="11"
                      ry="18"
                      transform={`rotate(${angle} 38 38)`}
                      fill="white"
                      opacity="0.9"
                    />
                  ))}
                  <circle cx="38" cy="38" r="24" fill="white" />
                  {/* Inner circle slightly less opaque for depth */}
                  <circle cx="38" cy="38" r="17" fill="#cccccc" />
                </g>
              ))}

              {/* Reward block mask */}
              <g transform="translate(615 35)">
                <rect
                  width="60"
                  height="46"
                  rx="12"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            </mask>
          </defs>

          {/* Single shimmer rect masked by the entire pathway structure */}
          <rect
            width="100%"
            height="100%"
            fill={`url(#${gradientId})`}
            mask="url(#pathwayMask)"
          />
        </svg>
      </div>
    );
  }
};

export default SkeltonLoading;
