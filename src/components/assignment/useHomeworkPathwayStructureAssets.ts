import { RefObject, useCallback } from 'react';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { getCachedImageSrc } from '../../utility/imageCache';
import { HomeworkPathwayLesson } from './homeworkPathwayStructureTypes';

interface UseHomeworkPathwayStructureAssetsParams {
  lessonCacheRef: RefObject<Map<string, HomeworkPathwayLesson>>;
  shouldShowHomeworkRemoteAssets: boolean;
}

export const useHomeworkPathwayStructureAssets = ({
  lessonCacheRef,
  shouldShowHomeworkRemoteAssets,
}: UseHomeworkPathwayStructureAssetsParams) => {
  const api = ServiceConfig.getI().apiHandler;

  const fetchLocalSVGGroup = async (
    path: string,
    className?: string,
  ): Promise<SVGGElement> => {
    const file = await Filesystem.readFile({
      path,
      directory: Directory.External,
    });
    const svgText = atob(file.data as string);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.innerHTML = svgText;
    if (className) group.setAttribute('class', className);
    return group;
  };

  const loadHaloAnimation = useCallback(
    async (localPath: string, webPath: string): Promise<string> => {
      if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
        try {
          const file = await Filesystem.readFile({
            path: localPath,
            directory: Directory.External,
          });
          return `data:image/svg+xml;base64,${file.data}`;
        } catch (err) {
          logger.error('Fallback to web asset for:', webPath, err);
          return webPath;
        }
      }
      return webPath;
    },
    [shouldShowHomeworkRemoteAssets],
  );

  const fetchSVGGroup = useCallback(
    async (url: string, className?: string): Promise<SVGGElement> => {
      const res = await fetch(url);
      const svgContent = await res.text();
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.innerHTML = svgContent;
      if (className) group.setAttribute('class', className);
      return group;
    },
    [],
  );

  const tryFetchSVG = useCallback(
    async (localPath: string, webPath: string, name: string) => {
      if (Capacitor.isNativePlatform() && shouldShowHomeworkRemoteAssets) {
        try {
          return await fetchLocalSVGGroup(localPath, name);
        } catch {
          return await fetchSVGGroup(webPath, name);
        }
      } else {
        return await fetchSVGGroup(webPath, name);
      }
    },
    [fetchSVGGroup, shouldShowHomeworkRemoteAssets],
  );

  const createSVGImage = (
    href: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    opacity?: number,
  ) => {
    const image = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'image',
    );
    image.setAttribute('href', href);
    if (width) image.setAttribute('width', `${width}`);
    if (height) image.setAttribute('height', `${height}`);
    if (x) image.setAttribute('x', `${x}`);
    if (y) image.setAttribute('y', `${y}`);
    if (opacity !== undefined) {
      image.setAttribute('opacity', opacity.toString());
    }
    image.onerror = () => {
      image.setAttribute('href', 'assets/icons/DefaultIcon.png');
    };
    return image;
  };

  const loadPathwayContent = useCallback(
    async (path: string, webPath: string): Promise<string> => {
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
    },
    [shouldShowHomeworkRemoteAssets],
  );

  const getCachedLesson = useCallback(
    async (lessonId: string): Promise<HomeworkPathwayLesson | null> => {
      const lessonCache = lessonCacheRef.current;
      const existingLesson = lessonCache.get(lessonId);
      if (existingLesson) return existingLesson;
      const key = `lesson_${lessonId}`;
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as HomeworkPathwayLesson;
        lessonCache.set(lessonId, parsed);
        return parsed;
      }
      try {
        const lesson = await api.getLesson(lessonId);
        if (lesson) {
          lessonCache.set(lessonId, lesson);
          sessionStorage.setItem(key, JSON.stringify(lesson));
          return lesson;
        }
        return null;
      } catch (e) {
        logger.warn('Could not fetch lesson details (offline)', e);
        return null;
      }
    },
    [api, lessonCacheRef],
  );

  const preloadImage = useCallback(
    (src: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }),
    [],
  );

  const preloadAllLessonImages = useCallback(
    async (lessons: Array<{ image?: string | null }>) => {
      await Promise.all(
        lessons.map(async (lesson) => {
          const isValidUrl =
            typeof lesson.image === 'string' &&
            /^(https?:\/\/|\/)/.test(lesson.image);
          const src =
            isValidUrl && lesson.image
              ? lesson.image
              : 'assets/icons/DefaultIcon.png';
          const resolvedSrc = await getCachedImageSrc(src);
          return preloadImage(resolvedSrc);
        }),
      );
    },
    [preloadImage],
  );

  const placeElement = useCallback(
    (element: SVGGElement, x: number, y: number) => {
      element.setAttribute('transform', `translate(${x}, ${y})`);
    },
    [],
  );

  return {
    createSVGImage,
    fetchSVGGroup,
    getCachedLesson,
    loadHaloAnimation,
    loadPathwayContent,
    placeElement,
    preloadAllLessonImages,
    tryFetchSVG,
  };
};
