import React from 'react';
import { LaunchRounded } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import { t } from 'i18next';
import {
  MODULE_CARD_DEFINITIONS,
  getModuleCardInitials,
  getModuleCardRoute,
  getModulePointDescription,
} from './moduleRegistry';
import './ModulePage.css';

const ModulePage: React.FC = () => {
  const history = useHistory();

  return (
    <div className="module-page">
      <div className="module-page__inner">
        <div className="module-page__title-row">
          <span className="module-page__title">{t('Module')}</span>
        </div>

        <div className="module-page__description-box">
          <p className="module-page__description">
            {t(
              'Module is the launcher area for grouped ops workflows. Open a card below to move into a dedicated module page and continue the next task.',
            )}
          </p>
          <div className="module-page__points">
            {MODULE_CARD_DEFINITIONS.map((module) => (
              <p key={module.title} className="module-page__point">
                <span className="module-page__point-title">
                  {module.title}:
                </span>{' '}
                <span className="module-page__point-text">
                  {getModulePointDescription(module.title, module.description)}
                </span>
              </p>
            ))}
          </div>
        </div>

        <div className="module-page__cards">
          {MODULE_CARD_DEFINITIONS.map((button) => {
            const route = getModuleCardRoute(button.title, button.route);

            return (
              <article key={route} className="module-page__card">
                <div className="module-page__card-media">
                  <span className="module-page__card-initials">
                    {getModuleCardInitials(button.title)}
                  </span>
                </div>
                <div className="module-page__card-content">
                  <h2 className="module-page__button-title">{button.title}</h2>
                  <button
                    type="button"
                    className="module-page__cta"
                    onClick={() => history.push(route)}
                  >
                    <span className="module-page__cta-label">
                      {t('Navigate')}
                    </span>
                    <LaunchRounded
                      className="module-page__cta-icon"
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
