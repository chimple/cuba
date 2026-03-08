import { RefObject, useEffect } from "react";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

import { ServiceConfig } from "../services/ServiceConfig";
import {
  REWARD_LEARNING_PATH,
  COCOS,
  LIVE_QUIZ,
  LIDO,
  PAGES,
  CONTINUE,
  RewardBoxState,
  IS_REWARD_FEATURE_ON,
  LIDO_ASSESSMENT,
} from "../common/constants";
import { Util } from "../utility/util";
import { LessonNode } from "./useLearningPath";
import { extractStickerSvg } from "../components/coloring/SVGScene";

interface UsePathwaySVGParams {
  containerRef: RefObject<HTMLDivElement | null>;
  setModalOpen: (b: boolean) => void;
  setModalText: (text: string) => void;

  history: any;
  getCachedLesson: (lessonId: string) => Promise<any>;
  checkAndUpdateReward: () => Promise<string | null>;
  updateMascotToNormalState: (rewardId: string) => Promise<void>;
  invokeMascotCelebration: (stateNumber: number) => Promise<void>;
  setRewardRiveState: (state: RewardBoxState) => void;
  setRiveContainer: (el: HTMLDivElement | null) => void;
  setRewardRiveContainer: (el: HTMLDivElement | null) => void;
  setHasTodayReward: (val: boolean) => void;
  setCurrentCourse: (course: any) => void;
  setCurrentChapter: (chapter: any) => void;
  setIsRewardPathLoaded: (b: boolean) => void;
  isRewardPathLoaded: boolean;
}

// CACHES
const svgGroupCache: Record<string, SVGGElement | SVGSVGElement> = {};
const svgStringCache: Record<string, string> = {};
let pathwayTemplateCache: string | null = null;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const PATH_SIZE = 5;

// Sticker sequence for the sticker box
const STICKER_SEQUENCE = [
  "beetle",
  "fly",
  "ant",
  "snail",
  "butterfly",
  "flea",
  "whale",
  "octopus",
  "fishy",
  "turtle",
  "star fish",
  "gold fish",
];

const fetchLocalFile = async (path: string): Promise<string> => {
  const file = await Filesystem.readFile({
    path,
    directory: Directory.External,
  });
  return atob(file.data as string);
};

const fetchLocalGroup = async (
  path: string
): Promise<SVGGElement | SVGSVGElement> => {
  const text = await fetchLocalFile(path);
  const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector("svg");
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

const fetchRemoteSVGGroup = async (
  url: string
): Promise<SVGGElement | SVGSVGElement> => {
  const res = await fetch(url);
  const text = await res.text();
  const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector("svg");
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

const createSVGImage = (
  href: string,
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  className?: string
) => {
  const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttribute("href", href);

  if (width != null) img.setAttribute("width", String(width));
  if (height != null) img.setAttribute("height", String(height));
  if (x != null) img.setAttribute("x", String(x));
  if (y != null) img.setAttribute("y", String(y));
  if (className != null) img.setAttribute("class", className);

  img.onerror = () => img.setAttribute("href", "assets/icons/DefaultIcon.png");

  return img;
};

export function usePathwaySVG({
  containerRef,
  setModalOpen,
  setModalText,

  history,
  getCachedLesson,
  checkAndUpdateReward,
  updateMascotToNormalState,
  invokeMascotCelebration,
  setRewardRiveState,
  setRiveContainer,
  setRewardRiveContainer,
  setHasTodayReward,
  setCurrentCourse,
  setCurrentChapter,
  setIsRewardPathLoaded,
  isRewardPathLoaded,
}: UsePathwaySVGParams) {
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    (window as any).__triggerPathwayReload__ = loadSVG;
    loadSVG();

    return () => {
      delete (window as any).__triggerPathwayReload__;
    };
  }, [isRewardPathLoaded]);

  async function loadSVG() {
    if (!containerRef.current) return;

    try {
      const startTime = performance.now();

      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent) return;

      const rewardLearningPath = sessionStorage.getItem(REWARD_LEARNING_PATH);

      let learningPath: any;
      if (rewardLearningPath) {
        learningPath = JSON.parse(rewardLearningPath);
      } else if (currentStudent.learning_path) {
        const pathToParse = Util.getLatestLearningPathByUpdatedAt(currentStudent);
        learningPath = pathToParse
          ? JSON.parse(pathToParse)
          : null;
      } else {
        console.warn("No learning path found for current student");
        return;
      }

      const currentCourseIndex = learningPath.courses.currentCourseIndex;
      const course = learningPath.courses.courseList[currentCourseIndex];
      if (!course) return;
      const pathItem = course.path.find((p: LessonNode) => p && p.isPlayed === false);
      const isAssessment = pathItem?.is_assessment;
      const assessmentId = pathItem?.assignment_id;
      const activeIndex = course.path.findIndex((p: LessonNode) => p.isPlayed === false);
      const currentIndex = (activeIndex === -1 ? course.path.length - 1 : activeIndex);

      const startIndex = Math.max(0, currentIndex - (PATH_SIZE - 1));
      const pathEndIndex = Math.min(Math.max(course.path.length - 1, 4), startIndex + PATH_SIZE - 1);

      const [courseData, chapterData] = await Promise.all([
        api.getCourse(course.id),
        api.getChapterById(course.path.find((p: LessonNode) => p && p.isPlayed === false).chapter_id),
      ]);

      (window as any).__currentCourseForPathway__ = courseData;
      (window as any).__currentChapterForPathway__ = chapterData;
      setCurrentCourse(courseData);
      setCurrentChapter(chapterData);

      const lessons = await Promise.all(
        course.path
          .slice(startIndex, pathEndIndex + 1)
          .map((p: LessonNode) => getCachedLesson(p.lesson_id))
      );

      // Preload icons/images for lessons (to reduce flicker)
      preloadAllLessonImages(lessons);

      // Fetch sticker progress
      const stickerProgress = await api.getCurrentStickerBookWithProgress(currentStudent.id);
      let nextStickerId: string | null = null;
      let stickerBookId: string | null = null;
      let stickerBookSvgUrl: string | null = null;

      if (stickerProgress?.book) {
        stickerBookId = stickerProgress.book.id;
        stickerBookSvgUrl = stickerProgress.book.svg_url;
        nextStickerId = await api.getNextWinnableSticker(stickerBookId, currentStudent.id);
      }

      const usesMysteryBox = !nextStickerId || !stickerBookSvgUrl;

      const [
        pathwaySVG,
        flowerActive,
        flowerInactive,
        playedLessonSVG,
        halo,
      ] = await Promise.all([
        loadPathwayTemplate(),
        loadGroupAsset(
          "flowerActive",
          "remoteAsset/FlowerActive.svg",
          "/pathwayAssets/English/FlowerActive.svg"
        ),
        loadGroupAsset(
          "flowerInactive",
          "remoteAsset/FlowerInactive.svg",
          "/pathwayAssets/FlowerInactive.svg"
        ),
        loadGroupAsset(
          "playedLessonSVG",
          "remoteAsset/PlayedLesson.svg",
          "/pathwayAssets/English/PlayedLesson.svg"
        ),
        loadHalo(),
      ]);

      // Load sticker box or mystery box SVGs
      let stickerBoxSvg: SVGGElement | SVGSVGElement;
      let mysteryFrames: (SVGGElement | SVGSVGElement)[] = [];

      if (usesMysteryBox) {
        // All stickers exhausted → load all 3 mystery box frames
        const [mf1, mf2, mf3] = await Promise.all([
          loadGroupAsset(
            "mysteryBox1",
            "remoteAsset/mystery_box_frame_1.svg",
            "/stickers/mystery_box/mystery_box_frame_1.svg"
          ),
          loadGroupAsset(
            "mysteryBox2",
            "remoteAsset/mystery_box_frame_2.svg",
            "/stickers/mystery_box/mystery_box_frame_2.svg"
          ),
          loadGroupAsset(
            "mysteryBox3",
            "remoteAsset/mystery_box_frame_3.svg",
            "/stickers/mystery_box/mystery_box_frame_3.svg"
          ),
        ]);
        stickerBoxSvg = mf1;
        mysteryFrames = [mf1, mf2, mf3];
      } else {
        try {
          // Fetch the sticker book SVG and extract the specific sticker
          const remoteBookSvg = await fetchRemoteSVGGroup(stickerBookSvgUrl!);
          const extractedSvgString = extractStickerSvg(remoteBookSvg as SVGSVGElement, nextStickerId!);

          if (extractedSvgString) {
            const stickerSlotGroup = await loadGroupAsset(
              "stickerSlot",
              "remoteAsset/Stickerslot.svg",
              "/stickers/Stickerslot.svg"
            );

            const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
            wrapper.innerHTML = extractedSvgString;
            const extractedSvgNode = wrapper.querySelector("svg");

            if (extractedSvgNode) {
              extractedSvgNode.setAttribute("x", "6");
              extractedSvgNode.setAttribute("y", "6");
              extractedSvgNode.setAttribute("width", "45");
              extractedSvgNode.setAttribute("height", "32");

              const clone = stickerSlotGroup.cloneNode(true) as SVGSVGElement | SVGGElement;
              clone.appendChild(extractedSvgNode);
              stickerBoxSvg = clone;
            } else {
              // Fallback to plotting the slot alone if parsing fails
              stickerBoxSvg = stickerSlotGroup.cloneNode(true) as SVGSVGElement | SVGGElement;
            }
          } else {
             throw new Error("Sticker not found in book");
          }
        } catch (e) {
          console.error("Failed fetching or extracting sticker:", e);
          // Network/load failure → fallback to mystery box
          const [mf1, mf2, mf3] = await Promise.all([
            loadGroupAsset(
              "mysteryBox1",
              "remoteAsset/mystery_box_frame_1.svg",
              "/stickers/mystery_box/mystery_box_frame_1.svg"
            ),
            loadGroupAsset(
              "mysteryBox2",
              "remoteAsset/mystery_box_frame_2.svg",
              "/stickers/mystery_box/mystery_box_frame_2.svg"
            ),
            loadGroupAsset(
              "mysteryBox3",
              "remoteAsset/mystery_box_frame_3.svg",
              "/stickers/mystery_box/mystery_box_frame_3.svg"
            ),
          ]);
          stickerBoxSvg = mf1;
          mysteryFrames = [mf1, mf2, mf3];
        }
      }

      // Build SVG in next frame to keep main thread responsive
      requestAnimationFrame(async () => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = pathwaySVG;
        const svg = containerRef.current.querySelector("svg") as SVGSVGElement;
        if (!svg) return;
        svg.style.overflow = "visible";

        const paths = Array.from(
          svg.querySelectorAll("g > path")
        ) as SVGPathElement[];
        if (!paths.length) return;

        const startPoint = paths[0].getPointAtLength(0);
        const xValues = [27, 155, 276, 387, 496];

        const fragment = document.createDocumentFragment();

        // chimple foreignObject
        const chimple = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "foreignObject"
        );
        chimple.setAttribute("width", "32.5%");
        chimple.setAttribute("height", "100%");
        let lastIndex = -1;
        // Build lesson nodes
        lessons.forEach((lesson: any, idx: number) => {
          const path = paths[idx];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;

          const isPlayed = startIndex + idx < currentIndex;
          const isActive = startIndex + idx === currentIndex;

          const isValidUrl =
            typeof lesson.image === "string" &&
            /^(https?:\/\/|\/)/.test(lesson.image);

          const lessonImageUrl =
            isPlayed || isActive
              ? isValidUrl
                ? lesson.image
                : "assets/icons/DefaultIcon.png"
              : "assets/icons/NextNodeIcon.svg";

          const positionMappings = {
            playedLesson: {
              x: [flowerX - 5, flowerX - 10, flowerX - 7, flowerX, flowerX],
              y: [flowerY - 4, flowerY - 7, flowerY - 10, flowerY - 5, flowerY],
            },
            activeGroup: {
              x: [flowerX - 20, flowerX - 20, 260, flowerX - 10, flowerX - 15],
              y: [flowerY - 23, 5, 10, 5, 10],
            }
          };

          if (startIndex + idx < currentIndex) {
            // Played lesson
            const playedLesson = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            const lessonImage = createSVGImage(lessonImageUrl, 30, 30, 28, 30);
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
            // Active lesson
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

            // halo
            if (typeof halo === "string") {
              const haloImg = createSVGImage(halo, 140, 140, -15, -12);
              activeGroup.appendChild(haloImg);
            } else {
              const haloNode = halo.cloneNode(true) as
                | SVGSVGElement
                | SVGGElement;
              haloNode.setAttribute("x", "-15");
              haloNode.setAttribute("y", "-12");
              haloNode.setAttribute("width", "140");
              haloNode.setAttribute("height", "140");
              activeGroup.appendChild(haloNode);
            }

            const lessonImage = createSVGImage(lessonImageUrl, 30, 30, 40, 40);
            activeGroup.appendChild(
              flowerActive.cloneNode(true) as SVGGElement
            );
            activeGroup.appendChild(lessonImage);

            const pointer = createSVGImage(
              "/pathwayAssets/touchpointer.svg",
              35,
              35,
              85,
              80,
              "pathway-structure-animated-pointer"
            );
            activeGroup.appendChild(pointer);

            activeGroup.style.cursor = "pointer";
            activeGroup.addEventListener("click", () => {
              const pathEntry = course.path[startIndex + idx];
              handleLessonClick(
                lesson,
                course,
                pathEntry?.skill_id,
                isAssessment,
                assessmentId
              );
            });

            fragment.appendChild(activeGroup);
          }
          lastIndex = idx;
        });

        for(let i = lastIndex+ 1; i < PATH_SIZE; i++){
        const path = paths[i];
        const point = path.getPointAtLength(0);
        const flowerX = point.x - 40;
        const flowerY = point.y - 40;
          // Locked lesson
          const flower_Inactive = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
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
          const lessonImage = createSVGImage("assets/icons/NextNodeIcon.svg", 30, 30, 21, 23);
          flower_Inactive.appendChild(
            flowerInactive.cloneNode(true) as SVGGElement,
          );
          flower_Inactive.appendChild(lessonImage);
          flower_Inactive.addEventListener("click", () => {
            setModalOpen(true);
            setModalText(
              "This lesson is locked. Play the current active lesson.",
            );
          });
          flower_Inactive.setAttribute(
            "style",
            "cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);",
          );
          placeElement(
            flower_Inactive as SVGGElement,
            positionMappings.flowerInactive.x[i] ?? flowerX - 20,
            positionMappings.flowerInactive.y[i] ?? flowerY - 20,
          );
          fragment.appendChild(flower_Inactive);
        }

        // Sticker/Mystery box node (replaces old gift box)
        const endPath = paths[paths.length - 1];
        const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
        const Sticker_Svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        Sticker_Svg.setAttribute(
          "style",
          "cursor: pointer;"
        );

        let frameNodes: SVGElement[] = [];
        if (mysteryFrames.length > 0) {
          frameNodes = mysteryFrames.map(mf => mf.cloneNode(true) as SVGElement);
          frameNodes.forEach((node, idx) => {
            node.style.display = idx === 0 ? "block" : "none";
            Sticker_Svg.appendChild(node);
          });
        } else {
          Sticker_Svg.appendChild(stickerBoxSvg.cloneNode(true));
        }

        const stickerBaseX = endPoint.x - 25;
        const stickerBaseY = endPoint.y - 30;
        // Approximate center of sticker for rotation pivot (stickers ~62x49, mystery ~58x44)
        const stickerCenterX = 30;
        const stickerCenterY = 24;

        placeElement(Sticker_Svg, stickerBaseX, stickerBaseY);

        const isRewardFeatureOn =
          localStorage.getItem(IS_REWARD_FEATURE_ON) === "true";

        if (currentIndex < pathEndIndex + 1) {
          let isAnimating = false;

          Sticker_Svg.addEventListener("click", () => {
            if (isAnimating) return;
            isAnimating = true;

            if (mysteryFrames.length > 0 && frameNodes.length > 0) {
              // ── MYSTERY BOX: snappy frame-swap animation via display toggle ──
              const duration = 1200;
              let startTime: number | null = null;
              let lastFrameIdx = -1;

              const animate = (now: number) => {
                if (startTime === null) startTime = now;
                let progress = (now - startTime) / duration;
                if (progress < 0) progress = 0;
                if (progress > 1) progress = 1;

                // Frame cycle: neutral -> 2 -> 3 -> 2 -> 3 -> neutral
                const frameCycle = [0, 1, 2, 1, 2, 0, 1, 2];
                const cycleSpeed = 0.5;
                const cycleIdx = Math.floor(progress * frameCycle.length * cycleSpeed) % frameCycle.length;
                const currentFrameIdx = progress < 1 ? frameCycle[cycleIdx] : 0;

                if (currentFrameIdx !== lastFrameIdx) {
                  frameNodes.forEach((node, idx) => {
                    node.style.display = idx === currentFrameIdx ? "block" : "none";
                  });
                  lastFrameIdx = currentFrameIdx;
                }

                if (progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  isAnimating = false;
                  setModalText("Complete these 5 lessons to earn a sticker");
                  setModalOpen(true);
                }
              };

              requestAnimationFrame(animate);
            } else {
              // ── STICKER BOX: rotation-only wobble ──
              const wobbleDuration = 2000;
              let wobbleStart: number | null = null;

              const rotKeys = [
                { t: 0,    r: 0    },
                { t: 0.15, r: -10  },
                { t: 0.35, r: 10   },
                { t: 0.55, r: -6   },
                { t: 0.75, r: 4    },
                { t: 0.90, r: -1   },
                { t: 1,    r: 0    },
              ];

              const ease = (x: number) =>
                0.5 - 0.5 * Math.cos(Math.PI * x);

              const getRotation = (time: number): number => {
                if (time <= 0) return rotKeys[0].r;
                if (time >= 1) return rotKeys[rotKeys.length - 1].r;
                for (let i = 0; i < rotKeys.length - 1; i++) {
                  if (time >= rotKeys[i].t && time <= rotKeys[i + 1].t) {
                    const frac = (time - rotKeys[i].t) / (rotKeys[i + 1].t - rotKeys[i].t);
                    return rotKeys[i].r + (rotKeys[i + 1].r - rotKeys[i].r) * ease(frac);
                  }
                }
                return 0;
              };

              const animateWobble = (now: number) => {
                if (wobbleStart === null) wobbleStart = now;
                let progress = (now - wobbleStart) / wobbleDuration;
                if (progress < 0) progress = 0;
                if (progress > 1) progress = 1;

                const angle = getRotation(progress);

                Sticker_Svg.setAttribute(
                  "transform",
                  `translate(${stickerBaseX}, ${stickerBaseY}) ` +
                    `translate(${stickerCenterX}, ${stickerCenterY}) ` +
                    `rotate(${angle}) ` +
                    `translate(${-stickerCenterX}, ${-stickerCenterY})`
                );

                if (progress < 1) {
                  requestAnimationFrame(animateWobble);
                } else {
                  Sticker_Svg.setAttribute(
                    "transform",
                    `translate(${stickerBaseX}, ${stickerBaseY})`
                  );
                  isAnimating = false;

                  setModalText("Complete these 5 lessons to earn a sticker");
                  setModalOpen(true);
                }
              };

              requestAnimationFrame(animateWobble);
            }
          });
        }

        fragment.appendChild(Sticker_Svg);
        svg.appendChild(fragment);

        // Setup chimple mascot initial position
        const idx = lessons.findIndex(
          (_: any, index: number) => startIndex + index === currentIndex - 1
        );
        const xValuesForChimple = [-60, 66, 180, 295, 412];

        const newRewardIdFromCheck = await checkAndUpdateReward();

        const isStringReward =
          newRewardIdFromCheck !== null &&
          typeof newRewardIdFromCheck === "string";

        // If there is a reward, run full reward animation flow
        if (isStringReward && isRewardFeatureOn) {
          runRewardAnimation(
            newRewardIdFromCheck as string,
            lessons,
            startIndex,
            currentIndex,
            svg,
            startPoint,
            xValues,
            chimple,
            pathEndIndex
          );
        }

        // Attach chimple (mascot)
        if (chimple) {
          let baseX: number;
          if (idx < 0 || !isStringReward || !isRewardFeatureOn) {
            // default logic – same as original: next active lesson
            baseX = xValues[idx + 1] ?? xValues[0];
            chimple.setAttribute("x", `${baseX - 87}`);
          } else {
            baseX = xValuesForChimple[idx] ?? xValues[0];
            chimple.setAttribute("x", `${baseX}`);
          }

          chimple.setAttribute("y", `${startPoint.y - 15}`);
          chimple.style.pointerEvents = "none";

          const riveDiv = document.createElement("div");
          riveDiv.style.width = "100%";
          riveDiv.style.height = "100%";
          chimple.appendChild(riveDiv);
          svg.appendChild(chimple);

          setRiveContainer(riveDiv);
        }

        const endTime = performance.now();
        console.log(`SVG loaded in ${(endTime - startTime).toFixed(2)}ms`);
      });
    } catch (error) {
      console.error("Failed to load SVG:", error);
    }
  }

  async function loadPathwayTemplate(): Promise<string> {
    if (pathwayTemplateCache) return pathwayTemplateCache;

    const local = "/pathwayAssets/English/Pathway.svg";
    const remote = "remoteAsset/Pathway.svg";

    if (Capacitor.isNativePlatform()) {
      try {
        const text = await fetchLocalFile(remote);
        pathwayTemplateCache = text;
        return text;
      } catch (err) {
        console.error("Error in loading pathway template ", err);
      }
    }

    const res = await fetch(local);
    const txt = await res.text();
    pathwayTemplateCache = txt;
    return txt;
  }

  async function loadGroupAsset(
    name: string,
    remotePath: string,
    localPath: string
  ): Promise<SVGGElement | SVGSVGElement> {
    const cached = svgGroupCache[name];
    if (cached) {
      return cached.cloneNode(true) as SVGGElement | SVGSVGElement;
    }

    let group: SVGGElement | SVGSVGElement;
    if (Capacitor.isNativePlatform()) {
      try {
        group = await fetchLocalGroup(remotePath);
      } catch {
        group = await fetchRemoteSVGGroup(localPath);
      }
    } else {
      group = await fetchRemoteSVGGroup(localPath);
    }

    svgGroupCache[name] = group;
    return group.cloneNode(true) as SVGGElement | SVGSVGElement;
  }

  async function loadHalo(): Promise<SVGGElement | SVGSVGElement | string> {
    const cached = svgGroupCache["halo"];
    if (cached) {
      return cached.cloneNode(true) as SVGGElement | SVGSVGElement;
    }

    const local = "/pathwayAssets/English/halo.svg";
    const remote = "remoteAsset/halo.svg";
    let group: SVGGElement | SVGSVGElement | null = null;

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          group = await fetchLocalGroup(remote);
        } catch (err) {
          console.warn("Failed to load local halo.svg, fetching remote", err);
        }
      }
      if (!group) {
        group = await fetchRemoteSVGGroup(local);
      }
      svgGroupCache["halo"] = group;
      return group.cloneNode(true) as SVGGElement | SVGSVGElement;
    } catch {
      svgStringCache["halo"] = local;
      return local;
    }
  }

  const placeElement = (element: SVGGElement, x: number, y: number) => {
    element.setAttribute("transform", `translate(${x}, ${y})`);
  };

  async function preloadAllLessonImages(lessons: any[]) {
    Promise.all(
      lessons.map((lesson) => {
        const isValidUrl =
          typeof lesson.image === "string" &&
          /^(https?:\/\/|\/)/.test(lesson.image);
        const src = isValidUrl ? lesson.image : "assets/icons/DefaultIcon.png";
        return preloadImage(src);
      })
    );
  }

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  };

  async function runRewardAnimation(
    newRewardId: string,
    lessons: any[],
    startIndex: number,
    currentIndex: number,
    svg: SVGSVGElement,
    startPoint: DOMPoint,
    xValues: number[],
    chimple: SVGForeignObjectElement,
    pathEndIndex: number
  ) {
    const rewardRecord = await ServiceConfig.getI().apiHandler.getRewardById(
      newRewardId
    );
    if (!rewardRecord) return;

    setHasTodayReward(false);

    // The reward flies to the completed lesson's position (currentIndex - 1)
    const completedLessonIndex = lessons.findIndex(
      (_: any, idx: number) => startIndex + idx === currentIndex - 1
    );
    const destinationX =
      xValues[completedLessonIndex >= 0 ? completedLessonIndex : 0] ?? 0;

    const rewardForeignObject = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    rewardForeignObject.setAttribute("width", "140");
    rewardForeignObject.setAttribute("height", "140");
    rewardForeignObject.setAttribute("x", "0");
    rewardForeignObject.setAttribute("y", "0");
    rewardForeignObject.style.display = "block";
    (rewardForeignObject.style as any).transformBox = "fill-box";
    rewardForeignObject.style.transformOrigin = "0 0";
    rewardForeignObject.style.willChange = "transform";
    rewardForeignObject.style.backfaceVisibility = "hidden";
    (rewardForeignObject.style as any).contain = "layout paint style";

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

      // Step 1: set celebration state (we emulate via global mascot state)
      await invokeMascotCelebration(rewardRecord.state_number_input || 1);

      await delay(500);
      rewardForeignObject.style.display = "none";
      await delay(1000);

      // Step 2: revert to new normal state
      await updateMascotToNormalState(newRewardId);

      await delay(500);

      // Step 3: animate mascot movement
      animateChimpleMovement(
        chimple,
        lessons,
        startIndex,
        currentIndex,
        xValues,
        startPoint,
        pathEndIndex
      );

      await Util.updateUserReward();
    };

    const rewardDiv = document.createElement("div");
    rewardDiv.style.width = "100%";
    rewardDiv.style.height = "100%";
    rewardForeignObject.appendChild(rewardDiv);
    svg.appendChild(rewardForeignObject);
    setRewardRiveContainer(rewardDiv);

    requestAnimationFrame(animateBezier);
  }

  function animateChimpleMovement(
    chimple: SVGForeignObjectElement,
    lessons: any[],
    startIndex: number,
    currentIndex: number,
    xValues: number[],
    startPoint: DOMPoint,
    pathEndIndex: number
  ) {
    if (!chimple) return;

    if (currentIndex > pathEndIndex) {
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
      setIsRewardPathLoaded(true);
      return;
    }

    const currentLessonIndex = lessons.findIndex(
      (_: any, idx: number) => startIndex + idx === currentIndex
    );
    if (currentLessonIndex < 0) return;

    const previousLessonIndex = currentLessonIndex - 1;
    if (previousLessonIndex < 0) return;

    const fromX = xValues[previousLessonIndex] ?? 0;
    const toX = xValues[currentLessonIndex] ?? 0;

    chimple.setAttribute("x", `${toX - 87}`);
    chimple.setAttribute("y", `${startPoint.y - 15}`);

    chimple.style.display = "block";
    (chimple.style as any).transformBox = "fill-box";
    chimple.style.transformOrigin = "0 0";
    chimple.style.willChange = "transform";

    const fromTranslateX = fromX - 97 - (toX - 87);

    chimple.style.transition = "none";
    chimple.style.transform = `translate(${fromTranslateX}px, 0px)`;
    void chimple.getBoundingClientRect();

    requestAnimationFrame(() => {
      chimple.style.transition =
        "transform 2000ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      chimple.style.transform = "translate(0px, 0px)";
    });
  }

  function handleLessonClick(
    lesson: any,
    course: any,
    skillId?: string,
    is_assessment?: boolean,
    assessmentId?: string
  ) {
    if (!history) return;

    const currentCourse = (window as any).__currentCourseForPathway__;
    const currentChapter = (window as any).__currentChapterForPathway__;

    if (lesson.plugin_type === COCOS) {
      const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      history.replace(PAGES.GAME + params, {
        url: "chimple-lib/index.html" + params,
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course.course_id,
        course: JSON.stringify(currentCourse),
        lesson: JSON.stringify(lesson),
        chapter: JSON.stringify(currentChapter),
        from: history.location.pathname + `?${CONTINUE}=true`,
        learning_path: true,
        skillId: skillId,
        is_assessment: is_assessment,
      });
    } else if (lesson.plugin_type === LIVE_QUIZ) {
      history.replace(
        PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
        {
          courseId: course.course_id,
          lesson: JSON.stringify(lesson),
          from: history.location.pathname + `?${CONTINUE}=true`,
          learning_path: true,
          skillId: skillId,
          is_assessment: is_assessment,
        }
      );
    } else if (
      lesson.plugin_type === LIDO ||
      lesson.plugin_type === LIDO_ASSESSMENT
    ) {
      const p = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
      history.replace(PAGES.LIDO_PLAYER + p, {
        lessonId: lesson.cocos_lesson_id,
        courseDocId: course.course_id,
        course: JSON.stringify(currentCourse),
        lesson: JSON.stringify(lesson),
        chapter: JSON.stringify(currentChapter),
        from: history.location.pathname + `?${CONTINUE}=true`,
        learning_path: true,
        skillId: skillId,
        is_assessment: is_assessment,
        assessmentId: assessmentId,
      });
    }
  }

  return null;
}
