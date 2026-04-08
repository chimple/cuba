import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/react';
import { IconType, PAGES, TableTypes } from '../../common/constants';
import { useHistory } from 'react-router-dom';
import { ServiceConfig } from '../../services/ServiceConfig';
import { RoleType } from '../../interface/modelInterfaces';
import Header from '../components/homePage/Header';
import './ManageSchools.css';
import { t } from 'i18next';
import DetailList from '../components/schoolComponent/DetailList';
import { Util } from '../../utility/util';
import DetailListHeader from '../components/schoolComponent/DetailListHeader';
import Loading from '../../components/Loading';
import logger from '../../utility/logger';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';

const PAGE_SIZE = 20;

let isManagerOrDirector = false;
interface SchoolWithRole {
  school: TableTypes<'school'>;
  role: RoleType;
}

const ManageSchools: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TableTypes<'user'> | null>(
    null,
  );
  const [allSchools, setAllSchools] = useState<SchoolWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<SchoolWithRole[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const history = useHistory();
  const api = ServiceConfig.getI()?.apiHandler;
  const auth = ServiceConfig.getI()?.authHandler;
  const { isOpsUser } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );

  const init = async () => {
    try {
      setIsLoading(true);
      const user = await auth.getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setCurrentUser(user);

      const school = await Util.getCurrentSchool();

      if (school) {
        isManagerOrDirector = await api.checkUserIsManagerOrDirector(
          school.id,
          user.id,
        );
      }

      const fetchedSchools = await api.getSchoolsForUser(user.id, {
        page: 1,
        page_size: PAGE_SIZE,
      });

      if (fetchedSchools) {
        setAllSchools(fetchedSchools);
        setPage(1);
        if (fetchedSchools.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (error) {
      logger.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreSchools = async (event: any) => {
    if (isLoading || !hasMore || !currentUser) {
      event.target.complete();
      return;
    }

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const newSchools = await api.getSchoolsForUser(currentUser.id, {
        page: nextPage,
        page_size: PAGE_SIZE,
      });

      if (newSchools && newSchools.length > 0) {
        setAllSchools((prevSchools) => [...prevSchools, ...newSchools]);
        setPage(nextPage);
        if (newSchools.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more schools:', error);
    } finally {
      setIsLoading(false);
      event.target.complete();
    }
  };

  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, {
      tabValue: 0,
    });
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const runSearch = async () => {
      const query = searchQuery.trim();
      if (!query || !isOpsUser) {
        const filtered = allSchools.filter((item) =>
          item.school.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        if (!isCancelled) {
          setFilteredSchools(filtered);
          setIsSearchLoading(false);
        }
        return;
      }

      if (!currentUser?.id) return;

      if (!isCancelled) {
        setIsSearchLoading(true);
      }
      try {
        const searchedSchools = await api.getSchoolsForUserBySearchTerm(
          currentUser.id,
          query,
        );
        if (!isCancelled) {
          setFilteredSchools(searchedSchools);
        }
      } catch (error) {
        logger.error('Error searching schools from Supabase:', error);
        if (!isCancelled) {
          setFilteredSchools([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchLoading(false);
        }
      }
    };

    runSearch();
    return () => {
      isCancelled = true;
    };
  }, [allSchools, searchQuery, currentUser?.id, isOpsUser]);

  return (
    <IonPage className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          onSearchChange={setSearchQuery}
        />
      </div>
      <div className="school-div">{t('Schools')}</div>
      {!((isLoading || isSearchLoading) && allSchools.length === 0) && (
        <DetailListHeader />
      )}
      <IonContent className="content-background">
        {(isLoading || isSearchLoading) && allSchools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loading isLoading={true} />
          </div>
        ) : (
          <>
            <div className="school-list">
              <DetailList data={filteredSchools} type={IconType.SCHOOL} />
            </div>

            <IonInfiniteScroll
              onIonInfinite={loadMoreSchools}
              threshold="100px"
              disabled={!hasMore || (!!searchQuery.trim() && isOpsUser)}
            >
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText={t('Loading more schools...') as string}
              ></IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ManageSchools;
