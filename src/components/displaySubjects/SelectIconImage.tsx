import { FC, useEffect, useRef, useState } from 'react';
import './SelectIconImage.css';
import {
  downloadCourseIconToDevice,
  getCachedCourseIconUri,
  getCachedCourseIconUriSync,
} from '../../utility/courseIconDeviceCache';

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

const SelectIconImage: FC<SelectIconImageProps> = ({
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
}) => {
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

    // Resolve local icon path to on-device file URI when it already exists.
    const syncCachedUri = getCachedCourseIconUriSync(localSrc);
    if (syncCachedUri) {
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
          setDownloadedLocalSrc(cachedUri);
        }
        setIsLocalLookupResolved(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
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
      void downloadCourseIconToDevice(localSrc, webSrc).then(
        (downloadedUri) => {
          if (!downloadedUri) {
            return;
          }

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

      void downloadCourseIconToDevice(localSrc, webSrc, true)
        .then((downloadedUri) => {
          if (downloadedUri) {
            setDownloadedLocalSrc(downloadedUri);
            setActiveSrc(downloadedUri);

            if (isImageReady(downloadedUri)) {
              finishLoadingImmediately();
            }
            return;
          }

          setActiveSrc(defaultSrc);
          if (isImageReady(defaultSrc)) {
            finishLoadingImmediately();
          }
        })
        .catch(() => {
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

  return (
    <div
      style={{ position: 'relative', width: imageWidth, height: imageHeight }}
    >
      {isLoading && <div className="placeholder" />}
      {showLoader && !disableLoader && (
        <div className="select-icon-image-loading-indicator-container">
          <div className="select-icon-image-loading-indicator" />
        </div>
      )}
      {activeSrc && (
        <img
          src={activeSrc}
          alt=""
          className={`select-icon-image ${!isLoading ? 'imageLoaded' : ''}`}
          style={{
            width: imageWidth,
            height: imageHeight,
            objectFit: 'contain',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default SelectIconImage;
