import * as React from "react";
import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { COMMONTAB_LIST } from "../../../common/constants";
import './SchoolClassSubjectsTab.css';

interface CommonTabProps {
  tabHeader: COMMONTAB_LIST;
  segmentChanged: (evt) => void;
}

const CommonTab: React.FC<CommonTabProps> = ({
  tabHeader: value,
  segmentChanged,
}) => {
  return (
    <>
      <IonSegment value={value} onIonChange={segmentChanged} style={{padding: '6px'}}>
        <IonSegmentButton value={COMMONTAB_LIST.SCHOOL}>
          <IonLabel>{COMMONTAB_LIST.SCHOOL}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={COMMONTAB_LIST.CLASS}>
          <IonLabel>{COMMONTAB_LIST.CLASS}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value={COMMONTAB_LIST.SUBJECTS}>
          <IonLabel>{COMMONTAB_LIST.SUBJECTS}</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    </>
  );
};

export default CommonTab;
