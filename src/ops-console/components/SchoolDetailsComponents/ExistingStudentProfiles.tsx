import { useId } from 'react';
import { t } from 'i18next';
import { useExistingStudentProfiles } from './useExistingStudentProfiles';
import type { ProfileSearchApi } from './useExistingStudentProfiles';
import './ExistingStudentProfiles.css';

type ExistingStudentProfilesProps = {
  api: ProfileSearchApi;
  classId: string;
  contact: string;
  disabled: boolean;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
  open: boolean;
};

const ExistingStudentProfiles = ({
  api,
  classId,
  contact,
  disabled,
  selectedStudentId,
  onSelectStudent,
  open,
}: ExistingStudentProfilesProps) => {
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { profiles, profileCount, isSearching, searchError, searchContact } =
    useExistingStudentProfiles({ api, classId, contact, open });

  if (!open || !classId || !contact.trim() || !searchContact) return null;

  return (
    <section
      id={`ops-student-profile-lookup-${idPrefix}`}
      className="ops-student-profile-lookup"
      aria-live="polite"
    >
      {isSearching && (
        <p role="status">{t('Searching existing profiles...')}</p>
      )}
      {searchError && (
        <p
          id={`ops-student-profile-lookup__error-${idPrefix}`}
          className="ops-student-profile-lookup__error"
          role="alert"
        >
          {t('Unable to search for existing student profiles.')}
        </p>
      )}
      {!isSearching && !searchError && profiles.length === 0 && (
        <p>
          {profileCount >= 3
            ? t('This number already has 3 profiles.')
            : t('No matching student profiles found. Create a new profile.')}
        </p>
      )}
      {profiles.length > 0 && (
        <ul
          id={`ops-student-profile-lookup__list-${idPrefix}`}
          className="ops-student-profile-lookup__list"
        >
          {profiles.map((profile) => (
            <li
              id={`ops-student-profile-lookup__item-${idPrefix}-${profile.id}`}
              className="ops-student-profile-lookup__item"
              key={profile.id}
            >
              {profile.isInSelectedClass ? (
                <div
                  id={`ops-student-profile-lookup__selection-${idPrefix}-${profile.id}`}
                  className="ops-student-profile-lookup__selection"
                >
                  <span
                    id={`ops-student-profile-lookup__name-${idPrefix}-${profile.id}`}
                    className="ops-student-profile-lookup__name"
                  >
                    {profile.name || t('Unnamed student')}
                    {profile.studentCode ? ` (${profile.studentCode})` : ''}
                  </span>
                </div>
              ) : (
                <label
                  id={`ops-student-profile-lookup__selection-${idPrefix}-${profile.id}`}
                  className="ops-student-profile-lookup__selection"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentId === profile.id}
                    disabled={disabled}
                    onChange={(event) =>
                      onSelectStudent(event.target.checked ? profile.id : null)
                    }
                  />
                  <span
                    id={`ops-student-profile-lookup__name-${idPrefix}-${profile.id}`}
                    className="ops-student-profile-lookup__name"
                  >
                    {profile.name || t('Unnamed student')}
                    {profile.studentCode ? ` (${profile.studentCode})` : ''}
                  </span>
                </label>
              )}
              {profile.isInSelectedClass && (
                <span
                  id={`ops-student-profile-lookup__already-linked-${idPrefix}-${profile.id}`}
                  className="ops-student-profile-lookup__already-linked"
                >
                  {t('Already in this class')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ExistingStudentProfiles;
