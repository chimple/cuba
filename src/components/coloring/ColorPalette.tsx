import './ColorPalette.css';
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
  '#79D70F',
  '#66D9E8',
];

export default function ColorPalette({ selected, onSelect }: Props) {
  return (
    <div className="color-palette">
      {COLORS.map((c) => {
        const isSelected = selected === c;

        return (
          <button
            key={c}
            type="button"
            className={`color-palette-swatch ${isSelected ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => {
              Util.logEvent(EVENTS.PAINT_COLOR_TAP, {
                user_id: Util.getCurrentStudent()?.id ?? null,
                color: c,
                page_path: window.location.pathname,
              });
              onSelect(c);
            }}
          >
            <svg
              className="vector-top-left"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 40 24"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M8.56088 9.52018C10.2625 8.05783 13.2812 6.28412 19.3263 6.52152C23.14 6.67129 30.8368 6.5874 32.8873 6.54326C33.0013 6.52861 33.0617 6.52152 33.0617 6.52152C33.5948 6.52152 33.4655 6.53081 32.8873 6.54326C31.4966 6.72208 22.1305 8.02834 17.3064 11.3417C15.4657 12.606 13.6374 14.3368 12.0347 16.058C10.226 18.0005 6.59845 16.8529 6.50242 14.2004C6.44588 12.6386 7.37561 10.5388 8.56088 9.52018Z"
                fill="rgba(255, 255, 255, 0.30)"
              />
              <path
                d="M8.56088 9.52018C10.2625 8.05783 13.2812 6.28412 19.3263 6.52152C23.14 6.67129 30.8368 6.5874 32.8873 6.54326C33.0013 6.52861 33.0617 6.52152 33.0617 6.52152C33.5948 6.52152 33.4655 6.53081 32.8873 6.54326C31.4966 6.72208 22.1305 8.02834 17.3064 11.3417C15.4657 12.606 13.6374 14.3368 12.0347 16.058C10.226 18.0005 6.59845 16.8529 6.50242 14.2004C6.44588 12.6386 7.37561 10.5388 8.56088 9.52018Z"
                stroke="rgba(255, 255, 255, 0.30)"
                strokeWidth="1"
              />
            </svg>
            <svg
              className="vector-bottom-right"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 40 24"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M8.56088 9.52018C10.2625 8.05783 13.2812 6.28412 19.3263 6.52152C23.14 6.67129 30.8368 6.5874 32.8873 6.54326C33.0013 6.52861 33.0617 6.52152 33.0617 6.52152C33.5948 6.52152 33.4655 6.53081 32.8873 6.54326C31.4966 6.72208 22.1305 8.02834 17.3064 11.3417C15.4657 12.606 13.6374 14.3368 12.0347 16.058C10.226 18.0005 6.59845 16.8529 6.50242 14.2004C6.44588 12.6386 7.37561 10.5388 8.56088 9.52018Z"
                fill="rgba(255, 255, 255, 0.30)"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
