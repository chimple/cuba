import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
}> = ({ localSrc, defaultSrc, webSrc }) => {
  enum LOADICON {
    Local,
    Web,
    Default,
  }
  const [loadIcon, setLoadIcon] = useState(LOADICON.Local);

  return (
    <div>
      {loadIcon === LOADICON.Local ? (
        <img
          src={localSrc}
          alt=""
          onError={() => {
            setLoadIcon(LOADICON.Web);
          }}
        />
      ) : (webSrc ?? defaultSrc) && loadIcon === LOADICON.Web ? (
        <CachedImage
          src={webSrc ?? defaultSrc}
          alt=""
          onError={() => {
            setLoadIcon(LOADICON.Default);
          }}
        />
      ) : (
        <img src={defaultSrc} alt="all" />
      )}
    </div>
  );
};
export default SelectIconImage;
