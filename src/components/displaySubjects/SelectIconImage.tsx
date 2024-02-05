import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";
import Lesson from "../../models/lesson";

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
  const [loadIcon, setLoadIcon] = useState(LoadIcon.Local);
  
  return (
    <div>
      {loadIcon === LoadIcon.Local ? (
        <img
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
          src={webSrc}
          loading="lazy"
          alt=""
          onError={() => {
            setLoadIcon(LoadIcon.Web);
          }}
        />
      ) : webSrc !== undefined &&
        (webSrc ?? defaultSrc) &&
        loadIcon === LoadIcon.Web ? (
        <CachedImage
          style={{
            width: webImageWidth,
            height: webImageHeight,
          }}
          src={webSrc}
          alt=""
          onError={() => {
            setLoadIcon(LoadIcon.Default);
          }}
        />
      ) : (
        <img
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
          src={defaultSrc}
          alt=""
        />
      )}
    </div>
  );
};
export default SelectIconImage;
