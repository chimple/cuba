import { useEffect, useState } from 'react';

type Contact = {
  fields: Array<{ value?: string | null }>;
};

type SchoolData = {
  id?: string;
  name?: string | null;
  udise?: string | null;
  model?: string | null;
  group1?: string | null;
  group2?: string | null;
  group3?: string | null;
  group4?: string | null;
  address?: string | null;
  location_link?: string | null;
};

type EditData = {
  schoolData?: SchoolData;
  programData?: { id?: string | null };
};

type UseSchoolFormChangesProps = {
  editData?: EditData;
  program: { id?: string | null } | null;
  fieldCoordinator: { id?: string | null } | null;
  contacts: Contact[];
  schoolName: string;
  udise: string;
  schoolModel: string;
  address: Record<string, string>;
  selectedCourseIds: string[];
  initialSelectedCourseIds: string[] | null;
};

export const useSchoolFormChanges = ({
  editData,
  program,
  fieldCoordinator,
  contacts,
  schoolName,
  udise,
  schoolModel,
  address,
  selectedCourseIds,
  initialSelectedCourseIds,
}: UseSchoolFormChangesProps) => {
  const [initialData, setInitialData] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    if (!editData || !program || fieldCoordinator === null || initialData) {
      return;
    }

    const school = editData.schoolData;
    setInitialData({
      schoolName: school?.name || '',
      udise: school?.udise || '',
      schoolModel: school?.model || '',
      address: {
        state: school?.group1 || '',
        district: school?.group2 || '',
        block: school?.group3 || '',
        cluster: school?.group4 || '',
        address: school?.address || '',
        link: school?.location_link || '',
      },
      programId: editData.programData?.id || null,
      fieldCoordinatorId: fieldCoordinator?.id || null,
      contacts: contacts.map((contact) =>
        contact.fields.map((field) => field.value || ''),
      ),
    });
  }, [editData, program, fieldCoordinator, initialData, contacts]);

  const hasChanges = () => {
    if (!initialData || !initialSelectedCourseIds) return false;

    const schoolDetailsChanged =
      JSON.stringify(initialData) !==
      JSON.stringify({
        schoolName,
        udise,
        schoolModel,
        address,
        programId: program?.id,
        fieldCoordinatorId: fieldCoordinator?.id,
        contacts: contacts.map((contact) =>
          contact.fields.map((field) => field.value || ''),
        ),
      });
    const coursesChanged =
      JSON.stringify(initialSelectedCourseIds) !==
      JSON.stringify([...selectedCourseIds].sort());

    return schoolDetailsChanged || coursesChanged;
  };

  return { hasChanges };
};
