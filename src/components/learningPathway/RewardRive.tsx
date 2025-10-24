import { useEffect, useRef, useState } from "react";
import { useRive, Layout, Fit, Alignment, useStateMachineInput } from "@rive-app/react-canvas";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { RewardBoxState, SHOULD_SHOW_REMOTE_ASSETS } from "../../common/constants";


interface RewardRiveProps {
  rewardRiveState: RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST; 
}

export default function RewardRive({ rewardRiveState }: RewardRiveProps) {
  const should_show_remote_asset = (Capacitor.isNativePlatform() && localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS)==="true")? true : false;
  const [riveSrc, setRiveSrc] = useState<string>("/pathwayAssets/reward.riv");

  const { rive, RiveComponent } = useRive({
    src: should_show_remote_asset ? riveSrc : "/pathwayAssets/reward.riv",
    artboard: "Artboard",
    stateMachines: "State Machine 2",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const numberInput = useStateMachineInput(rive, "State Machine 2", "Number 1", 0);
  
  useEffect(() => {
    if (numberInput) {
      switch (rewardRiveState) {
        case RewardBoxState.IDLE:
          numberInput.value = 0;
          break;
        case RewardBoxState.SHAKING:
          numberInput.value = 1;
          break;
        case RewardBoxState.BLAST:
          numberInput.value = 2;
          break;
      }
    }
  }, [numberInput, rewardRiveState]);

  useEffect(() => {
    if (!should_show_remote_asset) return;

    const getRemoteRewardUrl = async () => {
      try {
        // Read the file content and convert to base64 data URL
        const fileContent = await Filesystem.readFile({
          directory: Directory.External,
          path: "remoteAsset/reward.riv"
        });
        
        if (fileContent.data) {
          // Convert to data URL that useRive can load
          const dataUrl = `data:application/octet-stream;base64,${fileContent.data}`;
          setRiveSrc(dataUrl);
        }
        // If no data or error, keep default local path
      } catch (error) {
        console.log("Error reading remote reward file, keeping local path:", error);
      }
    };

    getRemoteRewardUrl();
  }, [should_show_remote_asset]);


  return <RiveComponent key={riveSrc} style={{ width: "100%", height: "100%" }} />;
}
