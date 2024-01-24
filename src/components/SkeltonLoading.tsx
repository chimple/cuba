import { IonLoading, LoadingOptions } from "@ionic/react";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./SkeltonLoading.css";
import { HOMEHEADERLIST, LEADERBOARDHEADERLIST } from "../common/constants";

interface SkeltonLoadingProps {
  isLoading: boolean;
  header?: string;
}

const SkeltonLoading: React.FC<SkeltonLoadingProps> = ({
  isLoading,
  header,
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
    case LEADERBOARDHEADERLIST.LEADERBOARD:
      return isLoading ? skeltonLeaderBoard() : null;
      break;
    default:
      return isLoading ? (
        <div style={{ position: "relative", minHeight: "100vh" }}>
          <div
            style={{
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              {[...Array(8)].map((_, index) => (
                <div
                  className={
                    header == HOMEHEADERLIST.SUBJECTS
                      ? "skelton-subject-card-size"
                      : "skelton-card-size"
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Skeleton
                      style={skeletonStyle}
                      className={
                        header == HOMEHEADERLIST.SUBJECTS
                          ? "skelton-subject-card"
                          : "skelton-size-card"
                      }
                      // height={height}
                      // width={width}
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
          </div>
          {header == HOMEHEADERLIST.SUGGESTIONS ? (
            <div className="skelton-home-page-app-ba-div">
              <Skeleton
                className="skelton-home-page-app-bar"
                height="8vh"
                style={{ alignSelf: "center" }}
              />
            </div>
          ) : null}
        </div>
      ) : null;
  }
  return <></>;

  function skeltonLeaderBoard() {
    return (
      <div>
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
          </div>
          <Skeleton className="skelton-leaderboard-right" />
        </div>
      </div>
    );
  }
};

export default SkeltonLoading;
