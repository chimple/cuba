import React from 'react';
import { LaunchRounded } from '@mui/icons-material';
import EmailRounded from '@mui/icons-material/EmailRounded';
import {
  ContactTarget,
  EnumType,
  PERFORMANCE_UI,
  TableTypes,
} from '../../../common/constants';
import { t } from 'i18next';
import {
  callOutcomeOptions,
  engagementTargetOptions,
} from './fcInteractOptions';

type ContactEntry = {
  type: 'phone' | 'email';
  value: string;
};

type FcInteractContactCardProps = {
  callOutcome: EnumType<'fc_call_result'> | '';
  className: string;
  contactEntries: ContactEntry[];
  getContactDisplayValue: (type: 'phone' | 'email', value: string) => string;
  handleContactClick: (type: 'phone' | 'email', value: string) => void;
  initialUserType: EnumType<'fc_engagement_target'>;
  mode: EnumType<'fc_contact_method'>;
  setCallOutcome: React.Dispatch<
    React.SetStateAction<EnumType<'fc_call_result'> | ''>
  >;
  setMode: React.Dispatch<React.SetStateAction<EnumType<'fc_contact_method'>>>;
  setSpokeWith: React.Dispatch<
    React.SetStateAction<EnumType<'fc_engagement_target'>>
  >;
  spokeWith: EnumType<'fc_engagement_target'>;
  status?: EnumType<'fc_support_level'>;
  userData: TableTypes<'user'> | null;
};

export default function FcInteractContactCard({
  callOutcome,
  className,
  contactEntries,
  getContactDisplayValue,
  handleContactClick,
  initialUserType,
  mode,
  setCallOutcome,
  setMode,
  setSpokeWith,
  spokeWith,
  status,
  userData,
}: FcInteractContactCardProps) {
  return (
    <div className="fc-interact-popup-left-card" id="fc-left-card">
      <div className="fc-interact-popup-left-card-inner" id="fc-left-inner">
        <div className="fc-interact-popup-left-top" id="fc-left-top">
          <div id="fc-user-info-wrapper">
            <div className="fc-interact-popup-name" id="fc-user-name">
              {userData?.name}
            </div>
            {className && (
              <div className="fc-interact-popup-class" id="fc-user-class">
                {t('Class')} {className}
              </div>
            )}
          </div>

          {status && PERFORMANCE_UI[status] && (
            <div
              className="fc-interact-popup-status-badge"
              id="fc-status-badge"
              style={{
                background: PERFORMANCE_UI[status].bgColor,
                color: PERFORMANCE_UI[status].textColor,
              }}
            >
              {t(PERFORMANCE_UI[status].label)}
            </div>
          )}
        </div>

        <div className="fc-interact-popup-contact" id="fc-contact-section">
          {contactEntries.length > 0
            ? contactEntries.map((contact, index) => (
                <div
                  key={`${contact.type}-${contact.value}-${index}`}
                  className="fc-interact-popup-contact-line"
                  id={`fc-contact-line-${index}`}
                  onClick={() => handleContactClick(contact.type, contact.value)}
                >
                  <span
                    className="fc-interact-popup-contact-text"
                    id={`fc-contact-text-${index}`}
                  >
                    {getContactDisplayValue(contact.type, contact.value)}
                  </span>
                  {contact.type === 'phone' ? (
                    <LaunchRounded style={{ fontSize: 16 }} />
                  ) : (
                    <EmailRounded style={{ fontSize: 16 }} />
                  )}
                </div>
              ))
            : null}
        </div>

        <div className="fc-interact-popup-divider" id="fc-divider" />

        <div className="fc-interact-popup-section" id="fc-mode-section">
          <div className="fc-interact-popup-label" id="fc-mode-label">
            {t('Mode of Interaction')}
          </div>
          <div
            className="fc-interact-popup-radio-group"
            id="fc-mode-radio-group"
          >
            <label
              className="fc-interact-popup-radio-item"
              id="fc-mode-inperson-label"
            >
              <input
                type="radio"
                name="mode"
                id="fc-mode-inperson"
                checked={mode === 'in_person'}
                onChange={() => {
                  setMode('in_person');
                  setCallOutcome('');
                }}
              />
              In Person
            </label>

            <label
              className="fc-interact-popup-radio-item"
              id="fc-mode-call-label"
            >
              <input
                type="radio"
                name="mode"
                id="fc-mode-call"
                checked={mode === 'call'}
                onChange={() => setMode('call')}
              />
              {t('Phone Call')}
            </label>
          </div>
        </div>

        {mode === 'call' && (
          <div
            className="fc-interact-popup-section"
            id="fc-call-outcome-section"
          >
            <div
              className="fc-interact-popup-label"
              id="fc-call-outcome-label"
            >
              {t('Select call outcome')}
            </div>
            <select
              className="fc-interact-popup-select"
              id="fc-call-outcome-select"
              value={callOutcome}
              onChange={(e) =>
                setCallOutcome(e.target.value as EnumType<'fc_call_result'>)
              }
            >
              <option value="" id="fc-call-outcome-empty">
                {t('Select call outcome')}
              </option>

              {callOutcomeOptions.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  id={`fc-call-outcome-${o.value}`}
                >
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {initialUserType === ContactTarget.STUDENT && (
          <div
            className="fc-interact-popup-section speak-with-section"
            id="fc-spoke-section"
          >
            <div className="fc-interact-popup-label" id="fc-spoke-label">
              {t('Who did you speak with?')}
            </div>

            <div
              className="fc-interact-popup-radio-group"
              id="fc-spoke-radio-group"
            >
              {engagementTargetOptions.map((option) => (
                <label
                  key={option.value}
                  className="fc-interact-popup-radio-item"
                  id={`fc-spoke-${option.value}`}
                >
                  <input
                    type="radio"
                    name="spokeWith"
                    id={`fc-spoke-radio-${option.value}`}
                    checked={spokeWith === option.value}
                    onChange={() => setSpokeWith(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
