import { FC } from "react";
import CustomDropdown from "../CustomDropdown";
import "./GradeBoardAndLangDropdown.css";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { t } from "i18next";

const GradeBoardAndLangDropdown: FC<{
  boards: Curriculum[] | undefined;
  grades: Grade[] | undefined;
  languages: Language[] | undefined;
  onBoardChange: (event: string) => void;
  onGradeChange: (event: string) => void;
  onLangChange: (event: string) => void;
  currentlySelectedBoard: string | undefined;
  currentlySelectedGrade: string | undefined;
  currentlySelectedLang: string | undefined;
}> = ({
  boards,
  grades,
  languages,
  onBoardChange,
  onGradeChange,
  onLangChange,
  currentlySelectedBoard,
  currentlySelectedGrade,
  currentlySelectedLang,
}) => {
  const boardOptions = boards?.map((cur) => ({
    displayName: cur.title,
    id: cur.docId,
  }));
  const gradeOptions = grades?.map((cur) => ({
    displayName: cur.title,
    id: cur.docId,
  }));
  const languageOptions = languages?.map((cur) => ({
    displayName: cur.title,
    id: cur.docId,
  }));
  return (
    <div className="dropdown-header">
      <CustomDropdown
        currentlySelected={currentlySelectedBoard}
        placeholder={t("Select Board")}
        options={boardOptions ?? []}
        onDropdownChange={onBoardChange}
      />
      <CustomDropdown
        currentlySelected={currentlySelectedGrade}
        placeholder={t("Select Grade")}
        options={gradeOptions ?? []}
        onDropdownChange={onGradeChange}
      />
      <CustomDropdown
        currentlySelected={currentlySelectedLang}
        placeholder={t("Medium of Instructions")}
        options={languageOptions ?? []}
        onDropdownChange={onLangChange}
      />
    </div>
  );
};

export default GradeBoardAndLangDropdown;
