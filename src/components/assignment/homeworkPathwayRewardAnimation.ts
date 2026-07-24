import {
  HOMEWORK_PATHWAY,
  PATHWAY_REWARD_AUDIO_READY_EVENT,
  PATHWAY_REWARD_CELEBRATION_STARTED_EVENT,
  REWARD_LEARNING_PATH,
  RewardBoxState,
} from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { hasPendingHomeworkStickerFlow } from '../../utility/homeworkStickerFlow';

export async function runHomeworkPathwayRewardAnimation(params: any) {
  const {
    api, chimple, completedRewardIndex, currentIndex, delay,
    FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS, FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
    HOMEWORK_REWARD_COMPLETED_INDEX_KEY, invokeMascotCelebration, lessons,
    lessonsToRender, MASCOT_X_OFFSET, newRewardId, onComplete, pathEndIndex,
    PENDING_HOMEWORK_REWARD_TRANSITION_KEY, REWARD_FLIGHT_ARC_Y_OFFSET,
    REWARD_FLIGHT_DURATION_MS, REWARD_FLIGHT_TARGET_X_OFFSET, reloadHomeworkPathway,
    setHasTodayReward, setIsRewardPathLoaded, setRewardRiveContainer,
    setRewardRiveState, shouldPlayFinalRewardAudioBeforeComplete, slotXValues,
    startIndex, startIndexOffset, startPoint, svg, updateMascotToNormalState,
  } = params;

  const animateChimpleMovement = () => {
    if (!chimple) return;
    const mascotElement = chimple;
    if (currentIndex > pathEndIndex) {
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
      setIsRewardPathLoaded(true);
      return;
    }
    const currentLessonIndex = lessons.findIndex(
      (_: unknown, idx: number) => startIndex + idx === currentIndex,
    );
    if (currentLessonIndex < 0) return;
    const previousLessonIndex =
      typeof completedRewardIndex === 'number'
        ? completedRewardIndex
        : currentLessonIndex - 1;
    if (previousLessonIndex < 0) return;

    const fromPathIndex = startIndexOffset + previousLessonIndex;
    const toPathIndex = startIndexOffset + currentLessonIndex;

    const fromSlotX = slotXValues[fromPathIndex] ?? 0;
    const toSlotX = slotXValues[toPathIndex] ?? 0;

    const fromMascotX = fromSlotX + MASCOT_X_OFFSET;
    const toMascotX = toSlotX + MASCOT_X_OFFSET;

    mascotElement.setAttribute('x', `${toMascotX}`);
    let chimpleAnimY = startPoint.y - 12;
    if (window.innerWidth <= 1024) {
      chimpleAnimY -= 12;
    }
    mascotElement.setAttribute('y', `${chimpleAnimY}`);

    mascotElement.style.display = 'block';
    (
      mascotElement.style as CSSStyleDeclaration & {
        transformBox?: string;
      }
    ).transformBox = 'fill-box';
    mascotElement.style.transformOrigin = '0 0';
    mascotElement.style.willChange = 'transform';
    const fromTranslateX = fromMascotX - toMascotX;
    mascotElement.style.transition = 'none';
    mascotElement.style.transform = `translate(${fromTranslateX}px, 0px)`;
    void mascotElement.getBoundingClientRect();
    return new Promise<void>((resolve) => {
      let hasResolved = false;
      const finishMovement = () => {
        if (hasResolved) return;
        hasResolved = true;
        window.clearTimeout(fallbackTimer);
        mascotElement.removeEventListener(
          'transitionend',
          handleTransitionEnd,
        );
        resolve();
      };
      const handleTransitionEnd = (event: TransitionEvent) => {
        if (
          event.target === mascotElement &&
          event.propertyName === 'transform'
        )
          finishMovement();
      };
      const fallbackTimer = window.setTimeout(finishMovement, 2400);

      mascotElement.addEventListener(
        'transitionend',
        handleTransitionEnd,
      );
      requestAnimationFrame(() => {
        mascotElement.style.transition =
          'transform 2000ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        mascotElement.style.transform = 'translate(0px, 0px)';
      });
    });
  };

  const waitForFinalHomeworkRewardAudio = (): {
    promise: Promise<void>;
    resolve: () => void;
  } => {
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
      delay(FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS).then(() => undefined),
    ]);

    return { promise, resolve };
  };

  const runRewardAnimation = async (
    newRewardId: string,
    shouldPlayFinalRewardAudioBeforeComplete: boolean,
    onComplete?: () => void,
  ) => {
    // If offline, this might fail, wrap in try/catch or skip if no internet
    try {
      const rewardRecord = await api.getRewardById(newRewardId);
      if (!rewardRecord) return;
      setHasTodayReward(false);
      const rewardStateValue = rewardRecord.state_number_input || 1;
      const completedLessonIndex =
        typeof completedRewardIndex === 'number'
          ? completedRewardIndex
          : lessons.findIndex(
              (_: unknown, idx: number) =>
                startIndex + idx === currentIndex - 1,
            );
      if (completedLessonIndex < 0) {
        sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
        sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
        return;
      }
      const isFinalRewardTransition =
        completedLessonIndex + 1 >= lessonsToRender.length;

      const completedLessonPathIndex =
        startIndexOffset + completedLessonIndex;
      const destinationX = slotXValues[completedLessonPathIndex] ?? 0;

      const rewardForeignObject = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject',
      );
      rewardForeignObject.setAttribute('width', '140');
      rewardForeignObject.setAttribute('height', '140');
      rewardForeignObject.setAttribute('x', '0');
      rewardForeignObject.setAttribute('y', '0');
      rewardForeignObject.style.display = 'block';
      (
        rewardForeignObject.style as CSSStyleDeclaration & {
          transformBox?: string;
          contain?: string;
        }
      ).transformBox = 'fill-box';
      rewardForeignObject.style.transformOrigin = '0 0';
      rewardForeignObject.style.willChange = 'transform';
      rewardForeignObject.style.backfaceVisibility = 'hidden';
      (
        rewardForeignObject.style as CSSStyleDeclaration & {
          transformBox?: string;
          contain?: string;
        }
      ).contain = 'layout paint style';
      const fromX = 570,
        fromY = 110;
      const toX = destinationX + REWARD_FLIGHT_TARGET_X_OFFSET,
        toY = startPoint.y - 69;
      const controlX = (fromX + toX) / 2,
        controlY = Math.min(fromY, toY) - REWARD_FLIGHT_ARC_Y_OFFSET;
      const duration = REWARD_FLIGHT_DURATION_MS;
      const start = performance.now();
      const easeInOutCubic = (val: number) =>
        val < 0.5
          ? 4 * val * val * val
          : 1 - Math.pow(-2 * val + 2, 3) / 2;
      const bezier = (tVal: number, p0: number, p1: number, p2: number) =>
        (1 - tVal) ** 2 * p0 +
        2 * (1 - tVal) * tVal * p1 +
        tVal ** 2 * p2;
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
              dailyRewardAudioClipName:
                shouldPlayFinalRewardAudioBeforeComplete
                  ? 'reward_02'
                  : 'reward',
            },
          }),
        );
        await delay(500);
        rewardForeignObject.style.display = 'none';
        await delay(1000);
        await updateMascotToNormalState(newRewardId);
        await delay(500);
        sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
        sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
        if (isFinalRewardTransition) {
          localStorage.removeItem(HOMEWORK_PATHWAY);
          if (!hasPendingHomeworkStickerFlow()) {
            reloadHomeworkPathway();
          }
        } else {
          await animateChimpleMovement();
        }
        const finalRewardAudioWait =
          shouldPlayFinalRewardAudioBeforeComplete
            ? waitForFinalHomeworkRewardAudio()
            : null;
        window.dispatchEvent(
          new CustomEvent(PATHWAY_REWARD_AUDIO_READY_EVENT, {
            detail: {
              rewardId: newRewardId,
              stateValue: rewardStateValue,
              forceRewardAudio: shouldPlayFinalRewardAudioBeforeComplete,
              dailyRewardAudioClipName:
                shouldPlayFinalRewardAudioBeforeComplete
                  ? 'reward_02'
                  : 'reward',
              onRewardAudioComplete:
                shouldPlayFinalRewardAudioBeforeComplete
                  ? finalRewardAudioWait?.resolve
                  : undefined,
            },
          }),
        );
        await Util.updateUserReward();
        if (finalRewardAudioWait) {
          await finalRewardAudioWait.promise;
          await delay(FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS);
        }
        onComplete?.();
      };
      const rewardDiv = document.createElement('div');
      rewardDiv.style.width = '100%';
      rewardDiv.style.height = '100%';
      rewardForeignObject.appendChild(rewardDiv);
      svg.appendChild(rewardForeignObject);
      setRewardRiveState(RewardBoxState.IDLE);
      setRewardRiveContainer(rewardDiv);
      // Let React mount RewardRive into rewardDiv before flight starts.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      requestAnimationFrame(animateBezier);
    } catch (e) {
      logger.warn('Reward animation failed offline', e);
    }
  };



  return runRewardAnimation(
    newRewardId,
    shouldPlayFinalRewardAudioBeforeComplete,
    onComplete,
  );
}
