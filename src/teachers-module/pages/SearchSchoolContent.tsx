import {
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { chevronDownOutline, close, searchOutline } from 'ionicons/icons';
import { TFunction } from 'i18next';
import { TableTypes } from '../../common/constants';
import Header from '../components/homePage/Header';
import SchoolListItem from '../components/SchoolListItem';
import CreateSchoolPrompt from '../components/CreateSchoolPrompt';

interface SearchSchoolContentProps {
  block: string;
  blocks: string[];
  clearSearchText: () => void;
  cluster: string;
  clusters: string[];
  countries: string[];
  country: string;
  district: string;
  districts: string[];
  expandedSchoolId: string | null;
  handleJoinSchool: (selectedSchool: TableTypes<'school'>) => void;
  handleToggleSchool: (schoolId: string) => void;
  hasMoreSchools: boolean;
  isBlocksLoading: boolean;
  isClustersLoading: boolean;
  isCountriesLoading: boolean;
  isDistrictsLoading: boolean;
  isSearchingSchools: boolean;
  isStatesLoading: boolean;
  loadMoreSchools: (event: any) => void;
  schools: TableTypes<'school'>[];
  searchText: string;
  setBlock: (value: string) => void;
  setCluster: (value: string) => void;
  setCountry: (value: string) => void;
  setDistrict: (value: string) => void;
  setSearchText: (value: string) => void;
  setState: (value: string) => void;
  state: string;
  states: string[];
  switchUser: () => void;
  t: TFunction;
  totalResults: number;
}

const SearchSchoolContent = ({
  block,
  blocks,
  clearSearchText,
  cluster,
  clusters,
  countries,
  country,
  district,
  districts,
  expandedSchoolId,
  handleJoinSchool,
  handleToggleSchool,
  hasMoreSchools,
  isBlocksLoading,
  isClustersLoading,
  isCountriesLoading,
  isDistrictsLoading,
  isSearchingSchools,
  isStatesLoading,
  loadMoreSchools,
  schools,
  searchText,
  setBlock,
  setCluster,
  setCountry,
  setDistrict,
  setSearchText,
  setState,
  state,
  states,
  switchUser,
  t,
  totalResults,
}: SearchSchoolContentProps) => {
  const renderDropdown = (
    placeholderKey: string,
    value: string,
    setValue: (val: string) => void,
    options: string[],
    isLoading: boolean,
    required = false,
    disabled = false,
  ) => (
    <div className={`search-school-field-wrapper ${required ? 'required' : ''}`}>
      <IonItem lines="none" className="search-school-item">
        {isLoading ? (
          <IonSpinner name="dots" className="search-school-spinner" />
        ) : (
          <>
            <IonSelect
              value={value}
              placeholder={t(placeholderKey) as string}
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
        <div className="search-school-fixed-top-area">
          <h1 className="search-school-title">{t('Search Your School')}</h1>
          <p className="search-school-required-text">
            <span className="search-school-asterisk">*</span>
            {t('Required Fields')}
          </p>
          <div className="search-school-form">
            <div className="search-school-row">
              {renderDropdown('Country', country, setCountry, countries, isCountriesLoading, true)}
              {renderDropdown('State', state, setState, states, isStatesLoading, true, !country)}
              {renderDropdown('District', district, setDistrict, districts, isDistrictsLoading, true, !state)}
            </div>
            <div className="search-school-row">
              {renderDropdown('Block', block, setBlock, blocks, isBlocksLoading, false, !district)}
              {renderDropdown('Cluster', cluster, setCluster, clusters, isClustersLoading, false, !block)}
            </div>
          </div>
          <div className="search-school-input-container">
            <IonItem
              disabled={country && state && district ? false : true}
              lines="none"
              className="search-school-item"
            >
              <IonIcon icon={searchOutline} slot="start" />
              <IonInput
                value={searchText}
                placeholder={t('School Name or UDISE') as string}
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
                {t('Found {{count}} results..', { count: totalResults })}
              </h3>
              <p className="search-school-refine-results-text">
                {t('Refine your results using filters or by rephrasing your school name')}
              </p>
            </div>
          )}
        </div>
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
              loadingText={t('Loading more schools...') as string}
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

export default SearchSchoolContent;
