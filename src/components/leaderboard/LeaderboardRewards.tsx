import { FC, useEffect, useState } from "react";
import { LEADERBOARD_REWARD_LIST } from "../../common/constants";
import { Box, Tab, Tabs } from "@mui/material";
import { t } from "i18next";
import LeaderboardBadges from "./LeaderboardBadges";
import LeaderboardBonus from "./LeaderboardBonus";
import "./LeaderboardRewards.css";
import LeaderboardSticker from "./LeaderboardSticker";

const LeaderboardRewards: FC = () => {
  const [tabIndex, setTabIndex] = useState(LEADERBOARD_REWARD_LIST.BADGES);
  const handleChange = (
    event: React.SyntheticEvent,
    newValue: LEADERBOARD_REWARD_LIST
  ) => {
    setTabIndex(newValue);
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rewardsTab = urlParams.get("rewards");
    let currentTab = LEADERBOARD_REWARD_LIST.STICKER;
    if (rewardsTab) {
      if (rewardsTab === LEADERBOARD_REWARD_LIST.BONUS.toLowerCase()) {
        currentTab = LEADERBOARD_REWARD_LIST.BONUS;
      } else if (rewardsTab === LEADERBOARD_REWARD_LIST.BADGES.toLowerCase()) {
        currentTab = LEADERBOARD_REWARD_LIST.BADGES;
      }
    }
    setTabIndex(currentTab);
  }, []);
  return (
    <div className="leaderboard-rewards-container">
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="secondary tabs example"
        // variant="scrollable"
        scrollButtons="auto"
        // aria-label="scrollable auto tabs example"
        centered
        sx={{
          // "& .MuiAppBar-root": { backgroundColor: "#FF7925 !important" },
          "& .MuiTabs-indicator": {
            backgroundColor: "#000000 !important",
            bottom: "15% !important",
          },
          "& .MuiTab-root": { color: "#000000 !important" },
          "& .Mui-selected": { color: "#000000 !important" },
        }}
      >
        <Tab
          id="parent-page-tab-bar"
          value={LEADERBOARD_REWARD_LIST.STICKER}
          label={t(LEADERBOARD_REWARD_LIST.STICKER)}
        />
        <Tab
          id="parent-page-tab-bar"
          value={LEADERBOARD_REWARD_LIST.BADGES}
          label={t(LEADERBOARD_REWARD_LIST.BADGES)}
        />
        <Tab
          id="parent-page-tab-bar"
          value={LEADERBOARD_REWARD_LIST.BONUS}
          label={t(LEADERBOARD_REWARD_LIST.BONUS)}
        />
      </Tabs>
      {tabIndex === LEADERBOARD_REWARD_LIST.BADGES && <LeaderboardBadges />}
      {tabIndex === LEADERBOARD_REWARD_LIST.BONUS && <LeaderboardBonus />}
      {tabIndex === LEADERBOARD_REWARD_LIST.STICKER && <LeaderboardSticker />}
    </div>
  );
};

export default LeaderboardRewards;
