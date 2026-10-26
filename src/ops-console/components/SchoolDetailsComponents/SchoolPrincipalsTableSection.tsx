import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { t } from 'i18next';
import { ContactTarget } from '../../../common/constants';
import DataTableBody, { Column } from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import FcInteractPopUp from '../fcInteractComponents/FcInteractPopUp';
import type { DisplayPrincipal } from '../../hooks/useSchoolPrincipals';

const SchoolPrincipalsTableSection = ({
  columns,
  currentPrincipal,
  displayPrincipals,
  handleAddNewPrincipal,
  handlePageChange,
  handleSort,
  isDataPresent,
  isExternalUser,
  isLoading,
  openPopup,
  order,
  orderBy,
  page,
  pageCount,
  schoolId,
  setOpenPopup,
}: {
  columns: Column<DisplayPrincipal>[];
  currentPrincipal: any;
  displayPrincipals: DisplayPrincipal[];
  handleAddNewPrincipal: () => void;
  handlePageChange: (newPage: number) => void;
  handleSort: (key: string) => void;
  isDataPresent: boolean;
  isExternalUser: boolean;
  isLoading: boolean;
  openPopup: boolean;
  order: 'asc' | 'desc';
  orderBy: string;
  page: number;
  pageCount: number;
  schoolId: string;
  setOpenPopup: (value: boolean) => void;
}) => {
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isDataPresent) {
    return (
      <Box className="school-principals-empty-state-container">
        <Typography
          variant="h6"
          className="school-principals-empty-state-title"
        >
          {t('Principals')}
        </Typography>
        <Typography className="school-principals-empty-state-message">
          {t('No principals data found for the selected school')}
        </Typography>
        {!isExternalUser && (
          <MuiButton
            variant="text"
            onClick={handleAddNewPrincipal}
            className="school-principals-emptyStateAddButton"
            startIcon={
              <AddIcon className="school-principals-emptyStateAddButton-icon" />
            }
          >
            {t('Add Principal')}
          </MuiButton>
        )}
      </Box>
    );
  }

  return (
    <>
      {openPopup && currentPrincipal && (
        <FcInteractPopUp
          principalData={currentPrincipal}
          schoolId={schoolId}
          onClose={() => setOpenPopup(false)}
          initialUserType={ContactTarget.PRINCIPAL}
        />
      )}
      <div className="school-principals-data-table-container">
        <DataTableBody
          columns={columns}
          rows={displayPrincipals}
          orderBy={orderBy}
          order={order}
          onSort={handleSort}
          onRowClick={() => {}}
        />
      </div>
      {pageCount > 1 && (
        <div className="school-principals-footer">
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default SchoolPrincipalsTableSection;
