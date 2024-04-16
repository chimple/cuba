import React from 'react';
import { IoIosAddCircle, IoIosRemoveCircle } from 'react-icons/io';

interface UserActionButtonProps {
  onClick: () => void;
  isAddAction: boolean;
}

const UserActionButton: React.FC<UserActionButtonProps> = ({ onClick, isAddAction }) => {
  return (
    <div>
      {isAddAction ? (
        <IoIosAddCircle id="common-back-button" onClick={onClick} />
      ) : (
        <IoIosRemoveCircle id="common-back-button" onClick={onClick} />
      )}
    </div>
  );
};

export default UserActionButton;