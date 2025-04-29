import React, { useEffect, useRef } from "react";
import './PathwayStructure.css'

const PathwayStructure: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch and wrap SVG as a <g> element
  const fetchSVGGroup = async (
    url: string,
    className?: string
  ): Promise<SVGGElement> => {
    const res = await fetch(url);
    const svgContent = await res.text();
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.innerHTML = svgContent;
    if (className) {
      group.setAttribute("class", className);
    }
    return group;
  };

  // Create an SVG <image> element
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
    image.setAttribute("width", `${width}`);
    image.setAttribute("height", `${height}`);
    image.setAttribute("x", `${x}`);
    image.setAttribute("y", `${y}`);
    if (opacity !== undefined) {
      image.setAttribute("opacity", opacity.toString());
    }
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
    const loadSVG = async () => {
      if (!containerRef.current) return;

      try {
        const res = await fetch("/pathwayAssets/Pathway.svg");
        const svgContent = await res.text();
        containerRef.current.innerHTML = svgContent;

        const svg = containerRef.current.querySelector("svg") as SVGSVGElement;
        if (!svg) return;

        svg.setAttribute("style", "max-width: 75dvw; max-height: 65dvh");

        const pathGroups = svg.querySelectorAll("g > g > path");
        const paths = Array.from(pathGroups) as SVGPathElement[];

        const [flowerActive, flowerInactive, giftSVG] = await Promise.all([
          fetchSVGGroup(
            "/pathwayAssets/FlowerActive.svg",
            "flowerActive isSelected"
          ),
          fetchSVGGroup("/pathwayAssets/FlowerInactive.svg", "flowerInactive"),
          fetchSVGGroup("/pathwayAssets/StarGift1.svg", "giftSVG"),
        ]);

        // Add start group with halo and flower
        const startPoint = paths[0].getPointAtLength(0);
        const startGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        startGroup.setAttribute(
          "transform",
          `translate(${startPoint.x - 60}, ${startPoint.y - 20})`
        );

        const halo = createSVGImage(
          "/pathwayAssets/halo.svg",
          150,
          150,
          -22,
          -20
        );
        const pointer = createSVGImage(
          "/pathwayAssets/touchPointer.gif",
          150,
          150,
          60,
          30
        );

        startGroup.appendChild(halo);
        startGroup.appendChild(flowerActive.cloneNode(true));
        startGroup.appendChild(pointer);
        svg.appendChild(startGroup);

        // Add chimple character
        const chimple = createSVGImage(
          "/pathwayAssets/chimple.svg",
          125,
          125,
          startPoint.x - 70,
          startPoint.y + 85
        );
        svg.appendChild(chimple);

        // Place inactive flowers
        paths.slice(1, 5).forEach((path, idx) => {
          const point = path.getPointAtLength(0);
          const xOffsets = [-40, -20, 0, +5];
          placeElement(
            svg,
            flowerInactive.cloneNode(true) as SVGGElement,
            point.x + xOffsets[idx],
            point.y - 20
          );
        });

        // Place gift at end of path 5
        const endPoint = paths[4].getPointAtLength(paths[4].getTotalLength());
        placeElement(
          svg,
          giftSVG.cloneNode(true) as SVGGElement,
          endPoint.x + 20,
          endPoint.y - 20
        );
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };

    loadSVG();
  }, []);

  return <div ref={containerRef} className="pathway" />;
};

export default PathwayStructure;
