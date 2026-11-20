import React from 'react';
import Breadcrumb from '../components/Breadcrumb';
import ContactFormSection from '../components/SchoolRequestComponents/ContactFormSection';
import './AddSchoolPage.css';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';
import {
  AddSchoolAddressSection,
  AddSchoolProgramSection,
} from '../components/addSchool/AddSchoolFormSections';
import { AddSchoolDetailsSection } from '../components/addSchool/AddSchoolDetailsSection';
import { SchoolCourseSelector } from '../components/addSchool/SchoolCourseSelector';
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
          schoolLoginType={controller.studentLoginType}
          schoolModelDisabled={!controller.program?.id}
          schoolModelOptions={controller.schoolModelOptions}
          schoolModel={controller.schoolModel}
          language={controller.language}
          languages={controller.languages}
          isLanguageLoading={controller.loading}
          schoolName={controller.schoolName}
          setSchoolLoginType={controller.setStudentLoginType}
          setSchoolModel={controller.setSchoolModel}
          setLanguage={controller.setLanguage}
          setSchoolName={controller.setSchoolName}
          showSchoolLoginType={!controller.editData}
          udise={controller.udise}
        />

        <SchoolCourseSelector
          mode={controller.editData ? 'edit' : 'create'}
          courses={controller.courses}
          removalError={controller.courseRemovalError}
          grades={controller.grades}
          loading={controller.isCoursesLoading}
          selectedCourseIds={controller.selectedCourseIds}
          selectedGradeIds={controller.selectedGradeIds}
          onGradeChange={controller.setSelectedGradeIds}
          onToggle={controller.toggleCourse}
        />

        <AddSchoolAddressSection
          address={controller.address}
          blocks={controller.blocks}
          districts={controller.districts}
          handleAddressChange={controller.handleAddressChange}
          isBlocksLoading={controller.isBlocksLoading}
          isDistrictsLoading={controller.isDistrictsLoading}
          isStatesLoading={controller.isStatesLoading}
          requireBlock={!controller.editData}
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
