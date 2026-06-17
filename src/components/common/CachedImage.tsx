import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { getCachedImageSrc } from '../../utility/imageCache';

function CachedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, ...imgProps } = props;
  const [localSrc, setLocalSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(!!src);

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setLocalSrc(undefined);
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
  }, [src]);

  if (!src) {
    return <div />;
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
