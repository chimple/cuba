import React, { FC, useEffect, useState } from "react";
import "./PopupTemplate.css";
import { Util } from "../utility/util";
import { EVENTS } from "../common/constants";
import { useLocation } from "react-router-dom";

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
  const handleJoinClick = async() => {
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
      component_name: compo_name.split('/').pop(),
    });

    setIsVisible(false);
    onJoin(); // Calls the parent function
  };

  useEffect(() => {
    const visibilityState = sessionStorage.getItem("popupVisible");
    if (visibilityState === "false") {
      setIsVisible(false);
    }
  }, []);

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
      component_name: compo_name.split('/').pop(),
    });

    setIsVisible(false);
  };

  // If the popup is not visible, return null to hide it
  if (!isVisible) return null;

  return (
    <div className="popup_overlay">
      <div className="popup-quiz-container">
        {/* Close Button */}
        <button
          className="popup_button"
          onClick={handleCloseClick}
          type="button"
          style={{ background: "none", border: "none" }}
        >
          <div className="popup_closebtn">
            <img src="/assets/icons/CloseButton.png" alt="Close" />
          </div>
        </button>

        {/* Timer or Image */}
        <div className="popup_timer">
          <div className="relative popup-timer-container"> 
            <img src={imagePath} alt="Image" />
          </div>
        </div>

        {/* Join Now Button */}
        <div className="popup_content_holder">
          <div className="popup_message">{message}</div>
          <button onClick={handleJoinClick} className="popup_joinbtn">
            {buttonMessage}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupTemplate;
