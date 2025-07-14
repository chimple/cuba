import React, { useEffect, useRef, useState } from "react";
import "./UserDetailsPage.css";
import IconButton from "@mui/material/IconButton";
import Breadcrumb from "../components/Breadcrumb";
import NotificationsIcon from "@mui/icons-material/Notifications";

import Box from "@mui/material/Box";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useHistory, useLocation } from "react-router";
import { RoleLabels, RoleType } from "../../interface/modelInterfaces";
import { IonAlert } from "@ionic/react";

const UserDetailsPage: React.FC = () => {
  const [user, setUser] = useState<any>();
  // const [userRole, setUserRole] = useState<string>("");
  const selectRef = useRef<HTMLSelectElement>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [availableEditRoles] = useState([
    RoleType.PROGRAM_MANAGER,
    RoleType.FIELD_COORDINATOR,
  ]);

  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const userData = (location.state as any)?.userData;

  useEffect(() => {
    if (userData) {
      setUser(userData.user);
      setSelectedRole(userData.userRole);
    }
  }, [userData]);

  const confirmDelete = async () => {
    if (user) {
      const api = ServiceConfig.getI().apiHandler;
      await api.deleteSpecialUser(user.id);
      await api.deleteProgramUser(user.id);
      if (userData.userRole === RoleType.FIELD_COORDINATOR) {
        await api.deleteUserFromSchoolsWithRole(
          user.id,
          RoleType.FIELD_COORDINATOR
        );
      }
      setShowConfirm(false);
      history.goBack();
    }
  };

  return (
    <div className="program-user-details-page">
      <div className="program-user-page-header">
        <Box className="program-user-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="program-user-title-mobile">
                {t("Users")}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="program-user-title">
                {t("Users")}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>
      </div>
      <div className="program-user-detail-page-Breadcrumb">
        <Breadcrumb
          crumbs={[
            { label: t("Users"), onClick: () => history.goBack() },
            {
              label: user?.name || "user name",
            },
          ]}
        />
      </div>

      <div className="program-user-card">
        <div className="program-user-image-container">
          <img
            className="program-user-profile-img"
            src={
              user?.image && user.image.trim() !== ""
                ? user.image
                : require("../assets/icons/profile.svg").default
            }
            alt="Profile"
          />
        </div>

        <div className="program-user-form-section">
          <label>{t("Name")}</label>
          <input
            type="text"
            value={user?.name ?? ""}
            readOnly={!isEdit}
            onChange={(e) => {
              if (isEdit) setUser({ ...user, name: e.target.value });
            }}
          />

          <label>{t("Phone Number")}</label>
          <input
            type="text"
            value={user?.phone ?? ""}
            readOnly
            onChange={(e) => {
              if (isEdit) setUser({ ...user, phone: e.target.value });
            }}
          />

          <label>{t("Email")}</label>
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            onChange={(e) => {
              if (isEdit) setUser({ ...user, email: e.target.value });
            }}
          />

          <label>{t("Assigned Role")}</label>
          <select
            ref={selectRef}
            value={selectedRole}
            disabled={!isEdit}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {isEdit &&
            RoleType.SUPER_ADMIN !== selectedRole &&
            RoleType.OPERATIONAL_DIRECTOR !== selectedRole
              ? availableEditRoles.map((role: string) => (
                  <option key={role} value={role}>
                    {RoleLabels[role as RoleType]}
                  </option>
                ))
              : [
                  <option key={selectedRole} value={selectedRole}>
                    {RoleLabels[selectedRole as RoleType]}
                  </option>,
                ]}
          </select>
        </div>

        <div className="program-user-button-row">
          {isEdit ? (
            <>
              <button className="program-user-cancel-btn" onClick={() => setIsEdit(false)}>
                {t("Cancel")}
              </button>
              <button
                className="program-user-save-btn"
                onClick={async () => {
                  const api = ServiceConfig.getI().apiHandler;

                  const latestSelectedRole =
                    selectRef.current?.value || selectedRole;

                  await api.updateUserProfile(
                    user,
                    user.name,
                    user.email,
                    user.phone,
                    user.languageDocId,
                    user.profilePic
                  );
                  await api.updateSpecialUserRole(user.id, latestSelectedRole);
                  await api.updateProgramUserRole(user.id, latestSelectedRole);

                  setSelectedRole(latestSelectedRole); // keep state in sync
                  setIsEdit(false);
                }}
              >
                {t("Save")}
              </button>
            </>
          ) : (
            <>
              <button
                className="program-user-delete-btn"
                onClick={() => setShowConfirm(true)}
              >
                {t("Delete")}
              </button>
              <button className="program-user-edit-btn" onClick={() => setIsEdit(true)}>
                {t("Edit")}
              </button>

              <IonAlert
                isOpen={showConfirm}
                onDidDismiss={() => setShowConfirm(false)}
                cssClass="custom-alert"
                message={t("Are you sure you want to delete this user?") || ""}
                buttons={[
                  {
                    text: t("Delete"),
                    cssClass: "alert-delete-button",
                    handler: confirmDelete,
                  },
                  {
                    text: t("Cancel") || "",
                    cssClass: "alert-cancel-button",
                    handler: () => setShowConfirm(false),
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
