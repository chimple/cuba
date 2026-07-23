import { useHomePage } from '../hooks/useHomePage';
import HomePageTabContent from './HomePageTabContent';
import './HomePage.css';

const HomePage = () => {
  const viewProps = useHomePage();

  const {
    AssignmentQrUnavailableAlert,
    BottomNavigation,
    BottomNavigationAction,
    ClassSummaryInfoPopup,
    Header,
    PAGES,
    autoStartScan,
    classSummaryDateRangeLabel,
    currentClass,
    currentSchool,
    footerTabValue,
    handleChange,
    handleLibraryBack,
    handleShare,
    history,
    isExternalUser,
    isHomeInfoOpen,
    isLibraryTab,
    isOpsUser,
    isTeacherSchoolMode,
    reportState,
    renderKey,
    setAutoStartScan,
    setIsHomeInfoOpen,
    setShowAssignOptionsScreen,
    setShowUnavailableQrAlert,
    setTabValue,
    showAssignOptionsScreen,
    showUnavailableQr,
    showUnavailableQrAlert,
    t,
    tabValue,
  } = viewProps;

  return (
    <div className="main-container" key={renderKey}>
      <AssignmentQrUnavailableAlert
        isOpen={showUnavailableQrAlert}
        onDismiss={() => setShowUnavailableQrAlert(false)}
      />
      <Header
        isBackButton={isLibraryTab}
        showSchool={!isLibraryTab}
        showClass={!isLibraryTab}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
        showSideMenu={!isLibraryTab}
        customText={isLibraryTab ? 'Library' : ''}
        onBackButtonClick={isLibraryTab ? handleLibraryBack : undefined}
        showSearchIcon={isLibraryTab && !isOpsUser}
        onSearchIconClick={
          isLibraryTab ? () => history.replace(PAGES.SEARCH_LESSON) : undefined
        }
        onShareClick={tabValue === 3 ? handleShare : undefined}
        showInfoButton={!isLibraryTab && tabValue === 0}
        onInfoClick={() => setIsHomeInfoOpen(true)}
      />
      <main className="home-container-body">
        <HomePageTabContent
          autoStartScan={autoStartScan}
          currentClass={currentClass}
          history={history}
          reportState={reportState}
          setAutoStartScan={setAutoStartScan}
          setShowAssignOptionsScreen={setShowAssignOptionsScreen}
          setTabValue={setTabValue}
          showAssignOptionsScreen={showAssignOptionsScreen}
          showUnavailableQr={showUnavailableQr}
          tabValue={tabValue}
        />
      </main>
      <ClassSummaryInfoPopup
        isOpen={isHomeInfoOpen}
        onClose={() => setIsHomeInfoOpen(false)}
        dateRangeLabel={classSummaryDateRangeLabel}
      />
      <footer className="container-footer">
        <BottomNavigation
          value={footerTabValue}
          onChange={handleChange}
          className="homepage-bottom-nav"
          showLabels
          style={{ height: '10vh' }}
        >
          <BottomNavigationAction
            value={0}
            label={t('Home')}
            icon={
              <img
                className="footerIcons"
                src={
                  footerTabValue === 0
                    ? 'assets/icons/homeSelected.png'
                    : 'assets/icons/home.png'
                }
                alt=""
              />
            }
          />

          {!isExternalUser && !isTeacherSchoolMode && (
            <BottomNavigationAction
              value={2}
              label={t('Assign')}
              icon={
                <img
                  className="footerIcons"
                  src={
                    footerTabValue === 2
                      ? 'assets/icons/assignmentSelected.png'
                      : 'assets/icons/assignmentfooter.png'
                  }
                  alt=""
                />
              }
              className="middle-action"
            />
          )}
          <BottomNavigationAction
            value={3}
            label={t('Reports')}
            icon={
              <img
                className="footerIcons"
                src={
                  footerTabValue === 3
                    ? 'assets/icons/reportSelected.png'
                    : 'assets/icons/report.png'
                }
                alt=""
              />
            }
          />
          <BottomNavigationAction
            value={4}
            label="AI"
            icon={
              <img
                className="footerIcons"
                src={
                  footerTabValue === 4
                    ? 'assets/icons/aiSelected.png'
                    : 'assets/icons/ai.png'
                }
                alt=""
              />
            }
          />
        </BottomNavigation>
      </footer>
    </div>
  );
};

export default HomePage;
