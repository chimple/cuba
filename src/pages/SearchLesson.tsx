import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import algoliasearch from "algoliasearch/lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Configure,
  connectSearchBox,
  InstantSearch,
} from "react-instantsearch-dom";
import "@algolia/autocomplete-theme-classic";
import "./SearchLesson.css";

import { Autocomplete } from "../components/search/Autocomplete";
import LessonSlider from "../components/LessonSlider";
import Lesson from "../models/lesson";
import { ServiceConfig } from "../services/ServiceConfig";
import { useHistory, useLocation } from "react-router";
import { INSTANT_SEARCH_INDEX_NAME, PAGES } from "../common/constants";
import BackButton from "../components/common/BackButton";
import { Util } from "../utility/util";
import { StudentLessonResult } from "../common/courseConstants";
import User from "../models/user";

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID!,
  process.env.REACT_APP_ALGOLIA_API_KEY!
);
const searchIndex = searchClient.initIndex(INSTANT_SEARCH_INDEX_NAME);

const VirtualSearchBox = connectSearchBox(() => null);

const dataToContinue: any = {};
function SearchLesson() {
  const [searchTerm, setSearchTerm] = useState("");

  const onSubmit = useCallback(async (params) => {
    await onSearch(params.state.query);
  }, []);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const onSearch = async (term: string) => {
    const results = await searchIndex.search(term);
    const tempLessons = results.hits.map((hit) => {
      const lesson = hit as any as Lesson;
      lesson.docId = hit.objectID;
      return lesson;
    });
    dataToContinue.lessons = tempLessons;
    dataToContinue.search = term;
    setLessons(tempLessons);
    setSearchTerm(term);
  };
  const history = useHistory();
  const location = useLocation();
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: StudentLessonResult;
  }>();
  const [currentStudent, setStudent] = useState<User>();

  async function init() {
    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent) {
      history.replace(PAGES.HOME);
      return;
    }

    setStudent(currentStudent);
    if (currentStudent) {
      const api = ServiceConfig.getI().apiHandler;
      // const currentStudent =await Util.getCurrentStudent();
      if (!currentStudent) {
        history.replace(PAGES.DISPLAY_STUDENT);
        return;
      }
      if (!dataToContinue.lessonResultMap) {
        const res = await api.getStudentResultInMap(currentStudent.docId);
        console.log("tempResultLessonMap = res;", res);
        dataToContinue.lessonResultMap = res;
        setLessonResultMap(res);
      }
      // api.getStudentResultInMap(currentStudent.docId).then(async (res) => {
      //   console.log("tempResultLessonMap = res;", res);
      //   setLessonResultMap(res);
      // });
    }
  }

  // useEffect(() => {
  //   init();
  //   // const currentStudent = await Util.getCurrentStudent();
  //   const urlParams = new URLSearchParams(location.search);
  //   if (!!urlParams.get("continue") && !!dataToContinue.lessons) {
  //     setLessons(dataToContinue.lessons);
  //     setSearchTerm(dataToContinue.search);
  //   }
  // }, []);
  useEffect(() => {
    init();

    const urlParams = new URLSearchParams(location.search);
    if (!!urlParams.get("continue") && !!dataToContinue.lessons) {
      setLessons(dataToContinue.lessons);
      setSearchTerm(dataToContinue.search);
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

  const plugins = useMemo(() => {
    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
      key: "search",
      limit: 3,
      transformSource({ source }) {
        return {
          ...source,
        };
      },
    });

    const querySuggestionsPlugin = createQuerySuggestionsPlugin({
      searchClient,
      indexName: INSTANT_SEARCH_INDEX_NAME,
      //@ts-ignore
      getSearchParams() {
        return recentSearchesPlugin.data?.getAlgoliaSearchParams({
          hitsPerPage: 3,
          attributesToHighlight: ["title", "outcome"],
        });
      },
      categoryAttribute: [
        INSTANT_SEARCH_INDEX_NAME,
        "facets",
        "exact_matches",
        // INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0],
      ],

      transformSource({ source }) {
        return {
          ...source,
          sourceId: "Lesson",
          getItems(params) {
            return source.getItems(params);
          },
          templates: {
            ...source.templates,
            item(params) {
              params.item.query = params.item.title.toString();
              return source.templates.item(params);
            },
          },
        };
      },
    });

    return [recentSearchesPlugin, querySuggestionsPlugin];
  }, []);

  return (
    <div className="search-container">
      <div className="search-header">
        <BackButton
          onClicked={() => {
            history.replace(PAGES.HOME);
          }}
        />
        <InstantSearch
          searchClient={searchClient}
          indexName={INSTANT_SEARCH_INDEX_NAME}
          initialUiState={{
            [INSTANT_SEARCH_INDEX_NAME]: {
              query: "phone",
              page: 5,
            },
          }}
        >
          {/* A virtual search box is required for InstantSearch to understand the `query` search state property */}
          <VirtualSearchBox />
          <Autocomplete
            placeholder="Search..."
            detachedMediaQuery="none"
            initialState={{
              query: searchTerm,
            }}
            openOnFocus={true}
            onSubmit={onSubmit}
            plugins={plugins}
            insights
          />
          <Configure
            attributesToSnippet={["title:10", "outcome:20"]}
            snippetEllipsisText="…"
          />
        </InstantSearch>
        <div className="right-button"></div>
      </div>
      <LessonSlider
        lessonData={lessons}
        isHome={true}
        course={undefined}
        lessonsScoreMap={lessonResultMap || {}}
        startIndex={0}
        showSubjectName={true}
      />
      <div className="search-bottom"></div>
    </div>
  );
}

export default SearchLesson;
