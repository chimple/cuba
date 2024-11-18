import { IonDatetime, IonDatetimeButton, IonModal } from "@ionic/react";
import { FC } from "react";

interface DateTimePickerProps {
  date: string;
  onClickChange?: (e: any) => void;
}

const DateTimePicker: FC<DateTimePickerProps> = ({ date, onClickChange }) => {
  return (
    <>
      <IonDatetimeButton datetime={date}></IonDatetimeButton>
      <IonModal keepContentsMounted={true}>
        <IonDatetime
          color={"white"}
          id={date}
          presentation="date"
          value={date}
          onChange={onClickChange}
        ></IonDatetime>
      </IonModal>
    </>
  );
};
export default DateTimePicker;
