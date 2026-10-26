import React, { useEffect, useRef, useState } from 'react';
import './UserDetailsPage.css';
import IconButton from '@mui/material/IconButton';
import Breadcrumb from '../components/Breadcrumb';
import NotificationsIcon from '@mui/icons-material/Notifications';

import Box from '@mui/material/Box';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { t } from 'i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import { useHistory, useLocation } from 'react-router';
import { RoleType } from '../../interface/modelInterfaces';
import { PROFILETYPE } from '../../common/constants';
import logger from '../../utility/logger';
import { UserDetailsCard } from './UserDetailsCard';

const UserDetailsPage: React.FC = () => {
  const [user, setUser] = useState<any>();
  const [userRole, setUserRole] = useState<string>('');
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
    RoleType.EXTERNAL_USER,
  ]);

  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        currentUser?.id ?? '',
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
        api.deleteUserFromSchoolsWithRole(user.id, RoleType.FIELD_COORDINATOR),
      );
    }

    try {
      await Promise.all(deleteTasks);
      setShowConfirm(false);
      history.goBack();
    } catch (error) {
      logger.error('Failed to delete user completely:', error);
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
        PROFILETYPE.USER,
      );
      if (imageUrl) {
        setUser({ ...user, image: imageUrl });
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
          imageUrl ?? user.image,
        ),
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
      logger.error('Failed to update user info:', error);
    }
  };

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
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
  const editRoleOptions = availableEditRoles.includes(userRole as RoleType)
    ? availableEditRoles
    : userRole
      ? [...availableEditRoles, userRole as RoleType]
      : availableEditRoles;
  const handleCancelEdit = () => {
    setUser(userData.user);
    setUserRole(userData.userRole);
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsEdit(false);
  };

  return (
    <div className="user-details-page">
      <div className="user-details-page-header">
        <Box className="user-details-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="user-details-title-mobile">
                {t('Users')}
              </Typography>
              <IconButton className="user-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="user-details-title">
                {t('Users')}
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
            { label: t('Users'), onClick: () => history.goBack() },
            {
              label: user?.name || 'user name',
            },
          ]}
        />
      </div>

      <UserDetailsCard
        confirmDelete={confirmDelete}
        editRoleOptions={editRoleOptions}
        fileInputRef={fileInputRef}
        handleProfileImageChange={handleProfileImageChange}
        isEdit={isEdit}
        isEditDisabled={isEditDisabled}
        isSaveDisabled={isSaveDisabled}
        onCancelEdit={handleCancelEdit}
        onSave={onSave}
        previewUrl={previewUrl}
        roleDisabled={roleDisabled}
        selectRef={selectRef}
        setIsEdit={setIsEdit}
        setShowConfirm={setShowConfirm}
        setUser={setUser}
        setUserRole={setUserRole}
        showConfirm={showConfirm}
        user={user}
        userRole={userRole}
      />
    </div>
  );
};

export default UserDetailsPage;
