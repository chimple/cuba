import React from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import { PAGES } from '../../common/constants';
import Breadcrumb from '../components/Breadcrumb';
import DataTableBody from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import FilterSlider from '../components/FilterSlider';
import SearchAndFilter from '../components/SearchAndFilter';
import SelectedFilters from '../components/SelectedFilters';
import { useProgramConnectedSchools } from '../hooks/useProgramConnectedSchools';
import './ProgramConnectedSchoolPageOps.css';

interface ProgramConnectedSchoolPageProps {
  id: string;
}

const ProgramConnectedSchoolPage: React.FC<ProgramConnectedSchoolPageProps> = ({
  id,
}) => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    columns,
    filterConfigsForSchools,
    filterOptions,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleClose,
    handleDeleteFilter,
    handleFilterChange,
    handleSearchChange,
    handleSort,
    isFilterOpen,
    loadingData,
    loadingFilters,
    orderBy,
    orderDir,
    page,
    pageCount,
    programName,
    schools,
    searchTerm,
    setIsFilterOpen,
    setPage,
    tempFilters,
  } = useProgramConnectedSchools(id);

  return (
    <div className="ops-program-schools-page-container">
      <Box className="ops-program-schools-page-header">
        <Box className="ops-program-schools-header-top">
          {isMobile ? (
            <>
              <Box sx={{ width: 40 }} />
              <Typography className="ops-program-schools-title-mobile">
                {programName}
              </Typography>
              <IconButton className="ops-program-schools-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography className="ops-program-schools-title">
                {programName}
              </Typography>
              <IconButton className="ops-program-schools-icon-button">
                <NotificationsIcon />
              </IconButton>
            </>
          )}
        </Box>

        <Box className="ops-program-schools-page-header-row">
          {!isMobile && (
            <div className="ops-program-schools-page-container-two">
              <Breadcrumb
                crumbs={[
                  {
                    label: t('Programs'),
                    onClick: () =>
                      history.push(
                        `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`,
                      ),
                  },
                  { label: programName, onClick: () => history.goBack() },
                  { label: t('Schools') },
                ]}
              />
            </div>
          )}
          <div className="ops-program-schools-header-and-search-filter">
            <div className="ops-program-schools-button-and-search-filter">
              {loadingFilters ? (
                <CircularProgress />
              ) : (
                <SearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  filters={filters}
                  onFilterClick={() => setIsFilterOpen(true)}
                  onClearFilters={handleCancelFilters}
                />
              )}
            </div>
          </div>
        </Box>

        <SelectedFilters
          filters={filters}
          onDeleteFilter={handleDeleteFilter}
        />
        <FilterSlider
          isOpen={isFilterOpen}
          onClose={handleClose}
          filters={tempFilters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          filterConfigs={filterConfigsForSchools}
        />
      </Box>

      <div className="ops-program-schools-table-container">
        {!loadingData && schools.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography align="center">{t('No schools found.')}</Typography>
          </Box>
        ) : (
          <DataTableBody
            columns={columns}
            rows={schools}
            orderBy={orderBy}
            order={orderDir}
            onSort={handleSort}
            loading={loadingData}
          />
        )}
      </div>

      {!loadingData && schools.length > 0 && (
        <div className="ops-program-schools-list-footer">
          <DataTablePagination
            pageCount={pageCount}
            page={page}
            onPageChange={(val) => setPage(val)}
          />
        </div>
      )}
    </div>
  );
};

export default ProgramConnectedSchoolPage;
