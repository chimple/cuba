import React from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Button as MuiButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { t } from 'i18next';
import SchoolListDateRangeDropdown from '../SchoolListDateRangeDropdown';
import type { DateRangeValue } from '../../pages/SchoolList.helpers';

type SchoolClassHeaderProps = {
  isExternalUser: boolean;
  onCreateClass: () => void;
  selectedDateRange: DateRangeValue;
  setSelectedDateRange: (value: DateRangeValue) => void;
  totalCount: number;
};

export default function SchoolClassHeader({
  isExternalUser,
  onCreateClass,
  selectedDateRange,
  setSelectedDateRange,
  totalCount,
}: SchoolClassHeaderProps) {
  const isSmall = useMediaQuery('(max-width: 768px)');

  return (
    <Box className="schoolclass-headerActionsRow">
      <Box className="schoolclass-titleArea">
        <Typography variant="h5" className="schoolclass-titleHeading">
          {t('Classes')}
        </Typography>
        <Typography variant="body2" className="schoolclass-totalText">
          {t('Total: ')}
          {totalCount}
          {t(' classes')}
        </Typography>
      </Box>
      <Box className="schoolclass-actionsGroup">
        {!isExternalUser && (
          <MuiButton
            variant="outlined"
            onClick={onCreateClass}
            className="schoolclass-newStudentButton-outlined"
          >
            <AddIcon className="schoolclass-newStudentButton-outlined-icon" />
            {!isSmall && t('New Class')}
          </MuiButton>
        )}
        <SchoolListDateRangeDropdown
          value={selectedDateRange}
          onChange={setSelectedDateRange}
        />
      </Box>
    </Box>
  );
}
