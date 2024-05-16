import { IonDatetime, IonDatetimeButton, IonModal } from "@ionic/react";
import { FC } from "react";

interface DateTimePickerProps {
  date: string;
}

const DateTimePicker: FC<DateTimePickerProps> = ({ date }) => {
  return (
    <>
      <IonDatetimeButton datetime={date}></IonDatetimeButton>
      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id={date}
          presentation="date"
          value={date}
        ></IonDatetime>
      </IonModal>
    </>
  );
};
export default DateTimePicker;
