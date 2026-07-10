import React, { useState } from "react";
import { t } from "i18next";
import "./AddTeacherName.css";
import Header from "../components/homePage/Header";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";

const AddTeacherName: React.FC = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [error, setError] = useState(false);
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;

  const handleNext = async () => {
    const user = await auth.getCurrentUser();
    if (!firstName.trim()) {
      setError(true);
      return;
    }
    setError(false);
    await api.updateUserProfile(
      user!,
      (firstName + " " + lastName).trim(),
      user?.email!,
      user?.phone!,
      user?.language_id!,
      user?.image!
    );
    history.replace(PAGES.DISPLAY_SCHOOLS);
  };

  return (
    <div className="add-teacher-main-page">
      <Header isBackButton={false} showClass={true} showSchool={true} />
      <div className="add-teacher-container">
        <h2 className="add-teacher-text">{t("Your Profile")}</h2>

        <div className="add-teacher-form">
          <form>
            <div className="add-teacher-input-group">
              <label
                htmlFor="firstName"
                className={error ? "add-teacher-label-error" : ""}
              >
                {t("First Name")}
              </label>
              <input
                type="text"
                id="fname"
                name="fname"
                value={firstName}
                className={error ? "error" : ""}
                autoFocus
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (e.target.value.trim()) setError(false);
                }}
              />
              <hr className="horizontal-line" />
            </div>

            <div className="add-teacher-input-group">
              <label htmlFor="lastName">{t("Last Name")}</label>
              <input
                type="text"
                id="lname"
                name="lname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <hr className="horizontal-line" />
            </div>
          </form>
        </div>

        <div className="add-teacher-form-actions">
          <button
            className="add-teacher-update-button"
            type="button"
            onClick={handleNext}
          >
            {t("Next")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeacherName;
