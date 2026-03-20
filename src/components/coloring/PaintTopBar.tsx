import { t } from 'i18next';
// Changes: localized close icon alt text.

type Props = {
  onExit: () => void;
};
export default function PaintTopBar({ onExit }: Props) {
  return (
    <div className="paint-topbar">
      <button className="exit-btn" onClick={onExit}>
        <img src="/assets/icons/PaintExitIcon.svg" alt={t('Close') || ''} />
      </button>
    </div>
  );
}
