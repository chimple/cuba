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
        learningPath = JSON.parse(currentStudent.learning_path);
      } else {
        console.warn("No learning path found for current student");
        return;
      }

      const currentCourseIndex = learningPath.courses.currentCourseIndex;
      const course = learningPath.courses.courseList[currentCourseIndex];
      const pathItem = course.path[currentCourseIndex];
      const isAssessment = pathItem?.is_assessment;
      const assessmentId = pathItem?.assignment_id;
      if (!course) return;

      const { startIndex, currentIndex, pathEndIndex } = course;

      const [courseData, chapterData] = await Promise.all([
        api.getCourse(course.id),
        api.getChapterById(course.path[currentIndex].chapter_id),
      ]);

      (window as any).__currentCourseForPathway__ = courseData;
      (window as any).__currentChapterForPathway__ = chapterData;
      setCurrentCourse(courseData);
      setCurrentChapter(chapterData);

      const lessons = await Promise.all(
        course.path
          .slice(startIndex, pathEndIndex + 1)
          .map((p: any) => getCachedLesson(p.lesson_id))
      );

      // Preload icons/images for lessons (to reduce flicker)
      preloadAllLessonImages(lessons);

      const [
        pathwaySVG,
        flowerActive,
        flowerInactive,
        playedLessonSVG,
        gift1,
        gift2,
        gift3,
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
        loadGroupAsset(
          "giftSVG",
          "remoteAsset/pathGift1.svg",
          "/pathwayAssets/English/pathGift1.svg"
        ),
        loadGroupAsset(
          "giftSVG2",
          "remoteAsset/pathGift2.svg",
          "/pathwayAssets/English/pathGift2.svg"
        ),
        loadGroupAsset(
          "giftSVG3",
          "remoteAsset/pathGift3.svg",
          "/pathwayAssets/English/pathGift3.svg"
        ),
        loadHalo(),
      ]);

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
          } else {
            // Locked lesson
            const flower_Inactive = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            const lessonImage = createSVGImage(lessonImageUrl, 30, 30, 21, 23);
            flower_Inactive.appendChild(
              flowerInactive.cloneNode(true) as SVGGElement
            );
            flower_Inactive.appendChild(lessonImage);
            flower_Inactive.addEventListener("click", () => {
              setModalOpen(true);
              setModalText(
                "This lesson is locked. Play the current active lesson."
              );
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

        // Gift node
        const endPath = paths[paths.length - 1];
        const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
        const Gift_Svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        Gift_Svg.setAttribute(
          "style",
          "cursor: pointer; transform-origin: center;"
        );
        Gift_Svg.appendChild(gift1.cloneNode(true));
        placeElement(Gift_Svg, endPoint.x - 25, endPoint.y - 30);

        const isRewardFeatureOn =
          localStorage.getItem(IS_REWARD_FEATURE_ON) === "true";

        if (currentIndex < pathEndIndex + 1) {
          Gift_Svg.addEventListener("click", () => {
            const replaceGiftContent = (newContent: SVGElement) => {
              while (Gift_Svg.firstChild) {
                Gift_Svg.removeChild(Gift_Svg.firstChild);
              }
              Gift_Svg.appendChild(newContent.cloneNode(true));
            };

            const animationSequence = [
              { content: gift2, delay: 300 },
              { content: gift3, delay: 500 },
              { content: gift2, delay: 700 },
              { content: gift3, delay: 900 },
              {
                callback: () => {
                  setModalText("Complete these 5 lessons to earn rewards");
                  setModalOpen(true);
                  replaceGiftContent(gift1);
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
