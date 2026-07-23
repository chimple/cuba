import { useDisplaySchools } from '../hooks/useDisplaySchools';
import './DisplaySchools.css';

const DisplaySchools = () => {
  const viewProps = useDisplaySchools();

  const {
    CommonToggle,
    Header,
    IonFabButton,
    IonIcon,
    IonPage,
    Loading,
    PAGES,
    PiUserSwitchFill,
    Util,
    addOutline,
    hasMore,
    history,
    isAuthorizedForOpsMode,
    loading,
    parsePath,
    schoolList,
    scrollRef,
    selectSchool,
    switchUser,
    t,
  } = viewProps;

  return (
    <IonPage className="display-page">
      {!loading && (
        <>
          <Header
            isBackButton={false}
            disableBackButton={true}
            customText="Select School"
            showStreakButton={false}
          />
          <div className="display-user-switch-user-toggle">
            <div className="display-school-switch-text">
              <PiUserSwitchFill className="display-user-user-switch-icon" />
              <CommonToggle onChange={switchUser} label="Switch to Kids App" />
            </div>
            {isAuthorizedForOpsMode && (
              <div className="display-schools-toggle-ops-switch-text">
                <PiUserSwitchFill className="display-user-user-switch-icon" />
                <CommonToggle
                  onChange={() => Util.switchToOpsUser(history)}
                  label={t('Switch to Ops Mode').toString()}
                />
              </div>
            )}
          </div>
          <hr className="display-school-horizontal-line" />
          {schoolList.length === 0 && !loading ? (
            <div className="no-schools-container">
              <div className="create-school-button">
                <IonFabButton
                  onClick={() =>
                    history.replace({
                      ...parsePath(PAGES.REQ_ADD_SCHOOL),
                      state: {
                        origin: PAGES.DISPLAY_SCHOOLS,
                      },
                    })
                  }
                >
                  <IonIcon icon={addOutline} />
                </IonFabButton>
                <div className="create-new-school-text">
                  {t('Create New School')}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="all-school-display-container display-all-schools-scroll"
              ref={scrollRef}
              style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}
            >
              <div className="all-school-display">
                {schoolList.map((school) => (
                  <div
                    key={school.school.id}
                    onClick={() => selectSchool(school)}
                  >
                    <div className="display-school-single-school">
                      <div className="display-school-image">
                        <img
                          className="school-image-p"
                          src={school.school.image ?? 'assets/icons/school.png'}
                          alt=""
                        />
                      </div>
                      <div className="display-school-name">
                        {school.school.name}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="display-loading-text">{t('Loading...')}</div>
                )}
                {!hasMore && schoolList.length > 0 && (
                  <div className="display-no-more-schools">
                    {t('No more schools')}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <Loading isLoading={loading} />
    </IonPage>
  );
};

export default DisplaySchools;
