import React from 'react';
import { LaunchRounded } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { t } from 'i18next';
import {
  MODULE_CARD_DEFINITIONS,
  getModuleCardInitials,
  getModuleCardRoute,
} from './modulePageLogic';
import './ModulePage.css';

const ModulePage: React.FC = () => {
  const history = useHistory();

  return (
    <div id="module-page" className="module-page">
      <div id="module-page-inner" className="module-page-inner">
        <div id="module-page-title-row" className="module-page-title-row">
          <span id="module-page-title" className="module-page-title">
            {t('Module')}
          </span>
        </div>

        <div
          id="module-page-description-box"
          className="module-page-description-box"
        >
          <p id="module-page-description" className="module-page-description">
            {t(
              'Module is the launcher area for grouped ops workflows. Open a card below to move into a dedicated module page and continue the next task.',
            )}
          </p>
          <div id="module-page-points" className="module-page-points">
            {MODULE_CARD_DEFINITIONS.map((module) => (
              <p
                key={module.title}
                id="module-page-point"
                className="module-page-point"
              >
                <span
                  id="module-page-point-title"
                  className="module-page-point-title"
                >
                  {t(module.title)}:
                </span>{' '}
                <span
                  id="module-page-point-text"
                  className="module-page-point-text"
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

        <div id="module-page-cards" className="module-page-cards">
          {MODULE_CARD_DEFINITIONS.map((button) => {
            const route = getModuleCardRoute(button.title, button.route);

            return (
              <article
                key={route}
                id="module-page-card"
                className="module-page-card"
              >
                <div
                  id="module-page-card-media"
                  className="module-page-card-media"
                >
                  <span
                    id="module-page-card-initials"
                    className="module-page-card-initials"
                  >
                    {getModuleCardInitials(button.title)}
                  </span>
                </div>
                <div
                  id="module-page-card-content"
                  className="module-page-card-content"
                >
                  <h2
                    id="module-page-button-title"
                    className="module-page-button-title"
                  >
                    {t(button.title)}
                  </h2>
                  <button
                    type="button"
                    id="module-page-cta"
                    className="module-page-cta"
                    onClick={() => history.push(route)}
                  >
                    <span
                      id="module-page-cta-label"
                      className="module-page-cta-label"
                    >
                      {t('Navigate')}
                    </span>
                    <LaunchRounded
                      id="module-page-cta-icon"
                      className="module-page-cta-icon"
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

export default ModulePage;
