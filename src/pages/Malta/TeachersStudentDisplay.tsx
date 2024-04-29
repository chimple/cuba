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
            <div className="back-button">
                <BackButton onClicked={() => { }} />
            </div>
            <AppBar
                position="static"
                sx={{
                    flexDirection: "inherit",
                    justifyContent: "space-evenly",
                    padding: "0vh 1vw 1vh 1vw",
                    backgroundColor: "#FFFBEC",
                }}
            >
                <TeacherHeader name={'Mr Jyothi'} className={'1st standard'} image={'https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/2023-04-24%2013%3A45%3A46.114687?alt=media&token=ede2e11a-f37c-44df-b6f9-3396f8ca55ef'} />
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
