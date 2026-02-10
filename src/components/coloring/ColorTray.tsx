type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

const COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#B983FF",
  "#FF8FAB",
  "#00C2A8",
  "#FF9F1C",
];

export default function ColorTray({ selected, onSelect }: Props) {
  return (
    <div style={trayStyle}>
      {COLORS.map((c) => (
        <div
          key={c}
          onClick={() => onSelect(c)}
          style={{
            ...colorStyle,
            background: c,
            border: selected === c ? "3px solid black" : "2px solid #ddd",
          }}
        />
      ))}
    </div>
  );
}

const trayStyle: React.CSSProperties = {
  position: "absolute",
  right: 20,
  top: 50,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: "white",
  padding: 10,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

const colorStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  cursor: "pointer",
};
