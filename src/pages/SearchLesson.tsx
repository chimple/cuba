import { useEffect, useState } from "react";
import "@algolia/autocomplete-theme-classic";
import "./SearchLesson.css";

import LessonSlider from "../components/LessonSlider";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory, useLocation } from "react-router";
import { CONTINUE, PAGES, TableTypes } from "../common/constants";
import { Util } from "../utility/util";
import { IonSearchbar } from "@ionic/react";

const dataToContinue: any = {};
function SearchLesson() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>([]);

  const onSearch = async (term: string) => {
    if (dataToContinue.search === term) return;
    if (!term) {
      dataToContinue.lessons = [];
      dataToContinue.search = term;
      setLessons([]);
      setSearchTerm(term);
      return;
    }
    const api = ServiceConfig.getI().apiHandler;
    const results = await api.searchLessons(term);
    dataToContinue.lessons = results;
    dataToContinue.search = term;
    setLessons(results);
    setSearchTerm(term);
  };

  const history = useHistory();
  const location = useLocation();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  async function init() {
    const currentStudent = Util.getCurrentStudent();
    const api = ServiceConfig.getI().apiHandler;
    if (!currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    }
    if (!dataToContinue.lessonResultMap) {
      const res = await api.getStudentResultInMap(currentStudent.id);
      dataToContinue.lessonResultMap = res;
      setLessonResultMap(res);
    }
  }
  useEffect(() => {
    init();

    const urlParams = new URLSearchParams(location.search);
    if (!!urlParams.get(CONTINUE) && !!dataToContinue.lessons) {
      setLessons(dataToContinue.lessons);
      setSearchTerm(dataToContinue.search);
      setLessonResultMap(dataToContinue.lessonResultMap);
    }
    const savedSearchTerm = localStorage.getItem("searchTerm");
    if (savedSearchTerm !== null) {
      setSearchTerm(savedSearchTerm);
      onSearch(savedSearchTerm);
    }
    localStorage.setItem("searchTerm", searchTerm);
    return () => {
      localStorage.removeItem("searchTerm");
    };
  }, [searchTerm]);

  return (
    <div className="search-container">
      <div className="search-header">
        <IonSearchbar
          showClearButton="focus"
          color={"light"}
          inputMode="search"
          enterkeyhint="search"
          onIonClear={() => {
            onSearch("");
          }}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              onSearch(ev.currentTarget.value ?? "");
              //@ts-ignore
              ev.target?.blur();
            }
          }}
          debounce={1000}
          onIonChange={(evOnChange) => {
            onSearch(evOnChange.detail.value ?? "");
          }}
          value={searchTerm}
          animated={true}
        />
        <div className="right-button"></div>
      </div>
      <LessonSlider
        key={searchTerm}
        lessonData={lessons}
        isHome={true}
        course={undefined}
        lessonsScoreMap={lessonResultMap ?? {}}
        startIndex={0}
        showSubjectName={true}
        showChapterName={false}
      />
      <div className="search-bottom"></div>
    </div>
  );
}

export default SearchLesson;
