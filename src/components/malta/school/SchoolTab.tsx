import { FC, useState } from "react";
import EditSchool from "./EditSchool";
import AddSchool from "./AddSchool";
import SchoolDetail from "./SchoolDetail";
import SwitchSchool from "./SwitchSchool";
import CommonButton from "../common/CommonButton";
import AddEditDeleteFab from "./AddEditDeleteFab";
import { t } from "i18next";
import School from "../../../models/school";

interface SchoolTabProps {
  isSchoolEdit: boolean;
  isSchoolAdd: boolean;
  schoolName: string;
  cityName: string;
  stateName: string;
  schools: string[];
  onCancel: React.MouseEventHandler<HTMLIonButtonElement>;
  onSchoolSave: React.MouseEventHandler<HTMLIonButtonElement>;
  onSchoolCreate: React.MouseEventHandler<HTMLIonButtonElement>;
  onSchoolAdd: React.MouseEventHandler<HTMLIonIconElement>;
  onSchoolEdit: React.MouseEventHandler<HTMLIonIconElement>;
}

const SchoolTab: FC<SchoolTabProps> = ({
  isSchoolAdd,
  isSchoolEdit,
  schoolName,
  cityName,
  stateName,
  schools,
  onCancel,
  onSchoolCreate,
  onSchoolSave,
  onSchoolAdd,
  onSchoolEdit,
}) => {
  const [newSchool, setNewSchool] = useState<School>();
  return (
    <>
      {isSchoolEdit ? (
        <EditSchool
          schoolName={schoolName}
          cityName={cityName}
          stateName={stateName}
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
          schoolName={schoolName}
          cityName={cityName}
          stateName={stateName}
        />
      )}
      <SwitchSchool schools={schools}></SwitchSchool>
      <CommonButton
        title={t("Switch School")}
        disabled={isSchoolAdd || isSchoolEdit ? true : false}
        onClicked={() => {}}
      />
      <AddEditDeleteFab
        onAddClick={onSchoolAdd}
        onEditClick={onSchoolEdit}
        disabled={isSchoolAdd || isSchoolEdit ? true : false}
      />
    </>
  );
};

export default SchoolTab;
