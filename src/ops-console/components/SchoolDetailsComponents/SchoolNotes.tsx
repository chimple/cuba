import React from "react";
import "./SchoolNotes.css";

const mockNotes = [
  {
    createdBy: "Shankar",
    role: "Operational Director",
    class: "—",
    date: "22 - Nov - 2025",
  },
  {
    createdBy: "Chandana",
    role: "Field Coordinator",
    class: "1B",
    date: "21 - Nov - 2025",
  },
  {
    createdBy: "Naveen",
    role: "Program Manager",
    class: "2",
    date: "20 - Nov - 2025",
  },
];

const SchoolNotes: React.FC = () => {
  return (
    <div className="school-notes-container">
      <table className="school-notes-table">
        <thead>
          <tr>
            <th>Created By</th>
            <th>Role</th>
            <th>Class</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {mockNotes.map((note, index) => (
            <tr key={index}>
              <td>{note.createdBy}</td>
              <td>{note.role}</td>
              <td>{note.class}</td>
              <td>{note.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchoolNotes;