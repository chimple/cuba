import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import './SchoolOverview.css';
import { Box } from '@mui/material';
import './SchoolInfoCard.css';
import { t } from 'i18next';
import InfoCard from '../InfoCard';
import { PAGES, PROGRAM_TAB_LABELS } from '../../../common/constants';
import { useHistory } from 'react-router';
import { RoleType } from '../../../interface/modelInterfaces';
import SubjectCurriculumCard from '../SubjectCurriculumCard';
import SchoolLocationCard from './SchoolLocationCard';
import SchoolFieldCoordinators from './SchoolFieldCoordinatorsCard';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { parsePath } from 'history';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import {
  InteractionMetricsSection,
  SchoolOverviewKeyContacts,
  SchoolOverviewProgramDetails,
} from './SchoolOverviewSections';

interface SchoolOverviewProps {
  data: any;
  isMobile: boolean;
}

const SchoolOverview: React.FC<SchoolOverviewProps> = ({ data, isMobile }) => {
  const api = ServiceConfig.getI().apiHandler;
  const languageId = data.schoolData?.language;
  const [language, setLanguage] = useState<{ id: string; name: string } | null>(
    null,
  );
  useEffect(() => {
    if (!languageId) return;
    let active = true;
    const load = async () => {
      try {
        const result = await api.getLanguageWithId(languageId);
        if (active) setLanguage({ id: languageId, name: result?.name || '—' });
      } catch (error) {
        logger.error('Unable to load school language', error);
        if (active) setLanguage({ id: languageId, name: '—' });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [api, languageId]);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const programTabLabels = PROGRAM_TAB_LABELS as Record<string, string>;
  // school details
  const formatingSchoolModel = (raw: any) => {
    if (!raw) return '';
    let arr: string[] = [];
    try {
      arr = Array.isArray(raw) ? raw : JSON.parse(raw);
    } catch {
      arr = [String(raw)];
    }
    return arr
      .map(
        (v: string) =>
          programTabLabels[v.toLowerCase().replace(/ /g, '_')] ||
          v
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase()),
      )
      .join(', ');
  };
  const schoolModelValue = formatingSchoolModel(data.schoolData?.model || '');

  const schoolDetailsItems = [
    { label: 'School Name', value: data.schoolData?.name },
    { label: 'School ID (UDISE)', value: data.schoolData?.udise },
    { label: 'School Model', value: schoolModelValue },
    {
      label: 'Language',
      value: languageId && language?.id === languageId ? language?.name : '—',
    },
    { label: 'State', value: data.schoolData?.group1 },
    { label: 'District', value: data.schoolData?.group2 },
    { label: 'Block', value: data.schoolData?.group3 },
    { label: 'Cluster', value: data.schoolData?.group4 },
  ].filter((item) => item.value !== undefined && item.value !== null);

  // program details
  const programDetailsItems = [
    { label: 'Program Name', value: data.programData?.name },
    {
      label: 'Program Type',
      value: data.programData?.program_type
        ? data.programData.program_type.trim().charAt(0).toUpperCase() +
          data.programData.program_type.trim().slice(1).toLowerCase()
        : '',
    },
    {
      label: 'Model',
      value: (() => {
        const raw = data.programData?.model;
        if (!raw) return '';
        let arr: string[] = [];
        try {
          arr = Array.isArray(raw) ? raw : JSON.parse(raw);
        } catch {
          return '';
        }
        return arr
          .map(
            (v: string) =>
              programTabLabels[v.toLowerCase().replace(/ /g, '_')] ||
              v
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
          )
          .join(', ');
      })(),
    },
  ].filter((item) => item.value !== undefined && item.value !== null);
  const interactionItems = [
    { label: 'Number of Visits', value: data.interactionStats?.visits ?? 0 },
    {
      label: 'Number of Calls Made',
      value: data.interactionStats?.calls_made ?? 0,
    },
    {
      label: 'Tech Issues Reported',
      value: data.interactionStats?.tech_issues ?? 0,
    },
    {
      label: 'Parents Interacted',
      value: data.interactionStats?.parents_interacted ?? 0,
    },
    {
      label: 'Students Interacted',
      value: data.interactionStats?.students_interacted ?? 0,
    },
    {
      label: 'Teachers Interacted',
      value: data.interactionStats?.teachers_interacted ?? 0,
    },
  ];

  const history = useHistory();
  let keyContacts: Array<any> = [];
  const rawKeyContacts = data?.schoolData?.key_contacts;
  if (rawKeyContacts) {
    try {
      keyContacts =
        typeof rawKeyContacts === 'string'
          ? JSON.parse(rawKeyContacts)
          : rawKeyContacts;
      if (!Array.isArray(keyContacts)) keyContacts = [];
    } catch (e) {
      keyContacts = [];
    }
  }

  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType),
  );

  return (
    <div className="school">
      {isMobile ? (
        <Box className="column-container">
          <InteractionMetricsSection
            data={data}
            history={history}
            interactionItems={interactionItems}
            isExternalUser={isExternalUser}
            isMobile={isMobile}
          />
          <SchoolOverviewKeyContacts data={data} keyContacts={keyContacts} />
          <SchoolFieldCoordinators
            schoolId={data.schoolData?.id}
            programId={data.schoolData?.program_id}
            canEdit={!isExternalUser && haveAccess}
          />
          <InfoCard
            title={t('School Details')}
            id="school-overview-details"
            className="school-overview-details"
            items={schoolDetailsItems}
            showEditIcon={isExternalUser ? false : haveAccess}
            onEditClick={() =>
              history.replace({
                ...parsePath(
                  `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
                ),
                state: data,
              })
            }
          />
          <SubjectCurriculumCard schoolId={data.schoolData?.id} />
          <SchoolLocationCard
            id="school-overview-location"
            className="school-overview-location"
            schoolName={data.schoolData?.name || ''}
            locationLink={data.schoolData?.location_link}
          />
          <SchoolOverviewProgramDetails
            data={data}
            isMobile
            programDetailsItems={programDetailsItems}
          />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Box className="column-container">
              <InteractionMetricsSection
                data={data}
                history={history}
                interactionItems={interactionItems}
                isExternalUser={isExternalUser}
                isMobile={isMobile}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 12 }}>
            <Box sx={{ height: 5, width: '100%' }} />
          </Grid>

          {/* Second row - School Details, Key Contacts, Program Details */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="column-container">
              <InfoCard
                title={t('School Details')}
                id="school-overview-details"
                className="school-overview-details"
                items={schoolDetailsItems}
                showEditIcon={isExternalUser ? false : haveAccess}
                onEditClick={() =>
                  history.replace({
                    ...parsePath(
                      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
                    ),
                    state: data,
                  })
                }
              />
              <Box>
                <SubjectCurriculumCard schoolId={data.schoolData?.id} />
              </Box>
              <SchoolLocationCard
                id="school-overview-location"
                className="school-overview-location"
                schoolName={data.schoolData?.name || ''}
                locationLink={data.schoolData?.location_link}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="column-container">
              <SchoolOverviewKeyContacts
                data={data}
                keyContacts={keyContacts}
              />
              <SchoolFieldCoordinators
                schoolId={data.schoolData?.id}
                programId={data.schoolData?.program_id}
                canEdit={!isExternalUser && haveAccess}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SchoolOverviewProgramDetails
              data={data}
              programDetailsItems={programDetailsItems}
            />
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default SchoolOverview;
