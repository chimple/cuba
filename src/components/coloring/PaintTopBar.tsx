import closeIcon from "../../assets/images/close.png";
import cameraIcon from "../../assets/images/tick.png";

type Props = {
  onExit: () => void;
}
export default function PaintTopBar({ onExit }: Props) {
  return (
    <div className="paint-topbar">
      <button className="exit-btn" onClick={onExit}>
        <img src={closeIcon} alt="close" />
      </button>
    </div>
  );
}