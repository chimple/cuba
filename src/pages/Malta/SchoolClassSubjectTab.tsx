import { IonHeader, IonPage } from "@ionic/react";
import { FC, useState } from "react";
import CommonAppBar from "../../components/malta/common/CommonAppBar";
import { COMMONTAB_LIST } from "../../common/constants";
import CommonTab from "../../components/malta/common/SchoolClassSubjectsTab";
import { t } from "i18next";
import AddEditDeleteFab from "../../components/malta/school/AddEditDeleteFab";
import SchoolDetail from "../../components/malta/school/SchoolDetail";
import SwitchSchool from "../../components/malta/school/SwitchSchool";
import CommonButton from "../../components/malta/common/CommonButton";
import EditSchool from "../../components/malta/school/EditSchool";
import AddSchool from "../../components/malta/school/AddSchool";
import School from "../../models/school";
import SchoolTab from "../../components/malta/school/SchoolTab";

const SchoolClassSubjectTab: FC = () => {
  const [activeTab, setActiveTab] = useState(COMMONTAB_LIST.SCHOOL);
  const [isSchoolEdit, setIsSchoolEdit] = useState<boolean>(false);
  const [isSchoolAdd, setIsSchoolAdd] = useState<boolean>(false);
  const [newSchool, setNewSchool] = useState<School>();
  const [currentSchoolName, setCurrentSchoolName] = useState<string>();
  const [currentSchoolCity, setCurrentSchoolCity] = useState<string>();
  const [currentSchoolState, setCurrentSchoolState] = useState<string>();
  const [allSchools, setAllSchools] = useState<[]>();
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
        <CommonAppBar
          title={t("Username")}
          loc="#"
          showAvatar={true}
          imgScr="https://ionicframework.com/docs/img/demos/avatar.svg"
        />
        <CommonTab
          tabHeader={activeTab}
          segmentChanged={segmentChanged}
        ></CommonTab>
      </IonHeader>

      {activeTab == COMMONTAB_LIST.SCHOOL && (
        <SchoolTab
          cityName={currentSchoolCity!}
          schoolName={currentSchoolName!}
          stateName={currentSchoolState!}
          schools={allSchools!}
          onCancel={onCancel}
          onSchoolAdd={onSchoolAdd}
          onSchoolEdit={onSchoolEdit}
          onSchoolCreate={onSchoolCreate}
          onSchoolSave={onSchoolSave}
          isSchoolAdd={isSchoolAdd}
          isSchoolEdit={isSchoolEdit}
        ></SchoolTab>
      )}
    </IonPage>
  );
};

export default SchoolClassSubjectTab;
