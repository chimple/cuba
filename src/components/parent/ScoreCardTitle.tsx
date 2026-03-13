import { t } from "i18next";
import React from "react";
import "./ScoreCardTitle.css";

type ScoreCardTitleProps = {
  score: number;
};

type TitleVariant = {
  asset: string;
  message: string;
  mirrorRightIcon?: boolean;
};

const getTitleVariant = (score: number): TitleVariant => {
  if (score > 75) {
    return {
      asset: "assets/3starconfetti.svg",
      message: t("Congratulations!!"),
      mirrorRightIcon: true,
    };
  }

  if (score > 50) {
    return {
      asset: "assets/discoball.svg",
      message: t("Well done!"),
      mirrorRightIcon: true,
    };
  }

  if (score > 25) {
    return {
      asset: "assets/sparkle.svg",
      message: t("Good job!"),
    };
  }

  return {
    asset: "assets/heartballoon.svg",
    message: t("Keep learning!"),
  };
};

const ScoreCardTitle: React.FC<ScoreCardTitleProps> = ({ score }) => {
  const { asset, message, mirrorRightIcon } = getTitleVariant(score);

  return (
    <div
      className={`title-scoreCard ${
        score <= 25 ? "title-scoreCard-text-down" : ""
      }`}
    >
      <img alt="" className={`${score >75 ? "title-scoreCard-icon-3star":"title-scoreCard-icon"}`} src={asset} />
      <span>{message}</span>
      <img
        alt=""
        className={`${score >75 ? "title-scoreCard-icon-3star":"title-scoreCard-icon"} ${
          mirrorRightIcon ? " title-scoreCard-icon--mirror" : ""
        }`}
        src={asset}
      />
    </div>
  );
};

export default ScoreCardTitle;
