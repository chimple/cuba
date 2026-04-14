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
}) => {
  const [downloadedLocalSrc, setDownloadedLocalSrc] = useState<
    string | undefined
  >(undefined);
  const [activeSrc, setActiveSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const loaderShownAtRef = useRef<number | null>(null);
  const hideLoaderTimeoutRef = useRef<number | null>(null);

  // Try bundled local first, then web, then downloaded device file, and only then default.
  const getInitialSrc = (): string => {
    return localSrc || webSrc || downloadedLocalSrc || defaultSrc;
  };

  useEffect(() => {
    let isMounted = true;

    if (!localSrc) {
      setDownloadedLocalSrc(undefined);
      return () => {
        isMounted = false;
      };
    }

    // Resolve local icon path to on-device file URI when it already exists.
    const syncCachedUri = getCachedCourseIconUriSync(localSrc);
    if (syncCachedUri) {
      setDownloadedLocalSrc(syncCachedUri);
      return () => {
        isMounted = false;
      };
    }

    setDownloadedLocalSrc(undefined);
    void getCachedCourseIconUri(localSrc).then((cachedUri) => {
      if (!isMounted || !cachedUri) {
        return;
      }
      setDownloadedLocalSrc(cachedUri);
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
  }, [localSrc, webSrc, downloadedLocalSrc, defaultSrc]);

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

    if (webSrc && localSrc && activeSrc === webSrc) {
      void downloadCourseIconToDevice(localSrc, webSrc);
    }

    finalizeLoading();
  };

  const handleImageError = (): void => {
    if (activeSrc === localSrc && webSrc) {
      setActiveSrc(webSrc);

      if (isImageReady(webSrc)) {
        finishLoadingImmediately();
      }

      return;
    }

    if (activeSrc === localSrc && downloadedLocalSrc) {
      setActiveSrc(downloadedLocalSrc);

      if (isImageReady(downloadedLocalSrc)) {
        finishLoadingImmediately();
      }

      return;
    }

    if (activeSrc === webSrc && downloadedLocalSrc) {
      setActiveSrc(downloadedLocalSrc);

      if (isImageReady(downloadedLocalSrc)) {
        finishLoadingImmediately();
      }

      return;
    }

    if (activeSrc !== defaultSrc) {
      setActiveSrc(defaultSrc);

      if (isImageReady(defaultSrc)) {
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
