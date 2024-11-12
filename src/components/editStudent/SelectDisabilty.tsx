import "./SelectDisabilty.css";
import { CgBoy, CgGirl } from "react-icons/cg";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { IonRow } from "@ionic/react";
import React from "react";
import { DISABILITY } from "../../common/constants";
import { t } from "i18next";

const SelectDisabilty: React.FC<{
  disability: DISABILITY | undefined;
  onDisabilityChange: (disability: DISABILITY) => void;
}> = ({ disability, onDisabilityChange }) => {
  return (
    <div>
      <div className="disability-header">
        <div className="disability-container">
          <div
            aria-label={`${t(DISABILITY.NOTAPPLICABLE)}`}
            className="disability-button"
            style={{
              backgroundColor:
                disability === DISABILITY.NOTAPPLICABLE ? "#E9FFBF" : "white",
              border:
                disability === DISABILITY.NOTAPPLICABLE
                  ? "4px solid #58CD99"
                  : "2px solid black",
            }}
            onClick={() => {
              onDisabilityChange(DISABILITY.NOTAPPLICABLE);
            }}
          >
            <IonRow aria-hidden={"true"}>
              <p className="disability-text"> {t(DISABILITY.NOTAPPLICABLE)}</p>
            </IonRow>
          </div>
          <div
            style={{
              backgroundColor:
                disability === DISABILITY.VI ? "#E9FFBF" : "white",
              border:
                disability === DISABILITY.VI
                  ? "4px solid #58CD99"
                  : "2px solid black",
            }}
            aria-label={`${t(DISABILITY.VI)}`}
            className="disability-button"
            onClick={() => {
              onDisabilityChange(DISABILITY.VI);
            }}
          >
            <IonRow aria-hidden={"true"}>
              <img
                className="impairedIcon"
                src="assets/icons/visualimpaired.png"
              />
              <p className="disability-text"> {t(DISABILITY.VI)}</p>
            </IonRow>
          </div>
          <div
            className="disability-container"
            aria-label={`${t(DISABILITY.HI)}`}
          >
            <div
              aria-hidden={"true"}
              className="disability-button"
              style={{
                backgroundColor:
                  disability === DISABILITY.HI ? "#E9FFBF" : "white",
                border:
                  disability === DISABILITY.HI
                    ? "4px solid #58CD99"
                    : "2px solid black",
              }}
              onClick={() => {
                onDisabilityChange(DISABILITY.HI);
              }}
            >
              <IonRow>
                <img
                  className="impairedIcon"
                  src="assets/icons/hearingimpaired.png"
                />
                <p className="disability-text"> {t(DISABILITY.HI)}</p>
              </IonRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SelectDisabilty;
