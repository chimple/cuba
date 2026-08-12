import { useSideMenu } from '../../hooks/useSideMenu';
import './SideMenu.css';

const SideMenu = (props: Parameters<typeof useSideMenu>[0]) => {
  const viewProps = useSideMenu(props);

  const {
    ClassSection,
    CommonToggle,
    DialogBoxButtons,
    IonItem,
    IonMenu,
    ProfileSection,
    SchoolSection,
    Util,
    classCode,
    classData,
    currentClassDetail,
    currentClassId,
    currentSchoolDetail,
    email,
    fullName,
    handleClassSelect,
    handleLogoutClick,
    handleManageClassClick,
    handleManageSchoolClick,
    handleSchoolSelect,
    history,
    isAuthorizedForOpsMode,
    isExternalUser,
    menuRef,
    onSignOut,
    openLogoutDialogAfterMenuClose,
    schoolData,
    schoolSearchResetToken,
    setClassCode,
    setIsMenuOpen,
    setOpenLogoutDialogAfterMenuClose,
    setSchoolSearchResetToken,
    setShowDialogBox,
    showDialogBox,
    switchUser,
    t,
  } = viewProps;

  return (
    <>
      <IonMenu
        ref={menuRef}
        aria-label={String(t('Menu'))}
        contentId="main-content"
        id="main-container"
        onIonDidOpen={() => setIsMenuOpen(true)}
        onIonDidClose={() => {
          setIsMenuOpen(false);
          setSchoolSearchResetToken((prev) => prev + 1);
          if (openLogoutDialogAfterMenuClose) {
            setOpenLogoutDialogAfterMenuClose(false);
            setShowDialogBox(true);
          }
        }}
      >
        <div aria-label={String(t('Menu'))} className="side-menu-container">
          <ProfileSection fullName={fullName} email={email} />
          <div className="side-menu-body">
            <SchoolSection
              schoolData={schoolData}
              currentSchoolDetail={currentSchoolDetail}
              handleSchoolSelect={handleSchoolSelect}
              handleManageSchoolClick={handleManageSchoolClick}
              resetTrigger={schoolSearchResetToken}
            />
            <ClassSection
              classData={classData}
              currentClassDetail={currentClassDetail}
              currentClassId={currentClassId}
              classCode={classCode}
              isExternalUser={isExternalUser}
              handleClassSelect={handleClassSelect}
              handleManageClassClick={handleManageClassClick}
              setClassCode={setClassCode}
            />
          </div>
          <div className="side-menu-switch-user-toggle side-menu-kids-toggle">
            <IonItem className="side-menu-ion-item-container">
              <img
                src="assets/icons/userSwitch.svg"
                alt="SCHOOL"
                className="icon"
              />
              <CommonToggle onChange={switchUser} label="Switch to Kids App" />
            </IonItem>
          </div>
          {isAuthorizedForOpsMode && (
            <div className="side-menu-switch-user-toggle">
              <IonItem className="side-menu-ion-item-container">
                <img
                  src="assets/icons/userSwitch.svg"
                  alt="OPS"
                  className="icon"
                />
                <CommonToggle
                  onChange={() => Util.switchToOpsUser(history)}
                  label={t('switch to ops mode') as string}
                />
              </IonItem>
            </div>
          )}
          <div className="teacher-logout-btn" onClick={handleLogoutClick}>
            {t('Logout')}
          </div>

          {/* Logout Confirmation Dialog */}
          <DialogBoxButtons
            width="100%"
            height="20%"
            message={t('Are you sure you want to logout?')}
            showDialogBox={showDialogBox}
            yesText={t('Cancel')}
            noText={t('Logout')}
            handleClose={() => setShowDialogBox(false)}
            onYesButtonClicked={() => setShowDialogBox(false)}
            onNoButtonClicked={onSignOut}
          />
        </div>
      </IonMenu>

      <img
        src="assets/icons/hamburgerMenu.svg"
        alt={String(t('Menu'))}
        id="menu-button"
        className="sidemenu-hamburger"
        onClick={() => menuRef.current?.open()}
      />
    </>
  );
};

export default SideMenu;
