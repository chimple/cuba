import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
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
  enum LoadIcon {
    Local,
    Web,
    Default,
  }

  const [loadIcon, setLoadIcon] = useState<LoadIcon>(LoadIcon.Local);
  const [isValid, setIsValid] = useState(true);

  const handleImageLoad = () => {
    setIsValid(true);
  };

  const handleImageError = () => {
    switch (loadIcon) {
      case LoadIcon.Local:
        setLoadIcon(LoadIcon.Web);
        break;
      case LoadIcon.Web:
        setLoadIcon(LoadIcon.Default);
        break;
      case LoadIcon.Default:
        setLoadIcon(LoadIcon.Local);
        setIsValid(false);
        break;
      default:
        setLoadIcon(LoadIcon.Default);
        break;
    }
  };

  const imageProps = {
    style: {
      width: imageWidth,
      height: imageHeight,
      display: isValid ? "block" : "contents",
    },
    onLoad: handleImageLoad,
    onError: handleImageError,
    alt: "",
  };

  return (
    <div>
      {loadIcon === LoadIcon.Local && <img {...imageProps} src={localSrc} />}
      {webSrc !== undefined &&
        (webSrc ?? defaultSrc) &&
        loadIcon === LoadIcon.Web && (
          <CachedImage {...imageProps} src={webSrc} />
        )}
      {loadIcon === LoadIcon.Default && (
        <img {...imageProps} src={defaultSrc} />
      )}
    </div>
  );
};

export default SelectIconImage;
