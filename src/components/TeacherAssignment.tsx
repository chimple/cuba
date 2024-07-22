import React, { useState } from "react";
import "./TeacherAssignment.css";

const TeacherAssignment = () => {
  const [manualAssignments, setManualAssignments] = useState({
    English: [],
    Maths: [],
    Hindi: [],
  });

  const [recommendedAssignments, setRecommendedAssignments] = useState({
    English: [
      { type: "Quiz", name: "Nouns: Match Cards", selected: false },
      { type: "Assignment", name: "Spellings: Dictionary", selected: false },
    ],
    Maths: [
      { type: "Assignment", name: "Addition: Small Numbers", selected: false },
      { type: "Quiz", name: "Numbers: Count 1-10", selected: false },
    ],
    Hindi: [
      { type: "Quiz", name: "Words: Match Words", selected: false },
      { type: "Assignment", name: "Spellings: Dictionary", selected: false },
    ],
    Kannada: [],
    DigitalSkills: [],
  });

  const [manualCollapsed, setManualCollapsed] = useState(true);
  const [recommendedCollapsed, setRecommendedCollapsed] = useState(true);

  const [manualSubjectCollapsed, setManualSubjectCollapsed] = useState({
    English: true,
    Maths: true,
    Hindi: true,
  });

  const [recommendedSubjectCollapsed, setRecommendedSubjectCollapsed] =
    useState({
      English: true,
      Maths: true,
      Hindi: true,
      Kannada: true,
      DigitalSkills: true,
    });

  const toggleAssignmentSelection = (category, setCategory, subject, index) => {
    const newAssignments = { ...category };
    newAssignments[subject][index].selected =
      !newAssignments[subject][index].selected;
    setCategory(newAssignments);
  };

  const toggleCollapse = (setCollapsed, collapsed) => {
    setCollapsed(!collapsed);
  };

  const toggleSubjectCollapse = (type, subject) => {
    const newCollapsed: any =
      type === "manual"
        ? { ...manualSubjectCollapsed }
        : { ...recommendedSubjectCollapsed };
    newCollapsed[subject] = !newCollapsed[subject];
    type === "manual"
      ? setManualSubjectCollapsed(newCollapsed)
      : setRecommendedSubjectCollapsed(newCollapsed);
  };

  const selectAllAssignments = (category, setCategory) => {
    const allSelected = Object.keys(category).every((subject) =>
      category[subject].every((assignment) => assignment.selected)
    );
    const newAssignments = { ...category };
    Object.keys(newAssignments).forEach((subject) => {
      newAssignments[subject].forEach((assignment) => {
        assignment.selected = !allSelected;
      });
    });
    setCategory(newAssignments);
  };

  const selectAllAssignmentsInSubject = (category, setCategory, subject) => {
    const allSelected = category[subject].every(
      (assignment) => assignment.selected
    );
    const newAssignments = { ...category };
    newAssignments[subject].forEach((assignment) => {
      assignment.selected = !allSelected;
    });
    setCategory(newAssignments);
  };

  const areAllSelected = (category) => {
    return Object.keys(category).every((subject) =>
      category[subject].every((assignment) => assignment.selected)
    );
  };

  const areAllSelectedInSubject = (category, subject) => {
    return category[subject].every((assignment) => assignment.selected);
  };

  const renderAssignments = (
    assignments,
    category,
    setCategory,
    collapsedState,
    type
  ) => {
    return Object.keys(assignments).map((subject) => (
      <div key={subject} className="subject">
        <div
          className="subject-header"
          onClick={() => toggleSubjectCollapse(type, subject)}
        >
          <h4>{subject}</h4>
          <button className="collapse-button">
            {collapsedState[subject] ? "▼" : "▲"}
          </button>
        </div>
        {!collapsedState[subject] && (
          <div className="assignments-list">
            <div className="select-all-container">
              <input
                type="checkbox"
                checked={areAllSelectedInSubject(assignments, subject)}
                onChange={() =>
                  selectAllAssignmentsInSubject(
                    assignments,
                    setCategory,
                    subject
                  )
                }
              />
              <label>Select All</label>
            </div>
            {assignments[subject].map((assignment, index) => (
              <div key={index} className="assignment">
                <input
                  type="checkbox"
                  checked={assignment.selected}
                  onChange={() =>
                    toggleAssignmentSelection(
                      category,
                      setCategory,
                      subject,
                      index
                    )
                  }
                />
                <span
                  className={`assignment-type ${assignment.type.toLowerCase()}`}
                >
                  {assignment.type}
                </span>
                <span className="assignment-name">{assignment.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="assignments">
      <h2>Assignments</h2>
      <a href="#back" className="back-to-library">
        Back to Library
      </a>
      <div className="manual-assignments">
        <div
          className="header"
          onClick={() => toggleCollapse(setManualCollapsed, manualCollapsed)}
        >
          <h3>Manual Assignments</h3>
          <button className="collapse-button">
            {manualCollapsed ? "▼" : "▲"}
          </button>
        </div>
        {!manualCollapsed &&
          (Object.keys(manualAssignments).every(
            (subject) => manualAssignments[subject].length === 0
          ) ? (
            <p>
              You have not chosen any assignments. Please go to{" "}
              <a href="#library">Library</a> to choose and assign.
            </p>
          ) : (
            <>
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={areAllSelected(manualAssignments)}
                  onChange={() =>
                    selectAllAssignments(
                      manualAssignments,
                      setManualAssignments
                    )
                  }
                />
                <label>Select All</label>
              </div>
              {renderAssignments(
                manualAssignments,
                manualAssignments,
                setManualAssignments,
                manualSubjectCollapsed,
                "manual"
              )}
            </>
          ))}
      </div>
      <div className="recommended-assignments">
        <div
          className="header"
          onClick={() =>
            toggleCollapse(setRecommendedCollapsed, recommendedCollapsed)
          }
        >
          <h3>Recommended Assignments</h3>
          <button className="collapse-button">
            {recommendedCollapsed ? "▼" : "▲"}
          </button>
        </div>
        {!recommendedCollapsed && (
          <>
            <div className="select-all-container">
              <input
                type="checkbox"
                checked={areAllSelected(recommendedAssignments)}
                onChange={() =>
                  selectAllAssignments(
                    recommendedAssignments,
                    setRecommendedAssignments
                  )
                }
              />
              <label>Select All</label>
            </div>
            {renderAssignments(
              recommendedAssignments,
              recommendedAssignments,
              setRecommendedAssignments,
              recommendedSubjectCollapsed,
              "recommended"
            )}
          </>
        )}
      </div>
      <div className="assign-button">
        <button>Assign</button>
      </div>
    </div>
  );
};

export default TeacherAssignment;
