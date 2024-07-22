import _ from "lodash";
import "./RadialSeparators.css";

function Separator(props) {
  return (
    <div
      className="radial-separator"
      style={{
        transform: `rotate(${props.turns}turn)`,
      }}
    >
      <div className="radial-separator-child" />
    </div>
  );
}

function RadialSeparators(props) {
  const turns = 1 / props.count;
  return (
    <>
      {_.range(props.count).map((index) => (
        <Separator key={index} turns={index * turns} style={props.style} />
      ))}
    </>
  );
}

export default RadialSeparators;
