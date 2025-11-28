import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./HomeworkPathwayStructure.css";
import { useHistory } from "react-router";
import { t } from "i18next";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  HOMEWORK_REMOTE_ASSETS_ENABLED,
  CAN_ACCESS_REMOTE_ASSETS,
  COCOS,
  CONTINUE,
  HOMEWORK_PATHWAY,
  IS_REWARD_FEATURE_ON,
  LIDO,
  LIVE_QUIZ,
  PAGES,
  REWARD_LEARNING_PATH,
  REWARD_MODAL_SHOWN_DATE,
  RewardBoxState,
  TableTypes,
} from "../../common/constants";
import { useReward } from "../../hooks/useReward";
import { Util } from "../../utility/util";
import RewardRive from "../learningPathway/RewardRive";
import PathwayModal from "../learningPathway/PathwayModal";
import ChimpleRiveMascot from "../learningPathway/ChimpleRiveMascot";
import RewardBox from "../learningPathway/RewardBox";
import DailyRewardModal from "../learningPathway/DailyRewardModal";
import HomeworkCompleteModal from "./HomeworkCompleteModal";

interface HomeworkPathwayStructureProps {
  selectedSubject?: string | null;
  onPlayMoreHomework?: () => void;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const HomeworkPathwayStructure: React.FC<HomeworkPathwayStructureProps> = ({
  selectedSubject,
  onPlayMoreHomework,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showHomeworkCompleteModal, setShowHomeworkCompleteModal] =
    useState(false);

  const [modalText, setModalText] = useState("");
  const [riveContainer, setRiveContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [rewardRiveContainer, setRewardRiveContainer] =
    useState<HTMLDivElement | null>(null);

  const [rewardRiveState, setRewardRiveState] = useState<
    RewardBoxState.IDLE | RewardBoxState.SHAKING | RewardBoxState.BLAST
  >(RewardBoxState.IDLE);

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

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [isRewardPathLoaded, setIsRewardPathLoaded] = useState(false);

  // New state for homework pathway lessons array
  const [homeworkLessons, setHomeworkLessons] = useState<any[]>([]);

  const inactiveText = t(
    "This lesson is locked. Play the current active lesson."
  );
  const rewardText = t("Complete these 5 lessons to earn rewards");
  const shouldShowHomeworkRemoteAssets = useFeatureIsOn(
    HOMEWORK_REMOTE_ASSETS_ENABLED
  );

  const isRewardFeatureOn: boolean =
    localStorage.getItem(HOMEWORK_PATHWAY) === "true";

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

  const loadHaloAnimation = async (
    localPath: string,
    webPath: string
  ): Promise<string> => {
    if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
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
    if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
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

  // Utility: Create SVG image element with fallback
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
    image.onerror = () => {
      image.setAttribute("href", "assets/icons/DefaultIcon.png");
    };
    return image;
  };

  const loadPathwayContent = async (
    path: string,
    webPath: string
  ): Promise<string> => {
    if (shouldShowHomeworkRemoteAssets && Capacitor.isNativePlatform()) {
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

  // Cache lesson data in memory and sessionStorage
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

  const preloadImage = (src: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

  const preloadAllLessonImages = async (lessons: any[]) => {
    await Promise.all(
      lessons.map((lesson) => {
        const isValidUrl =
          typeof lesson.image === "string" &&
          /^(https?:\/\/|\/)/.test(lesson.image);
        const src = isValidUrl ? lesson.image : "assets/icons/DefaultIcon.png";
        return preloadImage(src);
      })
    );
  };

  // Fetch all pending assignments for the current student,
  // pick 5 lessons per homework logic, then set state
  const fetchHomeworkLessons = async () => {
    try {
      // ✅ FIRST: respect whatever path HomeworkPathway has already written.
      const existingPathStr = sessionStorage.getItem(HOMEWORK_PATHWAY);
      if (existingPathStr) {
        try {
          const existingPath = JSON.parse(existingPathStr);
          const hasLessons =
            Array.isArray(existingPath.lessons) &&
            existingPath.lessons.length > 0;

          if (hasLessons) {
            setHomeworkLessons(existingPath.lessons);
            return; // ⬅️ Do NOT recompute from API, so we don't move last-slot lessons to first
          }
        } catch (err) {
          console.warn(
            "Invalid cached homework path in sessionStorage, rebuilding...",
            err
          );
          // fallthrough to rebuild
        }
      }

      // ✅ FALLBACK: only if there is no valid path in sessionStorage
      const currentStudent = Util.getCurrentStudent();
      const currClass = Util.getCurrentClass();
      if (!currentStudent?.id || !currClass?.id) return;

      const all = await api.getPendingAssignments(
        currClass?.id,
        currentStudent.id
      );
      const pendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

      console.log("pendingAssignments", pendingAssignments);

      if (!pendingAssignments || pendingAssignments.length === 0) {
        setHomeworkLessons([]);
        console.log("No pending assignments found for student.");
        setShowHomeworkCompleteModal(true); // Show "homework complete" modal if no assignments
        return;
      } else {
        setShowHomeworkCompleteModal(false);
      }

      // Group pending assignments by subject
      const pendingBySubject: { [key: string]: any[] } = {};

      for (const assignment of pendingAssignments) {
        // Get the lesson object (assumes lesson already fetched and attached)
        const lesson = await getCachedLesson(assignment.lesson_id);
        const subjectId = lesson.subject_id;

        if (!pendingBySubject[subjectId]) pendingBySubject[subjectId] = [];
        pendingBySubject[subjectId].push(assignment);
      }

      // Find subjects with maximum pending assignments
      let maxPending = 0;
      let subjectsWithMaxPending: string[] = [];
      Object.keys(pendingBySubject).forEach((subject) => {
        const length = pendingBySubject[subject].length;
        if (length > maxPending) {
          maxPending = length;
          subjectsWithMaxPending = [subject];
        } else if (length === maxPending) {
          subjectsWithMaxPending.push(subject);
        }
      });

      // Fetch completed counts only for tied subjects (if tie exists)
      let completedCountBySubject: { [key: string]: number } = {};
      if (subjectsWithMaxPending.length > 1) {
        const completedCounts =
          await api.getCompletedAssignmentsCountForSubjects(
            currentStudent.id,
            subjectsWithMaxPending
          );
        completedCountBySubject = completedCounts.reduce(
          (acc, { subject_id, completed_count }) => {
            acc[subject_id] = completed_count;
            return acc;
          },
          {} as { [key: string]: number }
        );
      }

      // Pick 5 lessons passing completed counts to tie break subjects with the same max pending
      const selected = Util.pickFiveHomeworkLessons(
        pendingAssignments,
        completedCountBySubject
      );

      // Fetch full lesson details for selected assignments
      const lessonsWithDetails = await Promise.all(
        selected.map(async (assignment) => {
          const lesson = await getCachedLesson(assignment.lesson_id);
          return { ...assignment, lesson };
        })
      );

      const newHomeworkPath = {
        lessons: lessonsWithDetails,
        currentIndex: 0, // A new path always starts at the beginning (index 0)
      };

      sessionStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(newHomeworkPath));

      setHomeworkLessons(lessonsWithDetails);
    } catch (error) {
      console.error("Failed to fetch homework lessons:", error);
      setHomeworkLessons([]);
    }
  };

  // Overriding loadSVG method to load homework lessons and render pathway
  const loadSVG = async (updatedStudent?: any) => {
    if (!containerRef.current) return;

    try {
      const startTime = performance.now();
      const storedHomeworkPath = sessionStorage.getItem(HOMEWORK_PATHWAY);

      if (!storedHomeworkPath) {
        console.log(
          "No active homework path found in session storage. Aborting render."
        );
        return;
      }
      const homeworkPath = JSON.parse(storedHomeworkPath);

      const lessonsToRender = homeworkPath.lessons;
      const currentIndex = homeworkPath.currentIndex;
      const startIndex = 0;
      const pathEndIndex = lessonsToRender.length - 1;

      if (lessonsToRender.length === 0) {
        console.log("Homework path is empty. Nothing to render.");
        return;
      }

      const firstHomeworkItem = lessonsToRender[0];
      const [courseData, chapterData] = await Promise.all([
        api.getCourse(firstHomeworkItem.course_id),
        api.getChapterById(firstHomeworkItem.chapter_id),
      ]);

      if (!courseData || !chapterData) {
        console.error(
          "Could not find required course or chapter data. Aborting render."
        );
        return;
      }
      setCurrentCourse(courseData);
      setCurrentChapter(chapterData);
      const lessons = lessonsToRender.map((item) => item.lesson);

      const [
        svgContent,
        fruitActive,
        fruitInactive,
        playedLessonSVG,
        giftSVG,
        giftSVG2,
        giftSVG3,
        haloPath,
      ] = await Promise.all([
        loadPathwayContent(
          "homeworkRemoteAsset/Pathway2.svg",
          "/pathwayAssets/English/Pathway2.svg"
        ),
        tryFetchSVG(
          "homeworkRemoteAsset/ActiveFruit.svg",
          "/pathwayAssets/English/ActiveFruit.svg",
          "fruitActive isSelected"
        ),
        fetchSVGGroup("/pathwayAssets/InactiveFruit.svg", "fruitInactive"),
        tryFetchSVG(
          "homeworkRemoteAsset/PlayedLessonFruit.svg",
          "/pathwayAssets/English/PlayedLessonFruit.svg",
          "playedLessonSVG"
        ),
        tryFetchSVG(
          "homeworkRemoteAsset/mysteryBox1.svg",
          "/pathwayAssets/English/mysteryBox1.svg",
          "giftSVG"
        ),
        tryFetchSVG(
          "homeworkRemoteAsset/mysteryBox2.svg",
          "/pathwayAssets/English/mysteryBox2.svg",
          "giftSVG2"
        ),
        tryFetchSVG(
          "homeworkRemoteAsset/mysteryBox3.svg",
          "/pathwayAssets/English/mysteryBox3.svg",
          "giftSVG3"
        ),
        loadHaloAnimation(
          "homeworkRemoteAsset/halo.svg",
          "/pathwayAssets/English/halo.svg"
        ),
      ]);

      await preloadAllLessonImages(lessons);

      let chimple: SVGForeignObjectElement | null = null;
      chimple = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject"
      );
      chimple.setAttribute("width", "40%");
      chimple.setAttribute("height", "300%");

      requestAnimationFrame(async () => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = svgContent;
        const svg = containerRef.current.querySelector("svg") as SVGSVGElement;
        if (!svg) return;
        svg.style.overflow = "visible";

        const pathGroups = svg.querySelectorAll("g > path");
        const rawPaths = Array.from(pathGroups) as SVGPathElement[];

        const paths = rawPaths
          .map((p) => ({ path: p, x: p.getBBox().x }))
          .sort((a, b) => a.x - b.x)
          .map((o) => o.path);

        if (!paths.length) return;

        const startPoint = paths[0].getPointAtLength(0);
        const xValues = [27, 155, 276, 387, 496];
        const fragment = document.createDocumentFragment();

        // ======================= MODIFICATION START =======================
        // Calculate the offset to render lessons from the end of the pathway.
        const totalSlots = 5;
        const numLessons = lessonsToRender.length;
        const startIndexOffset = totalSlots - numLessons;

        // Loop through all 5 pathway slots
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
              y: [
                flowerY - 20,
                flowerY + 5,
                flowerY - 6,
                flowerY + 3,
                flowerY - 5,
              ],
            },
          };

          // If the current pathIndex is before the start of our lessons, render a locked/inactive fruit.
          if (pathIndex < startIndexOffset) {
            const lockedFruit = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            lockedFruit.appendChild(
              fruitInactive.cloneNode(true) as SVGGElement
            );
            lockedFruit.addEventListener("click", () => {
              setModalOpen(true);
              setModalText(inactiveText);
            });
            lockedFruit.setAttribute(
              "style",
              "cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);"
            );
            let yOffset = -10;

            if (pathIndex === 4) {
              yOffset = 5;
            }

            if (pathIndex === 2) {
              yOffset += 15;
            }

            let xPos =
              positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
            let yPos =
              (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
              yOffset;

            // 👉 move first locked fruit (leftmost) a bit right & down
            if (pathIndex === 0) {
              xPos += 21;
              yPos += 15;
            }

            placeElement(lockedFruit as SVGGElement, xPos, yPos);
            fragment.appendChild(lockedFruit);
            continue;
          }

          // This slot corresponds to a real lesson.
          // Calculate the index for the lessonsToRender array.
          const lessonIdx = pathIndex - startIndexOffset;
          const { lesson } = lessonsToRender[lessonIdx];

          const isValidUrl = (url: string) =>
            typeof url === "string" && /^(https?:\/\/|\/)/.test(url);
          const lesson_image = isValidUrl(lesson.image)
            ? lesson.image
            : "assets/icons/DefaultIcon.png";

          // --- Render Played Lesson ---
          if (lessonIdx < currentIndex) {
            const playedLesson = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            const lessonImage = createSVGImage(lesson_image, 30, 30, 28, 30);
            playedLesson.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement
            );
            playedLesson.appendChild(lessonImage);

            // base position
            let xPos =
              positionMappings.playedLesson.x[pathIndex] ?? flowerX - 20;
            let yPos =
              positionMappings.playedLesson.y[pathIndex] ?? flowerY - 20;

            // ⬆️ move the FIRST played mango slightly up
            if (pathIndex === 0) {
              yPos -= 12;
            } else if (pathIndex === 2) {
              yPos += 7;
            } else if (pathIndex === 3) {
              yPos -= 5;
            }

            placeElement(playedLesson as SVGGElement, xPos, yPos);
            fragment.appendChild(playedLesson);
          } else if (lessonIdx === currentIndex) {
            const activeGroup = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
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
              activeXOffset = 10; // tweak this value until it looks perfect
            } else if (pathIndex === 4) {
              activeYOffset = -1;
              activeXOffset = 12;
            }

            activeGroup.setAttribute(
              "transform",
              `translate(${
                positionMappings.activeGroup.baseX + activeXOffset
              }, ${positionMappings.activeGroup.baseY + activeYOffset})`
            );

            const halo = createSVGImage(haloPath, 140, 140, -15, -12);
            const pointer = createSVGImage(
              "/pathwayAssets/touchpointer.svg",
              30,
              30,
              70,
              90
            );
            pointer.setAttribute(
              "class",
              "homeworkpathway-structure-animated-pointer"
            );
            const lessonImage = createSVGImage(lesson_image, 30, 30, 40, 40);

            activeGroup.appendChild(halo);
            activeGroup.appendChild(fruitActive.cloneNode(true) as SVGGElement);
            activeGroup.appendChild(lessonImage);
            activeGroup.appendChild(pointer);
            activeGroup.setAttribute("style", "cursor: pointer;");

            activeGroup.addEventListener("click", () => {
              console.log("lesson clicked", lesson, courseData);
              if (lesson.plugin_type === COCOS) {
                const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                history.replace(PAGES.GAME + params, {
                  url: "chimple-lib/index.html" + params,
                  lessonId: lesson.cocos_lesson_id,
                  courseDocId: courseData.id,
                  lesson: JSON.stringify(lesson),
                  chapter: JSON.stringify(chapterData),
                  from: history.location.pathname + `?${CONTINUE}=true`,
                  course: JSON.stringify(courseData),
                  isHomework: true,
                  homeworkIndex: lessonIdx, // Use lessonIdx
                });
              } else if (lesson.plugin_type === LIVE_QUIZ) {
                history.replace(
                  PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
                  {
                    courseId: courseData.id,
                    lesson: JSON.stringify(lesson),
                    from: history.location.pathname + `?${CONTINUE}=true`,
                    isHomework: true,
                    homeworkIndex: lessonIdx,
                  } // Use lessonIdx
                );
              } else if (lesson.plugin_type === LIDO) {
                const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                history.replace(PAGES.LIDO_PLAYER + params, {
                  lessonId: lesson.cocos_lesson_id,
                  courseDocId: courseData.id,
                  course: JSON.stringify(courseData),
                  lesson: JSON.stringify(lesson),
                  chapter: JSON.stringify(chapterData),
                  from: history.location.pathname + `?${CONTINUE}=true`,
                  isHomework: true,
                  homeworkIndex: lessonIdx, // Use lessonIdx
                });
              }
            });
            fragment.appendChild(activeGroup);

            // --- Render Inactive (Future) Lesson ---
          } else {
            const flower_Inactive = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );

            const lessonImage = createSVGImage(lesson_image, 30, 30, 27, 29);
            flower_Inactive.appendChild(
              fruitInactive.cloneNode(true) as SVGGElement
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

            // Base offset
            let yOffset = -10;
            if (pathIndex === 4) yOffset = 5;

            if (pathIndex === 2) yOffset = 4;

            // FIRST inactive → a bit right + down
            let extraX = 0;
            let extraY = 0;
            if (pathIndex === 0) {
              extraX = 15; // right
              extraY -= 100; // down
            }

            // THIRD inactive → slightly up
            if (pathIndex === 2) {
              yOffset += 1;
            }

            let xPos =
              positionMappings.fruitInactive.x[pathIndex] ?? flowerX - 20;
            let yPos =
              (positionMappings.fruitInactive.y[pathIndex] ?? flowerY - 20) +
              yOffset;

            // Place element at base position
            placeElement(flower_Inactive as SVGGElement, xPos, yPos);

            // Then add the fine‑tuning shift for first inactive
            if (pathIndex === 0) {
              const prevTransform =
                flower_Inactive.getAttribute("transform") || "";
              flower_Inactive.setAttribute(
                "transform",
                `${prevTransform} translate(${extraX}, ${extraY})`.trim()
              );
            }

            fragment.appendChild(flower_Inactive);
          }
        }

        // ======================= MODIFICATION END =======================

        const endPath = paths[paths.length - 1];
        if (endPath) {
          const endPoint = endPath.getPointAtLength(endPath.getTotalLength());
          const Gift_Svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
          );
          Gift_Svg.setAttribute("style", "cursor: pointer;");
          Gift_Svg.appendChild(giftSVG.cloneNode(true));
          placeElement(Gift_Svg, endPoint.x - 25, endPoint.y - 40 + 15);

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
        }

        const animateChimpleMovement = () => {
          if (!chimple) return;
          if (currentIndex > pathEndIndex) {
            sessionStorage.removeItem(REWARD_LEARNING_PATH);
            setIsRewardPathLoaded(true);
            return;
          }
          const currentLessonIndex = lessons.findIndex(
            (_, idx) => startIndex + idx === currentIndex
          );
          if (currentLessonIndex < 0) return;
          const previousLessonIndex = currentLessonIndex - 1;
          if (previousLessonIndex < 0) return;

          // Apply offset to get correct path indices
          const fromPathIndex = startIndexOffset + previousLessonIndex;
          const toPathIndex = startIndexOffset + currentLessonIndex;

          const fromX = xValues[fromPathIndex] ?? 0;
          const toX = xValues[toPathIndex] ?? 0;
          chimple.setAttribute("x", `${toX - 72}`);
          let chimpleAnimY = startPoint.y + 18;
          if (window.innerWidth <= 1024) {
            chimpleAnimY -= 12; // same upward shift
          }
          chimple.setAttribute("y", `${chimpleAnimY}`);

          chimple.style.display = "block";
          (chimple.style as any).transformBox = "fill-box";
          chimple.style.transformOrigin = "0 0";
          chimple.style.willChange = "transform";
          const fromTranslateX = fromX - 97 - (toX - 87);
          chimple.style.transition = "none";
          chimple.style.transform = `translate(${fromTranslateX}px, 0px)`;
          void chimple.getBoundingClientRect();
          requestAnimationFrame(() => {
            if (chimple) {
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
          const completedLessonIndex = lessons.findIndex(
            (_, idx) => startIndex + idx === currentIndex - 1
          );

          // Apply offset for correct reward destination
          const completedLessonPathIndex =
            startIndexOffset + completedLessonIndex;
          const destinationX =
            xValues[
              completedLessonPathIndex >= startIndexOffset
                ? completedLessonPathIndex
                : 0
            ] ?? 0;

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
          const animateBezier = (now: number) => {
            let t = (now - start) / duration;
            if (t > 1) t = 1;
            const easeInOutCubic = (val: number) =>
              val < 0.5
                ? 4 * val * val * val
                : 1 - Math.pow(-2 * val + 2, 3) / 2;
            const bezier = (tVal: number, p0: number, p1: number, p2: number) =>
              (1 - tVal) ** 2 * p0 +
              2 * (1 - tVal) * tVal * p1 +
              tVal ** 2 * p2;
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
            setChimpleRiveStateMachineName("State Machine 2");
            setChimpleRiveInputName("Number 1");
            setChimpleRiveStateValue(rewardRecord.state_number_input || 1);
            setChimpleRiveAnimationName(undefined);
            setMascotKey((prev) => prev + 1);
            await delay(500);
            rewardForeignObject.style.display = "none";
            await delay(1000);
            await updateMascotToNormalState(newRewardId);
            await delay(500);
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
        if (
          newRewardId !== null &&
          typeof newRewardId === "string" &&
          isRewardFeatureOn
        ) {
          runRewardAnimation(newRewardId);
        }

        svg.appendChild(fragment);

        if (chimple) {
          const currentLessonIdx = lessons.findIndex(
            (_, idx) => startIndex + idx === currentIndex
          );
          const lastCompletedLessonIdx = currentLessonIdx - 1;
          const chimpleXValues = [-60, 66, 360, 295, 412];

          if (
            lastCompletedLessonIdx < 0 ||
            newRewardId == null ||
            !isRewardFeatureOn
          ) {
            // Place near current active lesson, applying offset
            const currentPathIndex = startIndexOffset + currentLessonIdx;
            const safePathIndex = Math.min(
              Math.max(currentPathIndex, 0),
              xValues.length - 1
            );
            chimple.setAttribute("x", `${xValues[safePathIndex] - 175}`);
          } else {
            // Place using special coordinates based on last completed lesson's position, applying offset
            const lastCompletedPathIndex =
              startIndexOffset + lastCompletedLessonIdx;
            const safePathIndex = Math.min(
              Math.max(lastCompletedPathIndex, 0),
              chimpleXValues.length - 1
            );
            chimple.setAttribute("x", `${chimpleXValues[safePathIndex]}`);
          }

          // chimple.setAttribute("y", `${startPoint.y - 20}`);
          let chimpleBaseY = startPoint.y - 12;
          if (window.innerWidth <= 1024) {
            chimpleBaseY -= 12; // move up on small screens
          }
          chimple.setAttribute("y", `${chimpleBaseY}`);
          chimple.style.pointerEvents = "none";
          const riveWrapper = document.createElement("div");
          riveWrapper.className = "homeworkpathway-mascot-wrapper";
          riveWrapper.style.width = "100%";
          riveWrapper.style.height = "100%";

          const riveDiv = document.createElement("div");
          riveDiv.style.width = "100%";
          riveDiv.style.height = "100%";

          riveWrapper.appendChild(riveDiv);
          chimple.appendChild(riveWrapper);
          svg.appendChild(chimple);

          setRiveContainer(riveDiv);
        }

        const endTime = performance.now();
        console.log(`SVG loaded in ${(endTime - startTime).toFixed(2)}ms`);
      });
    } catch (error) {
      console.error("Failed to load SVG:", error);
    }
  };

  // Helper to place SVG elements
  const placeElement = (element: SVGGElement, x: number, y: number) => {
    element.setAttribute("transform", `translate(${x}, ${y})`);
  };
  useEffect(() => {
    fetchHomeworkLessons();
  }, [isRewardPathLoaded]);

  useEffect(() => {
    if (homeworkLessons) {
      loadSVG();
    }
  }, [homeworkLessons]);

  useEffect(() => {
    const showModalIfNeeded = async () => {
      const showModal = await shouldShowDailyRewardModal();
      setRewardModalOpen(showModal);
    };
    if (isRewardFeatureOn) {
      showModalIfNeeded();
    }
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
          isHomework: true,
          reward: true,
        });
      } else if (lesson.plugin_type === LIVE_QUIZ) {
        history.replace(
          PAGES.LIVE_QUIZ_GAME + `?lessonId=${lesson.cocos_lesson_id}`,
          {
            courseId: course.course_id,
            lesson: JSON.stringify(lesson),
            from: history.location.pathname + `?${CONTINUE}=true`,
            isHomework: true,
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
          isHomework: true,
          reward: true,
        });
      }
    } catch (error) {
      console.error("Error in playLesson:", error);
    }
  };
  return (
    <>
      {showHomeworkCompleteModal && (
        <HomeworkCompleteModal
          text={t("Yay!! You have completed all the Homework!!")}
          borderImageSrc="/pathwayAssets/homeworkCelebration.svg"
          onClose={() => setShowHomeworkCompleteModal(false)}
          onPlayMore={() => {
            setShowHomeworkCompleteModal(false);
            if (onPlayMoreHomework) {
              onPlayMoreHomework();
            }
          }}
        />
      )}
      {isModalOpen && (
        <PathwayModal
          text={modalText}
          onClose={() => setModalOpen(false)}
          onConfirm={() => setModalOpen(false)}
          animate={shouldAnimate}
        />
      )}
      <div className="homeworkpathway-structure-div" ref={containerRef}></div>
      {riveContainer &&
        ReactDOM.createPortal(
          <div className="homeworkpathway-mascot-wrapper">
            <ChimpleRiveMascot
              key={mascotKey}
              stateMachine={chimpleRiveStateMachineName}
              inputName={chimpleRiveInputName}
              stateValue={chimpleRiveStateValue}
              animationName={chimpleRiveAnimationName}
            />
          </div>,
          riveContainer
        )}

      {rewardRiveContainer &&
        ReactDOM.createPortal(
          <RewardRive rewardRiveState={rewardRiveState} />,
          rewardRiveContainer
        )}

      {hasTodayReward && isRewardFeatureOn && (
        <RewardBox onRewardClick={handleOpen} />
      )}

      {rewardModalOpen && isRewardFeatureOn && (
        <DailyRewardModal
          text={t("Play one lesson and collect your daily reward!")}
          onClose={handleClose}
          onPlay={handleOnPlay}
        />
      )}
    </>
  );
};

export default HomeworkPathwayStructure;
