import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { getCachedImageSrc, isLocalImageUrl } from '../../utility/imageCache';
import { Capacitor } from '@capacitor/core';

const shouldBypassCache = (src?: string): boolean => {
  if (!src) {
    return false;
  }

  return !Capacitor.isNativePlatform() || isLocalImageUrl(src);
};

function CachedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, ...imgProps } = props;
  const bypassCache = src ? shouldBypassCache(src) : false;
  const [localSrc, setLocalSrc] = useState<string | undefined>(() => {
    if (!src) {
      return undefined;
    }

    return bypassCache ? src : undefined;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!src) {
      return false;
    }

    return !bypassCache;
  });

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setLocalSrc(undefined);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (bypassCache) {
      setLocalSrc(src);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    setLocalSrc(undefined);

    void getCachedImageSrc(src)
      .then((resolvedSrc) => {
        if (!isMounted) {
          return;
        }

        setLocalSrc(resolvedSrc);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setLocalSrc(src);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [src, bypassCache]);

  if (!src) {
    return <div />;
  }

  if (bypassCache) {
    return <img loading="lazy" {...imgProps} src={src} alt={alt ?? src} />;
  }

  if (isLoading || !localSrc) {
    return (
      <div
        className={imgProps.className}
        style={imgProps.style}
        aria-hidden="true"
      />
    );
  }

  return <img loading="lazy" {...imgProps} src={localSrc} alt={alt ?? src} />;
}
export default CachedImage;
