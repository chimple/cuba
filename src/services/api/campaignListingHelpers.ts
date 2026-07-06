import {
  CAMPAIGN_LISTING_STATUS,
  CAMPAIGN_STATUS,
  CampaignListingStatus,
  EnumType,
  TableTypes,
} from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { InfoOutlined, MoreHoriz } from '@mui/icons-material';
import { CampaignListingItem, CampaignListingParams } from './ServiceApi';
import type { Column } from '../../ops-console/components/DataTableBody';

export const getCampaignListingStatus = ({
  campaignStatus,
  startDate,
  endDate,
  now = new Date(),
}: {
  campaignStatus: EnumType<'campaign_status'> | null;
  startDate: string;
  endDate: string;
  now?: Date;
}): CampaignListingStatus => {
  if (campaignStatus !== CAMPAIGN_STATUS.ACTIVE) {
    return CAMPAIGN_LISTING_STATUS.CANCELLED;
  }

  const normalizedStartDate = new Date(startDate);
  const normalizedEndDate = new Date(endDate);

  // Invalid dates fall back to the safest non-running status in the listing UI.
  if (
    Number.isNaN(normalizedStartDate.getTime()) ||
    Number.isNaN(normalizedEndDate.getTime())
  ) {
    return CAMPAIGN_LISTING_STATUS.NOT_STARTED;
  }

  if (now < normalizedStartDate) {
    return CAMPAIGN_LISTING_STATUS.NOT_STARTED;
  }

  if (now > normalizedEndDate) {
    return CAMPAIGN_LISTING_STATUS.COMPLETED;
  }

  return CAMPAIGN_LISTING_STATUS.IN_PROGRESS;
};

const compareCampaignListingItems = (
  left: CampaignListingItem,
  right: CampaignListingItem,
  orderBy: NonNullable<CampaignListingParams['orderBy']>,
) => {
  switch (orderBy) {
    case 'manager':
      return (
        (left.campaign.manager as TableTypes<'user'> | null | undefined)
          ?.name ?? ''
      ).localeCompare(
        (right.campaign.manager as TableTypes<'user'> | null | undefined)
          ?.name ?? '',
        undefined,
        { sensitivity: 'base' },
      );
    case 'programName':
      return (
        (left.campaign.program as TableTypes<'program'> | null | undefined)
          ?.name ?? ''
      ).localeCompare(
        (right.campaign.program as TableTypes<'program'> | null | undefined)
          ?.name ?? '',
        undefined,
        { sensitivity: 'base' },
      );
    case 'endDate':
      return (
        new Date(left.campaign.end_date).getTime() -
        new Date(right.campaign.end_date).getTime()
      );
    case 'avgWeeklyActiveUsers':
      return (
        (left.avgWeeklyActiveUsers ?? -1) - (right.avgWeeklyActiveUsers ?? -1)
      );
    case 'avgWeeklyEngagementTimeMinutes':
      return (
        (left.avgWeeklyEngagementTimeMinutes ?? -1) -
        (right.avgWeeklyEngagementTimeMinutes ?? -1)
      );
    case 'startDate':
      return (
        new Date(left.campaign.start_date).getTime() -
        new Date(right.campaign.start_date).getTime()
      );
    case 'name':
    default:
      return left.campaign.name.localeCompare(right.campaign.name, undefined, {
        sensitivity: 'base',
      });
  }
};

export const sortCampaignListingItems = (
  items: CampaignListingItem[],
  orderBy: NonNullable<CampaignListingParams['orderBy']>,
  orderDir: NonNullable<CampaignListingParams['orderDir']>,
) =>
  [...items].sort((left, right) => {
    const comparison = compareCampaignListingItems(left, right, orderBy);
    return orderDir === 'asc' ? comparison : -comparison;
  });

export const mapCampaignListingItem = (
  row: TableTypes<'campaign'> & {
    manager?: TableTypes<'user'> | TableTypes<'user'>[] | null;
    program?: TableTypes<'program'> | TableTypes<'program'>[] | null;
  },
  now: Date,
  metrics?: CampaignListingItem['dashboardMetrics'],
): CampaignListingItem => {
  return {
    campaignId: row.id,
    campaign: row,
    dashboardMetrics: metrics ?? null,
    avgWeeklyActiveUsers: metrics?.active_students ?? null,
    avgWeeklyEngagementTimeMinutes:
      metrics?.average_weekly_engagement_time ?? null,
    status: getCampaignListingStatus({
      campaignStatus: row.campaign_status,
      startDate: row.start_date,
      endDate: row.end_date,
      now,
    }),
  };
};

export const formatCampaignListingDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const getCampaignObjectiveLabel = (objective: string) =>
  (
    ({
      homework_campaign: 'Homework Campaign',
      homepage_learning_pathway_campaign: 'Homepage Learning Pathway Campaign',
    }) as const
  )[objective] ?? objective.replace(/_/g, ' ');

export const formatCampaignMetricValue = (value: number | null, suffix = '') =>
  value === null ? '-' : `${value}${suffix}`;

export const canCancelCampaign = (status: CampaignListingStatus) =>
  status === CAMPAIGN_LISTING_STATUS.NOT_STARTED ||
  status === CAMPAIGN_LISTING_STATUS.IN_PROGRESS;

export type CampaignTableRow = {
  id: string;
  campaignName: React.ReactNode;
  objective: string;
  manager: string;
  programName: string;
  avgWeeklyActiveUsers: string;
  avgWeeklyEngagementTime: string;
  startDate: string;
  endDate: string;
  status: React.ReactNode;
  actions: React.ReactNode;
};

export type CampaignSortColumn =
  | 'campaignName'
  | 'manager'
  | 'programName'
  | 'avgWeeklyActiveUsers'
  | 'avgWeeklyEngagementTime'
  | 'startDate'
  | 'endDate';

export const CAMPAIGN_LISTING_PAGE_SIZE = 8;

export const hasCampaignWriteAccess = (roles: string[]) =>
  roles.some((role) =>
    [
      RoleType.PROGRAM_MANAGER,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.SUPER_ADMIN,
    ].includes(role as RoleType),
  );

export const getCampaignStatusClassName = (status: CampaignListingStatus) =>
  (
    ({
      'Not Started':
        'campaign-listing-status-pill campaign-listing-status-not-started',
      'In Progress':
        'campaign-listing-status-pill campaign-listing-status-in-progress',
      Completed:
        'campaign-listing-status-pill campaign-listing-status-completed',
      Cancelled:
        'campaign-listing-status-pill campaign-listing-status-cancelled',
    }) as const
  )[status];

const renderMetricHeaderLabel = (label: string, tooltip: string) =>
  // React.createElement keeps this helper in a .ts file while still returning JSX content.
  React.createElement(
    Box,
    { className: 'campaign-listing-head-metric' },
    React.createElement('span', null, label),
    React.createElement(Tooltip, {
      title: React.createElement(
        'span',
        { className: 'campaign-listing-info-tooltip-copy' },
        tooltip,
      ),
      placement: 'top',
      classes: { tooltip: 'campaign-listing-info-tooltip' },
      children: React.createElement(InfoOutlined, {
        className: 'campaign-listing-info-icon',
      }),
    }),
  );

export const getCampaignListingColumns = (
  translate: (value: string) => string,
): Column<CampaignTableRow>[] => [
  {
    key: 'campaignName',
    label: translate('Campaign Name'),
    align: 'left',
    sortable: true,
    width: 220,
  },
  {
    key: 'objective',
    label: translate('Objective'),
    align: 'left',
    sortable: false,
    width: 220,
  },
  {
    key: 'manager',
    label: translate('Manager'),
    align: 'left',
    sortable: true,
    width: 170,
  },
  {
    key: 'programName',
    label: translate('Program Name'),
    align: 'left',
    sortable: true,
    width: 210,
  },
  {
    key: 'avgWeeklyActiveUsers',
    label: renderMetricHeaderLabel(
      translate('Avg Weekly Active Users'),
      translate(
        'The average number of unique users who were active in the past 7 days.',
      ),
    ),
    align: 'left',
    sortable: true,
    width: 180,
  },
  {
    key: 'avgWeeklyEngagementTime',
    label: renderMetricHeaderLabel(
      translate('Avg Weekly Engagement Time'),
      translate(
        'The average time users spent actively using the app in the past 7 days.',
      ),
    ),
    align: 'left',
    sortable: true,
    width: 190,
  },
  {
    key: 'startDate',
    label: translate('Start Date'),
    align: 'left',
    sortable: true,
    width: 130,
  },
  {
    key: 'endDate',
    label: translate('End Date'),
    align: 'left',
    sortable: true,
    width: 130,
  },
  {
    key: 'status',
    label: translate('Status'),
    align: 'left',
    sortable: false,
    width: 130,
  },
  {
    key: 'actions',
    label: translate('Actions'),
    align: 'center',
    sortable: false,
    width: 80,
  },
];

export const buildCampaignTableRows = ({
  campaigns,
  canManageCampaignActions,
  onOpenMenu,
}: {
  campaigns: CampaignListingItem[];
  canManageCampaignActions: boolean;
  onOpenMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    campaignId: string,
  ) => void;
}): CampaignTableRow[] =>
  // Centralizing row rendering keeps the page file focused on composition and flow.
  campaigns.map((campaign) => ({
    id: campaign.campaignId,
    campaignName: React.createElement(
      'span',
      { className: 'campaign-listing-cell-strong' },
      campaign.campaign.name,
    ),
    objective: getCampaignObjectiveLabel(campaign.campaign.objective),
    manager:
      (
        campaign.campaign.manager as { name?: string | null } | null | undefined
      )?.name?.trim() || '-',
    programName:
      (
        campaign.campaign.program as { name?: string | null } | null | undefined
      )?.name?.trim() || '-',
    avgWeeklyActiveUsers: formatCampaignMetricValue(
      campaign.avgWeeklyActiveUsers,
    ),
    avgWeeklyEngagementTime: formatCampaignMetricValue(
      campaign.avgWeeklyEngagementTimeMinutes,
      'm',
    ),
    startDate: formatCampaignListingDate(campaign.campaign.start_date),
    endDate: formatCampaignListingDate(campaign.campaign.end_date),
    status: React.createElement(
      'span',
      { className: getCampaignStatusClassName(campaign.status) },
      campaign.status,
    ),
    actions:
      canManageCampaignActions && canCancelCampaign(campaign.status)
        ? React.createElement(
            IconButton,
            {
              onClick: (event: React.MouseEvent<HTMLButtonElement>) =>
                onOpenMenu(event, campaign.campaignId),
              className: 'campaign-listing-row-menu-button',
              'aria-label': `More actions for ${campaign.campaign.name}`,
            },
            React.createElement(MoreHoriz),
          )
        : null,
  }));

export const getCampaignListingPageCount = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize));

export const getCampaignWithStatusOverrides = ({
  campaigns,
  campaignStatusOverrides,
}: {
  campaigns: CampaignListingItem[];
  campaignStatusOverrides: Record<string, CampaignListingStatus>;
}) =>
  // Local status overrides let us show a cancelled state immediately after the API call.
  campaigns.map((campaign) => ({
    ...campaign,
    status: campaignStatusOverrides[campaign.campaignId] ?? campaign.status,
  }));

export const getSelectedCampaignItem = ({
  campaigns,
  selectedCampaignId,
  cancelDialogCampaignId,
}: {
  campaigns: CampaignListingItem[];
  selectedCampaignId: string | null;
  cancelDialogCampaignId: string | null;
}) =>
  // The same campaign selection is reused by the row menu and the cancel dialog banner.
  campaigns.find(
    (campaign) =>
      campaign.campaignId === (selectedCampaignId ?? cancelDialogCampaignId),
  ) ?? null;
