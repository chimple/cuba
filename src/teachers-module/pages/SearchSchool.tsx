import { FC, useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonInput,
  IonIcon,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import {
  searchOutline,
  close,
  helpCircleOutline,
  chevronDownOutline,
  arrowBack,
} from "ionicons/icons";
import { ServiceConfig } from "../../services/ServiceConfig";
import NoSchoolsFound from "../components/NoSchoolsFound";
import SchoolListItem from "../components/SchoolListItem";
import {
  MODES,
  PAGES,
  SearchSchoolsParams,
  STATUS,
  TableTypes,
} from "../../common/constants";

import "./SearchSchool.css";
import CreateSchoolPrompt from "../components/CreateSchoolPrompt";
import { t } from "i18next";
import { useHistory } from "react-router";
import { schoolUtil } from "../../utility/schoolUtil";
import { Capacitor } from "@capacitor/core";
import Header from "../components/homePage/Header";

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
  const [searchText, setSearchText] = useState<string>("");

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
  const [schools, setSchools] = useState<TableTypes<"school">[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [isSearchingSchools, setSearchingSchools] = useState(false);
  const [hasMoreSchools, setHasMoreSchools] = useState(true);

  const checkPendingRequests = async () => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      currentUser?.id as string
    );
    if (existingRequest?.request_status === STATUS.REQUESTED) {
      history.replace(PAGES.POST_SUCCESS, { tabValue: 0 });
    } else {
      history.replace(PAGES.SEARCH_SCHOOL, { tabValue: 0 });
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

  const clearSearchText = () => setSearchText("");

  const handleToggleSchool = (schoolId: string) => {
    setExpandedSchoolId((prevId) => (prevId === schoolId ? null : schoolId));
  };

  const switchUser = () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  const handleJoinSchool = (selectedSchool: TableTypes<"school">) => {
    history.push({
      pathname: PAGES.JOIN_SCHOOL,
      state: { school: selectedSchool },
    });
  };

  const renderDropdown = (
    placeholderKey: string,
    value: any,
    setValue: (val: any) => void,
    options: string[],
    isLoading: boolean,
    required = false,
    disabled = false
  ) => (
    <div
      className={`search-school-field-wrapper ${required ? "required" : ""}`}
    >
      <IonItem lines="none" className="search-school-item">
        {isLoading ? (
          <IonSpinner name="dots" className="search-school-spinner" />
        ) : (
          <>
            <IonSelect
              value={value}
              placeholder={t(placeholderKey) as string} // <-- Add 'as string'
              onIonChange={(e) => setValue(e.detail.value)}
              interface="popover"
              className="search-school-select"
              disabled={disabled || isLoading}
            >
              {options.map((opt) => (
                <IonSelectOption key={opt} value={opt}>
                  {opt}
                </IonSelectOption>
              ))}
            </IonSelect>
            <IonIcon
              icon={chevronDownOutline}
              className="search-school-dropdown-arrow-icon"
            />
          </>
        )}
      </IonItem>
    </div>
  );

  const showCreateSchoolPrompt =
    !isSearchingSchools &&
    country &&
    state &&
    district &&
    (schools.length === 0 || !hasMoreSchools);

  return (
    <IonPage className="search-school-page">
      <IonHeader mode="ios">
        <IonToolbar>
          <Header isBackButton={true} onBackButtonClick={switchUser} />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Fixed top area */}
        <div className="search-school-fixed-top-area">
          <h1 className="search-school-title">{t("Search Your School")}</h1>
          <p className="search-school-required-text">
            <span className="search-school-asterisk">*</span>
            {t("Required Fields")}
          </p>

          <div className="search-school-form">
            <div className="search-school-row">
              {renderDropdown(
                "Country",
                country,
                setCountry,
                countries,
                isCountriesLoading,
                true
              )}
              {renderDropdown(
                "State",
                state,
                setState,
                states,
                isStatesLoading,
                true,
                !country
              )}
              {renderDropdown(
                "District",
                district,
                setDistrict,
                districts,
                isDistrictsLoading,
                true,
                !state
              )}
            </div>
            <div className="search-school-row">
              {renderDropdown(
                "Block",
                block,
                setBlock,
                blocks,
                isBlocksLoading,
                false,
                !district
              )}
              {renderDropdown(
                "Cluster",
                cluster,
                setCluster,
                clusters,
                isClustersLoading,
                false,
                !block
              )}
            </div>
          </div>

          <div className="search-school-input-container">
            <IonItem disabled={(country && state && district)? false : true} lines="none" className="search-school-item">
              <IonIcon icon={searchOutline} slot="start" />
              <IonInput
                value={searchText}
                placeholder={t("School Name or UDISE") as string}
                onIonChange={(e) => setSearchText(e.detail.value!)}
              />
              {searchText && (
                <IonIcon
                  icon={close}
                  slot="end"
                  className="search-school-clear-icon"
                  onClick={clearSearchText}
                />
              )}
            </IonItem>
          </div>

          {totalResults > 0 && (
            <div className="search-school-results-summary">
              <h3 className="search-school-found-results-text">
                {t("Found {{count}} results..", { count: totalResults })}
              </h3>
              <p className="search-school-refine-results-text">
                {t(
                  "Refine your results using filters or by rephrasing your school name"
                )}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable list area */}
        {isSearchingSchools && schools.length === 0 && (
          <div className="search-school-center-message">
            <IonSpinner />
          </div>
        )}

        {schools.length > 0 && (
          <IonList className="search-school-results-list-cards" lines="none">
            {schools.map((school) => (
              <SchoolListItem
                key={school.id}
                school={school}
                isExpanded={expandedSchoolId === school.id}
                onToggle={() => handleToggleSchool(school.id)}
                onJoin={handleJoinSchool}
                searchText={searchText}
              />
            ))}
          </IonList>
        )}

        {schools.length > 0 && hasMoreSchools && (
          <IonInfiniteScroll
            onIonInfinite={loadMoreSchools}
            threshold="200px"
            disabled={!hasMoreSchools || isSearchingSchools}
          >
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText={t("Loading more schools...") as string}
            />
          </IonInfiniteScroll>
        )}

        {showCreateSchoolPrompt && (
          <CreateSchoolPrompt
            country={country}
            state={state}
            district={district}
            block={block}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default SearchSchool;
