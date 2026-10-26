import { t } from 'i18next';
import {
  sanitizeCommunityVisitParentsInput,
  validateCommunityVisitParentsCount,
} from './communityVisitParentsField';
import type { SchoolVisitType } from '../../../common/constants';

type SchoolCheckInCommunityParentsFieldProps = {
  communityVisitParentsError: string | null;
  communityVisitParentsValue: string;
  setCommunityVisitParentsError: (value: string | null) => void;
  setCommunityVisitParentsValue: (value: string) => void;
  visitType?: SchoolVisitType;
};

export default function SchoolCheckInCommunityParentsField({
  communityVisitParentsError,
  communityVisitParentsValue,
  setCommunityVisitParentsError,
  setCommunityVisitParentsValue,
  visitType,
}: SchoolCheckInCommunityParentsFieldProps) {
  return (
    <div
      id="community-visit-parents-section"
      className="schoolcheckinmodal-community-visit-parents-section"
    >
      <label
        id="community-visit-parents-label"
        className="schoolcheckinmodal-community-visit-parents-label"
        htmlFor="community-visit-parents-input"
      >
        {t('How many parents did you interact with?')}
      </label>
      <p
        id="community-visit-parents-helper-text"
        className="schoolcheckinmodal-community-visit-parents-helper-text"
      >
        {t(
          'Enter the number of parents you interacted with during this visit.',
        )}
      </p>
      <input
        id="community-visit-parents-input"
        className={`schoolcheckinmodal-community-visit-parents-input${
          communityVisitParentsError
            ? ' schoolcheckinmodal-community-visit-parents-input-error'
            : ''
        }`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={communityVisitParentsValue}
        onChange={(event) => {
          const nextValue = sanitizeCommunityVisitParentsInput(
            event.target.value,
          );
          setCommunityVisitParentsValue(nextValue);
          setCommunityVisitParentsError(
            validateCommunityVisitParentsCount(visitType, nextValue),
          );
        }}
        aria-describedby="community-visit-parents-helper-text community-visit-parents-error"
        aria-invalid={Boolean(communityVisitParentsError)}
      />
      {communityVisitParentsError && (
        <div
          id="community-visit-parents-error"
          className="schoolcheckinmodal-community-visit-parents-error"
        >
          {t(communityVisitParentsError)}
        </div>
      )}
    </div>
  );
}
