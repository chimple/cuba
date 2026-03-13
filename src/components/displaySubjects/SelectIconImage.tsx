import { FC, useState, useEffect } from "react";
import "./SelectIconImage.css";

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
    const preloadImage = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          img.onload = null;
          img.onerror = null;
          resolve(true);
        };

        img.onerror = () => {
          img.onload = null;
          img.onerror = null;
          resolve(false);
        };

        img.src = src;
      });
    };

    const loadImages = async () => {
      setIsLoading(true);

      try {
        // Load both sources in parallel for maximum speed
        const [localLoaded, webLoaded] = await Promise.all([
          localSrc ? preloadImage(localSrc) : Promise.resolve(false),
          webSrc ? preloadImage(webSrc) : Promise.resolve(false),
        ]);

        setActiveSrc(
          localLoaded && localSrc
            ? localSrc
            : webLoaded && webSrc
            ? webSrc
            : defaultSrc
        );
      } catch (error) {
        console.error("Image loading failed:", error);
        setActiveSrc(defaultSrc);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [localSrc, webSrc, defaultSrc]);

  return (
    <div
      style={{ position: "relative", width: imageWidth, height: imageHeight }}
    >
      {isLoading && <div className="placeholder" />}
      {activeSrc && (
        <img
          src={activeSrc}
          alt=""
          className={`select-icon-image ${!isLoading ? "imageLoaded" : ""}`}
          style={{
            width: imageWidth,
            height: imageHeight,
            objectFit: "contain",
          }}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
};

export default SelectIconImage;
