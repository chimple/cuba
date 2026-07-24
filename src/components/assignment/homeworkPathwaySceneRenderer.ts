import {
  CONTINUE,
  LIVE_QUIZ,
  PAGES,
  SOURCE,
  STICKER_BOOK_COMPLETION_READY_EVENT,
} from '../../common/constants';
import { parsePath } from 'history';
import { Util } from '../../utility/util';
import {
  hasPendingFinalHomeworkStickerFlow,
} from '../../utility/homeworkStickerFlow';
import { runHomeworkPathwayRewardAnimation } from './homeworkPathwayRewardAnimation';
import { buildHomeworkPathwayRewardNode } from './homeworkPathwayRewardNode';

export function renderHomeworkPathwayScene(params: any) {
  const {
    api,
    chimple,
    completedRewardIndex,
    containerRef,
    currentIndex,
    delay,
    didDispatchStickerCompletionPopupImmediately,
    didScheduleStickerCompletionPopup,
    fetchedChapter,
    fetchedCourse,
    fetchRequestId,
    finishFinalHomeworkStickerFlow,
    fruitActive,
    fruitInactive,
    giftSVG,
    giftSVG2,
    giftSVG3,
    handleStickerPreviewReady,
    hasTodayRewardRef,
    history,
    inactiveText,
    invokeMascotCelebration,
    isFinalRewardTransition,
    isOffline,
    isPlaceholderSnapshot,
    isRewardFeatureOn,
    isStickerBookPreviewOn,
    lessons,
    lessonsToRender,
    loadSvgRequestIdRef,
    MASCOT_X_OFFSET,
    pathEndIndex,
    newRewardId,
    pendingStickerRewardParsed,
    placeElement,
    playedLessonSVG,
    reloadHomeworkPathway,
    resolvedHaloSrc,
    resolvedLessonImageUrls,
    resolvedPointerSrc,
    resolvedStickerImageSrc,
    rewardBoxVariant,
    rewardText,
    setHasTodayReward,
    setIsRewardPathLoaded,
    setModalOpen,
    setModalText,
    setRewardRiveContainer,
    setRewardRiveState,
    setRiveContainer,
    shouldOpenCelebrationPopup,
    startIndex,
    stickerCompletionPayload,
    stickerPreviewPayload,
    svgContent,
    updateMascotToNormalState,
    visualCurrentIndex,
    HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
    PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
    REWARD_FLIGHT_TARGET_X_OFFSET,
    REWARD_FLIGHT_ARC_Y_OFFSET,
    REWARD_FLIGHT_DURATION_MS,
    FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
    FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS,
    createSVGImage,
    haloPath,
  } = params;

  requestAnimationFrame(() => {
    if (!containerRef.current || loadSvgRequestIdRef.current !== fetchRequestId)
      return;
    containerRef.current.innerHTML = svgContent;
    const svg = containerRef.current.querySelector('svg') as SVGSVGElement;
    if (!svg) return;
    svg.style.overflow = 'visible';

    const pathGroups = svg.querySelectorAll('g > path');
    const rawPaths = Array.from(pathGroups) as SVGPathElement[];

    const paths = rawPaths
      .map((p) => ({ path: p, x: p.getBBox().x }))
      .sort((a, b) => a.x - b.x)
      .map((o) => o.path);

    if (!paths.length) return;

    const startPoint = paths[0].getPointAtLength(0);
    const slotXValues = paths.map((path) => path.getPointAtLength(0).x);
    const fragment = document.createDocumentFragment();

    const totalSlots = 5;
    const numLessons = lessonsToRender.length;
    const startIndexOffset = totalSlots - numLessons;

    for (let pathIndex = 0; pathIndex < totalSlots; pathIndex++) {
      const path = paths[pathIndex];
      if (!path) continue;

      const point = path.getPointAtLength(0);
      const flowerX = point.x - 40;
      const flowerY = point.y - 40;

      const positionMappings = {
        playedLesson: {
          x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
          y: [flowerY - 4, flowerY - 7, flowerY - 10, flowerY - 5, flowerY],
        },
        activeGroup: { baseX: flowerX - 20, baseY: flowerY - 23 },
        fruitInactive: {
          x: [flowerX - 20, flowerX, flowerX, flowerX + 5, flowerX + 10],
          y: [flowerY - 20, flowerY + 5, flowerY - 6, flowerY + 3, flowerY - 5],
        },
      };

      if (pathIndex < startIndexOffset) {
        const lockedFruit = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        );
        lockedFruit.appendChild(playedLessonSVG.cloneNode(true) as SVGGElement);
        // lockedFruit.addEventListener("click", () => {
        //   setModalOpen(true);
        //   setModalText(inactiveText);
        // });
        lockedFruit.setAttribute('style', 'cursor: default;');
        let yOffset = -10;
        if (pathIndex === 4) yOffset = 5;
        if (pathIndex === 2) yOffset += 15;
        let xPos = positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
        let yPos =
          (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
          yOffset;
        if (pathIndex === 0) {
          xPos += 21;
          yPos += 15;
        }
        placeElement(lockedFruit as SVGGElement, xPos, yPos);
        fragment.appendChild(lockedFruit);
        continue;
      }

      const lessonIdx = pathIndex - startIndexOffset;
      const { lesson } = lessonsToRender[lessonIdx];

      const isPlayed = lessonIdx < visualCurrentIndex;
      const isActive = lessonIdx === visualCurrentIndex;
      const resolvedLessonImageSrc =
        resolvedLessonImageUrls[lessonIdx] ?? 'assets/icons/DefaultIcon.png';

      if (isPlaceholderSnapshot || lessonIdx < visualCurrentIndex) {
        const playedLesson = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        );
        playedLesson.appendChild(
          playedLessonSVG.cloneNode(true) as SVGGElement,
        );
        if (!isPlaceholderSnapshot) {
          const lessonImage = createSVGImage(
            resolvedLessonImageSrc,
            30,
            30,
            28,
            30,
          );
          playedLesson.appendChild(lessonImage);
        }

        let xPos = positionMappings.playedLesson.x[pathIndex] ?? flowerX - 20;
        let yPos = positionMappings.playedLesson.y[pathIndex] ?? flowerY - 20;

        if (pathIndex === 0) {
          yPos -= 12;
        } else if (pathIndex === 2) {
          yPos += 7;
        } else if (pathIndex === 3) {
          yPos -= 5;
        }

        placeElement(playedLesson as SVGGElement, xPos, yPos);
        fragment.appendChild(playedLesson);
      } else if (lessonIdx === visualCurrentIndex) {
        const activeGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        );

        let activeYOffset = -10;
        let activeXOffset = 0;

        if (pathIndex === 1) {
          activeYOffset = 5;
          activeXOffset += 8;
        } else if (pathIndex === 2) {
          activeYOffset += 12;
          activeXOffset += 8;
        } else if (pathIndex === 3) {
          activeYOffset += 15;
          activeXOffset += 8;
        } else if (pathIndex === 0) {
          activeYOffset = -10;
          activeXOffset = 10;
        } else if (pathIndex === 4) {
          activeYOffset = -1;
          activeXOffset = 12;
        }

        activeGroup.setAttribute(
          'transform',
          `translate(${
            positionMappings.activeGroup.baseX + activeXOffset
          }, ${positionMappings.activeGroup.baseY + activeYOffset})`,
        );

        const halo = createSVGImage(
          resolvedHaloSrc || haloPath,
          140,
          140,
          -15,
          -12,
        );
        const pointer = createSVGImage(resolvedPointerSrc, 30, 30, 70, 90);
        pointer.setAttribute(
          'class',
          'homeworkpathway-structure-animated-pointer',
        );
        const lessonImage = createSVGImage(
          resolvedLessonImageSrc,
          30,
          30,
          40,
          40,
        );

        activeGroup.appendChild(halo);
        activeGroup.appendChild(fruitActive.cloneNode(true) as SVGGElement);
        activeGroup.appendChild(lessonImage);
        activeGroup.appendChild(pointer);
        activeGroup.setAttribute('style', 'cursor: pointer;');

        activeGroup.addEventListener('click', () => {
          const shouldMarkRewardLesson =
            isRewardFeatureOn && hasTodayRewardRef.current;
          if (lesson.plugin_type === LIVE_QUIZ) {
            history.push({
              ...parsePath(
                PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
              ),
              state: {
                courseId: fetchedCourse?.id,
                lesson: JSON.stringify(lesson),
                from: history.location.pathname + `?${CONTINUE}=true`,
                isHomework: true,
                homeworkIndex: lessonIdx,
                reward: shouldMarkRewardLesson,
                source: SOURCE.LEARNING_PATHWAY_HOMEWORK,
              },
            });
          } else {
            const playableLessonId = Util.getLessonBundleId(lesson);
            if (!playableLessonId) {
              return;
            }
            const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
            history.push({
              ...parsePath(PAGES.LIDO_PLAYER + params),
              state: {
                lessonId: playableLessonId,
                courseDocId: fetchedCourse?.id,
                course: JSON.stringify(fetchedCourse),
                lesson: JSON.stringify(lesson),
                chapter: JSON.stringify(fetchedChapter),
                from: history.location.pathname + `?${CONTINUE}=true`,
                isHomework: true,
                homeworkIndex: lessonIdx,
                reward: shouldMarkRewardLesson,
                source: SOURCE.LEARNING_PATHWAY_HOMEWORK,
              },
            });
          }
        });
        fragment.appendChild(activeGroup);
      } else {
        const flower_Inactive = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        );

        const lessonImage = createSVGImage(
          resolvedLessonImageSrc,
          30,
          30,
          27,
          29,
        );
        flower_Inactive.appendChild(
          fruitInactive.cloneNode(true) as SVGGElement,
        );
        flower_Inactive.appendChild(lessonImage);

        flower_Inactive.addEventListener('click', () => {
          setModalOpen(true);
          setModalText(inactiveText);
        });

        flower_Inactive.setAttribute(
          'style',
          'cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);',
        );

        let yOffset = -10;
        if (pathIndex === 4) yOffset = 5;
        if (pathIndex === 2) yOffset = 4;
        let extraX = 0;
        let extraY = 0;
        if (pathIndex === 0) {
          extraX = 15;
          extraY -= 100;
        }
        if (pathIndex === 2) {
          yOffset += 1;
        }
        let xPos = positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
        let yPos =
          (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
          yOffset;
        placeElement(flower_Inactive as SVGGElement, xPos, yPos);
        if (pathIndex === 0) {
          const prevTransform = flower_Inactive.getAttribute('transform') || '';
          flower_Inactive.setAttribute(
            'transform',
            `${prevTransform} translate(${extraX}, ${extraY})`.trim(),
          );
        }
        fragment.appendChild(flower_Inactive);
      }
    }

    const rewardNode = buildHomeworkPathwayRewardNode({
      createSVGImage,
      currentIndex,
      endPath: paths[paths.length - 1],
      fragment,
      giftSVG,
      giftSVG2,
      giftSVG3,
      handleStickerPreviewReady,
      isOffline,
      isStickerBookPreviewOn,
      pathEndIndex,
      placeElement,
      resolvedStickerImageSrc,
      rewardBoxVariant,
      rewardText,
      setModalOpen,
      setModalText,
      stickerPreviewPayload,
    });

    const runRewardAnimation = (
      rewardId: string,
      shouldPlayFinalRewardAudioBeforeComplete: boolean,
      onComplete?: () => void,
    ) =>
      runHomeworkPathwayRewardAnimation({
        api,
        chimple,
        completedRewardIndex,
        currentIndex,
        delay,
        FINAL_HOMEWORK_REWARD_AUDIO_DELAY_MS,
        FINAL_HOMEWORK_REWARD_AUDIO_TIMEOUT_MS,
        HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
        invokeMascotCelebration,
        lessons,
        lessonsToRender,
        MASCOT_X_OFFSET,
        newRewardId: rewardId,
        onComplete,
        pathEndIndex,
        PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
        REWARD_FLIGHT_ARC_Y_OFFSET,
        REWARD_FLIGHT_DURATION_MS,
        REWARD_FLIGHT_TARGET_X_OFFSET,
        reloadHomeworkPathway,
        setHasTodayReward,
        setIsRewardPathLoaded,
        setRewardRiveContainer,
        setRewardRiveState,
        shouldPlayFinalRewardAudioBeforeComplete,
        slotXValues,
        startIndex,
        startIndexOffset,
        startPoint,
        svg,
        updateMascotToNormalState,
      });

    // (newRewardId is already fetched in Promise.all above)

    svg.appendChild(fragment);

    if (chimple) {
      const currentLessonIdx = lessons.findIndex(
        (_: unknown, idx: number) => startIndex + idx === currentIndex,
      );
      const anchoredCurrentLessonIdx =
        currentLessonIdx >= 0
          ? currentLessonIdx
          : Math.min(
              Math.max(currentIndex, 0),
              Math.max(lessons.length - 1, 0),
            );
      const lastCompletedLessonIdx =
        typeof completedRewardIndex === 'number'
          ? completedRewardIndex
          : anchoredCurrentLessonIdx - 1;

      if (
        lastCompletedLessonIdx < 0 ||
        newRewardId == null ||
        !isRewardFeatureOn
      ) {
        const currentPathIndex = startIndexOffset + anchoredCurrentLessonIdx;
        const safePathIndex = Math.min(
          Math.max(currentPathIndex, 0),
          slotXValues.length - 1,
        );
        chimple.setAttribute(
          'x',
          `${slotXValues[safePathIndex] + MASCOT_X_OFFSET}`,
        );
      } else {
        const lastCompletedPathIndex =
          startIndexOffset + lastCompletedLessonIdx;
        const safePathIndex = Math.min(
          Math.max(lastCompletedPathIndex, 0),
          slotXValues.length - 1,
        );
        chimple.setAttribute(
          'x',
          `${slotXValues[safePathIndex] + MASCOT_X_OFFSET}`,
        );
      }

      let chimpleBaseY = startPoint.y - 12;
      if (window.innerWidth <= 1024) {
        chimpleBaseY -= 12;
      }
      chimple.setAttribute('y', `${chimpleBaseY}`);
      chimple.style.pointerEvents = 'none';
      const riveWrapper = document.createElement('div');
      riveWrapper.className = 'homeworkpathway-mascot-wrapper';
      riveWrapper.style.width = '100%';
      riveWrapper.style.height = '100%';

      riveWrapper.style.transform = 'scale(1.01)';
      riveWrapper.style.transformOrigin = 'bottom center';
      const riveDiv = document.createElement('div');
      riveDiv.style.width = '100%';
      riveDiv.style.height = '100%';

      riveWrapper.appendChild(riveDiv);
      chimple.appendChild(riveWrapper);
      svg.appendChild(chimple);

      // Keep the reward node above the mascot during speaking/celebration
      if (rewardNode) {
        svg.appendChild(rewardNode);
      }

      setRiveContainer(riveDiv);
    }

    const isStringReward =
      newRewardId !== null && typeof newRewardId === 'string';
    const willShowCelebration =
      shouldOpenCelebrationPopup && !!stickerPreviewPayload;
    const shouldSkipRewardAnimationForSticker =
      isStringReward &&
      isRewardFeatureOn &&
      Boolean(pendingStickerRewardParsed?.awardedStickerId) &&
      !willShowCelebration &&
      !didScheduleStickerCompletionPopup;
    const shouldRunRewardAnimation =
      !isPlaceholderSnapshot &&
      isStringReward &&
      isRewardFeatureOn &&
      !shouldSkipRewardAnimationForSticker;

    if (shouldSkipRewardAnimationForSticker) {
      setHasTodayReward(false);
      sessionStorage.removeItem(HOMEWORK_REWARD_COMPLETED_INDEX_KEY);
      sessionStorage.removeItem(PENDING_HOMEWORK_REWARD_TRANSITION_KEY);
      void (async () => {
        await updateMascotToNormalState(newRewardId as string);
        await Util.updateUserReward();
      })();
      if (hasPendingFinalHomeworkStickerFlow()) {
        finishFinalHomeworkStickerFlow();
      }
    }

    if (shouldRunRewardAnimation) {
      runRewardAnimation(
        newRewardId,
        isFinalRewardTransition &&
          (willShowCelebration || didScheduleStickerCompletionPopup),
        () => {
          if (shouldOpenCelebrationPopup && stickerPreviewPayload) {
            window.setTimeout(() => {
              handleStickerPreviewReady(
                stickerPreviewPayload,
                'pathway_completion_auto',
              );
            }, 0);
          } else if (
            didScheduleStickerCompletionPopup &&
            !didDispatchStickerCompletionPopupImmediately &&
            stickerCompletionPayload
          ) {
            window.setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
                  detail: stickerCompletionPayload,
                }),
              );
            }, 0);
          }
        },
      );
    } else if (shouldOpenCelebrationPopup && stickerPreviewPayload) {
      window.setTimeout(() => {
        handleStickerPreviewReady(
          stickerPreviewPayload,
          'pathway_completion_auto',
        );
      }, 0);
    } else if (
      didScheduleStickerCompletionPopup &&
      !didDispatchStickerCompletionPopupImmediately &&
      stickerCompletionPayload
    ) {
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(STICKER_BOOK_COMPLETION_READY_EVENT, {
            detail: stickerCompletionPayload,
          }),
        );
      }, 0);
    }
  });
}
