import { useEffect, useRef } from "react";
import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";
import { registerBackButtonHandler } from "../../common/backButtonRegistry";
import { t } from "i18next";

const BackButton: React.FC<{
  onClicked: any;
}> = ({ onClicked }) => {
  const onClickedRef = useRef(onClicked);

  useEffect(() => {
    onClickedRef.current = onClicked;
  }, [onClicked]);

  useEffect(() => {
    const unregister = registerBackButtonHandler(() => {
      const handled = onClickedRef.current?.();
      return handled === undefined ? true : handled;
    });
    return unregister;
  }, []);

  return (
    <IoIosArrowBack
      id="common-back-button"
      aria-label={String(t("Back"))}
      onClick={onClicked}
    ></IoIosArrowBack>
  );
};
export default BackButton;
