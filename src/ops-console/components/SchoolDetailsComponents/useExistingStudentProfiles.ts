import { useEffect, useState } from 'react';
import type {
  OpsStudentProfileMatch,
  OpsStudentProfileSearchResult,
} from '../../../services/api/serviceapi/ServiceApi.fieldActivities';
import { parseStudentProfileContact } from '../../utils/studentProfileContact';

export type ProfileSearchApi = {
  searchStudentProfilesByContact(
    contact: string,
    classId: string,
  ): Promise<OpsStudentProfileSearchResult>;
};

type UseExistingStudentProfilesParams = {
  api: ProfileSearchApi;
  classId: string;
  contact: string;
  open: boolean;
};

export type ExistingStudentProfilesState = {
  profiles: OpsStudentProfileMatch[];
  profileCount: number;
  isSearching: boolean;
  searchError: boolean;
  searchContact: string;
};

export const useExistingStudentProfiles = ({
  api,
  classId,
  contact,
  open,
}: UseExistingStudentProfilesParams): ExistingStudentProfilesState => {
  const [profiles, setProfiles] = useState<OpsStudentProfileMatch[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchContact = parseStudentProfileContact(contact)?.value ?? '';

  useEffect(() => {
    if (!open || !classId || !searchContact) {
      setProfiles([]);
      setProfileCount(0);
      setIsSearching(false);
      setSearchError(false);
      return;
    }

    let cancelled = false;
    setProfiles([]);
    setProfileCount(0);
    setIsSearching(true);
    setSearchError(false);
    const timeout = window.setTimeout(() => {
      void api
        .searchStudentProfilesByContact(searchContact, classId)
        .then((result) => {
          if (!cancelled) {
            setProfiles(result.profiles);
            setProfileCount(result.profileCount);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setProfiles([]);
            setProfileCount(0);
            setSearchError(true);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [api, classId, open, searchContact]);

  return { profiles, profileCount, isSearching, searchError, searchContact };
};
