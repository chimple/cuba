import React from 'react';
import { Box, Typography } from '@mui/material';
import { Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { t } from 'i18next';
import './SchoolPrincipals.css';
import { PrincipalInfo } from '../../../common/constants';
import FormCard from './FormCard';
import OpsGenericPopup from '../../common/OpsGenericPopup';
import SchoolPrincipalDeleteDialog from './SchoolPrincipalDeleteDialog';
import SchoolPrincipalsTableSection from './SchoolPrincipalsTableSection';
import { useSchoolPrincipals } from '../../hooks/useSchoolPrincipals';

interface SchoolPrincipalsProps {
  data: {
    principals?: PrincipalInfo[];
    totalPrincipalCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
}

const SchoolPrincipals: React.FC<SchoolPrincipalsProps> = ({
  data,
  schoolId,
  isMobile,
}) => {
  const controller = useSchoolPrincipals({ data, schoolId });

  return (
    <div className="school-principals-page-container">
      <OpsGenericPopup
        isOpen={controller.popup.open}
        imageSrc={controller.popup.image}
        heading={controller.popup.heading}
        text={controller.popup.text}
        autoCloseSeconds={5}
        onClose={() =>
          controller.setPopup((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
      <SchoolPrincipalDeleteDialog
        deleteContactDisplay={controller.deleteContactDisplay}
        deleteTargetPrincipal={controller.deleteTargetPrincipal}
        handleConfirmDelete={controller.handleConfirmDelete}
        isDeleting={controller.isDeleting}
        isOpen={controller.isDeleteModalOpen}
        onClose={() => controller.setIsDeleteModalOpen(false)}
      />

      <Box className="school-principals-headerActionsRow">
        <Box className="school-principals-titleArea">
          <Typography variant="h5" className="school-principals-titleHeading">
            {t('Principals')}
          </Typography>
          <Typography variant="body2" className="school-principals-totalText">
            {t('Total')}: {controller.totalCount} {t('principals')}
          </Typography>
        </Box>
        <Box className="school-principals-actionsGroup">
          {!controller.hideHeaderActions && !controller.isExternalUser && (
            <MuiButton
              variant="outlined"
              onClick={controller.handleAddNewPrincipal}
              className="school-principals-newTeacherButton-outlined"
            >
              <AddIcon className="school-principals-newTeacherButton-outlined-icon" />
              {!isMobile && t('New Principal')}
            </MuiButton>
          )}
        </Box>
      </Box>

      <SchoolPrincipalsTableSection
        columns={controller.columns}
        currentPrincipal={controller.currentPrincipal}
        displayPrincipals={controller.displayPrincipals}
        handleAddNewPrincipal={controller.handleAddNewPrincipal}
        handlePageChange={controller.handlePageChange}
        handleSort={controller.handleSort}
        isDataPresent={controller.isDataPresent}
        isExternalUser={controller.isExternalUser}
        isLoading={controller.isLoading}
        openPopup={controller.openPopup}
        order={controller.order}
        orderBy={controller.orderBy}
        page={controller.page}
        pageCount={controller.pageCount}
        schoolId={schoolId}
        setOpenPopup={controller.setOpenPopup}
      />

      <FormCard
        open={controller.isAddPrincipalModalOpen}
        title={t('Add New Principal')}
        submitLabel={
          controller.isSubmitting ? t('Adding...') : t('Add Principal')
        }
        fields={controller.teacherFormFields}
        onClose={controller.handleCloseAddTeacherModal}
        onSubmit={controller.handlePrincipalSubmit}
        message={controller.errorMessage}
      />
    </div>
  );
};

export default SchoolPrincipals;
