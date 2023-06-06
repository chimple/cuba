import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";

const BackButton: React.FC<{
  
  onClicked: React.MouseEventHandler<SVGElement>;
}> = ({onClicked }) => {
  return (
    <IoIosArrowBack
      id="common-back-button"
      onClick={onClicked}
    ></IoIosArrowBack>
  );
};
export default BackButton;
