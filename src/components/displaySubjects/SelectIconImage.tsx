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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const preloadImage = (src: string): Promise<boolean> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

    const loadImages = async () => {
      setIsLoading(true); 

      
      const localLoaded = await preloadImage(localSrc);
      if (localLoaded) {
        setActiveSrc(localSrc);
        setIsLoading(false); // Set loading state to false when image loaded successfully
        return;
      }

      
      const webLoaded = await preloadImage(webSrc);
      if (webLoaded) {
        setActiveSrc(webSrc);
        setIsLoading(false); // Set loading state to false when image loaded successfully
        return;
      }

      
      setActiveSrc(defaultSrc);
      setIsLoading(false); 
    };

    loadImages();
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
