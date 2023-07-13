import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";

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
          alt=""
          onError={() => {
            setLoadIcon(LoadIcon.Web);
          }}
        />
      ) : webSrc != undefined && loadIcon === LoadIcon.Web ? (
        <CachedImage
          src={webSrc}
          alt=""
          onError={() => {
            setLoadIcon(LoadIcon.Default);
          }}
        />
      ) : (
        <img src={defaultSrc} alt="all" />
      )}
    </div>
  );
};
export default SelectIconImage;
