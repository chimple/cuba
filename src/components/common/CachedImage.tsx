import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { getCachedImageSrc, isLocalImageUrl } from '../../utility/imageCache';
import { Capacitor } from '@capacitor/core';

const shouldBypassCache = (src?: string): boolean => {
  if (!src) {
    return false;
  }

  return !Capacitor.isNativePlatform() || isLocalImageUrl(src);
};

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

function CachedImage(props: CachedImageProps) {
  const { src, alt, fallbackSrc, onError, ...imgProps } = props;
  const resolvedSrc = src || fallbackSrc;
  const bypassCache = resolvedSrc ? shouldBypassCache(resolvedSrc) : false;
  const [localSrc, setLocalSrc] = useState<string | undefined>(() => {
    if (!resolvedSrc) {
      return undefined;
    }

    return bypassCache ? resolvedSrc : undefined;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!resolvedSrc) {
      return false;
    }

    return !bypassCache;
  });

  useEffect(() => {
    let isMounted = true;

    if (!resolvedSrc) {
      setLocalSrc(undefined);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (bypassCache) {
      setLocalSrc(resolvedSrc);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    setLocalSrc(undefined);

    void getCachedImageSrc(resolvedSrc)
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

        setLocalSrc(resolvedSrc);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedSrc, src, fallbackSrc, bypassCache]);

  if (!resolvedSrc) {
    return <div />;
  }

  if (bypassCache) {
    return (
      <img
        loading="lazy"
        {...imgProps}
        src={resolvedSrc}
        alt={alt ?? resolvedSrc}
        onError={(event) => {
          if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
            event.currentTarget.src = fallbackSrc;
          }
          onError?.(event);
        }}
      />
    );
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

  return (
    <img
      loading="lazy"
      {...imgProps}
      src={localSrc}
      alt={alt ?? resolvedSrc}
      onError={(event) => {
        if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
          setLocalSrc(fallbackSrc);
          setIsLoading(false);
        }
        onError?.(event);
      }}
    />
  );
}
export default CachedImage;
