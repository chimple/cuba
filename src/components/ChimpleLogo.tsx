import "./ChimpleLogo.css";
const ChimpleLogo: React.FC<{ header: string; msg: string }> = ({
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
      <div id="logo-msg">{msg}</div>
    </div>
  );
};
export default ChimpleLogo;
