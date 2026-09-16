import './PathwayStructure.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Confetti from 'react-confetti';
import { t } from 'i18next';
import PathwayModal from './PathwayModal';
import ChimpleRiveMascot from './ChimpleRiveMascot';
import RewardBox from './RewardBox';
import DailyRewardModal from './DailyRewardModal';
import RewardRive from './RewardRive';
import StickerBookPreviewModal from './StickerBookPreviewModal';
import SkeltonLoading, {
  PATHWAY_STRUCTURE_SKELETON_HEADER,
} from '../SkeltonLoading';
import {
  CHIMPLE_MASCOT_INPUT_REWARD,
  CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
} from '../../common/constants';

import { usePathwayStructureController } from './usePathwayStructureController';

const PathwayStructure: React.FC = () => {
  const {
    closePathwayModal,
    closeStickerCompletion,
    closeStickerPreview,
    confirmPathwayModal,
    containerRef,
    handleMascotReplayClick,
    handleRewardBoxOpen,
    handleRewardModalClose,
    handleRewardModalPlay,
    hasTodayReward,
    inactiveText,
    isPathwaySvgLoading,
    isRewardFeatureOn,
    isStickerCompletionOpen,
    isStickerPreviewOpen,
    mascotKey,
    mascotProps,
    modalOpen,
    modalText,
    rewardModalOpen,
    rewardRiveContainer,
    rewardRiveState,
    rewardText,
    riveContainer,
    shouldAnimate,
    showRewardConfetti,
    stickerCompletionData,
    stickerPreviewData,
    stickerPreviewFlyoutMotion,
    stickerPreviewLaunchMotion,
    stickerPreviewTrigger,
  } = usePathwayStructureController();

  /*
   * Superseded pathway renderer. Rendering is handled by usePathwaySVG above;
   * retaining a second renderer here caused unresolved legacy helper references.
   */
  /*
    const preloadAllLessonImages = async (lessons: any[]) => {
      await Promise.all(
        lessons.map((lesson) => {
          const isValidUrl =
            typeof lesson.image === "string" &&
            /^(https?:\/\/|\/)/.test(lesson.image);
          const src = isValidUrl
            ? lesson.image
            : "assets/icons/DefaultIcon.png";
          return preloadImage(src);
        })
      );
    };

    const loadSVG = async (updatedStudent?: any) => {
      if (!containerRef.current) return;

      try {
        const startTime = performance.now();
        const currentStudent = Util.isRespectMode
          ? Util.getCurrentStudent()
          : updatedStudent || await Util.getCurrentStudent();
        const learningPath = currentStudent?.learning_path
          ? JSON.parse(currentStudent.learning_path)
          : null;
        if (!learningPath) return;

        const currentCourseIndex = learningPath?.courses.currentCourseIndex;
        const course = learningPath?.courses.courseList[currentCourseIndex];
        const { startIndex, currentIndex, pathEndIndex } = course;

        const [
          svgContent,
          lessons,
          flowerActive,
          flowerInactive,
          playedLessonSVG,
          giftSVG,
          giftSVG2,
          giftSVG3,
          haloPath,
        ] = await Promise.all([
          loadPathwayContent(
            "remoteAsset/Pathway.svg",
            "/pathwayAssets/English/Pathway.svg"
          ),
          Promise.all(
            course.path
              .slice(startIndex, pathEndIndex + 1)
              .map(({ lesson_id }) => getCachedLesson(lesson_id))
          ),
          tryFetchSVG(
            "remoteAsset/FlowerActive.svg",
            "/pathwayAssets/English/FlowerActive.svg",
            "flowerActive isSelected"
          ),
          fetchSVGGroup("/pathwayAssets/FlowerInactive.svg", "flowerInactive"),
          tryFetchSVG(
            "remoteAsset/PlayedLesson.svg",
            "/pathwayAssets/English/PlayedLesson.svg",
            "playedLessonSVG"
          ),
          tryFetchSVG(
            "remoteAsset/pathGift1.svg",
            "/pathwayAssets/English/pathGift1.svg",
            "giftSVG"
          ),
          tryFetchSVG(
            "remoteAsset/pathGift2.svg",
            "/pathwayAssets/English/pathGift2.svg",
            "giftSVG2"
          ),
          tryFetchSVG(
            "remoteAsset/pathGift3.svg",
            "/pathwayAssets/English/pathGift3.svg",
            "giftSVG3"
          ),
          loadHaloAnimation(
            "remoteAsset/halo.svg",
            "/pathwayAssets/English/halo.svg"
          ),
        ]);

        await preloadAllLessonImages(lessons);

        requestAnimationFrame(() => {
          containerRef.current!.innerHTML = svgContent;
          const svg = containerRef.current!.querySelector(
            "svg"
          ) as SVGSVGElement;
          if (!svg) return;

          const pathGroups = svg.querySelectorAll("g > path");
          const paths = Array.from(pathGroups) as SVGPathElement[];
          const startPoint = paths[0].getPointAtLength(0);
          const xValues = [27, 155, 276, 387, 496];

          const fragment = document.createDocumentFragment();

          lessons.forEach((lesson, idx) => {
            const path = paths[idx];
            const point = path.getPointAtLength(0);
            const flowerX = point.x - 40;
            const flowerY = point.y - 40;
            const x = xValues[idx] ?? 0;

            const isValidUrl = (url: string) =>
              typeof url === "string" && /^(https?:\/\/|\/)/.test(url);
            const lesson_image = isValidUrl(lesson.image)
              ? lesson.image
              : "assets/icons/DefaultIcon.png";

            const positionMappings = {
              playedLesson: {
                x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
                y: [
                  flowerY - 4,
                  flowerY - 7,
                  flowerY - 10,
                  flowerY - 5,
                  flowerY,
                ],
              },
              activeGroup: {
                x: [
                  flowerX - 20,
                  flowerX - 20,
                  260,
                  flowerX - 10,
                  flowerX - 15,
                ],
                y: [flowerY - 23, 5, 10, 5, 10],
              },
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

            if (startIndex + idx < currentIndex) {
              const playedLesson = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
              );
              const lessonImage = createSVGImage(lesson_image, 30, 30, 28, 30);
              playedLesson.appendChild(
                playedLessonSVG.cloneNode(true) as SVGGElement
              );
              playedLesson.appendChild(lessonImage);
              placeElement(
                playedLesson as SVGGElement,
                positionMappings.playedLesson.x[idx] ?? flowerX - 20,
                positionMappings.playedLesson.y[idx] ?? flowerY - 20
              );
              fragment.appendChild(playedLesson);
            } else if (startIndex + idx === currentIndex) {
              const activeGroup = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
              );
              activeGroup.setAttribute(
                "transform",
                `translate(${
                  positionMappings.activeGroup.x[idx] ?? flowerX - 20
                }, ${positionMappings.activeGroup.y[idx] ?? flowerY - 20})`
              );

              const halo = createSVGImage(haloPath, 140, 140, -15, -12);
              const pointer = createSVGImage(
                "/pathwayAssets/touchPointer.gif",
                130,
                130,
                60,
                30
              );
              const lessonImage = createSVGImage(lesson_image, 30, 30, 40, 40);

              activeGroup.appendChild(halo);
              activeGroup.appendChild(
                flowerActive.cloneNode(true) as SVGGElement
              );
              activeGroup.appendChild(lessonImage);
              activeGroup.appendChild(pointer);
              activeGroup.setAttribute("style", "cursor: pointer;");

              activeGroup.addEventListener("click", () => {
                if (lesson.plugin_type === "cocos") {
                  const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                  history.replace(PAGES.GAME + params, {
                    url: "chimple-lib/index.html" + params,
                    lessonId: lesson.cocos_lesson_id,
                    courseDocId: course.course_id,
                    lesson: JSON.stringify(lesson),
                    chapter: JSON.stringify({ chapter_id: lesson.chapter_id }),
                    from: history.location.pathname + `?continue=true`,
                    learning_path: true,
                  });
                }
              });

              const foreignObject = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "foreignObject"
              );
              foreignObject.setAttribute("width", "33%");
              foreignObject.setAttribute("height", "84%");
              foreignObject.setAttribute("x", `${x - 87}`);
              foreignObject.setAttribute("y", `${startPoint.y + 5}`);

              const riveDiv = document.createElement("div");
              riveDiv.style.width = "100%";
              riveDiv.style.height = "100%";
              foreignObject.appendChild(riveDiv);

              fragment.appendChild(activeGroup);
              fragment.appendChild(foreignObject);

              setRiveContainer(riveDiv);
            } else {
              const flower_Inactive = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
              );
              const lessonImage = createSVGImage(lesson_image, 30, 30, 21, 23);
              flower_Inactive.appendChild(
                flowerInactive.cloneNode(true) as SVGGElement
              );
              flower_Inactive.appendChild(lessonImage);
              flower_Inactive.addEventListener("click", () => {
                setModalOpen(true);
                setModalText(inactiveText);
              });
              flower_Inactive.setAttribute(
                "style",
                "cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);"
              );

              placeElement(
                flower_Inactive as SVGGElement,
                positionMappings.flowerInactive.x[idx] ?? flowerX - 20,
                positionMappings.flowerInactive.y[idx] ?? flowerY - 20
              );
              fragment.appendChild(flower_Inactive);
            }
          });

          const endPath = paths[paths.length - 1];
          const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
          const Gift_Svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
          );
          Gift_Svg.setAttribute("style", "cursor: pointer;");
          Gift_Svg.appendChild(giftSVG.cloneNode(true));
          placeElement(Gift_Svg, endPoint.x - 25, endPoint.y - 40);

          if (currentIndex < pathEndIndex + 1) {
            Gift_Svg.addEventListener("click", () => {
              const replaceGiftContent = (newContent: SVGElement) => {
                while (Gift_Svg.firstChild) {
                  Gift_Svg.removeChild(Gift_Svg.firstChild);
                }
                Gift_Svg.appendChild(newContent.cloneNode(true));
              };

              const animationSequence = [
                { content: giftSVG2, delay: 300 },
                { content: giftSVG3, delay: 500 },
                { content: giftSVG2, delay: 700 },
                { content: giftSVG3, delay: 900 },
                {
                  callback: () => {
                    setModalText(rewardText);
                    setModalOpen(true);
                    replaceGiftContent(giftSVG);
                  },
                  delay: 1100,
                },
              ];

              animationSequence.forEach(({ content, callback, delay }) => {
                setTimeout(() => {
                  if (content) replaceGiftContent(content);
                  if (callback) callback();
                }, delay);
              });
            });
          }

          fragment.appendChild(Gift_Svg);
          svg.appendChild(fragment);

          const endTime = performance.now();
          console.log(`SVG loaded in ${(endTime - startTime).toFixed(2)}ms`);
        });
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };

    // Reusable position helper
    const placeElement = (element: SVGGElement, x: number, y: number) => {
      element.setAttribute("transform", `translate(${x}, ${y})`);
    };

    // Initial load
    loadSVG();

    // Listen for course changes
    const handleCourseChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      loadSVG(customEvent.detail.currentStudent);
    };

    window.addEventListener(
      STICKER_BOOK_COMPLETION_READY_EVENT,
      handleStickerCompletionReady as EventListener,
    );

    return () => {
      window.removeEventListener(
        STICKER_BOOK_COMPLETION_READY_EVENT,
        handleStickerCompletionReady as EventListener,
      );
    };
  }, [openStickerCompletion]);
  */

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <PathwayModal
          text={modalText}
          onClose={closePathwayModal}
          onConfirm={confirmPathwayModal}
          animate={shouldAnimate}
          audioFolder={
            modalText === inactiveText
              ? 'lessonLocked'
              : modalText === rewardText
                ? 'completeLesson'
                : undefined
          }
          audioClipName={
            modalText === inactiveText
              ? 'lesson_locked'
              : modalText === rewardText
                ? 'complete_lesson_to_get_reward'
                : undefined
          }
        />
      )}
      {/* SVG Root Container */}
      <div
        className="PathwayStructure-div"
        ref={containerRef}
        style={{
          opacity: isPathwaySvgLoading ? 0 : 1,
        }}
      />
      <SkeltonLoading
        isLoading={isPathwaySvgLoading}
        header={PATHWAY_STRUCTURE_SKELETON_HEADER}
      />

      {/* Chimple Mascot */}
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={mascotProps.stateMachine}
            inputName={mascotProps.inputName}
            stateValue={mascotProps.stateValue}
            animationName={mascotProps.animationName}
            onClick={handleMascotReplayClick}
            overlayRules={[
              {
                stateMachine: CHIMPLE_MASCOT_STATE_MACHINE_REWARD,
                inputName: CHIMPLE_MASCOT_INPUT_REWARD,
              },
            ]}
          />,
          riveContainer,
        )}

      {/* Reward Box Rive */}
      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer,
        )}

      {showRewardConfetti && (
        <Confetti
          className="PathwayStructure-reward-confetti"
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={180}
          gravity={0.28}
        />
      )}

      {/* Daily reward icon */}
      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleRewardBoxOpen} />
      )}

      {/* Daily Reward modal */}
      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t('Play one lesson and collect your daily reward!')}
          onClose={handleRewardModalClose}
          onPlay={handleRewardModalPlay}
        />
      )}

      {isStickerPreviewOpen && stickerPreviewData && (
        <StickerBookPreviewModal
          data={stickerPreviewData}
          variant={
            stickerPreviewTrigger === 'pathway_completion_auto'
              ? 'drag_collect'
              : 'preview'
          }
          launchMotion={stickerPreviewLaunchMotion}
          flyoutMotion={stickerPreviewFlyoutMotion}
          onClose={closeStickerPreview}
        />
      )}

      {isStickerCompletionOpen && stickerCompletionData && (
        <StickerBookPreviewModal
          data={stickerCompletionData}
          mode="completion"
          onClose={
            closeStickerCompletion as (
              reason: 'close_button' | 'backdrop' | 'acknowledge_button',
            ) => void
          }
        />
      )}
    </>
  );
};

export default PathwayStructure;
