import { IonLoading, LoadingOptions } from "@ionic/react";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./SkeltonLoading.css";
import {
  HOMEHEADERLIST,
  LEADERBOARDHEADERLIST,
  PAGES,
} from "../common/constants";

interface SkeltonLoadingProps {
  isLoading: boolean;
  header?: string;
  isLinked?: boolean;
}

const SkeltonLoading: React.FC<SkeltonLoadingProps> = ({
  isLoading,
  header,
  isLinked,
}) => {
  var width = "56.66vh";
  var textWidth = "30vh";
  var subjectTextWidth = "18vh";
  var height = "40vh";
  const skeletonStyle = {
    borderRadius: "7vh",
    justifyContent: "center",
    alignItems: "center",
  };
  switch (header) {
    case HOMEHEADERLIST.SEARCH:
      return isLoading ? (
        <div>
          <Skeleton className="skelton-search-bar" />
        </div>
      ) : null;
      break;
    case HOMEHEADERLIST.HOME:
      return isLoading ? skeltonHome() : null;
      break;
    case PAGES.DISPLAY_STUDENT:
      return isLoading ? skeltonDisplayStudents() : null;
      break;
    case LEADERBOARDHEADERLIST.LEADERBOARD:
      return isLoading ? skeltonLeaderBoard() : null;
      break;
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
        <div className="skelton-body-cards">
          {[...Array(8)].map((_, index) => (
            <div
              className={
                header == HOMEHEADERLIST.SUBJECTS
                  ? "skelton-subject-card-size"
                  : "skelton-card-size"
              }
            >
              <div className="skelton-card-display">
                <Skeleton
                  style={skeletonStyle}
                  className={
                    header == HOMEHEADERLIST.SUBJECTS
                      ? "skelton-subject-card"
                      : "skelton-size-card"
                  }
                />
                <Skeleton
                  style={skeletonStyle}
                  width={
                    header == HOMEHEADERLIST.SUBJECTS
                      ? subjectTextWidth
                      : textWidth
                  }
                />
                {header == HOMEHEADERLIST.SUBJECTS ? null : (
                  <Skeleton style={skeletonStyle} width={textWidth} />
                )}
              </div>
            </div>
          ))}
        </div>
        {header == HOMEHEADERLIST.SUGGESTIONS ? (
          <div className="skelton-home-page-app-ba-div">
            <Skeleton className="skelton-home-page-app-bar" />
          </div>
        ) : null}
      </div>
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
    return (
      <div className="skelton-home-screen">
        <Skeleton className="skelton-home-screen-avatar" />
        <Skeleton className="skelton-home-screen-diloag" />
      </div>
    );
  }
  function skeltonDisplayStudents() {
    return (
      <div className="skelton-display-students">
        
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name"/>
        </div>
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name"/>
        </div> 
        <div>
          <Skeleton circle className="skelton-student-profile" />
          <Skeleton className="skelton-leaderboard-avatar-name"/>
        </div>

      </div>
    );
  }
};

export default SkeltonLoading;
