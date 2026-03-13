// src/components/schoolComponent/DetailListHeader.tsx
import React from "react";
import { t } from "i18next";
import "./DetailList.css";

const DetailListHeader: React.FC = () => {
  return (
    <div className="detail-list__header">
      <div />
      <div className="detail-list__icon-container">
        <div className="detail-list-header-row">
          <span className="detail-list-header-empty"></span>
          <span className="detail-list-header-users">{t("Users")}</span>
          <span className="detail-list-header-subjects">{t("Subjects")}</span>
        </div>
      </div>
    </div>
  );
};

export default DetailListHeader;