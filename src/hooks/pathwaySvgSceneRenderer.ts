import { IS_REWARD_FEATURE_ON, EVENTS } from '../common/constants';
import { Util } from '../utility/util';
import logger from '../utility/logger';
import { t } from 'i18next';
import { createSVGImage, placeElement } from './pathwaySvgAssets';

const PATH_SIZE = 5;

export function renderPathwaySvgScene(params: any) {
  const {
    activeIndex, assessmentId, containerRef, course,
    currentIndex, didScheduleStickerCompletionPopup, endTimeStart, flowerActive,
    flowerInactive, halo, handleLessonClick, isAssessment, isOffline,
    isStickerBookPreviewOn, lessons, mysteryBox1, mysteryBox2, mysteryBox3,
    newRewardIdFromCheck, onStickerCompletionReady, onStickerPreviewReady,
    pathEndIndex, pathItem, pathwaySVG, pendingStickerRewardParsed,
    playedLessonSVG, resolvedHaloSrc, resolvedLessonImageUrls,
    resolvedPointerSrc, resolvedStickerImageSrc, rewardBoxVariant,
    runRewardAnimation, setHasTodayReward, setModalOpen, setModalText,
    setRiveContainer, shouldOpenCelebrationPopup, startIndex,
    stickerCompletionPayload, stickerPreviewPayload, stopPathwayLoading,
    updateMascotToNormalState,
  } = params;

  requestAnimationFrame(() => {
        if (!containerRef.current) {
          stopPathwayLoading();
          return;
        }

        containerRef.current.innerHTML = pathwaySVG;
        const svg = containerRef.current.querySelector('svg') as SVGSVGElement;
        if (!svg) {
          stopPathwayLoading();
          return;
        }
        svg.style.overflow = 'visible';

        const paths = Array.from(
          svg.querySelectorAll('g > path'),
        ) as SVGPathElement[];
        if (!paths.length) {
          stopPathwayLoading();
          return;
        }

        const startPoint = paths[0].getPointAtLength(0);
        const xValues = [27, 155, 276, 387, 496];

        const fragment = document.createDocumentFragment();

        const chimple = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'foreignObject',
        );
        chimple.setAttribute('width', '32.5%');
        chimple.setAttribute('height', '100%');
        let lastIndex = -1;
        const buildInactiveLessonNode = (
          index: number,
          flowerX: number,
          flowerY: number,
        ) => {
          const flower_Inactive = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g',
          );
          const positionMappings = {
            flowerInactive: {
              x: [flowerX - 20, flowerX, flowerX, flowerX + 5, flowerX + 10],
              y: [
                flowerY - 20,
                flowerY + 5,
                flowerY - 6,
                flowerY + 3,
                flowerY - 5,
              ],
            },
          };
          const lessonImage = createSVGImage(
            'assets/icons/NextNodeIcon.svg',
            30,
            30,
            21,
            23,
          );
          flower_Inactive.appendChild(
            flowerInactive.cloneNode(true) as SVGGElement,
          );
          flower_Inactive.appendChild(lessonImage);
          flower_Inactive.addEventListener('click', () => {
            setModalOpen(true);
            setModalText(
              t('This lesson is locked. Play the current active lesson.'),
            );
          });
          flower_Inactive.setAttribute(
            'style',
            'cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);',
          );
          placeElement(
            flower_Inactive as SVGGElement,
            positionMappings.flowerInactive.x[index] ?? flowerX - 20,
            positionMappings.flowerInactive.y[index] ?? flowerY - 20,
          );
          return flower_Inactive;
        };
        for (let idx = 0; idx < lessons.length; idx += 1) {
          const lesson = lessons[idx];
          const path = paths[idx];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;

          const isPlayed =
            startIndex + idx < currentIndex || activeIndex === -1;
          const isActive =
            startIndex + idx === currentIndex && activeIndex !== -1;

          logger.warn('lesson image:', lesson.image);
          const resolvedLessonImageUrl =
            resolvedLessonImageUrls[idx] ?? 'assets/icons/DefaultIcon.png';

          const positionMappings = {
            playedLesson: {
              x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
              y: [flowerY - 4, flowerY - 7, flowerY - 10, flowerY - 5, flowerY],
            },
            activeGroup: {
              x: [flowerX - 20, flowerX - 20, 260, flowerX - 10, flowerX - 15],
              y: [flowerY - 23, 5, 10, 5, 10],
            },
          };

          if (isPlayed) {
            const playedLesson = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            const lessonImage = createSVGImage(
              resolvedLessonImageUrl,
              30,
              30,
              28,
              30,
            );
            playedLesson.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement,
            );
            playedLesson.appendChild(lessonImage);
            placeElement(
              playedLesson as SVGGElement,
              positionMappings.playedLesson.x[idx] ?? flowerX - 20,
              positionMappings.playedLesson.y[idx] ?? flowerY - 20,
            );
            fragment.appendChild(playedLesson);
          } else if (isActive) {
            const activeGroup = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'g',
            );
            activeGroup.setAttribute(
              'transform',
              `translate(${
                positionMappings.activeGroup.x[idx] ?? flowerX - 20
              }, ${positionMappings.activeGroup.y[idx] ?? flowerY - 20})`,
            );

            if (typeof halo === 'string') {
              const haloImg = createSVGImage(
                resolvedHaloSrc || halo,
                140,
                140,
                -15,
                -12,
              );
              activeGroup.appendChild(haloImg);
            } else {
              const haloNode = halo.cloneNode(true) as
                | SVGSVGElement
                | SVGGElement;
              haloNode.setAttribute('x', '-15');
              haloNode.setAttribute('y', '-12');
              haloNode.setAttribute('width', '140');
              haloNode.setAttribute('height', '140');
              activeGroup.appendChild(haloNode);
            }

            const lessonImage = createSVGImage(
              resolvedLessonImageUrl,
              30,
              30,
              40,
              40,
            );
            activeGroup.appendChild(
              flowerActive.cloneNode(true) as SVGGElement,
            );
            activeGroup.appendChild(lessonImage);

            const pointer = createSVGImage(
              resolvedPointerSrc,
              35,
              35,
              85,
              80,
              'PathwayStructure-animated-pointer',
            );
            activeGroup.appendChild(pointer);

            activeGroup.style.cursor = 'pointer';
            activeGroup.addEventListener('click', () => {
              handleLessonClick(
                lesson,
                course,
                pathItem?.skill_id,
                isAssessment,
                assessmentId,
                pathItem?.source,
              );
            });

            fragment.appendChild(activeGroup);
          } else {
            fragment.appendChild(
              buildInactiveLessonNode(idx, flowerX, flowerY),
            );
          }
          lastIndex = idx;
        }
        for (let i = lastIndex + 1; i < PATH_SIZE; i++) {
          const path = paths[i];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;
          fragment.appendChild(buildInactiveLessonNode(i, flowerX, flowerY));
        }

        const endPath = paths[paths.length - 1];
        const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
        const rewardWrapper = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        ) as SVGGElement;
        rewardWrapper.setAttribute('style', 'cursor: pointer;');

        const rewardGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        ) as SVGGElement;
        (rewardGroup.style as any).transformBox = 'fill-box';
        rewardGroup.style.transformOrigin = 'center';
        rewardWrapper.appendChild(rewardGroup);

        const isRewardFeatureOn =
          localStorage.getItem(IS_REWARD_FEATURE_ON) === 'true';

        const normalizedVariant = String(rewardBoxVariant ?? '')
          .trim()
          .toLowerCase();
        const gbWantsMystery =
          normalizedVariant === 'mystery_3d' ||
          normalizedVariant === 'mystery' ||
          normalizedVariant === 'mysterybox' ||
          normalizedVariant === 'mystery_box';

        const hasNextSticker = Boolean(stickerPreviewPayload?.nextStickerId);
        const nextStickerImageSrc = stickerPreviewPayload?.nextStickerImage;
        const hasRenderableSticker = Boolean(nextStickerImageSrc);
        const rewardMode: 'sticker' | 'mystery_box' =
          !hasNextSticker || !hasRenderableSticker || gbWantsMystery
            ? 'mystery_box'
            : 'sticker';

        rewardWrapper.setAttribute('data-reward-mode', rewardMode);
        rewardWrapper.setAttribute(
          'aria-label',
          rewardMode === 'sticker' ? 'Sticker reward' : 'Mystery box reward',
        );

        const width =
          window.innerWidth >= 1024 ? 68 : window.innerWidth >= 768 ? 62 : 57;
        const height = Math.round(width * 0.767);

        const playRewardClickAnimation = (
          mode: 'sticker' | 'mystery_box',
        ): Promise<void> => {
          if (mode === 'mystery_box') {
            return Promise.resolve();
          }

          const willOpenPreview =
            mode === 'sticker' &&
            isStickerBookPreviewOn &&
            stickerPreviewPayload;

          if (willOpenPreview) {
            rewardGroup.classList.remove(
              'PathwayStructure-end-reward-box--sticker-close-anim',
            );
            void rewardGroup.getBoundingClientRect(); // force reflow
            rewardGroup.classList.add(
              'PathwayStructure-end-reward-box--sticker-open',
            );
            return new Promise((resolve) => setTimeout(resolve, 750));
          }

          const animationClass =
            'PathwayStructure-end-reward-box--sticker-clicked';

          rewardGroup.classList.remove(
            'PathwayStructure-end-reward-box--sticker-clicked',
            'PathwayStructure-end-reward-box--clicked',
          );

          // force reflow so the animation can restart
          void rewardGroup.getBoundingClientRect();
          rewardGroup.classList.add(animationClass);

          return new Promise((resolve) => {
            let resolved = false;
            const finish = () => {
              if (resolved) return;
              resolved = true;
              rewardGroup.classList.remove(animationClass);
              resolve();
            };

            const onEnd = (event: AnimationEvent) => {
              if (event.target === rewardGroup) finish();
            };

            rewardGroup.addEventListener('animationend', onEnd, { once: true });
            window.setTimeout(finish, 1100);
          });
        };

        if (rewardMode === 'sticker') {
          rewardGroup.classList.add(
            'PathwayStructure-end-reward-box',
            'PathwayStructure-end-reward-box--sticker',
          );

          const bg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'rect',
          );
          bg.setAttribute('width', String(width));
          bg.setAttribute('height', String(height));
          bg.setAttribute('rx', String(Math.round(height * 0.24)));
          bg.setAttribute('ry', String(Math.round(height * 0.24)));
          bg.setAttribute('fill', '#FFFDEE');
          bg.setAttribute('stroke', '#F55376');
          bg.setAttribute('stroke-width', '3');

          const horizontalPadding = Math.round(width * 0.12);
          const verticalPadding = Math.round(height * 0.12);
          const contentWidth = width - horizontalPadding * 2;
          const contentHeight = height - verticalPadding * 2;

          rewardGroup.appendChild(bg);
          // Reuse the same resolved sticker image that powers the preview modal.
          if (resolvedStickerImageSrc) {
            rewardGroup.appendChild(
              createSVGImage(
                resolvedStickerImageSrc,
                contentWidth,
                contentHeight,
                horizontalPadding,
                verticalPadding,
                'PathwayStructure-end-reward-sticker-image',
              ),
            );
          }
          placeElement(
            rewardWrapper,
            endPoint.x - width / 2,
            endPoint.y - height / 2,
          );

          if (currentIndex < pathEndIndex + 1) {
            rewardWrapper.addEventListener('click', async () => {
              await playRewardClickAnimation(rewardMode);

              void Util.logEvent(EVENTS.PATHWAY_STICKER_BOX_TAPPED, {
                user_id: Util.getCurrentStudent()?.id ?? 'unknown',
                source: 'learning_pathway',
                sticker_book_id:
                  stickerPreviewPayload?.stickerBookId ?? 'unknown',
                sticker_id: stickerPreviewPayload?.nextStickerId ?? 'unknown',
                gb_variant: normalizedVariant || 'sticker',
              });

              if (isStickerBookPreviewOn && stickerPreviewPayload) {
                onStickerPreviewReady(stickerPreviewPayload, 'sticker_click');
              } else {
                setModalText(t('Complete these 5 lessons to earn rewards'));
                setModalOpen(true);
              }
            });
          }
        } else {
          rewardGroup.classList.add(
            'PathwayStructure-end-reward-box',
            'PathwayStructure-end-reward-box--mystery',
          );
          const mysteryBoxClone = mysteryBox1.cloneNode(true) as SVGElement;
          mysteryBoxClone.setAttribute('width', String(width));
          mysteryBoxClone.setAttribute('height', String(height));
          mysteryBoxClone.style.width = `${width}px`;
          mysteryBoxClone.style.height = `${height}px`;
          rewardGroup.appendChild(mysteryBoxClone);

          placeElement(
            rewardWrapper,
            endPoint.x - width / 2,
            endPoint.y - height / 2,
          );

          if (currentIndex < pathEndIndex + 1) {
            rewardWrapper.addEventListener('click', async () => {
              await playRewardClickAnimation(rewardMode);

              const reason = isOffline
                ? 'offline'
                : hasNextSticker
                  ? 'experiment'
                  : 'stickers_exhausted';
              const mysteryBoxModalText =
                reason === 'stickers_exhausted'
                  ? t('Complete these 5 lessons to earn rewards')
                  : t('Complete these 5 lessons to earn 10 stars');

              void Util.logEvent(EVENTS.PATHWAY_MYSTERY_BOX_TAPPED, {
                user_id: Util.getCurrentStudent()?.id ?? 'unknown',
                source: 'learning_pathway',
                reason,
                sticker_book_id:
                  stickerPreviewPayload?.stickerBookId ?? 'unknown',
                sticker_id: stickerPreviewPayload?.nextStickerId ?? 'none',
                gb_variant: normalizedVariant || 'mystery_box',
              });

              const replaceContent = (newContent: SVGElement) => {
                while (rewardGroup.firstChild) {
                  rewardGroup.removeChild(rewardGroup.firstChild);
                }
                const clone = newContent.cloneNode(true) as SVGElement;
                clone.setAttribute('width', String(width));
                clone.setAttribute('height', String(height));
                clone.style.width = `${width}px`;
                clone.style.height = `${height}px`;
                rewardGroup.appendChild(clone);
              };

              const animationSequence = [
                { content: mysteryBox2, delay: 300 },
                { content: mysteryBox3, delay: 500 },
                { content: mysteryBox2, delay: 700 },
                { content: mysteryBox3, delay: 900 },
                {
                  callback: () => {
                    setModalText(mysteryBoxModalText);
                    setModalOpen(true);
                    replaceContent(mysteryBox1);
                  },
                  delay: 1100,
                },
              ];

              animationSequence.forEach(({ content, callback, delay }) => {
                setTimeout(() => {
                  if (content) replaceContent(content);
                  if (callback) callback();
                }, delay);
              });
            });
          }
        }

        fragment.appendChild(rewardWrapper);
        svg.appendChild(fragment);

        // Setup chimple mascot initial position
        const isFinalPathwayReward =
          activeIndex === -1 && currentIndex === pathEndIndex;
        const completedLessonIndexForReward = isFinalPathwayReward
          ? currentIndex
          : currentIndex - 1;
        const idx = lessons.findIndex(
          (_: unknown, index: number) =>
            startIndex + index === completedLessonIndexForReward,
        );
        const xValuesForChimple = [-60, 66, 180, 295, 412];

        const isStringReward =
          newRewardIdFromCheck !== null &&
          typeof newRewardIdFromCheck === 'string';

        // If a sticker popup is pending, keep the daily reward animation first
        // and open the popup from the reward animation completion callback.
        const willShowCelebration =
          shouldOpenCelebrationPopup && !!stickerPreviewPayload;
        const shouldSkipRewardAnimationForSticker =
          isStringReward &&
          isRewardFeatureOn &&
          Boolean(pendingStickerRewardParsed?.awardedStickerId) &&
          !willShowCelebration &&
          !didScheduleStickerCompletionPopup;
        const shouldRunRewardAnimation =
          isStringReward &&
          isRewardFeatureOn &&
          !shouldSkipRewardAnimationForSticker;

        if (shouldSkipRewardAnimationForSticker) {
          setHasTodayReward(false);
          void (async () => {
            await updateMascotToNormalState(newRewardIdFromCheck as string);
            await Util.updateUserReward();
          })();
        }

        if (shouldRunRewardAnimation) {
          runRewardAnimation(
            newRewardIdFromCheck as string,
            lessons,
            startIndex,
            currentIndex,
            svg,
            startPoint,
            xValues,
            chimple,
            pathEndIndex,
            completedLessonIndexForReward,
            isFinalPathwayReward,
            isFinalPathwayReward &&
              (willShowCelebration || didScheduleStickerCompletionPopup),
            () => {
              if (willShowCelebration && stickerPreviewPayload) {
                setTimeout(
                  () =>
                    onStickerPreviewReady(
                      stickerPreviewPayload,
                      'pathway_completion_auto',
                    ),
                  0,
                );
              } else if (
                didScheduleStickerCompletionPopup &&
                stickerCompletionPayload
              ) {
                setTimeout(
                  () => onStickerCompletionReady(stickerCompletionPayload),
                  0,
                );
              }
            },
          );
        }

        // Attach chimple (mascot)
        if (chimple) {
          let baseX: number;
          if (idx < 0 || !shouldRunRewardAnimation) {
            // default logic – same as original: next active lesson
            baseX = xValues[idx + 1] ?? xValues[0];
            chimple.setAttribute('x', `${baseX - 87}`);
          } else {
            baseX = xValuesForChimple[idx] ?? xValues[0];
            chimple.setAttribute('x', `${baseX}`);
          }

          chimple.setAttribute('y', `${startPoint.y - 15}`);
          chimple.style.pointerEvents = 'none';

          const riveDiv = document.createElement('div');
          riveDiv.style.width = '100%';
          riveDiv.style.height = '100%';
          chimple.appendChild(riveDiv);
          svg.appendChild(chimple);

          // Keep the reward node above the mascot during speaking/celebration
          svg.appendChild(rewardWrapper);

          setRiveContainer(riveDiv);
        }

        const endTime = performance.now();
        logger.info(`SVG loaded in ${(endTime - endTimeStart).toFixed(2)}ms`);
        stopPathwayLoading();
      
  });
}
