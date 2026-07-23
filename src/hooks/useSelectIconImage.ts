import { FC, useEffect, useRef, useState } from 'react';
import CachedImage from '../components/common/CachedImage';
import {
  downloadCourseIconToDevice,
  getCachedCourseIconUri,
  getCachedCourseIconUriSync,
} from '../utility/courseIconDeviceCache';
import logger from '../utility/logger';

interface SelectIconImageProps {
  localSrc?: string;
  defaultSrc: string;
  webSrc?: string;
  imageWidth?: string;
  imageHeight?: string;
  webImageWidth?: string;
  webImageHeight?: string;
  showLoaderFromStart?: boolean;
  minimumLoaderVisibleMs?: number;
  disableLoader?: boolean;
  enableOfflineDownload?: boolean;
}

const loadedImageSrcCache = new Set<string>();

export const useSelectIconImage = ({
  localSrc,
  defaultSrc,
  webSrc,
  imageWidth = '100%',
  imageHeight = '100%',
  webImageWidth = '100%',
  webImageHeight = '100%',
  showLoaderFromStart = false,
  minimumLoaderVisibleMs = 0,
  disableLoader = false,
  enableOfflineDownload = false,
}: SelectIconImageProps) => {
  const [downloadedLocalSrc, setDownloadedLocalSrc] = useState<
    string | undefined
  >(undefined);
  const [isLocalLookupResolved, setIsLocalLookupResolved] =
    useState<boolean>(!localSrc);
  const [activeSrc, setActiveSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const loaderShownAtRef = useRef<number | null>(null);
  const hideLoaderTimeoutRef = useRef<number | null>(null);
  const hasRetriedBeforeDefaultRef = useRef<boolean>(false);

  // First-time fetch comes from web, then downloaded device file is preferred on later loads.
  const getInitialSrc = (): string => {
    if (webSrc && !isLocalLookupResolved) {
      return webSrc;
    }

    return downloadedLocalSrc || webSrc || localSrc || defaultSrc;
  };

  const getFallbackSources = (): string[] => {
    const sources: string[] = [];

    if (downloadedLocalSrc) {
      sources.push(downloadedLocalSrc);
    }
    if (webSrc) {
      sources.push(webSrc);
    }
    if (isLocalLookupResolved && localSrc && localSrc !== downloadedLocalSrc) {
      sources.push(localSrc);
    }
    if (defaultSrc) {
      sources.push(defaultSrc);
    }

    return sources;
  };

  useEffect(() => {
    hasRetriedBeforeDefaultRef.current = false;
  }, [localSrc, webSrc, defaultSrc]);

  useEffect(() => {
    let isMounted = true;

    if (!localSrc) {
      setDownloadedLocalSrc(undefined);
      setIsLocalLookupResolved(true);
      return () => {
        isMounted = false;
      };
    }

    setIsLocalLookupResolved(false);
    logger.warn('[SelectIconImage] resolving local source', {
      localSrc,
      webSrc,
      enableOfflineDownload,
    });

    // Resolve local icon path to on-device file URI when it already exists.
    const syncCachedUri = getCachedCourseIconUriSync(localSrc);
    if (syncCachedUri) {
      logger.warn('[SelectIconImage] local cache sync hit', {
        localSrc,
        syncCachedUri,
      });
      setDownloadedLocalSrc(syncCachedUri);
      setIsLocalLookupResolved(true);
      return () => {
        isMounted = false;
      };
    }

    setDownloadedLocalSrc(undefined);
    void getCachedCourseIconUri(localSrc)
      .then((cachedUri) => {
        if (!isMounted) {
          return;
        }

        if (cachedUri) {
          logger.warn('[SelectIconImage] local cache hit', {
            localSrc,
            cachedUri,
          });
          setDownloadedLocalSrc(cachedUri);
        }
        setIsLocalLookupResolved(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        logger.warn('[SelectIconImage] local cache miss', { localSrc });
        setIsLocalLookupResolved(true);
      });

    return () => {
      isMounted = false;
    };
  }, [localSrc]);

  const clearHideLoaderTimeout = (): void => {
    if (hideLoaderTimeoutRef.current !== null) {
      window.clearTimeout(hideLoaderTimeoutRef.current);
      hideLoaderTimeoutRef.current = null;
    }
  };

  const finishLoadingImmediately = (): void => {
    clearHideLoaderTimeout();
    setIsLoading(false);
    setShowLoader(false);
  };

  const isImageReady = (src: string): boolean => {
    if (loadedImageSrcCache.has(src)) {
      return true;
    }

    const image = new Image();
    image.src = src;
    const isReady = image.complete;

    if (isReady) {
      loadedImageSrcCache.add(src);
    }

    return isReady;
  };

  useEffect(() => {
    clearHideLoaderTimeout();
    loaderShownAtRef.current = null;

    // For default-only icons (e.g. dropdown arrows), render immediately without loader.
    if (!localSrc && !webSrc && !downloadedLocalSrc) {
      setActiveSrc(defaultSrc);
      setIsLoading(false);
      setShowLoader(false);
      return;
    }

    const initialSrc = getInitialSrc();
    setActiveSrc(initialSrc);

    if (isImageReady(initialSrc)) {
      finishLoadingImmediately();
      return;
    }

    setIsLoading(true);
    setShowLoader(false);
  }, [localSrc, webSrc, downloadedLocalSrc, defaultSrc, isLocalLookupResolved]);

  useEffect(() => {
    if (!activeSrc) {
      return;
    }

    const renderSourceKind =
      activeSrc.startsWith('file:') ||
      activeSrc.startsWith('capacitor:') ||
      activeSrc.includes('/_capacitor_file_/')
        ? 'local-file'
        : activeSrc.startsWith('http')
          ? 'remote'
          : 'asset-or-other';

    logger.warn('[SelectIconImage] render source state', {
      localSrc,
      webSrc,
      activeSrc,
      downloadedLocalSrc,
      isLocalLookupResolved,
      renderSourceKind,
    });
  }, [activeSrc, downloadedLocalSrc, isLocalLookupResolved, localSrc, webSrc]);

  useEffect(() => {
    if (disableLoader) {
      setShowLoader(false);
      return;
    }

    if (!isLoading) {
      setShowLoader(false);
      return;
    }

    if (showLoaderFromStart) {
      loaderShownAtRef.current = Date.now();
      setShowLoader(true);
      return;
    }

    const loaderTimeout = window.setTimeout(() => {
      loaderShownAtRef.current = Date.now();
      setShowLoader(true);
    }, 1000);

    return () => {
      window.clearTimeout(loaderTimeout);
    };
  }, [isLoading, showLoaderFromStart, disableLoader]);

  const finalizeLoading = (): void => {
    clearHideLoaderTimeout();
    setIsLoading(false);

    if (!showLoader) {
      setShowLoader(false);
      return;
    }

    if (minimumLoaderVisibleMs <= 0 || loaderShownAtRef.current === null) {
      setShowLoader(false);
      return;
    }

    const elapsedMs = Date.now() - loaderShownAtRef.current;
    const remainingMs = minimumLoaderVisibleMs - elapsedMs;

    if (remainingMs <= 0) {
      setShowLoader(false);
      return;
    }

    hideLoaderTimeoutRef.current = window.setTimeout(() => {
      setShowLoader(false);
    }, remainingMs);
  };

  const handleImageLoad = (): void => {
    if (activeSrc) {
      loadedImageSrcCache.add(activeSrc);
    }

    if (enableOfflineDownload && webSrc && localSrc && activeSrc === webSrc) {
      logger.warn('[SelectIconImage] backing up remote image to device', {
        localSrc,
        webSrc,
      });
      void downloadCourseIconToDevice(localSrc, webSrc).then(
        (downloadedUri) => {
          if (!downloadedUri) {
            logger.warn('[SelectIconImage] remote backup download skipped', {
              localSrc,
              webSrc,
            });
            return;
          }

          logger.warn('[SelectIconImage] remote backup download complete', {
            localSrc,
            webSrc,
            downloadedUri,
          });
          setDownloadedLocalSrc(downloadedUri);
        },
      );
    }

    finalizeLoading();
  };

  const handleImageError = (): void => {
    const fallbackSources = getFallbackSources();
    const currentIndex = fallbackSources.indexOf(activeSrc);
    const nextSource =
      currentIndex >= 0
        ? fallbackSources[currentIndex + 1]
        : fallbackSources[0];
    const isMovingToDefault =
      nextSource === defaultSrc || (!nextSource && activeSrc !== defaultSrc);

    // Retry one background fetch before showing default icon when all normal sources fail.
    if (
      isMovingToDefault &&
      !hasRetriedBeforeDefaultRef.current &&
      enableOfflineDownload &&
      localSrc &&
      webSrc
    ) {
      hasRetriedBeforeDefaultRef.current = true;
      setIsLoading(true);
      logger.warn('[SelectIconImage] retrying remote backup before default', {
        localSrc,
        webSrc,
      });

      void downloadCourseIconToDevice(localSrc, webSrc, true)
        .then((downloadedUri) => {
          if (downloadedUri) {
            logger.warn('[SelectIconImage] retry download complete', {
              localSrc,
              webSrc,
              downloadedUri,
            });
            setDownloadedLocalSrc(downloadedUri);
            setActiveSrc(downloadedUri);

            if (isImageReady(downloadedUri)) {
              finishLoadingImmediately();
            }
            return;
          }

          logger.warn('[SelectIconImage] falling back to default src', {
            localSrc,
            webSrc,
            defaultSrc,
          });
          setActiveSrc(defaultSrc);
          if (isImageReady(defaultSrc)) {
            finishLoadingImmediately();
          }
        })
        .catch(() => {
          logger.warn(
            '[SelectIconImage] retry download failed, using default',
            {
              localSrc,
              webSrc,
              defaultSrc,
            },
          );
          setActiveSrc(defaultSrc);
          if (isImageReady(defaultSrc)) {
            finishLoadingImmediately();
          } else {
            finalizeLoading();
          }
        });

      return;
    }

    if (nextSource && nextSource !== activeSrc) {
      setActiveSrc(nextSource);

      if (isImageReady(nextSource)) {
        finishLoadingImmediately();
      }

      return;
    }

    finalizeLoading();
  };

  useEffect(() => {
    return () => {
      clearHideLoaderTimeout();
    };
  }, []);
  return {
    CachedImage,
    activeSrc,
    disableLoader,
    handleImageError,
    handleImageLoad,
    imageHeight,
    imageWidth,
    isLoading,
    showLoader,
  };
};
