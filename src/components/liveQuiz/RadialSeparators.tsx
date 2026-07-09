import './RadialSeparators.css';
import type { CSSProperties } from 'react';

interface SeparatorProps {
  turns: number;
  style?: CSSProperties;
}

interface RadialSeparatorsProps {
  count: number;
  style?: CSSProperties;
}

function Separator(props: SeparatorProps) {
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

function RadialSeparators(props: RadialSeparatorsProps) {
  const turns = 1 / props.count;
  return (
    <>
      {Array.from({ length: props.count }, (_, index: number) => index).map(
        (index: number) => (
          <Separator key={index} turns={index * turns} style={props.style} />
        ),
      )}
    </>
  );
}

export default RadialSeparators;
