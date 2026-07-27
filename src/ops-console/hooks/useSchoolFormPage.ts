import { useEffect, useState } from 'react';
import { RoleType } from '../../interface/modelInterfaces';
import { PAGES, STATUS } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

const initialAddress = {
  state: '',
  district: '',
  block: '',
  address: '',
};

const initialContacts = [
  {
    subheader: 'Contact 1',
    required: true,
    fields: [
      {
        label: 'Name',
        name: 'name',
        value: '',
        required: true,
        disabled: true,
      },
      {
        label: 'Phone Number',
        name: 'phone',
        value: '',
        required: true,
        disabled: true,
      },
    ],
  },
  {
    subheader: 'Contact 2',
    fields: [
      { label: 'Name', name: 'name', value: '' },
      { label: 'Phone Number', name: 'phone', value: '' },
    ],
  },
];

export const useSchoolFormPage = ({
  id,
  locationState,
  history,
}: {
  id: string;
  locationState: unknown;
  history: any;
}) => {
  const [requestData, setRequestData] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [fieldCoordinator, setFieldCoordinator] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [fieldCoordinators, setFieldCoordinators] = useState<any[]>([]);
  const [address, setAddress] = useState(initialAddress);
  const [contacts, setContacts] = useState(initialContacts);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        const state = locationState as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
          setSchool(state.request.school);
          setUser(state.request.requestedBy);
        }

        if (programs.length === 0) {
          const { data } = await api.getProgramsByRole();
          setPrograms(data || []);
          if ((data || []).length === 1) {
            setProgram(data[0]);
          }
        }

        if (program?.id) {
          const fcRes = await api.getFieldCoordinatorsByProgram(program.id);
          setFieldCoordinators(fcRes.data || []);
          setFieldCoordinator(null);
        } else {
          setFieldCoordinators([]);
          setFieldCoordinator(null);
        }
      } catch (error) {
        logger.error('Error initializing form:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [id, api, locationState, program, programs.length]);

  useEffect(() => {
    if (user) {
      setContacts((prev) => {
        const updated = [...prev];
        updated[0].fields = updated[0].fields.map((f) =>
          f.name === 'name'
            ? { ...f, value: user.name || '' }
            : f.name === 'phone'
              ? { ...f, value: user.phone || '' }
              : f,
        );
        return updated;
      });
    }

    if (school) {
      setAddress({
        state: school.group1 || '',
        district: school.group2 || '',
        block: school.group3 || '',
        address: school.address || '',
      });
    }
  }, [user, school]);

  function handleContactChange(
    contactIndex: number,
    fieldName: string,
    value: string,
  ) {
    setContacts((prev) => {
      const updated = [...prev];
      updated[contactIndex].fields = updated[contactIndex].fields.map((f) =>
        f.name === fieldName ? { ...f, value } : f,
      );
      return updated;
    });
  }

  function handleAddressChange(name: string, value: string) {
    setAddress((prev) => ({ ...prev, [name]: value }));
  }

  const isSaveDisabled = () =>
    !address.state?.trim() ||
    !address.district?.trim() ||
    !address.block?.trim() ||
    !program ||
    !fieldCoordinator;

  async function handleApprove() {
    try {
      let keyContacts = contacts.map((c) => {
        const obj: any = {};
        c.fields.forEach((f) => {
          obj[f.name] = f.value?.trim() || null;
        });
        return obj;
      });

      keyContacts = keyContacts.filter((c) =>
        Object.values(c).some((v) => v !== null && v !== ''),
      );

      await api.updateSchoolProgram(school.id, program.id);

      await Promise.all([
        api.updateSchoolStatus(
          requestData.school.id,
          STATUS.ACTIVE,
          {
            state: address.state,
            district: address.district,
            block: address.block,
            address: address.address,
          },
          keyContacts,
        ),
        api.addUserToSchool(
          school.id,
          fieldCoordinator,
          RoleType.FIELD_COORDINATOR,
        ),
        api.addUserToSchool(school.id, user, RoleType.PRINCIPAL),
        api.respondToSchoolRequest(
          requestData.id,
          requestData.respondedBy.id,
          STATUS.APPROVED,
        ),
      ]);
      await api.computeSchoolMetricsForSchool(school.id);

      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`);
    } catch (error) {
      logger.error('Error saving school:', error);
    }
  }

  return {
    address,
    contacts,
    fieldCoordinator,
    fieldCoordinators,
    handleAddressChange,
    handleApprove,
    handleContactChange,
    isSaveDisabled,
    loading,
    program,
    programs,
    school,
    setFieldCoordinator,
    setProgram,
  };
};
