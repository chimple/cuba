import React, { useEffect, useState } from 'react';
import './SchoolDetailsTabs.css';
import '../../pages/SchoolDetailsPage.css';
import { t } from 'i18next';
import { SchoolTabs } from '../../../interface/modelInterfaces';
import SchoolOverview from './SchoolOverview';
import SchoolTeachers from './SchoolTeachers';
import SchoolStudents from './SchoolStudents';
import SchoolPrincipals from './SchoolPrincipals';
import SchoolCoordinators from './SchoolCoordinators';
import SchoolClasses from './SchoolClass';
import SchoolNotes from './SchoolNotes';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RoleType } from '../../../interface/modelInterfaces';

interface SchoolDetailsTabsComponentProps {
  data: any;
  isMobile: boolean;
  schoolId: string;
  refreshClasses?: () => void;
  goToClassesTab?: boolean;
  onTabChange?: (tab: SchoolTabs) => void;
}

const SchoolDetailsTabsComponent: React.FC<SchoolDetailsTabsComponentProps> = ({
  data,
  isMobile,
  schoolId,
  refreshClasses,
  goToClassesTab,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<SchoolTabs>(SchoolTabs.Overview);

  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  const tabEnumValues = Object.values(SchoolTabs).filter((tab) => {
    if (
      isExternalUser &&
      (tab === SchoolTabs.Notes || tab === SchoolTabs.Coordinators)
    ) {
      return false; // hide restricted tabs for external users
    }
    return true;
  });
  useEffect(() => {
    if (goToClassesTab) {
      setActiveTab(SchoolTabs.Classes);
    }
  }, [goToClassesTab]);

  useEffect(() => {
    if (onTabChange) onTabChange(activeTab);
  }, [activeTab, onTabChange]);

  return (
    <div className="school-detail-role-tabs-wrapper">
      {/* ===== FIXED TABS ===== */}
      <div className="school-detail-role-tabs-container">
        {tabEnumValues.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`school-detail-role-tab-button ${
              activeTab === tabKey ? 'selectedtab' : ''
            }`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {/* ===== SCROLL AREA ===== */}
      <div className="school-detail-tab-content">
        {activeTab === SchoolTabs.Overview && (
          <SchoolOverview data={data} isMobile={isMobile} />
        )}

        {activeTab === SchoolTabs.Classes && (
          <SchoolClasses
            data={data}
            isMobile={isMobile}
            schoolId={schoolId}
            refreshClasses={refreshClasses}
          />
        )}

        {activeTab === SchoolTabs.Students && (
          <SchoolStudents data={data} isMobile={isMobile} schoolId={schoolId} />
        )}

        {activeTab === SchoolTabs.Teachers && (
          <SchoolTeachers data={data} isMobile={isMobile} schoolId={schoolId} />
        )}

        {activeTab === SchoolTabs.Principals && (
          <SchoolPrincipals
            data={data}
            isMobile={isMobile}
            schoolId={schoolId}
          />
        )}

        {activeTab === SchoolTabs.Coordinators && !isExternalUser && (
          <SchoolCoordinators
            data={data}
            isMobile={isMobile}
            schoolId={schoolId}
          />
        )}

        {activeTab === SchoolTabs.Notes && !isExternalUser && <SchoolNotes />}
      </div>
    </div>
  );
};

export default SchoolDetailsTabsComponent;
