import { AVATARS } from "../../common/constants";
import User from "../../models/user";
import "./StudentAvatar.css";

const StudentAvatar: React.FC<{
  student;
  onClicked;
  width?;
  namePosition?;
  nameLabel?;
}> = ({ student, onClicked, width, namePosition = "below", nameLabel }) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection:
      namePosition === "above" || namePosition === "below" ? "column" : "row",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "var(--text-size)",
    color: "var(--text-color)",
  };

  const nameStyle: React.CSSProperties = {
    whiteSpace: "nowrap",
    display:
      namePosition === "right" || namePosition === "left"
        ? "inline-block"
        : "block",
    textOverflow: "ellipsis",
    overflow: "hidden",
    marginLeft: namePosition === "right" ? "10vw" : "0",
  };

  return (
    <div
      onClick={() => onClicked(student)}
      style={containerStyle}
      className={`student-avatar-${namePosition}`}
    >
      {namePosition === "above" && (
        <span style={nameStyle} className="student-avatar-name-above">
          {student.name}
        </span>
      )}
      <img
        style={{ width: width }}
        className="student-avatar-img"
        src={"assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"}
        alt=""
      />
      {(namePosition === "right" || namePosition === "left") && (
        <span
          style={nameStyle}
          className={`student-avatar-name-${namePosition}`}
        >
          {student.name} {nameLabel}
        </span>
      )}
      {namePosition === "below" && (
        <span style={nameStyle} className="student-avatar-name-below">
          {student.name} {nameLabel}
        </span>
      )}
    </div>
  );
};

export default StudentAvatar;
