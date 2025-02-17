import { FC } from "react";
import CustomDropdown from "../CustomDropdown";
import "./GradeBoardAndLangDropdown.css";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";
import Language from "../../models/language";
import { t } from "i18next";
import DropDown from "../DropDown";

const GradeBoardAndLangDropdown: FC<{
  boards: Curriculum[] | undefined;
  grades: Grade[] | undefined;
  languages: {
    title: string;
    code: string;
    docId: string;
  }[] | undefined;
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
        <div id="drop-down-board">
          <p id="drop-down-head">{t('Board')}</p>
          <DropDown
            currentValue={currentlySelectedBoard!}
            // currentlySelected={currentlySelectedBoard}
            placeholder={t("Select").toString()}
            onValueChange={onBoardChange}
        optionList={boardOptions??[]}
            width="26vw"
          // options={boardOptions ?? []}
          // onDropdownChange={onBoardChange}
          />
        </div>
        <div id="drop-down-grade">
          <p id="drop-down-head">{t('Grade')}</p>
          <DropDown
            currentValue={currentlySelectedGrade!}

            placeholder={t("Select").toString()}
            onValueChange={onGradeChange}
       optionList={gradeOptions??[]}
            width="26vw"
          />
        </div>
        <div id="drop-down-Medium-of-instruction">
          <p id="drop-down-head">{t('Medium of instruction')}</p>
          <DropDown
            currentValue={currentlySelectedLang}
            placeholder={t("Select Language").toString()}
            onValueChange={onLangChange}
        optionList={languageOptions??[]}
            width="26vw"
          />
        </div>
      </div>
    );
  };

export default GradeBoardAndLangDropdown;
