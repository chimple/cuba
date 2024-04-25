import React from 'react';
import User from '../models/user';
import "./DisplayUsers.css"
import UserImageWithName from './UserImageWithName';
interface DisplayUsersProps {
  users: { docId: string, name: string, image }[];
}

const DisplayUsers: React.FC<DisplayUsersProps> = ({ users }) => {
  return (
    <div className="all-users-display">
      {users.map((user) => (
        <UserImageWithName userDocId={user.docId} userName={user.name} userImgPath={'assets/avatars/armydog.png'} />
      ))}
    </div>
  );
};

export default DisplayUsers;
