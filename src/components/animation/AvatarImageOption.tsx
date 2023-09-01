import { t } from "i18next";
import "./RectangularTextButton.css";
import SelectIconImage from "../displaySubjects/SelectIconImage";
const AvatarImageOption: React.FC<{
  imageWidth: number;
  imageSrc: string;
}> = ({ imageWidth, imageSrc }) => {
  return (
    <div style={{ width: imageWidth + "vh", height: "auto", padding: "1%" }}>
      <SelectIconImage
        localSrc={""}
        defaultSrc={""}
        webSrc={
          "https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"
        }
      />
    </div>
  );
};
export default AvatarImageOption;
