import "../common/TextField.css";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";

const TextField: React.FC<{
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onEnterDown: Function;
}> = ({ onChange, value, onEnterDown }) => {
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        console.log("info", JSON.stringify(info));
        setIsInputFocus(true);
        setTimeout(() => {
          scollToRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }, 50);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setIsInputFocus(false);
      });
    }
  }, []);
  return (
    <div>
      <input
        className={"text-box "}
        type="text"
        value={value}
        onFocus={() => setIsEditing(true)}   // Set editing state to true on focus
        onBlur={() => setIsEditing(false)}
        // ref={scollToRef}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnterDown();
          }
        }}
        style={{
          border: isEditing ? "4px solid #58CD99" : "2px solid black", // Conditional border color
        }}
      ></input>
      {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
    </div>
  );
};
export default TextField;
