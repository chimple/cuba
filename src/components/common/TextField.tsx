import "../common/TextField.css";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";

const TextField: React.FC<{
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onEnterDown: Function;
}> = ({ onChange, value, onEnterDown }) => {
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef(null);
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", (info) => {
      console.log("info", JSON.stringify(info));
      setIsInputFocus(true);

      setTimeout(() => {
        //@ts-ignore
        scollToRef.current?.scrollIntoView({ block: "end" });
      }, 50);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      setIsInputFocus(false);
    });
  }, []);
  return (
    <div>
      <input
        className={"text-box "}
        type="text"
        value={value}
        ref={scollToRef}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnterDown();
          }
        }}
      ></input>
      {isInputFocus ? <div ref={scollToRef} id="scrolling"></div> : null}
    </div>
  );
};
export default TextField;
