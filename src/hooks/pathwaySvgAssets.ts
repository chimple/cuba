import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

import { extractStickerSvg } from '../components/common/SvgHelpers';
import logger from '../utility/logger';
import { fetchStickerBookSvgText } from '../utility/stickerBookAssets';
import { getCachedImageSrc } from '../utility/imageCache';

const svgGroupCache: Record<string, SVGGElement | SVGSVGElement> = {};
const svgStringCache: Record<string, string> = {};
let pathwayTemplateCache: string | null = null;
const stickerDataUrlCache: Record<string, string> = {};

export const SVG_NS = 'http://www.w3.org/2000/svg';

const fetchLocalFile = async (path: string): Promise<string> => {
  const file = await Filesystem.readFile({
    path,
    directory: Directory.External,
  });
  return atob(file.data as string);
};

const fetchLocalGroup = async (
  path: string,
): Promise<SVGGElement | SVGSVGElement> => {
  const text = await fetchLocalFile(path);
  const wrapper = document.createElementNS(SVG_NS, 'g');
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector('svg');
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

const fetchRemoteSVGGroup = async (
  url: string,
): Promise<SVGGElement | SVGSVGElement> => {
  const res = await fetch(url);
  const text = await res.text();
  const wrapper = document.createElementNS(SVG_NS, 'g');
  wrapper.innerHTML = text;
  const svgNode = wrapper.querySelector('svg');
  if (svgNode) return svgNode as SVGSVGElement;
  return wrapper as SVGGElement;
};

export const getStickerImageFallbackFromBookSvg = async (
  stickerBookSvgUrl: string,
  stickerId: string,
): Promise<string | null> => {
  const cacheKey = `${stickerBookSvgUrl}::${stickerId}`;
  const cached = stickerDataUrlCache[cacheKey];
  if (cached) return cached;

  let stickerSvg: string | null = null;
  try {
    const text = await fetchStickerBookSvgText(stickerBookSvgUrl);
    const wrapper = document.createElementNS(SVG_NS, 'g');
    wrapper.innerHTML = text;
    const svgNode = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (!svgNode) return null;
    stickerSvg = extractStickerSvg(svgNode, stickerId);
  } catch {
    stickerSvg = null;
  }

  if (!stickerSvg) return null;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stickerSvg)}`;
  stickerDataUrlCache[cacheKey] = dataUrl;
  return dataUrl;
};

export const createSVGImage = (
  href: string,
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  className?: string,
) => {
  const img = document.createElementNS(SVG_NS, 'image');
  img.setAttribute('href', href);
  img.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  if (width != null) img.setAttribute('width', String(width));
  if (height != null) img.setAttribute('height', String(height));
  if (x != null) img.setAttribute('x', String(x));
  if (y != null) img.setAttribute('y', String(y));
  if (className != null) img.setAttribute('class', className);

  img.onerror = () => img.setAttribute('href', 'assets/icons/DefaultIcon.png');

  return img;
};

export async function loadPathwayTemplate(): Promise<string> {
  if (pathwayTemplateCache) return pathwayTemplateCache;

  const local = '/pathwayAssets/English/Pathway.svg';
  const remote = 'remoteAsset/Pathway.svg';

  if (Capacitor.isNativePlatform()) {
    try {
      const text = await fetchLocalFile(remote);
      pathwayTemplateCache = text;
      return text;
    } catch (err) {
      logger.error('Error in loading pathway template ', err);
    }
  }

  const res = await fetch(local);
  const txt = await res.text();
  pathwayTemplateCache = txt;
  return txt;
}

export async function loadGroupAsset(
  name: string,
  remotePath: string,
  localPath: string,
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

export async function loadHalo(): Promise<SVGGElement | SVGSVGElement | string> {
  const cached = svgGroupCache['halo'];
  if (cached) {
    return cached.cloneNode(true) as SVGGElement | SVGSVGElement;
  }

  const local = '/pathwayAssets/English/halo.svg';
  const remote = 'remoteAsset/halo.svg';
  let group: SVGGElement | SVGSVGElement | null = null;

  try {
    if (Capacitor.isNativePlatform()) {
      try {
        group = await fetchLocalGroup(remote);
      } catch (err) {
        logger.warn('Failed to load local halo.svg, fetching remote', err);
      }
    }
    if (!group) {
      group = await fetchRemoteSVGGroup(local);
    }
    svgGroupCache['halo'] = group;
    return group.cloneNode(true) as SVGGElement | SVGSVGElement;
  } catch {
    svgStringCache['halo'] = local;
    return local;
  }
}

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
};

export async function preloadAllLessonImages(lessons: any[]) {
  await Promise.all(
    lessons.map(async (lesson) => {
      logger.warn('lesson image:', lesson.image);
      const isValidUrl =
        typeof lesson.image === 'string' &&
        /^(https?:\/\/|\/)/.test(lesson.image);
      const src = isValidUrl ? lesson.image : 'assets/icons/DefaultIcon.png';
      const resolvedSrc = await getCachedImageSrc(src);
      return preloadImage(resolvedSrc);
    }),
  );
}

export const placeElement = (element: SVGGElement, x: number, y: number) => {
  element.setAttribute('transform', `translate(${x}, ${y})`);
};
