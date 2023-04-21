import "./ChimpleLogo.css";
const ChimpleLogo: React.FC<{ header: string; msg: string | string[] }> = ({
  header,
  msg,
}) => {
  return (
    <div id="logo-header">
      <img
        id="chimple-logo"
        alt="assets/icons/ChimpleBrandLogo.svg"
        src="assets/icons/ChimpleBrandLogo.svg"
      />
      <div id="logo-heading">{header}</div>
      {typeof msg === "string" ? (
        <div id="logo-msg">{msg}</div>
      ) : (
        msg.map((value) => (
          <div key={value} id="logo-msg">
            {value}
          </div>
        ))
      )}
      {/* <div id="logo-msg">{msg}</div> */}
    </div>
  );
};
export default ChimpleLogo;
