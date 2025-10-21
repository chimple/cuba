import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./PathwayStructure.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import {
  CAN_ACCESS_REMOTE_ASSETS,
  COCOS,
  CONTINUE,
  IDLE_REWARD_ID,
  IS_REWARD_FEATURE_ON,
  LIDO,
  LIVE_QUIZ,
  PAGES,
  REWARD_LEARNING_PATH,
  REWARD_MODAL_SHOWN_DATE,
  RewardBoxState,
  TableTypes,
} from "../../common/constants";
import PathwayModal from "./PathwayModal";
import { t } from "i18next";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import ChimpleRiveMascot from "./ChimpleRiveMascot";
import RewardBox from "./RewardBox";
import DailyRewardModal from "./DailyRewardModal";
import RewardRive from "./RewardRive";
import { useReward } from "../../hooks/useReward";

// Define a new type for the reward animation state
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const PathwayStructure: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [riveContainer, setRiveContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [rewardRiveContainer, setRewardRiveContainer] =
    useState<HTMLDivElement | null>(null);

  // Animation-specific State
  const [rewardRiveState, setRewardRiveState] = useState<
    RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST
  >(RewardBoxState.IDLE);

  // State for default mascot
  const [chimpleRiveStateMachineName, setChimpleRiveStateMachineName] =
    useState<string>("State Machine 3");
  const [chimpleRiveInputName, setChimpleRiveInputName] =
    useState<string>("Number 2");
  const [chimpleRiveStateValue, setChimpleRiveStateValue] = useState<number>(1);
  const [chimpleRiveAnimationName, setChimpleRiveAnimationName] = useState<
    string | undefined
  >("id");
  const [mascotKey, setMascotKey] = useState(0); 

  const {
  hasTodayReward,
  setHasTodayReward,
  checkAndUpdateReward,
  shouldShowDailyRewardModal,
  } = useReward();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>();
  const [currentChapter, setCurrentChapter] = useState<TableTypes<"chapter">>();

  // State for daily reward modal and reward box visibility
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [isRewardPathLoaded, setIsRewardPathLoaded] = useState(false); // New state for reward path
  const inactiveText = t(
    "This lesson is locked. Play the current active lesson."
  );
  const rewardText = t("Complete these 5 lessons to earn rewards");
  const shouldShowRemoteAssets = useFeatureIsOn(CAN_ACCESS_REMOTE_ASSETS);
  const isRewardFeatureOn: boolean = localStorage.getItem(IS_REWARD_FEATURE_ON) === "true";

  const shouldAnimate = modalText === rewardText;
  const fetchLocalSVGGroup = async (
    path: string,
    className?: string
  ): Promise<SVGGElement> => {
    const file = await Filesystem.readFile({
      path,
      directory: Directory.External,
    });
    const svgText = atob(file.data as string);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.innerHTML = svgText;
    if (className) group.setAttribute("class", className);
    return group;
  };
  const loadPathwayContent = async (
    path: string,
    webPath: string
  ): Promise<string> => {
    if (shouldShowRemoteAssets && Capacitor.isNativePlatform()) {
      try {
        const file = await Filesystem.readFile({
          path,
          directory: Directory.External,
        });
        return atob(file.data as string);
      } catch {
        const res = await fetch(webPath);
        return await res.text();
      }
    } else {
      const res = await fetch(webPath);
      return await res.text();
    }
  };

  const loadHaloAnimation = async (
    localPath: string,
    webPath: string
  ): Promise<string> => {
    if (Capacitor.isNativePlatform() && shouldShowRemoteAssets) {
      try {
        const file = await Filesystem.readFile({
          path: localPath,
          directory: Directory.External,
        });
        return `data:image/svg+xml;base64,${file.data}`;
      } catch (err) {
        console.warn("Fallback to web asset for:", webPath, err);
        return webPath;
      }
    }
    return webPath;
  };

  const tryFetchSVG = async (
    localPath: string,
    webPath: string,
    name: string
  ) => {
    if (Capacitor.isNativePlatform() && shouldShowRemoteAssets) {
      try {
        return await fetchLocalSVGGroup(localPath, name);
      } catch {
        return await fetchSVGGroup(webPath, name);
      }
    } else {
      return await fetchSVGGroup(webPath, name);
    }
  };

  const fetchSVGGroup = async (
    url: string,
    className?: string
  ): Promise<SVGGElement> => {
    const res = await fetch(url);
    const svgContent = await res.text();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.innerHTML = svgContent;
    if (className) group.setAttribute("class", className);
    return group;
  };

  const createSVGImage = (
    href: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    opacity?: number
  ) => {
    const image = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    image.setAttribute("href", href);
    if (width) image.setAttribute("width", `${width}`);
    if (height) image.setAttribute("height", `${height}`);
    if (x) image.setAttribute("x", `${x}`);
    if (y) image.setAttribute("y", `${y}`);
    if (opacity !== undefined) {
      image.setAttribute("opacity", opacity.toString());
    }
    // ✅ Add onerror fallback
    image.onerror = () => {
      image.setAttribute("href", "assets/icons/DefaultIcon.png");
    };
    return image;
  };

   // Cache lesson data
    const lessonCache = new Map<string, any>();

    const getCachedLesson = async (lessonId: string): Promise<any> => {
      if (lessonCache.has(lessonId)) return lessonCache.get(lessonId);

      const key = `lesson_${lessonId}`;
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        lessonCache.set(lessonId, parsed);
        return parsed;
      }

      const lesson = await api.getLesson(lessonId);
      lessonCache.set(lessonId, lesson);
      sessionStorage.setItem(key, JSON.stringify(lesson));
      return lesson;
    };

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    };

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

        const currentStudent = Util.getCurrentStudent()
        let learningPath;
        const rewardLearningPath = sessionStorage.getItem(REWARD_LEARNING_PATH);

        if (rewardLearningPath) {
          learningPath = JSON.parse(rewardLearningPath);
        } else {
          learningPath = currentStudent?.learning_path
            ? JSON.parse(currentStudent.learning_path)
            : null;
        }
        if (!learningPath) return;

        const currentCourseIndex = learningPath?.courses.currentCourseIndex;
        const course = learningPath?.courses.courseList[currentCourseIndex];
        const { startIndex, currentIndex, pathEndIndex } = course;
        const [courseData, chapterData] = await Promise.all([
            api.getCourse(course.id),
            api.getChapterById(course.path[currentIndex].chapter_id)
        ]);
        setCurrentCourse(courseData);
        setCurrentChapter(chapterData);

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

        // Declare chimple here to be accessible in different scopes
        let chimple: SVGForeignObjectElement | null = null;
        chimple = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "foreignObject"
        );
        chimple.setAttribute("width", "32.5%");
        chimple.setAttribute("height", "100%");

        requestAnimationFrame(async () => {
          if(containerRef.current){
          containerRef.current.innerHTML = svgContent;
          const svg = containerRef.current!.querySelector(
            "svg"
          ) as SVGSVGElement;
          if (!svg) return;
          svg.style.overflow = "visible";

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
                if (lesson.plugin_type === COCOS) {
                  const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                  history.replace(PAGES.GAME + params, {
                    url: "chimple-lib/index.html" + params,
                    lessonId: lesson.cocos_lesson_id,
                    courseDocId: course.course_id,
                    lesson: JSON.stringify(lesson),
                    chapter: JSON.stringify(currentChapter),
                    from: history.location.pathname + `?${CONTINUE}=true`,
                    course: JSON.stringify(currentCourse),
                    learning_path: true,
                  });
                } else if(lesson.plugin_type === LIVE_QUIZ){
                  history.replace(
                    PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
                    {
                      courseId: course.course_id,
                      lesson: JSON.stringify(lesson),
                      from: history.location.pathname + `?${CONTINUE}=true`,
                      learning_path: true,
                    }
                  );
                } else if (lesson.plugin_type === LIDO) {
                    const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                    history.replace(PAGES.LIDO_PLAYER + parmas, {
                      lessonId: lesson.cocos_lesson_id,
                      courseDocId: course.course_id,
                      course: JSON.stringify(currentCourse),
                      lesson: JSON.stringify(lesson),
                      chapter: JSON.stringify(currentChapter),
                      from: history.location.pathname + `?${CONTINUE}=true`,
                      learning_path: true,
                    });
                  }
              });
              fragment.appendChild(activeGroup);
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

          const animateChimpleMovement = () => {
            if (!chimple) return;

            if(currentIndex>pathEndIndex){
              sessionStorage.removeItem(REWARD_LEARNING_PATH);
              setIsRewardPathLoaded(true);
              return ;
            }
            // The mascot's current visual position on screen
            const currentLessonIndex = lessons.findIndex(
              (_, idx) => startIndex + idx === currentIndex
            );
            if (currentLessonIndex < 0) return;

            // The mascot's previous position (where it should animate from)
            const previousLessonIndex = currentLessonIndex - 1;
            if (previousLessonIndex < 0) return;

            const fromX = xValues[previousLessonIndex] ?? 0;
            const toX = xValues[currentLessonIndex] ?? 0;

            // place the foreignObject at the target x/y (so transform translates relative to correct baseline)
            chimple.setAttribute("x", `${toX - 87}`);
            chimple.setAttribute("y", `${startPoint.y - 15}`);

            // Ensure CSS transforms are applied to the SVG element
            chimple.style.display = "block";
            // Required for CSS transform to behave correctly on SVG elements in many browsers
            (chimple.style as any).transformBox = "fill-box";
            chimple.style.transformOrigin = "0 0";
            chimple.style.willChange = "transform";

            // Compute how far it should start from (so translate(0) lands at the target)
            const fromTranslateX = fromX - 97 - (toX - 87);

            // 1) Set initial state with no transition
            chimple.style.transition = "none";
            chimple.style.transform = `translate(${fromTranslateX}px, 0px)`;

            // Force layout so the browser registers the initial transform
            // (this is important before switching on the transition)
            void chimple.getBoundingClientRect();

            // 2) In next frame enable transition and move to final position
            requestAnimationFrame(() => {
              if (chimple) {
                // Use a more physical-like easing curve (easeInOutCubic-ish)
                chimple.style.transition =
                  "transform 2000ms cubic-bezier(0.22, 0.61, 0.36, 1)";
                chimple.style.transform = "translate(0px, 0px)";
              }
            });
          };

          const runRewardAnimation = async (newRewardId: string) => {
            const rewardRecord = await api.getRewardById(newRewardId);
            if (!rewardRecord) return;

            setHasTodayReward(false);

            // The reward flies to the completed lesson's position (currentIndex - 1)
            const completedLessonIndex = lessons.findIndex(
              (_, idx) => startIndex + idx === currentIndex - 1
            );
            const destinationX =
              xValues[completedLessonIndex >= 0 ? completedLessonIndex : 0] ??
              0;

            const rewardForeignObject = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "foreignObject"
            );
            rewardForeignObject.setAttribute("width", "140");
            rewardForeignObject.setAttribute("height", "140");
            rewardForeignObject.setAttribute("x", "0");
            rewardForeignObject.setAttribute("y", "0");
            // Apply the same smoothing hints used for the mascot
            rewardForeignObject.style.display = "block";
            (rewardForeignObject.style as any).transformBox = "fill-box";
            rewardForeignObject.style.transformOrigin = "0 0";
            rewardForeignObject.style.willChange = "transform";
            // Additional compositor hints for smoother animations
            rewardForeignObject.style.backfaceVisibility = "hidden";
            // Use CSS contain to limit invalidation scope
            (rewardForeignObject.style as any).contain = "layout paint style";

            const fromX = 570,
              fromY = 110;
            const toX = destinationX - 27,
              toY = startPoint.y - 69;
            const controlX = (fromX + toX) / 2,
              controlY = Math.min(fromY, toY) - 150;

            const duration = 4000;
            const start = performance.now();

            const animateBezier = (now: number) => {
              let t = (now - start) / duration;
              if (t > 1) t = 1;

              const easeInOutCubic = (val: number) =>
                val < 0.5
                  ? 4 * val * val * val
                  : 1 - Math.pow(-2 * val + 2, 3) / 2;
              const bezier = (
                tVal: number,
                p0: number,
                p1: number,
                p2: number
              ) =>
                (1 - tVal) ** 2 * p0 +
                2 * (1 - tVal) * tVal * p1 +
                tVal ** 2 * p2;

              const easedT = easeInOutCubic(t);
              const x = bezier(easedT, fromX, controlX, toX);
              const y = bezier(easedT, fromY, controlY, toY);
              // Use translate3d to encourage GPU compositing
              rewardForeignObject.style.transform = `translate3d(${x}px, ${y}px, 0)`;

              if (t < 1) {
                requestAnimationFrame(animateBezier);
              } else {
                onBoxArrival();
              }
            };

            const onBoxArrival = async () => {
              
              setRewardRiveState(RewardBoxState.BLAST);

              await delay(2000); // Wait for blast to finish

              // Step 1: Play celebration animation by forcing mascot to re-mount
              setChimpleRiveStateMachineName("State Machine 2");
              setChimpleRiveInputName("Number 1");
              setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
              setChimpleRiveAnimationName(undefined);
              setMascotKey((prev) => prev + 1); // Force re-mount for celebration
              await delay(500);
              rewardForeignObject.style.display = "none";

              await delay(1000); // Wait for celebration to finish

              // Step 2: Revert to the new normal state
              await updateMascotToNormalState(newRewardId);
              
              await delay(500); // Small delay to ensure state is set before moving
              // Step 3: Animate mascot movement to the new active lesson
              animateChimpleMovement();
            };

            const rewardDiv = document.createElement("div");
            rewardDiv.style.width = "100%";
            rewardDiv.style.height = "100%";
            rewardForeignObject.appendChild(rewardDiv);
            svg.appendChild(rewardForeignObject);
            setRewardRiveContainer(rewardDiv);

            requestAnimationFrame(animateBezier);
            await Util.updateUserReward();
          };

          const newRewardId = await checkAndUpdateReward();
          if (newRewardId !== null && typeof newRewardId === "string" && isRewardFeatureOn) {
            runRewardAnimation(newRewardId);
          }

          fragment.appendChild(Gift_Svg);
          svg.appendChild(fragment);

          if (chimple) {
            const idx = lessons.findIndex(
              (_, idx) => startIndex + idx === (currentIndex) - 1
            );
            const chimpleXValues = [-60, 66, 180, 295, 412]
            if (idx < 0 || newRewardId == null || !isRewardFeatureOn) {
              chimple.setAttribute("x", `${xValues[idx + 1] - 87}`);
            } else {
            chimple.setAttribute("x", `${chimpleXValues[idx]}`);
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
          }
        });
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };

    // Reusable position helper
    const placeElement = (element: SVGGElement, x: number, y: number) => {
      element.setAttribute("transform", `translate(${x}, ${y})`);
    };

    const initializePathway = async () => {
      // Load SVG and check for new rewards in parallel
      const todaysReward = await Promise.all([
        loadSVG(),
        checkAndUpdateReward(),
        Util.fetchTodaysReward(),
      ]).then(([, , resultOfFetchTodaysReward]) => resultOfFetchTodaysReward);
      const currentReward = Util.retrieveUserReward();
      const today = new Date().toISOString().split("T")[0];
      const receivedTodayReward =
        currentReward?.timestamp &&
        new Date(currentReward.timestamp).toISOString().split("T")[0] ===
          today &&
        todaysReward?.id === currentReward?.reward_id;
      setHasTodayReward(!receivedTodayReward);
      if (currentReward.reward_id !== IDLE_REWARD_ID) {
        await updateMascotToNormalState(currentReward.reward_id);
      }
    };


  useEffect(() => {

    // Listen for course changes
    const handleCourseChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      loadSVG(customEvent.detail.currentStudent);
    };

    window.addEventListener(
      "courseChanged",
      handleCourseChange as EventListener
    );
      if (isRewardFeatureOn) {
        initializePathway();
      } else {
        loadSVG();
      }

    return () => {
      window.removeEventListener("courseChanged", handleCourseChange);
    };
  }, [isRewardPathLoaded]);

  useEffect(() => {
    const showModalIfNeeded = async () => {
      const showModal = await shouldShowDailyRewardModal();
      setRewardModalOpen(showModal);
    };
  if(isRewardFeatureOn) {showModalIfNeeded();}
  }, []);

  const updateMascotToNormalState = async (rewardId: string) => {
    const rewardRecord = await api.getRewardById(rewardId);
    if (rewardRecord && rewardRecord.type === "normal") {
      setChimpleRiveStateMachineName(
        rewardRecord.state_machine || "State Machine 3"
      );
      setChimpleRiveInputName(rewardRecord.state_input_name || "Number 2");
      setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
      setChimpleRiveAnimationName(undefined);
      setMascotKey((prev) => prev + 1);
    } else {
      setChimpleRiveAnimationName("id");
      setMascotKey((prev) => prev + 1);
    }
  };

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());
  };

  const handleOnPlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRewardModalOpen(false);
    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());
    try {
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent?.learning_path) return;
      const api = ServiceConfig.getI().apiHandler;
      const learningPath = JSON.parse(currentStudent.learning_path);
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];
      const { currentIndex } = course;

      const lesson = await api.getLesson(course.path[currentIndex].lesson_id);
 
      if (!lesson) return;

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
          reward: true,
        });
      } else if (lesson.plugin_type === LIVE_QUIZ) {
        history.replace(
          PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
          {
            courseId: course.course_id,
            lesson: JSON.stringify(lesson),
            from: history.location.pathname + `?${CONTINUE}=true`,
            learning_path: true,
            reward: true,
          }
        );
      } else if (lesson.plugin_type === LIDO) {
        const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
        history.replace(PAGES.LIDO_PLAYER + parmas, {
          lessonId: lesson.cocos_lesson_id,
          courseDocId: course.course_id,
          course: JSON.stringify(currentCourse),
          lesson: JSON.stringify(lesson),
          chapter: JSON.stringify(currentChapter),
          from: history.location.pathname + `?${CONTINUE}=true`,
          learning_path: true,
          reward: true,
        });
      }
    } catch (error) {
      console.error("Error in playLesson:", error);
    }
  };


  return (
    <>
      {isModalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
        />
      )}
      <div className="pathway-structure-div" ref={containerRef}></div>
      {riveContainer &&
        ReactDOM.createPortal(
          <ChimpleRiveMascot
            key={mascotKey}
            stateMachine={chimpleRiveStateMachineName}
            inputName={chimpleRiveInputName}
            stateValue={chimpleRiveStateValue}
            animationName={chimpleRiveAnimationName}
          />,
          riveContainer
        )}

      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer
        )}

      {(hasTodayReward && isRewardFeatureOn) && <RewardBox onRewardClick={handleOpen} />}

      {(rewardModalOpen && isRewardFeatureOn) && (
        <DailyRewardModal
          text={t("Play one lesson and collect your daily reward!")}
          onClose={handleClose}
          onPlay={handleOnPlay}
        />
      )}
    </>
  );
};

export default PathwayStructure;
