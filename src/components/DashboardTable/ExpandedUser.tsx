import React from 'react';
import "./ExpandedUser.css"
interface ExpandedUserProps {
    name: string;
    onClickViewDetails: ()=>void
}

const ExpandedUser: React.FC<ExpandedUserProps> = ({ name, onClickViewDetails }) => {
    return (
        <div className='expanded-conatiner'>
            <div className='text-container'>
                {name}
            </div>
            <button onClick={onClickViewDetails} className='button-style'>{'View Details'}</button>
        </div>
    );
};

export default ExpandedUser;
