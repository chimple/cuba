import React from 'react';
import Grid from '@mui/material/Grid';
import { Box, Button, Divider, Typography } from '@mui/material';
import { t } from 'i18next';
import { parsePath } from 'history';
import { PAGES } from '../../../common/constants';
import ContactCard from '../ContactCard';
import DetailItem from '../DetailItem';
import InfoCard from '../InfoCard';

type InteractionMetric = {
  label: string;
  value: number;
};

type ProgramDetailItem = {
  label: string;
  value: string;
};

const buildContactsToShow = (data: any, keyContacts: any[]) =>
  keyContacts && keyContacts.length
    ? keyContacts.map((contact: any) => ({
        name: contact.name,
        phone: contact.phone || contact.email,
        role: contact.role || t('Key Contact'),
      }))
    : [
        ...(data.principals?.map((principal: any) => ({
          name: principal.name,
          phone: principal.phone || principal.email,
          role: t('Principal'),
        })) || []),
        ...(data.coordinators?.map((coordinator: any) => ({
          name: coordinator.name,
          phone: coordinator.phone || coordinator.email,
          role: t('Coordinator'),
        })) || []),
      ];

export const InteractionMetricsSection = ({
  data,
  history,
  interactionItems,
  isExternalUser,
  isMobile,
}: {
  data: any;
  history: any;
  interactionItems: InteractionMetric[];
  isExternalUser: boolean;
  isMobile: boolean;
}) => (
  <InfoCard
    title={t('Interaction Metrics')}
    className="interaction-card"
    hideDivider={true}
    headerAction={
      !isMobile && !isExternalUser ? (
        <Button
          size="small"
          variant="outlined"
          className="schooloverview-view-all-interactions-btn"
          sx={{ textTransform: 'none' }}
          onClick={() =>
            history.replace({
              ...parsePath(
                `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}`,
              ),
              state: data.schoolData,
            })
          }
        >
          {t('View All Interactions')}
        </Button>
      ) : undefined
    }
  >
    <Grid container spacing={2} mt={0.5}>
      {interactionItems.map((item, idx) => (
        <Grid key={idx} size={{ xs: 6, sm: 6, md: 4 }}>
          <Box className="schooloverview-interaction-item">
            <Typography
              variant="body2"
              color="text.secondary"
              className="schooloverview-interaction-item-label"
            >
              {t(item.label)}
            </Typography>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              {item.value}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
    {isMobile && !isExternalUser && (
      <Button
        fullWidth
        size="small"
        className="full-width-button"
        variant="outlined"
        sx={{ mt: 2, textTransform: 'none' }}
        onClick={() =>
          history.replace({
            ...parsePath(
              `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ACTIVITIES_PAGE}`,
            ),
            state: data.schoolData,
          })
        }
      >
        {t('View All Interactions')}
      </Button>
    )}
  </InfoCard>
);

export const SchoolOverviewKeyContacts = ({
  data,
  keyContacts,
}: {
  data: any;
  keyContacts: any[];
}) => (
  <InfoCard
    title={t('Key Contacts')}
    children={
      <Box className="principal-list">
        {buildContactsToShow(data, keyContacts).map(
          (contact: any, idx: number) => (
            <ContactCard
              key={idx}
              name={contact.name}
              role={contact.role}
              phone={contact.phone}
            />
          ),
        )}
      </Box>
    }
  />
);

export const SchoolOverviewProgramDetails = ({
  data,
  isMobile,
  programDetailsItems,
}: {
  data: any;
  isMobile?: boolean;
  programDetailsItems: ProgramDetailItem[];
}) => {
  const [programName, programType, model] = programDetailsItems;

  if (isMobile) {
    return (
      <InfoCard title={t('Program Details')} className="program-card">
        <Box className="info-card-items">
          {programDetailsItems.map((item, idx) => (
            <DetailItem key={idx} {...item} />
          ))}
        </Box>
        <ProgramManagersSection data={data} titleVariant="subtitle1" />
      </InfoCard>
    );
  }

  return (
    <InfoCard title={t('Program Details')} className="program-card">
      <Box height={4} />
      <Box display="flex" flexDirection="row" width="100%" gap={4} mb={2}>
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          minWidth={0}
        >
          <ProgramDetailText item={programName} />
          <ProgramDetailText item={programType} />
        </Box>
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          minWidth={0}
        >
          <ProgramDetailText item={model} />
        </Box>
      </Box>
      <ProgramManagersSection data={data} titleVariant="subtitle2" />
    </InfoCard>
  );
};

const ProgramDetailText = ({ item }: { item?: ProgramDetailItem }) => (
  <>
    <Typography variant="subtitle2" fontWeight={500} textAlign="left">
      {t(item?.label || '')}
    </Typography>
    <Typography
      variant="body1"
      gutterBottom
      textAlign="left"
      sx={{ wordBreak: 'break-word', width: '100%' }}
    >
      {item?.value}
    </Typography>
  </>
);

const ProgramManagersSection = ({
  data,
  titleVariant,
}: {
  data: any;
  titleVariant: 'subtitle1' | 'subtitle2';
}) => (
  <>
    <Divider className="info-card-section-divider" />
    <Box mt={2}>
      <Typography
        variant={titleVariant}
        className="info-card-section-title"
        gutterBottom
        align="left"
        fontWeight={titleVariant === 'subtitle1' ? 500 : 600}
      >
        {t('Program Manager')}
      </Typography>
      <Box>
        {data.programManagers?.map(
          (
            manager: {
              name?: string;
              role?: string;
              phone?: string;
              email?: string;
            },
            idx: number,
          ) => (
            <ContactCard
              key={idx}
              name={manager.name || ''}
              role={manager.role || t('Program Manager')}
              phone={manager.phone || manager.email || ''}
            />
          ),
        )}
      </Box>
    </Box>
  </>
);
