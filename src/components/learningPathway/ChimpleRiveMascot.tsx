import { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";
import { CHIMPLE_RIVE_STATE_MACHINE_MAX, SHOULD_SHOW_REMOTE_ASSETS } from "../../common/constants";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

interface ChimpleRiveMascotProps {
  stateMachine?: string;
  animationName?: string;
  stateValue?: number;
  inputName?: string;
}

export default function ChimpleRiveMascot({ stateMachine, animationName, stateValue, inputName }: ChimpleRiveMascotProps) {

  const should_show_remote_asset = (Capacitor.isNativePlatform() && localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS)==="true")? true : false;

  const chimple_rive_state_machine_max = localStorage.getItem(CHIMPLE_RIVE_STATE_MACHINE_MAX);
  const [riveSrc, setRiveSrc] = useState<string>("/pathwayAssets/chimpleRive.riv");

  const CHIMPLE_RIVE_STATE_MIN = 1;
  const CHIMPLE_RIVE_STATE_MAX = should_show_remote_asset
    ? (chimple_rive_state_machine_max ? parseInt(chimple_rive_state_machine_max, 10) : 8)
    : 8;

  const { rive, RiveComponent } = useRive({
    src: should_show_remote_asset? riveSrc : "/pathwayAssets/chimpleRive.riv",
    artboard: "Artboard",
    stateMachines: animationName ? undefined : stateMachine,
    animations: animationName ? [animationName] : undefined,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  const stateInputName = inputName? inputName : "Number 2";
  const numberInput = useStateMachineInput(rive, stateMachine, stateInputName, stateValue ? stateValue : CHIMPLE_RIVE_STATE_MIN);
  // Get today's date and map to state 1-MAX
  const today = new Date();
  const day = today.getDate();
  const mappedState = ((day - 1) % CHIMPLE_RIVE_STATE_MAX) + 1;
  const [value, setValue] = useState<number>(stateValue ? stateValue : mappedState);

  useEffect(() => {
    if (!should_show_remote_asset) return;

    const getRemoteMascotUrl = async () => {
      try {
        // Read the file content and convert to base64 data URL
        const fileContent = await Filesystem.readFile({
          directory: Directory.External,
          path: "remoteAsset/chimpleRive.riv"
        });
        
        if (fileContent.data) {
          // Convert to data URL that useRive can load
          const dataUrl = `data:application/octet-stream;base64,${fileContent.data}`;
          setRiveSrc(dataUrl);
        }
        // If no data or error, keep default local path
      } catch (error) {
        console.log("Error reading remote mascot file, keeping local path:", error);
      }
    };

    getRemoteMascotUrl();
  }, [should_show_remote_asset]);

  useEffect(() => {
    if (animationName) return; // Don't set state machine input if using animation
    try {
      if (numberInput && "value" in numberInput && typeof numberInput.value === 'number' && !isNaN(numberInput.value) && typeof value === "number" && !isNaN(value)) {
        numberInput.value = value;
      }
    } catch (error) {
      console.error("Failed to set numberInput value:", error);
    }
  }, [value, numberInput, animationName]);

  return <RiveComponent key={riveSrc} style={{ width: "100%", height: "100%" }} />;
}
