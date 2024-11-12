import React, { useEffect, useRef, useState } from "react";
import { IonDatetime, IonButtons, IonButton } from "@ionic/react";
import "./CalendarPicker.css";
import { t } from "i18next";

interface CalendarPickerProps {
  value: string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  mode: "start" | "end"; // Define if this is for start or end date selection
  startDate?: string | null; // Pass selected start date to apply end date constraint
  minDate?: string;
  maxDate?: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  value,
  onConfirm,
  onCancel,
  mode,
  startDate,
  minDate,
  maxDate,
}) => {
  const datetimeRef = useRef<HTMLIonDatetimeElement>(null);
  const [currentValue, setCurrentValue] = useState<string | null>(value);

  // Format today’s date to 'yyyy-MM-dd' format
  const today = new Date().toISOString().split("T")[0];
  const effectiveMaxDate = (maxDate || today).split("T")[0];
  const effectiveMinDate =
    mode === "start" ? minDate : startDate || "1900-01-01";
  console.log("Effective Min Date:", effectiveMinDate);
  console.log("Effective Max Date:", effectiveMaxDate);
  // Ensure that effectiveMinDate is never undefined
  const safeMinDate = effectiveMinDate ?? "1900-01-01";

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (datetimeRef.current) {
      datetimeRef.current.value = currentValue || "";
    }
  }, [currentValue]);

  const handleConfirm = () => {
    if (currentValue) {
      onConfirm(currentValue);
    }
  };

  const handleDateChange = (event: CustomEvent) => {
    const newDate = event.detail.value?.split("T")[0]; // Extract only the date part

    // Directly compare dates as strings in 'yyyy-MM-dd' format
    if (newDate && newDate >= safeMinDate && newDate <= effectiveMaxDate) {
      setCurrentValue(newDate);
    } else {
      console.log("Selected date out of range");
    }
  };
  return (
    <div className="calendar-picker">
      <IonDatetime
        ref={datetimeRef}
        value={currentValue}
        presentation="date"
        min={safeMinDate}
        max={effectiveMaxDate}
        className="calendar-div"
        onIonChange={handleDateChange}
      />
      <IonButtons className="calendar-buttons">
        <IonButton
          onClick={onCancel}
          className="confirm-button"
          style={{ textTransform: "none" }}
        >
          {t("Cancel")}
        </IonButton>
        <IonButton
          onClick={handleConfirm}
          className="confirm-button"
          style={{ textTransform: "none" }}
        >
          {t("Confirm")}
        </IonButton>
      </IonButtons>
    </div>
  );
};

export default CalendarPicker;
