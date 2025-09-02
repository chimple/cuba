import { IonDatetime, IonDatetimeButton, IonModal } from "@ionic/react";
import { FC } from "react";

interface DateTimePickerProps {
  date: string;
}

const DateTimePicker: FC<DateTimePickerProps> = ({ date }) => {
  return (
    <>
      <IonDatetimeButton datetime={date} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}></IonDatetimeButton>
      <IonModal keepContentsMounted={true} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonDatetime
          id={date}
          presentation="date"
          value={date} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}        ></IonDatetime>
      </IonModal>
    </>
  );
};
export default DateTimePicker;
