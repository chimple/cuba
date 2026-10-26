import { t } from 'i18next';

type SchoolCheckInConfirmationProps = {
  isConfirmedInSchool: boolean | null;
  setIsConfirmedInSchool: (value: boolean) => void;
};

export default function SchoolCheckInConfirmation({
  isConfirmedInSchool,
  setIsConfirmedInSchool,
}: SchoolCheckInConfirmationProps) {
  return (
    <div
      id="check-in-confirmation-section"
      className="check-in-confirmation-section"
    >
      <div id="check-in-confirmation-question" className="confirmation-question">
        {t("Are you sure you're in the school?")}
      </div>
      <div id="check-in-radio-container" className="radio-options-container">
        <label
          id="check-in-radio-label-yes"
          className="radio-option"
          htmlFor="check-in-radio-yes"
        >
          <input
            id="check-in-radio-yes"
            type="radio"
            name="school-confirm"
            checked={isConfirmedInSchool === true}
            onChange={() => setIsConfirmedInSchool(true)}
          />
          <span>{t('Yes')}</span>
        </label>
        <label
          id="check-in-radio-label-no"
          className="radio-option"
          htmlFor="check-in-radio-no"
        >
          <input
            id="check-in-radio-no"
            type="radio"
            name="school-confirm"
            checked={isConfirmedInSchool === false}
            onChange={() => setIsConfirmedInSchool(false)}
          />
          <span>{t('No')}</span>
        </label>
      </div>
    </div>
  );
}
