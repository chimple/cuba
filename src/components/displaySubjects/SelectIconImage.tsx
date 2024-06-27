import { FC, useState, useEffect } from "react";

const SelectIconImage: FC<{
  localSrc: string;
  defaultSrc: string;
  webSrc: string;
  imageWidth?: string;
  imageHeight?: string;
  webImageWidth?: string;
  webImageHeight?: string;
}> = ({
  localSrc,
  defaultSrc,
  webSrc,
  imageWidth = "100%",
  imageHeight = "100%",
  webImageWidth = "100%",
  webImageHeight = "100%",
}) => {
  const [activeSrc, setActiveSrc] = useState<string>(defaultSrc);

  useEffect(() => {
    const preloadImage = (src: string): Promise<string | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
      });

    const checkImages = async () => {
      const localImage = await preloadImage(localSrc);
      if (localImage) {
        setActiveSrc(localImage);
        return;
      }

      const webImage = await preloadImage(webSrc);
      if (webImage) {
        setActiveSrc(webImage);
        return;
      }

      setActiveSrc(defaultSrc);
    };

    checkImages();
  }, [localSrc, webSrc, defaultSrc]);

  return (
    <img
      src={activeSrc}
      alt=""
      style={{
        width: imageWidth,
        height: imageHeight,
      }}
    />
  );
};

export default SelectIconImage;
