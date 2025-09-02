import * as React from "react";
import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { ASSIGNMENTTAB_LIST } from "../../../common/constants";
import "./AssignmentTabList.css";

interface AssignmentTabListProps {
  tabHeader: ASSIGNMENTTAB_LIST;
  segmentChanged: (evt) => void;
}

const AssignmentTabList: React.FC<AssignmentTabListProps> = ({
  tabHeader: value,
  segmentChanged,
}) => {
  return (
    <>
      <IonSegment value={value} onIonChange={segmentChanged} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.RECOMMENDED} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{ASSIGNMENTTAB_LIST.RECOMMENDED}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.ASSIGNMENT} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{ASSIGNMENTTAB_LIST.ASSIGNMENT}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.LIVEQUIZ} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
          <IonLabel placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>{ASSIGNMENTTAB_LIST.LIVEQUIZ}</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    </>
  );
};

export default AssignmentTabList;
