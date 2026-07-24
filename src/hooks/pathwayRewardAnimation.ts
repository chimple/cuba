import {
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  REWARD_LEARNING_PATH,
  RewardBoxState,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';

const CHIMPLE_MOVE_DURATION_MS = 2000;
const CHIMPLE_MOVE_FALLBACK_BUFFER_MS = 300;
const FINAL_PATHWAY_REWARD_AUDIO_DELAY_MS = 2500;
const FINAL_PATHWAY_REWARD_AUDIO_TIMEOUT_MS = 6000;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function waitForFinalPathwayRewardAudio(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  let didResolve = false;
  let resolveAudio = () => {};

  const resolve = () => {
    if (didResolve) return;
    didResolve = true;
    resolveAudio();
  };

  const promise = Promise.race([
    new Promise<void>((resolvePromise) => {
      resolveAudio = resolvePromise;
    }),
    delay(FINAL_PATHWAY_REWARD_AUDIO_TIMEOUT_MS).then(() => undefined),
  ]);

  return { promise, resolve };
}

function animateChimpleMovement({
  chimple,
  lessons,
  startIndex,
  currentIndex,
  xValues,
  startPoint,
  pathEndIndex,
  setIsRewardPathLoaded,
}: {
  chimple: SVGForeignObjectElement;
  lessons: any[];
  startIndex: number;
  currentIndex: number;
  xValues: number[];
  startPoint: DOMPoint;
  pathEndIndex: number;
  setIsRewardPathLoaded: (isLoaded: boolean) => void;
}): Promise<void> {
  if (!chimple) return Promise.resolve();

  if (currentIndex > pathEndIndex) {
    sessionStorage.removeItem(REWARD_LEARNING_PATH);
    setIsRewardPathLoaded(true);
    return Promise.resolve();
  }

  const currentLessonIndex = lessons.findIndex(
    (_: any, idx: number) => startIndex + idx === currentIndex,
  );
  if (currentLessonIndex < 0) return Promise.resolve();

  const previousLessonIndex = currentLessonIndex - 1;
  if (previousLessonIndex < 0) return Promise.resolve();

  const fromX = xValues[previousLessonIndex] ?? 0;
  const toX = xValues[currentLessonIndex] ?? 0;

  chimple.setAttribute('x', `${toX - 87}`);
  chimple.setAttribute('y', `${startPoint.y - 15}`);

  chimple.style.display = 'block';
  (chimple.style as any).transformBox = 'fill-box';
  chimple.style.transformOrigin = '0 0';
  chimple.style.willChange = 'transform';

  const fromTranslateX = fromX - 97 - (toX - 87);

  chimple.style.transition = 'none';
  chimple.style.transform = `translate(${fromTranslateX}px, 0px)`;
  void chimple.getBoundingClientRect();

  return new Promise((resolve) => {
    let hasResolved = false;
    const finishMovement = () => {
      if (hasResolved) return;
      hasResolved = true;
      window.clearTimeout(fallbackTimer);
      chimple.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === chimple && event.propertyName === 'transform') {
        finishMovement();
      }
    };
    const fallbackTimer = window.setTimeout(
      finishMovement,
      CHIMPLE_MOVE_DURATION_MS + CHIMPLE_MOVE_FALLBACK_BUFFER_MS,
    );

    chimple.addEventListener('transitionend', handleTransitionEnd);
    requestAnimationFrame(() => {
      chimple.style.transition = `transform ${CHIMPLE_MOVE_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
      chimple.style.transform = 'translate(0px, 0px)';
    });
  });
}

export async function runPathwayRewardAnimation({
  newRewardId,
  lessons,
  startIndex,
  currentIndex,
  svg,
  startPoint,
  xValues,
  chimple,
  pathEndIndex,
  completedLessonGlobalIndex,
  shouldSkipMascotMovement,
  shouldPlayFinalRewardAudioBeforeComplete,
  invokeMascotCelebration,
  onComplete,
  setHasTodayReward,
  setIsRewardPathLoaded,
  setRewardRiveContainer,
  setRewardRiveState,
  updateMascotToNormalState,
}: {
  newRewardId: string;
  lessons: any[];
  startIndex: number;
  currentIndex: number;
  svg: SVGSVGElement;
  startPoint: DOMPoint;
  xValues: number[];
  chimple: SVGForeignObjectElement;
  pathEndIndex: number;
  completedLessonGlobalIndex: number;
  shouldSkipMascotMovement: boolean;
  shouldPlayFinalRewardAudioBeforeComplete: boolean;
  invokeMascotCelebration: (stateNumber: number) => Promise<void>;
  onComplete?: () => void;
  setHasTodayReward: (val: boolean) => void;
  setIsRewardPathLoaded: (isLoaded: boolean) => void;
  setRewardRiveContainer: (el: HTMLDivElement | null) => void;
  setRewardRiveState: (state: RewardBoxState) => void;
  updateMascotToNormalState: (rewardId: string) => Promise<void>;
}) {
  const rewardRecord =
    await ServiceConfig.getI().apiHandler.getRewardById(newRewardId);
  if (!rewardRecord) return;
  const rewardStateValue = rewardRecord.state_number_input || 1;

  setHasTodayReward(false);

  const completedLessonIndex = lessons.findIndex(
    (_: unknown, idx: number) =>
      startIndex + idx === completedLessonGlobalIndex,
  );
  const destinationX =
    xValues[completedLessonIndex >= 0 ? completedLessonIndex : 0] ?? 0;

  const rewardForeignObject = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'foreignObject',
  );
  rewardForeignObject.setAttribute('width', '140');
  rewardForeignObject.setAttribute('height', '140');
  rewardForeignObject.setAttribute('x', '0');
  rewardForeignObject.setAttribute('y', '0');
  rewardForeignObject.style.display = 'block';
  (rewardForeignObject.style as any).transformBox = 'fill-box';
  rewardForeignObject.style.transformOrigin = '0 0';
  rewardForeignObject.style.willChange = 'transform';
  rewardForeignObject.style.backfaceVisibility = 'hidden';
  (rewardForeignObject.style as any).contain = 'layout paint style';

  const fromX = 570,
    fromY = 110;
  const toX = destinationX - 27,
    toY = startPoint.y - 69;
  const controlX = (fromX + toX) / 2,
    controlY = Math.min(fromY, toY) - 150;

  const duration = 4000;
  const start = performance.now();

  const easeInOutCubic = (val: number) =>
    val < 0.5 ? 4 * val * val * val : 1 - Math.pow(-2 * val + 2, 3) / 2;
  const bezier = (tVal: number, p0: number, p1: number, p2: number) =>
    (1 - tVal) ** 2 * p0 + 2 * (1 - tVal) * tVal * p1 + tVal ** 2 * p2;

  const onBoxArrival = async () => {
    setRewardRiveState(RewardBoxState.BLAST);

    await delay(2000);
    await invokeMascotCelebration(rewardStateValue);
    window.dispatchEvent(
      new CustomEvent(PATHWAY_REWARD_CELEBRATION_STARTED_EVENT, {
        detail: {
          rewardId: newRewardId,
          stateValue: rewardStateValue,
          forceRewardAudio: shouldPlayFinalRewardAudioBeforeComplete,
          dailyRewardAudioClipName: shouldPlayFinalRewardAudioBeforeComplete
            ? 'reward_02'
            : 'reward_01',
        },
      }),
    );

    await delay(500);
    rewardForeignObject.style.display = 'none';
    await delay(1000);
    await updateMascotToNormalState(newRewardId);
    await delay(500);

    if (!shouldSkipMascotMovement) {
      await animateChimpleMovement({
        chimple,
        lessons,
        startIndex,
        currentIndex,
        xValues,
        startPoint,
        pathEndIndex,
        setIsRewardPathLoaded,
      });
    }
    const finalRewardAudioWait = shouldPlayFinalRewardAudioBeforeComplete
      ? waitForFinalPathwayRewardAudio()
      : null;
    window.dispatchEvent(
      new CustomEvent(PATHWAY_REWARD_AUDIO_READY_EVENT, {
        detail: {
          rewardId: newRewardId,
          stateValue: rewardStateValue,
          forceRewardAudio: shouldPlayFinalRewardAudioBeforeComplete,
          dailyRewardAudioClipName: shouldPlayFinalRewardAudioBeforeComplete
            ? 'reward_02'
            : 'reward_01',
          onRewardAudioComplete: shouldPlayFinalRewardAudioBeforeComplete
            ? finalRewardAudioWait?.resolve
            : undefined,
        },
      }),
    );

    await Util.updateUserReward();
    if (finalRewardAudioWait) {
      await finalRewardAudioWait.promise;
      await delay(FINAL_PATHWAY_REWARD_AUDIO_DELAY_MS);
    }
    onComplete?.();
  };

  const animateBezier = (now: number) => {
    let t = (now - start) / duration;
    if (t > 1) t = 1;

    const easedT = easeInOutCubic(t);
    const x = bezier(easedT, fromX, controlX, toX);
    const y = bezier(easedT, fromY, controlY, toY);
    rewardForeignObject.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (t < 1) {
      requestAnimationFrame(animateBezier);
    } else {
      onBoxArrival();
    }
  };

  const rewardDiv = document.createElement('div');
  rewardDiv.style.width = '100%';
  rewardDiv.style.height = '100%';
  rewardForeignObject.appendChild(rewardDiv);
  svg.appendChild(rewardForeignObject);
  setRewardRiveContainer(rewardDiv);

  requestAnimationFrame(animateBezier);
}
