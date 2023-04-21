import "./GenderAndAge.css";
import { CgBoy, CgGirl } from "react-icons/cg";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { IonRow } from "@ionic/react";
import React from "react";
import { GENDER } from "../../common/constants";
import { t } from "i18next";

const GenderAndAge: React.FC<{
  gender: GENDER | undefined;
  age: number | undefined;
  onGenderChange: (gender: GENDER) => void;
  onAgeChange: (age: number) => void;
}> = ({ gender, age, onGenderChange, onAgeChange }) => {
  return (
    <div>
      <div className="main-header">
        <div className="gender-title">{t("Select Child Gender:")}</div>
        <div className="gender-container">
          <div
            className="gender-button"
            onClick={() => {
              onGenderChange(GENDER.BOY);
            }}
          >
            <IonRow>
              <CgBoy size="8vh" color="#ffad1a" />
              <p className="gender-text"> {t("Boy")}</p>
            </IonRow>
            <BsFillCheckCircleFill
              color={gender === GENDER.BOY ? "#81C127" : "grey"}
              className="gender-check-box"
              size="4vh"
            />
          </div>
          <div
            className="gender-button"
            onClick={() => {
              onGenderChange(GENDER.GIRL);
            }}
          >
            <IonRow>
              <CgGirl size="8vh" color="#e28daf" />
              <p className="gender-text"> {t("Girl")}</p>
            </IonRow>
            <BsFillCheckCircleFill
              color={gender === GENDER.GIRL ? "#81C127" : "grey"}
              className="gender-check-box"
              size="4vh"
            />
          </div>
        </div>
        <div className="gender-title">{t("Select Child Age:")}</div>
        <div className="age-container">
          {Array(7)
            .fill(null)
            .map((_: number, index: number, array: number[]) => {
              const value = index + 4;
              return (
                <div
                  className={
                    "age-button " + (age === value ? "active-age" : "")
                  }
                  onClick={() => {
                    onAgeChange(value);
                  }}
                  key={index}
                >
                  {(index === 0 ? "<" : "") +
                    value +
                    (index === array.length - 1 ? ">" : "")}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
export default GenderAndAge;
