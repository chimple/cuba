import React, { useEffect, useRef, useState } from "react";
import "./PathwayStructure.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import {
  CAN_ACCESS_REMOTE_ASSETS,
  CONTINUE,
  LIDO,
  PAGES,
} from "../../common/constants";
import PathwayModal from "./PathwayModal";
import { t } from "i18next";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

const PathwayStructure: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");

  const inactiveText = t(
    "This lesson is locked. Play the current active lesson."
  );
  const rewardText = t("Complete these 5 lessons to earn rewards");
  const shouldShowRemoteAssets = useFeatureIsOn(CAN_ACCESS_REMOTE_ASSETS);

  const shouldAnimate = modalText === rewardText;
  const fetchLocalSVGGroup = async (
    path: string,
    className?: string
  ): Promise<SVGGElement> => {
    const file = await Filesystem.readFile({
      path,
      directory: Directory.External,
    });
    const svgText = atob(file.data);
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
        return atob(file.data);
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

  const placeElement = (
    svg: SVGSVGElement,
    element: SVGGElement | SVGImageElement,
    x: number,
    y: number
  ) => {
    element.setAttribute("transform", `translate(${x}, ${y})`);
    svg.appendChild(element);
  };

  useEffect(() => {
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
          let src: string;
          src = `assets/icons/${lesson.cocos_lesson_id}.png`;
          return preloadImage(src);
        })
      );
    };

    const loadSVG = async (updatedStudent?: any) => {
      if (!containerRef.current) return;

      try {
        const startTime = performance.now();

        const currentStudent =
          updatedStudent || (await Util.getCurrentStudent());
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
            const lesson_image = lesson.cocos_lesson_id
              ? `assets/icons/${lesson.cocos_lesson_id}.png`
              : isValidUrl(lesson.image)
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
                `translate(${positionMappings.activeGroup.x[idx] ?? flowerX - 20}, ${
                  positionMappings.activeGroup.y[idx] ?? flowerY - 20
                })`
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
                } else if (lesson.plugin_type === LIDO) {
                  const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                  history.replace(PAGES.LIDO_PLAYER + parmas, {
                    lessonId: lesson.cocos_lesson_id,
                    courseDocId: course.course_id,
                    lesson: JSON.stringify(lesson),
                    chapter: JSON.stringify({ chapter_id: lesson.chapter_id }),
                    from: history.location.pathname + `?${CONTINUE}=true`,
                    learning_path: true,
                  });
                }
              });

              const chimple = createSVGImage(
                "assets/icons/1.svg",
                95,
                100,
                x,
                startPoint.y + 65
              );
              fragment.appendChild(activeGroup);
              fragment.appendChild(chimple);
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
      "courseChanged",
      handleCourseChange as EventListener
    );

    return () => {
      window.removeEventListener("courseChanged", handleCourseChange);
    };
  }, []);

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
    </>
  );
};

export default PathwayStructure;
