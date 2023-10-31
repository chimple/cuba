import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";
import Lesson from "../../models/lesson";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
  imageWidth: string;
  imageHeight: string;
}> = ({ localSrc, defaultSrc, webSrc, imageWidth, imageHeight }) => {
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
            width: imageWidth + "%",
            height: imageHeight + "%",
          }}
          src={localSrc}
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
          src={webSrc}
          alt=""
          onError={() => {
            setLoadIcon(LoadIcon.Default);
          }}
        />
      ) : (
        <img src={defaultSrc} alt="" />
      )}
    </div>
  );
};
export default SelectIconImage;
