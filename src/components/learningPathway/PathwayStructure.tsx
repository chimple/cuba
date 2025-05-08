import React, { useEffect, useRef, useState } from "react";
import "./PathwayStructure.css";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router";
import { PAGES } from "../../common/constants";
import PathwayModal from "./PathwayModal";
import { t } from "i18next";

const PathwayStructure: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");

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
    if (opacity !== undefined)
      image.setAttribute("opacity", opacity.toString());
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
    const loadSVG = async (updatedStudent?: any) => {
      if (!containerRef.current) return;

      try {
        const currentStudent =
          updatedStudent || (await Util.getCurrentStudent());
        const learningPath = currentStudent?.learning_path
          ? JSON.parse(currentStudent.learning_path)
          : null;
        if (!learningPath) return;

        const currentCourseIndex = learningPath?.courses.currentCourseIndex;
        const course = learningPath?.courses.courseList[currentCourseIndex];
        const { startIndex, currentIndex, pathEndIndex } = course;

        const lessons = await Promise.all(
          course.path
            .slice(startIndex, pathEndIndex + 1)
            .map(async (lesson) => {
              return await api.getLesson(lesson.lesson_id);
            })
        );

        const res = await fetch("/pathwayAssets/English/Pathway.svg");
        const svgContent = await res.text();
        containerRef.current.innerHTML = svgContent;

        const svg = containerRef.current.querySelector("svg") as SVGSVGElement;
        if (!svg) return;

        const pathGroups = svg.querySelectorAll("g > path");
        const paths = Array.from(pathGroups) as SVGPathElement[];

        const [
          flowerActive,
          flowerInactive,
          playedLessonSVG,
          giftSVG,
          giftSVG2,
          giftSVG3,
        ] = await Promise.all([
          fetchSVGGroup(
            "/pathwayAssets/English/FlowerActive.svg",
            "flowerActive isSelected"
          ),
          fetchSVGGroup("/pathwayAssets/FlowerInactive.svg", "flowerInactive"),
          fetchSVGGroup(
            "/pathwayAssets/English/PlayedLesson.svg",
            "playedLessonSVG"
          ),
          fetchSVGGroup("/pathwayAssets/English/pathGift1.svg", "giftSVG"),
          fetchSVGGroup("/pathwayAssets/English/pathGift2.svg", "giftSVG2"),
          fetchSVGGroup("/pathwayAssets/English/pathGift3.svg", "giftSVG3"),
        ]);

        const startPoint = paths[0].getPointAtLength(0);
        const xValues = [27, 155, 276, 387, 496];

        lessons.forEach((lesson, idx) => {
          const path = paths[idx];
          const point = path.getPointAtLength(0);
          const flowerX = point.x - 40;
          const flowerY = point.y - 40;
          const x = xValues[idx] ?? 0;

          // Define x and y mappings for playedLesson positioning
          const playedLessonXValues = [
            flowerX - 5,
            flowerX - 10,
            flowerX - 7,
            flowerX,
            flowerX,
          ];
          const playedLessonYValues = [
            flowerY - 4,
            flowerY - 7,
            flowerY - 10,
            flowerY - 5,
            flowerY,
          ];

          // Use the mappings to determine x and y
          const playedLessonX = playedLessonXValues[idx] ?? flowerX - 20;
          const playedLessonY = playedLessonYValues[idx] ?? flowerY - 20;

          if (startIndex + idx < currentIndex) {
            const playedLesson = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            const lessonImage = createSVGImage(
              lesson.image ||
                "courses/" +
                  lesson.cocos_subject_code +
                  "/icons/" +
                  lesson.id +
                  ".webp",
              17,
              17,
              34,
              35
            );
            playedLesson.appendChild(
              playedLessonSVG.cloneNode(true) as SVGGElement
            );
            playedLesson.appendChild(lessonImage);

            // Place the playedLesson element using the mapped x and y values
            placeElement(
              svg,
              playedLesson as SVGGElement,
              playedLessonX,
              playedLessonY
            );
          } else if (startIndex + idx === currentIndex) {
            const activeGroup = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );

            // Define x and y mappings for activeGroup positioning
            const activeGroupXValues = [
              flowerX - 20,
              flowerX - 20,
              260,
              flowerX - 10,
              flowerX - 15,
            ];
            const activeGroupYValues = [flowerY - 23, 5, 10, 5, 10];

            // Use the mappings to determine x and y
            const activeGroupX = activeGroupXValues[idx] ?? flowerX - 20;
            const activeGroupY = activeGroupYValues[idx] ?? flowerY - 20;

            activeGroup.setAttribute(
              "transform",
              `translate(${activeGroupX}, ${activeGroupY})`
            );
            const halo = createSVGImage(
              "/pathwayAssets/English/halo.svg",
              140,
              140,
              -15,
              -12
            );
            const pointer = createSVGImage(
              "/pathwayAssets/touchPointer.gif",
              130,
              130,
              60,
              30
            );
            const lessonImage = createSVGImage(
              lesson.image ||
                "courses/" +
                  lesson.cocos_subject_code +
                  "/icons/" +
                  lesson.id +
                  ".webp",
              23,
              23,
              43,
              43
            );
            activeGroup.appendChild(halo);
            activeGroup.appendChild(
              flowerActive.cloneNode(true) as SVGGElement
            );
            activeGroup.appendChild(lessonImage);
            activeGroup.appendChild(pointer);
            activeGroup.setAttribute("style", "cursor: pointer;");
            // Add click handler for active lesson
            activeGroup.addEventListener("click", () => {
              if (lesson.plugin_type === "cocos") {
                const params = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
                history.replace(PAGES.GAME + params, {
                  url: "chimple-lib/index.html" + params,
                  lessonId: lesson.cocos_lesson_id,
                  courseDocId: course?.id,
                  course: JSON.stringify(course),
                  lesson: JSON.stringify(lesson),
                  chapter: JSON.stringify({ chapter_id: lesson.chapter_id }),
                  from: history.location.pathname + `?continue=true`,
                  learning_path:true
                });
              }
            });
            const chimple = createSVGImage(
              "/pathwayAssets/mascot.svg",
              75,
              81,
              x,
              startPoint.y + 65
            );

            svg.appendChild(activeGroup);
            svg.appendChild(chimple);
          } else {
            const flower_Inactive = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            const lessonImage = createSVGImage(
              lesson.image ||
                "courses/" +
                  lesson.cocos_subject_code +
                  "/icons/" +
                  lesson.id +
                  ".webp",
              20,
              20,
              26,
              28
            );
            flower_Inactive.appendChild(
              flowerInactive.cloneNode(true) as SVGGElement
            );
            flower_Inactive.appendChild(lessonImage);
            flower_Inactive.addEventListener("click", () => {
              const text = t("Lesson inactive, play the nearest active lesson");
              setModalOpen(true);
              setModalText(text);
            });
            flower_Inactive.setAttribute(
              "style",
              "cursor: pointer; -webkit-filter: grayscale(100%); filter:grayscale(100%);"
            );

            // Define x and y mappings for flower_Inactive positioning
            const flowerInactiveXValues = [
              flowerX - 20,
              flowerX,
              flowerX,
              flowerX + 5,
              flowerX + 10,
            ];
            const flowerInactiveYValues = [
              flowerY - 20,
              flowerY + 5,
              flowerY - 6,
              flowerY + 3,
              flowerY - 5,
            ];

            // Use the mappings to determine x and y
            const flowerInactiveX = flowerInactiveXValues[idx] ?? flowerX - 20;
            const flowerInactiveY = flowerInactiveYValues[idx] ?? flowerY - 20;

            // Place the flower_Inactive element
            placeElement(
              svg,
              flower_Inactive as SVGGElement,
              flowerInactiveX,
              flowerInactiveY
            );
          }
        });

        const Gift_Svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );

        const endPath = paths[paths.length - 1];
        const endPoint = endPath.getPointAtLength(endPath.getTotalLength());

        Gift_Svg.setAttribute("style", "cursor: pointer;");
        Gift_Svg.appendChild(giftSVG.cloneNode(true));
        placeElement(svg, Gift_Svg, endPoint.x - 25, endPoint.y - 40);

        if (currentIndex < pathEndIndex + 1) {
          Gift_Svg.addEventListener("click", () => {
            const replaceGiftContent = (newContent: SVGElement) => {
              while (Gift_Svg.firstChild) {
                Gift_Svg.removeChild(Gift_Svg.firstChild);
              }
              Gift_Svg.appendChild(newContent.cloneNode(true));
            };

            setTimeout(() => {
              replaceGiftContent(giftSVG2);
            }, 300);

            setTimeout(() => {
              replaceGiftContent(giftSVG3);
            }, 500);

            setTimeout(() => {
              replaceGiftContent(giftSVG2);
            }, 700);

            setTimeout(() => {
              replaceGiftContent(giftSVG3);
            }, 900);

            setTimeout(() => {
              const text = t("Complete these 5 lessons to earn rewards");
              setModalText(text);
              setModalOpen(true);
              replaceGiftContent(giftSVG);
            }, 1100);
          });
        }
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
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
        <PathwayModal text={modalText} onClose={() => setModalOpen(false)} />
      )}
      <div className="pathway-structure-div" ref={containerRef}></div>
    </>
  );
};

export default PathwayStructure;
