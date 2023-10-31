import { useEffect, useState } from "react";
import {
  Fit,
  Layout,
  StateMachineInput,
  useRive,
  useStateMachineInput,
} from "rive-react";

export default function ChimpleAvatarCharacterComponent({ style, userChoice }) {
  const State_Machine = "State Machine 1";
  // const inputName = "look_idle";

  const [riveCharHandsUp, setRiveCharHandsUp] = useState("Fail");

  const { rive, RiveComponent } = useRive({
    src: "/assets/animation/chimplecharacter.riv",
    stateMachines: State_Machine,
    layout: new Layout({ fit: Fit.Cover }),
    animations: riveCharHandsUp,
    autoplay: true,
  });
  const onclickInput = useStateMachineInput(
    rive,
    State_Machine,
    riveCharHandsUp
  );
  // console.log("riveCharHandsUp outside onclick", userChoice);
  useEffect(() => {
    console.log(
      "riveCharHandsUp inside useEffect",
      userChoice,
      riveCharHandsUp
    );
    // console.log("onclickInput", onclickInput);
    // console.log("rive", rive);
    // console.log("riveCharHandsUpriveCharHandsUp", riveCharHandsUp);
    if (onclickInput) {
      if (userChoice) {
        setRiveCharHandsUp("Success");
        // setTimeout(() => {
        onclickInput.fire();
        // }, 100);
        // onclickInput.fire();
      } else if (!userChoice) {
        setRiveCharHandsUp("Fail");
        onclickInput.fire();
      } else {
        setRiveCharHandsUp("Idle");
      }
      onclickInput.fire();
      // clickHandler && clickHandler();
    }

    userChoice = undefined;
    console.log("userChoice = undefined;", userChoice);
  }, [userChoice]);

  return (
    <RiveComponent
      style={style}
      onClick={(e) => {
        // console.log("riveCharHandsUp in onclick", userChoice);
        //   if (riveCharHandsUp === "Idle") {
        //     setRiveCharHandsUp("Success");
        //   } else if (riveCharHandsUp === "Success") {
        //     setRiveCharHandsUp("Fail");
        //   } else {
        //     setRiveCharHandsUp("Idle");
        //   }
        // onclickInput && onclickInput?.fire();
        // const randomNumber = Math.floor(Math.random() * 7) + 0;
        // console.log("RiveComponent onclick", randomNumber);
        // switch (randomNumber) {
        //   case 0:
        //     setRiveCharHandsUp("hands_up");
        //     break;
        //   case 1:
        //     setRiveCharHandsUp("hands_down");
        //     break;
        //   case 2:
        //     setRiveCharHandsUp("fail");
        //     break;
        //   case 3:
        //     setRiveCharHandsUp("success");
        //     break;
        //   case 4:
        //     setRiveCharHandsUp("look_idle");
        //     break;
        //   case 5:
        //     setRiveCharHandsUp("Look_down_right");
        //     break;
        //   case 6:
        //     setRiveCharHandsUp("Look_down_left");
        //     break;
        //   case 7:
        //     setRiveCharHandsUp("idle");
        //     break;
        //   default:
        //     break;
        // }
      }}
    ></RiveComponent>
  );
}
