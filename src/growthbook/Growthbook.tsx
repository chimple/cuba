
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { GrowthBookAttributes } from '../common/constants';
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
   if(gbUpdated){
     const storedAttributes = localStorage.getItem(GrowthBookAttributes);
     if (storedAttributes) {
       const attributes = JSON.parse(storedAttributes);
       setGrowthbookAttributes(attributes);
       setGbUpdated(false)
     }
   }
 }, [gbUpdated])


 const setGrowthbookAttributes = (attributes: any) => {
   const {
     studentDetails,
     schools,
     classes,
     liveQuizCount,
     assignmentCount,
     countOfPendingIds,
     last_assignment_played_at,
     total_assignments_played,
     leaderboard_position_weekly,
     leaderboard_position_monthly,
     leaderboard_position_all,
     count_of_assignment_played,
     count_of_lessons_played
   } = attributes;
  
   growthbook.setAttributes({
     id: studentDetails.id,
     age: studentDetails.age,
     curriculum_id: studentDetails.curriculum_id,
     grade_id: studentDetails.grade_id,
     gender: studentDetails.gender,
     parent_id: studentDetails.parent_id,
     subject_id: studentDetails.subject_id,
     school_ids: schools,
     class_ids: classes,
     language: localStorage.getItem("language") || "en",
     stars: studentDetails.stars,
     pending_live_quiz: liveQuizCount,
     pending_assignments: assignmentCount,
     ...countOfPendingIds,
     last_assignment_played_at: last_assignment_played_at,
     total_assignments_played: total_assignments_played,
     leaderboard_position_weekly: leaderboard_position_weekly,
     leaderboard_position_monthly: leaderboard_position_monthly,
     leaderboard_position_all: leaderboard_position_all,
     count_of_assignment_played: count_of_assignment_played,
     count_of_lessons_played: count_of_lessons_played
   });
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


