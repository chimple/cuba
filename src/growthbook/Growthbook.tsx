import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { GrowthBookAttributes, LANGUAGE } from '../common/constants';

type GbContextType = {
  gbUpdated: boolean;
  setGbUpdated: React.Dispatch<React.SetStateAction<boolean>>;
};

const GbContext = createContext<GbContextType | undefined>(undefined);

export const updateLocalAttributes = (data: any) => {
  const existingData = localStorage.getItem(GrowthBookAttributes);
  const parsedData = existingData ? JSON.parse(existingData) : {};
  const updatedData = {
    ...parsedData,
    ...data
  }
  localStorage.setItem(GrowthBookAttributes, JSON.stringify(updatedData));
}

export const GbProvider = ({ children }: { children: ReactNode }) => {
  const growthbook = useGrowthBook();
  const [gbUpdated, setGbUpdated] = useState(true);

  useEffect(() => {
    if (gbUpdated) {
      const storedAttributes = localStorage.getItem(GrowthBookAttributes);
      if (storedAttributes) {
        const attributes = JSON.parse(storedAttributes);
        setGrowthbookAttributes(attributes);
      } else {
        setGbUpdated(false);
      }
    }
  }, [gbUpdated])

  const setGrowthbookAttributes = (attributes: any) => {
    const {
      studentDetails,
      schools,
      school_name,
      classes,
      liveQuizCount,
      assignmentCount,
      last_assignment_played_at,
      total_assignments_played,
      leaderboard_position_weekly,
      leaderboard_position_monthly,
      leaderboard_position_all,
      count_of_assignment_played,
      count_of_lessons_played,
      pending_course_counts,
      pending_subject_counts,
      learning_path_completed,
      total_learning_path_completed,
      manufacturer,
      model,
      operating_system,
      os_version,
      platform,
      device_language,
      count_of_children,
      teacher_class_id,
      teacher_school_state,
      teacher_school_district,
      teacher_school_block,
      teacher_school_id,
      teacher_school_list,
      teacher_class_ids,
      roleMap,
      courseCounts,
    } = attributes;

    const totalAssignments = count_of_assignment_played + assignmentCount;

    growthbook.setAttributes({
      id: studentDetails?.id,
      age: studentDetails?.age,
      curriculum_id: studentDetails?.curriculum_id,
      grade_id: studentDetails?.grade_id,
      gender: studentDetails?.gender,
      parent_id: studentDetails?.parent_id,
      subject_id: studentDetails?.subject_id,
      stars: studentDetails?.stars || 0,
      last_login_at: studentDetails?.last_sign_in_at,
      login_method: studentDetails?.login_method,
      school_ids: schools,
      school_name,
      class_ids: classes,
      language: localStorage.getItem(LANGUAGE) || "en",
      pending_live_quiz: liveQuizCount,
      pending_assignments: assignmentCount,
      last_assignment_played_at: last_assignment_played_at,
      total_assignments_played: total_assignments_played,
      leaderboard_position_weekly: leaderboard_position_weekly,
      leaderboard_position_monthly: leaderboard_position_monthly,
      leaderboard_position_all: leaderboard_position_all,
      count_of_assignment_played: count_of_assignment_played,
      count_of_lessons_played: count_of_lessons_played,
      percentage_of_assignment_played: (count_of_assignment_played / totalAssignments) * 100,
      ...pending_course_counts,
      ...pending_subject_counts,
      ...learning_path_completed,
      total_learning_path_completed,
      manufacturer,
      model,
      operating_system,
      os_version,
      platform,
      device_language,
      count_of_children,
      teacher_class_id,
      teacher_school_id,
      teacher_school_state,
      teacher_school_district,
      teacher_school_block,
      teacher_school_list,
      teacher_class_ids,
      ...roleMap,
      ...courseCounts,
    });
    setGbUpdated(false);
  };

  return (
    <GbContext.Provider value={{ gbUpdated, setGbUpdated }}>
      {children}
    </GbContext.Provider>
  );
};

export const useGbContext = () => {
  const context = useContext(GbContext);
  if (!context) {
    throw new Error('useGbContext must be used within a GbProvider');
  }
  return context;
};