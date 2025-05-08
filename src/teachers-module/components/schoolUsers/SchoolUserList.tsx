import React, { useEffect, useState } from "react";
import "./SchoolUserList.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { SCHOOL_USERS, TableTypes, USER_ROLE } from "../../../common/constants";
import { IonIcon } from "@ionic/react";
import { RoleType } from "../../../interface/modelInterfaces";
import SchoolUserDetail from "./SchoolUserDetail";
import { trashOutline } from "ionicons/icons";
import CommonDialogBox from "../../../common/CommonDialogBox";
import { t } from "i18next";

const SchoolUserList: React.FC<{
  schoolDoc: TableTypes<"school">;
  userType: SCHOOL_USERS;
}> = ({ schoolDoc, userType }) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [allPrincipals, setAllPrincipals] = useState<TableTypes<"user">[]>();
  const [allCoordinators, setAllCoordinators] =
    useState<TableTypes<"user">[]>();
  const [allSponsors, setAllSponsors] = useState<TableTypes<"user">[]>();
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const [showSelfDeleteError, setShowSelfDeleteError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const auth = ServiceConfig.getI()?.authHandler;
  const currentUserRole = JSON.parse(localStorage.getItem(USER_ROLE)!);
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await auth?.getCurrentUser();
    setCurrentUser(user!);
    if (userType === SCHOOL_USERS.PRINCIPALS) {
      const principalDocs = await api?.getPrincipalsForSchool(schoolDoc.id);
      setAllPrincipals(principalDocs);
      console.log("principalDocs", principalDocs);
    } else if (userType === SCHOOL_USERS.COORDINATORS) {
      const coordinatorsDoc = await api?.getCoordinatorsForSchool(schoolDoc.id);
      setAllCoordinators(coordinatorsDoc);
      console.log("coordinatorsDoc", coordinatorsDoc);
    } else {
      const sponsorsDoc = await api?.getSponsorsForSchool(schoolDoc.id);
      setAllSponsors(sponsorsDoc);
      console.log("sponsorsDoc", sponsorsDoc);
    }
  };

  const handleDeleteClick = (user: TableTypes<"user">) => {
    if (user.id === currentUser?.id) {
      setShowSelfDeleteError(true);
      return;
    }
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        if (userType === SCHOOL_USERS.PRINCIPALS) {
          await api?.deleteUserFromSchool(
            schoolDoc.id,
            selectedUser.id,
            RoleType.PRINCIPAL
          );
          setAllPrincipals((prev) =>
            prev?.filter((principal) => principal.id !== selectedUser.id)
          );
        } else if (userType === SCHOOL_USERS.COORDINATORS) {
          await api?.deleteUserFromSchool(
            schoolDoc.id,
            selectedUser.id,
            RoleType.COORDINATOR
          );
          setAllCoordinators((prev) =>
            prev?.filter((coordinator) => coordinator.id !== selectedUser.id)
          );
        } else {
          await api?.deleteUserFromSchool(
            schoolDoc.id,
            selectedUser.id,
            RoleType.SPONSOR
          );
          setAllCoordinators((prev) =>
            prev?.filter((coordinator) => coordinator.id !== selectedUser.id)
          );
        }
        setShowConfirm(false);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
      await api.updateSchoolLastModified(schoolDoc.id);
      await api.updateUserLastModified(selectedUser.id);

    }
  };

  return (
    <div>
      {userType === SCHOOL_USERS.PRINCIPALS &&
        (allPrincipals && allPrincipals.length > 0 ? (
          allPrincipals.map((principal, index) => (
            <div key={index}>
              <div className="school-user-div">
                <div>
                  <SchoolUserDetail
                    user={principal}
                    schoolId={schoolDoc.id}
                    userType={userType}
                  />
                </div>
                {(currentUserRole === RoleType.PRINCIPAL ||
                  currentUserRole === RoleType.COORDINATOR) && (
                  <div
                    className="delete-button"
                    onClick={() => handleDeleteClick(principal)}
                  >
                    <IonIcon icon={trashOutline} className="trash-icon" />
                  </div>
                )}
              </div>
              <hr className="horizontal-line" />
            </div>
          ))
        ) : (
          <div className="no-users-found">{t("No Principals Found")}</div>
        ))}

      {userType === SCHOOL_USERS.COORDINATORS &&
        (allCoordinators && allCoordinators.length > 0 ? (
          allCoordinators.map((coordinator, index) => (
            <div key={index}>
              <div className="school-user-div">
                <div>
                  <SchoolUserDetail
                    user={coordinator}
                    schoolId={schoolDoc.id}
                    userType={userType}
                  />
                </div>
                {(currentUserRole === RoleType.PRINCIPAL ||
                  currentUserRole === RoleType.COORDINATOR) && (
                  <div
                    className="delete-button"
                    onClick={() => handleDeleteClick(coordinator)}
                  >
                    <IonIcon icon={trashOutline} className="trash-icon" />
                  </div>
                )}
              </div>
              <hr className="horizontal-line" />
            </div>
          ))
        ) : (
          <div className="no-users-found">{t("No Coordinators Found")}</div>
        ))}

      {userType === SCHOOL_USERS.SPONSORS &&
        (allSponsors && allSponsors.length > 0 ? (
          allSponsors.map((sponsor, index) => (
            <div key={index}>
              <div className="school-user-div">
                <div>
                  <SchoolUserDetail
                    user={sponsor}
                    schoolId={schoolDoc.id}
                    userType={userType}
                  />
                </div>
                {(currentUserRole === RoleType.PRINCIPAL ||
                  currentUserRole === RoleType.COORDINATOR) && (
                  <div
                    className="delete-button"
                    onClick={() => handleDeleteClick(sponsor)}
                  >
                    <IonIcon icon={trashOutline} className="trash-icon" />
                  </div>
                )}
              </div>
              <hr className="horizontal-line" />
            </div>
          ))
        ) : (
          <div className="no-users-found">{t("No Sponsors Found")}</div>
        ))}

      <CommonDialogBox
        showConfirmFlag={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        message="Are you sure you want to delete this user?"
        leftButtonText="Delete"
        leftButtonHandler={confirmDelete}
        rightButtonText="Cancel"
        rightButtonHandler={() => setShowConfirm(false)}
      />
      <CommonDialogBox
        showConfirmFlag={showSelfDeleteError}
        onDidDismiss={() => setShowSelfDeleteError(false)}
        message="You cannot delete yourself."
        rightButtonText="OK"
        rightButtonHandler={() => setShowSelfDeleteError(false)}
      />
    </div>
  );
};

export default SchoolUserList;
