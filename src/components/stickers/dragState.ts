export type StickerId = "butterfly" | "snail";

export const dragState: {
  dragging: null | "snail" | "butterfly";
  offsetX: number;
  offsetY: number;
} = {
  dragging: null,
  offsetX: 0,
  offsetY: 0,
};
