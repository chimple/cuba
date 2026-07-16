import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { t } from 'i18next';
import DataTableBody from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import {
  buildCampaignRewardColumns,
  getRewardCompletionTone,
  type CampaignRewardRow,
} from './CampaignRewardsReport.helpers';

interface CampaignRewardsReportHeaderProps {
  classFilter: string;
  classOptions: string[];
  isExporting: boolean;
  lastUpdated: string;
  schoolFilter: string;
  schoolOptions: string[];
  onClassFilterChange: (value: string) => void;
  onExport: () => void;
  onSchoolFilterChange: (value: string) => void;
}

const renderFilterSelect = (
  value: string,
  values: string[],
  onChange: (value: string) => void,
) => {
  const selectValues = values.includes(value) ? values : [value, ...values];

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <Select
        value={value}
        onChange={(event) => onChange(String(event.target.value))}
        IconComponent={KeyboardArrowDownRoundedIcon}
        sx={{
          borderRadius: '999px',
          background: '#fff',
          fontSize: 13,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E4E8' },
        }}
      >
        {selectValues.map((option) => (
          <MenuItem
            key={option}
            value={option}
            onClick={() => {
              if (option === value) onChange(option);
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export const CampaignRewardsReportHeader: React.FC<
  CampaignRewardsReportHeaderProps
> = ({
  classFilter,
  classOptions,
  isExporting,
  lastUpdated,
  schoolFilter,
  schoolOptions,
  onClassFilterChange,
  onExport,
  onSchoolFilterChange,
}) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', md: 'center' }}
    flexWrap="wrap"
    gap={2}
    px={2.5}
    py={2}
    borderBottom="1px solid #EAECEF"
  >
    <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
      <Typography fontSize={16} fontWeight={700} color="#21272A">
        {t('Students Reward Report')}
      </Typography>
      <Typography fontSize={12} fontStyle="italic" color="#21272A">
        ({t('Last Updated')}:{' '}
        <Box component="span" color="#1A71F6" fontWeight={600}>
          {lastUpdated}
        </Box>
        )
      </Typography>
    </Box>
    <Box display="flex" gap={1.25} flexWrap="wrap">
      {renderFilterSelect(schoolFilter, schoolOptions, onSchoolFilterChange)}
      {renderFilterSelect(classFilter, classOptions, onClassFilterChange)}
      <Button
        startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
        onClick={onExport}
        disabled={isExporting}
        sx={{
          borderRadius: '999px',
          border: '1px solid #E0E4E8',
          color: '#1A71F6',
          px: 2,
          textTransform: 'none',
        }}
      >
        {isExporting ? t('Exporting...') : t('Export')}
      </Button>
    </Box>
  </Box>
);

interface CampaignRewardsTableProps {
  order: 'asc' | 'desc';
  orderBy: string;
  page: number;
  pageCount: number;
  rewardTypeLabel: string;
  rows: CampaignRewardRow[];
  loading: boolean;
  onPageChange: (page: number) => void;
  onSort: (key: string) => void;
}

const CampaignRewardsTable: React.FC<CampaignRewardsTableProps> = ({
  order,
  orderBy,
  page,
  pageCount,
  rewardTypeLabel,
  rows,
  loading,
  onPageChange,
  onSort,
}) => {
  const columns = useMemo(
    () =>
      buildCampaignRewardColumns(rewardTypeLabel).map((column) => {
        if (column.key !== 'completionPercent' && column.key !== 'rewardRank') {
          return column;
        }

        return {
          ...column,
          render: (row: CampaignRewardRow) =>
            column.key === 'completionPercent' ? (
              <Chip
                label={`${row.completionPercent}%`}
                size="small"
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  backgroundColor: getRewardCompletionTone(
                    row.completionPercent,
                  ).bg,
                  color: getRewardCompletionTone(row.completionPercent).color,
                }}
              />
            ) : (
              <Typography>{row.rewardRank ?? '--'}</Typography>
            ),
        };
      }),
    [rewardTypeLabel],
  );

  return (
    <Box>
      <DataTableBody
        columns={columns}
        rows={rows}
        orderBy={orderBy}
        order={order}
        onSort={onSort}
        loading={loading}
        disableRowNavigation
        tableMinWidth={980}
        tableWidth="100%"
        headerNoEllipsis
      />
      <DataTablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </Box>
  );
};

export default CampaignRewardsTable;
