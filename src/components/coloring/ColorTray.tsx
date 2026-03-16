import './ColorTray.css';
import { Util } from '../../utility/util';
import { EVENTS } from '../../common/constants';

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

const COLORS = [
  '#FF2E88',
  '#0DB14B',
  '#FF4A1C',
  '#1AB7B5',
  '#FFD600',
  '#B066D1',
  '#66D9E8',
  '#79D70F',
];

export default function ColorTray({ selected, onSelect }: Props) {
  return (
    <div className="color-tray-div">
      {COLORS.map((c) => {
        const isSelected = selected === c;

        return (
          <button
            key={c}
            type="button"
            className={`color-tray-color-box ${isSelected ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => {
              Util.logEvent(EVENTS.PAINT_COLOR_TAP, {
                user_id: Util.getCurrentStudent()?.id ?? null,
                color: c,
                page_path: window.location.pathname,
              });
              onSelect(c);
            }}
          />
        );
      })}
    </div>
  );
}
