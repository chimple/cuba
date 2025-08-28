import { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";
import { useFeatureIsOn, useFeatureValue } from "@growthbook/growthbook-react";
import { CAN_ACCESS_REMOTE_CHIMPLE_RIVE, CHIMPLE_RIVE_ASSETS } from "../../common/constants";

export default function ChimpleRiveMascot() {

  const can_access_remote_chimple_rive = useFeatureIsOn(CAN_ACCESS_REMOTE_CHIMPLE_RIVE);
  const webAssets: { max: number; rive_asset_url: string } = useFeatureValue(CHIMPLE_RIVE_ASSETS, { max: 8, rive_asset_url: "/pathwayAssets/mascot_state_machine.riv" });
  const MIN = 1;
  const MAX = can_access_remote_chimple_rive ? (webAssets.max as number) : 8;

  const { rive, RiveComponent } = useRive({
    src: can_access_remote_chimple_rive ? webAssets.rive_asset_url : "/pathwayAssets/mascot_state_machine.riv",
    artboard: "Artboard",
    stateMachines: "State Machine 2",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const numberInput = useStateMachineInput(rive, "State Machine 2", "Number 1", MIN);
  // Get today's date and map to state 1-MAX
  const today = new Date();
  const day = today.getDate();
  const mappedState = ((day - 1) % MAX) + 1;
  const [value, setValue] = useState<number>(mappedState);

  useEffect(() => {
    try {
      if (numberInput && "value" in numberInput && typeof numberInput.value === 'number' && !isNaN(numberInput.value) && typeof value === "number" && !isNaN(value)) {
        numberInput.value = value;
      }
    } catch (error) {
      console.error("Failed to set numberInput value:", error);
    }
  }, [value, numberInput]);

  return <RiveComponent style={{ width: "100%", height: "100%" }} />;
}
