import React, { useEffect, useState } from "react";
import "./TableRightHeader.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
import {  ALL_SUBJECT, COURSES } from "../../../common/constants";


interface TableRightHeaderProps {
  headerDetails: Map<
    string,
    { headerName: string; startAt: string; endAt: string; courseId?: string }
  >[];
  courseCode?: string;
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
  courseCode,
}) => {
  const [courseNamesMap, setCourseNamesMap] = useState<Record<string, string>>(
    {}
  );
  useEffect(() => {
    const fetchCourseNames = async () => {
      const api = ServiceConfig.getI().apiHandler;
  
      const courseIds: string[] = [];
      for (const assignmentMap of headerDetails) {
        const entries = Array.from(assignmentMap.entries());
        if (entries.length > 0) {
          const [_, { courseId }] = entries[0];
          if (courseId && !courseIds.includes(courseId)) {
            courseIds.push(courseId);
          }
        }
      }
  
      if (courseIds.length > 0) {
        const courses = await api.getCourses(courseIds);
        const newMap: Record<string, string> = {};
        for (const course of courses) {
          newMap[course.id] = course.code ?? "";
        }
        setCourseNamesMap(newMap);
      }
    };
  
    fetchCourseNames();
  }, [headerDetails]);
  
  return (
    <>
      {headerDetails.map((assignmentMap) => {
        const entries = Array.from(assignmentMap.entries());
        if (entries.length === 0) return null;

        const [assignmentId, { headerName, startAt, endAt, courseId }] =
          entries[0];

        // Decide whether to translate
        let displayName = headerName ?? "";

        if (courseCode === ALL_SUBJECT.id && courseId) {
          const courseNameForCheck = courseNamesMap[courseId];
          if (courseNameForCheck && courseNameForCheck !== COURSES.ENGLISH) {
            displayName = t(headerName ?? "");
          }
        } else if (courseCode !== COURSES.ENGLISH) {
          displayName = t(headerName ?? "");
        }
        return (
          <th className="tableRightHeader" key={assignmentId}>
            <div className="aboveText">
              <span>{startAt}</span>
            </div>
            <div className="tableRightHeaderText">{displayName}</div>
            <div className="belowText">
              <span>{endAt}</span>
            </div>
          </th>
        );
      })}
    </>
  );
};

export default TableRightHeader;