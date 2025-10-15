import { useState } from "react";
import { Util } from "../utility/util";
import { IDLE_REWARD_ID, REWARD_MODAL_SHOWN_DATE } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";

export const useReward = () => {
  const [hasTodayReward, setHasTodayReward] = useState(true);

  const checkAndUpdateReward = async (): Promise<string | null> => {
    const student = Util.getCurrentStudent();
    const currentReward = Util.retrieveUserReward();
    const todaysReward = await Util.fetchTodaysReward();
    const today = new Date().toISOString().split("T")[0];

    if (!student) return null;

    const studentReward = student.reward ? JSON.parse(student.reward) : null;

    if (!currentReward.reward_id && studentReward === null) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - 1);
      await ServiceConfig.getI().apiHandler.updateUserReward(
        student.id,
        IDLE_REWARD_ID,
        timestamp.toISOString()
      );
      await Util.updateUserReward();
    } else if (!currentReward.reward_id && studentReward?.reward_id) {
      await Util.updateUserReward();
    } else if (
      studentReward?.reward_id &&
      studentReward.reward_id !== currentReward?.reward_id &&
      new Date(studentReward.timestamp).toISOString().split("T")[0] === today &&
      todaysReward?.id === studentReward.reward_id
    ) {
      setHasTodayReward(false);
      return studentReward.reward_id;
    }

    return null;
  };

  const shouldShowDailyRewardModal = async () => {
    const today = new Date().toISOString().split("T")[0];
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) return false;
    const dailyUserReward = currentStudent?.reward
      ? JSON.parse(currentStudent.reward)
      : {};
    const lastShownDate = sessionStorage.getItem(REWARD_MODAL_SHOWN_DATE);
    const todaysReward = await Util.fetchTodaysReward();
    // Check if the reward was received today by comparing dates
    const rewardDate = dailyUserReward.timestamp
      ? new Date(dailyUserReward.timestamp).toISOString().split("T")[0]
      : null;
    const isRewardFromToday = rewardDate ? rewardDate === today : false;

    // Check if user has today's reward by comparing reward IDs and date
    const hasReceivedTodayReward = todaysReward!.id === dailyUserReward.reward_id && isRewardFromToday;

    if (
      !hasReceivedTodayReward &&
      (!lastShownDate ||
        new Date(lastShownDate).toISOString().split("T")[0] !== today)
    ) {
      return true;
    }
    return false;
  };

  return {
    hasTodayReward,
    setHasTodayReward,
    checkAndUpdateReward,
    shouldShowDailyRewardModal,
  };
};
