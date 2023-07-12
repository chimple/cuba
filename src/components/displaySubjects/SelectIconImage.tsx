import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
}> = ({ localSrc, defaultSrc, webSrc }) => {
  const [imageCounter, setImageCounter] = useState(1);

  return (
    <div>
      {imageCounter === 1 ? (
        <img
          className="class-avatar-img"
          src={localSrc}
          alt=""
          onError={() => {
            setImageCounter(2);
          }}
        />
      ) : (webSrc ?? defaultSrc) && imageCounter === 2 ? (
        <CachedImage
          className="class-avatar-img"
          src={webSrc ?? defaultSrc}
          alt=""
          onError={() => {
            setImageCounter(3);
          }}
        />
      ) : (
        <img className="class-avatar-img" src={defaultSrc} alt="all" />
      )}
    </div>
  );
};
export default SelectIconImage;
