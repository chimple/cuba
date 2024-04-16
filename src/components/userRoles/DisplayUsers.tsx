import React from 'react';
import User from '../../models/user';
import "./DisplayUsers.css"
interface DisplayUsersProps {
  users: User[];
}

const DisplayUsers: React.FC<DisplayUsersProps> = ({ users }) => {
  return (
    <div className="all-users-display">
      {users.map((user) => (
        <div
          key={user.docId}
          onClick={() => {}}
          className="user-image-box"
        >
          <img
            className="user-img"
            src={"assets/avatars/armydog.png"}
            alt=""
          />
          <span className="user-name">{user.name}</span>
        </div>
      ))}
    </div>
  );
};

export default DisplayUsers;
