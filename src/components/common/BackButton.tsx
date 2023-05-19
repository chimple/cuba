import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";

const BackButton: React.FC<{
  iconSize: string;
  onClicked: React.MouseEventHandler<SVGElement>;
}> = ({ iconSize, onClicked }) => {
  return (
    <IoIosArrowBack
      id="common-back-button"
      // size={iconSize}
      onClick={onClicked}
    ></IoIosArrowBack>
  );
};
export default BackButton;
