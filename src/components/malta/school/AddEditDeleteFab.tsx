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
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton disabled={disabled}>
          <IonIcon icon={arrowUpCircle}></IonIcon>
        </IonFabButton>
        <IonFabList side="top">
          <IonFabButton>
            <IonIcon icon={add} onClick={onAddClick}></IonIcon>
          </IonFabButton>
          <IonFabButton>
            <IonIcon icon={create} onClick={onEditClick}></IonIcon>
          </IonFabButton>
          <IonFabButton>
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
