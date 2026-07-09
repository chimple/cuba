import React, { useState, useEffect } from 'react';
import { CLASSES, IconType, PAGES, TableTypes } from '../../common/constants';
import { useHistory } from 'react-router-dom';
import { ServiceConfig } from '../../services/ServiceConfig';
import Header from '../components/homePage/Header';
import AddButton from '../../common/AddButton';
import { t } from 'i18next';
import DetailList from '../components/schoolComponent/DetailList';
import { RoleType } from '../../interface/modelInterfaces';
import './ManageClass.css';
import { Util } from '../../utility/util';
import DetailListHeader from '../components/schoolComponent/DetailListHeader';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { parsePath } from 'history';

const CLASS_CREATION_ROLES = [
  RoleType.SUPER_ADMIN,
  RoleType.OPERATIONAL_DIRECTOR,
  RoleType.PROGRAM_MANAGER,
  RoleType.FIELD_COORDINATOR,
  RoleType.PRINCIPAL,
  RoleType.COORDINATOR,
];

const ManageClass: React.FC = () => {
  const [currentSchool, setCurrentSchool] = useState<
    TableTypes<'school'> | undefined
  >();

  const [allClasses, setAllClasses] = useState<TableTypes<'class'>[]>([]);
  const [currentSchoolRole, setCurrentSchoolRole] = useState<RoleType>();

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const tempClass = Util.getCurrentClass();

  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);

  const init = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;
      const tempSchool = Util.getCurrentSchool();
      if (tempSchool) {
        setCurrentSchool(tempSchool);
        const schoolRole = await api.getUserRoleForSchool(
          user.id,
          tempSchool.id,
        );
        setCurrentSchoolRole(schoolRole);
        const fetchedClasses = await api.getClassesForSchool(
          tempSchool.id,
          user.id,
        );
        if (fetchedClasses) {
          setAllClasses(fetchedClasses);
          localStorage.setItem(CLASSES, JSON.stringify(fetchedClasses));
        }
      }
    } catch (error) {
      logger.error('Error initializing data:', error);
    }
  };

  const canCreate =
    !!currentSchoolRole && CLASS_CREATION_ROLES.includes(currentSchoolRole);

  const onBackButtonClick = () => {
    history.replace({
      ...parsePath(PAGES.HOME_PAGE),
      state: {
        tabValue: 0,
      },
    });
  };
  useEffect(() => {
    if (!tempClass) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
    // wrapper so we can `await`
    (async () => {
      await init();
      // Right after the fetch, overwrite the one you just edited
      const updated = Util.getCurrentClass();
      if (updated) {
        setAllClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      }
    })();
  }, []);

  return (
    <div className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          showSchool={true}
          schoolName={currentSchool?.name}
        />
      </div>
      <div className="school-div">{t('Classes')}</div>
      {!(allClasses.length === 0) && <DetailListHeader />}

      <div className="school-list">
        <DetailList
          data={allClasses}
          type={IconType.CLASS}
          school={currentSchool}
        />
      </div>
      {canCreate && !isExternalUser && (
        <AddButton
          onClick={() => {
            history.replace({
              ...parsePath(PAGES.ADD_CLASS),
              state: {
                origin: PAGES.MANAGE_CLASS,
              },
            });
          }}
        />
      )}
    </div>
  );
};

export default ManageClass;
