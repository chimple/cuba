import React, { useEffect, useState } from "react";
import "./TableRightHeader.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";
import {  ALL_SUBJECT, ENGLISH } from "../../../common/constants";


interface TableRightHeaderProps {
  headerDetails: Map<
    string,
    { headerName: string; startAt: string; endAt: string; courseId?: string }
  >[];
  courseName?: string;
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
  courseName,
}) => {
  const [courseNamesMap, setCourseNamesMap] = useState<Record<string, string>>(
    {}
  );
  useEffect(() => {
    const fetchCourseNames = async () => {
      const api = ServiceConfig.getI().apiHandler;
      const newMap: Record<string, string> = {};

      for (const assignmentMap of headerDetails) {
        const entries = Array.from(assignmentMap.entries());
        if (entries.length > 0) {
          const [_, { courseId }] = entries[0];
          if (courseId && !newMap[courseId]) {
            const course = await api.getCourse(courseId);
            if (course) {
              newMap[courseId] = course.name;
            }
          }
        }
      }
      setCourseNamesMap(newMap);
    };

    if (courseName === ALL_SUBJECT.name) {
      fetchCourseNames();
    }
  }, [headerDetails, courseName]);

  return (
    <>
      {headerDetails.map((assignmentMap) => {
        const entries = Array.from(assignmentMap.entries());
        if (entries.length === 0) return null;

        const [assignmentId, { headerName, startAt, endAt, courseId }] =
          entries[0];

        // Decide whether to translate
        let displayName = headerName ?? "";

        if (courseName === ALL_SUBJECT.name && courseId) {
          const courseNameForCheck = courseNamesMap[courseId];

          if (courseNameForCheck && courseNameForCheck !== ENGLISH) {
            displayName = t(headerName ?? "");
          }
        } else if (courseName !== ENGLISH) {
          displayName = t(headerName ?? "");
        }

        return (
          <th className="tableRightHeader" key={assignmentId}>
            <div className="aboveText">
              <span>{startAt}</span>
            </div>
            <div className="tableRightHeaderText">{displayName}</div>
            <span className="assignment-list-item-name">{displayName}</span>
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