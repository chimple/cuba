import { FC } from "react";
import LiveQuizRoomObject from "../../models/liveQuizRoom";

const LiveQizHeader: FC<{ roomDoc: LiveQuizRoomObject }> = (props) => {
  if (!props.roomDoc) return <div></div>;
  return <div></div>;
};
export default LiveQizHeader;
