import React, { useEffect, useState } from 'react';
import './ClassForm.css';
import type { TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { t } from 'i18next';
import logger from '../../utility/logger';
import {
  getGradeNameFromStandard,
  getStandardFromClassName,
} from '../../utility/classGradeMapper';
import { ClassCourseSelector } from './ClassCourseSelector';
import {
  extractGroupIdFromInviteResponse,
  normalizeWhatsAppInviteLink,
} from './ClassForm.utils';
import {
  ClassFormFooterFields,
  ClassFormGradeFields,
  ClassFormTitle,
} from './ClassFormFields';
import { useClassFormCourses } from './useClassFormCourses';
import type { ClassRow } from './SchoolDetailsComponents/SchoolClass.types';

type ClassFormValues = {
  grade: string;
  section: string;
  whatsapp_invite_link: string;
};

type ClassFormClassData = ClassRow & {
  Courses?: TableTypes<'class_course'>[];
};

const ClassForm: React.FC<{
  onClose: () => void;
  mode: 'create' | 'edit';
  classData?: ClassFormClassData;
  schoolId?: string;
  whatspAppBotNumber?: string;
  onSaved?: () => void;
}> = ({ onClose, mode, classData, schoolId, whatspAppBotNumber, onSaved }) => {
  const [formValues, setFormValues] = useState<ClassFormValues>({
    grade: '',
    section: '',
    whatsapp_invite_link: '',
  });

  const [resolvedGroupId, setResolvedGroupId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const api = ServiceConfig.getI().apiHandler;
  const {
    allCourses,
    dropdownOpen,
    dropdownRef,
    handleSelectCourse,
    loading,
    selectedCourse,
    setDropdownOpen,
  } = useClassFormCourses({
    api,
    classData,
    mode,
    schoolId,
    setErrorMessage,
  });

  useEffect(() => {
    if (mode === 'edit' && classData) {
      const grade = (classData.name || '').replace(/[^0-9]/g, '');
      const section = (classData.name || '').replace(/[0-9]/g, '');

      setFormValues({
        grade: grade || '',
        section: section || '',
        whatsapp_invite_link: classData.whatsapp_invite_link ?? '',
      });
      setResolvedGroupId(classData.group_id ?? '');
    }
  }, [mode, classData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    formValues.grade.trim() !== '' &&
    selectedCourse.length > 0 &&
    !(
      mode === 'edit' &&
      classData?.name === formValues.grade + formValues.section &&
      formValues.whatsapp_invite_link.trim() ===
        classData?.whatsapp_invite_link?.trim() &&
      JSON.stringify(classData?.courses?.map((c) => c.id)) ===
        JSON.stringify(selectedCourse)
    );

  const placeholder =
    selectedCourse.length > 0
      ? `${selectedCourse.length} Subjects Selected`
      : t('Select Courses');

  const didInviteLinkChange =
    mode === 'edit' &&
    normalizeWhatsAppInviteLink(formValues.whatsapp_invite_link) !==
      (classData?.whatsapp_invite_link ?? '');

  const handleSubmit = async () => {
    if (!isFormValid) return;
    if (!schoolId) return;

    setSaving(true);
    try {
      let classId = classData?.id;
      const name = formValues.grade + formValues.section;
      const originalClassName = classData?.name ?? '';
      const standard = getStandardFromClassName(name);
      const gradeName = getGradeNameFromStandard(standard);
      let gradeId: string | undefined;
      if (gradeName) {
        try {
          const grade = await api.getGradeByName(gradeName);
          gradeId = grade?.id;
          if (!gradeId) {
            logger.warn('Grade not found for class mapping', {
              className: name,
              gradeName,
            });
          }
        } catch (error) {
          logger.warn('Failed to resolve grade for class mapping', {
            className: name,
            gradeName,
            error,
          });
        }
      }
      if (mode === 'create' || originalClassName !== name) {
        const classes = await api.getClassesBySchoolId(schoolId);
        if (classes.find((c) => c.name === name)) {
          setErrorMessage('Class name already exists.');
          setSaving(false);
          return;
        }
      }

      if (mode === 'edit') {
        const normalizedInviteLink = normalizeWhatsAppInviteLink(
          formValues.whatsapp_invite_link,
        );

        let groupIdToStore = resolvedGroupId; // 👈 default = reuse old

        // 🔁 Only re-resolve if link actually changed
        if (didInviteLinkChange && normalizedInviteLink) {
          try {
            const gId = await api.getGroupIdByInvite(
              normalizedInviteLink,
              whatspAppBotNumber || '',
            );
            const resolvedGroupIdValue = extractGroupIdFromInviteResponse(gId);

            if (!resolvedGroupIdValue) {
              setErrorMessage('Invalid WhatsApp Invite Link.');
              setSaving(false);
              return;
            }

            groupIdToStore = resolvedGroupIdValue;
            setResolvedGroupId(resolvedGroupIdValue);
          } catch (e) {
            logger.error('getGroupIdByInvite failed', e);
            setErrorMessage('Failed to resolve WhatsApp group.');
            setSaving(false);
            return;
          }
        }

        // 🔄 Update class with BOTH values
        await api.updateClass(
          classId!,
          name,
          groupIdToStore, // 👈 group_id (new or reused)
          normalizedInviteLink, // 👈 invite_link (always canonical)
        );
      } else {
        const normalizedInviteLink = normalizeWhatsAppInviteLink(
          formValues.whatsapp_invite_link,
        );
        let groupIdToStore = '';
        if (normalizedInviteLink) {
          try {
            const gId = await api.getGroupIdByInvite(
              normalizedInviteLink,
              whatspAppBotNumber || '',
            );
            const resolvedGroupIdValue = extractGroupIdFromInviteResponse(gId);

            if (!resolvedGroupIdValue) {
              setErrorMessage('Invalid WhatsApp Invite Link.');
              setSaving(false);
              return;
            }

            groupIdToStore = resolvedGroupIdValue;
            setResolvedGroupId(resolvedGroupIdValue);
          } catch (e) {
            logger.error('getGroupIdByInvite failed', e);
            setErrorMessage('Failed to resolve WhatsApp group.');
            setSaving(false);
            return;
          }
        }

        const newClass = await api.createClass(
          schoolId,
          name,
          groupIdToStore, // ✅ now correct
          normalizedInviteLink, // ✅
          gradeId,
          standard,
        );

        classId = newClass.id;
      }
      await api.updateClassCourses(classId!, selectedCourse);
    } catch (e) {
      logger.error('Error:', e);
    } finally {
      setSaving(false);
    }
    if (onSaved) onSaved();
    onClose();
  };
  return (
    <div className="class-form-overlay">
      <div className="class-form-container">
        <ClassFormTitle formValues={formValues} mode={mode} />
        <ClassFormGradeFields
          formValues={formValues}
          handleChange={handleChange}
        />
        <ClassCourseSelector
          allCourses={allCourses}
          dropdownOpen={dropdownOpen}
          dropdownRef={dropdownRef}
          onSelectCourse={handleSelectCourse}
          onToggleDropdown={() => setDropdownOpen((prev) => !prev)}
          placeholder={placeholder}
          selectedCourse={selectedCourse}
        />

        <ClassFormFooterFields
          errorMessage={errorMessage}
          formValues={formValues}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isFormValid={isFormValid}
          loading={loading}
          mode={mode}
          onClose={onClose}
          saving={saving}
        />
      </div>
    </div>
  );
};

export default ClassForm;
