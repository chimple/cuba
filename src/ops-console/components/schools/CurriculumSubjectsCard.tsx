import React, { useEffect, useState } from "react";
import "./CurriculumSubjectsSection.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { t } from "i18next";

interface CurriculumSubject {
  curriculum: string;
  subjects: string[];
}

interface CurriculumSubjectsProps {
  data: CurriculumSubject[];
}

const CurriculumSubjects: React.FC<CurriculumSubjectsProps> = ({ data }) => (
  <div className="curriculum-card">
    <div className="curriculum-title">
      <i>{t("Curriculum & Subjects")}</i>
    </div>
    <hr className="curriculum-divider" />
    <div className="curriculum-list">
      {data.map((row, idx) => (
        <div className="curriculum-row" key={idx}>
          <div className="curriculum-col curriculum-curriculum">
            {row.curriculum}
          </div>
          <div className="curriculum-col curriculum-subjects">
            {row.subjects.map((subj, i) => (
              <span key={i}>
                {subj}
                {i !== row.subjects.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface CurriculumSubjectsSectionProps {
  id: string;
}

const CurriculumSubjectsSection: React.FC<CurriculumSubjectsSectionProps> = ({
  id,
}) => {
  const [data, setData] = useState<CurriculumSubject[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      const api = ServiceConfig.getI().apiHandler;
      const res = await api.getCurriculumSubjectsForSchool(id);
      if (res) setData(res);
      else setData([]);
    }
    fetchData();
  }, [id]);

  if (!data) return <div>Loading curriculum & subjects...</div>;

  return <CurriculumSubjects data={data} />;
};

export default CurriculumSubjectsSection;
