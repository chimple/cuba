import closeIcon from "../../assets/images/close.png";

type Props = {
  onExit: () => void;
  onSave: () => void;
};

export default function PaintTopBar({ onExit, onSave }: Props) {
  return (
    <>
      <button className="exit-btn" onClick={onExit}>
        <img src={closeIcon} alt="close" width={40} />
      </button>

      <button className="save-btn" onClick={onSave}>
        Save
      </button>
    </>
  );
}