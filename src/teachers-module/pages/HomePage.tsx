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
    ScoreCalculationPopup,
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
    isScoreCalculationOpen,
    isLibraryTab,
    isOpsUser,
    isTeacherSchoolMode,
    reportState,
    renderKey,
    setAutoStartScan,
    setIsHomeInfoOpen,
    setIsScoreCalculationOpen,
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
        customText={
          isLibraryTab ? 'Library' : tabValue === 4 ? 'My Leaderboard' : ''
        }
        onBackButtonClick={isLibraryTab ? handleLibraryBack : undefined}
        showSearchIcon={isLibraryTab && !isOpsUser}
        onSearchIconClick={
          isLibraryTab ? () => history.replace(PAGES.SEARCH_LESSON) : undefined
        }
        onShareClick={tabValue === 3 ? handleShare : undefined}
        showInfoButton={!isLibraryTab && (tabValue === 0 || tabValue === 4)}
        onInfoClick={() => {
          // The shared header icon opens information for the currently active tab.
          if (tabValue === 4) {
            setIsScoreCalculationOpen(true);
            return;
          }
          setIsHomeInfoOpen(true);
        }}
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
      <ScoreCalculationPopup
        isOpen={isScoreCalculationOpen}
        onClose={() => setIsScoreCalculationOpen(false)}
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
              footerTabValue === 0 ? (
                <img
                  className="footerIcons"
                  src="assets/icons/homeSelected.png"
                  alt=""
                />
              ) : (
                <img
                  className="footerIcons"
                  src="assets/icons/home.png"
                  alt=""
                />
              )
            }
            className="bottom-nav-action"
          />

          {!isExternalUser && !isTeacherSchoolMode && (
            <BottomNavigationAction
              value={2}
              label={t('Assign')}
              icon={
                footerTabValue === 2 ? (
                  <img
                    className="footerIcons"
                    src="assets/icons/assignmentSelected.png"
                    alt=""
                  />
                ) : (
                  <img
                    className="footerIcons"
                    src="assets/icons/assignmentfooter.png"
                    alt=""
                  />
                )
              }
              className="bottom-nav-action middle-action"
            />
          )}
          <BottomNavigationAction
            value={3}
            label={t('Reports')}
            icon={
              footerTabValue === 3 ? (
                <img
                  className="footerIcons"
                  src="assets/icons/reportSelected.png"
                  alt=""
                />
              ) : (
                <img
                  className="footerIcons"
                  src="assets/icons/report.png"
                  alt=""
                />
              )
            }
            className="bottom-nav-action"
          />
          <BottomNavigationAction
            value={4}
            label={t('Leaderboard')}
            icon={
              // Keep selected and unselected leaderboard states consistent with other tabs.
              <img
                className="footerIcons"
                src={
                  footerTabValue === 4
                    ? '/assets/icons/leaderboard-selected.svg'
                    : '/assets/icons/leaderboard.svg'
                }
                alt=""
              />
            }
            className="bottom-nav-action"
          />
        </BottomNavigation>
      </footer>
    </div>
  );
};

export default HomePage;
