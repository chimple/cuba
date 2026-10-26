import './SearchLessons.css';
import { useSearchLessons } from '../hooks/useSearchLessons';

const SearchLesson = () => {
  const {
    AssigmentCount,
    AssignedVisibilityToggle,
    ChapterWiseLessons,
    Header,
    IonSearchbar,
    PAGES,
    assignedLessonIds,
    assignmentCount,
    currentClass,
    currentSchool,
    groupedLessons,
    history,
    inputEl,
    inputValue,
    isChapterFullySelected,
    isFocused,
    isLessonSelected,
    isLoading,
    onSearch,
    parsePath,
    searchHistory,
    searchTerm,
    selectedLesson,
    setInputValue,
    setIsFocused,
    setLessons,
    setSearchTerm,
    setShowAssignedLessons,
    setShowHistory,
    showAssignedLessons,
    showHistory,
    t,
    toggleChapterSelection,
    toggleLessonSelection,
    triggerDebouncedSearch,
  } = useSearchLessons();

  return (
    <div id="search-lesson-container" className="search-lesson-container">
      <Header
        isBackButton
        onButtonClick={() =>
          history.replace({
            ...parsePath(PAGES.HOME_PAGE),
            state: { tabValue: 1 },
          })
        }
        customText={t('Search') ?? 'Search'}
        schoolName={currentSchool?.name}
        className={currentClass?.name}
      />

      <main id="search-lesson-body" className="search-lesson-body">
        <div
          id="search-lesson-search-wrap"
          className="search-lesson-search-wrap"
        >
          <IonSearchbar
            ref={inputEl}
            id="search-lesson-bar"
            className="search-lesson-bar"
            placeholder={String(t('Search for a Lesson...'))}
            value={inputValue}
            onIonFocus={() => {
              setIsFocused(true);
              if (!inputValue.trim()) {
                setShowHistory(true);
              }
            }}
            onIonInput={(e) => {
              const value = e.detail.value ?? '';
              setInputValue(value);

              if (!value.trim()) {
                setLessons([]);
                setSearchTerm('');
                setShowHistory(true);
                return;
              }

              setShowHistory(false);
              triggerDebouncedSearch(value);
            }}
            onIonClear={() => {
              setInputValue('');
              setSearchTerm('');
              setLessons([]);
              setShowHistory(true);
            }}
          />
          {isFocused &&
            showHistory &&
            !inputValue.trim() &&
            searchHistory.length > 0 && (
              <div
                id="search-lesson-search-history"
                className="search-lesson-search-history-list"
              >
                {searchHistory.map((term, index) => (
                  <div
                    key={index}
                    id="search-lesson-history-item"
                    className="search-lesson-search-history-item"
                    onClick={() => {
                      setInputValue(term);
                      onSearch(term);
                      setShowHistory(false);
                    }}
                  >
                    {term}
                  </div>
                ))}
              </div>
            )}
        </div>

        {!showHistory && searchTerm.trim() && (
          <div
            id="search-lesson-result-row"
            className="search-lesson-result-row"
          >
            <div
              id="search-lesson-result-text"
              className="search-lesson-result-text"
            >
              {t('Showing Results for')} "{searchTerm.trim()}"
            </div>
            <AssignedVisibilityToggle
              showAssigned={showAssignedLessons}
              onChange={setShowAssignedLessons}
            />
          </div>
        )}

        {!isLoading && (
          <div id="search-lesson-results" className="search-lesson-results">
            {groupedLessons.courseGroups.length === 0 && searchTerm && (
              <div
                id="search-lessons-no-results"
                className="search-lessons-no-results"
              >
                {t('No results found')}
              </div>
            )}

            <ChapterWiseLessons
              courseGroups={groupedLessons.courseGroups}
              isLessonSelected={isLessonSelected}
              toggleLessonSelection={toggleLessonSelection}
              isChapterFullySelected={isChapterFullySelected}
              toggleChapterSelection={toggleChapterSelection}
              selectedLesson={selectedLesson}
              showAssignedBadge={true}
              assignedLessonIds={assignedLessonIds}
            />
          </div>
        )}

        <AssigmentCount
          assignments={assignmentCount}
          onClick={() => {
            history.push(PAGES.TEACHER_ASSIGNMENT);
          }}
        />
      </main>
    </div>
  );
};

export default SearchLesson;