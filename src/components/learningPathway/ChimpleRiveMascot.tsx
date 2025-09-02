import { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";
import { CHIMPLE_RIVE_MAX, SHOULD_SHOW_REMOTE_ASSETS } from "../../common/constants";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export default function ChimpleRiveMascot() {

  const should_show_remote_asset = (Capacitor.isNativePlatform() && localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS)==="true")? true : false;

  const chimple_rive_max = localStorage.getItem(CHIMPLE_RIVE_MAX);
  const [riveSrc, setRiveSrc] = useState<string>("/pathwayAssets/mascot_state_machine.riv");

  const MIN = 1;
  const MAX = should_show_remote_asset
    ? (chimple_rive_max ? parseInt(chimple_rive_max, 10) : 8)
    : 8;

  const { rive, RiveComponent } = useRive({
    src: should_show_remote_asset? riveSrc : "/pathwayAssets/mascot_state_machine.riv",
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
    if (!should_show_remote_asset) return;

    const getRemoteMascotUrl = async () => {
      try {
        // Read the file content and convert to base64 data URL
        const fileContent = await Filesystem.readFile({
          directory: Directory.External,
          path: "remoteAsset/mascot_state_machine.riv"
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
    try {
      if (numberInput && "value" in numberInput && typeof numberInput.value === 'number' && !isNaN(numberInput.value) && typeof value === "number" && !isNaN(value)) {
        numberInput.value = value;
      }
    } catch (error) {
      console.error("Failed to set numberInput value:", error);
    }
  }, [value, numberInput]);

  return <RiveComponent key={riveSrc} style={{ width: "100%", height: "100%" }} />;
}
