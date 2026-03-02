import { ReactComponent as LayoutSvg } from "../../assets/images/BWUnfilled.svg";

type Props = {
  svgId: string;
};

export default function ColoringCanvas({ svgId }: Props) {
  return (
    <div className="svg-frame">
      <LayoutSvg id={svgId} />
    </div>
  );
}