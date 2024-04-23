import React from "react";
import {
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonModal,
} from "@ionic/react";
import { t } from "i18next";
import { calendar } from "ionicons/icons";
import './DateTimePicker.css'

const DateTimePicker = () => {
  return (
    <>
      <div className="datePicker">
        <div className="datetextdiv">
          {t("Start Date")}
          <div className="dateicon">
            <IonDatetimeButton datetime="datetime"></IonDatetimeButton>

            <IonModal keepContentsMounted={true}>
              <IonDatetime
                id="datetime"
                presentation="date"
                value="2023-11-02"
                formatOptions={{
                  date: {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  },
                }}
              ></IonDatetime>
            </IonModal>
            <IonIcon icon={calendar} color="primary"></IonIcon>
          </div>
        </div>
        <div className="datetextdiv">
          {t("End Date")}
          <div className="dateicon">
            <IonDatetimeButton datetime="datetime"></IonDatetimeButton>

            <IonModal keepContentsMounted={true}>
              <IonDatetime
                id="datetime"
                presentation="date"
                value="2023-11-02"
                formatOptions={{
                  date: {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  },
                }}
              ></IonDatetime>
            </IonModal>
            <IonIcon icon={calendar} color="primary"></IonIcon>
          </div>
        </div>
      </div>
    </>
  );
};
export default DateTimePicker;
