import { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";

const MIN = 1;
const MAX = 8;

export default function ChimpleRiveMascot() {
  const { rive, RiveComponent } = useRive({
    src: "/pathwayAssets/mascot_state_machine.riv",
    artboard: "Artboard",
    stateMachines: "State Machine 2",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const numberInput = useStateMachineInput(rive, "State Machine 2", "Number 1", 1);
  // Get today's date and map to state 1-8
  const today = new Date();
  const day = today.getDate();
  const mappedState = ((day - 1) % MAX) + 1; 
  const [value, setValue] = useState<number>(1);

  useEffect(() => {
    try {
      if (numberInput && "value" in numberInput && typeof value === "number" && !isNaN(value)) {
        numberInput.value = value;
      }
    } catch (error) {
      console.error("Failed to set numberInput value:", error);
    }
  }, [value, numberInput]);


  return (
      <RiveComponent style={{ width: "100%", height: "100%" }} />
  );
}
