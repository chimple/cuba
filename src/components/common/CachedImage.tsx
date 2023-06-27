import { ImgHTMLAttributes, useEffect, useState } from "react";
import { Util } from "../../utility/util";

function CachedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const params = { ...props };
  const [imgSrc, setImgSrc] = useState<string>();
  useEffect(() => {
    if (!!props.src) {
      Util.getCachedImage(props.src)
        .then((src) => {
          console.log("🚀 ~ file: CachedImage.tsx:11 ~ .then ~ src:", src);
          setImgSrc(src);
        })
        .catch((error) => {
          console.log(
            "🚀 ~ file: CachedImage.tsx:14 ~ useEffect ~ error:",
            JSON.stringify(error)
          );
          setImgSrc(props.src);
        });
    }
  }, [props]);
  return !!imgSrc ? <img {...params} src={imgSrc} alt={imgSrc} /> : <div></div>;
}
export default CachedImage;
