import React from 'react';
import './Leaderboard.css';
import { IonPage } from '@ionic/react';
import { AppBar, Box, Tab, Tabs } from '@mui/material';
import { t } from 'i18next';
import {
  LEADERBOARDHEADERLIST,
  PAGES,
} from '../common/constants';
import { Util } from '../utility/util';
import LeaderboardRewards from '../components/leaderboard/LeaderboardRewards';
import SkeltonLoading from '../components/SkeltonLoading';
import DialogBoxButtons from '../components/parent/DialogBoxButtons';
import DebugMode from '../teachers-module/components/DebugMode';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { useLeaderboardPage } from '../hooks/useLeaderboardPage';
import { useHistory } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const leaderboard = useLeaderboardPage();
  const history = useHistory();

  return (
    <IonPage>
      {!leaderboard.isLoading ? (
        <Box>
          <div
            id={
              leaderboard.tabIndex === 'debugMode'
                ? 'leaderboard-debug-mode'
                : 'LeaderBoard-Header'
            }
          >
            {leaderboard.tabIndex !== 'debugMode' && (
              <div id="back-button-in-LeaderBoard-Header">
                <img
                  src="/assets/icons/BackButtonIcon.svg"
                  alt="BackButtonIcon"
                  onClick={() => {
                    Util.setPathToBackButton(PAGES.HOME, history);
                  }}
                />
              </div>
            )}
            <Box>
              <AppBar id="LeaderBoard-AppBar" position="static">
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Tabs
                    value={leaderboard.tabIndex}
                    onChange={leaderboard.handleChange}
                    textColor="secondary"
                    indicatorColor="secondary"
                    aria-label="secondary tabs example"
                    sx={{
                      minWidth: 'max-content',
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#000000 !important',
                        bottom: '15% !important',
                        display: 'flex',
                        justifyContent: 'center',
                      },
                      '& .MuiTab-root': { color: '#000000 !important' },
                      '& .Mui-selected': { color: '#000000 !important' },
                    }}
                  >
                    {!leaderboard.isRewardPage && (
                      <Tab
                        value={LEADERBOARDHEADERLIST.LEADERBOARD}
                        label={t(LEADERBOARDHEADERLIST.LEADERBOARD)}
                        id="leaderboard-page-tab-bar"
                        onClick={leaderboard.handleLeaderboardClick}
                      />
                    )}
                    {leaderboard.isRewardPage && (
                      <Tab
                        id="leaderboard-page-tab-bar"
                        value={LEADERBOARDHEADERLIST.REWARDS}
                        label={t(LEADERBOARDHEADERLIST.REWARDS)}
                      />
                    )}
                    {leaderboard.showDebug && (
                      <Tab
                        id="leaderboard-page-tab-bar"
                        value="debugMode"
                        label={t('debugMode')}
                      />
                    )}
                  </Tabs>
                </Box>
              </AppBar>
            </Box>
            {leaderboard.showDialogBox && (
              <DialogBoxButtons
                width={'40vw'}
                height={'30vh'}
                message={t('Do you want to Open Debug Mode?')}
                showDialogBox={true}
                yesText={t('Cancel')}
                noText={t('debugMode')}
                handleClose={leaderboard.closeDebugDialog}
                onYesButtonClicked={leaderboard.closeDebugDialog}
                onNoButtonClicked={leaderboard.openDebugMode}
              />
            )}
            {leaderboard.tabIndex === 'debugMode' && (
              <Box>
                <DebugMode />
              </Box>
            )}
            <div
              id="leaderboard-switch-user-button"
              onClick={leaderboard.switchProfile}
            >
              <img
                id="leaderboard-switch-user-button-img"
                alt={'/assets/icons/UserSwitchIcon.svg'}
                src={'/assets/icons/UserSwitchIcon.svg'}
              />
              <p className="leaderboard-switch-text">{t('Switch Profile')}</p>
            </div>
          </div>
          <Box sx={{}}>
            {leaderboard.tabIndex === LEADERBOARDHEADERLIST.LEADERBOARD && (
              <Box>
                <div>
                  <LeaderboardTable
                    currentClassAndSchool={leaderboard.currentClassAndSchool}
                    currentStudent={leaderboard.currentStudent}
                    currentUserDataContent={leaderboard.currentUserDataContent}
                    fetchLeaderBoardData={leaderboard.fetchLeaderBoardData}
                    leaderboardData={leaderboard.leaderboardData}
                    setWeeklySelectedValue={leaderboard.setWeeklySelectedValue}
                    studentMode={leaderboard.studentMode}
                    weeklyList={leaderboard.weeklyList}
                    weeklySelectedValue={leaderboard.weeklySelectedValue}
                  />
                </div>
              </Box>
            )}

            {leaderboard.tabIndex === LEADERBOARDHEADERLIST.REWARDS && (
              <Box>
                <LeaderboardRewards />
              </Box>
            )}
          </Box>
        </Box>
      ) : null}
      <SkeltonLoading
        isLoading={leaderboard.isLoading}
        header={LEADERBOARDHEADERLIST.LEADERBOARD}
      />
    </IonPage>
  );
};

export default Leaderboard;
