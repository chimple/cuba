import { FC, useState } from "react";
import { HiSpeakerWave } from "react-icons/hi2";
import ChimpleAvatarCharacterComponent from "./ChimpleAvatarCharacterComponent";
import AudioComponent from "./AudioButtonComponent";
import TextBoxWithAudioButton from "./TextBoxWithAudioButton";
import RectangularTextButton from "./RectangularTextButton";
import AvatarImageOption from "./AvatarImageOption";
import { ServiceConfig } from "../../services/ServiceConfig";

export enum AvatarModes {
  ChapterSugestion,
  LessonSugestion,
  TwoOptionQuestion,
  FourOptionQuestion,
  ShowDailyProgress,
  // scores >= 70
  GoodProgress,

  // scores < 70
  BadProgress,
}

const ChimpleAvatarPage: FC<{
  style;
}> = ({ style }) => {
  // const COMMON_AUDIOS = [
  //   "let_us_start_our_learning_journey",
  //   "may_i_help_you",
  //   "my_name_is_chimple",
  //   "i_am_hungry",
  // ];

  // const ACHIEVEMENT_AUDIOS = [
  //   "congratulations",
  //   "excellent",
  //   "you_are_getting_better",
  //   "i_enjoyed_eating",
  // ];

  // const NONACHIEVEMENT_AUDIOS = ["try_again", "may_i_help_you"];

  // const questions_list_from_remote = [
  //   ["mode", "question", "image", "answer", "chocie 1", "chocie 2"],
  //   [
  //     AvatarModes.TwoOptionQuestion,
  //     "Guess the animal",
  //     "tiger.png",
  //     "tiger",
  //     "Lion",
  //     "tiger",
  //   ],
  // ];

  // let avatarCurrentMode;
  // let avatarInfo;
  // let avatarAudio;

  // // async function inti() {
  // //   avatarInfo = await ServiceConfig.getI().apiHandler.getAvatarInfo();
  // // }

  // switch (avatarCurrentMode) {
  //   case AvatarModes.ChapterSugestion:
  //     //Set Default Audio
  //     avatarAudio = "let_us_start_our_learning_journey";
  //     break;

  //   case AvatarModes.LessonSugestion:
  //     //Set Default Audio
  //     avatarAudio = "let_us_start_our_learning_journey";
  //     break;
  //   case AvatarModes.GoodProgress:
  //     avatarAudio =
  //       ACHIEVEMENT_AUDIOS[
  //         Math.floor(Math.random() * ACHIEVEMENT_AUDIOS.length)
  //       ];

  //     break;
  //   case AvatarModes.BadProgress:
  //     avatarAudio =
  //       NONACHIEVEMENT_AUDIOS[
  //         Math.floor(Math.random() * NONACHIEVEMENT_AUDIOS.length)
  //       ];
  //     break;
  //   case AvatarModes.TwoOptionQuestion:
  //     avatarAudio = "answer_the_following_question";
  //     let currentQuestion = questions_list_from_remote[1];
  //     break;
  // }

  return (
    <div style={style}>
      <ChimpleAvatarCharacterComponent
        style={{
          height: "50vh",
          width: "25vw",
        }}
      ></ChimpleAvatarCharacterComponent>
      <div
        style={{
          height: "50vh",
          width: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <TextBoxWithAudioButton
          message={"Hi! welcome to Chimple"}
        ></TextBoxWithAudioButton>
        <AvatarImageOption
          imageWidth={80}
          imageSrc={
            "https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"
          }
        ></AvatarImageOption>
        <RectangularTextButton
          buttonWidth={20}
          buttonHeight={5}
          text={"button"}
          fontSize={3}
          onHeaderIconClick={() => {
            console.log("Text Button clicked ");
          }}
        ></RectangularTextButton>
      </div>
    </div>
  );
};

export default ChimpleAvatarPage;
