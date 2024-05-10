import React, { useState } from 'react';
import { AppBar } from '@mui/material';
import BackButton from '../../components/common/BackButton';
import "./TeachersStudentDisplay.css"
import { USERTYPES } from '../../common/constants';
import TeacherHeader from '../../components/TeachersStudentDisplay/TeacherHeader';
import ClassTabs from '../../components/TeachersStudentDisplay/ClassTabs';
import CircularButton from '../../components/CircularButton';
import UserImageWithName from '../../components/UserImageWithName';
import User from '../../models/user';
interface TeachersStudentDisplayProps {

}
const TeachersStudentDisplay: React.FC<TeachersStudentDisplayProps> = () => {
    const [tabIndex, setTabIndex] = useState(USERTYPES.TEACHERS);
    const [users, setUsers] = useState<User[]>([]);
    const onTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };
    return (
        <div className='container'>
            <AppBar
                position="static"
                sx={{
                    flexDirection: "inherit",
                    justifyContent: "space-evenly",
                    padding: "2vh 3vw 2vh 3vw",
                    backgroundColor: "#FFFBEC",
                    height: '10vh'
                }}
            >

                <div className="back-button">
                    <BackButton onClicked={() => { }} />
                </div>

                <TeacherHeader name={''} className={''} image={''} />
            </AppBar>

            <ClassTabs userType={tabIndex} onChange={onTabChange} />
            <div className="all-users-display">
                {users.map((user) => (
                    <UserImageWithName userDocId={user.docId} userName={user.name} userImgPath={'assets/avatars/armydog.png'} />
                ))}
            </div>
            <div className='vertical-line-container'>
                <div className="vertical-line"></div>
            </div>
            <div className='user-action-buttons'>
                <CircularButton isAddAction={true} onClick={() => {

                }} />
                <CircularButton isAddAction={false} onClick={() => {

                }} />

            </div>
        </div>
    )
};

export default TeachersStudentDisplay;
