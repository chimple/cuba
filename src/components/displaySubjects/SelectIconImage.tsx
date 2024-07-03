import { FC, useState, useEffect } from "react";
import './SelectIconImage.css';

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
  const [activeSrc, setActiveSrc] = useState<string>("");
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
        setIsLoading(false); 
        return; 
      }

      const webLoaded = await preloadImage(webSrc);
      if (webLoaded) {
        setActiveSrc(webSrc);
        setIsLoading(false); 
        return; 
      }

      setActiveSrc(defaultSrc);
      setIsLoading(false); 
    };


    loadImages(); 

    loadImages();

  }, [localSrc, webSrc, defaultSrc]);

  return (
    <div style={{ position: "relative", width: imageWidth, height: imageHeight }}>

      {isLoading && ( 

      {isLoading && (

        <div className="placeholder" />
      )}
      <img
        src={activeSrc}
        alt=""
        className={`image ${!isLoading && 'imageLoaded'}`} 
        onLoad={() => setIsLoading(false)} 
      />
    </div>
  );
};

export default SelectIconImage;
