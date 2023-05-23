import "../common/TextField.css";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { BsAlignCenter, BsAlignStart } from "react-icons/bs";
import { alarmOutline } from "ionicons/icons";

const TextField: React.FC<{
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onEnterDown: Function;
}> = ({ onChange, value, onEnterDown }) => {
  const [isInputFocus, setIsInputFocus] = useState(false);
  const [keySize, setKeyboard] = useState(0);
  const scollToRef = useRef(null);
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", (info) => {
      console.log("info", JSON.stringify(info));
      setKeyboard(info.keyboardHeight);
      setIsInputFocus(true);
      //

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
        // style={{
        //   marginTop: "12%",
        // }}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnterDown();
          }
        }}
        onClick={() => {
          // setIsInputFocus(!isInputFocus);
          // setTimeout(() => {
          //   //@ts-ignore
          //   scollToRef.current?.scrollIntoView({ block: "end" });
          // }, 500);
        }}
      ></input>
      {isInputFocus ? <div ref={scollToRef} id="blur"></div> : null}
    </div>
  );
};
export default TextField;
