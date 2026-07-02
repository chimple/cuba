import React from 'react';
import { IconButton } from '@mui/material';
import { BsFillBellFill } from 'react-icons/bs';
import { t } from 'i18next';
import ProgramListTable from '../components/ProgramListTable';
import { useProgramPageLogic } from './ProgramPageLogic';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import type { RootState } from '../../redux/store';
import type { AuthState } from '../../redux/slices/auth/authSlice';
import './ProgramPage.css';
import './SchoolList.css';

const ProgramPageContent: React.FC = () => {
  const logic = useProgramPageLogic();

  return (
    <div className="program-page">
      <div className="program-page-header">
        <span className="program-page-header-title">{t('Programs')}</span>
        <IconButton className="bell-icon">
          <BsFillBellFill />
        </IconButton>
      </div>
      <ProgramListTable
        selectedTab={logic.selectedTab}
        onTabChange={(value) => {
          logic.setSelectedTab(value);
          logic.setPage(1);
        }}
        searchTerm={logic.searchTerm}
        onSearchChange={(value) => {
          logic.setSearchTerm(value);
          logic.setPage(1);
        }}
        filters={logic.filters}
        tempFilters={logic.tempFilters}
        filterOptions={logic.filterOptions}
        isFilterOpen={logic.isFilterOpen}
        onOpenFilters={() => logic.setIsFilterOpen(true)}
        onCloseFilters={() => {
          logic.setIsFilterOpen(false);
          logic.setTempFilters(logic.filters);
        }}
        onApplyFilters={() => {
          logic.setFilters(logic.tempFilters);
          logic.setIsFilterOpen(false);
          logic.setPage(1);
        }}
        onClearFilters={logic.handleClearFilters}
        onDeleteFilter={(key, value) => {
          logic.setFilters((prev) => ({
            ...prev,
            [key]: prev[key].filter((item) => item !== value),
          }));
          logic.setPage(1);
        }}
        onTempFilterChange={(name, value) =>
          logic.setTempFilters((prev) => ({ ...prev, [name]: value }))
        }
        selectedDateRange={logic.selectedDateRange}
        onDateRangeChange={(value) => {
          logic.setSelectedDateRange(value);
          logic.setPage(1);
        }}
        isExportDisabled={logic.isExportDisabled}
        isExporting={logic.isExporting}
        onExport={logic.handleExportPrograms}
        onNewProgram={() => logic.history.push(logic.newProgramPath)}
        columns={logic.columns}
        rows={logic.rows}
        isLoading={logic.isLoading}
        orderBy={logic.orderBy}
        orderDir={logic.orderDir}
        onSort={logic.handleSort}
        tableScrollRef={logic.tableScrollRef}
        page={logic.page}
        pageCount={logic.pageCount}
        onHeaderFilterChange={logic.handleHeaderFilterChange}
        onPageChange={(newPage) => {
          logic.setPage(newPage);
          logic.tableScrollRef.current?.scrollTo?.({
            top: 0,
            behavior: 'smooth',
          });
        }}
      />
    </div>
  );
};

const ProgramsPage: React.FC = () => {
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const canViewProgramPage = userRoles.some((role) =>
    [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
    ].includes(role as RoleType),
  );

  // Program listing is restricted to approved roles so blocked users do not see or fetch page data.
  if (!canViewProgramPage) {
    return null;
  }

  return <ProgramPageContent />;
};

export default ProgramsPage;
