import { IonLoading, LoadingOptions } from "@ionic/react";
import React, { useEffect, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./SkeltonLoading.css";
import {
  HOMEHEADERLIST,
  IS_CONECTED,
  LEADERBOARDHEADERLIST,
  PAGES,
} from "../common/constants";
import { Util } from "../utility/util";
import { ServiceConfig } from "../services/ServiceConfig";

interface SkeltonLoadingProps {
  isLoading: boolean;
  header?: string;
  isChapter?: boolean;
}

const SkeltonLoading: React.FC<SkeltonLoadingProps> = ({
  isLoading,
  header,
  isChapter,
}) => {
  const [isLinked, setIsLinked] = useState(Boolean);
  var width = "56.66vh";
  var textWidth = "30vh";
  var subjectTextWidth = "18vh";
  var height = "40vh";
  const skeletonStyle = {
    borderRadius: "7vh",
    justifyContent: "center",
    alignItems: "center",
  };
  useEffect(() => {
    if (header == HOMEHEADERLIST.ASSIGNMENT) {
      const student = Util.getCurrentStudent();
      const conectedData = localStorage.getItem(IS_CONECTED);
      const parsedConectedData = conectedData ? JSON.parse(conectedData) : {};
      if (student) setIsLinked(parsedConectedData[student.docId]);
    }
    getCanShowAvatar();
  }, [header]);

  const getCanShowAvatar = async () => {
    const canShowAvatarValue = await Util.getCanShowAvatar();
    console.log("const canShowAvatarValue in home ", canShowAvatarValue);

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
          <div className="skelton-home-page-app-ba-div">
            <Skeleton className="skelton-home-page-app-bar" />
          </div>
        ) : null}
      </div>
    );
  }
  function skeltonLessonCards() {
    return (
      <>
        {[...Array(8)].map((_, index) => (
          <div
            key={index} // Don't forget to add a unique key for each mapped element
            className={
              header === HOMEHEADERLIST.SUBJECTS
                ? "skelton-subject-card-size"
                : "skelton-card-size"
            }
          >
            <div className="skelton-card-display">
              <Skeleton
                style={skeletonStyle}
                className={
                  header === HOMEHEADERLIST.SUBJECTS
                    ? "skelton-subject-card"
                    : "skelton-size-card"
                }
              />
              <Skeleton
                style={skeletonStyle}
                width={
                  header === HOMEHEADERLIST.SUBJECTS
                    ? subjectTextWidth
                    : textWidth
                }
              />
              {header === HOMEHEADERLIST.SUBJECTS ||
              header === PAGES.DISPLAY_CHAPTERS ? null : (
                <Skeleton style={skeletonStyle} width={textWidth} />
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
    console.log("function skeltonHome() { called");

    return (
      <div className="skelton-home-screen">
        <div id="skelton-home-screen-div">
          <img
            id="skelton-home-screen-char"
            src={"/assets/animation/chimple_avatar.png"}
            loading="lazy"
            alt=""
          />
        </div>
        {/* <Skeleton className="skelton-home-screen-avatar" /> */}
        {/* <Skeleton className="skelton-home-screen-diloag" /> */}
      </div>
    );
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
              <div>
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
};

export default SkeltonLoading;
