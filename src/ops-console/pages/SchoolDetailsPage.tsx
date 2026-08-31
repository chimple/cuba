// SchoolDetailsPage.tsx
import React from 'react';
import './SchoolDetailsPage.css';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import { t } from 'i18next';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SchoolNameHeaderComponent from '../components/SchoolDetailsComponents/SchoolNameHeaderComponent';
import Breadcrumb from '../components/Breadcrumb';
import SchoolDetailsTabsComponent from '../components/SchoolDetailsComponents/SchoolDetailsTabsComponent';
import SchoolCheckInModal from '../components/SchoolDetailsComponents/SchoolCheckInModal';
import AddNoteModal from '../components/SchoolDetailsComponents/AddNoteModal';
import {
  SchoolVisitAction,
  SchoolVisitStatus,
  SchoolVisitType,
  SchoolVisitTypeLabels,
} from '../../common/constants';
import { SchoolTabs } from '../../interface/modelInterfaces';
import { useSchoolDetailsPage } from '../hooks/useSchoolDetailsPage';

export type {
  ClassWithDetails,
  FCSchoolStats,
  SchoolStats,
} from '../hooks/useSchoolDetailsPage';

interface SchoolDetailComponentProps {
  id: string;
}

const SchoolDetailsPage: React.FC<SchoolDetailComponentProps> = ({ id }) => {
  const {
    activeTab,
    activeVisitType,
    anchorEl,
    checkInStatus,
    data,
    fetchAll,
    goToClassesTab,
    handleAddNoteHeader,
    handleCloseMenu,
    handleConfirmCheckInAction,
    handleOpenCheckInMenu,
    handleOpenCheckInModal,
    handleSelectVisitType,
    history,
    isCheckInModalOpen,
    isExternalUser,
    isFirstTimeCheckIn,
    isMobile,
    loading,
    loadSchoolDetailsTabData,
    openMenu,
    schoolLocation,
    selectedVisitType,
    setActiveTab,
    setGoToClassesTab,
    setIsCheckInModalOpen,
    setShowAddModal,
    showAddModal,
  } = useSchoolDetailsPage(id);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const schoolName = data.schoolData?.name;

  return (
    <div className="schooldetailspage school-detail-container">
      <div className="school-detail-header">
        {schoolName && <SchoolNameHeaderComponent schoolName={schoolName} />}
      </div>
      {!isExternalUser && (
        <SchoolCheckInModal
          open={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onConfirm={handleConfirmCheckInAction}
          status={
            checkInStatus === SchoolVisitStatus.CheckedIn
              ? SchoolVisitAction.CheckOut
              : SchoolVisitAction.CheckIn
          }
          schoolName={schoolName || t('Unknown School')}
          isFirstTime={isFirstTimeCheckIn}
          schoolLocation={schoolLocation}
          schoolAddress={data.schoolData?.address}
          schoolId={id}
          visitType={
            checkInStatus === SchoolVisitStatus.CheckedIn
              ? activeVisitType
              : selectedVisitType
          }
          onLocationUpdated={fetchAll}
        />
      )}
      {!isMobile && schoolName && (
        <div className="school-detail-secondary-header">
          <Breadcrumb
            crumbs={[
              {
                label: t('Schools'),
                onClick: () => history.goBack(),
              },
              {
                label: schoolName ?? '',
              },
            ]}
            endActions={
              isExternalUser ? null : (
                <>
                  {activeTab === SchoolTabs.Overview && (
                    <Button
                      variant="outlined"
                      onClick={() => setShowAddModal(true)}
                      className="btn-add-notes"
                    >
                      + {t('Add Notes')}
                    </Button>
                  )}
                  {checkInStatus === SchoolVisitStatus.CheckedOut ? (
                    <>
                      <Button
                        variant="contained"
                        onClick={handleOpenCheckInMenu}
                        endIcon={
                          <ArrowDropDownIcon
                            className={`check-in-icon ${openMenu ? 'check-in-icon-rotated' : ''}`}
                          />
                        }
                        className="btn-check-in"
                      >
                        {t('Check In')}
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleCloseMenu}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        classes={{
                          paper: 'schooldetailspage check-in-menu-paper',
                        }}
                      >
                        {(
                          Object.entries(SchoolVisitTypeLabels) as [
                            SchoolVisitType,
                            string,
                          ][]
                        ).map(([visitType, label], index, items) => (
                          <React.Fragment key={visitType}>
                            <MenuItem
                              onClick={() => handleSelectVisitType(visitType)}
                              className="check-in-menu-item"
                            >
                              {t(label)}
                            </MenuItem>
                            {index < items.length - 1 && (
                              <Divider className="check-in-menu-divider" />
                            )}
                          </React.Fragment>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleOpenCheckInModal}
                      className="btn-check-out"
                    >
                      {t('Check Out')}
                    </Button>
                  )}
                </>
              )
            }
          />
        </div>
      )}
      {!isExternalUser && (
        <AddNoteModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddNoteHeader}
          source="school"
          schoolId={id}
        />
      )}

      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent
          data={data}
          isMobile={isMobile}
          schoolId={id}
          refreshClasses={() => {
            void loadSchoolDetailsTabData(SchoolTabs.Classes, {
              force: true,
            });
            setGoToClassesTab(true);
          }}
          goToClassesTab={goToClassesTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onLoadTabData={loadSchoolDetailsTabData}
        />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

export default SchoolDetailsPage;
