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
    const preloadImage = (src: string): Promise<boolean> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

    const checkImages = async () => {
      if (await preloadImage(localSrc)) {
        setActiveSrc(localSrc);
      } else if (await preloadImage(webSrc)) {
        setActiveSrc(webSrc);
      } else {
        setActiveSrc(defaultSrc);
      }
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
