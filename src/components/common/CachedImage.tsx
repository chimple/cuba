import { ImgHTMLAttributes, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { CACHE_IMAGE } from "../../common/constants";

function CachedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const params = { ...props };
  const [imgSrc, setImgSrc] = useState<string>();

  async function getCachedImage(url: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) return url;
    try {
      const result = await Filesystem.readFile({
        path: CACHE_IMAGE + "/" + url.replaceAll("/", "-"),
        directory: Directory.Cache,
      });
      return "data:image/png;base64," + result.data;
    } catch (error) {
      try {
        // retrieve the image
        const response = await CapacitorHttp.get({
          url: url,
          responseType: "blob",
        });
        const blob = await response.data;
        await Filesystem.writeFile({
          path: CACHE_IMAGE + "/" + url.replaceAll("/", "-"),
          data: blob,
          directory: Directory.Cache,
        });
        return "data:image/png;base64," + blob;
      } catch (error) {
        console.log(
          "🚀 ~ file: util.ts:698 ~ getCachedImage ~ error:",
          JSON.stringify(error)
        );
        return url;
      }
    }
  }
  useEffect(() => {
    if (!!props.src) {
      getCachedImage(props.src)
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
