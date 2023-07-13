import { FC, useState } from "react";
import CachedImage from "../common/CachedImage";

const SelectIconImage: FC<{
  localSrc: any;
  defaultSrc: any;
  webSrc: any;
}> = ({ localSrc, defaultSrc, webSrc }) => {
  const [imageCounter, setImageCounter] = useState(1);
  enum Image {
    img1 = 1,
    img2 = 2,
  }

  return (
    <div>
      {imageCounter === Image.img1 ? (
        <img
          src={localSrc}
          alt=""
          onError={() => {
            setImageCounter(2);
          }}
        />
      ) : (webSrc ?? defaultSrc) && imageCounter === Image.img2 ? (
        <CachedImage
          src={webSrc ?? defaultSrc}
          alt=""
          onError={() => {
            setImageCounter(3);
          }}
        />
      ) : (
        <img src={defaultSrc} alt="all" />
      )}
    </div>
  );
};
export default SelectIconImage;
