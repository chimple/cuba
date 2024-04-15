import _ from "lodash";
import "./RadialSeparators.css";
import { FC } from "react";

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
const RadialSeparators: FC<{ count: number; style?: any }> = (props) => {
  const turns = 1 / props.count;
  return (
    <div>
      {_.range(props.count).map((index) => (
        <Separator key={index} turns={index * turns} style={props.style} />
      ))}
    </div>
  );
};

export default RadialSeparators;
