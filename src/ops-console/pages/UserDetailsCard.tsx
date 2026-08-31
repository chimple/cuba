import React from 'react';
import { IonAlert } from '@ionic/react';
import EditIcon from '@mui/icons-material/Edit';
import { t } from 'i18next';
import { RoleLabels, RoleType } from '../../interface/modelInterfaces';

type UserDetailsCardProps = {
  confirmDelete: () => void;
  editRoleOptions: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleProfileImageChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  isEdit: boolean;
  isEditDisabled: boolean;
  isSaveDisabled: boolean;
  onCancelEdit: () => void;
  onSave: () => void;
  previewUrl: string | null;
  roleDisabled: boolean;
  selectRef: React.RefObject<HTMLSelectElement | null>;
  setIsEdit: (isEdit: boolean) => void;
  setShowConfirm: (show: boolean) => void;
  setUser: (user: any) => void;
  setUserRole: (role: string) => void;
  showConfirm: boolean;
  user: any;
  userRole: string;
};

export const UserDetailsCard = ({
  confirmDelete,
  editRoleOptions,
  fileInputRef,
  handleProfileImageChange,
  isEdit,
  isEditDisabled,
  isSaveDisabled,
  onCancelEdit,
  onSave,
  previewUrl,
  roleDisabled,
  selectRef,
  setIsEdit,
  setShowConfirm,
  setUser,
  setUserRole,
  showConfirm,
  user,
  userRole,
}: UserDetailsCardProps) => (
  <div className="user-details-card">
    <div
      className="user-details-image-container"
      onClick={() => isEdit && fileInputRef.current?.click()}
      style={{ cursor: isEdit ? 'pointer' : 'default' }}
    >
      <img
        className="user-details-profile-img"
        src={
          previewUrl ||
          (user?.image && user.image.trim() !== ''
            ? user.image
            : '/assets/profile.svg')
        }
        alt="Profile"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = '/assets/profile.svg';
        }}
      />
      {isEdit && <EditIcon className="user-details-pencil-icon" />}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleProfileImageChange}
      />
    </div>

    <div className="user-details-form-section">
      <label>{t('Name')}</label>
      <input
        type="text"
        value={user?.name ?? ''}
        readOnly={!isEdit}
        onChange={(event) => {
          if (isEdit) setUser({ ...user, name: event.target.value });
        }}
      />
      <label>{t('Phone Number')}</label>
      <input
        type="text"
        value={user?.phone ?? ''}
        readOnly
        onChange={(event) => {
          if (isEdit) setUser({ ...user, phone: event.target.value });
        }}
      />
      <label>{t('Email')}</label>
      <input
        type="email"
        value={user?.email ?? ''}
        readOnly
        onChange={(event) => {
          if (isEdit) setUser({ ...user, email: event.target.value });
        }}
      />
      <label>{t('Assigned Role')}</label>
      <select
        ref={selectRef}
        value={userRole}
        disabled={!isEdit || roleDisabled}
        onChange={(event) => setUserRole(event.target.value)}
      >
        {isEdit
          ? editRoleOptions.map((role: string) => (
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
          <button className="user-details-cancel-btn" onClick={onCancelEdit}>
            {t('Cancel')}
          </button>
          <button
            className="user-details-save-btn"
            onClick={onSave}
            disabled={isSaveDisabled}
          >
            {t('Save')}
          </button>
        </>
      ) : (
        <>
          <button
            className="user-details-delete-btn"
            disabled={isEditDisabled || roleDisabled}
            onClick={() => setShowConfirm(true)}
          >
            {t('Delete')}
          </button>
          <button
            className="user-details-edit-btn"
            disabled={isEditDisabled}
            onClick={() => setIsEdit(true)}
          >
            {t('Edit')}
          </button>
          <IonAlert
            isOpen={showConfirm}
            onDidDismiss={() => setShowConfirm(false)}
            cssClass="user-details-custom-alert"
            header={t('Delete User') ?? ''}
            message={t('Are you sure you want to delete this user?') || ''}
            buttons={[
              {
                text: t('Cancel') || '',
                cssClass: 'user-details-alert-cancel-button',
                handler: () => setShowConfirm(false),
              },
              {
                text: t('Delete'),
                cssClass: 'user-details-alert-delete-button',
                handler: confirmDelete,
              },
            ]}
          />
        </>
      )}
    </div>
  </div>
);
