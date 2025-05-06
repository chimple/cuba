import React, { useEffect, useRef, useState } from "react";
import "./SearchLessons.css";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Header from "../components/homePage/Header";
import { IonSearchbar } from "@ionic/react";
import { useHistory } from "react-router";
import { PAGES, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import LessonComponent from "../components/library/LessonComponent";
import AssigmentCount from "../components/library/AssignmentCount";
import { Util } from "../../utility/util";
import { t } from "i18next";

const SearchLesson: React.FC = ({}) => {
  const dataToContinue: any = {};
  const history = useHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>([]);
  const inputEl = useRef<HTMLIonSearchbarElement>(null);
  const current_class = Util.getCurrentClass();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [selectedLesson, setSelectedLesson] = useState<Map<string, string>>(
    new Map()
  );
  useEffect(() => {
    if (inputEl.current) {
      inputEl.current.setFocus();
    }
    init();
  }, []);

  const onSearch = async (term: string) => {
    if (dataToContinue.search === term) return;
    if (!term) {
      dataToContinue.lessons = [];
      dataToContinue.search = term;
      setLessons([]);
      setSearchTerm(term);
      return;
    }
    const results = await api.searchLessons(term);
    dataToContinue.lessons = results;
    dataToContinue.search = term;
    localStorage.setItem("searchTerm", dataToContinue.search);
    setLessons(results);
  };
  const init = async () => {
    const current_user = await auth.getCurrentUser();
    const previous_selected_lessons = current_user?.id
      ? await api.getUserAssignmentCart(current_user?.id)
      : null;
    if (previous_selected_lessons?.lessons) {
      if (!current_class?.id) {
        return;
      }
      const all_sync_lesson: Map<string, string> = new Map(
        Object.entries(JSON.parse(previous_selected_lessons?.lessons))
      );
      setSelectedLesson(all_sync_lesson);
      const sync_lesson_data = all_sync_lesson.get(current_class?.id);
      const sync_lesson: Map<string, string[]> = new Map(
        Object.entries(sync_lesson_data ? JSON.parse(sync_lesson_data) : {})
      );
      const _assignmentLength = Array.from(sync_lesson.values()).reduce(
        (acc, array) => acc + array.length,
        0
      );
      setAssignmentCount(_assignmentLength);
    }
  };
  return (
    <div className="chapter-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        }}
      />
      <main className="container-body">
        <IonSearchbar
          className="search-bar"
          ref={inputEl}
          showClearButton="focus"
          color={"light"}
          inputMode="search"
          showCancelButton="focus"
          enterkeyhint="search"
          placeholder={t("Search")??""}
          onIonClear={() => {
            onSearch("");
          }}
          onInput={(ev) => {
            setSearchTerm(ev.currentTarget.value ?? "");
          }}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              onSearch(ev.currentTarget.value ?? "");
              //@ts-ignore
              ev.target?.blur();
            }
          }}
          // debounce={}
          onIonChange={(evOnChange) => {
            onSearch(evOnChange.detail.value ?? "");
          }}
          value={searchTerm}
          animated={true}
        />
        <div className="grid-container">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="grid-item">
              <div className="bottom-border">
                <LessonComponent
                  lesson={lesson}
                  handleLessonCLick={() => {
                    history.replace(PAGES.LESSON_DETAILS, {
                      course: null,
                      classId: "49d6cc2f-1c1c-4211-bc11-6e2c9b2a0858",
                      lesson: lesson,
                      selectedLesson: selectedLesson,
                    });
                  }}
                  isSelButton={false}
                  handleSelect={() => {}}
                  isSelcted={true}
                />
              </div>
            </div>
          ))}
        </div>
        <AssigmentCount assignments={assignmentCount} onClick={() => {}} />
      </main>
    </div>
  );
};

export default SearchLesson;
