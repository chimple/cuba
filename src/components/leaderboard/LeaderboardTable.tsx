import { IonCol, IonRow } from '@ionic/react';
import { t } from 'i18next';
import {
  AVATARS,
  COURSES,
  LeaderboardDropdownList,
  MODES,
  TableTypes,
} from '../../common/constants';
import DropDown from '../DropDown';

type LeaderboardTableProps = {
  currentClassAndSchool?: {
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  };
  currentStudent?: TableTypes<'user'>;
  currentUserDataContent: string[][];
  fetchLeaderBoardData: (
    currentStudent: TableTypes<'user'>,
    leaderboardDropdownType: LeaderboardDropdownList,
    classId: string,
  ) => Promise<void>;
  leaderboardData: any[][];
  setWeeklySelectedValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  studentMode?: string;
  weeklyList: {
    id: string;
    displayName: string;
    type: LeaderboardDropdownList;
  }[];
  weeklySelectedValue?: string;
};

const LeaderboardTable = ({
  currentClassAndSchool,
  currentStudent,
  currentUserDataContent,
  fetchLeaderBoardData,
  leaderboardData,
  setWeeklySelectedValue,
  studentMode,
  weeklyList,
  weeklySelectedValue,
}: LeaderboardTableProps) => {
  let headerRowIndicator = -1;
  let currentUserHeaderRowIndicator = -1;

  return (
    <div id="leaderboard-UI">
      <div id="leaderboard-left-UI">
        <DropDown
          placeholder={weeklySelectedValue || weeklyList[0]?.displayName}
          optionList={weeklyList}
          currentValue={weeklySelectedValue || weeklyList[0]?.id}
          width="26vw"
          onValueChange={(selectedValue) => {
            const selectedIndex =
              typeof selectedValue === 'number'
                ? selectedValue
                : Number(selectedValue);
            const selectedWeek = Number.isNaN(selectedIndex)
              ? weeklyList.find((week) => week.id === selectedValue)
              : weeklyList[selectedIndex];
            if (selectedWeek?.displayName != undefined) {
              setWeeklySelectedValue(selectedWeek.id);
              fetchLeaderBoardData(
                currentStudent!,
                selectedWeek.type ?? LeaderboardDropdownList.WEEKLY,
                currentClassAndSchool?.classes[0].id || '',
              );
            }
          }}
        ></DropDown>
        <div key={currentStudent?.id} className="avatar" id="leaderboard-avatar">
          <img
            className="leaderboard-avatar-img"
            src={
              (studentMode === MODES.SCHOOL && currentStudent?.image) ||
              'assets/avatars/' + (currentStudent?.avatar ?? AVATARS[0]) + '.png'
            }
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const fallback =
                'assets/avatars/' + (currentStudent?.avatar ?? AVATARS[0]) + '.png';
              if (
                target.src !== window.location.origin + '/' + fallback &&
                target.src !== fallback
              ) {
                target.src = fallback;
              }
            }}
            alt=""
          />
          <span id="leaderboard-student-name">{currentStudent?.name}</span>
        </div>
        <div>
          {currentUserDataContent.map((e) => {
            let i = -1;
            return (
              <IonRow>
                {e.map((d) => {
                  i++;
                  currentUserHeaderRowIndicator++;

                  return (
                    <IonCol key={d} size="0" size-sm="6">
                      <p
                        style={{
                          color:
                            i === 1 && currentUserHeaderRowIndicator === 1
                              ? 'black'
                              : '',
                          backgroundColor:
                            i === 1 && currentUserHeaderRowIndicator === 1
                              ? 'white'
                              : '',
                          borderRadius:
                            i === 1 && currentUserHeaderRowIndicator === 1
                              ? '100vw'
                              : '',
                          width:
                            i === 1 && currentUserHeaderRowIndicator === 1
                              ? '3vw'
                              : '',
                          textAlign:
                            i === 1 && currentUserHeaderRowIndicator === 1
                              ? 'center'
                              : 'left',
                        }}
                        id="leaderboard-left-UI-content"
                      >
                        {d || '0'}
                      </p>
                    </IonCol>
                  );
                })}
              </IonRow>
            );
          })}
        </div>
        <p id="leaderboard-left-note-message">
          {t(
            '***Be among the top performers in your class to win an exciting reward',
          )}
        </p>
      </div>
      <div id="leaderboard-right-UI">
        {leaderboardData.map((e) => {
          let columnWidth = ['3vw', '14vw', '15vw', '7vw', '18vw'];
          let rankColors = ['', '#FFC32C', '#C4C4C4', '#D39A66', '#959595'];
          let i = -1;
          headerRowIndicator++;

          return (
            <IonRow
              style={{
                backgroundColor:
                  headerRowIndicator === 0
                    ? 'rgb(200 200 200)'
                    : Number(currentUserDataContent[0][1]) ===
                          headerRowIndicator ||
                        currentUserDataContent[0][1] === headerRowIndicator + '+'
                      ? '#FF7925'
                      : '',
                padding:
                  headerRowIndicator === 0
                    ? '1vh 2vh'
                    : Number(currentUserDataContent[0][1]) ===
                          headerRowIndicator ||
                        currentUserDataContent[0][1] === headerRowIndicator + '+'
                      ? '0vh 2vh'
                      : '1vh 2vh ',
                position: 'sticky',
                zIndex: headerRowIndicator === 0 ? '3' : '0',
                top: '0px',
              }}
            >
              {e.map((d) => {
                i++;

                return (
                  <IonCol size="auto">
                    <p
                      style={{
                        color:
                          i === 0 && headerRowIndicator != 0
                            ? Number(currentUserDataContent[0][1]) ===
                              headerRowIndicator
                              ? 'black'
                              : 'white'
                            : '',
                        backgroundColor:
                          i === 0 && headerRowIndicator != 0
                            ? Number(currentUserDataContent[0][1]) ===
                              headerRowIndicator
                              ? 'white'
                              : rankColors[Number(e[0])] || rankColors[4]
                            : '',
                        borderRadius:
                          i === 0 && headerRowIndicator != 0 ? '100vw' : '',
                        height:
                          i === 0 && headerRowIndicator != 0
                            ? columnWidth[i]
                            : '',
                        fontSize: '1.5vw',
                        width: columnWidth[i],
                        textAlign: i === 0 ? 'center' : 'left',
                      }}
                      id="leaderboard-right-UI-content"
                    >
                      {i === 1 ? (
                        <p id="leaderboard-profile-name">
                          {Number(currentUserDataContent[0][1]) ===
                            headerRowIndicator && currentStudent?.name
                            ? currentStudent?.name
                            : d}
                        </p>
                      ) : isNaN(Math.round(d)) ? (
                        d
                      ) : (
                        Math.round(d)
                      )}
                    </p>
                  </IonCol>
                );
              })}
            </IonRow>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardTable;
