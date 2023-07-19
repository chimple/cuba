import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";
import Lesson from "../../models/lesson";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
}> = ({ localSrc, defaultSrc, webSrc }) => {
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
          src={localSrc}
          alt="local"
          onError={() => {
            setLoadIcon(LoadIcon.Web);
          }}
        />
      ) : webSrc !== undefined &&
        (webSrc ?? defaultSrc) &&
        loadIcon === LoadIcon.Web ? (
        <CachedImage
          src={webSrc}
          alt="web"
          onError={() => {
            setLoadIcon(LoadIcon.Default);
          }}
        />
      ) : (
        <img src={defaultSrc} alt="default" />
      )}
    </div>
  );
};
export default SelectIconImage;
