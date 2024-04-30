import React, { ChangeEventHandler, useState } from "react";
import "./AddTeacher.css";
import { IoSearchSharp } from "react-icons/io5";
import IconButton from "@mui/material/IconButton";
import { Input } from "@mui/base";
import { t } from "i18next";
import { IonPage } from "@ionic/react";

interface AddTeacherProps {
  teacherName?: string;
  additionalInfo?: string;
}

const AddTeacher: React.FC<AddTeacherProps> = ({
  teacherName,
  additionalInfo,
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const handleSearchbarChange: ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setSearchText(event.target.value);
  };
  const handleEnterButtonClick = () => {};

  return (
    <IonPage>
      <div>
        <div className="header-class">
          <div className="close-button">
            <IconButton onClick={() => {}}>X</IconButton>
          </div>
          <div className="profile">
            <img
              className="profile-image"
              src="assets/avatars/cheetah.png"
              alt="Round"
            />
            <div className="profile-details">
              <div>{teacherName}</div>
              <div>{additionalInfo}</div>
            </div>
          </div>
          <div></div>
        </div>
        <div className="line"></div>
        <div className="search-text">{t("Search")}</div>
        <div className="container">
          <div className="searchbar-container">
            <div>
              <Input
                onChange={handleSearchbarChange}
                placeholder="Email"
                id="searchbar"
                type="search"
              ></Input>
            </div>
            <div onClick={handleEnterButtonClick} className="search-button">
              <IoSearchSharp className="search-icon" size={35} />
            </div>
          </div>
          <div className="phone-number-search">
            {t("Use Phone Number Insted")}
          </div>
          <button className="add-teacher-button">{t("Add")}</button>
        </div>
      </div>
    </IonPage>
  );
};

export default AddTeacher;
