import { FC, useState, useEffect } from 'react';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  MODES,
  PAGES,
  SearchSchoolsParams,
  STATUS,
  TableTypes,
} from '../../common/constants';

import './SearchSchool.css';
import { t } from 'i18next';
import { useHistory } from 'react-router';
import { schoolUtil } from '../../utility/schoolUtil';
import { parsePath } from 'history';
import SearchSchoolContent from './SearchSchoolContent';

const PAGE_LIMIT = 50;

const SearchSchool: FC = () => {
  const history = useHistory();

  const api = ServiceConfig.getI().apiHandler;
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);

  // State for selected form field values
  const [country, setCountry] = useState<string>();
  const [state, setState] = useState<string>();
  const [district, setDistrict] = useState<string>();
  const [block, setBlock] = useState<string>();
  const [cluster, setCluster] = useState<string>();
  const [searchText, setSearchText] = useState<string>('');

  // State for dropdown options lists
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [clusters, setClusters] = useState<string[]>([]);

  // State for dropdown loading indicators
  const [isCountriesLoading, setCountriesLoading] = useState(false);
  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);
  const [isClustersLoading, setClustersLoading] = useState(false);

  // State for school search results
  const [schools, setSchools] = useState<TableTypes<'school'>[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [isSearchingSchools, setSearchingSchools] = useState(false);
  const [hasMoreSchools, setHasMoreSchools] = useState(true);

  const checkPendingRequests = async () => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      currentUser?.id as string,
    );
    if (existingRequest?.request_status === STATUS.REQUESTED) {
      history.replace({
        ...parsePath(PAGES.POST_SUCCESS),
        state: { tabValue: 0 },
      });
    } else {
      history.replace({
        ...parsePath(PAGES.SEARCH_SCHOOL),
        state: { tabValue: 0 },
      });
    }
  };
  useEffect(() => {
    checkPendingRequests();
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      const data = await api.getGeoData({});
      setCountries(data);
      setCountriesLoading(false);
    };
    loadCountries();
  }, [api]);

  useEffect(() => {
    setState(undefined);
    setStates([]);
    if (country) {
      const loadStates = async () => {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: country });
        setStates(data);
        setStatesLoading(false);
      };
      loadStates();
    }
  }, [country, api]);

  useEffect(() => {
    setDistrict(undefined);
    setDistricts([]);
    if (country && state) {
      const loadDistricts = async () => {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: country,
          p_state: state,
        });
        setDistricts(data);
        setDistrictsLoading(false);
      };
      loadDistricts();
    }
  }, [state, api]);

  useEffect(() => {
    setBlock(undefined);
    setBlocks([]);
    if (state && district) {
      const loadBlocks = async () => {
        setBlocksLoading(true);
        const data = await api.getGeoData({
          p_country: country,
          p_state: state,
          p_district: district,
        });
        setBlocks(data);
        setBlocksLoading(false);
      };
      loadBlocks();
    }
  }, [district, api]);

  useEffect(() => {
    setCluster(undefined);
    setClusters([]);
    if (district && block) {
      const loadClusters = async () => {
        setClustersLoading(true);
        const data = await api.getGeoData({
          p_country: country,
          p_state: state,
          p_district: district,
          p_block: block,
        });
        setClusters(data);
        setClustersLoading(false);
      };
      loadClusters();
    }
  }, [block, api]);

  useEffect(() => {
    if (country && state && district) {
      setSchools([]);
      setPage(1);
      setHasMoreSchools(true);
      setExpandedSchoolId(null);
      fetchSchools(1, true);
    } else {
      setSchools([]);
      setTotalResults(0);
    }
  }, [country, state, district, block, cluster, searchText]);

  const fetchSchools = async (pageNum: number, isNewSearch = false) => {
    setSearchingSchools(true);

    const params: SearchSchoolsParams = {
      p_country: country,
      p_state: state,
      p_district: district,
      p_block: block,
      p_cluster: cluster,
      p_search_text: searchText,
      p_page_limit: PAGE_LIMIT,
      p_page_offset: (pageNum - 1) * PAGE_LIMIT,
    };
    // The API now returns an object: { schools, total_count }
    const result = await api.searchSchools(params);
    const newSchools = result.schools ?? [];

    // Set the total count ONLY on the first search of a new query
    if (isNewSearch) {
      setTotalResults(result.total_count);
    }

    // Determine if there are more pages based on the total count
    if (schools.length + newSchools.length >= result.total_count) {
      setHasMoreSchools(false);
    }

    setSchools((prev) => (isNewSearch ? newSchools : [...prev, ...newSchools]));
    setSearchingSchools(false);
  };

  const loadMoreSchools = (event: any) => {
    const nextPage = page + 1;
    fetchSchools(nextPage).finally(() => {
      setPage(nextPage);
      event.target.complete();
    });
  };

  const clearSearchText = () => setSearchText('');

  const handleToggleSchool = (schoolId: string) => {
    setExpandedSchoolId((prevId) => (prevId === schoolId ? null : schoolId));
  };

  const switchUser = () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  const handleJoinSchool = (selectedSchool: TableTypes<'school'>) => {
    history.push({
      pathname: PAGES.JOIN_SCHOOL,
      state: { school: selectedSchool },
    });
  };

  return (
    <SearchSchoolContent
      block={block ?? ''}
      blocks={blocks}
      clearSearchText={clearSearchText}
      cluster={cluster ?? ''}
      clusters={clusters}
      countries={countries}
      country={country ?? ''}
      district={district ?? ''}
      districts={districts}
      expandedSchoolId={expandedSchoolId}
      handleJoinSchool={handleJoinSchool}
      handleToggleSchool={handleToggleSchool}
      hasMoreSchools={hasMoreSchools}
      isBlocksLoading={isBlocksLoading}
      isClustersLoading={isClustersLoading}
      isCountriesLoading={isCountriesLoading}
      isDistrictsLoading={isDistrictsLoading}
      isSearchingSchools={isSearchingSchools}
      isStatesLoading={isStatesLoading}
      loadMoreSchools={loadMoreSchools}
      schools={schools}
      searchText={searchText}
      setBlock={setBlock}
      setCluster={setCluster}
      setCountry={setCountry}
      setDistrict={setDistrict}
      setSearchText={setSearchText}
      setState={setState}
      state={state ?? ''}
      states={states}
      switchUser={switchUser}
      t={t}
      totalResults={totalResults}
    />
  );
};
export default SearchSchool;
