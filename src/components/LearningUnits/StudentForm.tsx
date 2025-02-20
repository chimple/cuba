import React, { useState, FormEvent } from 'react';
import tincan from '../../tincan';
import TinCan from 'tincanjs';
import './StudentData.css'
import { useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";

// Define types for the TinCan statement and related objects
interface Actor {
  mbox: string;
  name: string;
}

interface Verb {
  id: string;
}

interface TinCanObject {
  objectType: string;
  name: string;
  mbox: string;
  lesson: string;
}

interface Target {
  id: string;
}

interface Context {
  registration: string;
}

interface Result {
  completion: boolean;
  success: boolean;
  score: {
    scaled: string;
  };
}

interface TinCanStatement {
  actor: Actor;
  verb: Verb;
  object: TinCanObject;
  target: Target;
  context: Context;
  result: Result;
}

const StudentForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [lesson, setLesson] = useState<string>('');
  const history = useHistory();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const statement = new TinCan.Statement({
      actor: {
        mbox: "mailto:info@tincanapi.com",
        name: name,
      },
      verb: { id: `http://adlnet.gov/expapi/verbs/experienced` },
      object: {
        objectType: "Agent",
        name: name,
        mbox: "mailto:mike.rustici@scorm.com",
        lesson: lesson,
      },
      target: {
        id: "http://rusticisoftware.github.com/TinCanJS",
      },
      context: {
        registration: "760e3480-ba55-4991-94b0-01820dbd23a2",
      },
      result: {
        completion: true,
        success: true,
        score: {
          scaled: 0.8,
        },
      },
    });

    console.log("Lrs======", tincan);

    try {
      await tincan.saveStatement(statement, {
        callback: function (err: Error | null, xhr: XMLHttpRequest | null) {
          if (err !== null) {
            if (xhr !== null) {
              console.log("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
              return;
            }
            console.log("Failed to save statement: " + err);
            return;
          }
          history.replace(PAGES.STUDENT_LIST);
          console.log("Statement saved");
        },
      });

      setName('');
      setGrade('');
      setLesson('');
      return true;
    } catch (error) {
      console.error("xAPI Error:", error);
      return false;
    }
  };

  return (
    <>
    <div className="student-container">
    <div className="student-header">
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Student Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Grade"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      />
      <input
        type="text"
        placeholder="Lesson"
        value={lesson}
        onChange={(e) => setLesson(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
      </div>
    </div>
    </>
    
  );
};

export default StudentForm;