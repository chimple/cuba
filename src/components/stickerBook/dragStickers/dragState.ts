export type StickerId =
  | "snail"
  | "butterfly"
  | "ant"
  | "beetle"
  | "fly"
  | "flea";

export const dragState: {
  dragging: StickerId | null;
  offsetX: number;
  offsetY: number;
} = {
  dragging: null,
  offsetX: 0,
  offsetY: 0,
};
