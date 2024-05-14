import * as React from "react";
import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { ASSIGNMENTTAB_LIST } from "../../../common/constants";

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
      <IonSegment value={value} onIonChange={segmentChanged}>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.RECOMMENDED}>
          <IonLabel>{ASSIGNMENTTAB_LIST.RECOMMENDED}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.ASSIGNMENT}>
          <IonLabel>{ASSIGNMENTTAB_LIST.ASSIGNMENT}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={ASSIGNMENTTAB_LIST.LIVEQUIZ}>
          <IonLabel>{ASSIGNMENTTAB_LIST.LIVEQUIZ}</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    </>
  );
};

export default AssignmentTabList;
