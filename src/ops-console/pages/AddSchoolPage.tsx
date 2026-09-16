import React from 'react';
import Breadcrumb from '../components/Breadcrumb';
import ContactFormSection from '../components/SchoolRequestComponents/ContactFormSection';
import './AddSchoolPage.css';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';
import {
  AddSchoolAddressSection,
  AddSchoolDetailsSection,
  AddSchoolProgramSection,
} from '../components/addSchool/AddSchoolFormSections';
import { useAddSchoolPage } from '../hooks/useAddSchoolPage';

const AddSchoolPage: React.FC = () => {
  const controller = useAddSchoolPage();

  return (
    <div className="add-school-main-container">
      <div className="add-school-secondary-header">
        <Breadcrumb
          crumbs={
            !controller.editData
              ? [
                  {
                    label: t('Schools'),
                    onClick: () =>
                      controller.history.push(
                        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`,
                      ),
                  },
                  { label: t('Add School') },
                ]
              : [
                  {
                    label: 'Schools',
                    onClick: () =>
                      controller.history.push(
                        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`,
                      ),
                  },
                  {
                    label: controller.schoolName,
                    onClick: () => controller.history.goBack(),
                  },
                  {
                    label: 'Edit',
                  },
                ]
          }
        />
      </div>

      <div className="add-school-container">
        <AddSchoolProgramSection
          fieldCoordinator={controller.fieldCoordinator}
          fieldCoordinators={controller.fieldCoordinators}
          lockDropdowns={controller.lockDropdowns}
          program={controller.program}
          programs={controller.programs}
          setFieldCoordinator={controller.setFieldCoordinator}
          setProgram={controller.setProgram}
        />

        <AddSchoolDetailsSection
          errorMessage={controller.errorMessage}
          handleUdiseChange={controller.handleUdiseChange}
          schoolModelDisabled={!controller.program?.id}
          schoolModelOptions={controller.schoolModelOptions}
          schoolModel={controller.schoolModel}
          schoolName={controller.schoolName}
          setSchoolModel={controller.setSchoolModel}
          setSchoolName={controller.setSchoolName}
          udise={controller.udise}
        />

        <AddSchoolAddressSection
          address={controller.address}
          blocks={controller.blocks}
          districts={controller.districts}
          handleAddressChange={controller.handleAddressChange}
          isBlocksLoading={controller.isBlocksLoading}
          isDistrictsLoading={controller.isDistrictsLoading}
          isStatesLoading={controller.isStatesLoading}
          states={controller.states}
        />

        <ContactFormSection
          title={t('Key Contacts')}
          fields={controller.contacts}
          onChange={controller.handleContactChange}
        />

        <div className="add-school-button-row">
          <button
            className="add-school-cancel-btn"
            onClick={() => controller.history.goBack()}
          >
            {t('Cancel')}
          </button>

          <button
            className="add-school-save-btn"
            onClick={controller.handleApprove}
            disabled={controller.isSaveDisabled() || controller.isSaving}
          >
            {controller.isSaving ? t('Saving') + '...' : t('Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSchoolPage;
