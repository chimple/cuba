import { IonFab, IonFabButton, IonFabList, IonIcon } from "@ionic/react";
import { add, arrowUpCircle, create, trash } from "ionicons/icons";
import { FC } from "react";
import CommonDialog from "../common/CommonDialog";
import AddSchool from "./AddSchool";
import { t } from "i18next";
interface AddEditDeleteFabProps {
  onAddClick: React.MouseEventHandler<HTMLIonIconElement>;
  onEditClick: React.MouseEventHandler<HTMLIonIconElement>;
  disabled: boolean;
}

const AddEditDeleteFab: FC<AddEditDeleteFabProps> = ({
  onAddClick,
  onEditClick,
  disabled,
}) => {
  return (
    <>
      <IonFab slot="fixed" vertical="bottom" horizontal="end" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonFabButton placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} disabled={disabled}>
          <IonIcon icon={arrowUpCircle} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}></IonIcon>
        </IonFabButton>
        <IonFabList side="top" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonFabButton placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <IonIcon icon={add} onClick={onAddClick} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}></IonIcon>
          </IonFabButton>
          <IonFabButton placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <IonIcon icon={create} onClick={onEditClick} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}></IonIcon>
          </IonFabButton>
          <IonFabButton placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
            <CommonDialog
              alertMsg={t("Are you sure to delete the school?")}
              ionIcon={trash}
            ></CommonDialog>
          </IonFabButton>
        </IonFabList>
      </IonFab>
    </>
  );
};

export default AddEditDeleteFab;
