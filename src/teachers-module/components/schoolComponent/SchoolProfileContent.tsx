import React from 'react';
import { t } from 'i18next';
import './SchoolProfileContent.css';
import { TableTypes } from '../../../common/constants';
import { useHistory } from 'react-router-dom';
import { RoleType } from '../../../interface/modelInterfaces';
import { IonLabel } from '@ionic/react';
import ProfileDetails from '../library/ProfileDetails';

const SchoolProfileContent: React.FC<{
  school: TableTypes<'school'>;
  role: RoleType;
}> = ({ school, role }) => {
  const history = useHistory();

  return (
    <div className="profile-content">
      <div className="single-container">
        <div className="profile-image">
          <ProfileDetails imgSrc={school?.image || ''} imgAlt="Profile Pic" />
        </div>
        <div className="school-text">{school.name}</div>
      </div>
      <div className="school-profile-card">
        <div className="schoolProfile-top-div">
          <div className="school-address-div">{t('School Address')}</div>
          <div className="schoolProfile-edit-icon-container"></div>
        </div>
        <div className="profile-row">
          <IonLabel className="profile-label">{t('Name')}</IonLabel>
          <p className="profile-value">{school.name}</p>
        </div>
        <hr className="horizontal-line" />

        <div className="profile-row">
          <IonLabel className="profile-label">{t('State')}</IonLabel>
          <p className="profile-value">{school.group1}</p>
        </div>
        <hr className="horizontal-line" />

        <div className="profile-row">
          <IonLabel className="profile-label">{t('District')}</IonLabel>
          <p className="profile-value">{school.group2}</p>
        </div>
        <hr className="horizontal-line" />

        <div className="profile-row">
          <IonLabel className="profile-label">{t('City')}</IonLabel>
          <p className="profile-value">{school.group3}</p>
        </div>
      </div>
    </div>
  );
};

export default SchoolProfileContent;
