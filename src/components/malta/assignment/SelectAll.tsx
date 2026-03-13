import React from "react";
import { IonCheckbox } from "@ionic/react";
import { t } from "i18next";

const SelectAll: React.FC = () => {
  return <IonCheckbox>{t("Select All")}</IonCheckbox>;
};
export default SelectAll;
