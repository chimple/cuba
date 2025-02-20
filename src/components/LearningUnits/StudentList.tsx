import React, {useState } from 'react';
import tincan from '../../tincan';
import './StudentData.css'

interface Statement {
  actor: {
    name: string;
  };
  // Add other properties of a statement if needed
}

interface StatementResult {
  statements: Statement[] | null;
  more: string | null;
}

const StudentList: React.FC = () => {
  const [statements, setStatements] = useState<Statement[]>([]);

  const getMydata = () => {
    tincan.queryStatements({
      callback: (err: Error | null, sr: StatementResult) => {
        if (err !== null) {
          console.log("Failed to query statements: " + err);
          // TODO: do something with error, didn't get statements
          return;
        }

        if (sr.statements !== null) {
          setStatements(sr.statements);
        }

        if (sr.more !== null) {
          // TODO: additional page(s) of statements should be fetched
          // setStatements(sr?.statements);
        }
        // TODO: do something with statements in sr.statements
      }
    });
  };


  return (
    <div className="student-container" style={{color: 'black'}}>
      <div className="student-grades">
            <h2>Student Grades</h2>
            <button onClick={getMydata}>Getdata</button>
            <ul>
              {statements.map((statement, index) => (
                <li key={index}>
                  {statement.actor.name}
                </li>
              ))}
            </ul>
          </div>
    </div>
    
  );
};

export default StudentList;