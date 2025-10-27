// src/components/schoolComponent/DetailListHeader.tsx
import React from "react";
import { t } from "i18next";
import "./DetailList.css";

const DetailListHeader: React.FC = () => {
  return (
    <div className="detail-list__header">
      <div />
      <div className="detail-list__icon-container">
        <div className="detail-list__icon-container-users">{t("Users")}</div>
        <div className="detail-list__icon-container-subjects">{t("Subjects")}</div>
      </div>
    </div>
  );
};

export default DetailListHeader;