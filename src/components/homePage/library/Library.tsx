import React from 'react';
import './Library.css'
import { IonSearchbar } from '@ionic/react';
import ChapterIcon from './ChapterIcon';
const assignments = [
    { subject: 'English', grade: 'Grade1', icon: '📚' },
    { subject: 'Maths', grade: 'Grade1', icon: '➗' },
    { subject: 'Hindi', grade: 'Grade1', icon: '🔤' },
    { subject: 'Digital Skills', grade: 'Grade1', icon: '💻' },
    { subject: 'Kannada', grade: 'Grade1', icon: '🅰️' },
    { subject: 'English', grade: 'Grade2', icon: '📚' },
    { subject: 'Digital Skills', grade: 'Grade2', icon: '💻' },
    { subject: 'Kannada', grade: 'Grade2', icon: '🅰️' },
    { subject: 'English', grade: 'Grade2', icon: '📚' },
    { subject: 'Kannada', grade: 'Grade1', icon: '🅰️' },
    { subject: 'English', grade: 'Grade2', icon: '📚' },
    { subject: 'Digital Skills', grade: 'Grade2', icon: '💻' },
    { subject: 'Kannada', grade: 'Grade2', icon: '🅰️' },
    { subject: 'English', grade: 'Grade2', icon: '📚' },
  ];
const Library: React.FC = ({ }) => {
    return (
        <div className="library-container">
         <div className="search-bar">
        <IonSearchbar
          showClearButton="focus"
          color="light"
          inputMode="search"
          placeholder='Search assignments...'
          onIonClear={() => {}}
          onIonInput={(ev) => {}}
          onKeyDown={(ev) => {}}
          debounce={1000}
          value={''}
          animated={true}
        />
      </div>
        <div className="course-grid">
          {assignments.map((assignment, index) => (
            <ChapterIcon/>
            // <div className="assignment-item" key={index}>
            //   <div className="assignment-icon">{assignment.icon}</div>
            //   <div className="assignment-text">
            //     <div>{assignment.subject}</div>
            //     <div>{assignment.grade}</div>
            //   </div>
            // </div>
          ))}
        </div>
      </div>
    );
};

export default Library;
