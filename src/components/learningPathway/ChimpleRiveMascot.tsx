import { useEffect, useRef, useState } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  useStateMachineInput,
} from '@rive-app/react-canvas';
import {
  CHIMPLE_RIVE_STATE_MACHINE_MAX,
  SHOULD_SHOW_REMOTE_ASSETS,
} from '../../common/constants';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import logger from '../../utility/logger';
import './ChimpleRiveMascot.css';

interface ChimpleRiveMascotProps {
  stateMachine?: string;
  animationName?: string;
  stateValue?: number;
  inputName?: string;
  onClick?: () => void;
  overlayRules?: Array<
    Required<Pick<ChimpleRiveMascotProps, 'stateMachine' | 'inputName'>>
  >;
}

interface RiveMascotCanvasProps extends ChimpleRiveMascotProps {
  src: string;
}

let lastNonSpeakingMascotProps: ChimpleRiveMascotProps | null = null;

function RiveMascotCanvas({
  src,
  stateMachine,
  animationName,
  stateValue,
  inputName,
}: RiveMascotCanvasProps) {
  const chimple_rive_state_machine_max = localStorage.getItem(
    CHIMPLE_RIVE_STATE_MACHINE_MAX,
  );
  const should_show_remote_asset =
    Capacitor.isNativePlatform() &&
    localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true'
      ? true
      : false;

  const CHIMPLE_RIVE_STATE_MIN = 1;
  const CHIMPLE_RIVE_STATE_MAX = should_show_remote_asset
    ? chimple_rive_state_machine_max
      ? parseInt(chimple_rive_state_machine_max, 10)
      : 8
    : 8;

  const { rive, RiveComponent } = useRive({
    src,
    artboard: 'Artboard',
    stateMachines: animationName ? undefined : stateMachine,
    animations: animationName ? [animationName] : undefined,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  const stateInputName = inputName ? inputName : 'Number 2';
  const numberInput = useStateMachineInput(
    rive,
    stateMachine,
    stateInputName,
    stateValue ? stateValue : CHIMPLE_RIVE_STATE_MIN,
  );
  // Get today's date and map to state 1-MAX
  const today = new Date();
  const day = today.getDate();
  const mappedState = ((day - 1) % CHIMPLE_RIVE_STATE_MAX) + 1;
  const [value] = useState<number>(stateValue ? stateValue : mappedState);

  useEffect(() => {
    if (animationName) return; // Don't set state machine input if using animation
    try {
      if (
        numberInput &&
        'value' in numberInput &&
        typeof numberInput.value === 'number' &&
        !isNaN(numberInput.value) &&
        typeof value === 'number' &&
        !isNaN(value)
      ) {
        numberInput.value = value;
      }
    } catch (error) {
      logger.error('Failed to set numberInput value:', error);
    }
  }, [value, numberInput, animationName]);

  return <RiveComponent style={{ width: '100%', height: '100%' }} />;
}

export default function ChimpleRiveMascot({
  stateMachine,
  animationName,
  stateValue,
  inputName,
  onClick,
  overlayRules,
}: ChimpleRiveMascotProps) {
  const mascotRootRef = useRef<HTMLDivElement | null>(null);
  const activeOverlayRules = overlayRules ?? [];
  const isOverlayMatch = activeOverlayRules.some(
    (rule) =>
      rule.stateMachine === stateMachine && rule.inputName === inputName,
  );
  const currentMascotProps = {
    stateMachine,
    animationName,
    stateValue,
    inputName,
  };
  if (!isOverlayMatch) lastNonSpeakingMascotProps = currentMascotProps;
  const should_show_remote_asset =
    Capacitor.isNativePlatform() &&
    localStorage.getItem(SHOULD_SHOW_REMOTE_ASSETS) === 'true'
      ? true
      : false;
  const defaultSrc = '/pathwayAssets/chimpleRive.riv';
  const [riveSrc, setRiveSrc] = useState<string | null>(
    should_show_remote_asset ? null : defaultSrc,
  );

  useEffect(() => {
    if (!should_show_remote_asset) {
      setRiveSrc(defaultSrc);
      return;
    }

    let isMounted = true;

    const getRemoteMascotUrl = async () => {
      try {
        // Read the file content and convert to base64 data URL
        const fileContent = await Filesystem.readFile({
          directory: Directory.External,
          path: 'remoteAsset/chimpleRive.riv',
        });

        if (fileContent.data) {
          // Convert to data URL that useRive can load
          const dataUrl = `data:application/octet-stream;base64,${fileContent.data}`;
          if (isMounted) {
            setRiveSrc(dataUrl);
          }
          return;
        }
        // If no data or error, keep default local path
        if (isMounted) {
          setRiveSrc(defaultSrc);
        }
      } catch (error) {
        logger.error(
          'Error reading remote mascot file, keeping local path:',
          error,
        );
        if (isMounted) {
          setRiveSrc(defaultSrc);
        }
      }
    };

    getRemoteMascotUrl();

    return () => {
      isMounted = false;
    };
  }, [defaultSrc, should_show_remote_asset]);

  useEffect(() => {
    if (!onClick) return;

    const isVisibleMascotPixelTap = (event: PointerEvent): boolean => {
      const mascotRoot = mascotRootRef.current;
      if (!mascotRoot) return false;

      const canvases = Array.from(
        mascotRoot.querySelectorAll('canvas'),
      ) as HTMLCanvasElement[];
      if (!canvases.length) return false;

      for (const canvas of canvases) {
        const rect = canvas.getBoundingClientRect();
        const insideRect =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!insideRect) continue;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx || !canvas.width || !canvas.height) continue;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pixelX = Math.floor((event.clientX - rect.left) * scaleX);
        const pixelY = Math.floor((event.clientY - rect.top) * scaleY);
        if (
          pixelX < 0 ||
          pixelY < 0 ||
          pixelX >= canvas.width ||
          pixelY >= canvas.height
        ) {
          continue;
        }

        try {
          const alpha = ctx.getImageData(pixelX, pixelY, 1, 1).data[3];
          if (alpha > 12) return true;
        } catch {
          // If pixel-read fails, do not trigger to avoid false positives.
          continue;
        }
      }

      return false;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isVisibleMascotPixelTap(event)) return;
      event.preventDefault();
      event.stopPropagation();
      onClick();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [onClick]);

  if (!riveSrc) return null;

  const baseMascotProps = lastNonSpeakingMascotProps ?? currentMascotProps;
  const renderMascot = (props: ChimpleRiveMascotProps) => (
    <RiveMascotCanvas
      src={riveSrc}
      stateMachine={props.stateMachine}
      inputName={props.inputName}
      stateValue={props.stateValue}
      animationName={props.animationName}
    />
  );

  if (isOverlayMatch && baseMascotProps?.stateMachine) {
    return (
      <div
        ref={mascotRootRef}
        id="chimple-mascot-overlay"
        className="chimple-mascot-overlay"
      >
        <div id="chimple-mascot-base-layer" className="chimple-mascot-layer">
          {renderMascot(baseMascotProps)}
        </div>
        <div id="chimple-mascot-active-layer" className="chimple-mascot-layer">
          {renderMascot(currentMascotProps)}
        </div>
      </div>
    );
  }

  return (
    <div ref={mascotRootRef} className="chimple-mascot-overlay">
      {renderMascot(currentMascotProps)}
    </div>
  );
}
