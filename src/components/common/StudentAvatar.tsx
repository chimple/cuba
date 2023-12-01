import { AVATARS } from "../../common/constants";
import User from "../../models/user";
import "./StudentAvatar.css";

const StudentAvatar: React.FC<{
  student: User;
  onClicked: any;
}> = ({ student, onClicked }) => {
  return (
    <div onClick={() => onClicked(student)} className="student-avatar">
      <img
        className="student-avatar-img"
        src={"assets/avatars/" + (student.avatar ?? AVATARS[0]) + ".png"}
        alt=""
      />
      <span className="student-avatar-name">{student.name}</span>
    </div>
  );
};
export default StudentAvatar;
