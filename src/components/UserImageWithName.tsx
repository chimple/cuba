import React from 'react';
import User from '../models/user';
import "./UserImageWithName.css"
interface UserImageWithNameProps {
    userDocId: string,
    userName: string,
    userImgPath: string
}

const UserImageWithName: React.FC<UserImageWithNameProps> = ({ userDocId, userName, userImgPath }) => {
    return (
        <div
            key={userDocId}
            onClick={() => { }}
            className="user-image-box"
        >
            <img
                className="user-img"
                src={userImgPath}
                alt=""
            />
            <span className="user-name">{userName}</span>
        </div>
    );
};

export default UserImageWithName;
