import React from 'react';
import User from '../../models/user';
import "./TeacherHeader.css"
interface TeacherHeaderProps {
    name: string;
    className: string;
    image: string
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ name, className, image }) => {
    return (
        <div className='header'>
            <img
                className="teacher-img"
                src={image}
                alt=""
            />
            <div className='teacher-details'>
                <p className='teacher-name'>
                    {name}
                </p>
                <p className='class-name'>
                    {className}
                </p>
            </div>
        </div>
    );
};

export default TeacherHeader;
