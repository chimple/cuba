import { IonFab, IonFabButton, IonFabList, IonIcon } from "@ionic/react";
import { add, arrowUpCircle, create, trash } from "ionicons/icons";
import { FC } from "react";
import DeleteSchoolDialog from "./DeleteSchoolDialog";
import AddSchool from "./AddSchool";
interface AddEditDeleteFabProps {
  onAddClick: React.MouseEventHandler<HTMLIonIconElement>;
  onEditClick: React.MouseEventHandler<HTMLIonIconElement>;
  disabled:boolean;
}

const AddEditDeleteFab : FC<AddEditDeleteFabProps> = ({onAddClick, onEditClick, disabled}) => {
    return(
      <>
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton disabled={disabled}>
            <IonIcon icon={arrowUpCircle}></IonIcon>
          </IonFabButton>
          <IonFabList side="top">
          <IonFabButton>
          <IonIcon icon={add} onClick={onAddClick}></IonIcon></IonFabButton>
            <IonFabButton>
              <IonIcon icon={create} onClick={onEditClick}></IonIcon>
            </IonFabButton>
            <DeleteSchoolDialog></DeleteSchoolDialog>
          </IonFabList>
        </IonFab></>
    );
}

export default AddEditDeleteFab;