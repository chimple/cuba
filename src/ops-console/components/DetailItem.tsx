import React from "react";
import "./DetailItem.css";

export interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="detail-item-root">
    <div className="detail-item-label">{label}</div>
    <div className="detail-item-value">{value}</div>
  </div>
);

export default DetailItem;
