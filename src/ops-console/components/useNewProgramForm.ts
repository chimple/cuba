import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useHistory } from 'react-router-dom';
import { PAGES, ProgramType } from '../../common/constants';
import { t } from 'i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

export function useNewProgramForm() {
  const [partners, setPartners] = useState({
    implementation: '',
    funding: '',
    institute: '',
  });
  const [programName, setProgramName] = useState('');
  const [locations, setLocations] = useState({
    Country: '',
    State: '',
    District: '',
  });
  const [programType, setProgramType] = useState<ProgramType | ''>('');
  const [models, setModels] = useState<string[]>([]);
  const [programManagers, setProgramManagers] = useState<
    { name: string; id: string }[]
  >([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [geoData, setGeoData] = useState<{
    Country: string[];
    State: string[];
    District: string[];
  }>({ Country: [], State: [], District: [] });
  const [isCountriesLoading, setCountriesLoading] = useState(false);
  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [stats, setStats] = useState({
    schools: '',
    students: '',
    devices: '',
  });
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{
    [key: string]: boolean;
  }>({});
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [isEditingProgramName, setIsEditingProgramName] = useState(false);
  const programNameInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const getValidationErrors = (): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    if (!partners.implementation.trim())
      newErrors['implementation'] = t('Implementation Partner is required');
    if (!partners.funding.trim())
      newErrors['funding'] = t('Funding Partner is required');
    if (!partners.institute.trim())
      newErrors['institute'] = t('Institute Partner is required');
    if (!programName.trim())
      newErrors['programName'] = t('Program Name is required');
    if (models.length === 0)
      newErrors['model'] = t('At least one model must be selected');
    if (!programType.trim())
      newErrors['programType'] = t('Program Type is required');
    if (!stats.schools) newErrors['schools'] = t('No. of Schools is required');
    if (selectedManagers.length === 0)
      newErrors['programManager'] = t('Program Manager is required');
    if (startDate && endDate && startDate.isAfter(endDate))
      newErrors['date'] = t('Start date must be before End date');
    Object.entries(locations).forEach(([key, value]) => {
      if (['Country', 'State', 'District'].includes(key) && !value) {
        newErrors[`location-${key}`] = t('{{key}} is required', { key });
      }
    });
    return newErrors;
  };

  const validateField = (fieldName: string) => {
    const allErrors = getValidationErrors();
    const newErrors = { ...errors };
    const fieldErrorKeys: { [key: string]: string } = {
      implementation: 'implementation',
      funding: 'funding',
      institute: 'institute',
      programName: 'programName',
      programType: 'programType',
      schools: 'schools',
      programManager: 'programManager',
      Country: 'location-Country',
      State: 'location-State',
      District: 'location-District',
      startDate: 'date',
      endDate: 'date',
      date: 'date',
    };
    const errorKey = fieldErrorKeys[fieldName];
    if (errorKey) {
      if (allErrors[errorKey]) {
        newErrors[errorKey] = allErrors[errorKey];
      } else {
        delete newErrors[errorKey];
      }
    }
    setErrors(newErrors);
  };

  const checkFormValidity = () => {
    const isImplementationValid = partners.implementation.trim() !== '';
    const isFundingValid = partners.funding.trim() !== '';
    const isInstituteValid = partners.institute.trim() !== '';
    const isProgramNameValid = programName.trim() !== '';
    const isModelsValid = models.length > 0;
    const isProgramTypeValid = programType.trim() !== '';
    const isSchoolsValid = stats.schools !== '';
    const isManagersValid = selectedManagers.length > 0;
    const isCountryValid = locations.Country !== '';
    const isStateValid = locations.State !== '';
    const isDistrictValid = locations.District !== '';
    const isDateValid = !startDate || !endDate || !startDate.isAfter(endDate);
    return (
      isImplementationValid &&
      isFundingValid &&
      isInstituteValid &&
      isProgramNameValid &&
      isModelsValid &&
      isProgramTypeValid &&
      isSchoolsValid &&
      isManagersValid &&
      isCountryValid &&
      isStateValid &&
      isDistrictValid &&
      isDateValid
    );
  };

  useEffect(() => {
    setIsFormValid(checkFormValidity());
  }, [
    partners,
    programName,
    programType,
    models,
    selectedManagers,
    stats,
    locations,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!isEditingProgramName) {
      const generated = [
        partners.implementation,
        partners.funding,
        partners.institute,
      ]
        .filter(Boolean)
        .join(' ');
      setProgramName(generated);
    }
  }, [partners, isEditingProgramName]);

  useEffect(() => {
    if (isEditingProgramName && programNameInputRef.current) {
      programNameInputRef.current.focus();
    }
  }, [isEditingProgramName]);

  useEffect(() => {
    if (
      startDate &&
      endDate &&
      (touchedFields['startDate'] || touchedFields['endDate'])
    ) {
      validateField('date');
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchProgramManagers = async () => {
      try {
        const data = await api.getProgramManagers();
        setProgramManagers(data);
      } catch (error) {
        logger.error(error);
      }
    };
    const loadCountries = async () => {
      setCountriesLoading(true);
      const data = await api.getGeoData({});
      setGeoData((prev) => ({ ...prev, Country: data }));
      setCountriesLoading(false);
    };
    fetchProgramManagers();
    loadCountries();
  }, [api]);

  useEffect(() => {
    setLocations((prev) => ({ ...prev, State: '', District: '' }));
    setGeoData((prev) => ({ ...prev, State: [], District: [] }));
    if (locations.Country) {
      const loadStates = async () => {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: locations.Country });
        setGeoData((prev) => ({ ...prev, State: data }));
        setStatesLoading(false);
      };
      loadStates();
    }
  }, [locations.Country, api]);

  useEffect(() => {
    setLocations((prev) => ({ ...prev, District: '' }));
    setGeoData((prev) => ({ ...prev, District: [] }));
    if (locations.Country && locations.State) {
      const loadDistricts = async () => {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: locations.Country,
          p_state: locations.State,
        });
        setGeoData((prev) => ({ ...prev, District: data }));
        setDistrictsLoading(false);
      };
      loadDistricts();
    }
  }, [locations.State, api]);

  const handlePartnerChange = (field: string, value: string) => {
    setPartners((prev) => ({ ...prev, [field]: value }));
  };
  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };
  const handleLocationChange = (field: string, value: string | null) => {
    setLocations((prev) => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      validateField(field);
    }
  };
  const handleModelToggle = (model: string) => {
    setModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };
  const handleStatsChange = (field: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setStats((prev) => ({ ...prev, [field]: value }));
    }
  };
  const validate = () => {
    const allFields = {
      implementation: true,
      funding: true,
      institute: true,
      programName: true,
      programType: true,
      model: true,
      programManager: true,
      Country: true,
      State: true,
      District: true,
      schools: true,
      students: true,
      devices: true,
      startDate: true,
      endDate: true,
      date: true,
    };
    setTouchedFields(allFields);
    const newErrors = getValidationErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const clearForm = () => {
    setPartners({ implementation: '', funding: '', institute: '' });
    setProgramName('');
    setLocations({ Country: '', State: '', District: '' });
    setProgramType(ProgramType.LearningCenter);
    setModels([]);
    setSelectedManagers([]);
    setStats({ schools: '', students: '', devices: '' });
    setStartDate(dayjs());
    setEndDate(dayjs());
    setErrors({});
    setTouchedFields({});
  };
  const handleSave = async () => {
    if (!validate()) return;
    const dataToSave = {
      partners,
      programName,
      locations,
      programType,
      models,
      selectedManagers,
      stats,
      startDate: startDate?.format('YYYY-MM-DD'),
      endDate: endDate?.format('YYYY-MM-DD'),
    };
    try {
      const res = await api.insertProgram(dataToSave);
      if (res) {
        clearForm();
        history.replace(PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE);
      } else {
        logger.error('Error in saving ops program');
      }
    } catch (error) {
      logger.error('Error saving program:', error);
    }
  };
  const navigateToProgramPage = () => {
    clearForm();
    history.replace(PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE);
  };

  return {
    endDate,
    errors,
    geoData,
    handleBlur,
    handleLocationChange,
    handleModelToggle,
    handlePartnerChange,
    handleSave,
    handleStatsChange,
    isCountriesLoading,
    isDistrictsLoading,
    isEditingProgramName,
    isFormValid,
    isStatesLoading,
    locations,
    models,
    navigateToProgramPage,
    partners,
    programManagers,
    programName,
    programNameInputRef,
    programType,
    selectedManagers,
    setEndDate,
    setIsEditingProgramName,
    setProgramName,
    setProgramType,
    setSelectedManagers,
    setStartDate,
    setTouchedFields,
    startDate,
    stats,
    touchedFields,
  };
}
