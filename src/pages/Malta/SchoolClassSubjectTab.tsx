import { IonHeader, IonPage } from "@ionic/react";
import { FC, useState } from "react";
import CommonAppBar from "../../components/malta/common/CommonAppBar";
import { COMMONTAB_LIST } from "../../common/constants";
import CommonTab from "../../components/malta/common/CommonTab";
import { t } from "i18next";
import "./SchoolClassSubjectTab.css";
import AddEditDeleteFab from "../../components/malta/school/AddEditDeleteFab";
import SchoolDetail from "../../components/malta/school/SchoolDetail";
import SwitchSchool from "../../components/malta/school/SwitchSchool";
import CommonButton from "../../components/malta/common/CommonButton";
import EditSchool from "../../components/malta/school/EditSchool";
import AddSchool from "../../components/malta/school/AddSchool";
import School from "../../models/school";

const SchoolClassSubjectTab: FC = () => {
  const [activeTab, setActiveTab] = useState(COMMONTAB_LIST.SCHOOL);
  const [isSchoolEdit, setIsSchoolEdit] = useState<boolean>(false);
  const [isSchoolAdd, setIsSchoolAdd] = useState<boolean>(false);
  const [newSchool, setNewSchool] = useState<School>();
  const segmentChanged = (evt) => {
    console.log(evt.detail.value);
    //write logic
    setActiveTab(evt.detail.value);
  };

  const onSchoolEdit = () => {
    //write logic
    setIsSchoolEdit(true);
  };

  const onSchoolAdd = () => {
    //write logic
    setIsSchoolAdd(true);
  };

  const onCancel = () => {
    setIsSchoolEdit(false);
    setIsSchoolAdd(false);
  };

  const onSchoolSave = () => {};
  const onSchoolCreate = () => {};
  return (
    <IonPage style={{ backgroundColor: "white" }}>
      <IonHeader>
        <CommonAppBar title={t("Username")} loc="#" />
        <CommonTab
          tabHeader={activeTab}
          segmentChanged={segmentChanged}
        ></CommonTab>
      </IonHeader>

      {activeTab == COMMONTAB_LIST.SCHOOL && (
        <>
          {isSchoolEdit ? (
            <EditSchool
              schoolName="Bharthiya Vidya Mandir"
              cityName="Bengaluru"
              stateName="Karnataka"
              onCancel={onCancel}
              onSave={onSchoolSave}
            />
          ) : isSchoolAdd ? (
            <AddSchool
              schoolName={newSchool?.name!}
              cityName={newSchool?.name!}
              stateName={newSchool?.name!}
              onCancel={onCancel}
              onCreate={onSchoolCreate}
            />
          ) : (
            <SchoolDetail
              schoolName="Bharthiya Vidya Mandir"
              cityName="Bengaluru"
              stateName="Karnataka"
            />
          )}
          <SwitchSchool></SwitchSchool>
          <CommonButton
            title="Switch School"
            disabled={isSchoolAdd || isSchoolEdit ? true : false}
            onClicked={() => {}}
          />
          <AddEditDeleteFab
            onAddClick={onSchoolAdd}
            onEditClick={onSchoolEdit}
            disabled={isSchoolAdd || isSchoolEdit ? true : false}
          />
        </>
      )}
    </IonPage>
  );
};

export default SchoolClassSubjectTab;
