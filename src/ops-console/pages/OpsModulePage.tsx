import { LaunchRounded } from '@mui/icons-material';
import { t } from 'i18next';
import React from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { RootState } from '../../redux/store';
import './ModulePage.css';
import {
  MODULE_CARD_DEFINITIONS,
  getModuleCardInitials,
  getModuleCardRoute,
} from './OpsModulePageLogic';

const OpsModulePage: React.FC = () => {
  const history = useHistory();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const hasModuleAccess = userRoles.some(
    (role) =>
      role === RoleType.SUPER_ADMIN || role === RoleType.OPERATIONAL_DIRECTOR,
  );

  if (!hasModuleAccess) {
    return <Redirect to={`${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`} />;
  }

  return (
    <div id="ops-module-page" className="ops-module-page">
      <div id="ops-module-page-inner" className="ops-module-page-inner">
        <div
          id="ops-module-page-title-row"
          className="ops-module-page-title-row"
        >
          <span id="ops-module-page-title" className="ops-module-page-title">
            {t('Ops Module')}
          </span>
        </div>

        <div
          id="ops-module-page-description-box"
          className="ops-module-page-description-box"
        >
          <p
            id="ops-module-page-description"
            className="ops-module-page-description"
          >
            {t(
              'Module is the launcher area for grouped ops workflows. Open a card below to move into a dedicated module page and continue the next task.',
            )}
          </p>
          <div id="ops-module-page-points" className="ops-module-page-points">
            {MODULE_CARD_DEFINITIONS.map((module) => (
              <p
                key={module.title}
                id="ops-module-page-point"
                className="ops-module-page-point"
              >
                <span
                  id="ops-module-page-point-title"
                  className="ops-module-page-point-title"
                >
                  {t(module.title)}:
                </span>{' '}
                <span
                  id="ops-module-page-point-text"
                  className="ops-module-page-point-text"
                >
                  {module.description
                    ? t(module.description)
                    : t(
                        'Open the {{title}} module and continue the related workflow.',
                        { title: t(module.title) },
                      )}
                </span>
              </p>
            ))}
          </div>
        </div>

        <div id="ops-module-page-cards" className="ops-module-page-cards">
          {MODULE_CARD_DEFINITIONS.map((button) => {
            const route = getModuleCardRoute(button.title, button.route);

            return (
              <article
                key={route}
                id="ops-module-page-card"
                className="ops-module-page-card"
              >
                <div
                  id="ops-module-page-card-media"
                  className="ops-module-page-card-media"
                >
                  <span
                    id="ops-module-page-card-initials"
                    className="ops-module-page-card-initials"
                  >
                    {getModuleCardInitials(button.title)}
                  </span>
                </div>
                <div
                  id="ops-module-page-card-content"
                  className="ops-module-page-card-content"
                >
                  <h2
                    id="ops-module-page-button-title"
                    className="ops-module-page-button-title"
                  >
                    {t(button.title)}
                  </h2>
                  <button
                    type="button"
                    id="ops-module-page-cta"
                    className="ops-module-page-cta"
                    onClick={() => history.push(route)}
                  >
                    <span
                      id="ops-module-page-cta-label"
                      className="ops-module-page-cta-label"
                    >
                      {t('Navigate')}
                    </span>
                    <LaunchRounded
                      id="ops-module-page-cta-icon"
                      className="ops-module-page-cta-icon"
                      fontSize="inherit"
                    />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OpsModulePage;
