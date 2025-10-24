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
import { IonAlert, IonIcon } from "@ionic/react";
import { PROFILETYPE } from "../../common/constants";
import EditIcon from "@mui/icons-material/Edit";

const UserDetailsPage: React.FC = () => {
  const [user, setUser] = useState<any>();
  const [userRole, setUserRole] = useState<string>("");
  const selectRef = useRef<HTMLSelectElement>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roleDisabled, setRoleDisabled] = useState<boolean>(true);

  const [availableEditRoles] = useState([
    RoleType.PROGRAM_MANAGER,
    RoleType.FIELD_COORDINATOR,
  ]);

  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const userData = (location.state as any)?.userData;
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    if (userData) {
      setUser(userData.user);
      setUserRole(userData.userRole);
    }
    const checkRoleEditDisabled = async () => {
      const auth = ServiceConfig.getI().authHandler;
      const currentUser = await auth.getCurrentUser();
      const currentUserRoles = await api.getUserSpecialRoles(
        currentUser?.id ?? ""
      );

      const loggedInUserIsSpecial =
        currentUserRoles.includes(RoleType.SUPER_ADMIN) ||
        currentUserRoles.includes(RoleType.OPERATIONAL_DIRECTOR);

      setRoleDisabled(!loggedInUserIsSpecial);
    };
    checkRoleEditDisabled();
  }, [userData]);

  const confirmDelete = async () => {
    if (!user) return;

    const deleteTasks: Promise<any>[] = [
      api.deleteSpecialUser(user.id),
      api.deleteProgramUser(user.id),
    ];
    if (userData.userRole === RoleType.FIELD_COORDINATOR) {
      deleteTasks.push(
        api.deleteUserFromSchoolsWithRole(user.id, RoleType.FIELD_COORDINATOR)
      );
    }

    try {
      await Promise.all(deleteTasks);
      setShowConfirm(false);
      history.goBack();
    } catch (error) {
      console.error("Failed to delete user completely:", error);
    }
  };

  const onSave = async () => {
    const selectedRole = selectRef.current?.value || userRole;
    const updateTasks: Promise<any>[] = [];
    let imageUrl: string | null = null;

    if (selectedFile) {
      imageUrl = await api.addProfileImages(
        user.id,
        selectedFile,
        PROFILETYPE.USER
      );
      if (imageUrl) {
        setUser((prev) => ({ ...prev, image: imageUrl }));
      }
    }

    if (
      user.name !== userData?.user?.name ||
      (imageUrl && imageUrl !== userData.user.image)
    ) {
      updateTasks.push(
        api.updateUserProfile(
          user,
          user.name,
          user.email,
          user.phone,
          user.languageDocId,
          imageUrl ?? user.image
        )
      );
    }
    if (userData?.userRole !== selectedRole) {
      updateTasks.push(api.updateProgramUserRole(user.id, selectedRole));
      updateTasks.push(api.updateSpecialUserRole(user.id, selectedRole));
    }
    if (updateTasks.length === 0) {
      setIsEdit(false);
      return;
    }

    try {
      await Promise.all(updateTasks);
      setUserRole(selectedRole);
      userData.userRole = selectedRole;
      userData.user.image = imageUrl ?? user.image;
      setIsEdit(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to update user info:", error);
    }
  };

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isEditDisabled =
    userData?.userRole === RoleType.SUPER_ADMIN ||
    userData?.userRole === RoleType.OPERATIONAL_DIRECTOR;

  const isSaveDisabled =
    !user?.name?.trim() ||
    (user.name === userData?.user?.name &&
      userRole === userData?.userRole &&
      previewUrl == null);

  return (
    <div className="user-details-page">
      <div className="user-details-page-header">
        <Box className="user-details-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="user-details-title-mobile">
                {t("Users")}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="user-details-title">
                {t("Users")}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>
      </div>
      <div className="user-details-page-Breadcrumb">
        <Breadcrumb
          crumbs={[
            { label: t("Users"), onClick: () => history.goBack() },
            {
              label: user?.name || "user name",
            },
          ]}
        />
      </div>

      <div className="user-details-card">
        <div
          className="user-details-image-container"
          onClick={() => isEdit && fileInputRef.current?.click()}
          style={{ cursor: isEdit ? "pointer" : "default" }}
        >
          <img
            className="user-details-profile-img"
            src={
              previewUrl ||
              (user?.image && user.image.trim() !== ""
                ? user.image
                : "/assets/profile.svg")
            }
            alt="Profile"
          />
          {isEdit && <EditIcon className="user-details-pencil-icon" />}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleProfileImageChange}
          />
        </div>

        <div className="user-details-form-section">
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
            value={userRole}
            disabled={!isEdit || roleDisabled}
            onChange={(e) => setUserRole(e.target.value)}
          >
            {isEdit
              ? availableEditRoles.map((role: string) => (
                  <option key={role} value={role}>
                    {RoleLabels[role as RoleType]}
                  </option>
                ))
              : [
                  <option key={userRole} value={userRole}>
                    {RoleLabels[userRole as RoleType]}
                  </option>,
                ]}
          </select>
        </div>

        <div className="user-details-button-row">
          {isEdit ? (
            <>
              <button
                className="user-details-cancel-btn"
                onClick={() => {
                setUser(userData.user);
                setUserRole(userData.userRole);
                setPreviewUrl(null);
                setSelectedFile(null);
                setIsEdit(false);
              }}
                // onClick={() => setIsEdit(false)}
              >
                {t("Cancel")}
              </button>
              <button
                className="user-details-save-btn"
                onClick={onSave}
                disabled={isSaveDisabled}
              >
                {t("Save")}
              </button>
            </>
          ) : (
            <>
              <button
                className="user-details-delete-btn"
                disabled={isEditDisabled || roleDisabled}
                onClick={() => setShowConfirm(true)}
              >
                {t("Delete")}
              </button>
              <button
                className="user-details-edit-btn"
                disabled={isEditDisabled}
                onClick={() => setIsEdit(true)}
              >
                {t("Edit")}
              </button>
              <IonAlert
                isOpen={showConfirm}
                onDidDismiss={() => setShowConfirm(false)}
                cssClass="user-details-custom-alert"
                header={t("Delete User") ?? ""}
                message={t("Are you sure you want to delete this user?") || ""}
                buttons={[
                  {
                    text: t("Cancel") || "",
                    cssClass: "user-details-alert-cancel-button",
                    handler: () => setShowConfirm(false),
                  },
                  {
                    text: t("Delete"),
                    cssClass: "user-details-alert-delete-button",
                    handler: confirmDelete,
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
