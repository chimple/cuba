import { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

const DEFAULT_COUNTRY = 'INDIA';
const UDISE_LENGTH = 11;
const INVALID_UDISE_MESSAGE = t(
  'Please enter a valid 11-digit UDISE code (use leading zeros if required).',
);

const initialAddress = {
  state: '',
  district: '',
  block: '',
  cluster: '',
  address: '',
  link: '',
};

const buildInitialContacts = () => [
  {
    subheader: t('Contact') + ' 1',
    required: true,
    fields: [
      { label: t('Name'), name: 'name', value: '', required: true },
      { label: t('Phone Number'), name: 'phone', value: '', required: true },
    ],
  },
  {
    subheader: t('Contact') + ' 2',
    fields: [
      { label: t('Name'), name: 'name', value: '' },
      { label: t('Phone Number'), name: 'phone', value: '' },
    ],
  },
];

export const useAddSchoolPage = () => {
  const history = useHistory();
  const location = useLocation();
  const editData: any = location.state;
  const api = ServiceConfig.getI().apiHandler;
  const latestUdiseValue = useRef('');
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [udise, setUdise] = useState('');
  const [schoolModel, setSchoolModel] = useState('');
  const [program, setProgram] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [fieldCoordinator, setFieldCoordinator] = useState<any>(null);
  const [fieldCoordinators, setFieldCoordinators] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockDropdowns, setLockDropdowns] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [address, setAddress] = useState(initialAddress);
  const [contacts, setContacts] = useState(buildInitialContacts);

  useEffect(() => {
    if (!editData) return;

    const school = editData.schoolData;
    setSchoolName(school?.name || '');
    setUdise(school?.udise || '');
    setSchoolModel(school?.model || '');
    setAddress({
      state: school?.group1 || '',
      district: school?.group2 || '',
      block: school?.group3 || '',
      cluster: school?.group4 || '',
      address: school?.address || '',
      link: school?.location_link || '',
    });

    const rawKeyContacts = school?.key_contacts;
    let parsedKeyContacts = [];
    if (rawKeyContacts) {
      try {
        parsedKeyContacts =
          typeof rawKeyContacts === 'string'
            ? JSON.parse(rawKeyContacts)
            : rawKeyContacts;
        if (!Array.isArray(parsedKeyContacts)) parsedKeyContacts = [];
      } catch {
        parsedKeyContacts = [];
      }
    }

    if (parsedKeyContacts.length) {
      setContacts(
        [parsedKeyContacts[0] || {}, parsedKeyContacts[1] || {}].map(
          (contact: any, index: number) => ({
            subheader: `Contact ${index + 1}`,
            required: index === 0,
            fields: [
              {
                label: t('Name'),
                name: 'name',
                value: contact.name || '',
                required: index === 0,
              },
              {
                label: t('Phone Number'),
                name: 'phone',
                value: contact.phone || '',
                required: index === 0,
              },
            ],
          }),
        ),
      );
    }

    setProgram(editData.programData);

    async function fetch() {
      const fcs = await api.getFieldCoordinatorsForSchools([school.id]);
      const fc = fcs[0]?.users[0] || null;
      setFieldCoordinator(fc);
      if (editData.programData && fc) {
        setLockDropdowns(true);
      }
    }
    fetch();
  }, [editData, api]);

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
    if (!initialData) return false;
    return (
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
      })
    );
  };

  const handleAddressChange = (name: string, value: string) => {
    setAddress((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'state') {
        updated.district = '';
        updated.block = '';
        updated.cluster = '';
      }
      if (name === 'district') {
        updated.block = '';
        updated.cluster = '';
      }
      if (name === 'block') {
        updated.cluster = '';
      }
      return updated;
    });
  };

  const handleContactChange = (
    contactIndex: number,
    fieldName: string,
    value: string,
  ) => {
    setContacts((prev) => {
      const updated = [...prev];
      updated[contactIndex].fields = updated[contactIndex].fields.map(
        (field) => (field.name === fieldName ? { ...field, value } : field),
      );
      return updated;
    });
  };

  const isSaveDisabled = () => {
    const isFormValid =
      !!schoolName &&
      udise.length === UDISE_LENGTH &&
      !!schoolModel &&
      !!address.state &&
      !!address.district &&
      !!program &&
      !!fieldCoordinator &&
      !!contacts[0].fields[0].value &&
      !!contacts[0].fields[1].value &&
      contacts[0].fields[1].value?.length === 10 &&
      (contacts[1].fields[1].value?.length === 0 ||
        contacts[1].fields[1].value?.length === 10) &&
      !errorMessage;

    return editData ? !isFormValid || !hasChanges() : !isFormValid;
  };

  const handleUdiseChange = async (value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(0, UDISE_LENGTH);
    latestUdiseValue.current = nextValue;
    setUdise(nextValue);

    if (nextValue && nextValue.length < UDISE_LENGTH) {
      setErrorMessage(INVALID_UDISE_MESSAGE);
      return;
    }

    setErrorMessage('');
    if (nextValue.length !== UDISE_LENGTH) return;

    try {
      const exist = await api.getSchoolDetailsByUdise(nextValue);
      if (latestUdiseValue.current !== nextValue) return;
      if (exist && (!editData || editData.schoolData.udise !== nextValue)) {
        setErrorMessage('A school with this UDISE code already exists.');
        return;
      }
      const res = await api.getSchoolDataByUdise(nextValue);
      if (latestUdiseValue.current !== nextValue) return;

      if (res) {
        if (res.school_name) setSchoolName(res.school_name);
        setAddress((prev) => ({
          ...prev,
          state: res.state || prev.state,
          district: res.district || prev.district,
          block: res.block || prev.block,
          cluster: res.cluster || prev.cluster,
        }));
      }
    } catch (err) {
      logger.error('UDISE fetch error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: DEFAULT_COUNTRY });
        setStates(Array.isArray(data) ? data : []);
      } catch {
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
      try {
        const { data } = await api.getProgramsByRole();
        setPrograms(data || []);
        if (data?.length === 1) setProgram(data[0]);
      } catch {
        setPrograms([]);
      }
      setLoading(false);
    }
    init();
  }, [api]);

  useEffect(() => {
    if (!address.state) {
      setDistricts([]);
      return;
    }
    async function loadDistricts() {
      try {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: DEFAULT_COUNTRY,
          p_state: address.state,
        });
        setDistricts(Array.isArray(data) ? data : []);
      } catch {
        setDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    }
    loadDistricts();
  }, [api, address.state]);

  useEffect(() => {
    if (!address.district) {
      setBlocks([]);
      return;
    }
    async function loadBlocks() {
      try {
        setBlocksLoading(true);
        const data = await api.getGeoData({
          p_country: DEFAULT_COUNTRY,
          p_state: address.state,
          p_district: address.district,
        });
        setBlocks(Array.isArray(data) ? data : []);
      } catch {
        setBlocks([]);
      } finally {
        setBlocksLoading(false);
      }
    }
    loadBlocks();
  }, [api, address.district, address.state]);

  useEffect(() => {
    if (!program?.id) {
      setFieldCoordinators([]);
      setFieldCoordinator(null);
      return;
    }
    async function loadCoordinators() {
      try {
        const fc = await api.getFieldCoordinatorsByProgram(program.id);
        setFieldCoordinators(fc.data || []);
      } catch {
        setFieldCoordinators([]);
      } finally {
        if (!editData) setFieldCoordinator(null);
      }
    }
    loadCoordinators();
  }, [api, editData, program]);

  async function handleApprove() {
    if (udise.length !== UDISE_LENGTH) {
      setErrorMessage(INVALID_UDISE_MESSAGE);
      return;
    }

    const keyContacts = contacts
      .map((contact) => {
        const obj: any = {};
        contact.fields.forEach((field) => {
          obj[field.name] = field.value?.trim() || null;
        });
        return obj;
      })
      .filter((contact) => Object.values(contact).some((value) => value));

    try {
      setIsSaving(true);
      if (editData) {
        await api.updateSchoolProfile(
          editData.schoolData,
          schoolName,
          address.state,
          address.district,
          address.block,
          null,
          address.cluster,
          program.id,
          udise,
          address.address,
        );
        await api.insertSchoolDetails(
          editData.schoolData.id,
          schoolModel,
          address.link,
          keyContacts,
        );
        if (schoolModel == 'at_school' || schoolModel == 'hybrid') {
          await api.createAtSchoolUser(
            editData.schoolData.id,
            schoolName,
            udise,
            RoleType.AUTOUSER,
            true,
          );
        }
        if (!lockDropdowns && schoolModel !== 'at_school') {
          await api.addUserToSchool(
            editData.schoolData.id,
            fieldCoordinator,
            RoleType.FIELD_COORDINATOR,
          );
        }
        await api.computeSchoolMetricsForSchool(editData.schoolData.id);
      } else {
        const school = await api.createSchool(
          schoolName,
          address.state,
          address.district,
          address.block,
          address.cluster,
          null,
          null,
          program.id,
          udise,
          address.address,
          DEFAULT_COUNTRY,
          true,
          false,
        );
        await api.insertSchoolDetails(
          school.id,
          schoolModel,
          address.link,
          keyContacts,
        );
        if (schoolModel == 'at_school' || schoolModel == 'hybrid') {
          await api.createAtSchoolUser(
            school.id,
            schoolName,
            udise,
            RoleType.AUTOUSER,
            true,
          );
        }
        if (schoolModel !== 'at_school') {
          await api.addUserToSchool(
            school.id,
            fieldCoordinator,
            RoleType.FIELD_COORDINATOR,
          );
        }
      }
      history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}`);
    } catch (err) {
      logger.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    address,
    blocks,
    contacts,
    districts,
    editData,
    errorMessage,
    fieldCoordinator,
    fieldCoordinators,
    handleAddressChange,
    handleApprove,
    handleContactChange,
    handleUdiseChange,
    history,
    isBlocksLoading,
    isDistrictsLoading,
    isSaveDisabled,
    isSaving,
    isStatesLoading,
    loading,
    lockDropdowns,
    program,
    programs,
    schoolModel,
    schoolName,
    setFieldCoordinator,
    setProgram,
    setSchoolModel,
    setSchoolName,
    states,
    udise,
  };
};
