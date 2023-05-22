import { FC } from "react";
import CustomDropdown from "../CustomDropdown";
import "./GradeBoardAndLangDropdown.css";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { t } from "i18next";
import RectangularOutlineDropDown from "../parent/RectangularOutlineDropDown";

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
  const boardOptions1 = boards?.map((cur) => cur.title);
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
      <RectangularOutlineDropDown
      currentValue={currentlySelectedBoard!}
        // currentlySelected={currentlySelectedBoard}
        placeholder={t("Select Board").toString()}
        onValueChange={onBoardChange}
        optionList={boardOptions??[]}
        width="26vw"
        // options={boardOptions ?? []}
        // onDropdownChange={onBoardChange}
      />
      <RectangularOutlineDropDown
       currentValue={currentlySelectedGrade!}
       placeholder={t("Select Grade").toString()}
       onValueChange={onGradeChange}
       optionList={gradeOptions??[]}
       width="26vw"
      />
      <RectangularOutlineDropDown
       currentValue={currentlySelectedLang}
       placeholder={t("Medium of Instruction").toString()}
        onValueChange={onLangChange}
        optionList={languageOptions??[]}
        width="26vw"
      />
    </div>
  );
};

export default GradeBoardAndLangDropdown;
