import { FC, useState, useEffect } from "react";
import './SelectIconImage.css';

const SelectIconImage: FC<{
  localSrc?: string;
  defaultSrc: string;
  webSrc?: string;
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
     const preloadImage = (src: string, timeout = 5000): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          let isComplete = false;

          const timeoutId = window.setTimeout(() => {
            if (!isComplete) {
              img.onload = img.onerror = null;
              resolve(false);
            }
          }, timeout);

          img.onload = () => {
            isComplete = true;
            window.clearTimeout(timeoutId);
            resolve(true);
          };

      img.onerror = () => {
          isComplete = true;
          window.clearTimeout(timeoutId);
          resolve(false);
        };

        img.src = src;
      });
    };

const loadImages = async () => {
  setIsLoading(true);

    try {
          const [localLoaded, webLoaded] = await Promise.all([
            localSrc ? preloadImage(localSrc) : Promise.resolve(false),
            webSrc ? preloadImage(webSrc) : Promise.resolve(false),
          ]);

          const sourceToUse = localLoaded && localSrc 
            ? localSrc 
            : webLoaded && webSrc 
              ? webSrc 
              : defaultSrc;

          setActiveSrc(sourceToUse);
        } catch (error) {
          console.error('Image loading error:', error);
          setActiveSrc(defaultSrc);
        } finally {
          setIsLoading(false);
        }
      };

      loadImages();
    }, [localSrc, webSrc, defaultSrc]);

    return (
      <div style={{ position: "relative", width: imageWidth, height: imageHeight }}>
        {isLoading && (
          <div className="placeholder" />
        )}
        <img
          src={activeSrc}
          alt=""
          className={`select-icon-image ${!isLoading ? 'imageLoaded' : ''}`}
          style={{
            width: imageWidth,
            height: imageHeight,
            objectFit: 'contain'
          }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  };

export default SelectIconImage;
