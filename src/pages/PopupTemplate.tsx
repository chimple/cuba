import React, { FC, useEffect, useState } from "react";
import "./PopupTemplate.css";
import { Util } from "../utility/util";
import { ASSIGNMENT_POPUP_SHOWN, EVENTS, QUIZ_POPUP_SHOWN } from "../common/constants";
import { useLocation } from "react-router-dom";
import { t } from "i18next";

interface PopupProps {
  onJoin: () => void;
  message: string;
  buttonMessage: string;
  imagePath: string;
}

const PopupTemplate: FC<PopupProps> = ({
  onJoin,
  message,
  buttonMessage,
  imagePath,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const location = useLocation();
  const compo_name = import.meta.url;

  // Handle Join Now button click and logging the event
  const handleJoinClick = async () => {
    const user = await Util.getCurrentStudent();
    Util.logEvent(EVENTS.User_Clicks, {
      user_id: user?.docId,
      user_name: user?.name,
      user_username: user?.username,
      button_message: buttonMessage,
      user_type: user?.role,
      action_type: "ok",
      page_name: location.pathname,
      page_path: `${window.location.protocol}//${window.location.host}${location.pathname}${location.search}`,
      component_name: compo_name.split("/").pop(),
    });

    if (message.includes(t("Live Quiz is Starting Soon!"))) {
      sessionStorage.setItem(QUIZ_POPUP_SHOWN, "true");
    } else if (message.includes(t("You have pending homework."))) {
      sessionStorage.setItem(ASSIGNMENT_POPUP_SHOWN, "true");
    }
    setIsVisible(false);
    onJoin(); // Calls the parent function
  };

  useEffect(() => {
    const isQuizPopup = message.includes(t("Live Quiz is Starting Soon!"));
    const isAssignmentPopup = message.includes(t("You have pending homework."));

    if ((isQuizPopup && sessionStorage.getItem(QUIZ_POPUP_SHOWN) === "true") ||
      (isAssignmentPopup && sessionStorage.getItem(ASSIGNMENT_POPUP_SHOWN) === "true")) {
      setIsVisible(false);
    }
  }, [message]);

  // Handle Close button click and logging the event
  const handleCloseClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const user = await Util.getCurrentStudent();
    Util.logEvent(EVENTS.User_Clicks, {
      user_id: user?.docId,
      user_name: user?.name,
      user_username: user?.username,
      user_type: user?.role,
      button_message: "close",
      action_type: "close",
      page_name: location.pathname,
      page_path: `${window.location.protocol}//${window.location.host}${location.pathname}${location.search}`,
      component_name: compo_name.split("/").pop(),
    });

    if (message.includes(t("Live Quiz is Starting Soon!"))) {
      sessionStorage.setItem(QUIZ_POPUP_SHOWN, "true");
    } else if (message.includes(t("You have pending homework."))) {
      sessionStorage.setItem(ASSIGNMENT_POPUP_SHOWN, "true");
    }
    setIsVisible(false);
  };

  // If the popup is not visible, return null to hide it
  if (!isVisible) return null;

  return (
    <div className="popup_overlay">
      <div className="popup-quiz-container">
        {/* Timer or Image */}
        <div className="popup_timer">
          <div className="relative popup-timer-container">
            <img src={imagePath} alt="Image" />
          </div>
        </div>

        {/* Content and Message Shown */}
        <div className="popup_content_holder">
          <div className="popup_message_row">
            <div className="popup_message">{message}</div>
            <button onClick={handleJoinClick} className="popup_joinbtn">
              {buttonMessage}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="popup_content_holder">
          <div className="popup_close">
            <span onClick={handleCloseClick} className="popup_val">
              x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupTemplate;
